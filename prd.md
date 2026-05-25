# PRD — IndoTeknizi Redesign Foundation (Architecture-First)

## 1. Product Overview
IndoTeknizi adalah platform ekosistem teknisi dengan tiga pilar utama:
- **Commerce:** marketplace produk/layanan teknisi dan transaksi topup.
- **Service:** konsultasi, remote assistance, serta order IMEI/server service.
- **Operations:** dashboard role-based untuk user, teknisi, dan admin.

Dokumen ini menjadi pondasi redesign dari nol dengan fokus pada:
- struktur aplikasi,
- arsitektur modul,
- peta halaman,
- kontrak API dan domain data.

Dokumen ini **tidak membahas** keputusan visual (warna, tema, style UI).

## 2. Redesign Goals
1. Menata ulang platform sebagai **modular monolith** yang jelas boundary antar-domain.
2. Menyederhanakan navigasi lintas role (User, Teknisi, Admin) tanpa mengorbankan kontrol akses.
3. Menstandarkan kontrak API agar konsisten untuk web app dan potensi mobile app.
4. Menjadikan fitur bernilai tinggi (marketplace, konsultasi, remote, wallet, topup, IMEI) sebagai domain inti yang dapat dikembangkan independen.
5. Menyiapkan fondasi observability dan auditability untuk transaksi dan aktivitas sensitif.

## 3. Current Technical Baseline (As-Is)
- **Frontend Framework:** Next.js App Router.
- **Runtime:** Node.js (server runtime) + Edge-safe auth config untuk proxy RBAC.
- **Auth:** Auth.js/NextAuth (credentials + optional 2FA TOTP).
- **ORM/DB:** Prisma + PostgreSQL.
- **State & Providers:** session, auth context, wallet, topup, cart, chat.
- **API Style:** route handlers (`/api/*`) dengan pemisahan domain per prefix.
- **Background Jobs:** scheduler in-process saat server boot (`instrumentation.ts`):
  - IMEI order polling,
  - server order polling,
  - shipping tracking sync.

## 4. Product Personas & Access Model
- **Guest/Public:** dapat mengakses landing, katalog publik, listing teknisi, lowongan, topup publik.
- **User (Customer):** dashboard user, order history, konsultasi, rekber, wallet, chat, akun.
- **Teknisi:** dashboard teknisi, manajemen profil/toko/produk, pesanan, konsultasi, remote, saldo, analitik.
- **Admin:** command center operasional, approval, user management, teknisi/toko management, transaksi, logs, konten platform, monitoring.

### RBAC Rule
- Area `/admin/*` hanya ADMIN.
- Area `/user/*` dan `/dashboard/*` hanya USER.
- Workspace private teknisi (`/teknisi/dashboard`, `/teknisi/produk`, dst.) hanya TEKNISI.
- Pelanggaran role diarahkan ke home role masing-masing.

## 5. Information Architecture (Target Sitemap)

### 5.1 Public Layer
- `/` — Landing & product positioning.
- `/marketplace`, `/marketplace/[id]` — katalog dan detail produk.
- `/shop` — kanal belanja tambahan (jika dipertahankan, satukan strategi dengan marketplace).
- `/teknisi`, `/teknisi/[id]` — listing dan profil publik teknisi.
- `/toko`, `/toko/[id]` — listing dan detail toko teknisi.
- `/lowongan`, `/lowongan/[id]` — publikasi lowongan.
- `/topup`, `/topup/[slug]`, `/topup/order/[id]`, `/topup/cek-transaksi` — topup funnel publik.
- `/rekber` — informasi/funnel rekber publik.
- `/remote` — entry publik remote service.
- `/chat` — entry komunikasi umum (jika masih dibutuhkan secara publik).
- `/imei`, `/imei/orders` — katalog dan riwayat IMEI public-facing.
- `/login`, `/register` — autentikasi.

