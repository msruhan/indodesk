# VPS Co-host: IndoTeknizi + Nexus Server

Runbook operasional untuk menjalankan **IndoTeknizi** dan **Nexus Server** di **satu VPS**, termasuk skenario **hapus Nexus → reinstall via Hermes/NexusPortal** tanpa merusak data IndoTeknizi.

## VPS Anda (13.140.135.88)

State saat ini (`docker ps`):

| Container | Image | Port |
|-----------|-------|------|
| `nexus-server-caddy-1` | caddy:2-alpine | **80, 443** |
| `nexus-server-app-1` | nexus-server:0.1.21 | internal 3000 |
| `nexus-server-postgres-1` | postgres:16-alpine | internal |

Network Docker: **`nexus-server_default`**

### Deploy cepat (dari laptop)

```bash
cd indoteknizi

# 1. Build + upload image ke VPS (~5–10 menit)
bash deploy/ship-to-vps.sh root@13.140.135.88
```

Di VPS (SSH):

```bash
# 2. Edit env production
nano /opt/indoteknizi/.env.production
# Wajib isi: NEXT_PUBLIC_APP_URL, AUTH_URL, UPSTASH_REDIS_REST_*, R2_*

# 3. Start stack + migrate + merge Caddy
cd /opt/indoteknizi
sudo bash deploy/vps-install.sh --load-image image.tar --start --domain indoteknizi.com
```

Cek Nexus domain dulu (untuk referensi Caddy):

```bash
cat /opt/nexus-server/deploy/Caddyfile
```

Verifikasi:

```bash
curl -fsS https://indoteknizi.com/api/health
docker ps | grep indoteknizi
```

---

```text
Internet :443/:80
        │
        ▼
┌───────────────────────────────┐
│  Caddy (stack Nexus)          │  /opt/nexus-server
│  - nexus.customer.com → app   │
│  - indoteknizi.com → itz-app  │
└───────────────┬───────────────┘
                │ Docker network: nexus-server_default
    ┌───────────┴───────────┐
    ▼                       ▼
 Nexus app:3000      IndoTeknizi app:3000
 (postgres nexus)    (postgres indoteknizi)
```

**Prinsip:**

| Komponen | Port publik | Install dir |
|----------|-------------|-------------|
| Nexus (Hermes) | 80, 443 via Caddy | `/opt/nexus-server` |
| IndoTeknizi | **Tidak** bind 80/443 | `/opt/indoteknizi` |

Hermes hanya menyentuh `/opt/nexus-server`. Stack IndoTeknizi **tidak dihapus** oleh pipeline Hermes.

---

## Bagian A — Deploy IndoTeknizi (pertama kali)

### A1. Build & push image ke GHCR

Di repo GitHub IndoTeknizi:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Workflow `.github/workflows/docker-publish.yml` akan push ke `ghcr.io/<owner>/indoteknizi:<tag>`.

Atau build manual di VPS:

```bash
cd /opt/indoteknizi
docker build -t indoteknizi:local .
```

### A2. Siapkan direktori di VPS

```bash
sudo mkdir -p /opt/indoteknizi
sudo chown "$USER:$USER" /opt/indoteknizi
cd /opt/indoteknizi
```

Salin file deploy:

- `docker-compose.production.yml`
- `.env.production` (dari `.env.example`, isi production — lihat `docs/security-hardening/PRODUCTION-READINESS.md`)

```bash
export POSTGRES_PASSWORD="$(openssl rand -hex 32)"
export INDOTEKNIZI_IMAGE="ghcr.io/YOUR_OWNER/indoteknizi:0.1.0"
# Opsional jika nama network Nexus berbeda:
# export NEXUS_PROXY_NETWORK="nexus-server_default"
```

Login GHCR jika image private:

```bash
echo "$GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GH_USER --password-stdin
```

### A3. Cek network Nexus

```bash
docker network ls | grep nexus
# Biasanya: nexus-server_default
```

Jika Nexus belum ada, deploy Nexus dulu (Hermes) **atau** buat network manual:

```bash
docker network create nexus-server_default
```

### A4. Start stack IndoTeknizi

```bash
cd /opt/indoteknizi
docker compose -f docker-compose.production.yml --env-file .env.production pull
docker compose -f docker-compose.production.yml --env-file .env.production up -d
```

### A5. Migrasi database (sekali)

```bash
docker compose -f docker-compose.production.yml --env-file .env.production \
  run --rm --no-deps app npm run db:setup:production
```

**Jangan** jalankan `npm run db:seed` di production — seed menghapus semua data dev.

### A6. Routing HTTPS (Caddy Nexus)

Edit `/opt/nexus-server/deploy/Caddyfile` — contoh lengkap: `deploy/Caddyfile.multisite.example`.

Atau pakai helper:

```bash
sudo bash /opt/indoteknizi/deploy/merge-caddy-indoteknizi.sh \
  --domain indoteknizi.com \
  --upstream indoteknizi-app-1:3000
```

Verifikasi nama container:

```bash
docker ps --format '{{.Names}}' | grep indoteknizi
```

### A7. Smoke test

```bash
curl -fsS https://indoteknizi.com/api/health
curl -fsS https://nexus.customer.com/api/health
```

Post-deploy sekali (di container app):

```bash
docker compose -f docker-compose.production.yml --env-file .env.production \
  exec app npm run secrets:encrypt
```

