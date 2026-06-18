# Marketplace Order Documentation (Packaging & Unboxing Proof) — Design Spec

**Tanggal**: 2026-06-17  
**Status**: Approved  
**Author**: Brainstorming session  
**Relates to**: `docs/superpowers/specs/2026-06-16-marketplace-order-completion-design.md`

---

## 1. Tujuan

Menambahkan **dokumentasi wajib berbasis bukti** pada dua titik kritis transaksi marketplace fisik:

1. **Penjual (sebelum kirim)** — Foto + video produk dalam kemasan/packaging, direview admin, baru bisa memproses pesanan dan input resi.
2. **Pembeli (saat komplain)** — Video unboxing dari paket segel sampai produk terlihat + foto kondisi masalah setelah dibuka, dalam satu form komplain.

Masalah yang diselesaikan:

- Penjual terlambat/ lupa dokumentasi karena sudah bisa ubah status ke "Diproses" atau langsung ke kurir.
- Komplain pembeli tanpa bukti kondisi paket saat diterima (sulit arbitrasi).
- Admin tidak punya materi objektif untuk approve pengiriman atau menilai sengketa.

---

## 2. Keputusan bisnis

| Topik | Keputusan |
|-------|-----------|
| Kapan penjual upload packaging | Status **PAID** — **sebelum** tombol "Proses Pesanan" aktif |
| Review packaging | **Admin** approve / tolak |
| Packaging ditolak | Upload ulang wajib; **3 hari** tanpa upload valid → **batalkan order + refund** pembeli |
| SLA review admin packaging | **24 jam** → notifikasi urgent ke admin; **tidak** auto-approve |
| Bukti pembeli untuk "Pesanan Sesuai" | **Tidak wajib** — konfirmasi tanpa upload |
| Bukti pembeli untuk komplain | **Wajib** — satu form: video unboxing + foto masalah |
| Produk digital/software | **Out of scope** — tidak ada gate packaging |
| Pendekatan teknis | Model terpisah `OrderPackagingProof` + kategori media komplain |

---

## 3. Konteks codebase

| Komponen | Kondisi saat ini |
|----------|------------------|
| Order flow | `PAID → PROCESSING → SHIPPED →` pembeli konfirmasi/komplain |
| `canAdvanceStatus` penjual | `PAID → PROCESSING` jika tidak ada gate packaging |
| `OrderComplaint` + media | Sudah ada; `PHOTO` / `VIDEO` generik |
| Admin approval produk | Pola `listingStatus PENDING` + `pendingChangeSummary` — referensi UX |
| Upload media | `processUpload` (foto), private R2, `marketplace-complaint-media.ts` |
| Cron deadlines | `marketplace-order-deadlines` — pola untuk timeout |

---

## 4. Alur status (penjual)

```
PAID
  │
  ├─ Belum ada bukti / DRAFT
  │     → Banner wajib upload; "Proses Pesanan" DISABLED
  │
  ├─ Submit bukti → PACKAGING_PENDING
  │     → Menunggu admin (SLA 24 jam → notifikasi urgent)
  │
  ├─ APPROVED
  │     → "Proses Pesanan" ENABLED → PROCESSING → input resi → SHIPPED …
  │
  └─ REJECTED (+ catatan admin)
        → Form upload ulang; resubmitDeadline = rejectedAt + 3 hari
        → Jika lewat deadline tanpa submit valid → CANCELLED + REFUND
```

**Tidak menambah nilai `OrderStatus` baru** — gate di level `OrderPackagingProof.status` + flags serializer.

---

## 5. Alur komplain pembeli (perubahan)

Tetap mengikuti spec completion 2026-06-16 (DELIVERED, deadline 3 hari, eskalasi penjual → admin).

**Perubahan validasi komplain:**

| Media | Wajib | Keterangan |
|-------|-------|------------|
| `UNBOXING_VIDEO` | Min 1 | Paket masih segel → proses buka → produk terlihat |
| `DEFECT_PHOTO` | Min 1 | Kondisi tidak sesuai setelah dibuka |
| `reason` | Min 20 karakter | Teks alasan (existing) |

Media generik `PHOTO`/`VIDEO` pada komplain **diganti** oleh kategori di atas (migrasi data: komplain lama tetap valid).

Tombol **Pesanan Sesuai** — tidak berubah, tanpa upload.

---

## 6. State machine — `OrderPackagingProof`

```prisma
enum OrderPackagingProofStatus {
  DRAFT      // upload parsial / belum submit (opsional, bisa skip langsung PENDING)
  PENDING    // menunggu admin
  APPROVED
  REJECTED
}
```

