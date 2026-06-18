# Marketplace

> Catatan: SeedAccount, RoleMatrix, dan DefaultTestData dirujuk dari [00-overview.md](./00-overview.md).

## Ringkasan

Domain Marketplace mencakup siklus hidup penjualan produk dari listing teknisi hingga pengiriman dan konfirmasi pembeli. Alur utama: USER browse listing → tambah ke cart → checkout dengan saldo wallet → TEKNISI menerima order, kirim resi → tracking via BinderByte → barang sampai → USER konfirmasi → dana settle ke saldo TEKNISI.

Order memiliki state machine: `PAID → SHIPPED → DELIVERED → COMPLETED` (atau `CANCELLED` / `REFUNDED` di jalur error). Saat checkout, saldo USER langsung di-debit dan ditahan; settlement ke wallet TEKNISI terjadi saat order menjadi `COMPLETED`.

## Cakupan Test

- Core Flow (DetailedTestCase): browse listing, add-to-cart, checkout via wallet, transisi PAID→SHIPPED→DELIVERED→COMPLETED, input tracking number, review produk, lihat detail order.
- Edge Flow (GWTChecklist): concurrent checkout dengan stok 1, stok 0, harga ≤ 0, alamat kosong, payload tanpa item, akses unauthenticated.
- RBAC: USER tidak boleh akses endpoint TEKNISI/ADMIN order.

## Detailed Test Cases

### FT-MKT-001 — Browse listing publik
- **Role**: Guest
- **Priority**: P0
- **Preconditions**: Database ter-seed (≥ 2 produk APPROVED milik teknisi seed `ahmad` dan `budi`)
- **Test Data**: produk seed (`iPhone 13 Pro Max - Second`, `Samsung S21 Ultra - Refurbished`)
- **Steps**:
  1. Buka `/marketplace` tanpa login
  2. Scroll daftar produk
  3. Klik salah satu produk
- **Expected Result**:
  - Daftar produk publik tampil dengan harga, foto, rating, dan nama toko
  - Hanya produk dengan `listingStatus = APPROVED` dan `isPublished = true` yang tampil
  - Detail produk tampil tanpa harus login
- **Postconditions**: counter `views` produk bertambah
- **References**: `src/app/api/marketplace/products/route.ts`, `src/app/marketplace/page.tsx`

### FT-MKT-002 — Tambah produk ke cart
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Login sebagai `siti@gmail.com`
  - Cart kosong (atau lakukan reset cart)
- **Test Data**: produk `iPhone 13 Pro Max - Second` (Rp 8.500.000)
- **Steps**:
  1. Buka detail produk
  2. Klik "Tambah ke Cart"
  3. Buka `/cart`
- **Expected Result**:
  - CartContext menyimpan item baru (in-memory + localStorage atau DB)
  - Halaman `/cart` menampilkan item dengan harga & subtotal benar
- **Postconditions**: cart memuat 1 item
- **References**: `src/contexts/cart-context.tsx`

### FT-MKT-003 — Checkout marketplace via wallet
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Login sebagai `siti@gmail.com` (saldo Rp 9.000.000)
  - Cart berisi `iPhone 13 Pro Max - Second` (Rp 8.500.000)
  - Alamat pengiriman terisi
- **Test Data**:
  - `productId`: dari seed
  - `quantity`: 1
  - `shippingAddress`: alamat default user1
- **Steps**:
  1. Buka `/cart`
  2. Pilih payment method `Wallet`
  3. Pastikan alamat pengiriman benar
  4. Klik tombol "Checkout"
- **Expected Result**:
  - POST ke `/api/marketplace/checkout` dengan payload `{ items: [{ productId, quantity }] }` mengembalikan `{ success: true, data: { orderId, orderCode } }`
  - Order baru status `PAID`, items terkait tercipta
  - Saldo `siti` berkurang sebesar harga + ongkir (jika ada)
  - WalletLedger entry `DEBIT` tercipta untuk USER, hold untuk TEKNISI
  - Stok produk berkurang sesuai quantity
- **Postconditions**:
  - Order tampil di `/user/orders` (status PAID) dan `/teknisi/orders` (status PAID, butuh proses)
- **References**: `src/lib/marketplace-checkout.ts`, `src/lib/marketplace-wallet.ts`, `src/app/api/marketplace/checkout/route.ts`

### FT-MKT-004 — TEKNISI menyetujui order & input resi
- **Role**: TEKNISI
- **Priority**: P0
- **Preconditions**:
  - Login sebagai `ahmad@indoteknizi.com`
  - Ada order status `PAID` dari USER (lihat FT-MKT-003)
