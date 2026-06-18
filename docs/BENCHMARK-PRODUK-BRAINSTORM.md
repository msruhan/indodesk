# Brainstorming: Fitur Benchmark / Bandingkan Produk

**Tanggal:** 6 Juni 2026
**Tujuan:** Membandingkan 2 iklan produk (handphone, tablet/iPad, laptop) berdasarkan **Kondisi, Spesifikasi, Kelengkapan, dan 3uTools** dengan algoritma penilaian yang objektif.

---

## 1. Konsep Inti

### Problem
Pembeli sering bingung memilih antara 2 unit second yang mirip. Membandingkan manual (buka 2 tab, scroll bolak-balik) itu melelahkan dan subjektif.

### Solusi
Fitur "Bandingkan" yang menempatkan 2 iklan berdampingan, lalu memberi **skor objektif per kategori** + **rekomendasi pemenang** berdasarkan rumus terukur — bukan opini.

### Scope Kategori
Hanya untuk kategori yang punya spesifikasi terukur:
- ✅ HANDPHONE → sub-kategori: **iPhone** atau **Android**
- ✅ TABLET → sub-kategori: **iPad** atau **Tablet Android**
- ✅ LAPTOP
- ❌ AKSESORIS, SOFTWARE, LAINNYA (tidak relevan untuk benchmark)

**Keputusan kategori (final):**
- Tambah enum kategori baru `TABLET` (terpisah dari HANDPHONE).
- Tambah field sub-kategori `deviceType` untuk menentukan apakah device Apple (punya 3uTools) atau bukan:

```prisma
enum ProductCategory {
  HANDPHONE
  TABLET      // BARU
  LAPTOP
  AKSESORIS
  SOFTWARE
  LAINNYA
}

enum DeviceType {
  IPHONE          // HANDPHONE + Apple → punya 3uTools
  ANDROID_PHONE   // HANDPHONE + Android
  IPAD            // TABLET + Apple → punya 3uTools
  ANDROID_TABLET  // TABLET + Android
}

// Tambahan di model Product
deviceType DeviceType?  // diisi saat kategori HANDPHONE atau TABLET
```

**Logika form upload produk:**
- Pilih kategori **HANDPHONE** → muncul field sub-kategori: `iPhone` / `Android` → set `deviceType = IPHONE | ANDROID_PHONE`
- Pilih kategori **TABLET** → muncul field sub-kategori: `iPad` / `Tablet Android` → set `deviceType = IPAD | ANDROID_TABLET`
- Pilih **LAPTOP** → tidak ada sub-kategori
- `deviceType IPHONE` atau `IPAD` → form menampilkan section 3uTools + field kesehatan hardware

**Aturan 3uTools:** Hanya `deviceType = IPHONE` atau `IPAD` yang punya pilar 3uTools. Selain itu, pilar 3uTools di-skip dan bobotnya diredistribusi.

---

## 2. Temuan Penting: Data Saat Ini Belum Cukup Objektif

Ini krusial. Algoritma objektif **butuh data terstruktur**. Mari audit field yang ada:

| Aspek | Data sekarang | Cukup untuk skor objektif? |
|-------|---------------|---------------------------|
| **Spesifikasi** | `ram`, `processor`, `storage`, `color` (string bebas) | ⚠️ Sebagian — perlu normalisasi (mis. "256GB" vs "256 GB") |
| **Kelengkapan** | `completeness[]` (enum terstruktur) | ✅ Sudah objektif |
| **Garansi** | `warranty` (NONE/OFFICIAL/STORE) | ✅ Sudah objektif |
| **Kondisi** | Hanya di `description` (free text) | ❌ Tidak terstruktur — TIDAK bisa diskor objektif |
| **3uTools** | Hanya `threeUtoolsImages[]` (gambar) | ❌ Gambar saja — sistem tidak bisa "membaca" isinya |

**Kesimpulan:** Agar penilaian objektif, kita **wajib menambah field terstruktur** untuk Kondisi dan data 3uTools. Tanpa ini, skor kondisi/3uTools hanya akan jadi tebakan.

---

