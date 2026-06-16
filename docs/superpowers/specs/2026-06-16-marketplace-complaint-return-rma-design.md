# Marketplace Complaint — Return Merchandise (RMA) Design Spec

**Tanggal**: 2026-06-16  
**Status**: Approved (brainstorming session)  
**Extends**: `2026-06-16-marketplace-order-completion-design.md`, `2026-06-16-marketplace-escrow-fees-design.md`  
**Author**: Brainstorming session  

---

## 1. Tujuan

Melengkapi alur komplain marketplace fisik dengan **Return Merchandise Authorization (RMA) penuh**:

- Semua komplain **wajib pengembalian barang** — refund hanya setelah retur sampai ke penjual dan dikonfirmasi.
- Pembeli wajib unggah **foto + video** saat mengirim balik, lalu input **resi retur**.
- Sistem **melacak pengiriman retur** (BinderByte) seperti pengiriman awal.
- Penjual konfirmasi penerimaan dalam **2 hari** setelah retur DELIVERED; jika diam → **auto-refund**.
- Penjual bisa **menolak kondisi retur** (alasan + foto) → **eskalasi admin** (Opsi A).
- Ongkir retur ditanggung **pembeli sendiri** (di luar saldo platform).

---

## 2. Keputusan bisnis (ringkas)

| Topik | Keputusan |
|-------|-----------|
| Tipe komplain | **Semua wajib retur barang** (RMA penuh) |
| Refund trigger | Tracking retur **DELIVERED** + penjual konfirmasi "diterima & sesuai" |
| Auto-refund penjual | **2 hari** setelah retur DELIVERED tanpa respons penjual |
| Batas kirim retur pembeli | **3 hari** sejak masuk fase `AWAITING_RETURN` |
| Ongkir retur | **Pembeli bayar sendiri** (tidak lewat wallet platform) |
| Penjual tolak retur | Alasan + foto → status **ESCALATED** → admin putuskan |
| Produk digital/software | **Out of scope** — tidak tampilkan komplain/retur |
| Dana selama RMA | Escrow v2 — hold pembeli tetap; refund setelah alur retur selesai |

---

## 3. Alur end-to-end

```
Paket sampai (DELIVERED) → pembeli ajukan komplain
  (alasan + foto cacat + video unboxing)
        │
        ▼
   OPEN — penjual respons ≤ 2 hari
        │
        ├─ penjual respons (setuju / tidak setuju / counter)
        └─ timeout 2 hari
        │
        ▼
 AWAITING_RETURN — pembeli wajib kirim balik ≤ 3 hari
   • upload foto + video pengemasan/pengiriman retur
   • input kurir + nomor resi retur
        │
        ▼
 RETURN_SHIPPED — tracking retur aktif (BinderByte poll)
        │
        ▼
 (BinderByte: retur DELIVERED)
        │
        ▼
 AWAITING_SELLER_CONFIRM — penjual ≤ 2 hari
        │
   ┌────┼────────────────┐
   ▼    ▼                ▼
Konfirmasi  Diam 2 hari   Tolak (+ foto)
diterima    auto-refund   ESCALATED
   │            │              │
   └─────┬──────┘              ▼
         ▼                 Admin resolve
    RESOLVED + REFUND_FULL     (refund / partial / reject)
    order → REFUNDED
```

### 3.1 Catatan fase `OPEN`

Meskipun penjual menolak klaim di fase `OPEN`, alur tetap lanjut ke `AWAITING_RETURN` setelah batas respons (karena **semua komplain wajib retur**). Sengketa substantif diselesaikan setelah barang sampai atau via eskalasi admin.

Jika pembeli tidak kirim retur dalam **3 hari** (`AWAITING_RETURN` expired) → komplain **WITHDRAWN** atau `RETURN_EXPIRED` → order kembali `SHIPPED` (pembeli masih bisa konfirmasi terima / komplain ulang — kebijakan v1: **tidak boleh komplain ulang** untuk order yang sama; tandai `complaintReturnExpiredAt`).

---

## 4. State machine komplain (revisi)

### 4.1 Status baru / diperluas

```prisma
enum OrderComplaintStatus {
  OPEN                    // komplain diajukan, tunggu respons penjual
  SELLER_RESPONDED        // penjual sudah jawab (pra-retur)
  AWAITING_RETURN         // pembeli wajib kirim barang ≤ 3 hari
  RETURN_SHIPPED          // resi retur aktif, tracking berjalan
  AWAITING_SELLER_CONFIRM // retur DELIVERED, tunggu konfirmasi penjual
  ESCALATED               // sengketa / penjual tolak retur / timeout pra-admin
  RESOLVED
  WITHDRAWN
  RETURN_EXPIRED          // pembeli tidak kirim retur dalam 3 hari
}
```

### 4.2 Transisi utama

