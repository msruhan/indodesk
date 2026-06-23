# IndoDesk Session Gate — Design Spec

**Tanggal**: 2026-06-22  
**Status**: Approved (brainstorming 2026-06-22)  
**Relasi**: Melanjutkan [IndoDesk ↔ Bantoo Sync](./2026-06-22-indodesk-bantoo-sync-design.md) (Fase 3)  
**Opsi**: A — Session gate di atas device pairing  

---

## 1. Tujuan

Mencegah IndoDesk User/Teknisi dipakai di luar sesi konsultasi remote yang sah. App terkunci sampai user/teknisi membuktikan ada sesi aktif atau masa garansi konfirmasi, dengan OTP sesi konsultasi.

**Keberhasilan diukur dari:**

- Tanpa sesi yang mengizinkan remote → IndoDesk tidak bisa dipakai (UI terkunci).
- Tanpa OTP sesi yang valid → IndoDesk tidak bisa dibuka (cold start).
- Teknisi hanya bisa connect ke user dalam sesi yang sama; user hanya menerima teknisi sesi tersebut.
- Setelah user konfirmasi selesai (`COMPLETED`) → remote tertutup; masalah belakangan = order konsultasi baru.
- Teknisi tutup app / restart PC selama sesi masih sah → bisa masukkan OTP yang sama lagi.

---

## 2. Keputusan bisnis

| Topik | Keputusan |
|-------|-----------|
| Pendekatan | A — Device pairing (identitas) + session gate (OTP per buka app) |
| OTP saat buka app | Wajib setiap **cold start** selama remote diizinkan |
| Background / minimize | Tidak wajib OTP ulang selama proses app masih hidup |
| Garansi remote | Hanya selama `AWAITING_CONFIRMATION` (user belum konfirmasi) |
| Setelah `COMPLETED` | Di luar tanggung jawab platform; user **order ulang** |
| Admin reopen remote pasca-`COMPLETED` | **Tidak** — out of scope |
| Timeout konfirmasi user | **24 jam** (ubah dari 48 jam) setelah teknisi mark-done |
| OTP saat mark-done | **Tidak dihapus** — tetap aktif selama `AWAITING_CONFIRMATION` |
| OTP lama setelah `COMPLETED` | Selalu invalid (`remoteOtp = null`) |
| Pasangan teknisi ↔ user | Satu `remoteOtp` per sesi; hanya valid untuk pasangan user+teknisi sesi itu |

---

## 3. Tiga lapisan keamanan

```
Lapisan 1 — Device pairing (jangka panjang)
  Kode 6 digit dari web → bantoo-device-token
  Bind perangkat ke akun Bantoo + role (USER / TEKNISI)

Lapisan 2 — Session gate (per cold start)
  OTP sesi (remoteOtp) → unlock in-memory + session grant
  Hanya jika status mengizinkan remote

Lapisan 3 — Remote authorize (saat connect)
  POST /api/indodesk/authorize
  Validasi sesi, OTP, peer ID, role, pasangan teknisi-user
```

Relay publik RustDesk tetap tidak memblokir RustDesk stock (Option B unchanged).

---

## 4. Status konsultasi vs akses IndoDesk

| Status | IndoDesk unlock? | remoteOtp | Payout |
|--------|------------------|-----------|--------|
| `PENDING` | Tidak | null / belum ada | Belum |
| `ACTIVE` | Ya | aktif | Belum (escrow) |
| `AWAITING_CONFIRMATION` | Ya (garansi) | **tetap aktif** | Belum |
| `COMPLETED` | Tidak | null | Sudah ke teknisi |
| `CANCELLED` | Tidak | null | Refund / selesai |

### State machine (remote + payout)

```
PENDING → (teknisi: start) → ACTIVE
  remoteOtp di-generate jika requiresRemote

ACTIVE → (teknisi: mark-done) → AWAITING_CONFIRMATION
  remoteOtp TETAP (perubahan dari behavior lama)
  confirmDeadlineAt = now + 24 jam

AWAITING_CONFIRMATION → (user: confirm) → COMPLETED
  remoteOtp = null, payout

AWAITING_CONFIRMATION → (cron: deadline lewat) → COMPLETED
  remoteOtp = null, payout auto
```

### Perubahan dari kode saat ini

1. **`mark-done` tidak lagi set `remoteOtp: null`** — hanya clear saat `COMPLETED` / `CANCELLED`.
2. **`KONSULTASI_CONFIRM_TIMEOUT_HOURS`**: 48 → **24**.
3. **Serializer web**: tampilkan OTP saat `ACTIVE` **dan** `AWAITING_CONFIRMATION` (jika `requiresRemote`).
4. **`authorizeIndodeskConnection`**: terima sesi `ACTIVE` **atau** `AWAITING_CONFIRMATION`.

---

## 5. Alur pengguna

### 5.1 Teknisi (outgoing-only build)

