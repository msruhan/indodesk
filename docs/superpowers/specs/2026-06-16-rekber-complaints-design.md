# Spec: Rekber (Escrow) Menu + Mekanisme Komplain (Parity dengan Marketplace)

Tanggal: 2026-06-16  
Status: Draft untuk review

## 1. Tujuan

- Menampilkan menu **Rekber** secara konsisten di dashboard **User, Teknisi, Admin**.
- Menyediakan mekanisme **komplain Rekber** yang *mirip* (parity) dengan komplain marketplace, agar alur Admin konsisten dan tidak membingungkan.
- Memperkuat keamanan/keadilan proses escrow untuk semua pihak.

Non-tujuan:
- Mengubah mekanisme komplain marketplace yang sudah ada.
- Membuat alur “return shipping” untuk Rekber (tidak relevan untuk escrow jasa/P2P).

## 2. Terminologi

- **Rekber**: transaksi escrow P2P antara buyer dan seller, dana ditahan (HELD) sampai buyer konfirmasi.
- **Komplain Rekber**: sengketa atas transaksi rekber saat status dana ditahan.
- **Parity**: pola UX admin, status, panel, dan resolusi dibuat menyerupai marketplace complaint (tanpa fitur return).

## 3. Kondisi Saat Ini (Baseline)

### 3.1 Halaman yang sudah ada

- User: `/user/rekber` (list & aksi)
- Admin: `/admin/rekber` (manajemen semua rekber + resolve admin)
- Publik: `/rekber` (pengajuan rekber baru)

### 3.2 Kesenjangan

- Sidebar User/Admin/Teknisi belum memunculkan menu Rekber (terutama Admin).
- Teknisi tidak punya halaman rekber di workspace (`/teknisi/rekber`) walau API rekber mendukung seller.
- “Dispute” Rekber saat ini hanya aksi langsung tanpa form alasan & bukti (berbeda dengan marketplace).
- Tidak ada panel antrian komplain yang menyerupai marketplace (Admin harus masuk halaman rekber dan menebak konteks).

## 4. Perubahan UX Navigasi (Menu)

### 4.1 Sidebar User

- Tambahkan item: **Rekber** → `/user/rekber` pada section **Keuangan** (dekat “Riwayat Transaksi”).

### 4.2 Sidebar Teknisi

- Tambahkan item: **Rekber** → `/teknisi/rekber` pada section **Keuangan**.
- Tujuan: seller bisa memantau rekber sebagai penjual, termasuk komplain/eskalasi.

### 4.3 Sidebar Admin

- Tambahkan item: **Rekber (Escrow)** → `/admin/rekber` pada section **Operasional**.
- Tambahkan item: **Komplain Rekber** → `/admin/rekber-complaints` pada section **Operasional** (dekat “Komplain Marketplace”).

### 4.4 Badge (opsional)

- `/admin/rekber`: badge jumlah transaksi rekber status `HELD` + `DISPUTED`.
- `/admin/rekber-complaints`: badge jumlah komplain status `ESCALATED`.

## 5. Alur Rekber (Adjusted)

### 5.1 Status Rekber (existing)

Model `RekberTransaction` sudah memiliki status:
- `PENDING`: belum dibayar
- `HELD`: dana ditahan
- `RELEASED`: dana dilepas ke seller
- `DISPUTED`: sengketa
- `REFUNDED`: dana dikembalikan

### 5.2 Trigger Komplain Rekber

- Komplain hanya bisa diajukan saat `RekberTransaction.status === HELD`.
- Pihak yang boleh mengajukan komplain:
  - **Buyer** (default)
  - (Opsional) Seller juga boleh ajukan komplain → *diputuskan: TIDAK untuk versi parity awal* agar alur konsisten dengan marketplace (buyer sebagai pemicu).

Saat komplain dibuat:
- Set `RekberTransaction.status = DISPUTED`
- Set `RekberTransaction.disputedAt = now()`

### 5.3 Timeline & deadline (mirip marketplace)

- Setelah komplain dibuat, seller diberi window respons `SELLER_RESPONSE_DAYS` (reuse constant marketplace) → `sellerDeadline`.
- Jika seller merespons sebelum deadline → status komplain berpindah ke `SELLER_RESPONDED`.
- Buyer dapat eskalasi ke Admin setelah seller merespons.
- Jika seller tidak merespons sampai deadline → komplain auto-eskalasi ke Admin (cron).

### 5.4 Resolve (Admin)

