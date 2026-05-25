# Brainstorming: Layanan Inspeksi Produk (Inspection Service)

**Tanggal:** 23 Mei 2026  
**Tujuan:** Merancang layanan inspeksi untuk membantu pembeli mengecek kondisi HP/Laptop sebelum membeli

---

## 1. Konsep Inti

### Problem Statement
- Pembeli online tidak bisa melihat kondisi fisik produk secara langsung
- Khawatir membeli produk rusak atau tidak sesuai deskripsi
- Tidak memiliki keahlian teknis untuk mengecek kondisi HP/Laptop
- Perlu jaminan keaslian dan kondisi sebelum transaksi
- Pembeli membeli dari berbagai platform (Tokopedia, Shopee, OLX, private seller, dll)

### Solusi
Layanan inspeksi profesional dari teknisi terverifikasi yang dapat:
- Melakukan inspeksi **offline** (langsung ke lokasi pembeli/penjual)
- Melakukan inspeksi **online** (via video call dengan panduan)
- Memberikan laporan tertulis/video hasil inspeksi
- Menjadi mediator kepercayaan antara pembeli dan penjual
- **Bekerja untuk barang dari mana saja** (tidak terbatas marketplace INDOTEKNIZII)

---

## 2. Tipe Inspeksi

### 2.1 Inspeksi Offline (On-Site)
**Deskripsi:** Teknisi datang ke lokasi untuk inspeksi langsung

**Alur:**
1. Pembeli request inspeksi → pilih lokasi & waktu
2. Sistem matching dengan teknisi terdekat
3. Teknisi datang ke lokasi (rumah pembeli/penjual/tempat transaksi)
4. Inspeksi dilakukan dengan checklist standar
5. Laporan + foto/video diberikan
6. Pembeli bisa lanjut transaksi atau batal

**Keuntungan:**
- Akurat dan detail
- Bisa cek fisik langsung
- Bisa test performa real-time
- Pembeli lebih percaya

**Tantangan:**
- Biaya lebih tinggi (travel + waktu)
- Perlu koordinasi jadwal
- Teknisi perlu asuransi/liability

---

### 2.2 Inspeksi Online (Video Call)
**Deskripsi:** Teknisi membimbing pembeli via video call untuk inspeksi mandiri

**Alur:**
1. Pembeli request inspeksi online
2. Sistem assign teknisi tersedia
3. Jadwalkan video call
4. Teknisi membimbing pembeli step-by-step
5. Pembeli follow instruksi, teknisi observe
6. Laporan dikirim via chat/email
7. Pembeli bisa tanya-jawab real-time

**Keuntungan:**
- Biaya lebih murah
- Fleksibel waktu
- Pembeli bisa lihat sendiri
- Teknisi bisa handle banyak request

**Tantangan:**
- Akurasi tergantung pembeli
- Tidak bisa cek fisik detail
- Perlu pembeli kooperatif

---

## 3. Fitur & Komponen Layanan

### 3.1 Checklist Inspeksi Standar

#### Untuk Smartphone:
- [ ] Kondisi fisik (body, layar, tombol)
- [ ] Fungsi layar (brightness, touch responsiveness)
- [ ] Kamera (depan & belakang)
- [ ] Speaker & microphone
- [ ] Baterai (kapasitas, kesehatan)
- [ ] Port charging & audio
- [ ] Sensor (proximity, accelerometer, dll)
- [ ] Konektivitas (WiFi, Bluetooth, signal)
- [ ] Performa (speed test, app launch)
- [ ] Keaslian (IMEI check, serial number)

#### Untuk Laptop:
- [ ] Kondisi fisik (body, layar, keyboard)
- [ ] Layar (brightness, dead pixels, color accuracy)
- [ ] Keyboard & trackpad
- [ ] Port (USB, HDMI, audio jack)
- [ ] Baterai (kapasitas, kesehatan)
- [ ] Performa (CPU/GPU benchmark)
- [ ] Storage (kapasitas, kecepatan)
- [ ] Kamera & microphone
- [ ] Konektivitas (WiFi, Bluetooth)
- [ ] Keaslian (serial number, OS license)

### 3.2 Laporan Inspeksi
**Format:** PDF + Video (opsional)

