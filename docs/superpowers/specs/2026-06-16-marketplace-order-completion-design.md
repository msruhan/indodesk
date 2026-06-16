# Marketplace Order Completion & Complaint — Design Spec

**Tanggal**: 2026-06-16  
**Status**: Approved  
**Author**: Brainstorming session  

---

## 1. Tujuan

Mengubah penutupan pesanan marketplace fisik agar:

- **Penjual tidak bisa** menandai pesanan selesai secara manual setelah pengiriman.
- Penyelesaian hanya setelah **kurir melaporkan paket sampai** (status terminal tracking).
- **Pembeli** yang memutuskan: pesanan sesuai atau komplain.
- Jika pembeli diam **3 hari** setelah paket sampai → **auto-selesai**.
- Komplain wajib disertai **alasan + foto + video**; penjual diberi **2 hari** merespons sebelum eskalasi ke **admin**.

Masalah yang diselesaikan: penjual saat ini dapat `SHIPPED → COMPLETED` manual, sehingga order tampil **Selesai** sementara tracking masih **ON PROCESS** (lihat bug lapangan ORD-2026-G1TXGC).

---

## 2. Keputusan bisnis

| Topik | Keputusan |
|-------|-----------|
| Penjual tandai selesai manual | **Dihapus** untuk status `SHIPPED` |
| Pemicu aksi pembeli | Tracking kurir status **DELIVERED / TERKIRIM** (`isTerminalTrackingStatus`) |
| Opsi pembeli setelah sampai | **Pesanan sesuai** atau **Komplain** |
| Auto-selesai tanpa respons | **3 hari** setelah `deliveredAt` |
| Bukti komplain | **Wajib**: min 1 foto + min 1 video + alasan (min 20 karakter) |
| Alur komplain | Penjual respons dulu → admin jika sengketa / timeout |
| Batas respons penjual | **2 hari** sejak komplain diajukan |
| Keputusan admin | Refund penuh / refund sebagian / tolak komplain |
| Produk digital/software | **Out of scope v1** — alur terpisah nanti |
| Escrow wallet | **Out of scope v1** — tetap kredit penjual saat checkout; refund komplain memakai pola refund existing |

---

## 3. Konteks codebase saat ini

| Komponen | Kondisi |
|----------|---------|
| `confirmMarketplaceOrderReceipt` | Sudah ada — pembeli konfirmasi, wajib `SHIPPED` + tracking terminal |
| `canConfirmReceipt` di serializer | Sudah ada untuk pembeli |
| Penjual `advance` `SHIPPED → COMPLETED` | **Masih aktif** — harus dihapus |
| Komplain marketplace | Belum ada |
| Referensi pola dispute | `InspectionOrder` dispute, `Rekber` disputed + admin resolve |
| Refund wallet | `refundBuyerForMarketplace` + `debitSellerForMarketplace` (cancel order) |

---

## 4. Alur status order

```
PAID → PROCESSING → SHIPPED
                        │
            (BinderByte: DELIVERED / TERKIRIM)
                        │
                        ▼
              [Menunggu keputusan pembeli]
              buyerActionDeadline = deliveredAt + 3 hari
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
   Pesanan Sesuai   Komplain    (diam ≥ 3 hari,
   (confirm API)    diajukan     tanpa komplain aktif)
         │              │              │
         ▼              ▼              ▼
    COMPLETED       DISPUTED      COMPLETED (auto)
                         │
              Penjual respons (≤ 2 hari)
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
        Pembeli terima         Timeout / tidak sepakat
        penyelesaian penjual         │
        (opsional v1:              ▼
         withdraw komplain)      ESCALATED → Admin
              │                     │
              └──────────┬──────────┘
                         ▼
              Admin: REFUND_FULL /
                     REFUND_PARTIAL /
                     REJECTED → COMPLETED
```

### 4.1 Perubahan `OrderStatus`

Tambah enum value:

```prisma
enum OrderStatus {
  PENDING
  PAID
  PROCESSING
  SHIPPED
  DISPUTED   // baru — komplain aktif
  COMPLETED
  CANCELLED
  REFUNDED
}
```

### 4.2 Guard penjual

| Status saat ini | Aksi penjual yang diizinkan |
|-----------------|----------------------------|
| `PAID` | Proses pesanan → `PROCESSING` |
| `PROCESSING` | Input resi → `SHIPPED` (via BinderByte) |
| `SHIPPED` | **Tidak ada** advance ke `COMPLETED` |
| `DISPUTED` | Hanya respons komplain (jika `OPEN`) |
| `COMPLETED` | Read-only |

Hapus cabang `SHIPPED → COMPLETED` di:

