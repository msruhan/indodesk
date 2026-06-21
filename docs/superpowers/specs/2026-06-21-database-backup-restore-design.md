# Database Backup & Restore — Design Spec

**Tanggal**: 2026-06-21  
**Status**: Approved  
**Relates to**: `docs/deploy/CI-CD.md`, `docker-compose.production.yml`, `docs/security-hardening/PRODUCTION-READINESS.md`

---

## 1. Tujuan

Menyediakan mekanisme **backup dan restore** untuk production Bantoo dengan prioritas:

1. **B — Rollback operasional** — recovery setelah kesalahan human, migration gagal, atau deploy bermasalah.
2. **C — Export / arsip** — unduh backup untuk audit, dokumentasi, atau migrasi environment.

**Restore penuh hanya via VPS/SSH**, bukan lewat website. Admin dashboard untuk **visibility, export, dan trigger backup manual**.

---

## 2. Keputusan bisnis

| Topik | Keputusan |
|-------|-----------|
| Skenario utama | B (rollback operasional), lalu C (export/arsip) |
| Siapa restore | Operator teknis via SSH/VPS saja |
| Admin dashboard | List backup, unduh, backup sekarang — **tanpa** tombol restore |
| Cakupan backup | PostgreSQL + volume Docker `uploads` |
| R2 media privat (inspeksi) | Out of scope fase 1 — lifecycle bucket terpisah |
| Retensi daily | 14 hari (cron 03:00 WIB) |
| Retensi manual | 30 hari (pre-deploy, pre-migration, tombol admin) |
| Storage offsite | R2 private bucket `bantoo-backups` |
| Enkripsi backup | Opsional fase 1 — `BACKUP_ENCRYPTION_KEY` di VPS host only |
| Deploy gagal jika backup gagal | Ya — kecuali flag darurat `--skip-backup` di script |

---

## 3. Arsitektur

```
VPS (/opt/indoteknizi)
  deploy/backup.sh          → pg_dump + tar uploads → upload R2
  deploy/restore.sh       → download R2 → restore (SSH only)
  deploy/backup-cron.sh   → daily + poll manual queue
  crontab                   → 03:00 daily

  vps-deploy.sh             → backup manual pre-deploy (abort if fail)

R2 (private)
  backups/daily/{timestamp}/
  backups/manual/{timestamp}/
    database.sql.gz
    uploads.tar.gz
    manifest.json

App (Next.js)
  POST /api/admin/backup/trigger   → enqueue BackupJob
  GET  /api/admin/backup           → list dari R2 manifest index
  GET  /api/admin/backup/[id]/download → presigned URL (2FA required)

Admin UI
  /admin/backup                    → status, tabel, unduh, backup sekarang
```

### Manifest (`manifest.json`)

```json
{
  "id": "2026-06-21T03-00-00Z",
  "type": "daily | manual",
  "tag": "pre-deploy | pre-migration | admin-trigger | null",
  "createdAt": "2026-06-21T03:00:05.000Z",
  "database": { "key": "...", "sizeBytes": 12582912, "sha256": "..." },
  "uploads": { "key": "...", "sizeBytes": 47185920, "sha256": "..." },
  "status": "success | failed",
  "host": "production"
}
```

Index agregat: `backups/index.json` (array manifest ringkas, di-update setiap backup sukses).

---

## 4. Schema (app)

```prisma
model BackupJob {
  id          String         @id @default(cuid())
  type        BackupJobType  @default(MANUAL)
  status      BackupJobStatus @default(PENDING)
  requestedBy String
  backupId    String?        // manifest id setelah sukses
  error       String?        @db.Text
  createdAt   DateTime       @default(now())
  startedAt   DateTime?
  completedAt DateTime?

  requester User @relation(fields: [requestedBy], references: [id], onDelete: Cascade)

  @@index([status, createdAt])
}

enum BackupJobType {
  MANUAL
}

enum BackupJobStatus {
  PENDING
  RUNNING
  SUCCESS
  FAILED
}
```

Cron VPS poll `BackupJob` dengan status `PENDING` (via `DATABASE_URL` host atau API internal — **prefer direct DB read** dari script host menggunakan `docker compose exec` + psql query, atau file queue di `/opt/indoteknizi/backups/.pending` ditulis API).

**Keputusan implementasi queue:** File flag `.pending` di volume host (fase 1, lebih sederhana) — API menulis file, cron poll membaca. Hindari app container menjalankan `docker exec`.

---

## 5. Keamanan

| Aksi | Auth | Catatan |
|------|------|---------|
| Cron backup | VPS credentials + R2 write-only key | Key tidak di app `.env.production` |
| Restore | SSH + interactive confirm | `restore.sh --date ... --confirm` |
| List backups | Admin session | |
| Download | Admin session + **2FA verified** | Presigned URL 15 menit |
| Trigger backup | Admin session + 2FA | Rate limit 1/hour |

Activity log events:

- `admin.backup.triggered`
- `admin.backup.download.database`
- `admin.backup.download.uploads`
- `admin.backup.daily.success` / `.failed` (via webhook atau script POST ke internal API opsional)

R2 IAM: write-only ke `backups/*` untuk VPS; read + presign untuk app (read-only key terbatas prefix).

---

## 6. Script VPS

