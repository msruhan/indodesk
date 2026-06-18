# Withdraw Manual + Monitoring Keamanan Wallet — Design Spec

**Tanggal**: 2026-06-12  
**Status**: Approved — implemented (2026-06-12)  
**Author**: Brainstorming session  

---

## 1. Tujuan

Mendesain alur **penarikan saldo (withdraw)** untuk USER dan TEKNISI yang:

- **Tidak** diteruskan otomatis ke payment gateway — owner transfer manual ke rekening bank.
- SLA pemrosesan: **1×24 jam**.
- Saldo di-**hold** saat pengajuan agar tidak double-spend.
- Menolak withdraw memerlukan **konfirmasi kedua** dengan password/2FA (satu admin boleh, step-up auth).
- Sistem mendeteksi **anomali saldo** (kredit tanpa sumber legitim) dan memberi alert saat review withdraw.

**Prasyarat codebase:** `WalletLedger` append-only, `runWalletReconciliation()`, pola `WalletDepositRequest` + `dual-control.ts`, FT-WAL-005/006.

---

## 2. Keputusan bisnis

| Topik | Keputusan |
|-------|-----------|
| Alur withdraw | **A** — Request + Hold |
| Payment gateway payout | **Tidak** — transfer manual owner |
| SLA | 1×24 jam (ditampilkan ke user; reminder admin jika mendekati/lebih) |
| USER vs TEKNISI | Alur identik; limit harian via `walletPolicyOverride` / env |
| Reject withdraw | Status `REJECT_PENDING_RELEASE` → konfirmasi kedua + password/2FA → `REJECTED` + release hold |
| Dual-control reject | **Satu admin boleh**; wajib **password atau 2FA dua kali** (bukan dua admin berbeda) |
| Approve withdraw | Satu langkah + password/2FA admin; input bukti transfer opsional |
| API withdraw saat ini | `POST /api/wallet/withdraw` instant-debit — **diganti** menjadi create request + hold |

---

## 3. Model data

### 3.1 `WalletWithdrawRequest` (baru)

```prisma
enum WalletWithdrawStatus {
  PENDING                  // menunggu admin transfer / tolak
  COMPLETED                // sudah ditransfer & dikonfirmasi
  REJECT_PENDING_RELEASE   // ditolak tahap 1, menunggu konfirmasi release
  REJECTED                 // ditolak, hold dilepas
  CANCELLED                // dibatalkan user (opsional fase 2)
}

model WalletWithdrawRequest {
  id              String               @id @default(cuid())
  userId          String
  amount          Decimal              @db.Decimal(14, 0)
  bankName        String
  accountNumber   String
  accountHolder   String
  note            String?              @db.Text
  status          WalletWithdrawStatus @default(PENDING)
  riskScore       Int                  @default(0)   // 0–100
  riskFlags       Json?                // string[]
  ledgerHoldId    String?              // WalletLedger ESCROW_HOLD
  ledgerFinalId   String?              // WITHDRAWAL saat COMPLETED
  ledgerReleaseId String?              // ESCROW_RELEASE saat REJECTED
  proofUrl        String?              // bukti transfer admin (opsional)
  adminNote       String?              @db.Text
  rejectionNote   String?              @db.Text
  processedById   String?              // admin approve complete
  rejectedById    String?              // admin tahap 1 reject
  releaseConfirmedById String?         // admin tahap 2 release (boleh sama user)
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt
  completedAt     DateTime?
  slaDueAt        DateTime             // createdAt + 24h

  user User @relation(...)

  @@index([status, createdAt])
  @@index([userId])
}
```

### 3.2 `WalletSecurityAlert` (baru)