## 3. Field Baru yang Diusulkan (untuk Objektivitas)

### 3.1 Kondisi — Field Terstruktur
Teknisi mengisi saat upload produk (selain deskripsi):

```prisma
// Tambahan di model Product
conditionGrade   String?   // "BNIB" | "LIKE_NEW" | "MULUS" | "NORMAL" | "MINUS"
conditionPercent Int?      // 0-100, estimasi kondisi fisik (mis. 95)
minusNotes       String?   // catatan minus (lecet, dent, dll) — opsional
```

**Grade → skor dasar:**
| Grade | Label | Skor |
|-------|-------|------|
| `BNIB` | Brand New In Box (segel) | 100 |
| `LIKE_NEW` | Like New (99%) | 90 |
| `MULUS` | Mulus (95%+) | 80 |
| `NORMAL` | Normal (tanda pakai wajar) | 65 |
| `MINUS` | Ada minus (lecet/dent) | 45 |

### 3.2 3uTools — Field Terstruktur (untuk iPhone/iPad)
Selain screenshot, teknisi input data kunci yang biasa muncul di 3uTools:

```prisma
// Tambahan di model Product (khusus device Apple)
batteryHealth      Int?      // 0-100 (mis. 89)
batteryCycle       Int?      // jumlah cycle count
isAllOriginal      Boolean?  // true = semua part original (no replaced)
replacedParts      String[]  // ["Battery", "Screen"] jika ada part diganti
trueToneActive     Boolean?  // True Tone masih aktif?
faceIdWorks        Boolean?  // Face ID normal?
verified3uTools    Boolean?  // sudah diverifikasi via screenshot 3uTools?
```

> Untuk **Android/Laptop** yang tidak punya 3uTools: aspek "3uTools" otomatis di-skip (bobotnya diredistribusi — lihat Bagian 5.5).

---

## 4. Skenario User Flow

```
1. Customer browsing /marketplace (filter kategori handphone/tablet/laptop)
   ↓
2. Setiap kartu produk punya checkbox/tombol "+ Bandingkan"
   ↓
3. Saat 1 produk dipilih → muncul floating bar "Bandingkan (1/2)" di bawah
   ↓
4. Pilih produk ke-2 (kategori HARUS sama) → bar jadi "Bandingkan (2/2) [Lihat Hasil]"
   ↓
5. Klik "Lihat Hasil" → buka halaman /marketplace/bandingkan?a={id1}&b={id2}
   ↓
6. Halaman benchmark tampil: skor per kategori, total, pemenang, breakdown detail
```

### Alternatif Entry Point
- **Dari halaman detail produk:** tombol "Bandingkan produk ini" → pilih lawan dari produk serupa (kategori + range harga sama).
- **Validasi:** Hanya boleh bandingkan kategori yang sama (HP vs HP, laptop vs laptop). Beda kategori → tampilkan warning.

---

## 5. Algoritma Penilaian (Objektif, Terukur)

Total skor = gabungan 4 pilar dengan bobot. Setiap pilar dihitung 0-100, lalu dikalikan bobot.

### 5.1 Bobot Default per Pilar

| Pilar | Bobot (IPHONE / IPAD — punya 3uTools) | Bobot (ANDROID_PHONE / ANDROID_TABLET / LAPTOP) |
|-------|----------------------------------------|--------------------------------------------------|
| Kondisi | 30% | 35% |
| 3uTools (kesehatan hardware) | 25% | 0% (di-skip) |
| Spesifikasi | 25% | 35% |
| Kelengkapan | 20% | 30% |

> Pilar 3uTools hanya aktif jika `deviceType ∈ {IPHONE, IPAD}`. Untuk device lain, bobot 3uTools diredistribusi ke 3 pilar lain.
> Bobot bisa dibuat configurable oleh admin (lihat Bagian 7).

### 5.2 Skor Kondisi (0-100)

```
skorKondisi = (gradeScore × 0.7) + (conditionPercent × 0.3)
```
- `gradeScore` dari tabel grade (Bagian 3.1)
- `conditionPercent` field 0-100
- Jika `minusNotes` terisi → tidak mengurangi (sudah tercermin di grade), tapi ditampilkan sebagai catatan transparan.