**Isi:**
- Ringkasan kondisi (Excellent/Good/Fair/Poor)
- Detail checklist dengan foto
- Rekomendasi (Layak beli / Perlu negosiasi / Tidak layak)
- Saran perbaikan (jika ada)
- Sertifikat inspeksi (dengan nomor referensi)
- Tanda tangan digital teknisi

### 3.3 Rating & Review
- Pembeli bisa rate teknisi (1-5 bintang)
- Teknisi bisa rate pembeli (1-5 bintang)
- Review tertulis untuk transparansi

---

## 4. Alur User Journey

### 4.1 Pembeli (Customer)

```
1. Browse Marketplace
   ↓
2. Lihat Produk yang Menarik
   ↓
3. Klik "Request Inspeksi" (tombol di detail produk)
   ↓
4. Pilih Tipe Inspeksi (Offline / Online)
   ↓
5. Isi Detail Request:
   - Lokasi (untuk offline)
   - Waktu preferensi
   - Catatan khusus
   - Metode pembayaran
   ↓
6. Lihat Daftar Teknisi Tersedia
   ↓
7. Pilih Teknisi (lihat rating, harga, ketersediaan)
   ↓
8. Konfirmasi & Bayar
   ↓
9. Tunggu Inspeksi (status tracking)
   ↓
10. Terima Laporan Inspeksi
    ↓
11. Review & Keputusan (Lanjut beli / Negosiasi / Batal)
    ↓
12. Rate Teknisi
```

### 4.2 Teknisi

```
1. Dashboard Teknisi
   ↓
2. Lihat Request Inspeksi Masuk
   ↓
3. Accept/Reject Request
   ↓
4. Koordinasi dengan Pembeli (via chat)
   ↓
5. Lakukan Inspeksi (offline/online)
   ↓
6. Upload Laporan & Foto/Video
   ↓
7. Kirim Laporan ke Pembeli
   ↓
8. Terima Rating & Review
   ↓
9. Dapatkan Komisi/Bayaran
```

---

## 5. Halaman & Navigasi

### 5.1 Public Pages
- `/inspeksi` — Landing page layanan inspeksi
- `/inspeksi/how-it-works` — Cara kerja layanan
- `/inspeksi/pricing` — Harga inspeksi
- `/inspeksi/teknisi` — Daftar teknisi inspeksi
- `/inspeksi/request` — Form request inspeksi (untuk barang dari mana saja)

### 5.2 User Pages
- `/user/inspeksi` — Riwayat request inspeksi
- `/user/inspeksi/request` — Form request inspeksi baru
- `/user/inspeksi/[id]` — Detail laporan inspeksi
- `/user/inspeksi/[id]/chat` — Chat dengan teknisi

### 5.3 Teknisi Pages
- `/teknisi/inspeksi` — Dashboard inspeksi
- `/teknisi/inspeksi/requests` — Daftar request masuk
- `/teknisi/inspeksi/[id]` — Detail request & form laporan
- `/teknisi/inspeksi/[id]/report` — Upload laporan
- `/teknisi/inspeksi/history` — Riwayat inspeksi

### 5.4 Admin Pages
- `/admin/inspeksi` — Monitoring inspeksi
- `/admin/inspeksi/requests` — Approval request
- `/admin/inspeksi/teknisi` — Manajemen teknisi inspeksi
- `/admin/inspeksi/reports` — Review laporan
- `/admin/inspeksi/disputes` — Penanganan dispute

---

## 6. Integrasi dengan Marketplace

### 6.1 Tombol di Detail Produk
```
[Beli Sekarang] [Chat Penjual] [Request Inspeksi] [Wishlist]
```

**Catatan:** Tombol "Request Inspeksi" hanya muncul untuk produk dari marketplace INDOTEKNIZII. Untuk barang dari platform lain, pembeli bisa request inspeksi dari halaman `/inspeksi/request` atau `/user/inspeksi/request`.

### 6.2 Workflow Marketplace + Inspeksi (INDOTEKNIZII)
```
Pembeli lihat produk INDOTEKNIZII
    ↓
Request Inspeksi (opsional)
    ↓
Terima Laporan Inspeksi
    ↓
Putuskan untuk Beli
    ↓
Checkout & Pembayaran
    ↓
Pengiriman
```