### Transisi

| Dari | Event | Ke |
|------|-------|-----|
| — | Penjual submit (min 1 foto + 1 video) | `PENDING` |
| `PENDING` | Admin approve | `APPROVED` |
| `PENDING` | Admin reject + note | `REJECTED` |
| `REJECTED` | Penjual resubmit (ganti media) | `PENDING` |
| `REJECTED` | 3 hari lewat tanpa resubmit valid | Cron cancel order |

Hanya satu record `OrderPackagingProof` per order (update status pada resubmit, append/replace media).

---

## 7. Data model

### 7.1 `OrderPackagingProof`

```prisma
model OrderPackagingProof {
  id                String                      @id @default(cuid())
  orderId           String                      @unique
  sellerId          String
  status            OrderPackagingProofStatus   @default(PENDING)
  rejectionNote     String?                     @db.Text
  submittedAt       DateTime?
  rejectedAt        DateTime?
  resubmitDeadline  DateTime?
  reviewedAt        DateTime?
  reviewedById      String?
  createdAt         DateTime                    @default(now())
  updatedAt         DateTime                    @updatedAt

  order      Order                   @relation(...)
  seller     User                    @relation(...)
  reviewedBy User?                   @relation(...)
  media      OrderPackagingMedia[]
}
```

### 7.2 `OrderPackagingMedia`

```prisma
enum OrderPackagingMediaType {
  PHOTO
  VIDEO
}

model OrderPackagingMedia {
  id          String                  @id @default(cuid())
  proofId     String
  type        OrderPackagingMediaType
  url         String
  mimeType    String
  sizeBytes   Int
  createdAt   DateTime                @default(now())

  proof OrderPackagingProof @relation(...)
}
```

### 7.3 Perluas `OrderComplaintMediaType`

```prisma
enum OrderComplaintMediaType {
  UNBOXING_VIDEO
  DEFECT_PHOTO
  // legacy — jangan dipakai untuk komplain baru:
  PHOTO
  VIDEO
}
```

---

## 8. Validasi upload

### Packaging (penjual)

| Field | Aturan |
|-------|--------|
| Foto | Min 1, max 5; JPEG/PNG/WebP; max 5 MB |
| Video | Min 1, max 2; MP4/WebM/MOV; max 50 MB |
| Instruksi UI | Produk + kemasan terlihat jelas, label order jika ada |

### Komplain (pembbeli) — form tunggal, dua section

| Field | Aturan |
|-------|--------|
| `UNBOXING_VIDEO` | Min 1 video; max 50 MB; harus menunjukkan segel utuh → pembukaan → produk |
| `DEFECT_PHOTO` | Min 1, max 5 foto |
| `reason` | Min 20, max 2000 karakter |

Storage: private R2, prefix `packaging/{orderId}/` dan `complaints/{orderId}/` (existing).

---

## 9. API

### 9.1 Penjual

| Method | Path | Fungsi |
|--------|------|--------|
| `POST` | `/api/teknisi/marketplace/orders/[id]/packaging` | Submit/resubmit multipart (photos[], videos[]) |
| `GET` | `/api/teknisi/marketplace/orders/[id]/packaging` | Status + media proof |

Guard submit: order `PAID`, seller owns, status proof bukan `PENDING`, jika `REJECTED` masih sebelum `resubmitDeadline`.

### 9.2 Admin — packaging

| Method | Path | Fungsi |
|--------|------|--------|
| `GET` | `/api/admin/marketplace/packaging-proofs` | List `PENDING` (+ flag `overdue24h`) |
| `GET` | `/api/admin/marketplace/packaging-proofs/[id]` | Detail + media |
| `POST` | `/api/admin/marketplace/packaging-proofs/[id]/review` | `{ action: 'approve' \| 'reject', note? }` |

### 9.3 Pembeli — update komplain

Perbarui `POST /api/user/marketplace/orders/[id]/complaint`:

- Terima `unboxingVideos[]` + `defectPhotos[]` (atau field names eksplisit)
- Validasi min 1 + 1
- Simpan dengan type `UNBOXING_VIDEO` / `DEFECT_PHOTO`

### 9.4 Serializer flags

```ts
packagingProof: OrderPackagingProofDto | null
requiresPackagingProof: boolean   // seller, PAID, not APPROVED
canSubmitPackagingProof: boolean  // seller, PAID, can upload/resubmit
canAdvanceStatus: boolean         // seller, PAID, packaging APPROVED only
```

---

## 10. UI

### 10.1 Penjual — `/teknisi/pesanan`

**Order PAID:**

