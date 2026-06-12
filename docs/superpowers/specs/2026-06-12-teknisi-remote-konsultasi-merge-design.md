# Merge Remote ke Konsultasi (Dashboard Teknisi) — Design Spec

**Tanggal**: 2026-06-12  
**Status**: Draft — menunggu review  
**Author**: Brainstorming session  
**Prasyarat**: [2026-06-12-konsultasi-remote-payment-design.md](./2026-06-12-konsultasi-remote-payment-design.md)

---

## 1. Tujuan

Menghapus menu **Remote** terpisah dari dashboard teknisi karena remote sudah menjadi bagian integral dari **konsultasi berbayar** (`requiresRemote`). Teknisi cukup membuka **Konsultasi** untuk mengelola semua sesi — termasuk yang membutuhkan IndoDesk.

**Keberhasilan** diukur dari:

- Tidak ada lagi entri navigasi "Remote" di sidebar / bottom nav teknisi.
- Info IndoDesk (ID, OTP, perangkat, OS) tersedia di halaman Konsultasi teknisi.
- Notifikasi permintaan baru mengarah ke Konsultasi, bukan `/teknisi/remote`.
- URL lama `/teknisi/remote` redirect ke `/teknisi/konsultasi` dengan pesan transisi.

---

## 2. Keputusan

| Topik | Keputusan |
|-------|-----------|
| Pendekatan | **B** — hapus menu + perkaya halaman Konsultasi |
| Sumber kebenaran teknisi | `KonsultasiSession` saja |
| `RemoteSession` legacy | **Tidak ditampilkan** di UI teknisi (abaikan untuk MVP) |
| Badge sidebar Konsultasi | `KonsultasiSession` status `PENDING` (sudah ada) |
| Badge `remoteWaiting` | Dihapus dari navigasi; tidak digabung terpisah |
| Halaman `/teknisi/remote` | Redirect permanen ke `/teknisi/konsultasi` |
| API `/api/teknisi/remote` | Tetap ada (admin/legacy) — tidak dipanggil dari UI teknisi baru |
| User `/user/remote` | **Out of scope** — cleanup terpisah |

---

## 3. Perubahan navigasi

### 3.1 Sidebar (`teknisi-sidebar.tsx`)

**Sebelum (LAYANAN):** Konsultasi · Inspeksi · Remote  
**Sesudah:** Konsultasi · Inspeksi

- Hapus item `{ label: 'Remote', href: '/teknisi/remote' }`.
- Hapus state `remoteWaiting` dan logika badge untuk Remote.
- Badge **Konsultasi** tetap: jumlah `konsultasiPending` dari `/api/teknisi/layanan-counts`.

### 3.2 Bottom nav mobile (`dashboard-bottom-nav.tsx`)

Ganti tab **Remote** dengan **Konsultasi**:

| Label | Href | activePrefixes |
|-------|------|----------------|
| Konsultasi | `/teknisi/konsultasi` | `/teknisi/konsultasi` |

Icon: `MessageCircle` (konsisten dengan sidebar).

### 3.3 Deep link & pencarian

| Lokasi | Perubahan |
|--------|-----------|
| `teknisi-welcome-card.tsx` | Link "Remote" → `/teknisi/konsultasi` |
| `dashboard-smart-search.ts` | Entri "Remote" → "Konsultasi remote" → `/teknisi/konsultasi?filter=remote` |
| `teknisi-service-notifications.ts` | `href` notifikasi remote → `/teknisi/konsultasi` |
| `proxy.ts` / middleware | Pertahankan `/teknisi/remote` untuk redirect; tidak perlu route guard baru |

---

## 4. Halaman Konsultasi teknisi

File utama: `src/app/teknisi/konsultasi/page.tsx`  
Data sudah tersedia di `TeknisiKonsultasiDto`: `requiresRemote`, `remoteId`, `remoteOtp`, `device`, `clientOs`.

### 4.1 Filter baru: Tipe sesi

Tambah `FilterDropdown` **Tipe** (di samping Status & Rating):

| Opsi | Logika |
|------|--------|
| Semua | Tanpa filter `requiresRemote` |
| Termasuk remote | `item.requiresRemote === true` |
| Tanpa remote | `item.requiresRemote === false` |

Query string opsional: `?filter=remote` memilih filter "Termasuk remote" saat mount (untuk deep link dari smart search / notifikasi).

### 4.2 Badge di tabel

Pada kolom **Layanan** (atau kolom baru **Tipe**):

- Jika `requiresRemote`: badge kecil `Remote` (variant outline / info).
- Non-remote: tidak perlu badge tambahan.

### 4.3 Panel detail remote (per baris)

Untuk baris dengan `requiresRemote === true` dan status `pending` atau `active`:

Tampilkan sub-baris atau expandable row di bawah baris utama:

```
Perangkat: {device} · OS: {clientOs}
IndoDesk ID: {remoteId}   [Salin]
OTP: {remoteOtp}          [Salin]   (hanya jika remoteOtp tidak null)
```

- Tombol **Salin** memakai `navigator.clipboard` (pola sama dengan `/teknisi/remote/page.tsx` saat ini).
- OTP disembunyikan serializer untuk status `completed` / `cancelled` — UI tidak menampilkan jika null.

### 4.4 Statistik (opsional, ringan)

Tambah angka kecil di kartu **Pending** atau subtitle:  
`{n} dengan remote` — dihitung client-side dari `items.filter(i => i.requiresRemote && i.status === 'pending')`.