| Dari | Event | Ke |
|------|-------|-----|
| — | Pembeli submit komplain | `OPEN` + order `DISPUTED` |
| `OPEN` | Penjual respons / timeout 2 hari | `AWAITING_RETURN` + set `returnDeadline` (+3 hari) |
| `AWAITING_RETURN` | Pembeli submit resi + media retur | `RETURN_SHIPPED` |
| `AWAITING_RETURN` | 3 hari lewat tanpa resi | `RETURN_EXPIRED` |
| `RETURN_SHIPPED` | Tracking retur DELIVERED | `AWAITING_SELLER_CONFIRM` + `returnDeliveredAt` |
| `AWAITING_SELLER_CONFIRM` | Penjual konfirmasi terima | `RESOLVED` + `REFUND_FULL` |
| `AWAITING_SELLER_CONFIRM` | 2 hari tanpa respons | `RESOLVED` + `REFUND_FULL` (auto) |
| `AWAITING_SELLER_CONFIRM` | Penjual tolak (+ foto) | `ESCALATED` |
| `ESCALATED` | Admin resolve | `RESOLVED` |

---

## 5. Data model

### 5.1 Perluasan `OrderComplaint`

```prisma
model OrderComplaint {
  // existing fields …

  type                  OrderComplaintType   @default(RETURN_REQUIRED)
  returnDeadline        DateTime?            // AWAITING_RETURN + 3 hari
  returnShippedAt       DateTime?
  returnDeliveredAt     DateTime?
  sellerConfirmDeadline DateTime?            // returnDeliveredAt + 2 hari

  returnCourier         ShippingCourier?
  returnTrackingNumber  String?
  returnTrackingActive  Boolean              @default(false)
  returnSummaryStatus   String?
  returnLastSyncedAt    DateTime?
  returnNextSyncAt      DateTime?

  sellerReturnRejectReason String?           @db.Text
  sellerReturnRejectedAt DateTime?
}

enum OrderComplaintType {
  RETURN_REQUIRED   // v1 — satu-satunya tipe
}
```

### 5.2 Media komplain — perluas tipe

```prisma
enum OrderComplaintMediaType {
  PHOTO              // legacy / defect
  VIDEO              // legacy
  UNBOXING_VIDEO     // bukti komplain awal
  DEFECT_PHOTO       // bukti komplain awal
  RETURN_PHOTO       // bukti pengemasan retur (wajib min 1)
  RETURN_VIDEO       // bukti pengiriman retur (wajib min 1)
  RETURN_REJECT_PHOTO // penjual tolak kondisi retur
}
```

### 5.3 Event tracking retur

**Rekomendasi:** model terpisah (isolasi dari outbound tracking).

```prisma
model OrderReturnTrackingEvent {
  id          String   @id @default(cuid())
  complaintId String
  occurredAt  DateTime
  description String   @db.Text
  location    String?
  createdAt   DateTime @default(now())

  complaint OrderComplaint @relation(fields: [complaintId], references: [id], onDelete: Cascade)

  @@index([complaintId, occurredAt])
}
```

Polling BinderByte untuk resi retur memakai `returnCourier` + `returnTrackingNumber` — reuse `trackShipment()` + `syncOrderTrackingFromBinderbyte` pattern (lib baru `return-tracking-sync.ts`).

### 5.4 Alamat retur penjual

Penjual wajib punya alamat pengiriman di profil toko / order. Saat `AWAITING_RETURN`, tampilkan ke pembeli:

- Nama penjual / toko
- Alamat gudang/toko (dari `Store` atau `TeknisiProfile.address`)
- Nomor HP penjual (opsional)

---

## 6. API

### 6.1 Pembeli

| Method | Path | Body / catatan |
|--------|------|----------------|
| `POST` | `/api/user/marketplace/orders/[id]/complaint` | existing + pastikan tipe RETURN_REQUIRED |
| `POST` | `/api/user/marketplace/orders/[id]/complaint/return` | `{ courier, trackingNumber }` + multipart foto & video retur |
| `GET` | `/api/user/marketplace/orders/[id]/complaint/return/tracking` | riwayat tracking retur |

Validasi submit retur:

- Status komplain = `AWAITING_RETURN`
- `now < returnDeadline`
- Min 1 `RETURN_PHOTO`, min 1 `RETURN_VIDEO`
- Resi valid (min 6 char, kurir enum)

### 6.2 Penjual

| Method | Path | Body |
|--------|------|------|
| `POST` | `.../complaint/respond` | existing — respons fase OPEN |
| `POST` | `.../complaint/return/confirm` | konfirmasi barang diterima & sesuai |
| `POST` | `.../complaint/return/reject` | `{ reason, rejectPhotos[] }` min 1 foto |

### 6.3 Admin

Tetap pakai `POST .../complaints/[id]/resolve` — berlaku saat `ESCALATED` (termasuk penolakan retur).

### 6.4 Cron

Perluas `/api/cron/marketplace-order-deadlines` atau buat `/api/cron/marketplace-return-deadlines`:

| Job | Aksi |
|-----|------|
| OPEN → AWAITING_RETURN | sellerDeadline lewat |
| AWAITING_RETURN → RETURN_EXPIRED | returnDeadline lewat |
| Poll retur RETURN_SHIPPED | sync BinderByte |
| RETURN DELIVERED → AWAITING_SELLER_CONFIRM | set deadline |
| AWAITING_SELLER_CONFIRM auto-refund | sellerConfirmDeadline lewat |
| SELLER_RESPONDED → ESCALATED | existing (jika masih dipakai) |