- Banner persisten: *"Wajib upload foto & video produk dalam kemasan sebelum memproses pesanan"*
- Section upload (foto + video) + tombol **Kirim untuk Review**
- Status badge: Menunggu Review / Ditolak (+ catatan) / Disetujui
- Tombol **Proses Pesanan** disabled sampai **Disetujui**

**Order PAID + REJECTED:**

- Tampilkan `rejectionNote` + countdown `resubmitDeadline`
- Form upload ulang

### 10.2 Admin — tab "Bukti Packaging"

- Tabel: order code, penjual, tanggal submit, badge **>24 jam** (overdue)
- Detail: gallery foto + video player
- Tombol Approve / Tolak (modal catatan penolakan)
- Terpisah dari tab Komplain Marketplace

### 10.3 Pembeli — form komplain

Perbarui `MarketplaceComplaintForm`:

1. Section **Video unboxing** (wajib) — helper text instruksi segel → buka → produk
2. Section **Foto masalah** (wajib)
3. Textarea alasan

**Pesanan Sesuai** — tidak ada perubahan UI.

---

## 11. Cron & otomasi

Extend `/api/cron/marketplace-order-deadlines` atau cron baru `packaging-deadlines`:

| Job | Query | Aksi |
|-----|-------|------|
| Packaging SLA 24h | `PENDING` + `submittedAt < now - 24h` + belum notified | Notifikasi urgent admin (once per proof) |
| Resubmit timeout | `REJECTED` + `resubmitDeadline < now` | Cancel order + refund (reuse cancel flow) |

Field opsional: `slaNotifiedAt` pada `OrderPackagingProof` agar notifikasi 24h tidak spam.

---

## 12. Notifikasi

| Event | Penerima |
|-------|----------|
| Buka order PAID baru | Penjual — "Upload bukti packaging wajib" |
| Packaging disubmit | Admin |
| Packaging pending > 24 jam | Admin — urgent |
| Packaging approved | Penjual — "Bisa proses & kirim" |
| Packaging rejected | Penjual — catatan + deadline 3 hari |
| Resubmit timeout cancel | Pembeli + Penjual |

---

## 13. Edge cases

| Situasi | Perlakuan |
|---------|-----------|
| Penjual submit saat `PENDING` | Tolak — tunggu keputusan admin |
| Admin approve lalu batalkan order | Out of scope — cancel hanya PAID/PROCESSING existing rules |
| Komplain lama (PHOTO/VIDEO) | Tetap tampil; komplain baru pakai kategori baru |
| Order fisik tanpa kurir (edge) | Tetap wajib packaging; alur delivery unchanged |
| Software/digital | Skip `requiresPackagingProof` — deteksi `cartType === software` / kategori |

---

## 14. Testing

| ID | Skenario |
|----|----------|
| FT-MKT-401 | Penjual PAID tidak bisa advance tanpa packaging approved |
| FT-MKT-402 | Submit packaging tanpa video → ditolak |
| FT-MKT-403 | Admin approve → penjual bisa proses |
| FT-MKT-404 | Admin reject → resubmit dalam 3 hari |
| FT-MKT-405 | Reject + 3 hari timeout → cancel + refund |
| FT-MKT-406 | Komplain tanpa unboxing video → ditolak |
| FT-MKT-407 | Komplain lengkap → DISPUTED (flow existing) |
| FT-MKT-408 | Pesanan Sesuai tanpa bukti → COMPLETED (unchanged) |

---

## 15. Out of scope

- Auto-approve packaging setelah 24 jam
- Bukti packaging untuk produk digital/software
- AI/ML validasi isi video (manual admin only)
- Dua langkah UI terpisah untuk unboxing vs defect (form tunggal dengan section)

---

## 16. Urutan implementasi

1. Schema + migrasi (`OrderPackagingProof`, media types komplain)
2. API submit/review packaging + serializer gates
3. UI penjual (banner, form, disable Proses)
4. Admin panel packaging
5. Cron SLA 24h + resubmit 3 hari
6. Perbarui form + validasi komplain pembeli
7. Notifikasi + functional tests

---

## 17. Self-review checklist

- [x] Gate penjual di PAID sebelum proses — sesuai permintaan user
- [x] Reject + 3 hari cancel — keputusan C
- [x] SLA 24h notifikasi tanpa auto-approve — keputusan A
- [x] Komplain: video unboxing + foto masalah, satu form — keputusan C
- [x] Pesanan Sesuai tanpa bukti — keputusan A
- [x] Konsisten dengan spec completion 2026-06-16
- [x] Tidak ada TBD pada keputusan bisnis