- `src/app/api/teknisi/marketplace/orders/[id]/route.ts`
- `sellerNextStatus()` di `marketplace-order-serializer.ts`
- UI tombol "Tandai Selesai" di `teknisi/pesanan` dan panel terkait

---

## 5. State machine komplain

```prisma
enum OrderComplaintStatus {
  OPEN              // diajukan pembeli, menunggu respons penjual
  SELLER_RESPONDED  // penjual sudah jawab, menunggu keputusan lanjut
  ESCALATED         // timeout 2 hari atau pembeli minta eskalasi → antrian admin
  RESOLVED          // admin sudah putuskan
  WITHDRAWN         // pembeli tarik komplain (opsional v1)
}

enum OrderComplaintResolution {
  REFUND_FULL
  REFUND_PARTIAL
  REJECTED
}
```

### 5.1 Transisi

| Dari | Event | Ke |
|------|-------|-----|
| — | Pembeli submit komplain | `OPEN` + order → `DISPUTED` |
| `OPEN` | Penjual respons (≤ 2 hari) | `SELLER_RESPONDED` |
| `OPEN` | 2 hari tanpa respons penjual | `ESCALATED` |
| `SELLER_RESPONDED` | Pembeli eskalasi manual | `ESCALATED` |
| `SELLER_RESPONDED` | Pembeli tarik komplain (v1 opsional) | `WITHDRAWN` + order → `SHIPPED` |
| `ESCALATED` | Admin resolve | `RESOLVED` + order → `COMPLETED` atau `REFUNDED` |

**v1 disederhanakan:** setelah `SELLER_RESPONDED`, jika pembeli tidak eskalasi dalam 2 hari tambahan, auto-`ESCALATED` ke admin (sama seperti timeout penjual).

---

## 6. Data model

### 6.1 Field baru pada `Order`

```prisma
model Order {
  // existing …

  deliveredAt          DateTime?  // pertama kali tracking terminal terdeteksi
  buyerActionDeadline  DateTime?  // deliveredAt + 3 hari
  autoCompletedAt      DateTime?  // jika selesai via cron
  completedAt          DateTime?  // existing — manual confirm atau auto
}
```

`deliveredAt` dan `buyerActionDeadline` di-set oleh:

1. **Cron tracking sync** — saat `trackingSummaryStatus` pertama kali terminal dan `deliveredAt` masih null.
2. **Submit resi** — jika BinderByte langsung return DELIVERED (edge case).

### 6.2 Model `OrderComplaint`

```prisma
model OrderComplaint {
  id              String                   @id @default(cuid())
  orderId         String                   @unique
  buyerId         String
  sellerId        String
  reason          String                   @db.Text
  status          OrderComplaintStatus     @default(OPEN)
  sellerResponse  String?                  @db.Text
  sellerRespondedAt DateTime?
  escalatedAt     DateTime?
  resolvedAt      DateTime?
  resolution      OrderComplaintResolution?
  refundAmount    Decimal?                 @db.Decimal(12, 0)
  adminNote       String?                  @db.Text
  adminId         String?
  sellerDeadline  DateTime                 // createdAt + 2 hari
  createdAt       DateTime                 @default(now())
  updatedAt       DateTime                 @updatedAt

  order   Order                 @relation(fields: [orderId], references: [id], onDelete: Cascade)
  buyer   User                  @relation("BuyerComplaints", fields: [buyerId], references: [id])
  seller  User                  @relation("SellerComplaints", fields: [sellerId], references: [id])
  admin   User?                 @relation("AdminComplaintResolutions", fields: [adminId], references: [id])
  media   OrderComplaintMedia[]

  @@index([status, sellerDeadline])
  @@index([status, escalatedAt])
}
```

### 6.3 Model `OrderComplaintMedia`

```prisma
enum OrderComplaintMediaType {
  PHOTO
  VIDEO
}

model OrderComplaintMedia {
  id          String                  @id @default(cuid())
  complaintId String
  type        OrderComplaintMediaType
  url         String
  mimeType    String
  sizeBytes   Int
  createdAt   DateTime                @default(now())

  complaint OrderComplaint @relation(fields: [complaintId], references: [id], onDelete: Cascade)

  @@index([complaintId])
}
```

### 6.4 Validasi upload

| Field | Aturan |
|-------|--------|
| `reason` | Min 20, max 2000 karakter |
| Foto | Min 1, max 5; JPEG/PNG/WebP; max 5 MB per file |
| Video | Min 1, max 2; MP4/WebM/MOV; max 50 MB per file |

Upload via multipart ke storage existing (pattern `product-image-api` / R2), prefix `complaints/{orderId}/`.

---

## 7. Cron & otomasi

