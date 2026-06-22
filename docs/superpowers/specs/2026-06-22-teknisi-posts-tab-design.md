# Postingan Teknisi — Tab Profil Publik & Composer

**Tanggal:** 2026-06-22  
**Status:** Approved (opsi A — tab terpisah)  
**Author:** Brainstorming session  

---

## 1. Tujuan

Teknisi dapat membuat **postingan publik** (feed sosial ringan) di halaman profil `/teknisi/[id]`, terpisah dari **Portofolio & Highlight Kasus** yang sudah ada (kartu kasus statis dari settings).

**Keputusan produk:**
- **Opsi A** — tab terpisah: `[ Profil ]` | `[ Postingan ]` pada halaman profil publik yang sama.
- **Moderasi opsi C** — posting langsung publik; teknisi edit/hapus milik sendiri; admin dapat hapus jika melanggar.

**Keberhasilan:**
- Teknisi yang login dan membuka profil sendiri melihat tombol **Buat Postingan** dan dapat publish dari popup composer.
- Visitor melihat feed kronologis di tab Postingan tanpa tombol edit.
- Portofolio kasus (settings) tetap utuh di tab Profil — tidak bercampur dengan feed.

---

## 2. Perbedaan konten

| | Portofolio kasus (existing) | Postingan (baru) |
|---|------------------------------|------------------|
| **Tujuan** | Highlight kasus / bukti karya kurasi | Update aktivitas, tips, sharing |
| **Edit** | `/teknisi/settings?tab=portfolio` | Langsung dari profil publik (owner) |
| **Format** | Kartu: title, meta, result, 1 foto opsional | Feed: teks + multi-foto/PDF + link video |
| **Tampilan** | Tab **Profil** | Tab **Postingan** |

---

## 3. Struktur tab profil publik

| Tab | URL | Isi |
|-----|-----|-----|
| **Profil** | `/teknisi/[id]` | Hero, tentang, skill, ledger, layanan, portofolio kasus, ulasan, sidebar |
| **Postingan** | `/teknisi/[id]?tab=postingan` | Feed posting + (owner) CTA buat posting |

**Default tab:** `profil` (tanpa query).  
**Deep link:** `?tab=postingan`.

**UI tab bar:**
- Pola pill tabs sama `teknisi-akun-view.tsx` — `rounded-full`, `motion.span layoutId="teknisi-profile-tab"`, horizontal scroll di mobile.
- Label tab Postingan: **Postingan** + badge count `(n)` jika `n > 0`.
- Posisi: di bawah hero / di atas kontext konten utama (sticky optional di scroll — tidak wajib MVP).

**Ikon:**
- Profil: `UserCircle`
- Postingan: `Newspaper` atau `PenLine` (pilih yang sudah ada di `@/lib/icons`)

---

## 4. Tombol "Buat Postingan"

**Kondisi tampil (semua harus true):**
1. User login (`session.status === 'authenticated'`)
2. Role `TEKNISI`
3. `session.user.id === teknisiId` (profil milik sendiri)

**Posisi:**
- Tab Postingan — kanan atas header feed (desktop)
- Mobile — full-width button di atas feed atau compact FAB kanan bawah area feed (prefer button di atas feed agar konsisten dengan CTA lain)

**Label:** `Buat Postingan` + ikon `Plus`

**Aksi:** buka `TeknisiPostComposerDialog`.

---

## 5. Popup composer (LinkedIn / Threads style)

### Layout

```
┌──────────────────────────────────────────┐
│  Buat Postingan                      ✕   │
├──────────────────────────────────────────┤
│  [Avatar] Nama Teknisi                   │
│  ┌────────────────────────────────────┐  │
│  │ Placeholder: Apa yang ingin Anda   │  │
│  │ bagikan?                           │  │
│  └────────────────────────────────────┘  │
│  [preview area]                          │
│  ─────────────────────────────────────   │
│  📷 Foto   📄 PDF   🔗 Link Video        │
│              [ Batal ]  [ Publikasikan ] │
└──────────────────────────────────────────┘
```

### Field & validasi

| Field | Wajib | Aturan |
|-------|-------|--------|
| Teks | Ya | Min 10, max 2.000 karakter |
| Foto | Tidak | Max 4 file; JPEG/PNG/WebP/GIF; max 5 MB/file |
| PDF | Tidak | Max 1 file; max 8 MB |
| Link video | Tidak | Max 1 URL; platform: YouTube, Vimeo, TikTok (embed) |
| Upload video | **Ditolak** | Hanya URL eksternal |

**Validasi publish:** minimal teks terpenuhi. Lampiran opsional. Jika hanya lampiran tanpa teks — ditolak.