---

## 7. Wallet (escrow v2)

| Event | Aksi wallet |
|-------|-------------|
| Komplain diajukan | Hold tetap (tidak berubah) |
| Retur DELIVERED + penjual konfirmasi | `refundBuyerHoldForMarketplace(buyerHoldAmount)` |
| Auto-refund (penjual diam 2 hari) | Sama |
| Admin REFUND_FULL | Sama |
| Admin REJECTED | `releaseSellerForMarketplace(sellerNetAmount)` + order COMPLETED |
| RETURN_EXPIRED | Hold tetap; order → SHIPPED; pembeli bisa konfirmasi terima (tanpa refund) |

Ongkir retur **tidak** melalui wallet platform.

---

## 8. UI

### 8.1 Pembeli — detail order / komplain

**Fase OPEN:** status + countdown respons penjual.

**Fase AWAITING_RETURN:**
- Countdown **3 hari**
- Alamat pengiriman balik ke penjual
- Form: foto retur, video retur, kurir, nomor resi
- Peringatan: ongkir retur ditanggung pembeli

**Fase RETURN_SHIPPED:**
- Peta/timeline tracking retur (reuse `ShippingMap` / timeline dengan data retur)
- Status kurir

**Fase AWAITING_SELLER_CONFIRM:**
- "Menunggu penjual memeriksa barang retur"

### 8.2 Penjual — pesanan / komplain

- Section komplain dengan bukti awal pembeli
- Saat `RETURN_SHIPPED`: lacak retur
- Saat `AWAITING_SELLER_CONFIRM`: tombol **Konfirmasi Diterima** + **Tolak Kondisi** (modal alasan + foto)

### 8.3 Admin

- Detail komplain: tab **Retur** — media retur, resi, timeline, penolakan penjual (jika ada)
- Resolve form existing

---

## 9. Pendekatan teknis (3 opsi)

| Opsi | Deskripsi | Pro | Kontra |
|------|-----------|-----|--------|
| **A — Model `OrderReturnTrackingEvent` terpisah** *(disarankan)* | Tracking retur linked ke `OrderComplaint` | Isolasi jelas; tidak campur outbound | Satu model lagi |
| B — Reuse `OrderTrackingEvent` + flag `direction` | Kolom `direction: OUTBOUND \| RETURN` | Satu tabel | Risiko campur query/logic |
| C — Duplicate fields di Order | `returnTracking*` di Order | Cepat | Complaint & order coupling |

**Rekomendasi: Opsi A** — selaras prinsip isolasi di spec escrow.

---

## 10. Edge cases

| Situasi | Perlakuan |
|---------|-----------|
| Pembeli input resi salah | Allow 1× update resi dalam 24 jam jika belum ada event tracking |
| Retur DELIVERED tapi penjual klaim tidak terima | Penjual tolak → ESCALATED |
| Komplain aktif saat auto-complete cron | Blok auto-complete (existing) |
| RETURN_EXPIRED lalu pembeli kirim telat | Tolak submit; harus hubungi support/admin manual (v1) |
| Barang hilang di retur | Penjual diam 2 hari → auto-refund pembeli; penjual eskalasi ke kurir sendiri |
| Multi-item order | Satu resi retur untuk seluruh isi order (v1) |

---

## 11. Testing

| ID | Skenario |
|----|----------|
| FT-RMA-001 | Komplain → AWAITING_RETURN setelah timeout penjual |
| FT-RMA-002 | Submit retur tanpa video → ditolak |
| FT-RMA-003 | RETURN_EXPIRED setelah 3 hari |
| FT-RMA-004 | Tracking retur DELIVERED → AWAITING_SELLER_CONFIRM |
| FT-RMA-005 | Penjual konfirmasi → REFUND_FULL + wallet |
| FT-RMA-006 | Penjual diam 2 hari → auto-refund |
| FT-RMA-007 | Penjual tolak retur → ESCALATED |
| FT-RMA-008 | Admin resolve setelah penolakan retur |

---

## 12. Urutan implementasi

1. Schema: status baru, field retur, `OrderReturnTrackingEvent`, media types
2. Cron: deadline OPEN → AWAITING_RETURN, RETURN_EXPIRED, seller confirm auto-refund
3. API submit retur pembeli + media upload
4. Return tracking sync (BinderByte)
5. API konfirmasi / tolak penjual
6. Wallet hook pada konfirmasi & auto-refund
7. UI pembeli + penjual + admin tab retur
8. Functional tests

---

## 13. Self-review checklist

- [x] Semua komplain wajib retur (keputusan user)
- [x] Refund setelah DELIVERED + konfirmasi penjual; auto 2 hari
- [x] Pembeli 3 hari kirim retur (AWAITING_RETURN)
- [x] Ongkir retur pembeli sendiri
- [x] Penjual tolak → eskalasi admin (Opsi A)
- [x] Konsisten dengan escrow v2
- [x] Tidak ada TBD pada keputusan bisnis utama
- [x] Scope v1: fisik saja, satu resi per order
