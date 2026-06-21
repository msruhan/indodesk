# Database Backup & Restore — Implementation Plan

**Goal:** Backup otomatis PostgreSQL + volume `uploads` ke R2, restore via SSH, admin dashboard untuk list/unduh/trigger backup manual.

**Reference:** `docs/superpowers/specs/2026-06-21-database-backup-restore-design.md`

**Architecture:** VPS shell scripts (source of truth) + R2 private bucket + manifest index; app hanya baca index & presign download; queue trigger via file flag di host.

**Tech Stack:** bash, `pg_dump`/`pg_restore`, Docker Compose, `@aws-sdk/client-s3` (existing R2 pattern), Prisma `BackupJob` (optional fase 1b), Next.js admin UI, `requestAdminStepUpCredentials`.

---

## Phase order

| Phase | Isi | Depends on |
|-------|-----|------------|
| **1** | VPS scripts + cron + deploy hook + runbook | R2 bucket (manual setup) |
| **2** | Lib backup R2 (list, presign) + env | Phase 1 manifest format |
| **3** | API admin backup | Phase 2 |
| **4** | UI `/admin/backup` + sidebar | Phase 3 |
| **5** | Trigger queue + activity log + tests | Phase 1–4 |

---

## Phase 1: VPS scripts & deploy integration

### Task 1.1 — R2 bucket (manual, VPS/bootstrap)

**Not in repo — operator checklist:**

- [ ] Buat bucket R2 `bantoo-backups` (private)
- [ ] Lifecycle: hapus prefix `daily/` > 14 hari, `manual/` > 30 hari (atau rely script prune)
- [ ] API token **write** untuk VPS (`backups/*` only)
- [ ] API token **read** untuk app (presign list/download)
- [ ] File `/opt/indoteknizi/.backup.env` (chmod 600, gitignored)

### Task 1.2 — `deploy/backup.sh`

**Files:**
- Create: `deploy/backup.sh`
- Create: `deploy/lib/backup-common.sh` (shared: R2 upload, sha256, logging)

**Behavior:**
- Args: `--type daily|manual`, optional `--tag pre-deploy|pre-migration|admin-trigger|pre-restore`
- `pg_dump -Fc` via `docker compose exec -T postgres`
- `uploads.tar.gz` via temp container mounting `indoteknizi_uploads`
- Upload to `backups/{type}/{id}/`
- Write `manifest.json`, merge into `backups/index.json`
- Prune by retention
- Exit 1 on any failure

**Checklist:**
- [ ] Script idempotent-safe (no partial index on failure)
- [ ] Log to stdout (captured by cron)
- [ ] `chmod +x`

### Task 1.3 — `deploy/restore.sh`

**Files:**
- Create: `deploy/restore.sh`

**Behavior:**
- Args: `--backup-id`, `--dry-run`, `--confirm`
- Pre-restore manual backup (`--tag pre-restore`)
- Stop app → restore DB → extract uploads → start app
- Health check `curl` PRODUCTION_HEALTH_URL

**Checklist:**
- [ ] `--dry-run` validates manifest + download only
- [ ] Interactive guard without `--confirm`

### Task 1.4 — `deploy/backup-cron.sh`

**Files:**
- Create: `deploy/backup-cron.sh`

**Behavior:**
- Subcommand `daily` → `backup.sh --type daily`
- Subcommand `poll-queue` → if `/opt/indoteknizi/backups/.pending` exists, run manual backup, clear flag, write result to `.last-job.json`

**Checklist:**
- [ ] Crontab example in runbook

### Task 1.5 — Integrate `vps-deploy.sh`

**Files:**
- Modify: `deploy/vps-deploy.sh`

**Before** `prisma migrate deploy`:
```bash
if [[ "${SKIP_BACKUP:-}" != "1" ]]; then
  bash deploy/backup.sh --type manual --tag pre-deploy || exit 1
fi
```

**Checklist:**
- [ ] Document `SKIP_BACKUP=1` emergency escape in runbook

### Task 1.6 — Runbook

**Files:**
- Create: `docs/deploy/DATABASE-BACKUP.md`

**Sections:**
- Prerequisites & secrets
- Manual backup / restore commands
- Cron install
- First restore drill
- Troubleshooting (disk full, R2 creds, pg_restore errors)

**Checklist:**
- [ ] Link from admin UI restore notice panel

---

## Phase 2: App lib (R2 backup index)

### Task 2.1 — Env vars

**Files:**
- Modify: `deploy/env.production.template` (document app read keys only)
- Modify: `.env.local.example` (dev stubs)

```env
BACKUP_R2_BUCKET=bantoo-backups
BACKUP_R2_ACCOUNT_ID=
BACKUP_R2_ACCESS_KEY_ID=
BACKUP_R2_SECRET_ACCESS_KEY=
BACKUP_R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
```

**Checklist:**
- [ ] Separate from `R2_BUCKET_NAME` (public uploads)

### Task 2.2 — `src/lib/backup/r2-backup-client.ts`

**Files:**
- Create: `src/lib/backup/r2-backup-client.ts`
- Reuse pattern from `src/lib/r2-storage.ts`

