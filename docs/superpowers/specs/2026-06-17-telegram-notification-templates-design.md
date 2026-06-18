# Telegram Notification Templates — Design Spec

**Tanggal**: 2026-06-17  
**Status**: Approved (brainstorming)  
**Author**: Brainstorming session  

---

## 1. Tujuan

Menyediakan **Pusat Notifikasi Telegram** di dashboard admin agar:

1. Admin mengatur **satu channel/grup Telegram global** untuk broadcast produk baru yang sudah dipublish.
2. Sistem mengirim **notifikasi otomatis ke Telegram pribadi teknisi** (yang sudah link) untuk event operasional penting.
3. **Isi pesan** punya **template default** dari sistem, tetapi admin dapat **mengkustomisasi** via editor fleksibel (textarea + chip placeholder + preview Telegram).
4. Pengiriman **non-blocking** — kegagalan Telegram tidak mengganggu flow bisnis utama (approval, checkout, dll.).

Masalah yang diselesaikan: infrastruktur Telegram sudah ada (`sendTelegramMessage`, link akun teknisi), tetapi template hardcoded belum dipakai dan tidak ada UI admin untuk mengatur konten maupun channel.

---

## 2. Keputusan bisnis

| Topik | Keputusan |
|-------|-----------|
| Jenis notifikasi v1 | **Template otomatis per event** (bukan broadcast manual) |
| Channel global | **Satu** Chat ID channel/grup, dikonfigurasi admin |
| Editor konten | **Textarea + chip placeholder + preview Telegram** (Markdown) |
| Default template | Disediakan sistem; admin bisa override per event |
| Reset template | Tombol **Reset ke default** per event |
| Aktif/nonaktif | Toggle **per event** |
| Penerima channel | Event `product.published` saja (v1) |
| Penerima teknisi pribadi | `marketplace.order.new`, `marketplace.order.paid`, `konsultasi.new`, `inspeksi.new` |
| Teknisi belum link Telegram | Skip kirim (no-op) + log server |
| Bot belum dikonfigurasi | Skip kirim + log warning |
| Keamanan simpan config/template | Admin step-up (password + TOTP jika 2FA aktif), sama pola SMTP |
| Broadcast manual / multi-channel | **Out of scope v1** |
| WhatsApp | **Out of scope v1** |

---

## 3. Konteks codebase saat ini

| Komponen | Kondisi |
|----------|---------|
| `src/lib/telegram.ts` | `sendTelegramMessage`, `TelegramNotificationTemplates` (hardcoded, tidak dipakai event bisnis) |
| `/api/telegram/webhook` | Link akun teknisi via `/start <token>` |
| `TeknisiProfile.telegramChatId` | Field ada; dipakai saat link |
| `/api/admin/approval` | Approve produk hanya update DB, **tanpa Telegram** |
| `marketplace-checkout.ts` | Order dibuat langsung `status: PAID` |
| `/admin/notifications` | Popup lonceng in-app — **bukan** Telegram |
| `/admin/settings` | Kartu "Telegram alerts: Belum link" — placeholder UI |
| `PlatformSetting` key-value | Pola matang untuk config (SMTP, platform settings) |

---

## 4. Katalog event v1

| Event key | Penerima | Deskripsi | Trigger |
|-----------|----------|-----------|---------|
| `product.published` | Channel global | Produk baru tampil di marketplace | Produk disetujui admin: `listingStatus=APPROVED` + `isPublished=true` |
| `marketplace.order.new` | Teknisi (penjual) | Pesanan marketplace baru | Order `create` untuk seller |
| `marketplace.order.paid` | Teknisi (penjual) | Pesanan sudah dibayar | Status order **transisi** ke `PAID` (bukan create langsung PAID) |
| `konsultasi.new` | Teknisi | Request konsultasi baru | `KonsultasiSession` baru status `PENDING` |
| `inspeksi.new` | Teknisi | Request inspeksi baru | `InspectionOrder` baru dibuat (sudah `PAID`) |