Tidak perlu endpoint baru.

### 4.5 Copy halaman

- Subtitle: *"Kelola konsultasi dari user, termasuk sesi remote IndoDesk"*
- Empty state: tidak berubah.

---

## 5. Notifikasi real-time

### 5.1 `TeknisiRemoteRequestNotifier`

Rename menjadi `TeknisiKonsultasiRequestNotifier` (atau perluas komponen existing):

| Aspek | Lama | Baru |
|-------|------|------|
| Poll endpoint | `GET /api/teknisi/remote` | `GET /api/teknisi/konsultasi` |
| Kriteria baru | `RemoteSession.status === WAITING` | `status === 'pending' && requiresRemote && paymentStatus === SECURED` (via `canStart` atau field eksplisit) |
| Dialog title | "Permintaan remote baru" | "Konsultasi remote baru" |
| Deskripsi | Kode sesi remote | `{userName} · {service} · ID: {remoteId}` |
| Navigasi setuju | `/teknisi/remote` | `/teknisi/konsultasi?filter=remote` |

Polling interval tetap 15 detik; deduplikasi `seenIds` tetap.

### 5.2 `teknisi-service-notifications.ts`

Event notifikasi yang sebelumnya membuat link `/teknisi/remote` diubah ke `/teknisi/konsultasi`.

---

## 6. API counts

`GET /api/teknisi/layanan-counts`:

- **Hapus** field `remoteWaiting` dari response (breaking untuk consumer teknisi saja — sidebar adalah satu-satunya consumer).
- Alternatif backward-compat: tetap kirim `remoteWaiting: 0` satu rilis — **tidak diperlukan** karena scope internal.

Query `remoteWaiting` (`prisma.remoteSession.count`) dihapus dari handler.

---

## 7. Redirect `/teknisi/remote`

Ganti `page.tsx` dengan redirect server-side:

```
/teknisi/remote → /teknisi/konsultasi?from=remote-deprecated
```

Di halaman konsultasi, jika `from=remote-deprecated`, tampilkan toast sekali:

> "Remote sekarang dikelola melalui menu Konsultasi."

Implementasi toast: `useEffect` + query param, hapus param dari URL via `router.replace` setelah ditampilkan.

File `teknisi/remote/page.tsx` lama (tabel RemoteSession) **dihapus** — logic salin OTP dipindah ke konsultasi page.

---

## 8. Out of scope

| Area | Alasan |
|------|--------|
| Hapus model `RemoteSession` / migrasi DB | Perlu audit data & user flow terpisah |
| Halaman `/user/remote` | User booking sudah via konsultasi; cleanup UI user terpisah |
| Panel admin monitoring remote | Tetap pakai `RemoteSession` sampai data habis |
| Dashboard chart "pendapatan remote" | Bisa tetap aggregate historis; tidak diubah dalam spec ini |
| Telegram template `newRemoteRequest` | Update terpisah jika masih dipanggil |

---

## 9. Testing

### Manual (teknisi)

1. Login teknisi — sidebar **tidak** menampilkan Remote; bottom nav menampilkan Konsultasi.
2. User booking konsultasi `requiresRemote` — muncul di `/teknisi/konsultasi` dengan badge Remote, ID/OTP terlihat saat pending.
3. Teknisi **Mulai** → OTP masih terlihat saat active; hilang setelah selesai.
4. Buka `/teknisi/remote` — redirect + toast.
5. Notifikasi popup konsultasi remote baru → navigasi ke konsultasi dengan filter remote.

### Regression

- Konsultasi non-remote: tidak ada badge Remote, tidak ada panel IndoDesk.
- Inspeksi & menu lain tidak terpengaruh.
- Badge Konsultasi = jumlah pending (termasuk remote).

### Functional tests (follow-up)

Update `docs/functional-tests/` jika ada skenario yang menyebut menu Remote teknisi.

---

## 10. Urutan implementasi

1. Perkaya UI `/teknisi/konsultasi` (filter, badge, panel IndoDesk, toast redirect).
2. Redirect `/teknisi/remote`.
3. Hapus menu Remote (sidebar, bottom nav, welcome card, smart search).
4. Update notifier + service notifications.
5. Bersihkan `layanan-counts` (hapus `remoteWaiting`).
6. Smoke test manual.

---

## 11. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| `RemoteSession` lama masih WAITING di DB | Tidak ditampilkan; admin bisa monitor; opsi cleanup script nanti |
| Teknisi terbiasa menu Remote | Toast redirect + subtitle halaman konsultasi |
| Mobile kehilangan shortcut | Tab Konsultasi menggantikan Remote di bottom nav |

---

## 12. Ringkasan file yang disentuh

| File | Aksi |
|------|------|
| `src/components/dashboard/teknisi-sidebar.tsx` | Hapus Remote |
| `src/components/mobile/dashboard-bottom-nav.tsx` | Remote → Konsultasi |
| `src/app/teknisi/konsultasi/page.tsx` | Filter, badge, panel IndoDesk, toast |
| `src/app/teknisi/remote/page.tsx` | Redirect |
| `src/components/teknisi/teknisi-remote-request-notifier.tsx` | Poll konsultasi |
| `src/components/teknisi/teknisi-welcome-card.tsx` | Update link |
| `src/lib/dashboard-smart-search.ts` | Update entri |
| `src/lib/teknisi-service-notifications.ts` | Update href |
| `src/app/api/teknisi/layanan-counts/route.ts` | Hapus remoteWaiting |

Tidak ada perubahan schema Prisma.
