# Shipping Locations Cache — Design Spec

**Date:** 2026-06-20  
**Status:** Draft for review

## Goal

Menghilangkan kebutuhan hit API BinderByte saat user atau teknisi mengisi alamat. Seluruh data wilayah untuk pengisian alamat dibaca dari database lokal. BinderByte hanya dipanggil di langkah akhir saat origin dan destination sudah lengkap untuk cek ongkir.

## Scope

- Ganti sumber data dropdown alamat dari BinderByte search API ke database lokal
- Sediakan hirarki wilayah `Provinsi -> Kota/Kabupaten -> Kecamatan -> Kelurahan/Desa`
- Tampilkan semua opsi saat dropdown dibuka
- Tambahkan filter ketik lokal di dalam dropdown tanpa hit API eksternal
- Pertahankan format ID lokasi yang kompatibel dengan BinderByte untuk cek ongkir

## Out of Scope

- Mengubah logika perhitungan ongkir BinderByte
- Sinkronisasi wilayah real-time atau cron harian
- Perubahan besar pada flow checkout selain sumber data lokasi
- Paket wilayah BinderByte berbayar

## Current State

- Form alamat saat ini memakai `LocationSearchSelect`
- Dropdown lokasi baru menampilkan hasil setelah user mengetik minimal 2 karakter
- API `GET /api/shipping/locations` saat ini meneruskan pencarian ke BinderByte `/v1/locations`
- BinderByte `/v1/cost` sudah berfungsi untuk cek ongkir jika diberi ID kelurahan yang valid
- Endpoint BinderByte `/wilayah/*` tidak aktif pada akun saat ini

## Proposed Architecture

### Source of truth

Gunakan dataset wilayah Indonesia berbasis kode Kemendagri sebagai sumber data lokal. Data akan diimport ke tabel database dan dipakai oleh semua form alamat.

### ID compatibility

ID lokasi untuk level kota, kecamatan, dan kelurahan dibangun agar kompatibel dengan format BinderByte:

- Kota/Kabupaten: `city_33.07`
- Kecamatan: `district_33.07.09`
- Kelurahan/Desa: `village_33.07.09.2007`

Provinsi disimpan untuk kebutuhan UI dan relasi data, tetapi tidak dipakai langsung saat cek ongkir.

### Runtime flow

1. User membuka form alamat
2. UI fetch daftar wilayah dari API internal yang membaca database lokal
3. User memilih `Provinsi -> Kota/Kabupaten -> Kecamatan -> Kelurahan/Desa`
4. Sistem menyimpan ID dan label wilayah ke profil atau order seperti sekarang
5. Saat cek ongkir, sistem hanya mengirim `origin village id` dan `destination village id` ke BinderByte `/v1/cost`

## Data Model

Tambahkan tabel baru `ShippingLocation`.

Fields:

- `id: String @id`
- `type: ShippingLocationType`
- `code: String`
- `name: String`
- `label: String`
- `parentId: String?`
- `binderbyteId: String?`
- `postalCode: String?`
- `sortOrder: Int?`
- `createdAt: DateTime`
- `updatedAt: DateTime`

Enum:

- `PROVINCE`
- `CITY`
- `DISTRICT`
- `VILLAGE`

Notes:

- `id` dapat memakai ID final yang dibaca UI, misalnya `province_33`, `city_33.07`, `district_33.07.09`, `village_33.07.09.2007`
- `binderbyteId` untuk city, district, dan village sama dengan `id`; untuk province bernilai `null`
- `parentId` menunjuk ke baris parent untuk query berjenjang
- `label` adalah string siap tampil di UI, misalnya `Wonosobo, Jawa Tengah` atau `Pancurwening, Wonosobo, Wonosobo (56316)`

Indexes:

- `@@index([type, parentId])`
- `@@index([parentId, sortOrder])`
- `@@index([type, name])`
- `@unique` pada `binderbyteId` untuk row non-province jika diperlukan

## Data Import Strategy

### Recommended approach

Import dataset wilayah Indonesia terbuka yang memakai kode administratif Kemendagri, lalu bangun `binderbyteId` secara deterministik dari kode tersebut.

### Why this approach

- Tidak bergantung pada search API BinderByte untuk prefill seluruh Indonesia
- Tidak butuh ribuan request ke API eksternal
- Struktur hierarki lengkap dan stabil
- ID hasil import kompatibel dengan BinderByte cost API berdasarkan validasi sampel

### Import mechanism

- Simpan dataset mentah statis di repo, misalnya di `src/data/shipping-locations/` atau `prisma/seed-data/`
- Tambahkan script import, misalnya `scripts/seed-shipping-locations.ts`
- Script membaca semua provinsi, kota, kecamatan, dan kelurahan
- Script melakukan upsert atau refresh ke tabel `ShippingLocation`

### Validation

Tambahkan script validasi sampling:

- Ambil sampel kelurahan acak
- Bangun `village_*` ID
- Jalankan request uji ke BinderByte `/v1/cost` memakai origin dan destination valid
- Catat mismatch jika ada wilayah yang ditolak BinderByte

Validation ini dipakai sebagai guardrail saat pertama kali import dan saat dataset diperbarui.

## API Design

Ganti implementasi `GET /api/shipping/locations` agar membaca database lokal.

### Query contract

- `type=province`
- `type=city&parentId=province_33`
- `type=district&parentId=city_33.07`
- `type=village&parentId=district_33.07.09`
- `query` tidak dipakai untuk remote search; jika tetap disediakan, nilainya hanya dipakai sebagai filter tambahan di server pada data lokal

