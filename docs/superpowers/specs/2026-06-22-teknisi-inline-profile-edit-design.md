# Inline Profile Edit on Public Teknisi Page — Design Spec

**Tanggal**: 2026-06-22  
**Status**: Implemented  

---

## Ringkasan

Edit profil teknisi dipindah dari `/teknisi/settings` (tab Profil/Jadwal/Portfolio/Sertifikasi) ke **halaman profil publik** (`/teknisi/[id]?tab=profil`) dengan pola LinkedIn: ikon pensil per section → popup modal.

`/teknisi/settings` hanya menyisakan **Pengaturan** (keamanan, notifikasi, Telegram).

## Section & popup

| Section | Popup |
|---------|-------|
| Hero | Identitas, foto, cover, tagline, harga |
| Tentang Teknisi | Bio, ringkasan profesional, cakupan |
| Skills | Tag keahlian |
| Layanan Konsultasi | Paket + inspeksi |
| Portofolio | CRUD kasus |
| Jadwal | Jam ketersediaan |
| Sertifikasi | CRUD sertifikat |

## Visibilitas kosong

- **Owner**: section kosong tetap tampil + placeholder + pensil
- **Pengunjung**: section kosong disembunyikan

## Redirect

- `/teknisi/settings?tab=*` (legacy) → profil publik + `?edit=`
- `/teknisi/profil` → `/teknisi/[ownId]?tab=profil`
- Sidebar **Profil** → `/teknisi/profil`

## API

Tidak ada perubahan schema; reuse `PATCH /api/teknisi/profile`, portfolio, certifications.