- **Test Data**:
  - Kurir: `JNE`
  - Tracking number: `JNE9876543210`
- **Steps**:
  1. Buka `/teknisi/orders`
  2. Klik order target
  3. Klik "Proses & Kirim"
  4. Pilih kurir, masukkan tracking number
  5. Klik "Simpan"
- **Expected Result**:
  - Order status berubah `PAID → SHIPPED`
  - Field `shippingCourier`, `trackingNumber`, `shippedAt` terisi
  - `trackingActive = true` (mengaktifkan polling BinderByte)
  - Notifikasi platform muncul untuk USER
- **Postconditions**:
  - OrderTrackingEvent mulai terkumpul saat scheduler jalan
- **References**: `src/lib/marketplace-orders.ts`, `src/app/api/teknisi/orders/[id]/ship/...`, `src/lib/order-tracking-scheduler.ts`

### FT-MKT-005 — Tracking otomatis update status DELIVERED
- **Role**: TEKNISI / sistem
- **Priority**: P1
- **Preconditions**:
  - Order milik `siti` ↔ `ahmad` status `SHIPPED` dengan tracking number aktif
  - BinderByte API key valid (atau mock di dev)
- **Steps**:
  1. Tunggu polling worker (interval default ~15 menit) atau trigger manual via `/api/cron/order-tracking`
  2. BinderByte mengembalikan status `DELIVERED`
- **Expected Result**:
  - Worker memanggil BinderByte → mendapat event terbaru
  - Order ter-update: `trackingSummaryStatus = DELIVERED`, `trackingLastEventAt`
  - Status order beralih ke `DELIVERED`
- **Postconditions**:
  - User mendapat notifikasi paket tiba
- **References**: `src/lib/binderbyte-client.ts`, `src/lib/order-tracking-worker.ts`, `src/lib/order-tracking-scheduler.ts`

### FT-MKT-006 — USER konfirmasi penerimaan & order COMPLETED
- **Role**: USER
- **Priority**: P0
- **Preconditions**:
  - Login sebagai `siti@gmail.com`
  - Order status `DELIVERED`
- **Steps**:
  1. Buka `/user/orders`
  2. Klik order target
  3. Klik "Konfirmasi Diterima"
- **Expected Result**:
  - Order status `DELIVERED → COMPLETED`
  - `ensureMarketplaceOrderSettlement` jalan: WalletLedger `EARNING` di-create untuk TEKNISI sebesar harga (potong fee jika ada)
  - Saldo TEKNISI bertambah (verifikasi via `/teknisi/wallet` atau Prisma Studio)
  - Kolom `completedAt` terisi
- **Postconditions**:
  - Order tidak lagi muncul di tab "Aktif" USER, masuk ke "Riwayat"
  - TEKNISI dapat lihat earning di dashboard wallet
- **References**: `src/lib/marketplace-wallet.ts` (ensureMarketplaceOrderSettlement)

### FT-MKT-007 — USER review produk yang sudah diterima
- **Role**: USER
- **Priority**: P1
- **Preconditions**:
  - Login sebagai `siti@gmail.com`
  - Order status `COMPLETED` (FT-MKT-006)
  - Belum pernah review
- **Test Data**:
  - Rating: 5
  - Comment: `Produk sesuai deskripsi, kondisi mulus.`
- **Steps**:
  1. Buka detail order COMPLETED
  2. Klik "Beri Review"
  3. Isi rating bintang + comment
  4. Submit
- **Expected Result**:
  - Review tersimpan, `reviewCount` produk +1, `rating` produk dihitung ulang (avg)
  - Review tampil di halaman detail produk publik
- **Postconditions**:
  - Tombol review berubah jadi "Review terkirim"
- **References**: `src/app/api/marketplace/products/[id]/reviews/...`

### FT-MKT-008 — Lihat detail order dengan tracking timeline
- **Role**: USER
- **Priority**: P1
- **Preconditions**:
  - Order seed `ORD-2026-000001` (status COMPLETED) milik `siti`
- **Steps**:
  1. Login sebagai `siti@gmail.com`
  2. Buka `/user/orders/ORD-2026-000001`
- **Expected Result**:
  - Detail order tampil: produk, jumlah, total, status COMPLETED
  - Timeline tracking 7 event tampil (dari "Paket diambil kurir" → "Paket diterima")
  - Tombol "Beri Review" tersedia (atau "Review terkirim" jika sudah)
- **Postconditions**: tidak ada
- **References**: `src/app/api/user/orders/[code]/...`, `src/components/orders/...`

## Negative Scenarios (GWTChecklist)