### 5.2 User Workspace
- `/user/dashboard` — ringkasan aktivitas user.
- `/user/orders`, `/user/orders/[id]` — order marketplace user.
- `/user/history`, `/user/riwayat` — riwayat lintas layanan (target redesign: konsolidasi satu route).
- `/user/konsultasi` — sesi konsultasi dengan teknisi.
- `/user/rekber` — transaksi rekber user.
- `/user/chat` — inbox/chat.
- `/user/saldo` — wallet balance.
- `/user/akun`, `/user/settings` — profil, keamanan, preferensi (target redesign: konsolidasi).
- `/user/help` — bantuan role user.

### 5.3 Teknisi Workspace
- `/teknisi/dashboard` — ringkasan operasional teknisi.
- `/teknisi/produk` — CRUD produk/jasa teknisi.
- `/teknisi/pesanan` — order processing.
- `/teknisi/toko` — profil toko teknisi.
- `/teknisi/profil` — profil profesional teknisi.
- `/teknisi/konsultasi` — manajemen sesi konsultasi.
- `/teknisi/remote` — manajemen sesi remote.
- `/teknisi/chat` — percakapan dengan user.
- `/teknisi/saldo` — wallet teknisi.
- `/teknisi/analitik` — performa dan metrik.
- `/teknisi/settings` — pengaturan akun/keamanan.
- `/teknisi/help` — bantuan role teknisi.

### 5.4 Admin Workspace
- `/admin/dashboard` — command center.
- `/admin/users`, `/admin/teknisi`, `/admin/toko` — governance pelaku platform.
- `/admin/approval` — approval antrean.
- `/admin/produk`, `/admin/transactions`, `/admin/rekber`, `/admin/laporan` — kontrol transaksi & pelaporan.
- `/admin/imei`, `/admin/indodesk` — domain operasional khusus.
- `/admin/chat`, `/admin/notifications`, `/admin/banners`, `/admin/help` — komunikasi & konten.
- `/admin/monitoring`, `/admin/logs`, `/admin/management`, `/admin/settings` — observability & konfigurasi.

## 6. Domain Architecture (Bounded Context)

### 6.1 Identity & Access
- Auth.js session & JWT callbacks.
- Credentials login + optional TOTP.
- Role enforcement di proxy + server layout guard + API guard.

### 6.2 Marketplace
- Product catalog, store linking, order lifecycle, shipping tracking.
- Integrasi courier tracking (BinderByte abstraction).

### 6.3 Wallet & Ledger
- Wallet balance per user.
- Ledger transaksi immutable sebagai source of truth finansial.
- Dipakai lintas domain: topup, rekber, pembayaran, refund, earning.

### 6.4 Rekber (Escrow)
- Hold/release/refund/dispute flow.
- Admin resolution path sebagai mediator.

### 6.5 Topup
- Catalog product + denomination.
- Checkout + status order fulfillment.
- Guest checkout dan user-linked checkout.

### 6.6 Service Layer (Konsultasi & Remote)
- Session lifecycle, assignment user-teknisi, status transitions.
- Chat conversation sebagai kanal komunikasi utama.

### 6.7 IMEI & Server Services
- Provider API manager, service group, service catalog.
- Order submission + async polling supplier.
- Status normalization untuk dashboard/admin operations.

### 6.8 Operations & Governance
- Notifications, help articles, platform settings, banners.
- Activity log (audit trail) lintas domain.
- Monitoring channel untuk alert operasional.

## 7. Backend/API Foundation

### 7.1 API Segmentation (Current)
- `/api/admin/*` (operasional & governance admin).
- `/api/user/*` (fitur workspace user).
- `/api/teknisi/*` (fitur workspace teknisi).
- `/api/marketplace/*`, `/api/topup/*`, `/api/rekber/*`, `/api/imei/*`, `/api/chat/*`, `/api/wallet/*`.
- `/api/cron/*` untuk job trigger berbasis scheduler/cron.

### 7.2 Redesign API Rules
1. Semua response mengikuti envelope konsisten:
   - success: `{ success: true, data }`
   - error: `{ success: false, error, code? }`
