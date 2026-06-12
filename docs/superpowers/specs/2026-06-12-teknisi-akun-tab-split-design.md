# Split Tab Akun Teknisi (Profil · Jadwal · Portfolio) — Design Spec

**Tanggal**: 2026-06-12  
**Status**: Draft — menunggu review  
**Author**: Brainstorming session  

---

## 1. Tujuan

Memecah tab **Profil** di halaman `/teknisi/settings` (Akun Saya) yang saat ini terlalu panjang. Teknisi harus bisa mengelola **jadwal ketersediaan** dan **portfolio** tanpa scroll melalui seluruh form profil.

**Keputusan produk:** Inspeksi, keahlian, dan cakupan layanan **tetap di tab Profil** (opsi A — 4 tab utama).

**Keberhasilan:**
- Tab Profil ~40% lebih pendek (tanpa jadwal & portfolio).
- Jadwal dan portfolio punya tab sendiri dengan fokus jelas.
- Tidak ada regresi pada penyimpanan data profil/portfolio.

---

## 2. Struktur tab baru

| Tab | URL | Isi |
|-----|-----|-----|
| **Profil** | `/teknisi/settings` | Identitas, bio, ringkasan profesional, inspeksi, keahlian, cakupan + kartu statistik |
| **Jadwal** | `/teknisi/settings?tab=jadwal` | Jam ketersediaan konsultasi (`operatingHours`) |
| **Portfolio** | `/teknisi/settings?tab=portfolio` | Editor kasus portfolio |
| **Pengaturan** | `/teknisi/settings?tab=pengaturan` | Tidak berubah (keamanan, notifikasi, Telegram) |

**Urutan tab:** Profil → Jadwal → Portfolio → Pengaturan

**Ikon (dari `@/lib/icons`):**
- Profil: `UserCircle`
- Jadwal: `Clock`
- Portfolio: `Briefcase`
- Pengaturan: `Settings`

---

## 3. Pemetaan konten (dari `TeknisiProfileForm` saat ini)

### Tab Profil (tetap)

| Section | Field |
|---------|-------|
| Profil publik | Avatar, cover, nama, email, telepon, lokasi, pengalaman, respons, harga, tagline, deskripsi |
| Ringkasan profesional | `issuesHandled`, `brandFocus`, `workApproach` |
| Inspeksi | `InspectionServiceToggle` |
| Keahlian | `specialty` (tag list) |
| Cakupan | `serviceScope`, `languages` |
| Footer | Tombol **Simpan Perubahan** + **Batal** |

**Di bawah form (tetap di `TeknisiProfilTab`):**
- Satu kartu **Statistik & Badge** (gabungan kartu duplikat Statistik + Badge & Status saat ini).

### Tab Jadwal (baru)

- `OperatingHoursEditor` — judul: "Jam ketersediaan konsultasi"
- Hint: sama seperti sekarang (sidebar Availability profil publik)
- Tombol **Simpan Jadwal** — PATCH `/api/teknisi/profile` dengan `{ operatingHours }` saja
- State awal dari `useTeknisiProfile()`
- Toast/pesan sukses inline setelah simpan

### Tab Portfolio (baru)

- `PortfolioEditor` (dipindah dari form profil)
- Load via `GET /api/teknisi/portfolio` (logika existing)
- Auto-save per item (perilaku existing, tidak berubah)
- Tidak ada tombol Simpan global profil

---

## 4. Arsitektur komponen

```
teknisi-akun-view.tsx
├── TeknisiProfilTab      → TeknisiProfileCoreForm
├── TeknisiJadwalTab      → TeknisiProfileJadwalForm
├── TeknisiPortfolioTab   → TeknisiPortfolioSection
└── TeknisiPengaturanTab  (unchanged)
```

### Refactor file

| File | Aksi |
|------|------|
| `teknisi-profile-form.tsx` | Rename/split → `teknisi-profile-core-form.tsx` (hapus section jadwal & portfolio) |
| `teknisi-profile-jadwal-form.tsx` | **Baru** — operating hours + save |
| `teknisi-portfolio-section.tsx` | **Baru** — extract `PortfolioEditor`, `PortfolioImageField`, types terkait |
| `teknisi-akun-view.tsx` | Expand `TeknisiAkunTab`, routing `?tab=`, render 4 tab |

