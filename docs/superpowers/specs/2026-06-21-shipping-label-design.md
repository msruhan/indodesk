# Digital Shipping Label (Resi Bantoo) — Design Spec

**Tanggal**: 2026-06-21  
**Status**: Approved  
**Relates to**: `docs/superpowers/specs/2026-06-17-marketplace-order-documentation-design.md`

---

## 1. Tujuan

Menyediakan **label pengiriman digital** (format PNG) ala Shopee untuk penjual marketplace fisik. Label ini adalah **packing slip internal Bantoo** — bukan pengganti AWB/resi kurir (tetap via BinderByte).

Penjual mengunduh label setelah pesanan **Diproses**, menempelkannya pada paket, dan kurir tetap menerima **nomor resi eksternal** yang diinput penjual.

---

## 2. Keputusan bisnis

| Topik | Keputusan |
|-------|-----------|
| QR tujuan | **A** — shortcut untuk **pembeli / teknisi / admin** terkait order (bukan verifikasi publik/kurir) |
| QR pendekatan | Deep link + login (`/l/{token}`), bukan halaman verify publik |
| QR URL | `{APP_URL}/l/{shippingLabelToken}` — token acak, **bukan** `orderCode` |
| Setelah scan | Login jika perlu → cek role → redirect ke detail pesanan |
| Kapan generate | Saat **PROCESSING** (packaging sudah approved); re-download OK untuk **SHIPPED** |
| Produk digital | **Out of scope** — tidak ada label |
| Isi PNG | Kode order, penerima/pengirim, kurir, berat, item, QR |

---

## 3. Schema

```prisma
model Order {
  // ...
  shippingLabelToken       String?   @unique
  shippingLabelGeneratedAt DateTime?
}
```

Token di-generate lazy saat pertama kali unduh label (atau saat status masuk PROCESSING).

---

## 4. Akses

| Aksi | Pembeli | Penjual | Admin | Publik |
|------|---------|---------|-------|--------|
| Unduh PNG | ✓ | ✓ | ✓ | ✗ |
| Scan QR → detail order | ✓ (order sendiri) | ✓ (order sendiri) | ✓ | ✗ (wajib login + role) |

**Syarat unduh:**
- Order fisik (`orderRequiresPhysicalPackaging`)
- Ada alamat pengiriman
- Status `PROCESSING` atau `SHIPPED`

---

## 5. Alur

```
PAID → packaging approved → Proses Pesanan → PROCESSING
  │
  ├─ Penjual: "Unduh label pengiriman" → GET /api/marketplace/orders/{id}/shipping-label → PNG
  │
  ├─ Tempel label + kirim ke kurir
  │
  └─ Input AWB → SHIPPED (flow existing)
```

QR pada label → `/l/{token}` → login? → redirect:
- Pembeli → `/user/orders/{id}`
- Penjual → `/teknisi/pesanan?focus={id}`
- Admin → `/admin/dashboard`

---

## 6. API & route

| Endpoint | Method | Auth | Response |
|----------|--------|------|----------|
| `/api/marketplace/orders/[id]/shipping-label` | GET | buyer/seller/admin | `image/png` |
| `/l/[token]` | GET | optional (redirect login) | redirect atau akses ditolak |

---

## 7. UI

- Tombol **"Unduh label pengiriman"** di `/teknisi/pesanan` saat `canDownloadShippingLabel`
- Flag serializer: `canDownloadShippingLabel`

---

## 8. Out of scope (MVP)

- Barcode 1D (kode order monospace saja)
- Verifikasi kurir / halaman publik
- PDF multi-label
- Auto-generate saat advance (lazy on download cukup)