### 6.3 Workflow Inspeksi Standalone (Barang dari Platform Lain)
```
Pembeli buka halaman /inspeksi/request
    ↓
Isi detail barang (brand, model, kondisi, lokasi)
    ↓
Pilih tipe inspeksi (offline/online)
    ↓
Pilih teknisi
    ↓
Bayar
    ↓
Inspeksi dilakukan
    ↓
Terima laporan
    ↓
Gunakan laporan untuk negosiasi/keputusan beli
```

### 6.4 Integrasi Rekber
- Pembayaran inspeksi bisa via rekber
- Jika pembeli tidak puas dengan laporan → dispute
- Admin mediasi & refund jika perlu

---

## 7. Pricing Model

### 7.1 Harga Inspeksi
| Tipe | Kategori | Harga |
|------|----------|-------|
| Offline | Smartphone | Rp 150.000 - 300.000 |
| Offline | Laptop | Rp 250.000 - 500.000 |
| Online | Smartphone | Rp 50.000 - 100.000 |
| Online | Laptop | Rp 100.000 - 200.000 |

### 7.2 Komisi Platform
- Platform ambil 20-30% dari biaya inspeksi
- Teknisi dapat 70-80%

### 7.3 Paket Bundling (Opsional)
- Paket 5 inspeksi: diskon 10%
- Paket 10 inspeksi: diskon 15%

---

## 8. Fitur Tambahan

### 8.1 Sertifikasi Teknisi Inspeksi
- Teknisi harus lulus training khusus
- Badge "Certified Inspector" di profil
- Hanya teknisi terverifikasi yang bisa terima request

### 8.2 Garansi Inspeksi
- Jika laporan tidak akurat → refund
- Jika produk rusak setelah inspeksi → claim
- Asuransi untuk teknisi

### 8.3 Video Inspeksi
- Teknisi bisa upload video inspeksi
- Pembeli bisa lihat proses inspeksi
- Transparansi penuh

### 8.4 Notifikasi Real-Time
- Pembeli notif saat teknisi accept request
- Pembeli notif saat inspeksi dimulai
- Pembeli notif saat laporan siap

### 8.5 Dispute Resolution
- Jika pembeli tidak puas dengan laporan
- Admin review laporan & bukti
- Mediasi antara pembeli & teknisi
- Refund atau kompensasi

---

## 9. Data Model (Prisma Schema)