**Contoh:** Grade MULUS (80) + conditionPercent 95 → (80×0.7) + (95×0.3) = 56 + 28.5 = **84.5**

### 5.3 Skor 3uTools / Kesehatan Hardware (0-100) — khusus Apple

```
skor3uTools =
    (batteryScore   × 0.35)
  + (originalScore  × 0.30)
  + (functionScore  × 0.20)
  + (verifiedScore  × 0.15)
```

**Komponen:**
- `batteryScore` = `batteryHealth` langsung (0-100). Jika null → 50 (netral).
- `originalScore`:
  - `isAllOriginal = true` → 100
  - ada `replacedParts` → 100 − (jumlahPartDiganti × 25), minimum 0
- `functionScore` = rata-rata dari (`trueToneActive` ? 100 : 0) dan (`faceIdWorks` ? 100 : 0)
- `verifiedScore` = `verified3uTools` ? 100 : 40 (penalti jika belum diverifikasi screenshot)

**Contoh:** battery 89, all original, True Tone+FaceID aktif, verified
= (89×0.35) + (100×0.30) + (100×0.20) + (100×0.15)
= 31.15 + 30 + 20 + 15 = **96.15**

### 5.4 Skor Spesifikasi (0-100)

**Keputusan final: hanya pakai Storage + RAM** (tanpa tier prosesor — lebih simpel & tetap objektif). Pakai **normalisasi relatif** (bandingkan A vs B):

```
Untuk tiap atribut (storage, RAM):
  - Parse angka dari string ("256GB" → 256, "8GB" → 8, "1TB" → 1024)
  - skorAtribut_A = (nilaiA / max(nilaiA, nilaiB)) × 100
  - skorAtribut_B = (nilaiB / max(nilaiA, nilaiB)) × 100

skorSpesifikasi = (skorStorage × 0.6) + (skorRAM × 0.4)
```

> Storage diberi bobot lebih besar (0.6) karena lebih sering jadi pertimbangan utama pembeli HP/tablet. Bisa disesuaikan.

**Helper parsing wajib menangani:**
- Satuan: `GB`, `TB` (1TB = 1024GB), spasi opsional ("256 GB" = "256GB")
- Jika salah satu produk tidak punya data RAM (mis. iPhone jarang cantumkan RAM) → atribut RAM di-skip, skor spesifikasi = skorStorage 100%.
- Jika kedua produk storage sama → keduanya dapat 100 (seri).

**Contoh:** A=256GB/6GB, B=512GB/8GB
- skorStorage: A=(256/512)×100=50, B=100
- skorRAM: A=(6/8)×100=75, B=100
- skorSpesifikasi A = (50×0.6)+(75×0.4) = 30+30 = **60**
- skorSpesifikasi B = (100×0.6)+(100×0.4) = **100**

### 5.5 Skor Kelengkapan (0-100)

```
Bobot tiap item kelengkapan:
  FULLSET / (semua granular) → 100
  Ada BOX                    → +30
  Ada CHARGER                → +30
  Ada HEADSET                → +15
  Ada MOUSE / BAG (laptop)   → +10 each
  UNIT_ONLY                  → 40 (baseline)

skorKelengkapan = min(100, jumlah poin)
+ bonus garansi:
  OFFICIAL → +10 (capped 100)
  STORE    → +5
  NONE     → +0
```

**Contoh:** Fullset (BOX+CHARGER+HEADSET) + garansi STORE
= (30+30+15) + 5 = 80 → ditampilkan 80/100

### 5.6 Skor Total & Pemenang

```
skorTotal_A = Σ (skorPilar_A × bobotPilar)
skorTotal_B = Σ (skorPilar_B × bobotPilar)

Pemenang = produk dengan skorTotal lebih tinggi
Jika selisih < 3 poin → "Seri / Sangat Berimbang"
```

