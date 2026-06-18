# Konsultasi + Remote + Pembayaran Upfront — Design Spec

**Tanggal**: 2026-06-12  
**Status**: Approved  
**Author**: Brainstorming session  

---

## 1. Tujuan

Mengintegrasikan konsultasi teknisi dengan dukungan remote (IndoDesk) dalam **satu alur terpadu**, dengan pembayaran yang **aman sebelum teknisi mulai bekerja**:

- Remote tidak gratis dan tidak standalone.
- Semua konsultasi wajib **hold wallet** atau **bayar via payment gateway** sebelum teknisi `start`.
- Payment gateway di-abstraksi dulu (provider konkret nanti: Midtrans/Xendit).

---

## 2. Keputusan bisnis

| Topik | Keputusan |
|-------|-----------|
| Integrasi | Konsultasi + remote = satu booking |
| Remote gratis | Tidak — hanya via paket `requiresRemote: true` |
| `/remote` | Panduan + download IndoDesk; bukan entry booking |
| Payment gateway | Abstraksi provider (stub → Midtrans/Xendit) |
| Waktu bayar | **Di awal**, sebelum teknisi `start` |
| Saldo cukup | Hold wallet (`ESCROW_HOLD`) |
| Saldo kurang | PG langsung (tanpa top-up wallet dulu) |
| Cakupan | **Semua konsultasi** (remote dan non-remote) |
| Cancel `PENDING` | Refund penuh (release hold / PG refund) |
| Cancel `ACTIVE` | Hanya teknisi; **no refund** |
| `AWAITING_PAYMENT` | Auto-expire 30 menit |

---

## 3. Alur user

```
Pilih paket → perangkat + OS (+ IndoDesk jika requiresRemote)
                    │
                    ▼
           Saldo wallet ≥ harga?
              │         │
             Ya        Tidak
              │         │
              ▼         ▼
         Hold wallet   AWAITING_PAYMENT → redirect PG (stub/internal)
              │         │
              └────┬────┘
                   ▼
         paymentStatus = SECURED
         konsultasiStatus = PENDING
                   │
                   ▼
         Teknisi Mulai (ACTIVE)
                   │
                   ▼
         Selesai → kredit teknisi (CAPTURED)
         Batal   → release hold / refund PG
```

---

## 4. State machine

### 4.1 `KonsultasiStatus`

| Status | Makna |
|--------|-------|
| `AWAITING_PAYMENT` | Menunggu konfirmasi PG |
| `PENDING` | Dana aman, menunggu teknisi |
| `ACTIVE` | Sesi berjalan |
| `COMPLETED` | Selesai, dana ke teknisi |
| `CANCELLED` | Dibatalkan |

### 4.2 `KonsultasiPaymentStatus`

| Status | Makna |
|--------|-------|
| `UNPAID` | Belum bayar |
| `HELD` | Saldo wallet tertahan |
| `PAID` | PG sukses, escrow platform |
| `SECURED` | Siap dikerjakan teknisi |
| `CAPTURED` | Sudah ke teknisi |
| `RELEASED` | Hold/refund setelah cancel |

### 4.3 Guard teknisi

Teknisi `start` hanya jika:

- `status === PENDING`
- `paymentStatus === SECURED`

Jika `requiresRemote === true`, `remoteId` wajib terisi sebelum `SECURED`.

---

## 5. Data model

### 5.1 `KonsultasiSession` (field baru)

```prisma
enum ClientOs { WINDOWS MACOS }
enum KonsultasiPaymentMethod { WALLET_HOLD PAYMENT_GATEWAY LEGACY_DEBIT }
enum KonsultasiPaymentStatus { UNPAID HELD PAID SECURED CAPTURED RELEASED }

model KonsultasiSession {
  // existing fields …

  note           String?  @db.Text
  device         String?
  clientOs       ClientOs?
  requiresRemote Boolean  @default(false)
  remoteId       String?
  remoteOtp      String?

  paymentMethod    KonsultasiPaymentMethod?
  paymentStatus    KonsultasiPaymentStatus @default(UNPAID)
  pgProvider       String?
  pgExternalRef    String?  @unique
  paidAt           DateTime?
  paymentExpiresAt DateTime?
}
```

`service` = nama paket; `note` terpisah (tidak lagi digabung ke string service).

### 5.2 `ProfileConsultationService`