**Video URL:**
- Normalisasi & validasi host (whitelist).
- Simpan URL asli; render embed saat display (iframe/card preview).
- Tidak fetch metadata server-side di MVP — cukup deteksi platform dari hostname.

### UX composer

- Textarea auto-grow, max-height + scroll.
- Action bar: tombol ikon + label kecil (Foto / PDF / Link Video).
- Hidden `<input type="file">` untuk foto (multiple, max 4 total) dan PDF (single).
- Preview:
  - Foto: grid thumbnail 2×2, tombol hapus per item.
  - PDF: kartu dengan ikon `FileText`, nama file, ukuran.
  - Video: input URL + preview embed kecil setelah valid.
- Upload file ke `/api/teknisi/posts/upload` **sebelum** atau **saat** publish (recommend: upload on select, simpan URL sementara di state composer).
- Tombol **Publikasikan** disabled saat uploading atau validasi gagal.
- Loading: spinner on button + disable form.
- Tutup: backdrop click, tombol ✕, Batal — konfirmasi jika ada konten belum disimpan (`useConfirm`).

### Dialog pattern

- Ikuti pola existing: `fixed inset-0 z-[100]` backdrop + panel `z-[101]`, framer-motion enter/exit.
- Mobile: bottom sheet (`rounded-t-3xl`, max-h ~90dvh).
- Desktop: centered modal `max-w-lg`.

---

## 6. Kartu posting (feed)

```
┌──────────────────────────────────────────┐
│  [Avatar] Nama · 2 jam lalu        ···   │
│  Teks postingan (whitespace preserved)   │
│  [foto grid | PDF card | video embed]    │
└──────────────────────────────────────────┘
```

**Header:** avatar teknisi, nama, relative time (`formatDistanceToNow` id-ID).

**Owner menu (`···`):**
- Edit → buka composer prefilled
- Hapus → `useConfirm` → soft delete

**Visitor:** tidak ada menu.

**Media display:**
- 1 foto: full width rounded
- 2–4 foto: grid 2 kolom
- PDF: kartu klik → buka tab baru (`target=_blank`)
- Video: responsive embed 16:9 (YouTube iframe, dll.)

**Pagination:** infinite scroll atau "Muat lebih" — cursor/`page` query, 10 item per halaman.

**Empty state (tab Postingan):**
- Visitor: "Belum ada postingan."
- Owner: empty state + CTA **Buat Postingan pertama**.

---

## 7. Data model (Prisma)

```prisma
model TeknisiPost {
  id          String    @id @default(cuid())
  teknisiId   String
  teknisi     User      @relation("TeknisiPosts", fields: [teknisiId], references: [id], onDelete: Cascade)
  content     String    @db.Text
  videoUrl    String?
  publishedAt DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  attachments TeknisiPostAttachment[]

  @@index([teknisiId, publishedAt(sort: Desc)])
  @@index([teknisiId, deletedAt])
}

model TeknisiPostAttachment {
  id        String      @id @default(cuid())
  postId    String
  post      TeknisiPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  type      String      // "image" | "pdf"
  url       String
  fileName  String?
  mimeType  String?
  sizeBytes Int?
  sortOrder Int         @default(0)

  @@index([postId, sortOrder])
}
```

**Relasi User:** `teknisiPosts TeknisiPost[] @relation("TeknisiPosts")`

**Batasan:**
- Max **50** posting aktif (`deletedAt IS NULL`) per teknisi.
- Soft delete: set `deletedAt`; tidak tampil publik.

---

## 8. API

| Method | Route | Auth | Deskripsi |
|--------|-------|------|-----------|
| `GET` | `/api/teknisi/[id]/posts?page=1&limit=10` | Publik | List posting (exclude soft-deleted) |
| `POST` | `/api/teknisi/posts` | TEKNISI | Buat posting |
| `PATCH` | `/api/teknisi/posts/[id]` | TEKNISI owner | Edit posting |
| `DELETE` | `/api/teknisi/posts/[id]` | TEKNISI owner atau ADMIN | Soft delete |
| `POST` | `/api/teknisi/posts/upload` | TEKNISI | Upload foto/PDF |

### Request body `POST /api/teknisi/posts`

```json
{
  "content": "string",
  "videoUrl": "https://youtube.com/...",
  "attachments": [
    { "type": "image", "url": "/uploads/...", "fileName": "a.jpg", "mimeType": "image/jpeg", "sizeBytes": 12345, "sortOrder": 0 },
    { "type": "pdf", "url": "/uploads/...", "fileName": "doc.pdf", "mimeType": "application/pdf", "sizeBytes": 99999, "sortOrder": 1 }
  ]
}
```

### Response list item DTO