`TeknisiProfileForm` export lama dapat di-alias ke `TeknisiProfileCoreForm` sementara jika ada import lain (cek grep — saat ini hanya `teknisi-akun-view`).

### Shared data

Semua tab profil/jadwal memakai hook **`useTeknisiProfile`** di parent atau per-tab:
- **Rekomendasi:** lift `useTeknisiProfile` ke `TeknisiAkunView`, pass `profile` + `setProfile` ke child tabs — hindari fetch ganda saat pindah tab.

---

## 5. Navigasi & URL

```typescript
type TeknisiAkunTab = 'profil' | 'jadwal' | 'portfolio' | 'pengaturan'

// parse: searchParams.get('tab')
// default: 'profil'
```

`setTab` memanggil `router.replace` dengan query yang sesuai; `profil` tanpa query (URL bersih).

**Mobile:** Tab bar `inline-flex` dengan `overflow-x-auto` + `scrollbar-none` agar 4 tab tidak pecah layout di layar sempit.

---

## 6. Perilaku simpan

| Tab | Trigger | API |
|-----|---------|-----|
| Profil | Tombol Simpan | `PATCH /api/teknisi/profile` — semua field profil kecuali `operatingHours` tidak wajib dikirim jika tidak diubah (kirim full form state seperti sekarang) |
| Jadwal | Tombol Simpan Jadwal | `PATCH /api/teknisi/profile` — `{ operatingHours }` |
| Portfolio | Per-item blur/save | `POST/PATCH/DELETE /api/teknisi/portfolio` (existing) |

**Dirty state:** Terpisah per tab. Pindah tab tanpa simpan profil/jadwal = kehilangan edit (sama seperti perilaku form sekarang); tidak perlu unsaved-warning di MVP.

---

## 7. UI/UX detail

### Header halaman
Subtitle tetap: *"Kelola profil publik teknisi, keamanan login, dan preferensi notifikasi."*

### Tab Jadwal
- Card wrapper konsisten (`Card` + `CardHeader` "Jadwal Ketersediaan")
- Loading/error state sama pola `TeknisiProfilTab`

### Tab Portfolio
- Card wrapper: "Portfolio & Case Highlights"
- Deskripsi singkat (copy dari form lama)

### Kartu statistik (Profil)
Ganti grid 2 kolom duplikat menjadi **1 kartu**:

```
Statistik & Status
├── TeknisiTrustBadges (showCriteriaHint)
```

---

## 8. Out of scope

- Tab **Layanan** terpisah (inspeksi/keahlian tetap di Profil)
- Unsaved-changes modal antar tab
- Perubahan API schema atau field profil baru
- Halaman user/admin settings

---

## 9. Testing

### Manual
1. `/teknisi/settings` — tab Profil: simpan nama/tagline, verifikasi profil publik terupdate.
2. `?tab=jadwal` — ubah jam Senin, simpan, cek Availability di profil publik.
3. `?tab=portfolio` — tambah/edit/hapus kasus, cek profil publik.
4. `?tab=pengaturan` — tidak berubah.
5. Pindah antar tab — tidak error, data konsisten.
6. Mobile lebar sempit — tab bar scroll horizontal.

### Regression
- Iklan konsultasi (`/teknisi/iklan-konsultasi`) tidak terpengaruh.
- Upload avatar/cover di tab Profil tetap berfungsi.

---

## 10. Urutan implementasi

1. Extract `TeknisiPortfolioSection` dari `teknisi-profile-form.tsx`.
2. Buat `TeknisiProfileJadwalForm`.
3. Slim down profil form → `TeknisiProfileCoreForm`.
4. Update `teknisi-akun-view.tsx` — 4 tab, lift profile hook, merge statistik card.
5. Smoke test manual.

---

## 11. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| 4 tab penuh di mobile | Horizontal scroll pada tab bar |
| Refactor besar `teknisi-profile-form.tsx` | Extract bertahap, pertahankan types/helpers di file portfolio |
| Jadwal tersimpan tanpa field profil lain | PATCH partial sudah didukung API |