Endpoint baru: `GET /api/cron/marketplace-order-deadlines` (protected `CRON_SECRET`, sama pola cron tracking).

### 7.1 Job 1 — Set `deliveredAt`

Query order `status = SHIPPED`, `deliveredAt IS NULL`, `isTerminalTrackingStatus(trackingSummaryStatus)`.

Update:

```ts
deliveredAt = now
buyerActionDeadline = now + 3 days
```

Kirim notifikasi ke pembeli: *"Paket sampai — konfirmasi atau komplain dalam 3 hari."*

### 7.2 Job 2 — Auto-complete

Query: `status = SHIPPED`, `buyerActionDeadline < now`, tidak ada `OrderComplaint` aktif (`OPEN` | `SELLER_RESPONDED` | `ESCALATED`).

Aksi: panggil logic sama dengan `confirmMarketplaceOrderReceipt` (set `COMPLETED`, `autoCompletedAt`, settlement).

### 7.3 Job 3 — Eskalasi komplain penjual

Query: `OrderComplaint.status = OPEN`, `sellerDeadline < now`.

Aksi: `status → ESCALATED`, `escalatedAt = now`, notifikasi admin.

Jalankan setiap **15 menit** (boleh digabung dengan cron tracking existing atau worker terpisah).

---

## 8. API

### 8.1 Pembeli

| Method | Path | Body | Guard |
|--------|------|------|-------|
| `POST` | `/api/user/marketplace/orders/[id]/confirm` | — | Existing; `SHIPPED` + terminal tracking |
| `POST` | `/api/user/marketplace/orders/[id]/complaint` | multipart: `reason`, `photos[]`, `videos[]` | `SHIPPED` + terminal + sebelum deadline + belum ada komplain |

Response complaint: `OrderComplaint` + order status `DISPUTED`.

| Error code | Pesan |
|------------|-------|
| `NOT_DELIVERED` | Paket belum sampai menurut kurir |
| `DEADLINE_PASSED` | Batas waktu komplain sudah lewat |
| `COMPLAINT_EXISTS` | Komplain sudah diajukan |
| `MEDIA_REQUIRED` | Foto dan video wajib |

### 8.2 Penjual

| Method | Path | Body | Guard |
|--------|------|------|-------|
| `POST` | `/api/teknisi/marketplace/orders/[id]/complaint/respond` | `{ response: string }` | Komplain `OPEN`, pemilik order |

Min respons: 10 karakter. Set `SELLER_RESPONDED`, notifikasi pembeli.

**Patch teknisi order:** hapus `action: advance` untuk `SHIPPED → COMPLETED`.

### 8.3 Admin

| Method | Path | Body |
|--------|------|------|
| `GET` | `/api/admin/marketplace/complaints` | filter `status=ESCALATED` |
| `GET` | `/api/admin/marketplace/complaints/[id]` | detail + media |
| `POST` | `/api/admin/marketplace/complaints/[id]/resolve` | `{ resolution, refundAmount?, adminNote }` |

Resolusi:

- `REFUND_FULL` → `refundBuyerForMarketplace` + `debitSellerForMarketplace`, order `REFUNDED`
- `REFUND_PARTIAL` → refund `refundAmount`, debit seller sama nominal, order `COMPLETED`
- `REJECTED` → order `COMPLETED`, tidak ada refund

Semua resolusi: `complaint.status = RESOLVED`, `resolvedAt`, log activity.

---

## 9. UI

### 9.1 Pembeli — `/user/orders/[id]` & list

**Kondisi tampil:** `canConfirmReceipt || canFileComplaint`

Kartu "Paket sudah sampai":

- Countdown deadline (3 hari)
- Tombol **Pesanan Sesuai** (hijau)
- Tombol **Komplain** (outline merah) → modal:
  - Textarea alasan
  - Upload foto (min 1)
  - Upload video (min 1, wajib)
  - Submit

**Saat `DISPUTED`:** tampilkan status komplain, respons penjual (jika ada), tombol **Eskalasi ke Admin** (jika `SELLER_RESPONDED`).

### 9.2 Penjual — `/teknisi/pesanan`

- Hapus **Tandai Selesai** untuk order `SHIPPED`
- Badge **Menunggu konfirmasi pembeli** jika DELIVERED + belum completed
- Section komplain: alasan, link foto/video, form respons
- Countdown respons 2 hari

### 9.3 Admin — tab baru "Komplain Marketplace"

- Tabel: order code, pembeli, penjual, tanggal, status
- Detail: bukti media (gallery + video player), thread respons
- Form resolve: radio resolution + nominal partial + catatan admin

---

## 10. Serializer & flags DTO

Tambah pada `MarketplaceOrderDto`:

