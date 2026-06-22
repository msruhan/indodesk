# CI/CD — Bantoo (GHCR + auto-deploy VPS)

Repo: [github.com/msruhan/bantoo](https://github.com/msruhan/bantoo)  
Image: `ghcr.io/msruhan/bantoo:<tag>`

## Alur release

```text
git tag v0.1.0 && git push bantoo v0.1.0
        │
        ▼
.github/workflows/release-deploy.yml  (repo msruhan/bantoo)
  1. build Docker image
  2. push ghcr.io/msruhan/bantoo:0.1.0 + :latest
  3. SSH ke VPS → deploy/vps-deploy.sh
```

> **Penting:** Push tag ke remote **`bantoo`** (`github.com/msruhan/bantoo`), bukan `origin`/`indodesk`.
> `GITHUB_TOKEN` hanya bisa publish `ghcr.io/msruhan/bantoo` dari workflow repo **bantoo**.

Manual tanpa tag:

GitHub → **Actions** → **Release & Deploy** → Run workflow (input tag + deploy).

## GitHub Secrets (wajib)

**Settings → Secrets and variables → Actions**

| Secret | Contoh | Fungsi |
|--------|--------|--------|
| `VPS_HOST` | `13.140.135.88` | IP/hostname VPS |
| `VPS_USER` | `root` | User SSH |
| `VPS_SSH_KEY` | isi private key | Deploy via SSH |
| `GHCR_READ_TOKEN` | PAT `read:packages` | `docker pull` di VPS (jika package private) |
| `PRODUCTION_HEALTH_URL` | `https://indoteknizi.com/api/health` | Opsional; default dari `.env.production` |

### Setup SSH deploy key

```bash
ssh-keygen -t ed25519 -C "github-bantoo-deploy" -f ~/.ssh/bantoo_deploy -N ""
cat ~/.ssh/bantoo_deploy.pub   # paste ke VPS /root/.ssh/authorized_keys
cat ~/.ssh/bantoo_deploy       # paste ke secret VPS_SSH_KEY
```

### GHCR read token (VPS pull)

GitHub → Settings → Developer settings → PAT → `read:packages`.

Di VPS bisa juga login sekali manual:

```bash
echo "$TOKEN" | docker login ghcr.io -u msruhan --password-stdin
```

## Bootstrap VPS (sekali)

Sebelum CI/CD pertama jalan, VPS harus punya:

```text
/opt/indoteknizi/
  docker-compose.production.yml
  .env.production          # secrets production
  deploy/vps-deploy.sh
  deploy/vps-install.sh
  deploy/merge-caddy-indoteknizi.sh
```

```bash
# Clone atau scp dari repo
git clone https://github.com/msruhan/bantoo.git /tmp/bantoo
sudo mkdir -p /opt/indoteknizi
sudo cp /tmp/bantoo/docker-compose.production.yml /opt/indoteknizi/
sudo cp -r /tmp/bantoo/deploy /opt/indoteknizi/
sudo cp /tmp/bantoo/deploy/env.production.template /opt/indoteknizi/.env.production
# edit .env.production

cd /opt/indoteknizi
sudo bash deploy/vps-install.sh --image ghcr.io/msruhan/bantoo:0.1.0 --start
```

Setelah bootstrap, setiap tag baru otomatis di-deploy workflow.

## Deploy manual di VPS

```bash
cd /opt/indoteknizi
BANTOO_IMAGE=ghcr.io/msruhan/bantoo:0.1.1 bash deploy/vps-deploy.sh
```

## Versioning

| Tag git | Image |
|---------|-------|
| `v0.1.0` | `ghcr.io/msruhan/bantoo:0.1.0` + `:latest` |
| `v1.2.3` | `ghcr.io/msruhan/bantoo:1.2.3` + `:latest` |

Gunakan [Semantic Versioning](https://semver.org/) untuk release production.

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Deploy job gagal SSH | Cek `VPS_SSH_KEY`, firewall port 22 |
| `pull` denied | Set `GHCR_READ_TOKEN` (PAT `read:packages`) atau buat package public |
| `write_package` denied | Tag harus di-push ke repo **bantoo**, bukan indodesk; image tetap `ghcr.io/msruhan/bantoo` |
| `vps-deploy.sh: not found` | Salin folder `deploy/` ke `/opt/indoteknizi` |
| Health check gagal | Cek Caddy routing + `merge-caddy-indoteknizi.sh` |
| Migrate gagal | Lihat log: `docker compose logs app` |

Lihat juga [VPS-COHOST-NEXUS.md](./VPS-COHOST-NEXUS.md).
