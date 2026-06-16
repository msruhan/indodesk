# Open Ticket (Lapor Kendala) — Design Spec

**Tanggal**: 2026-06-16  
**Status**: Approved (brainstorming session)  
**Author**: Brainstorming session  

---

## 1. Tujuan

Menyediakan mekanisme **Open Ticket** terstruktur bagi **user** dan **teknisi** untuk melaporkan kendala atau gangguan seputar platform/layanan, dengan:

- Form informatif: kategori, prioritas, judul, deskripsi, lampiran bukti.
- Dropdown **layanan terkait** yang otomatis terisi dari aktivitas akun (konsultasi, remote, inspeksi, order marketplace), plus opsi **Lainnya** untuk isian manual.
- Thread balasan dua arah antara pelapor dan admin.
- Antrian khusus admin untuk triase dan penyelesaian.
- Notifikasi in-app saat ada tiket baru atau balasan.

Fitur ini **terpisah** dari Chat Admin (informal) dan Komplain Marketplace (sengketa order).

---

## 2. Keputusan bisnis (ringkas)

| Topik | Keputusan |
|-------|-----------|
| Pendekatan arsitektur | Modul tiket terpisah (`SupportTicket` + API + UI dedicated) |
| Roles pelapor | USER dan TEKNISI |
| Alur balasan | Thread di halaman detail tiket; admin balas dari panel khusus |
| Penutupan tiket | `RESOLVED` = permanen (read-only); lanjutan = **tiket baru** dengan `previousTicketId` |
| Kategori | 6 kategori tetap (dropdown) |
| Prioritas | Dipilih pelapor (`LOW` / `NORMAL` / `HIGH` / `URGENT`); admin dapat mengubah |
| Layanan terkait (dropdown) | Konsultasi, remote, inspeksi, order marketplace + **Lainnya** |
| Lampiran | Ya — max 5 file per submit (foto + video); admin juga dapat melampirkan |
| Notifikasi | In-app saja (polarisasi `PlatformNotification` via fetcher dinamis) |
| Email / Telegram | Out of scope v1 |

---

## 3. Navigasi & halaman

### 3.1 Menu sidebar

| Role | Label menu | Route | Posisi |
|------|------------|-------|--------|
| USER | Lapor Kendala | `/user/tickets` | Bottom nav (dekat Bantuan & Dukungan) |
| TEKNISI | Lapor Kendala | `/teknisi/tickets` | Bottom nav |
| ADMIN | Tiket Dukungan | `/admin/tickets` | Section Operasional |

Badge sidebar = jumlah tiket dengan balasan belum dibaca (`reporterUnread` untuk pelapor, `adminUnread` untuk admin).

### 3.2 Halaman pelapor

- `/user/tickets` — daftar tiket
- `/user/tickets/new` — form buat tiket
- `/user/tickets/[id]` — detail + thread
- Route teknisi identik di bawah `/teknisi/tickets/*`

### 3.3 Halaman admin

- `/admin/tickets` — antrian dua panel (list + detail)

### 3.4 Integrasi Bantuan

Di `/user/help` dan `/teknisi/help`, tambah kartu CTA:

> **Ada kendala?** Laporkan masalah Anda ke tim admin → tombol **Buka Tiket**

Chat Admin dan FAQ tetap ada; peran berbeda dari tiket terstruktur.

---

## 4. Status tiket

```
OPEN → IN_PROGRESS → WAITING_REPORTER → RESOLVED (final)
```

| Status | Makna |
|--------|-------|
| `OPEN` | Baru masuk, belum ditangani admin |
| `IN_PROGRESS` | Admin sedang menangani |
| `WAITING_REPORTER` | Admin menunggu informasi/balasan pelapor |
| `RESOLVED` | Selesai — thread terkunci permanen |

**Aturan transisi otomatis:**

- Admin pertama kali ambil/buka tiket `OPEN` → set `assignedAdminId`, status `IN_PROGRESS` (opsional auto-assign).
- Admin kirim balasan ke pelapor → status `WAITING_REPORTER`, `reporterUnread = true`.
- Pelapor balas saat `WAITING_REPORTER` atau `IN_PROGRESS` → status `IN_PROGRESS`, `adminUnread = true`.
- Admin PATCH status `RESOLVED` → set `resolvedAt`; tidak ada reopen.
- Pelapor buat tiket lanjutan → field `previousTicketId` mengacu tiket `RESOLVED` lama.

---

## 5. Model data (Prisma)

### 5.1 Enum