```typescript
{
  name: string
  description: string
  duration: string
  price: number | null
  popular: boolean
  requiresRemote: boolean  // NEW
}
```

### 5.3 `RemoteSession`

- Deprecate `POST /api/remote` untuk user booking.
- Data remote pindah ke `KonsultasiSession`.
- Model lama dipertahankan sementara untuk read-only / migrasi.

---

## 6. Wallet

Pola mengikuti `rekber-wallet.ts` (`ESCROW_HOLD` / refund).

| Event | Ledger user | Ledger teknisi |
|-------|-------------|----------------|
| Booking (saldo cukup) | `ESCROW_HOLD` | — |
| `COMPLETED` | — | `EARNING` |
| `CANCELLED` (refund) | `REFUND` atau credit hold back | — |

Fungsi baru di `konsultasi-wallet.ts`:

- `holdUserForKonsultasi`
- `releaseKonsultasiHoldToUser`
- `finalizeKonsultasiPaymentToTeknisi` (complete — idempotent)

**Legacy**: sesi lama dengan `PAYMENT` ledger → refund/credit tetap via `refundUserForKonsultasi` / `creditTeknisiForKonsultasi`.

Migrasi data: sesi existing `PENDING`/`ACTIVE` → `paymentStatus: SECURED`, `paymentMethod: LEGACY_DEBIT`; `COMPLETED` → `CAPTURED`.

---

## 7. Payment Gateway (abstraksi)

```typescript
interface PaymentGatewayProvider {
  name: string
  createPayment(input: CreateConsultationPaymentInput): Promise<PaymentCreateResult>
  verifyWebhook(payload: unknown, headers: Headers): Promise<PaymentWebhookResult>
  refund?(externalRef: string, amount: number): Promise<void>
}
```

**Fase 1**: `StubPaymentGatewayProvider` — redirect internal + endpoint konfirmasi.

**Fase 2**: Midtrans/Xendit plug-in.

API:

- Booking POST mengembalikan `{ needsPayment, redirectUrl, session }` jika saldo kurang.
- `POST /api/payments/konsultasi/webhook` — konfirmasi PG.
- `POST /api/user/konsultasi/[id]/confirm-payment` — stub confirm (dev).

---

## 8. UI

### 8.1 Form booking (`konsultasi-booking-dialog.tsx`)

- Paket (+ badge “Termasuk remote”)
- Perangkat (wajib)
- OS: Windows / macOS (wajib)
- Catatan (opsional)
- Jika `requiresRemote`: IndoDesk ID + OTP + link `/remote`
- Saldo cukup: “Saldo akan ditahan”
- Saldo kurang: redirect PG
- Tombol: **“Pesan Sesi”**

### 8.2 Profil teknisi

Toggle **“Membutuhkan akses remote (IndoDesk)”** per paket di `ConsultationServicesEditor`.

### 8.3 Dashboard teknisi

- Hanya tampilkan `PENDING` dengan `paymentStatus === SECURED`.
- Badge Remote / Konsultasi saja.
- Info perangkat, OS, IndoDesk jika remote.
- `Mulai` disabled jika pembayaran belum aman.

### 8.4 `/remote`

Tetap panduan; tidak ada form booking.

---

## 9. Migrasi

| Saat ini | Target |
|----------|--------|
| Debit `PAYMENT` saat booking | `ESCROW_HOLD` + `SECURED` |
| Refund on cancel | `releaseKonsultasiHoldToUser` atau legacy refund |
| Credit teknisi on complete | Tetap idempotent |
| `RemoteSession` booking | Field di `KonsultasiSession` |
| `POST /api/remote` | 410 + pesan arahkan ke konsultasi |

---

## 10. Testing

Update functional test helpers di `scripts/ft/lib.ts` (`bookKonsultasiSession`) untuk field baru dan hold flow.

Skenario minimal:

1. Booking dengan saldo cukup → hold + PENDING + teknisi start OK.
2. Booking saldo kurang → AWAITING_PAYMENT → confirm → PENDING.
3. Cancel PENDING → release hold.
4. Complete → teknisi earning.
5. `requiresRemote` + validasi IndoDesk ID.
6. Teknisi start blocked jika `paymentStatus !== SECURED`.

---

## 11. Out of scope (fase ini)

- Provider PG produksi (Midtrans/Xendit).
- Dispute mediasi admin setelah `ACTIVE`.
- Hapus model `RemoteSession` dari DB.