### Response shape

```json
{
  "success": true,
  "data": {
    "locations": [
      { "id": "city_33.07", "type": "city", "label": "Wonosobo, Jawa Tengah" }
    ]
  }
}
```

### API behavior

- Jika `type=province`, kembalikan semua provinsi
- Jika `type` selain province, `parentId` wajib ada
- Urutan hasil stabil dan ramah user
- Tidak ada hit ke BinderByte dari endpoint ini
- Dapat diberi header cache untuk data yang jarang berubah

## UI Design

### Interaction model

Ganti autocomplete berbasis remote search dengan cascading dropdown:

1. Pilih provinsi
2. Pilih kota/kabupaten berdasarkan provinsi
3. Pilih kecamatan berdasarkan kota/kabupaten
4. Pilih kelurahan/desa berdasarkan kecamatan

### Dropdown behavior

- Semua opsi tampil saat dropdown dibuka
- Ada kotak filter lokal di dalam dropdown
- Filter hanya menyaring data yang sudah diambil dari database
- Tidak perlu mengetik dulu agar opsi muncul
- Saat parent berubah, child selection di-reset

### UX recommendation

- Level provinsi, kota, kecamatan, dan kelurahan memakai komponen combobox yang konsisten dengan gaya form saat ini
- List dibatasi tinggi maksimum dan scrollable
- Placeholder mengikuti status parent, misalnya `Pilih provinsi dulu`
- Saat loading child options, tampilkan skeleton atau state loading ringan

## Affected Screens

- `teknisi/settings` untuk alamat pengiriman teknisi
- `cart` untuk alamat pengiriman buyer
- `user/akun` dapat mengikuti di fase berikutnya agar konsisten dengan checkout

## Backward Compatibility

- Field existing seperti `cityId`, `districtId`, `locationId`, `cityLabel`, `districtLabel`, dan `locationLabel` tetap dipakai
- Data alamat lama tidak perlu dimigrasi ulang selama ID-nya sudah dalam format BinderByte
- Provinsi tidak perlu disimpan terpisah di profil atau order jika bisa diturunkan dari `cityId`

## Error Handling

- Jika tabel lokasi kosong, endpoint internal mengembalikan pesan setup yang jelas
- Jika child query dipanggil tanpa `parentId`, kembalikan 400
- Jika BinderByte `/v1/cost` gagal, flow checkout tetap menampilkan error ongkir seperti sekarang
- Jika ada mismatch dataset terhadap BinderByte, catat di log validasi dan perbaiki data seed

## Performance Considerations

- Total data sekitar puluhan ribu row masih aman untuk query sederhana berdasarkan `parentId`
- Query dropdown hanya mengambil satu level per request
- Filter dilakukan di client pada subset yang sudah kecil setelah parent dipilih
- Provinsi dan kota dapat di-cache agresif

## Security Considerations

- Endpoint lokasi hanya read-only
- Tidak ada secret BinderByte di client
- BinderByte API key tetap hanya dipakai server-side saat cek ongkir dan validasi administratif

## Testing Strategy

### Automated

- Unit test helper pembentuk ID BinderByte dari kode administratif
- Unit test query parsing endpoint lokasi
- Integration test endpoint lokasi berbasis seeded test database
- Regression test flow alamat checkout dan profil teknisi

### Manual

- Pilih provinsi lalu pastikan kota muncul tanpa mengetik
- Ganti kota lalu pastikan kecamatan dan kelurahan reset
- Filter lokal `wono` menyaring opsi tanpa network ke BinderByte
- Cek ongkir berhasil setelah alamat lengkap dipilih

## Rollout Plan

1. Tambah schema `ShippingLocation`
2. Tambah dataset seed dan script import
3. Import data ke environment dev
4. Ubah endpoint `/api/shipping/locations` ke database
5. Ganti `LocationSearchSelect` menjadi combobox lokal bertingkat
6. Verifikasi di `teknisi/settings` dan `cart`
7. Jalankan validasi sampel BinderByte cost API
8. Deploy migration dan seed ke production

## Open Decisions Resolved

- Dropdown memakai level `Provinsi -> Kota/Kabupaten -> Kecamatan -> Kelurahan/Desa`
- Opsi tampil langsung saat dropdown dibuka
- Filter ketik tetap ada, tetapi lokal
- BinderByte hanya dipanggil di akhir untuk cek ongkir

## Risks and Mitigations

### Risk: dataset berbeda label dengan BinderByte

Mitigation:

- Simpan `label` untuk UI lokal
- Simpan `binderbyteId` yang kompatibel untuk cost API
- Jalankan validasi sampling dan perbaiki dataset jika ditemukan mismatch

### Risk: seed besar memperlambat deploy

Mitigation:

- Pisahkan migration schema dan import data
- Jalankan seed secara eksplisit saat setup environment
- Gunakan bulk insert atau batching

### Risk: komponen dropdown baru lebih kompleks

Mitigation:

- Pisahkan komponen generic combobox dari logic shipping
- Tambahkan test untuk reset parent-child dan filter lokal

## Recommendation

Implementasi sebaiknya memakai database lokal berbasis dataset kode wilayah Indonesia dan menghentikan ketergantungan form alamat pada BinderByte search API. Ini memberi UX lebih cepat, struktur data lebih stabil, dan menghemat quota API tanpa mengubah logika inti cek ongkir.
