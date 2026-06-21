# Database Backup & Restore (Production VPS)

Panduan operator untuk backup/restore Bantoo di `/opt/indoteknizi`.

## Prasyarat

1. **AWS CLI** di VPS: `apt install -y awscli` (atau `pip install awscli`)
2. **Python 3** (biasanya sudah terpasang)
3. Bucket R2 private **`bantoo-backups`**
4. File **`/opt/indoteknizi/.backup.env`** (chmod 600):

```env
BACKUP_R2_BUCKET=bantoo-backups
BACKUP_R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
BACKUP_R2_ACCESS_KEY_ID=...
BACKUP_R2_SECRET_ACCESS_KEY=...
BACKUP_RETENTION_DAILY_DAYS=14
BACKUP_RETENTION_MANUAL_DAYS=30
```

5. Variabel **read-only** di `.env.production` (app container):

```env
BACKUP_R2_BUCKET=bantoo-backups
BACKUP_R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
BACKUP_R2_READ_ACCESS_KEY_ID=...
BACKUP_R2_READ_SECRET_ACCESS_KEY=...
BACKUP_QUEUE_DIR=/app/backups-queue
```

## Backup manual

```bash
cd /opt/indoteknizi
bash deploy/backup.sh --type manual --tag manual-test
```

## Backup otomatis (cron)

```cron
0 3 * * * cd /opt/indoteknizi && bash deploy/backup-cron.sh daily >> /var/log/bantoo-backup.log 2>&1
*/5 * * * * cd /opt/indoteknizi && bash deploy/backup-cron.sh poll-queue >> /var/log/bantoo-backup.log 2>&1
```

## Pre-deploy backup

Setiap `deploy/vps-deploy.sh` menjalankan backup **pre-deploy** jika `.backup.env` ada.  
Gagal backup → deploy dibatalkan. Darurat:

```bash
SKIP_BACKUP=1 BANTOO_IMAGE=... bash deploy/vps-deploy.sh
```

## Restore (SSH only)

```bash
cd /opt/indoteknizi

# Validasi artefak
bash deploy/restore.sh --backup-id 2026-06-21T03-00-00Z --dry-run

# Restore (membuat pre-restore snapshot otomatis)
bash deploy/restore.sh --backup-id 2026-06-21T03-00-00Z --confirm
```

**Peringatan:** Restore menimpa database dan uploads production.

## Admin dashboard

- **List & unduh:** `/admin/backup` (presigned URL, step-up admin)
- **Backup sekarang:** menulis antrian → cron VPS memproses dalam ≤5 menit

## Struktur R2

```
backups/
  index.json
  daily/2026-06-21T03-00-00Z/
    database.dump.gz
    uploads.tar.gz
    manifest.json
  manual/...
```

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `aws: command not found` | Install awscli |
| Upload R2 gagal | Cek `.backup.env`, token IAM, endpoint |
| Index kosong di admin | Pastikan `backups/index.json` ada setelah backup pertama |
| Queue tidak jalan | Cek cron poll-queue, folder `backups-queue/` mount di app |
| pg_restore error | Pastikan app di-stop; cek log postgres |

## Out of scope

- Restore lewat website
- Backup bucket media R2 privat (inspeksi) — kelola via lifecycle R2 terpisah