```prisma
enum SupportTicketReporterRole {
  USER
  TEKNISI
}

enum SupportTicketCategory {
  SERVICE_ISSUE      // Gangguan layanan
  PAYMENT_WALLET     // Pembayaran / saldo / wallet
  MARKETPLACE        // Masalah order marketplace
  ACCOUNT_SECURITY   // Akun & keamanan
  PLATFORM_BUG       // Bug / error platform
  OTHER              // Lainnya
}

enum SupportTicketPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum SupportTicketStatus {
  OPEN
  IN_PROGRESS
  WAITING_REPORTER
  RESOLVED
}

enum SupportTicketRelatedType {
  KONSULTASI
  REMOTE
  INSPEKSI
  MARKETPLACE_ORDER
  OTHER
}

enum SupportTicketMediaKind {
  IMAGE
  VIDEO
}

enum SupportTicketAuthorRole {
  USER
  TEKNISI
  ADMIN
}
```

### 5.2 `SupportTicket`

| Field | Tipe | Keterangan |
|-------|------|------------|
| `id` | cuid | Primary key |
| `publicId` | string @unique | Format tampilan: `TKT-YYYYMMDD-XXXX` |
| `reporterId` | FK → User | Pembuat tiket |
| `reporterRole` | SupportTicketReporterRole | Role saat submit |
| `category` | SupportTicketCategory | |
| `priority` | SupportTicketPriority | Default `NORMAL` |
| `status` | SupportTicketStatus | Default `OPEN` |
| `subject` | string | 10–120 karakter |
| `description` | text | Min 30 karakter (deskripsi awal) |
| `relatedType` | SupportTicketRelatedType? | Null jika tidak pilih layanan |
| `relatedId` | string? | ID entitas terkait |
| `relatedLabel` | string? | Label dropdown saat submit |
| `relatedManualNote` | string? | Wajib jika `relatedType = OTHER` (min 10 char) |
| `relatedSnapshot` | Json? | Snapshot konteks layanan saat submit |
| `previousTicketId` | FK? → SupportTicket | Tiket lama (lanjutan) |
| `assignedAdminId` | FK? → User | Admin penanggung jawab |
| `resolvedAt` | DateTime? | |
| `lastMessageAt` | DateTime | Sort antrian |
| `reporterUnread` | boolean @default(false) | Balasan admin belum dibaca pelapor |
| `adminUnread` | boolean @default(true) | Balasan pelapor belum dibaca admin |
| `createdAt` / `updatedAt` | DateTime | |

Index: `[status, lastMessageAt]`, `[reporterId, createdAt]`, `[adminUnread, priority, lastMessageAt]`.

### 5.3 `SupportTicketMessage`

| Field | Tipe | Keterangan |
|-------|------|------------|
| `id` | cuid | |
| `ticketId` | FK → SupportTicket | |
| `authorId` | FK → User | |
| `authorRole` | SupportTicketAuthorRole | |
| `body` | text | |
| `isInternal` | boolean @default(false) | Catatan internal admin — tidak tampil ke pelapor |
| `createdAt` | DateTime | |

### 5.4 `SupportTicketMedia`

| Field | Tipe | Keterangan |
|-------|------|------------|
| `id` | cuid | |
| `ticketId` | FK | |
| `messageId` | FK? | Null = lampiran deskripsi awal |
| `kind` | SupportTicketMediaKind | |
| `url` | string | |
| `fileName` | string | |
| `mimeType` | string | |
| `sizeBytes` | int | |
| `createdAt` | DateTime | |

### 5.5 Relasi User

Tambahkan di model `User`:

```prisma
supportTicketsReported  SupportTicket[] @relation("TicketReporter")
supportTicketsAssigned  SupportTicket[] @relation("TicketAssignee")
supportTicketMessages   SupportTicketMessage[]
```

---

## 6. Dropdown layanan terkait

**Endpoint:** `GET /api/tickets/related-services`

Mengembalikan maks. **20 entri terbaru** (`updatedAt desc`).

### 6.1 Sumber data — USER

| Type | Model | Filter ownership |
|------|-------|------------------|
| `KONSULTASI` | `KonsultasiSession` | `userId = session.user.id` |
| `REMOTE` | `RemoteSession` | `userId = session.user.id` |
| `INSPEKSI` | `InspectionOrder` | `userId = session.user.id` |
| `MARKETPLACE_ORDER` | `Order` | `buyerId = session.user.id` |

### 6.2 Sumber data — TEKNISI

| Type | Model | Filter ownership |
|------|-------|------------------|
| `KONSULTASI` | `KonsultasiSession` | `teknisiId` via profil teknisi |
| `REMOTE` | `RemoteSession` | teknisi penanggung jawab |
| `INSPEKSI` | `InspectionOrder` | teknisi assignee |
| `MARKETPLACE_ORDER` | `Order` | seller = toko teknisi |