### `deploy/backup.sh`

```bash
# Usage:
#   backup.sh --type daily|manual [--tag pre-deploy|pre-migration|admin-trigger]
```

Steps:

1. `docker compose exec -T postgres pg_dump -U indoteknizi -Fc indoteknizi` → `database.dump` (custom format) + gzip
2. `docker run --rm -v indoteknizi_uploads:/data -v $(pwd)/tmp:/out alpine tar czf /out/uploads.tar.gz -C /data .`
3. Compute SHA256
4. Upload ke R2 (`aws s3 cp` compatible atau rclone)
5. Write manifest + update `backups/index.json`
6. Prune objects older than retention (daily 14d, manual 30d)

Exit non-zero on failure.

### `deploy/restore.sh`

```bash
# Usage:
#   restore.sh --backup-id 2026-06-21T03-00-00Z [--dry-run] [--confirm]
```

Steps:

1. Unless `--confirm`, print plan and exit
2. **Pre-restore snapshot** — `backup.sh --type manual --tag pre-restore`
3. Stop app container
4. Download artifacts from R2
5. Drop/recreate DB or `pg_restore --clean`
6. Extract uploads volume
7. Start app + `curl health`
8. Log completion

### Integrasi `vps-deploy.sh`

Before `prisma migrate deploy`:

```bash
if [[ "${SKIP_BACKUP:-}" != "1" ]]; then
  bash deploy/backup.sh --type manual --tag pre-deploy || exit 1
fi
```

---

## 7. Admin UI (`/admin/backup`)

### Sections

1. **Status card** — backup terakhir, ukuran, success/fail
2. **Actions** — Backup sekarang (disabled while job pending), refresh
3. **Table** — tanggal, tipe, tag, ukuran DB, ukuran uploads, aksi unduh
4. **Restore notice** — panel amber: restore via SSH, link ke runbook

### Download actions

- Unduh database (`database.sql.gz`)
- Unduh uploads (`uploads.tar.gz`)

Presigned URL returned from API; browser opens new tab.

---

## 8. API

| Endpoint | Method | Auth | Response |
|----------|--------|------|----------|
| `/api/admin/backup` | GET | Admin | `{ items: ManifestSummary[], lastBackup, stats }` |
| `/api/admin/backup/trigger` | POST | Admin + 2FA | `{ jobId }` |
| `/api/admin/backup/jobs/[id]` | GET | Admin | job status |
| `/api/admin/backup/[id]/download` | GET | Admin + 2FA | `{ url, expiresAt, artifact: 'database' \| 'uploads' }` |

List reads `backups/index.json` from R2 (cached 60s in memory).

---

## 9. Environment (VPS host only)

```env
BACKUP_R2_BUCKET=bantoo-backups
BACKUP_R2_ACCOUNT_ID=...
BACKUP_R2_ACCESS_KEY_ID=...
BACKUP_R2_SECRET_ACCESS_KEY=...
BACKUP_ENCRYPTION_KEY=          # optional
BACKUP_RETENTION_DAILY_DAYS=14
BACKUP_RETENTION_MANUAL_DAYS=30
```

App container (read-only presign):

```env
BACKUP_R2_BUCKET=bantoo-backups
BACKUP_R2_READ_ACCESS_KEY_ID=...
BACKUP_R2_READ_SECRET_ACCESS_KEY=...
```

---

## 10. Error handling

| Failure | Behavior |
|---------|----------|
| Daily backup fails | Retry once after 30 min; Telegram alert optional |
| Pre-deploy backup fails | **Abort deploy** |
| Restore mid-failure | Pre-restore snapshot available; runbook documents rollback |
| Download expired | Client re-requests presigned URL |
| R2 unavailable | Backup fails loud; do not silently skip |

---

## 11. Testing

1. Staging: run `backup.sh --type manual`, verify R2 objects + manifest
2. Staging: `restore.sh --dry-run` then full restore to empty DB
3. Smoke: login, wallet balance, 1 marketplace order intact
4. Admin UI: list, trigger job, download with 2FA
5. Deploy dry-run: confirm pre-deploy backup invoked

---

## 12. Fase & out of scope

### Fase 1 (this spec)

- VPS scripts + cron + deploy hook
- R2 storage + manifest index
- Admin list / download / trigger
- Runbook `docs/deploy/DATABASE-BACKUP.md`

### Fase 2 (later)

- Restore via admin (emergency, multi-confirm + audit)
- Backup encryption at rest mandatory
- R2 private media bucket sync
- Offsite replication second region

---

## 13. Rollout checklist

- [ ] Create R2 bucket `bantoo-backups` + lifecycle rules
- [ ] Issue VPS write key + app read key
- [ ] Add secrets to VPS `/opt/indoteknizi/.backup.env` (not in git)
- [ ] Install crontab on VPS
- [ ] Deploy scripts via release tag
- [ ] Run first manual backup + verify admin UI
- [ ] Document restore drill in runbook

---

## 14. Open questions (resolved)

| Question | Resolution |
|----------|------------|
| VPS vs dashboard vs both | Both — VPS backup/restore, dashboard export |
| Restore operator | SSH only |
| Retention | Daily 14d, manual 30d |
| Scope | DB + uploads volume |
| Queue mechanism | File flag on VPS host (fase 1) |