1. Cold start → belum pairing → layar pairing (kode 6 digit dari web).
2. Sudah pairing, tidak ada sesi remote yang mengizinkan → layar lock: *Belum ada sesi konsultasi aktif*.
3. Ada sesi `ACTIVE` atau `AWAITING_CONFIRMATION` → layar OTP.
4. OTP valid → UI utama terbuka; OTP disimpan **in-memory** untuk connect otomatis.
5. Connect ke user → pakai OTP unlock; peer harus = `session.remoteId`.
6. Sesi berakhir / OTP di-clear → heartbeat memicu logout + putus koneksi + kembali ke layar lock.

### 5.2 User (incoming-only build)

Alur sama, bedanya:

- Tidak input ID teknisi.
- Menunggu koneksi masuk; incoming hanya dari teknisi sesi tersebut.

### 5.3 Deep link

- Teknisi: `indodesk://{remoteId}?password={otp}` → auto-unlock jika sesi sah.
- User: `indodesk://password/{otp}` → auto-unlock jika sesi sah.

### 5.4 Restart / tutup app

Selama status masih mengizinkan remote dan `remoteOtp` ada → **boleh masukkan OTP yang sama** lagi. Tidak perlu order baru.

---

## 6. API (Bantoo web)

### 6.1 Baru: `POST /api/indodesk/session/unlock`

```
Authorization: Bearer {deviceToken}
Body: { "otp": "123456" }
```

**Validasi:**

- Device terdaftar; role cocok (`TEKNISI` / `USER`).
- Ada `KonsultasiSession` dengan:
  - `requiresRemote = true`
  - `remoteOtp` tidak null
  - `status IN ('ACTIVE', 'AWAITING_CONFIRMATION')`
  - `teknisiId` / `userId` match device
- `otp === session.remoteOtp`

**Response sukses:**

```json
{
  "sessionId": "cuid",
  "grant": "<signed session-grant>",
  "remoteId": "123456789",
  "status": "ACTIVE",
  "expiresAt": "ISO-8601"
}
```

`grant` memakai `createIndodeskSessionGrant` (existing).

**Error contoh:** OTP salah, tidak ada sesi, perangkat belum pairing, rate limit.

### 6.2 Baru: `GET /api/indodesk/session/preflight`

```
Authorization: Bearer {deviceToken}
```

Cek cepat sebelum layar OTP — apakah ada sesi yang mengizinkan unlock (tanpa OTP).

```json
{
  "canUnlock": true,
  "sessionId": "cuid",
  "status": "ACTIVE",
  "hasOtp": true,
  "confirmDeadlineAt": null
}
```

Jika `canUnlock: false` → client tampilkan layar lock dengan reason.

### 6.3 Perluas: `POST /api/indodesk/heartbeat`

Tetap kompatibel dengan RustDesk hbbs (body kosong / tanpa token → `apiSuccess('')`).

Jika `deviceToken` valid, response JSON (content-type application/json):

```json
{
  "sessionActive": true,
  "sessionId": "cuid",
  "shouldLogout": false,
  "status": "ACTIVE"
}
```

`shouldLogout: true` jika:

- Tidak ada sesi `ACTIVE` / `AWAITING_CONFIRMATION` dengan `requiresRemote` untuk user/teknisi ini, atau
- `remoteOtp` null, atau
- Status `COMPLETED` / `CANCELLED` / lainnya

### 6.4 Perketat: `POST /api/indodesk/authorize`

**Perubahan status yang diterima:** `ACTIVE` dan `AWAITING_CONFIRMATION`.

**Outgoing (teknisi):**

- Existing: peer = `session.remoteId`, OTP match, `teknisiId` match.
- Tambahan: wajib `grant` valid atau bukti unlock sesi yang sama (header/query `grant`).

**Incoming (user):**

- Existing: `userId` match sesi.
- **Baru:** body field `peerId` = RustDesk ID **teknisi yang connect**.
- Verifikasi `peerId` = `IndodeskDevice.rustdeskId` where `userId = session.teknisiId` AND `role = TEKNISI`.

### 6.5 Perubahan konsultasi API

| Endpoint | Perubahan |
|----------|-----------|
| `POST .../teknisi/konsultasi/[id]` action `mark-done` | Hapus `remoteOtp: null` dari payload update |
| `completeKonsultasiSession` | Tetap `remoteOtp: null` on `COMPLETED` |
| Serializers user/teknisi | OTP visible untuk `active` + `awaiting_confirmation` |

### 6.6 Konstanta

```ts
export const KONSULTASI_CONFIRM_TIMEOUT_HOURS = 24
```

Update test `konsultasi-completion.test.ts` accordingly.

---

## 7. Client IndoDesk

### 7.1 Flutter — session gate

**Launch flow (custom client only):**

```
Startup → Paired? → Preflight API → OTP screen OR lock screen → Main UI
```

**Layar gate memblok:** home, connect, remote session — kecuali pairing dan quit.

**State unlock:**

- In-memory only (tidak persist ke disk).
- Fields: `sessionId`, `grant`, `remoteOtp`, `unlockedAt`.
- Cold start always requires OTP again.

**Heartbeat loop:** interval 30–60 detik → jika `shouldLogout` → clear unlock, disconnect remote, navigate to gate.