```prisma
enum WalletSecuritySeverity {
  INFO
  MEDIUM
  HIGH
  CRITICAL
}

enum WalletSecurityAlertStatus {
  OPEN
  ACKNOWLEDGED
  RESOLVED
  DISMISSED
}

model WalletSecurityAlert {
  id          String                    @id @default(cuid())
  userId      String?                   // null = platform-wide
  walletId    String?
  ruleCode    String                    // ORPHAN_CREDIT, BALANCE_DRIFT, ...
  severity    WalletSecuritySeverity
  status      WalletSecurityAlertStatus @default(OPEN)
  title       String
  body        String                    @db.Text
  metadata    Json?
  ledgerId    String?
  withdrawRequestId String?
  createdAt   DateTime                  @default(now())
  resolvedAt  DateTime?
  resolvedById String?

  @@index([status, severity, createdAt])
  @@index([userId])
}
```

---

## 4. Alur withdraw

### 4.1 Pengajuan (USER / TEKNISI)

```
POST /api/wallet/withdraw
  → validasi: email verified, password/2FA, daily limit, saldo cukup
  → walletTransaction:
       1. ESCROW_HOLD (-amount)
       2. WalletWithdrawRequest PENDING, slaDueAt = now + 24h
  → hitung riskScore + riskFlags
  → jika riskScore >= 61: buat WalletSecurityAlert + notifikasi admin
  → notifikasi user: "Pengajuan diterima, diproses dalam 1×24 jam"
```

**Saldo tampilan user:** `balance` sudah berkurang (hold). UI boleh menampilkan sublabel "Termasuk Rp X dalam proses penarikan" dari sum request PENDING.

### 4.2 Approve (admin — transfer manual selesai)

```
PATCH /api/admin/wallet/withdraw/[id]  { action: "complete", proofUrl?, adminNote?, confirmPassword | totp }
  → verifikasi step-up auth admin
  → status harus PENDING
  → walletTransaction:
       - Tidak perlu debit lagi (sudah hold)
       - Ledger WITHDRAWAL final (amount negatif, referenceId = request.id)
       - atau: reclassify hold → WITHDRAWAL (satu baris hold tetap, tambah baris penyesuaian — pilih satu pola, lihat §4.5)
  → status COMPLETED, completedAt, processedById
  → notifikasi user
```

### 4.3 Reject — dua langkah, satu admin (opsi C)

**Langkah 1 — Initiate reject**

```
PATCH { action: "reject_init", rejectionNote, confirmPassword | totp }
  → status: PENDING → REJECT_PENDING_RELEASE
  → rejectedById, rejectionNote
  → hold TIDAK dilepas
  → notifikasi user: "Pengajuan ditolak, menunggu konfirmasi sistem"
```

**Langkah 2 — Confirm release**

```
PATCH { action: "reject_confirm_release", confirmPassword | totp }
  → status harus REJECT_PENDING_RELEASE
  → verifikasi step-up auth **kedua** (session baru atau nonce reject; password/2FA wajib lagi)
  → walletTransaction: ESCROW_RELEASE (+amount), referenceId = request.id
  → status REJECTED, releaseConfirmedById
  → notifikasi user: saldo kembali
```

Admin yang mengonfirmasi langkah 2 **boleh sama** dengan langkah 1; yang wajib adalah **credential kedua**, bukan admin kedua.

**Batalkan reject:** Jika salah klik, admin bisa `reject_cancel` dari `REJECT_PENDING_RELEASE` → `PENDING` (tanpa mutasi ledger).

### 4.4 State machine

| Status | Hold aktif | Transisi |
|--------|------------|----------|
| `PENDING` | Ya | → COMPLETED, REJECT_PENDING_RELEASE, (CANCELLED) |
| `REJECT_PENDING_RELEASE` | Ya | → REJECTED, PENDING (cancel) |
| `COMPLETED` | Final withdraw | terminal |
| `REJECTED` | Dilepas | terminal |

### 4.5 Pola ledger (disarankan)

Selaras FT-WAL-005/006 dan escrow existing:

| Event | LedgerType | amount | referenceId |
|-------|------------|--------|-------------|
| Ajuan | `ESCROW_HOLD` | negatif | withdrawRequest.id |
| Selesai | `WITHDRAWAL` | 0 net* atau entry penutup | withdrawRequest.id |
| Tolak (release) | `ESCROW_RELEASE` | positif | withdrawRequest.id |