Admin menyelesaikan komplain dengan resolusi:
- `REFUND_FULL`: refund `totalHold` ke buyer → Rekber `REFUNDED`
- `REFUND_PARTIAL`: refund sebagian ke buyer, sisanya release ke seller → Rekber `RELEASED` (atau `REFUNDED` bila kebijakan menganggap selesai dengan refund; keputusan di spec: **RELEASED** dengan catatan “partial refund”)
- `REJECTED`: komplain ditolak, dana release ke seller → Rekber `RELEASED`

Catatan: `fee` platform bagian dari `totalHold`.
- Pada `REFUND_FULL`: buyer menerima kembali amount+fee.
- Pada `REJECTED`: seller menerima amount, fee tetap menjadi pendapatan platform (butuh ledger/platform tracking bila ingin transparan).
- Pada `REFUND_PARTIAL`: refundAmount diambil dari `totalHold` (atau amount saja). Keputusan: **refund dari amount terlebih dahulu**, fee tetap menjadi pendapatan platform kecuali admin memilih refund penuh.

## 6. Data Model Baru: RekberComplaint (Parity Marketplace)

### 6.1 Prisma models

Tambahkan model komplain baru yang paralel dengan `OrderComplaint`, namun lebih ringkas (tanpa return shipping):

- `RekberComplaint`
  - `id`
  - `rekberId` (unique)
  - `buyerId`
  - `sellerId`
  - `reason` (Text)
  - `status` (enum)
  - `sellerResponse` (Text, optional)
  - `sellerRespondedAt` (DateTime, optional)
  - `escalatedAt` (DateTime, optional)
  - `resolvedAt` (DateTime, optional)
  - `resolution` (enum, optional)
  - `refundAmount` (Decimal, optional) untuk `REFUND_PARTIAL`
  - `adminNote` (Text, optional)
  - `adminId` (optional)
  - `sellerDeadline` (DateTime)
  - timestamps: `createdAt`, `updatedAt`
  - relasi:
    - `rekber` → `RekberTransaction`
    - `buyer` / `seller` → `User`
    - `admin` → `User` (optional)
    - `media[]` → `RekberComplaintMedia`

- `RekberComplaintMedia`
  - `id`
  - `complaintId`
  - `type` (enum)
  - `url`
  - `mimeType`
  - `sizeBytes`
  - `createdAt`

### 6.2 Enum

Status (menyamai marketplace subset):
- `OPEN`
- `SELLER_RESPONDED`
- `ESCALATED`
- `RESOLVED`
- `WITHDRAWN`

Resolution (reuse marketplace):
- `REFUND_FULL`
- `REFUND_PARTIAL`
- `REJECTED`

Media type (reuse marketplace subset yang relevan):
- `DEFECT_PHOTO`
- `UNBOXING_VIDEO`
- (opsional) `PHOTO` / `VIDEO` umum bila ingin longgar

Keputusan parity: untuk meminimalkan kebingungan Admin, gunakan field & jenis media yang sama dengan marketplace:
- Wajib minimal 1 `DEFECT_PHOTO`
- Wajib minimal 1 `UNBOXING_VIDEO`

## 7. API (Mirror Marketplace Pattern)

### 7.1 User/teknisi (pihak transaksi)

#### 7.1.1 Ajukan komplain (buyer)
- `POST /api/rekber/[id]/complaint`
- Auth: buyer saja
- Body: `FormData`
  - `reason`
  - `defectPhotos[]`
  - `unboxingVideos[]`
- Validasi:
  - rekber exists & viewer adalah buyer
  - rekber.status === HELD
  - komplain belum ada untuk rekber tsb
  - minimal media sesuai rule
- Efek:
  - create `RekberComplaint` status `OPEN`, set `sellerDeadline = now + SELLER_RESPONSE_DAYS`
  - set `RekberTransaction.status = DISPUTED`, set `disputedAt`

#### 7.1.2 Seller respond
- `POST /api/rekber/[id]/complaint/respond`
- Auth: seller saja
- JSON:
  - `response` (min length sesuai marketplace sellerResponseSchema)
- Validasi:
  - komplain status `OPEN`
  - `sellerDeadline` belum lewat
- Efek:
  - set status `SELLER_RESPONDED`, `sellerResponse`, `sellerRespondedAt`

#### 7.1.3 Buyer escalate
- `POST /api/rekber/[id]/complaint/escalate`
- Auth: buyer saja
- Validasi:
  - komplain status `SELLER_RESPONDED`
- Efek:
  - status `ESCALATED`, set `escalatedAt`