### 6.3 Format respons item

```json
{
  "type": "KONSULTASI",
  "id": "clx...",
  "label": "Konsultasi — Ahmad Hidayat — 16 Jun 2026",
  "subtitle": "Status: Berlangsung · ID: KON-00123",
  "href": "/user/konsultasi"
}
```

Opsi terakhir selalu:

```json
{ "type": "OTHER", "id": null, "label": "Lainnya (isi manual)" }
```

### 6.4 Deep link pre-select

Form buat tiket menerima query `?relatedType=KONSULTASI&relatedId=...` untuk pre-select dropdown saat user datang dari halaman layanan.

### 6.5 Snapshot konteks

Saat submit dengan `relatedType !== OTHER`, server membangun `relatedSnapshot` (JSON) dari data live:

- **Konsultasi:** teknisi/user, status, perangkat, OS, catatan, tanggal.
- **Remote:** status, durasi, perangkat, catatan.
- **Inspeksi:** status, objek inspeksi, teknisi.
- **Marketplace:** nomor order, produk, status pengiriman, buyer/seller.

Snapshot disimpan agar admin melihat konteks historis meski data layanan berubah.

---

## 7. Form buat tiket

| Field | Wajib | Validasi |
|-------|-------|----------|
| Kategori | Ya | Enum 6 nilai |
| Prioritas | Ya | Default `NORMAL` |
| Layanan terkait | Tidak | Ownership check jika dipilih |
| Manual note | Kondisional | Wajib min 10 char jika `OTHER` |
| Tiket sebelumnya | Tidak | Hanya tiket `RESOLVED` milik sendiri |
| Judul | Ya | 10–120 karakter |
| Deskripsi | Ya | Min 30 karakter |
| Lampiran | Tidak | Max 5 file; image (jpeg,png,webp) + video (mp4,webm); max 10 MB/file |

Upload reuse pola `marketplace-complaint-media` (helper baru `support-ticket-media.ts`).

**Rate limit:** max 5 tiket baru per jam per `reporterId`.

---

## 8. UI admin (`/admin/tickets`)

### 8.1 Panel kiri — antrian

Kolom: public ID, pelapor (nama + role), kategori, prioritas, status, layanan terkait, waktu masuk, badge unread.

Filter: status, prioritas, kategori, role pelapor, rentang tanggal.

Sort default: `adminUnread DESC` → prioritas (`URGENT` first) → `lastMessageAt DESC`.

Tab: **Semua** | **Baru** (`OPEN`) | **Proses** | **Menunggu pelapor** | **Selesai**.

### 8.2 Panel kanan — detail

1. Header: ID, status, prioritas, tombol aksi
2. Info pelapor: nama, email, role
3. Konteks layanan: label, link, snapshot card
4. Link tiket sebelumnya (`previousTicketId`)
5. Thread pesan (kronologis)
6. Grid lampiran (lightbox)
7. Form balasan + upload

### 8.3 Aksi admin

| Aksi | Efek |
|------|------|
| Ambil tiket | `assignedAdminId` = admin login; status → `IN_PROGRESS` |
| Balas ke pelapor | Message `isInternal=false`; status → `WAITING_REPORTER`; `reporterUnread=true` |
| Catatan internal | Message `isInternal=true`; tidak mengubah unread pelapor |
| Ubah prioritas | PATCH priority |
| Tandai selesai | status → `RESOLVED`; `resolvedAt` diisi |

---

## 9. UI pelapor

### 9.1 Daftar tiket

Kartu: public ID, judul, kategori, status, prioritas, `lastMessageAt`. Badge "Balasan baru" jika `reporterUnread`. Filter aktif / selesai. Tombol **+ Lapor Kendala**.

### 9.2 Detail tiket

- Thread tanpa pesan `isInternal`
- Card konteks layanan + link
- Form balasan jika status ≠ `RESOLVED`
- Banner tiket selesai + tombol **Buat tiket lanjutan** (pre-fill `previousTicketId`)

---

## 10. API endpoints

### 10.1 Pelapor (USER / TEKNISI)

```
GET    /api/tickets                    — daftar tiket milik sendiri
POST   /api/tickets                    — buat tiket (multipart)
GET    /api/tickets/unread-count       — badge sidebar
GET    /api/tickets/related-services   — dropdown layanan
GET    /api/tickets/[id]               — detail + thread (exclude internal)
POST   /api/tickets/[id]/messages      — balas (reject if RESOLVED)
PATCH  /api/tickets/[id]/read          — reporterUnread = false
```

### 10.2 Admin