\*Implementasi: hold sudah mengurangi balance; entry `WITHDRAWAL` bisa berupa baris audit `amount: 0` + metadata, **atau** tidak menambah baris baru dan menandai hold sebagai "consumed". **Keputusan implementasi:** tambah baris `WITHDRAWAL` dengan `amount: 0` dan `description: "Penarikan selesai (hold #{id})"` agar riwayat jelas — balance tidak berubah lagi saat complete.

Alternatif lebih bersih: satu baris `WITHDRAWAL` negatif saat complete menggantikan semantik hold — butuh migrasi hold. **MVP:** hold + release pattern yang sudah dipakai konsultasi/rekber.

---

## 5. Monitoring keamanan

### 5.1 Lapisan pertahanan

| Layer | Mekanisme | Status |
|-------|-----------|--------|
| L1 | Append-only ledger + `walletTransaction` | Ada |
| L2 | `runWalletReconciliation()` cron | Ada |
| L3 | Integritas referensi kredit | **Baru** |
| L4 | Rules anomali + risk score | **Baru** |
| L5 | Human review withdraw | **Baru** |

### 5.2 Rules anomali

| ruleCode | Kondisi | severity | riskScore |
|----------|---------|----------|-----------|
| `BALANCE_DRIFT` | balance ≠ Σ ledger | CRITICAL | +50 |
| `ORPHAN_CREDIT` | Kredit positif tanpa referenceId valid | HIGH | +40 |
| `EARN_WITHOUT_ORDER` | type EARNING, order tidak COMPLETED | CRITICAL | +50 |
| `SUDDEN_SPIKE` | Kredit 24h > 50% saldo awal tanpa order baru | HIGH | +25 |
| `FRESH_ACCOUNT_WITHDRAW` | akun < 7 hari + withdraw > threshold | MEDIUM | +10 |
| `HIGH_WITHDRAW_RATIO` | withdraw > 80% saldo | MEDIUM | +15 |
| `WITHDRAW_AFTER_ANOMALY` | withdraw dalam 24h setelah ORPHAN_CREDIT | CRITICAL | flag blocking |

**referenceId valid** = record ada di tabel sumber (order, konsultasi, topup, deposit request, rekber, dll.) dan amount konsisten (toleransi 0).

### 5.3 Risk score saat withdraw

Dijalankan di `POST /api/wallet/withdraw` setelah hold:

- Agregasi flags 7 hari terakhir + rules realtime.
- Simpan di `WalletWithdrawRequest.riskScore` + `riskFlags`.
- `riskScore >= 61`: buat alert, badge merah di admin, **tidak** block otomatis (owner tetap bisa putuskan) — bisa diubah ke block jika diinginkan nanti.

### 5.4 Job terjadwal

- **Harian:** `runWalletReconciliation()` + `runWalletSecurityScan()` (orphan + drift per wallet).
- **Setiap 15 menit (opsional):** cek withdraw `PENDING` mendekati `slaDueAt` → notifikasi admin.

---

## 6. UI Admin

### 6.1 Penempatan menu

**Tidak** menambah item sidebar baru. Perluas **Manajemen → Saldo** (`/admin/management?tab=saldo`):

| Sub-tab | Status | Isi |
|---------|--------|-----|
| Saldo Pengguna | Ada | — |
| Riwayat Deposit | Ada | — |
| Pemotongan | Ada | — |
| **Penarikan** | Baru | Antrian PENDING + REJECT_PENDING_RELEASE; approve/reject; risk badge |
| **Keamanan Wallet** | Baru | Alert OPEN; drift; orphan credits; link ke user/ledger |

### 6.2 Dashboard widget (`/admin/dashboard`)

- Kartu: **Withdraw menunggu** (count + usia tertua).
- Kartu: **Alert keamanan wallet** (count CRITICAL/HIGH unresolved).
- Klik → deep link ke sub-tab Saldo.

### 6.3 Monitoring (`/admin/monitoring`)

Tetap fokus layanan. Opsional: chip link "Lihat alert wallet user ini" di detail user.

### 6.4 Notifikasi