#### 7.1.4 Withdraw (opsional)
- `POST /api/rekber/[id]/complaint/withdraw`
- Auth: buyer
- Validasi: status bukan `RESOLVED`
- Efek: status `WITHDRAWN`, rekber kembali `HELD` (bila belum ada admin action)

### 7.2 Admin

#### 7.2.1 Queue list
- `GET /api/admin/rekber/complaints?status=ESCALATED|ACTIVE|...`
- Mirip `GET /api/admin/marketplace/complaints`
- `ACTIVE` = `OPEN`, `SELLER_RESPONDED`, `ESCALATED`

#### 7.2.2 Resolve
- `POST /api/admin/rekber/complaints/[id]/resolve`
- JSON:
  - `resolution`: `REFUND_FULL|REFUND_PARTIAL|REJECTED`
  - `refundAmount` (wajib jika partial)
  - `adminNote` (optional)
- Validasi:
  - complaint status `ESCALATED` (atau allow juga `OPEN/SELLER_RESPONDED` untuk admin fast-path)
  - rekber status `DISPUTED` atau `HELD` (jaga konsistensi)
- Efek:
  - update complaint: `RESOLVED`, `resolvedAt`, `resolution`, `refundAmount`, `adminId`, `adminNote`
  - lakukan perubahan wallet:
    - refund/release sesuai resolusi
  - update rekber: `RELEASED`/`REFUNDED`, set timestamp

## 8. UI

### 8.1 Rekber list (User/Teknisi/Admin)

Gunakan komponen existing `RekberTransactionList`, dengan perubahan:
- Ganti tombol “Dispute” → “Ajukan Komplain” (buyer) yang membuka modal/form (parity marketplace).
- Untuk seller: tampilkan status komplain & CTA “Beri respons” bila status komplain `OPEN`.
- Untuk buyer: tampilkan CTA “Eskalasi ke Admin” bila status `SELLER_RESPONDED`.

### 8.2 Form Komplain Rekber (reuse marketplace)

Komponen baru `RekberComplaintForm`:
- Layout, hint text, validasi file sama seperti `MarketplaceComplaintForm`.
- Submit ke endpoint `/api/rekber/[id]/complaint`.

### 8.3 Panel Admin: Komplain Rekber

Komponen baru `AdminRekberComplaintsPanel`:
- Copy pattern `AdminMarketplaceComplaintsPanel`:
  - filter status `ESCALATED` vs `ACTIVE`
  - list queue + detail pane
  - modal resolve dengan opsi:
    - Refund penuh
    - Refund sebagian (input nominal)
    - Tolak komplain (release)
  - field “catatan admin”

## 9. Cron / Otomasi Deadline

Tambah cron mirip marketplace untuk auto-escalate:
- Jika `RekberComplaint.status = OPEN` dan `sellerDeadline < now`:
  - set status `ESCALATED`, set `escalatedAt = now`

Catatan: sistem cron sudah memiliki pola `GET /api/cron/*`. Rekber complaint cron dapat dibuat sebagai route baru misalnya:
- `GET /api/cron/rekber-complaint-deadlines`

## 10. Logging & Audit

Log event (reuse activity log pattern):
- `rekber.complaint_filed`
- `rekber.complaint_seller_responded`
- `rekber.complaint_escalated`
- `rekber.complaint_resolved` (with resolution)

## 11. Security & Validasi

- Ownership checks:
  - buyer hanya bisa akses rekber miliknya
  - seller hanya bisa respond pada rekber yang ia jual
- Rate-limit:
  - (opsional) batasi komplain per user per hari
- Media validation:
  - type/mime allowlist & size limit mengikuti marketplace complaint media.

## 12. Migrasi & Backward Compatibility

- `RekberTransaction` yang sudah `DISPUTED` saat ini (legacy) dapat:
  - Tidak otomatis punya `RekberComplaint`
  - Ditangani manual oleh Admin via halaman rekber existing (sementara)
  - (Opsional) Tool admin untuk “buat komplain dari dispute legacy” (out of scope v1)

## 13. Uji / Acceptance Criteria

- Sidebar user/admin/teknisi menampilkan menu Rekber sesuai role.
- Teknisi dapat melihat rekber sebagai seller (list).
- Buyer dapat mengajukan komplain rekber dari status HELD dengan minimal 1 foto + 1 video.
- Seller dapat merespons sebelum deadline.
- Buyer dapat eskalasi setelah seller respons.
- Admin melihat antrian komplain rekber (ESCALATED) dan dapat resolve (refund/release) dengan UI mirip komplain marketplace.
- Cron auto-escalate bekerja saat deadline seller lewat.