### 4.1 Dedup `order.new` vs `order.paid`

Checkout wallet saat ini membuat order langsung dengan `status: PAID`. Agar teknisi tidak menerima **dua pesan** untuk satu checkout:

- `marketplace.order.new` → dispatch saat order **dibuat**.
- `marketplace.order.paid` → dispatch hanya pada **perubahan status** menjadi `PAID` (mis. gateway async di masa depan). **Tidak** dispatch jika order sudah dibuat sebagai `PAID`.

---

## 5. Placeholder per event

Variabel disisipkan sebagai `{{namaVariabel}}` di template. Renderer mengganti dengan nilai aktual; nilai kosong → string kosong atau `-` (konsisten per implementasi).

### `product.published`

| Placeholder | Sumber |
|-------------|--------|
| `namaProduk` | `Product.name` |
| `harga` | `Product.price` (format IDR) |
| `kategori` | `Product.category` (label human-readable) |
| `namaToko` | `TeknisiStore.name` atau fallback nama teknisi |
| `namaTeknisi` | `User.name` penjual |
| `linkProduk` | URL absolut `/marketplace/products/{id}` |

### `marketplace.order.new` / `marketplace.order.paid`

| Placeholder | Sumber |
|-------------|--------|
| `kodeOrder` | `Order.orderCode` |
| `namaProduk` | Nama produk pertama di order items |
| `namaPembeli` | `User.name` pembeli |
| `total` | `Order.total` (format IDR) |
| `jumlahItem` | Jumlah line items |
| `metodeBayar` | `wallet` (v1) — siap untuk gateway nanti |
| `linkPesanan` | URL absolut `/teknisi/pesanan` (atau detail jika ada) |

### `konsultasi.new`

| Placeholder | Sumber |
|-------------|--------|
| `namaUser` | `User.name` |
| `layanan` | `KonsultasiSession.service` |
| `kodeSesi` | ID atau kode sesi |
| `remoteId` | `KonsultasiSession.remoteId` jika ada |
| `linkDashboard` | `/teknisi/konsultasi` |

### `inspeksi.new`

| Placeholder | Sumber |
|-------------|--------|
| `namaUser` | `User.name` |
| `namaProduk` | `InspectionOrder.productName` |
| `mode` | `online` / `offline` |
| `kodeOrder` | `InspectionOrder.orderCode` |
| `linkDashboard` | `/teknisi/inspeksi` atau route yang sesuai |

---

## 6. Template default (sistem)

### `product.published` → Channel

```
🛍️ *Produk Baru di Marketplace!*

📦 {{namaProduk}}
💰 {{harga}}
🏪 Toko: {{namaToko}}
👤 Penjual: {{namaTeknisi}}

👉 {{linkProduk}}
```

### `marketplace.order.new` → Teknisi

```
🛒 *Pesanan Marketplace Baru*

👤 Pembeli: {{namaPembeli}}
📦 Produk: {{namaProduk}}
💵 Total: {{total}}
🔖 Kode: `{{kodeOrder}}`

Segera proses di dashboard:
{{linkPesanan}}
```

### `marketplace.order.paid` → Teknisi

```
💳 *Pembayaran Diterima*

👤 Pembeli: {{namaPembeli}}
📦 Produk: {{namaProduk}}
💵 Total: {{total}}
🔖 Kode: `{{kodeOrder}}`

Silakan proses pesanan ini.
{{linkPesanan}}
```

### `konsultasi.new` → Teknisi

```
🔔 *Request Konsultasi Baru*

👤 {{namaUser}}
📋 Layanan: {{layanan}}
🔖 Kode: `{{kodeSesi}}`

Cek dashboard untuk terima/tolak:
{{linkDashboard}}
```

### `inspeksi.new` → Teknisi

```
🔔 *Request Inspeksi Baru*

👤 {{namaUser}}
📱 Produk: {{namaProduk}}
📍 Mode: {{mode}}
🔖 Kode: `{{kodeOrder}}`

Cek dashboard untuk menerima request:
{{linkDashboard}}
```