```ts
deliveredAt: string | null
buyerActionDeadline: string | null
canFileComplaint: boolean
complaint: OrderComplaintDto | null
autoCompletedAt: string | null
```

Update logic:

```ts
canAdvanceStatus = seller && status === 'paid' // hanya PAID → PROCESSING
canConfirmReceipt = buyer && shipped && terminal && !complaint && before deadline
canFileComplaint = canConfirmReceipt // mutual exclusive actions
```

---

## 11. Notifikasi

| Event | Penerima | Channel |
|-------|----------|---------|
| Paket DELIVERED | Pembeli | In-app + Telegram (jika ada) |
| 1 hari sebelum auto-complete | Pembeli | Reminder |
| Komplain baru | Penjual | In-app + Telegram |
| Respons penjual | Pembeli | In-app |
| Eskalasi admin | Admin | In-app |
| Resolusi admin | Pembeli + Penjual | In-app |

Gunakan `logOrderEvent` + hook notifikasi existing (`user-order-notifications`).

---

## 12. Edge cases

| Situasi | Perlakuan |
|---------|-----------|
| Tracking terminal tapi pembeli klaim belum terima | Boleh komplain; admin tinjau bukti |
| Komplain saat auto-complete job berjalan | Komplain menang — cek komplain aktif sebelum auto-complete |
| Penjual saldo < refund | Error `INSUFFICIENT_SELLER_BALANCE`; admin diminta tindak lanjut manual |
| Order seed/lama tanpa `deliveredAt` | Cron backfill saat tracking sudah terminal |
| Double confirm | Idempotent — tolak jika sudah `COMPLETED` |
| Software/digital tanpa kurir | v1: tidak tampilkan confirm/complaint; dokumentasikan follow-up |

---

## 13. Testing

### Functional

| ID | Skenario |
|----|----------|
| FT-MKT-301 | Penjual tidak bisa advance `SHIPPED → COMPLETED` |
| FT-MKT-302 | Pembeli confirm setelah DELIVERED → COMPLETED |
| FT-MKT-303 | Pembeli komplain tanpa video → ditolak |
| FT-MKT-304 | Auto-complete 3 hari tanpa respons |
| FT-MKT-305 | Penjual respons → SELLER_RESPONDED |
| FT-MKT-306 | Timeout 2 hari → ESCALATED |
| FT-MKT-307 | Admin refund full → REFUNDED + wallet |
| FT-MKT-308 | Komplain aktif memblokir auto-complete |

### Manual

1. Checkout produk fisik → teknisi proses + resi
2. Mock/stub BinderByte DELIVERED
3. Verifikasi UI pembeli (2 tombol + countdown)
4. Uji komplain dengan upload
5. Verifikasi penjual tidak ada tombol selesai

---

## 14. Out of scope v1

- ~~Escrow / hold dana penjual sampai COMPLETED~~ → **Di-amend**: lihat `2026-06-16-marketplace-escrow-fees-design.md`
- Komplain untuk produk software/digital
- Chat thread multi-turn dalam komplain (hanya 1 respons penjual)
- Pembeli withdraw komplain (bisa v1.1)
- Partial refund otomatis tanpa admin

---

## 15. File yang terdampak (estimasi)

| Area | File |
|------|------|
| Schema | `prisma/schema.prisma`, migrasi baru |
| Cron | `src/app/api/cron/marketplace-order-deadlines/route.ts` |
| Lib | `marketplace-order-confirm.ts`, `marketplace-order-serializer.ts`, `order-tracking-sync.ts` |
| API | teknisi order PATCH, complaint routes user/teknisi/admin |
| UI | `teknisi/pesanan`, `marketplace-order-detail-view`, `my-orders-view`, admin panel |
| Upload | lib complaint media (reuse R2 pattern) |

---

## 16. Urutan implementasi disarankan

1. Schema + migrasi (`DISPUTED`, `OrderComplaint`, field deadline)
2. Hapus seller manual complete (API + serializer + UI)
3. Cron `deliveredAt` + auto-complete
4. API + UI komplain pembeli
5. API + UI respons penjual
6. Admin resolve + refund
7. Notifikasi + functional tests

---

## 17. Self-review checklist

- [x] Tidak ada placeholder TBD pada keputusan bisnis
- [x] Konsisten: auto-complete 3 hari hanya jika tidak ada komplain aktif
- [x] Konsisten: penjual tidak bisa COMPLETED manual
- [x] Scope v1 jelas (fisik saja, no escrow)
- [x] Pola refund mengikuti cancel order existing
- [x] Ambiguitas `SELLER_RESPONDED` → eskalasi: auto 2 hari tambahan ke admin (v1)