**Output juga sertakan:**
- Pemenang per pilar (mis. "A unggul di Kondisi, B unggul di Spesifikasi")
- Value-for-money: `skorTotal / harga` → "mana yang lebih worth"
- Insight tekstual otomatis (template, bukan AI): "Unit A lebih mulus & baterai lebih sehat, tapi unit B storage 2x lebih besar dengan harga Rp X lebih murah."

---

## 6. Tampilan Halaman Benchmark

### Layout: 2 Kolom Berdampingan (head-to-head)

```
┌─────────────────────────────────────────────────────────┐
│  BANDINGKAN PRODUK                          [× Tutup]     │
├──────────────────────────┬──────────────────────────────┤
│   PRODUK A               │   PRODUK B                    │
│   [foto]                 │   [foto]                      │
│   iPhone 13 Pro Max      │   iPhone 12 Pro Max           │
│   Rp 8.500.000           │   Rp 7.200.000                │
│   ┌──────────────────┐   │   ┌──────────────────┐       │
│   │ SKOR TOTAL: 87   │🏆 │   │ SKOR TOTAL: 81   │        │
│   └──────────────────┘   │   └──────────────────┘       │
├──────────────────────────┴──────────────────────────────┤
│  RADAR CHART (4 pilar, overlay A vs B)                    │
├───────────────────────────────────────────────────────────┤
│  BREAKDOWN PER PILAR (progress bar berdampingan)          │
│  Kondisi      A ████████ 84  │  B ██████ 70   → A menang  │
│  3uTools      A █████████ 96 │  B ███████ 78  → A menang  │
│  Spesifikasi  A ███████ 75   │  B ████████ 90 → B menang  │
│  Kelengkapan  A ████████ 80  │  B ██████ 65   → A menang  │
├───────────────────────────────────────────────────────────┤
│  TABEL DETAIL (baris per atribut, highlight yang unggul)  │
│  Baterai       89%  ✓        │  82%                       │
│  Original      Ya   ✓        │  Screen diganti            │
│  Storage       256GB         │  512GB ✓                   │
│  Kelengkapan   Fullset ✓     │  Unit only                 │
│  Garansi       Toko          │  Tidak ada                 │
├───────────────────────────────────────────────────────────┤
│  💡 INSIGHT: "Unit A lebih mulus & baterai lebih sehat,   │
│     cocok jika prioritas kondisi. Unit B storage 2x lebih │
│     besar & lebih murah Rp 1.3jt."                        │
├───────────────────────────────────────────────────────────┤
│  [Lihat Detail A]  [Chat Penjual A] │ [Detail B] [Chat B] │
└───────────────────────────────────────────────────────────┘
```

### Elemen Visual (sesuai design system)
- Radar chart (ApexCharts) overlay 2 produk
- Progress bar berdampingan per pilar dengan warna pemenang
- Badge 🏆 di kolom pemenang
- Tabel atribut dengan highlight hijau di sel yang unggul
- Animasi: count-up skor, bar grow, reveal stagger (framer-motion)

---

## 7. Konfigurasi Admin (Opsional, Fleksibel)

Agar bobot tidak hardcoded:
```prisma
model BenchmarkConfig {
  id              String @id @default("singleton")
  weightCondition Int    @default(30)
  weight3uTools   Int    @default(25)
  weightSpecs     Int    @default(25)
  weightCompleteness Int @default(20)
  // tier prosesor disimpan sebagai JSON lookup
  processorTiers  Json   @default("{}")
  updatedAt       DateTime @updatedAt
}
```
Admin bisa atur bobot & tier prosesor dari panel CMS.

---

## 8. Halaman & Routing

| Route | Deskripsi |
|-------|-----------|
| `/marketplace/bandingkan?a={id}&b={id}` | Halaman hasil benchmark |
| Komponen `<CompareBar />` | Floating bar di marketplace (state: produk terpilih) |
| Komponen `<CompareButton />` | Tombol "+ Bandingkan" di kartu & detail produk |
| API `GET /api/marketplace/compare?a={id}&b={id}` | Return data + skor terhitung |
| `src/lib/product-benchmark.ts` | Pure function algoritma scoring (mudah di-test) |

---

## 9. Keputusan Final (Terkunci)

