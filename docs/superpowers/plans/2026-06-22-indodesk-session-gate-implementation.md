# IndoDesk Session Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lock IndoDesk User/Teknisi behind session OTP gate; allow remote only during `ACTIVE` and `AWAITING_CONFIRMATION`; auto-logout when session ends; 24h confirm timeout.

**Architecture:** Three layers — device pairing (existing), new session unlock API + in-memory client state, tightened authorize on connect. Backend changes first; then Rust hooks; then Flutter gate UI.

**Tech Stack:** Next.js API routes, Prisma, Vitest; Rust (rustdesk fork), Flutter desktop FFI.

**Spec:** [2026-06-22-indodesk-session-gate-design.md](../specs/2026-06-22-indodesk-session-gate-design.md)

---

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/indodesk-session.ts` | Shared: find unlock-eligible session, preflight DTO |
| `src/lib/indodesk-auth.ts` | Extend authorize for AWAITING_CONFIRMATION + incoming peer |
| `src/app/api/indodesk/session/unlock/route.ts` | POST unlock |
| `src/app/api/indodesk/session/preflight/route.ts` | GET preflight |
| `src/app/api/indodesk/heartbeat/route.ts` | Extended JSON response |
| `src/app/api/teknisi/konsultasi/[id]/route.ts` | Stop clearing OTP on mark-done |
| `src/lib/konsultasi-completion.ts` | 48h → 24h |
| `src/lib/*-konsultasi-serializer.ts` | OTP visibility AWAITING_CONFIRMATION |
| `rustdesk/src/bantoo_auth.rs` | Unlock state, gate_*, grant header |
| `rustdesk/src/bantoo_session.rs` | New: in-memory unlock (optional split) |
| `rustdesk/src/server/connection.rs` | Incoming peerId in authorize |
| `rustdesk/src/client.rs` | Outgoing gate + unlock OTP |
| `rustdesk/src/flutter_ffi.rs` | FFI unlock set/clear |
| `rustdesk/flutter/.../bantoo_session_gate.dart` | Gate UI + routing |

---

### Task 1: Shared session eligibility helper

**Files:**
- Create: `indoteknizi/src/lib/indodesk-session.ts`
- Test: `indoteknizi/src/lib/indodesk-session.test.ts`

- [ ] **Step 1:** Write tests for `findUnlockEligibleKonsultasiSession(device)` — returns session for `ACTIVE` and `AWAITING_CONFIRMATION`, not `COMPLETED`.
- [ ] **Step 2:** Implement helper using existing Prisma patterns from `indodesk-auth.ts`.
- [ ] **Step 3:** Run `npm test -- indodesk-session`.

---

### Task 2: Konsultasi policy changes (24h + keep OTP on mark-done)

**Files:**
- Modify: `indoteknizi/src/lib/konsultasi-completion.ts`
- Modify: `indoteknizi/src/lib/konsultasi-completion.test.ts`
- Modify: `indoteknizi/src/app/api/teknisi/konsultasi/[id]/route.ts`
- Modify: `indoteknizi/src/lib/user-konsultasi-serializer.ts`
- Modify: `indoteknizi/src/lib/teknisi-layanan-serializer.ts`

- [ ] **Step 1:** Change `KONSULTASI_CONFIRM_TIMEOUT_HOURS` to `24`; fix test.
- [ ] **Step 2:** Remove `remoteOtp: null` from `mark-done` branch in teknisi konsultasi route.
- [ ] **Step 3:** Update serializers to expose `remoteOtp` when status is `awaiting_confirmation` (requiresRemote).
- [ ] **Step 4:** Run related tests / `npm run build`.

---

### Task 3: Extend `authorizeIndodeskConnection`

**Files:**
- Modify: `indoteknizi/src/lib/indodesk-auth.ts`
- Test: `indoteknizi/src/lib/indodesk-auth.test.ts` (create if missing)

- [ ] **Step 1:** Write failing tests: authorize allowed for `AWAITING_CONFIRMATION`; incoming rejects wrong teknisi `peerId`.
- [ ] **Step 2:** Change session query `status: { in: ['ACTIVE', 'AWAITING_CONFIRMATION'] }`.
- [ ] **Step 3:** For `direction: 'incoming'`, require `peerId` matches teknisi's `IndodeskDevice.rustdeskId`.
- [ ] **Step 4:** Run tests.

---

### Task 4: Session unlock + preflight APIs

**Files:**
- Create: `indoteknizi/src/app/api/indodesk/session/unlock/route.ts`
- Create: `indoteknizi/src/app/api/indodesk/session/preflight/route.ts`
- Modify: `indoteknizi/src/app/api/indodesk/authorize/route.ts` (pass peerId, grant)

- [ ] **Step 1:** Implement `GET preflight` — auth device token, return `canUnlock`, `sessionId`, `status`, `hasOtp`, `confirmDeadlineAt`.
- [ ] **Step 2:** Implement `POST unlock` — validate OTP, return grant via `createIndodeskSessionGrant`.
- [ ] **Step 3:** Add rate limit (reuse pattern from pair/init or simple in-memory).
- [ ] **Step 4:** Manual curl test against local dev.

---

### Task 5: Heartbeat session status

**Files:**
- Modify: `indoteknizi/src/app/api/indodesk/heartbeat/route.ts`

- [ ] **Step 1:** After device resolve, call unlock-eligible session helper.
- [ ] **Step 2:** Return JSON `{ sessionActive, sessionId, shouldLogout, status }` when token present; keep empty success for legacy callers without token.
- [ ] **Step 3:** Test with device token + ACTIVE vs COMPLETED session.

---

### Task 6: Web UX copy

**Files:**
- Modify: `indoteknizi/src/components/konsultasi/indodesk-remote-panel.tsx`

- [ ] **Step 1:** Add warranty note for `AWAITING_CONFIRMATION` role views.
- [ ] **Step 2:** Hide / message when session completed (if panel still rendered).

---

### Task 7: Rust — session unlock state + gate

**Files:**
- Modify: `rustdesk/src/bantoo_auth.rs`
- Modify: `rustdesk/src/lib.rs` (if new module)
- Modify: `rustdesk/src/flutter_ffi.rs`

- [ ] **Step 1:** Add in-memory struct: `session_id`, `grant`, `otp_plain`.
- [ ] **Step 2:** FFI: `set_bantoo_session_unlock`, `clear_bantoo_session_unlock`, `is_bantoo_session_unlocked`.
- [ ] **Step 3:** `gate_outgoing` / `gate_incoming` fail fast if not unlocked.
- [ ] **Step 4:** Include `grant` in authorize POST body.
- [ ] **Step 5:** `cargo check` (CI or local).

---

### Task 8: Rust — connection authorize tightening

**Files:**
- Modify: `rustdesk/src/server/connection.rs`
- Modify: `rustdesk/src/client.rs`
- Modify: `rustdesk/src/ui_session_interface.rs`

- [ ] **Step 1:** Incoming authorize: pass connecting peer id (`lr` peer / login request peer field — verify correct field in connection.rs).
- [ ] **Step 2:** Outgoing: use unlock OTP from memory, block permanent password paths for custom client.
- [ ] **Step 3:** Centralize gate in `send_logon_response_and_keep_alive` (if not already from prior work).

---

### Task 9: Flutter session gate UI

**Files:**
- Create: `rustdesk/flutter/lib/desktop/widgets/bantoo_session_gate.dart`
- Modify: `rustdesk/flutter/lib/desktop/pages/desktop_home_page.dart` or main desktop entry
- Modify: `rustdesk/flutter/lib/desktop/widgets/bantoo_pairing_dialog.dart` (reuse API helper)

- [ ] **Step 1:** Widget: states `loading`, `need_pairing`, `locked`, `otp_entry`, `unlocked`.
- [ ] **Step 2:** On cold start: preflight → OTP form → unlock API → call FFI set unlock → show main UI.
- [ ] **Step 3:** Deep link handler: parse password from URL → auto unlock.
- [ ] **Step 4:** Timer: poll heartbeat every 45s; on shouldLogout → FFI clear + disconnect + gate.

---

### Task 10: Functional tests + docs

**Files:**
- Modify: `indoteknizi/docs/functional-tests/05-konsultasi.md` (timeout 24h, OTP on awaiting)
- Create or extend FT script for indodesk unlock

- [ ] **Step 1:** Document manual E2E checklist from spec §11.
- [ ] **Step 2:** Add API-level tests to `scripts/ft/` if pattern exists.

---

### Task 11: Build & release

- [ ] **Step 1:** Tag rustdesk `v1.5.0` (or next) — trigger `indodesk-build.yml`.
- [ ] **Step 2:** Deploy Bantoo web to VPS.
- [ ] **Step 3:** Upload 4 IndoDesk artifacts to admin.
- [ ] **Step 4:** Run full E2E on staging/production.

---

## Verification checklist

- [ ] No unlock without ACTIVE / AWAITING_CONFIRMATION session
- [ ] OTP re-entry works after app kill during ACTIVE
- [ ] mark-done keeps remoteOtp; confirm clears it
- [ ] 24h auto-complete works
- [ ] Incoming rejects wrong teknisi peer
- [ ] COMPLETED → shouldLogout within one heartbeat interval