---

## 7. Arsitektur

### 7.1 Data model

**`TelegramNotificationTemplate`** (Prisma)

```prisma
model TelegramNotificationTemplate {
  eventKey  String   @id
  body      String   @db.Text
  isEnabled Boolean  @default(true)
  updatedAt DateTime @updatedAt
}
```

- Baris hanya ada jika admin pernah menyimpan override. Jika tidak ada → pakai default dari kode.
- `eventKey` enum string: 5 key v1 di atas.

**`PlatformSetting`**

- Key: `telegram_channel_chat_id` — Chat ID channel/grup (string, bisa negatif untuk grup).

### 7.2 Modul server (`src/lib/telegram/`)

| File | Tanggung jawab |
|------|----------------|
| `telegram.ts` | Existing: `sendTelegramMessage`, `isTelegramEnabled` |
| `template-defaults.ts` | Default body + metadata event (label, audience, placeholders) |
| `template-store.ts` | `getTemplate(eventKey)`, `saveTemplate`, `resetTemplate` |
| `template-render.ts` | Replace `{{var}}`, escape karakter Markdown Telegram |
| `channel-config.ts` | `getChannelChatId`, `saveChannelChatId` |
| `dispatch.ts` | `dispatchTelegramEvent(eventKey, context)` — resolve template, render, route ke channel atau teknisi |

### 7.3 API admin

| Method | Route | Fungsi |
|--------|-------|--------|
| GET | `/api/admin/telegram/config` | Status bot, channel chat ID (masked partial), enabled flag |
| PATCH | `/api/admin/telegram/config` | Update channel chat ID (step-up) |
| POST | `/api/admin/telegram/config/test` | Kirim pesan uji ke channel |
| GET | `/api/admin/telegram/templates` | List 5 event + body efektif (override atau default) |
| PATCH | `/api/admin/telegram/templates` | Update body + isEnabled per eventKey (step-up) |
| POST | `/api/admin/telegram/templates/[eventKey]/reset` | Hapus override, kembali ke default |

### 7.4 UI admin

**Route:** `/admin/telegram-notifications`  
**Sidebar:** item "Telegram" di section Konten (dekat Notifikasi in-app)

**Tab Koneksi:**
- Status: bot token terkonfigurasi / belum
- Input Chat ID channel
- Panduan singkat: tambahkan bot sebagai admin channel, cara dapat Chat ID
- Tombol **Kirim pesan uji**
- (Opsional v1) Indikator error kirim 24 jam terakhir dari log

**Tab Template Pesan:**
- Daftar 5 event (card atau accordion)
- Per event: label, badge penerima (Channel / Teknisi), toggle aktif, textarea, chip placeholder, preview panel, simpan, reset default

**Preview:** render dengan data dummy contoh (bukan data produksi).

### 7.5 Trigger hooks (non-blocking)

Semua pemanggilan: `void dispatchTelegramEvent(...)` — tidak `await` di hot path kecuali di dalam dispatcher sendiri.

| Lokasi | Event |
|--------|-------|
| `POST /api/admin/approval` | `product.published` saat `entityType=product` + `action=approve` |
| `PATCH /api/admin/products/[id]` | `product.published` saat `listingStatus=APPROVED` + `isPublished=true` (dan sebelumnya belum published) |
| `processMarketplaceCheckout` | `marketplace.order.new` per order created |
| Hook transisi status order → PAID | `marketplace.order.paid` (hanya on transition) |
| `POST /api/user/konsultasi` | `konsultasi.new` |
| `POST /api/user/inspeksi` | `inspeksi.new` |

**Guard `product.published`:** hanya kirim jika transisi ke published (hindari spam saat admin edit produk yang sudah approved).

### 7.6 Alur dispatch