| # | Topik | Keputusan |
|---|-------|-----------|
| 1 | Kategori | Tambah kategori **HANDPHONE** & **TABLET** terpisah. HANDPHONE → sub: iPhone/Android. TABLET → sub: iPad/Tablet Android. Disimpan via field `deviceType`. |
| 2 | Field terstruktur | **Setuju** tambah field kondisi (`conditionGrade`, `conditionPercent`) & 3uTools (`batteryHealth`, `isAllOriginal`, dll). |
| 3 | Jumlah produk | **2 produk** saja (head-to-head). |
| 4 | Skor spesifikasi | **Storage + RAM saja** (tanpa tier prosesor). |
| 5 | Data lama | Teknisi **wajib update** produk existing untuk isi field baru (tidak ada default backfill). |

### Catatan Implikasi Keputusan #5 (update data lama)
- Field baru bersifat **nullable** di schema (agar migration tidak gagal untuk row existing).
- Di scoring: jika field penting null → beri **skor netral 50** + tampilkan badge "Data belum lengkap" agar transparan, mendorong teknisi melengkapi.
- Opsional: tampilkan reminder di dashboard teknisi "X produk perlu dilengkapi data kondisi/3uTools untuk fitur Bandingkan".

---

## 10. Schema Changes Ringkas (untuk Implementasi)

```prisma
enum ProductCategory {
  HANDPHONE
  TABLET          // BARU
  LAPTOP
  AKSESORIS
  SOFTWARE
  LAINNYA
}

enum DeviceType {   // BARU
  IPHONE
  ANDROID_PHONE
  IPAD
  ANDROID_TABLET
}

enum ConditionGrade { // BARU
  BNIB
  LIKE_NEW
  MULUS
  NORMAL
  MINUS
}

model Product {
  // ... field existing ...
  deviceType       DeviceType?      // diisi untuk HANDPHONE & TABLET

  // Kondisi terstruktur
  conditionGrade   ConditionGrade?
  conditionPercent Int?             // 0-100
  minusNotes       String?          @db.Text

  // 3uTools terstruktur (khusus IPHONE/IPAD)
  batteryHealth    Int?             // 0-100
  batteryCycle     Int?
  isAllOriginal    Boolean?
  replacedParts    String[]         @default([])
  trueToneActive   Boolean?
  faceIdWorks      Boolean?
  verified3uTools  Boolean?         @default(false)
  // threeUtoolsImages sudah ada dari fitur sebelumnya
}
```

> Semua field baru **nullable** agar migration aman untuk row existing. Migration tidak boleh menghapus data.

---

## 11. Rekomendasi Pendekatan Bertahap

**Fase 1 — Schema & Form (fondasi data):**
- Migration: tambah enum `TABLET`, `DeviceType`, `ConditionGrade` + field baru di Product
- Update form upload produk teknisi: kategori → sub-kategori dinamis → field kondisi & 3uTools (conditional untuk iPhone/iPad)
- Update serializer (DTO) expose field baru

**Fase 2 — Engine Scoring:**
- `src/lib/product-benchmark.ts` — pure function scoring 4 pilar (unit-testable)
- API `GET /api/marketplace/compare?a={id}&b={id}` — validasi kategori sama, return skor
- Helper parsing storage/RAM dengan normalisasi GB/TB

**Fase 3 — UI Benchmark:**
- `<CompareButton />` di kartu & detail produk
- `<CompareBar />` floating bar (state 2 produk, validasi kategori sama)
- Halaman `/marketplace/bandingkan?a=&b=` — radar chart, breakdown bar, tabel atribut, insight otomatis, pemenang
- Animasi count-up & reveal (framer-motion)

**Fase 4 — Polish & Admin:**
- `BenchmarkConfig` — admin atur bobot via CMS
- Reminder dashboard teknisi "produk perlu dilengkapi"
- Value-for-money (skor/harga)

---

**Status:** Scope terkunci ✅ — siap masuk ke spec/implementasi
**Next:** Buat spec formal (requirements → design → tasks) atau langsung implementasi Fase 1