```prisma
model InspectionService {
  id                String    @id @default(cuid())
  type              String    // "offline" | "online"
  category          String    // "smartphone" | "laptop"
  status            String    // "pending" | "accepted" | "in_progress" | "completed" | "cancelled"
  
  // Pembeli & Teknisi
  userId            String
  user              User      @relation("InspectionRequests", fields: [userId], references: [id])
  teknisiId         String
  teknisi           TeknisiProfile @relation("InspectionServices", fields: [teknisiId], references: [id])
  
  // Detail Request
  productId         String?   // Link ke produk marketplace INDOTEKNIZII (opsional)
  productName       String
  productBrand      String
  productModel      String
  productSource     String?   // "indoteknizii" | "tokopedia" | "shopee" | "olx" | "private" | "other"
  productSourceUrl  String?   // URL produk di platform lain (opsional)
  notes             String?
  
  // Lokasi & Waktu
  location          String    // Untuk offline
  preferredDateTime DateTime
  actualDateTime    DateTime?
  
  // Harga
  price             Int       // Dalam rupiah
  platformFee       Int
  teknisiFee        Int
  paymentStatus     String    // "pending" | "paid" | "refunded"
  
  // Laporan
  reportId          String?
  report            InspectionReport? @relation("InspectionServiceReport")
  
  // Rating
  ratingByUser      Int?      // 1-5
  ratingByTeknisi   Int?      // 1-5
  reviewByUser      String?
  reviewByTeknisi   String?
  
  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  completedAt       DateTime?
}

model InspectionReport {
  id                String    @id @default(cuid())
  inspectionId      String    @unique
  inspection        InspectionService @relation("InspectionServiceReport", fields: [inspectionId], references: [id])
  
  // Hasil Inspeksi
  overallCondition  String    // "excellent" | "good" | "fair" | "poor"
  recommendation    String    // "recommended" | "negotiate" | "not_recommended"
  
  // Checklist
  checklistData     Json      // Simpan hasil checklist
  
  // Foto & Video
  photos            String[]  // Array URL foto
  videoUrl          String?   // URL video inspeksi
  
  // Catatan
  findings          String    // Temuan detail
  suggestions       String?   // Saran perbaikan
  
  // Sertifikat
  certificateNumber String    @unique
  certificateUrl    String
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

model InspectionCertification {
  id                String    @id @default(cuid())
  teknisiId         String    @unique
  teknisi           TeknisiProfile @relation("InspectionCertification", fields: [teknisiId], references: [id])
  
  // Sertifikasi
  isVerified        Boolean   @default(false)
  certificationDate DateTime?
  expiryDate        DateTime?
  
  // Statistik
  totalInspections  Int       @default(0)
  averageRating     Float     @default(0)
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

---

## 10. Keuntungan Bisnis

### Untuk Platform
- Revenue baru dari komisi inspeksi
- Meningkatkan kepercayaan pembeli (tidak hanya di INDOTEKNIZII, tapi di seluruh ekosistem)
- Diferensiasi dari kompetitor
- Data inspeksi untuk quality control
- **Positioning sebagai "trusted inspection service" untuk seluruh marketplace**
- Potensi partnership dengan marketplace lain (Tokopedia, Shopee, OLX)

### Untuk Teknisi
- Revenue stream baru
- Fleksibel (offline/online)
- Bisa handle banyak request
- Meningkatkan kredibilitas
- Exposure ke pembeli dari berbagai platform

### Untuk Pembeli
- Lebih percaya diri membeli (dari mana saja)
- Transparansi penuh
- Perlindungan dari produk rusak
- Negosiasi lebih kuat
- **Bisa gunakan untuk barang dari platform manapun**

### Untuk Penjual
- Produk lebih mudah terjual
- Kepercayaan pembeli meningkat
- Kompetitif dengan penjual lain

---

## 11. Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Teknisi tidak akurat | Training, sertifikasi, rating system |
| Pembeli tidak puas | Dispute resolution, refund policy |
| Liability asuransi | Asuransi untuk teknisi, terms & conditions |
| Kompetisi dengan teknisi lokal | Fokus pada marketplace, value-add |
| Fraud (teknisi/pembeli) | Verification, audit trail, activity log |

---

## 12. Roadmap Implementasi

### Phase 1 (MVP)
- [ ] Data model & database
- [ ] API endpoints (CRUD inspection service)
- [ ] UI untuk request inspeksi (user)
- [ ] Dashboard teknisi (accept/reject)
- [ ] Form laporan inspeksi
- [ ] Basic rating system

### Phase 2 (Enhancement)
- [ ] Video call integration (untuk online)
- [ ] Photo upload & storage
- [ ] PDF report generation
- [ ] Sertifikasi teknisi
- [ ] Dispute resolution flow

### Phase 3 (Advanced)
- [ ] AI-powered checklist recommendation
- [ ] Analytics & insights
- [ ] Mobile app support
- [ ] Integration dengan payment gateway
- [ ] Asuransi & warranty management

---

## 14. Implementation Status (Phase 1 — Teknisi Opt-in + Pricing)

✅ **Selesai (Phase 1a — Opt-in Toggle):**
- Field `providesInspection` (Boolean) ditambahkan ke `TeknisiProfile` (default `false`)
- Migration: `20260524100000_add_teknisi_provides_inspection`
- API `PATCH /api/teknisi/profile` menerima field `providesInspection`
- Komponen `<InspectionBadge />` — badge "Bisa Inspeksi" modern (gradien teal/cyan, shimmer animation, shield icon)
- Komponen `<InspectionServiceToggle />` — toggle modern di settings teknisi (gradient glow, animated switch, perks list collapsible)
- Filter "Bisa Inspeksi" di halaman `/teknisi`

✅ **Selesai (Phase 1b — Pricing & Display):**
- Field `inspectionPriceOnline` (Decimal nullable) ditambahkan ke `TeknisiProfile`
- Field `inspectionPriceOffline` (Decimal nullable) ditambahkan ke `TeknisiProfile`
- Migration: `20260524110000_add_inspection_pricing`
- Toggle settings extended dengan dua input harga (Online via video call, Offline on-site) dengan formatter rupiah
- API `PATCH /api/teknisi/profile` menerima `inspectionPriceOnline` & `inspectionPriceOffline` (Zod validated, max 50jt)
- Auto-clear harga inspeksi ketika toggle dimatikan (tidak menyimpan harga jika layanan dimatikan)
- `TeknisiConsultationService` type extended dengan `kind: 'consultation' | 'inspection-online' | 'inspection-offline'`
- Helper `buildTeknisiInspectionServices()` & `buildTeknisiAllServices()` di `konsultasi-services.ts`
- Section "Bandingkan & Pilih" sekarang menampilkan inspeksi sebagai **sub-section terpisah** dengan:
  - Header teal dengan ikon Shield + label "Layanan Inspeksi" + chip "Baru"
  - Background gradient teal/cyan halus
  - `InspectionServiceRow` dengan tipografi konsisten (number + tag pill "INSPEKSI")
  - Meta items berbeda: Video call / On-site, Laporan kondisi
  - CTA "Pesan inspeksi" dengan styling teal
  - Title section auto-update jadi "Layanan Konsultasi & Inspeksi" jika ada inspeksi

**Tampilan akhir:**
- Tarif teknisi di settings: input rupiah dengan formatter (Rp 1.000.000)
- Profil publik: section "Bandingkan & Pilih" sekarang punya 2 grup — Konsultasi (atas) + Inspeksi (bawah)
- Card listing teknisi: badge "Bisa Inspeksi" muncul di samping badge Top/Verified
- Filter "Bisa Inspeksi" di `/teknisi` untuk filter teknisi yang menyediakan layanan

**Default behavior:**
- Tarif kosong (`null`) berarti "tidak ditawarkan" — row tidak muncul di profil publik
- Misal teknisi hanya set `inspectionPriceOnline` saja, hanya 1 row inspection muncul
- Semua teknisi default `providesInspection = false` (opt-in eksplisit di settings)

✅ **Selesai (Phase 1c — Routing ke Form Inspeksi):**
- Klik "Pesan inspeksi" di section "Bandingkan & Pilih" → redirect ke `/user/inspeksi/baru` dengan query params:
  - `teknisiId={id}` — teknisi pre-selected
  - `mode=ONLINE|OFFLINE` — jenis inspeksi pre-selected
- Jika user belum login → redirect ke `/login?callbackUrl=...` dulu, lalu kembali ke form inspeksi setelah login
- `KonsultasiBookingDialog` sekarang hanya menampilkan layanan konsultasi (filter `kind === 'consultation'`) supaya tidak ada duplikasi pilihan inspeksi
- `InspectionCreateForm` parsing query `mode` untuk auto-select jenis inspeksi yang dipilih user di profil teknisi

**Flow Lengkap:**
```
User di profil teknisi
    ↓ klik "Pesan inspeksi" (online/offline)