---

## Bagian B — Reinstall Nexus via Hermes (IndoTeknizi tetap jalan)

### Apa yang aman vs berisiko

| Aspek | Aman? |
|-------|-------|
| Database IndoTeknizi | ✅ Tidak disentuh Hermes |
| Volume uploads IndoTeknizi | ✅ Tidak disentuh |
| Container IndoTeknizi app/postgres | ✅ Tetap jalan (jika tidak Anda stop) |
| HTTPS IndoTeknizi | ⚠️ Bisa putus saat Caddy Nexus dihapus |
| Hermes sukses tanpa konflik port | ⚠️ Hanya jika tidak ada service lain di 80/443 |

### B1. Backup sebelum hapus Nexus

```bash
sudo cp /opt/nexus-server/deploy/Caddyfile /root/caddyfile.backup.$(date +%F)
sudo cp /opt/nexus-server/.env.production /root/nexus-env.backup.$(date +%F) 2>/dev/null || true
```

**Penting:** simpan isi block `indoteknizi.com { ... }` dari Caddyfile.

### B2. Pre-flight

```bash
docker ps
ss -tlnp | grep -E ':80|:443' || true
docker network inspect nexus-server_default --format '{{range .Containers}}{{.Name}} {{end}}'
```

Pastikan IndoTeknizi app + postgres masih `Up`.

### B3. Hapus stack Nexus

**Opsi A — reinstall Nexus, data Nexus lama dipertahankan:**

```bash
cd /opt/nexus-server
docker compose -f docker-compose.stack.yml -f docker-compose.caddy.yml down
```

**Opsi B — Nexus benar-benar fresh (hapus DB Nexus):**

```bash
cd /opt/nexus-server
docker compose -f docker-compose.stack.yml -f docker-compose.caddy.yml down -v
```

IndoTeknizi **tidak** ikut terhapus.

> Selama Caddy mati, IndoTeknizi tidak bisa diakses dari internet (kecuali Anda punya ingress lain).

### B4. Trigger install dari NexusPortal / Hermes

Lewat UI Portal seperti biasa. Hermes akan:

1. Menulis ulang `/opt/nexus-server/deploy/Caddyfile` — **hanya domain Nexus**
2. `docker compose up` postgres + app + caddy (bind 80/443)
3. `db:setup:production` untuk Nexus

### B5. Restore routing IndoTeknizi (wajib)

Setelah Hermes selesai:

```bash
sudo bash /opt/indoteknizi/deploy/merge-caddy-indoteknizi.sh \
  --domain indoteknizi.com \
  --upstream indoteknizi-app-1:3000
```

Atau merge manual ke `/opt/nexus-server/deploy/Caddyfile` lalu:

```bash
cd /opt/nexus-server
docker compose -f docker-compose.stack.yml -f docker-compose.caddy.yml restart caddy
```

### B6. Verifikasi akhir

```bash
curl -fsS https://nexus.customer.com/api/health
curl -fsS https://indoteknizi.com/api/health
docker ps
```

---

## Bagian C — Update IndoTeknizi (rolling)

```bash
cd /opt/indoteknizi
export INDOTEKNIZI_IMAGE="ghcr.io/YOUR_OWNER/indoteknizi:NEW_TAG"
docker compose -f docker-compose.production.yml --env-file .env.production pull app
docker compose -f docker-compose.production.yml --env-file .env.production up -d app
docker compose -f docker-compose.production.yml --env-file .env.production \
  run --rm --no-deps app npm run db:setup:production
```

Caddy **tidak** perlu diubah untuk update app IndoTeknizi.

---

## Bagian D — Troubleshooting

### Port 80/443 already allocated

```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}' | grep -E '80|443'
```

Stop service yang bentrok, atau jangan jalankan dua Caddy.

### Caddy tidak bisa reach IndoTeknizi

```bash
docker network inspect nexus-server_default
```

IndoTeknizi `app` harus ada di network yang sama dengan `caddy`. Cek `NEXUS_PROXY_NETWORK` di compose IndoTeknizi.

### `502` pada domain IndoTeknizi

1. `docker ps` — container `indoteknizi-app-1` healthy?
2. `curl http://indoteknizi-app-1:3000/api/health` dari dalam network (exec ke container caddy)
3. Nama upstream di Caddyfile harus match nama container

### Hermes gagal healthcheck Nexus

Biasanya DB Nexus belum siap — tunggu step 40 Hermes. IndoTeknizi tidak terpengaruh.

---

## Referensi file di repo

| File | Fungsi |
|------|--------|
| `Dockerfile` | Image production |
| `docker-compose.production.yml` | Stack app + postgres, join network Nexus |
| `deploy/Caddyfile.multisite.example` | Template routing multi-domain |
| `deploy/merge-caddy-indoteknizi.sh` | Tambah block IndoTeknizi setelah Hermes |
| `src/app/api/health/route.ts` | Health probe |
| `docs/security-hardening/PRODUCTION-READINESS.md` | Checklist env & keamanan |

## Nexus Hermes (referensi eksternal)

- Install dir default: `/opt/nexus-server`
- Pipeline: `nexus-server-live/scripts/provision/`
- Step 30 menulis Caddyfile single-domain — inilah alasan merge manual diperlukan untuk co-host.