### FT-MKT-101 — Checkout dengan stok 0 ditolak [NEGATIVE]
- **Given**: USER `siti@gmail.com` login dan saldo cukup; produk target memiliki `stock = 0`
- **When**: USER menekan tombol Checkout pada produk tersebut
- **Then**: Sistem menolak dengan `{ success: false, error: "Stok tidak mencukupi", code: "OUT_OF_STOCK" }` HTTP 400, tidak ada Order yang tercipta, saldo USER tidak berubah

### FT-MKT-102 — Checkout dengan saldo wallet kurang ditolak [NEGATIVE]
- **Given**: USER `dewi@gmail.com` login (saldo Rp 100.000); produk seed `iPhone 13 Pro Max - Second` (Rp 8.500.000)
- **When**: USER menekan Checkout dengan payment method Wallet
- **Then**: Sistem menolak dengan `{ success: false, error: "Saldo tidak cukup" }` HTTP 400, tidak ada Order tercipta, stok produk tidak berkurang

### FT-MKT-103 — Checkout payload tanpa items ditolak [NEGATIVE]
- **Given**: USER login
- **When**: POST `/api/marketplace/checkout` dengan body `{ items: [] }` atau `{}`
- **Then**: Validasi Zod gagal, response `{ success: false, error: <pesan zod> }` HTTP 400

### FT-MKT-104 — Checkout tanpa alamat pengiriman ditolak [NEGATIVE]
- **Given**: USER login dengan alamat default kosong
- **When**: USER lanjut ke checkout dengan field alamat tujuan kosong
- **Then**: Validasi gagal, UI menampilkan error pada field alamat, request tidak dikirim atau ditolak HTTP 400 di server

### FT-MKT-105 — Checkout produk dengan listingStatus PENDING ditolak [NEGATIVE]
- **Given**: Produk `Unlock Tool Premium License` (listingStatus PENDING, isPublished false) ada di seed
- **When**: USER langsung POST checkout dengan `productId` dari produk PENDING
- **Then**: Sistem menolak HTTP 400/404 dengan pesan "Produk tidak tersedia"

## Edge Cases (GWTChecklist)

### FT-MKT-201 — Concurrent checkout pada produk stok 1 [EDGE]
- **Given**: Produk dengan `stock = 1`; USER1 dan USER2 keduanya punya saldo cukup; keduanya login di tab/browser berbeda
- **When**: USER1 dan USER2 menekan tombol Checkout pada produk yang sama dalam selisih < 100 ms
- **Then**: Hanya satu Order PAID yang berhasil tercipta dengan status `PAID`; permintaan kedua ditolak `{ success: false, error: "Stok tidak mencukupi", code: "OUT_OF_STOCK" }` HTTP 409, dan saldo USER yang gagal tidak berubah (transaksi atomik via Prisma `$transaction`)

### FT-MKT-202 — TEKNISI input tracking number duplikat / format invalid [EDGE]
- **Given**: Order status `SHIPPED` dengan trackingNumber sudah terisi
- **When**: TEKNISI mencoba submit tracking number lagi dengan nilai berbeda
- **Then**: Sistem menolak update karena status order tidak boleh re-ship, atau update dibolehkan namun event tracking baru di-log dengan flag manual override (verifikasi di kode)

## RBAC Enforcement

### FT-MKT-901 — USER akses endpoint TEKNISI orders ditolak [RBAC]
- **Given**: USER `siti@gmail.com` login
- **When**: USER POST `/api/teknisi/orders/[id]/ship` dengan payload tracking valid
- **Then**: Response HTTP 403 `{ success: false, error: "Forbidden" }`, tidak ada perubahan status order

### FT-MKT-902 — TEKNISI akses order USER lain ditolak [RBAC]
- **Given**: TEKNISI `budi` login; ada order milik teknisi `ahmad` (sellerId = ahmad)
- **When**: `budi` mencoba GET / PATCH order milik `ahmad` via `/api/teknisi/orders/[id]/...`
- **Then**: Response HTTP 403, order tidak terbaca/diubah

## Catatan QA

- Checkout & wallet: `src/lib/marketplace-checkout.ts`, `src/lib/marketplace-wallet.ts`, `src/lib/marketplace-orders.ts`
- API endpoint: `src/app/api/marketplace/products/`, `src/app/api/marketplace/checkout/`, `src/app/api/user/orders/`, `src/app/api/teknisi/orders/`
- Tracking: `src/lib/binderbyte-client.ts`, `src/lib/order-tracking-worker.ts`, `src/lib/order-tracking-scheduler.ts`
- State machine order: PAID → SHIPPED → DELIVERED → COMPLETED (cancel/refund jalur error)