Cek auth?
    → belum login → /login?callbackUrl=/user/inspeksi/baru?teknisiId=...&mode=...
    → sudah login → /user/inspeksi/baru?teknisiId=...&mode=...
    ↓ form pre-filled (teknisi + mode)
User isi: nama produk, sumber, lokasi (offline), catatan
    ↓ submit
POST /api/user/inspeksi → potong saldo + buat record
    ↓ redirect
/user/inspeksi/[id] (detail status)
```



1. **Scope Produk:** Hanya HP & Laptop, atau juga kategori lain (tablet, smartwatch)?
2. **Pricing:** Harga fixed atau teknisi bisa set harga sendiri?
3. **Sertifikasi:** Semua teknisi bisa atau hanya yang terverifikasi?
4. **Video Call:** Pakai platform mana? (Zoom, Google Meet, custom?)
5. **Liability:** Siapa yang bertanggung jawab jika ada kerusakan saat inspeksi?
6. **Timeline:** Kapan target launch?
7. **Partnership:** Mau approach marketplace lain (Tokopedia, Shopee, OLX) untuk co-marketing?
8. **Verifikasi Barang:** Bagaimana cara verifikasi bahwa barang yang diinspeksi sesuai dengan deskripsi pembeli?

---

**Status:** Draft untuk diskusi  
**Next Step:** Refinement berdasarkan feedback