2. Pisahkan endpoint query-heavy (dashboard/reporting) dari endpoint command (create/update/status change).
3. Terapkan kontrak status machine per domain (Order, Rekber, Konsultasi, Remote, IMEI, ServerOrder).
4. Validasi input terpusat (Zod) untuk seluruh mutasi.
5. Logging aktivitas pada event sensitif: auth, payment, role-change, dispute resolution.

## 8. Data Foundation (Redesign Data Model Blueprint)

### 8.1 Core Entities
- Identity: `User`, `Account`, `Session`, `VerificationToken`, `TeknisiProfile`, `TeknisiStore`.
- Commerce: `Product`, `Order`, `OrderItem`, `OrderTrackingEvent`.
- Finance: `Wallet`, `WalletLedger`, `RekberTransaction`, `TopupOrder`.
- Service: `KonsultasiSession`, `RemoteSession`, `ChatConversation`, `ChatMessage`.
- Job Board: `Lowongan`, `LowonganApplication`.
- IMEI/Server: `ImeiApi`, `ImeiServiceGroup`, `ImeiService`, `ImeiOrder`, `ServerServiceBox`, `ServerService`, `ServerOrder`.
- Platform Ops: `PlatformNotification`, `MarketplaceBanner`, `PlatformSetting`, `HelpArticle`, `IndodeskDownload`, `ActivityLog`.

### 8.2 Data Principles
1. Gunakan enum status untuk setiap lifecycle bisnis (hindari status string bebas).
2. Simpan timestamp transisi status penting (`heldAt`, `releasedAt`, `completedAt`, dll).
3. Semua transaksi keuangan wajib meninggalkan jejak di ledger.
4. Audit log tidak boleh opsional untuk action berisiko tinggi.
5. Entitas publik (produk/toko/teknisi) menggunakan kombinasi `isPublished`, `isActive`, `listingStatus`.

## 9. Runtime & Background Processing
- Scheduler dijalankan saat server start (non-edge runtime).
- Job kritikal:
  - IMEI order polling,
  - server order polling,
  - marketplace tracking sync.
- Redesign target:
  - abstraksi queue worker (siap dipindah ke worker service terpisah),
  - retry policy eksplisit,
  - dead-letter handling,
  - metrik job execution.

## 10. Non-Functional Requirements
- **Security:** RBAC ketat, password hashing, 2FA, session hardening, audit logging.
- **Reliability:** idempotent endpoint untuk payment/order status update.
- **Performance:** caching query read-heavy (catalog, dashboard summary, public listing).
- **Scalability:** domain modular, siap ekstraksi ke service terpisah pada fase lanjut.
- **Observability:** activity log + monitoring API + job telemetry.
- **Maintainability:** layer terpisah untuk serializer, validation, worker, service.

## 11. Redesign Delivery Plan (High-Level)

### Phase 1 — Foundation
- Definisikan arsitektur folder final (app, domain services, infra, shared types).
- Standarkan API response contract + error codes.
- Konsolidasi route duplikat (contoh: history/riwayat, akun/settings).

### Phase 2 — Core Flows
- Rebuild auth + role router + dashboard shell per role.
- Rebuild marketplace, wallet, rekber flow end-to-end.
- Rebuild service flow: konsultasi, remote, chat.

### Phase 3 — Advanced Ops
- Rebuild topup + IMEI + server services.
- Rebuild admin command center, monitoring, logs, content governance.
- Harden worker/scheduler architecture.

### Phase 4 — Stabilization
- Contract testing API.
- Migration script & backfill data.
- UAT lintas role + incident runbook.

## 12. Out of Scope for This PRD
- Detail visual design system (warna, typography, spacing detail).
- Micro-interaction UI.
- Copywriting final marketing content.
- Keputusan branding.

## 13. Success Criteria
1. Semua fitur inti berjalan dalam arsitektur modular dan terdokumentasi.
2. Tidak ada endpoint kritikal tanpa validasi + logging.
3. Lifecycle transaksi (order/rekber/wallet) konsisten dan dapat diaudit.
4. Navigasi role-based tidak ambigu dan bebas benturan akses.
5. Peta halaman dan domain siap dipakai tim untuk redesign dari nol.