**Exports:**
- `isBackupStorageConfigured(): boolean`
- `fetchBackupIndex(): Promise<BackupManifestSummary[]>`
- `getPresignedBackupDownloadUrl(backupId, artifact: 'database' | 'uploads'): Promise<{ url, expiresAt }>`

**Checklist:**
- [ ] Cache index 60s in memory (module-level)
- [ ] Parse `backups/index.json`

### Task 2.3 — Types

**Files:**
- Create: `src/lib/backup/backup-types.ts`

**Checklist:**
- [ ] Mirror manifest JSON shape from spec

### Task 2.4 — Unit tests

**Files:**
- Create: `src/lib/backup/backup-types.test.ts` (parse manifest fixtures)

---

## Phase 3: API admin

### Task 3.1 — List backups

**Files:**
- Create: `src/app/api/admin/backup/route.ts`

**GET** — `requireApiRole(['ADMIN'])`
- Returns `{ items, lastBackup, stats: { dailyCount, manualCount } }`

### Task 3.2 — Trigger backup

**Files:**
- Create: `src/app/api/admin/backup/trigger/route.ts`

**POST** — Admin + step-up (`requestAdminStepUpCredentials` pattern)
- Rate limit: 1/hour per admin (reuse rate-limit-store)
- Writes `/opt/indoteknizi/backups/.pending` — **Problem:** app container cannot write host path

**Resolution (fase 1):** API writes queue file into **shared Docker volume** mounted at `/app/backups-queue` on app and `/opt/indoteknizi/backups-queue` on host cron.

**Files also:**
- Modify: `docker-compose.production.yml` — add bind mount `./backups-queue:/app/backups-queue` on app service

**POST body:** step-up creds  
**Response:** `{ queued: true, requestedAt }`

### Task 3.3 — Download presigned

**Files:**
- Create: `src/app/api/admin/backup/[id]/download/route.ts`

**GET** query: `artifact=database|uploads`  
**Auth:** Admin + step-up  
**Response:** `{ url, expiresAt }`  
**Activity log:** `admin.backup.download.{artifact}`

### Task 3.4 — Job status (optional)

**Files:**
- Create: `src/app/api/admin/backup/status/route.ts`

Read host `.last-job.json` via shared volume — last manual job result for UI polling.

---

## Phase 4: Admin UI

### Task 4.1 — Page

**Files:**
- Create: `src/app/admin/backup/page.tsx`
- Create: `src/components/admin/admin-backup-view.tsx`

**UI (match spec):**
- Status card (last backup)
- Button Backup sekarang → step-up modal → POST trigger → poll status
- Table with download buttons → step-up → open presigned URL
- Amber restore notice + link runbook

**Checklist:**
- [ ] Loading / empty / error states
- [ ] Disable trigger while pending (poll every 5s)

### Task 4.2 — Sidebar

**Files:**
- Modify: `src/components/dashboard/admin-sidebar.tsx`

Add under **Sistem**:
```ts
{ icon: Database, label: 'Backup Database', href: '/admin/backup' }
```

Use existing icon or `Download` / `Shield`.

---

## Phase 5: Polish & verification

### Task 5.1 — Activity log from scripts (optional)

**Files:**
- Modify: `deploy/backup.sh` — POST internal webhook or append to log file consumed by admin

Minimal fase 1: script echoes to syslog; admin reads R2 index only.

### Task 5.2 — Prisma BackupJob (fase 1b, optional)

Defer if file queue + `.last-job.json` sufficient. If added later:
- Schema `BackupJob` per spec
- API trigger writes DB row; cron updates status

### Task 5.3 — Tests

- [ ] `backup-types.test.ts` manifest parsing
- [ ] API route tests with mocked R2 client (list + presign)
- [ ] Manual staging: full backup → list in UI → download

### Task 5.4 — Spec status

**Files:**
- Modify: `docs/superpowers/specs/2026-06-21-database-backup-restore-design.md` → **Status: Approved**

### Task 5.5 — Production rollout

- [ ] Deploy scripts via tag
- [ ] Install crontab on VPS
- [ ] Create `.backup.env`
- [ ] First manual backup + verify admin UI
- [ ] Restore drill on staging (document date)

---

## Implementation notes

### Shared volume for queue

```yaml
# docker-compose.production.yml (app service)
volumes:
  - uploads:/app/public/uploads
  - ./backups-queue:/app/backups-queue
```

Host cron:
```bash
*/5 * * * * cd /opt/indoteknizi && bash deploy/backup-cron.sh poll-queue
0 3 * * * cd /opt/indoteknizi && bash deploy/backup-cron.sh daily
```

### Security reminders

- Never expose restore endpoints
- Presigned URLs 15 min TTL
- Step-up required for trigger + download (same as SMTP / feature flags)
- VPS write credentials never in app env

### Estimated effort

| Phase | Estimate |
|-------|----------|
| 1 VPS scripts | 4–6 h |
| 2 Lib | 2 h |
| 3 API | 2–3 h |
| 4 UI | 2–3 h |
| 5 QA + rollout | 2 h |

**Total:** ~1.5–2 days

---

## First implementation PR scope (recommended)

Ship **Phase 1 + 2 + 3 (list/download only) + 4 read-only UI** first.  
Add **trigger button** after shared volume verified on VPS (Phase 3.2 + 4 trigger).

This allows immediate value (visibility + export) before wiring queue.