- PlatformNotification `audiences: ['ADMIN']` untuk: withdraw baru, SLA breach, security alert CRITICAL.
- Telegram admin jika sudah terhubung (reuse pola existing).

---

## 7. API surface (ringkas)

| Method | Path | Actor |
|--------|------|-------|
| POST | `/api/wallet/withdraw` | USER/TEKNISI — create request + hold |
| GET | `/api/wallet/withdraw` | USER/TEKNISI — list own requests |
| GET | `/api/admin/wallet/withdraw` | ADMIN — list queue |
| PATCH | `/api/admin/wallet/withdraw/[id]` | ADMIN — complete / reject_init / reject_confirm_release / reject_cancel |
| GET | `/api/admin/wallet/security-alerts` | ADMIN |
| PATCH | `/api/admin/wallet/security-alerts/[id]` | ADMIN — acknowledge/resolve/dismiss |
| POST | `/api/cron/wallet-security-scan` | CRON — internal |

**Deprecate perilaku lama:** `POST /api/wallet/withdraw` tidak lagi instant `WITHDRAWAL`; ganti ke flow request.

---

## 8. Step-up authentication (reject opsi C)

Reuse pola `POST /api/wallet/withdraw` user-side:

- Body admin action wajib salah satu: `confirmPassword` atau `totp`.
- `reject_init` dan `reject_confirm_release` **keduanya** wajib credential.
- Simpan `rejectConfirmNonce` + timestamp di request row; `reject_confirm_release` hanya valid dalam 15 menit setelah `reject_init` (opsional, cegah replay).

Tidak memerlukan `secondApproverId` berbeda (beda dengan deposit dual-control dua admin).

---

## 9. UX user/teknisi

- Form withdraw: nominal, bank, nama pemilik rekening, password/2FA.
- Copy: *"Penarikan diproses manual dalam 1×24 jam kerja."*
- Status badge: Menunggu / Menunggu konfirmasi penolakan / Selesai / Ditolak.
- Riwayat: daftar `WalletWithdrawRequest`, bukan hanya ledger.

Halaman: extend wallet UI di dashboard (USER/TEKNISI) — saat ini withdraw UI belum lengkap (FT masih SKIP).

---

## 10. Out of scope (MVP)

- PG payout otomatis (Midtrans disbursement, dll.)
- User cancel sendiri request PENDING
- Verifikasi rekening bank terpisah (KYC rekening)
- Block otomatis withdraw risk tinggi (hanya warn)
- Dua admin berbeda untuk reject (deposit pattern)

---

## 11. Testing

### Manual

1. USER ajukan withdraw → saldo berkurang, request PENDING, ledger ESCROW_HOLD.
2. ADMIN complete + password → COMPLETED, notifikasi user.
3. ADMIN reject_init + password → REJECT_PENDING_RELEASE, saldo masih hold.
4. ADMIN reject_confirm_release + password lagi → REJECTED, saldo kembali.
5. Simulasi orphan credit (seed) → alert + risk score tinggi di antrian withdraw.
6. Cron reconciliation → alert jika drift.

### Functional tests

Update `docs/functional-tests/10-wallet-chat-notif.md` FT-WAL-005/006 sesuai flow baru; hapus SKIP setelah implementasi.

---

## 12. Urutan implementasi

1. Schema: `WalletWithdrawRequest`, `WalletSecurityAlert`, enums.
2. Lib: `holdForWithdraw`, `completeWithdraw`, `rejectWithdrawInit`, `rejectWithdrawConfirmRelease`.
3. Ganti `POST /api/wallet/withdraw` + admin APIs.
4. `wallet-security-scan.ts` + cron.
5. Admin UI: sub-tab Penarikan + Keamanan Wallet + dashboard widgets.
6. User/teknisi withdraw UI.
7. Update functional tests.

---

## 13. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Hold + complete double-count ledger | Pola ledger §4.5 diuji unit + reconciliation |
| Admin lupa proses 24 jam | SLA reminder + dashboard age sort |
| Single admin abuse reject release | Double password/2FA + activity log |
| False positive orphan | Manual resolve/dismiss di tab Keamanan |