```
GET    /api/admin/tickets              — antrian + filter
GET    /api/admin/tickets/[id]         — detail lengkap
PATCH  /api/admin/tickets/[id]       — status / priority / assign
POST   /api/admin/tickets/[id]/messages — balas / internal note
```

### 10.3 RBAC

- Pelapor: `reporterId = session.user.id` pada semua read/write
- Admin: role `ADMIN` pada prefix `/api/admin/tickets`
- `isInternal` messages tidak pernah di-serialize ke API pelapor

---

## 11. Notifikasi in-app

File baru: `src/lib/ticket-notifications.ts`

Integrasi di `GET /api/notifications` (sama pola `fetchMarketplaceNotificationsForUser`).

| Event | Penerima | Contoh judul |
|-------|----------|--------------|
| Tiket dibuat | ADMIN | "Tiket baru #TKT-..." |
| Admin balas | Pelapor | "Balasan admin pada tiket Anda" |
| Pelapor balas | ADMIN | "Balasan baru pada #TKT-..." |
| Status RESOLVED | Pelapor | "Tiket Anda telah diselesaikan" |
| Prioritas → URGENT | ADMIN | "Tiket mendesak: ..." |

Setiap notifikasi punya `href` ke detail tiket. Badge sidebar via `GET /api/tickets/unread-count` (poll 60s).

---

## 12. ActivityLog

| Action code | Kapan |
|-------------|-------|
| `ticket.created` | Tiket baru |
| `ticket.replied` | Balasan (pelapor/admin) |
| `ticket.status_changed` | Ubah status |
| `ticket.priority_changed` | Ubah prioritas |
| `ticket.resolved` | Status RESOLVED |

Category: `COMMUNICATION` atau `ADMIN` (sesuai actor).

---

## 13. Keamanan

- Ownership check entitas terkait saat submit
- Validasi MIME + ukuran file di server
- Rate limit 5 tiket/jam per akun
- Sanitasi teks (escape HTML di render)
- Admin internal notes terisolasi dari API pelapor

---

## 14. File baru (perkiraan)

```
prisma/schema.prisma + migration
src/lib/support-ticket-validation.ts
src/lib/support-ticket-serializer.ts
src/lib/support-ticket-snapshot.ts
src/lib/support-ticket-media.ts
src/lib/ticket-notifications.ts
src/app/api/tickets/**
src/app/api/admin/tickets/**
src/app/user/tickets/**
src/app/teknisi/tickets/**
src/app/admin/tickets/**
src/components/support-ticket/**
src/components/dashboard/user-sidebar.tsx      (menu + badge)
src/components/dashboard/teknisi-sidebar.tsx   (menu + badge)
src/components/dashboard/admin-sidebar.tsx     (menu + badge)
src/components/help/help-support-page.tsx      (CTA)
src/app/api/notifications/route.ts             (integrasi fetcher)
```

---

## 15. Rencana testing

### 15.1 Functional (manual)

| ID | Skenario |
|----|----------|
| FT-TKT-001 | User buat tiket dengan layanan konsultasi terkait → snapshot benar |
| FT-TKT-002 | User pilih Lainnya + manual note → tersimpan |
| FT-TKT-003 | Admin balas → pelapor notifikasi + badge |
| FT-TKT-004 | Pelapor balas → admin notifikasi + status IN_PROGRESS |
| FT-TKT-005 | Admin resolve → thread terkunci |
| FT-TKT-006 | Tiket lanjutan dengan previousTicketId |
| FT-TKT-007 | Teknisi buat tiket order marketplace toko |
| FT-TKT-008 | Internal note tidak tampil ke pelapor |
| FT-TKT-009 | Upload lampiran validasi tipe/ukuran |
| FT-TKT-010 | Rate limit 5 tiket/jam |

### 15.2 Regression

- Komplain marketplace tidak terpengaruh
- Chat admin tetap berfungsi
- Notifikasi existing tidak rusak

---

## 16. Out of scope v1

- Email / Telegram notification
- SLA timer / auto-escalation
- Assign tiket ke admin tertentu secara wajib (opsional assign saja)
- Sub-kategori dinamis per kategori
- Wallet, topup, IMEI/server di dropdown layanan terkait
- Reopen tiket RESOLVED

---

## 17. Referensi kode existing

- Upload media: `src/lib/marketplace-complaint-media.ts`
- Notifikasi dinamis: `src/lib/marketplace-notifications.ts`, `src/app/api/notifications/route.ts`
- Admin dua panel: pola `src/app/admin/marketplace-complaints/`
- Sidebar badge: `src/components/dashboard/teknisi-sidebar.tsx`