```typescript
type TeknisiPostDto = {
  id: string
  content: string
  videoUrl: string | null
  publishedAt: string
  updatedAt: string
  attachments: Array<{
    id: string
    type: 'image' | 'pdf'
    url: string
    fileName: string | null
    sortOrder: number
  }>
  author: { id: string; name: string; avatarUrl: string | null }
  isOwner?: boolean // hanya jika requester = owner
}
```

### Upload

- Path storage: `teknisi-posts/{teknisiId}/`
- Reuse `saveImage()` untuk foto; PDF reuse pola `saveCertificationFile()` atau helper baru `saveTeknisiPostFile()`.
- Validasi MIME server-side (sama client).

### Moderation (opsi C)

- Publish = langsung `publishedAt = now()`, visible di feed.
- Admin delete: `DELETE` dengan role ADMIN — tidak perlu approval queue.
- **Out of scope MVP UI:** panel moderasi admin; cukup endpoint admin delete (opsional fase 1.5).

---

## 9. Integrasi halaman profil

### `TeknisiPublicProfileView`

1. Parse `searchParams.tab` → `'profil' | 'postingan'`.
2. Render tab bar di bawah hero.
3. Tab Profil: konten existing (conditional sections unchanged).
4. Tab Postingan: `TeknisiPostsFeed` + owner CTA.
5. `isOwner = session?.user?.id === teknisi.id && session?.user?.role === 'TEKNISI'`.

### Komponen baru

| File | Peran |
|------|-------|
| `teknisi-profile-tabs.tsx` | Tab bar + URL sync |
| `teknisi-posts-feed.tsx` | Fetch list, pagination, empty state |
| `teknisi-post-card.tsx` | Kartu single post |
| `teknisi-post-composer-dialog.tsx` | Create/edit modal |
| `teknisi-post-media.tsx` | Grid foto, PDF card, video embed |
| `lib/teknisi-post.ts` | DTO, validation schemas (zod) |
| `lib/teknisi-post-upload-server.ts` | Server upload helper |
| `lib/video-embed-url.ts` | Parse & validate YouTube/Vimeo/TikTok |

### `GET /api/teknisi/[id]` (existing)

- Tambah field opsional `postCount: number` untuk badge tab (aggregate count, exclude deleted).

---

## 10. Error handling

| Situasi | Respons |
|---------|---------|
| Teks terlalu pendek/panjang | 400 + pesan ID |
| >4 foto atau >1 PDF | 400 |
| Video URL invalid | 400 |
| >50 posting aktif | 400 "Batas posting tercapai" |
| Upload MIME/size invalid | 400 |
| Edit/hapus bukan owner | 403 |
| Posting tidak ditemukan / sudah dihapus | 404 |

Client: toast error via `sonner`; inline error di composer.

---

## 11. Out of scope (v1)

- Like, comment, share counter
- Notifikasi follower
- Upload file video
- Rich text / markdown editor
- Admin moderation dashboard UI
- Report/flag posting by user
- Scheduling post

---

## 12. Testing

### Manual

1. Login sebagai teknisi A → buka `/teknisi/{id-A}` → tab Postingan → **Buat Postingan** tampil.
2. Publish teks + 2 foto + PDF + YouTube URL → tampil di feed.
3. Logout → feed tetap visible, tidak ada menu owner.
4. Login teknisi B → buka profil A → tidak ada **Buat Postingan**.
5. Owner edit posting → perubahan tampil.
6. Owner hapus → hilang dari feed.
7. `?tab=postingan` deep link → langsung tab Postingan.
8. Tab Profil → portofolio kasus existing tidak berubah.
9. Mobile: composer bottom sheet, tab scroll horizontal.
10. Upload video file → ditolak server.

### Regression

- Booking konsultasi/inspeksi dari profil tetap berfungsi.
- Chat, reviews, digital ID card tidak terpengaruh.

---

## 13. Urutan implementasi

1. Prisma migration + `lib/teknisi-post.ts` (schemas, DTO).
2. Upload helper + `POST /api/teknisi/posts/upload`.
3. CRUD API routes.
4. `GET /api/teknisi/[id]/posts` + `postCount` on profile API.
5. UI: composer dialog → post card → feed.
6. Integrate tabs + owner CTA in `TeknisiPublicProfileView`.
7. Manual smoke test.

---

## 14. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Storage membengkak | No video upload; max 4 foto + 1 PDF; max 50 posts |
| Spam posting | Rate limit optional (future); batas 50 posts |
| `teknisi-public-profile-view.tsx` sudah besar | Extract tab + feed ke file terpisah |
| Embed video XSS | Whitelist host + sanitize URL; iframe sandbox attrs |
| PDF malware | Serve as download/view only; no server execution |