```
dispatchTelegramEvent(eventKey, context)
  ├─ isTelegramEnabled()? else return
  ├─ getTemplate(eventKey) → body + isEnabled
  ├─ isEnabled? else return
  ├─ renderTemplate(body, context)
  ├─ audience = CHANNEL | TEKNISI (dari catalog)
  ├─ CHANNEL → getChannelChatId() → sendTelegramMessage
  └─ TEKNISI → resolve teknisiId dari context → telegramChatId → sendTelegramMessage
```

---

## 8. Keamanan & audit

- Semua route `/api/admin/telegram/*` → `requireApiRole(['ADMIN'])`
- PATCH config & templates → `verifyAdminStepUp` (password + TOTP jika 2FA aktif)
- `logAdminGovernance`:
  - `admin.telegram.config.update`
  - `admin.telegram.template.update`
  - `admin.telegram.template.reset`
- Chat ID channel tidak diekspos penuh ke client jika tidak perlu (boleh tampilkan 4 digit terakhir)

---

## 9. Error handling

| Situasi | Perlakuan |
|---------|-----------|
| `TELEGRAM_BOT_TOKEN` kosong | Skip, log warning |
| Channel chat ID kosong (event channel) | Skip, log |
| Teknisi belum link | Skip, no error ke user |
| Telegram API gagal | Log error + description; tidak throw ke caller |
| Placeholder tidak dikenal di template | Biarkan `{{unknown}}` atau strip — pilih **strip kosong** di renderer |
| Karakter Markdown invalid | Escape nilai dinamis; template admin tanggung jawab format |

---

## 10. Testing

### Unit

| ID | Skenario |
|----|----------|
| TPL-01 | Render template dengan semua placeholder terisi |
| TPL-02 | Render dengan nilai kosong |
| TPL-03 | Escape karakter `*_[]()` di nilai dinamis |
| TPL-04 | `getTemplate` fallback ke default jika tidak ada row DB |
| TPL-05 | `resetTemplate` menghapus override |

### Integration

| ID | Skenario |
|----|----------|
| TPL-10 | Approve produk → `dispatchTelegramEvent('product.published')` terpanggil |
| TPL-11 | Checkout marketplace → `order.new` terpanggil, `order.paid` tidak (create langsung PAID) |
| TPL-12 | Konsultasi baru → `konsultasi.new` ke teknisi dengan chatId |
| TPL-13 | Template disabled → tidak kirim |
| TPL-14 | Bot token kosong → tidak kirim, tidak error 500 di API utama |

### Manual QA

1. Set channel chat ID + test send dari admin UI
2. Link akun teknisi Telegram
3. Approve produk → cek channel
4. Checkout produk teknisi → cek Telegram pribadi teknisi
5. Edit template di admin → trigger ulang → pesan mengikuti template baru
6. Reset default → pesan kembali ke template sistem

---

## 11. Out of scope v1 (follow-up)

- Broadcast manual dari admin
- Multi-channel / routing per kategori produk
- Notifikasi Telegram ke user/admin pribadi
- Rich-text WYSIWYG editor
- WhatsApp parity
- Retry queue / dead-letter untuk gagal kirim
- Histori log kirim di UI admin

---

## 12. Urutan implementasi (high-level)

1. Prisma migration + `template-defaults.ts` + `template-store` + `template-render`
2. `dispatch.ts` + `channel-config.ts`
3. API admin (config + templates)
4. UI `/admin/telegram-notifications`
5. Wire trigger hooks (approval, checkout, konsultasi, inspeksi)
6. Unit tests renderer/store + integration smoke
7. Update placeholder di `/admin/settings` (link ke halaman baru)

---

## 13. Self-review checklist

- [x] Tidak ada TBD / placeholder kosong
- [x] Konsisten: 5 event, 1 channel, editor textarea+chip+preview
- [x] Dedup order.new/order.paid dijelaskan eksplisit
- [x] Scope cukup untuk satu implementation plan
- [x] Trigger locations spesifik
- [x] Keamanan step-up selaras SMTP