**File utama:**

- `flutter/lib/desktop/widgets/bantoo_session_gate.dart` (baru)
- `flutter/lib/desktop/widgets/bantoo_pairing_dialog.dart` (existing)
- `flutter/lib/main.dart` / routing desktop — wrap `DesktopHomePage`

### 7.2 Rust — `bantoo_auth.rs`

- Shared unlock state (static/async mutex) set from Flutter via FFI.
- `gate_outgoing` / `gate_incoming`: tolak jika app belum unlocked.
- Outgoing: gunakan OTP dari unlock state, bukan password permanen IndoDesk.
- Incoming: kirim `peerId` teknisi (connecting client) ke authorize API.
- Env `BANTOO_API_URL` untuk dev local (existing pattern).

**Hook points (perketatan Fase 2 + gate):**

- `client.rs` — `handle_hash`, `handle_login_from_ui` wrapper
- `ui_session_interface.rs` — outgoing UI login
- `server/connection.rs` — `send_logon_response_and_keep_alive` + incoming peer check

### 7.3 FFI baru (minimal)

- `set_bantoo_session_unlock(grant, session_id, otp)`
- `clear_bantoo_session_unlock()`
- `is_bantoo_session_unlocked()`

---

## 8. Web Bantoo (UX minor)

**IndodeskRemotePanel** — copy tambahan:

- Saat `AWAITING_CONFIRMATION`: *"Masa garansi remote — konfirmasi layanan dalam 24 jam"*.
- Saat `COMPLETED`: panel remote disembunyikan / pesan *"Sesi selesai — order baru untuk remote lanjutan"*.

Tidak perlu halaman admin baru.

---

## 9. Pasangan teknisi ↔ user

| Skenario | Hasil |
|----------|-------|
| Teknisi A connect ke User B (sesi A↔B) | Diizinkan jika OTP + sesi match |
| Teknisi A connect ke User C | Ditolak — peer tidak cocok |
| Teknisi C connect ke User B (sesi A↔B) | Ditolak — incoming peer bukan teknisi sesi |
| OTP sesi lama setelah COMPLETED | Ditolak — `remoteOtp` null |

Satu `remoteOtp` per `KonsultasiSession` — "berpasangan" secara logis via `sessionId`, bukan dua kode terpisah.

---

## 10. Error handling

| Kondisi | Pesan / perilaku |
|---------|------------------|
| OTP salah | Error di gate; rate limit 5x / 15 menit per device |
| Tidak ada sesi | Layar lock — arahkan ke web Bantoo |
| Offline saat unlock | Tidak bisa unlock; retry |
| Heartbeat gagal 3x | Anggap shouldLogout; kembali ke gate |
| mark-done saat remote aktif | Remote tetap bisa sampai user konfirmasi atau 24 jam |
| User konfirmasi saat remote aktif | Heartbeat logout dalam ≤60 detik |

---

## 11. Testing

### API (Vitest / FT)

- `session/unlock` — sukses ACTIVE, sukses AWAITING_CONFIRMATION, gagal COMPLETED, OTP salah.
- `session/preflight` — canUnlock true/false per status.
- `authorize` — incoming menolak teknisi asing; outgoing menolak peer salah.
- `mark-done` — `remoteOtp` **tidak** null setelah update.
- `completeKonsultasiSession` — `remoteOtp` null.
- Timeout 24 jam — cron auto-complete.

### Client (manual E2E)

1. Pair teknisi + user → tanpa sesi → gate lock.
2. Start sesi → OTP unlock → connect sukses.
3. Kill app teknisi → reopen → OTP ulang → connect sukses.
4. Mark-done → masih unlock dengan OTP sama.
5. User confirm → heartbeat logout kedua app.
6. OTP lama ditolak setelah COMPLETED.

---

## 12. Out of scope

- Garansi remote setelah `COMPLETED`
- Admin manual OTP / reopen remote
- Blokir relay RustDesk publik
- OTP berbeda untuk teknisi vs user (dua kode)
- Mobile IndoDesk ( pola sama, implementasi menyusul)

---

## 13. Deploy checklist

1. Deploy Bantoo web (API + mark-done + timeout 24h + serializers).
2. Build IndoDesk baru (User + Teknisi) dengan session gate.
3. Upload artifact ke Admin Download IndoDesk.
4. Update functional test doc `docs/functional-tests/` untuk remote gate.
5. Verifikasi production: sesi ACTIVE → gate → connect → mark-done → masih gate → confirm → lock.

---

## 14. Referensi kode existing

| Area | Path |
|------|------|
| Authorize | `src/lib/indodesk-auth.ts` |
| Heartbeat | `src/app/api/indodesk/heartbeat/route.ts` |
| Mark-done | `src/app/api/teknisi/konsultasi/[id]/route.ts` |
| Complete | `src/lib/konsultasi-complete.ts` |
| Timeout | `src/lib/konsultasi-completion.ts` |
| Client auth | `rustdesk/src/bantoo_auth.rs` |
| Pairing UI | `rustdesk/flutter/.../bantoo_pairing_dialog.dart` |
