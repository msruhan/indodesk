# Telegram Notification Templates — Implementation Plan

**Goal:** Admin dapat mengatur channel Telegram global + template pesan otomatis per event; sistem mengirim notifikasi ke channel (produk published) dan Telegram pribadi teknisi (order, konsultasi, inspeksi).

**Reference:** `docs/superpowers/specs/2026-06-17-telegram-notification-templates-design.md`

**Architecture:** Default template di kode (`template-defaults.ts`), override admin di `TelegramNotificationTemplate` (Prisma). Channel Chat ID di `PlatformSetting`. Dispatcher non-blocking (`void dispatchTelegramEvent`) dipanggil dari hook bisnis existing.

**Tech Stack:** Next.js App Router, Prisma, existing `sendTelegramMessage`, admin step-up (SMTP pattern).

---

## Phase order

| Phase | Isi | Depends on |
|-------|-----|------------|
| **1** | Schema + lib core (defaults, store, render, channel, dispatch) | — |
| **2** | API admin (config + templates) | Phase 1 |
| **3** | UI admin `/admin/telegram-notifications` | Phase 2 |
| **4** | Wire event triggers | Phase 1 |
| **5** | Tests + polish settings/sidebar | Phase 1–4 |

---

## Phase 1: Schema & lib core

### Task 1.1 — Prisma model

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260617120000_telegram_notification_templates/migration.sql`

```prisma
model TelegramNotificationTemplate {
  eventKey  String   @id
  body      String   @db.Text
  isEnabled Boolean  @default(true)
  updatedAt DateTime @updatedAt
}
```

- [ ] Add model to schema
- [ ] Create migration SQL
- [ ] Run `npx prisma generate`

### Task 1.2 — `template-defaults.ts`

**Files:**
- Create: `src/lib/telegram/template-defaults.ts`

- [ ] Export `TELEGRAM_EVENT_KEYS` const array (5 keys)
- [ ] Export types: `TelegramEventKey`, `TelegramEventAudience` (`CHANNEL` | `TEKNISI`)
- [ ] Export `TELEGRAM_EVENT_CATALOG` — label, audience, placeholders[], defaultBody
- [ ] Export `getDefaultTemplate(eventKey)`

### Task 1.3 — `template-render.ts`

**Files:**
- Create: `src/lib/telegram/template-render.ts`
- Create: `src/lib/telegram/template-render.test.ts`

- [ ] `escapeTelegramMarkdown(value: string): string`
- [ ] `renderTelegramTemplate(body, vars: Record<string, string>): string`
- [ ] Unknown `{{key}}` → empty string
- [ ] Unit tests TPL-01–03

### Task 1.4 — `template-store.ts`

**Files:**
- Create: `src/lib/telegram/template-store.ts`
- Create: `src/lib/telegram/template-store.test.ts`

- [ ] `getEffectiveTemplate(eventKey)` — DB override or default
- [ ] `listEffectiveTemplates()` — all 5 events merged
- [ ] `saveTemplateOverride(eventKey, body, isEnabled)`
- [ ] `resetTemplateOverride(eventKey)` — delete row
- [ ] Unit tests TPL-04–05

### Task 1.5 — `channel-config.ts`

**Files:**
- Create: `src/lib/telegram/channel-config.ts`

- [ ] Key: `telegram_channel_chat_id` in PlatformSetting
- [ ] `getTelegramChannelChatId()`, `saveTelegramChannelChatId(id)`
- [ ] `maskChatId(id)` for API response

### Task 1.6 — `dispatch.ts`

**Files:**
- Create: `src/lib/telegram/dispatch.ts`
- Create: `src/lib/telegram/context-builders.ts` (build vars per event from DB entities)

- [ ] `dispatchTelegramEvent(eventKey, context)` — async, catch errors internally
- [ ] Route CHANNEL → channel chat ID; TEKNISI → resolve `telegramChatId` by teknisi userId
- [ ] Skip if `!isTelegramEnabled()`, template disabled, missing chat ID
- [ ] `sendTelegramMessage` with `parse_mode: 'Markdown'`

### Task 1.7 — Refactor legacy templates (optional cleanup)

**Files:**
- Modify: `src/lib/telegram.ts`

- [ ] Mark `TelegramNotificationTemplates` as deprecated or migrate `accountLinked` only (webhook still uses it)
- [ ] Do not remove webhook usage

---

## Phase 2: API admin

### Task 2.1 — Config routes

**Files:**
- Create: `src/app/api/admin/telegram/config/route.ts`
- Create: `src/app/api/admin/telegram/config/test/route.ts`

**GET config:**
- `botEnabled`, `channelChatId` (full for admin edit), `channelConfigured`

**PATCH config:**
- Body: `{ channelChatId, confirmPassword, totp? }`
- `verifyAdminStepUp` + `saveTelegramChannelChatId`
- `logAdminGovernance` action `admin.telegram.config.update`

**POST test:**
- Send fixed test message to channel chat ID
- Return success/error from Telegram API

### Task 2.2 — Templates routes

**Files:**
- Create: `src/app/api/admin/telegram/templates/route.ts`
- Create: `src/app/api/admin/telegram/templates/[eventKey]/reset/route.ts`

**GET templates:**
- Return catalog metadata + effective body + isEnabled + `isCustomized` flag

**PATCH templates:**
- Body: `{ eventKey, body, isEnabled, confirmPassword, totp? }`
- Validate eventKey in catalog
- Step-up + audit `admin.telegram.template.update`

**POST reset:**
- Step-up + delete override + audit `admin.telegram.template.reset`

---

## Phase 3: UI admin

### Task 3.1 — Page + sidebar

**Files:**
- Create: `src/app/admin/telegram-notifications/page.tsx`
- Create: `src/components/admin/admin-telegram-notifications-view.tsx`
- Modify: `src/components/dashboard/admin-sidebar.tsx`

- [ ] Sidebar link "Telegram" under Konten section
- [ ] Page with Tabs: **Koneksi** | **Template Pesan**

### Task 3.2 — Tab Koneksi

**Component section in `admin-telegram-notifications-view.tsx`**

- [ ] Bot status badge
- [ ] Channel Chat ID input
- [ ] Short setup guide (add bot as channel admin)
- [ ] Test send button
- [ ] Save with `AdminStepUpFields`

### Task 3.3 — Tab Template

- [ ] List 5 events as expandable cards
- [ ] Per card: audience badge, enable toggle, textarea, placeholder chips (click to insert), preview panel with sample data
- [ ] Save / Reset default buttons per event
- [ ] Client-side preview using same render logic (export shared util or duplicate simple replace for preview)

### Task 3.4 — Update settings placeholder

**Files:**
- Modify: `src/app/admin/settings/page.tsx`

- [ ] Telegram card links to `/admin/telegram-notifications` with status derived from API (channel configured + bot enabled)

---

## Phase 4: Event triggers

### Task 4.1 — `product.published`

**Files:**
- Modify: `src/app/api/admin/approval/route.ts`
- Modify: `src/app/api/admin/products/[id]/route.ts`
- Create helper: `notifyProductPublished(productId)` in `context-builders.ts`

Guard: only when transitioning to `APPROVED` + `isPublished=true` (was not published before).

```typescript
void notifyProductPublished(product.id)
```

### Task 4.2 — `marketplace.order.new`

**Files:**
- Modify: `src/lib/marketplace-checkout.ts`

After each order created in loop:

```typescript
void notifyMarketplaceOrderNew(order.id)
```

### Task 4.3 — `marketplace.order.paid`

**Files:**
- Modify only if order status transition endpoint exists (payment webhook / PATCH)

For v1 wallet checkout: **no hook** (create is already PAID). Document in code comment. Add hook in any future `order.update status → PAID` path.

### Task 4.4 — `konsultasi.new`

**Files:**
- Modify: `src/app/api/user/konsultasi/route.ts`

After successful create (both wallet and pending paths where status PENDING):

```typescript
void notifyKonsultasiNew(sessionRow.id)
```

### Task 4.5 — `inspeksi.new`

**Files:**
- Modify: `src/app/api/user/inspeksi/route.ts`

After create:

```typescript
void notifyInspeksiNew(created.id)
```

---

## Phase 5: Tests & verification

### Task 5.1 — Unit tests

- [ ] `template-render.test.ts`
- [ ] `template-store.test.ts` (mock prisma)

### Task 5.2 — Integration / smoke

- [ ] Optional: mock `sendTelegramMessage` in approval test handler
- [ ] Manual QA checklist from spec §10

### Task 5.3 — Build

```bash
cd indoteknizi && npm run test -- template-render template-store
npx tsc --noEmit
npm run build:fast
```

---

## File tree (new)

```
src/lib/telegram/
  template-defaults.ts
  template-render.ts
  template-render.test.ts
  template-store.ts
  template-store.test.ts
  channel-config.ts
  dispatch.ts
  context-builders.ts
  notify.ts                    # thin wrappers: notifyProductPublished, etc.

src/app/api/admin/telegram/
  config/route.ts
  config/test/route.ts
  templates/route.ts
  templates/[eventKey]/reset/route.ts

src/app/admin/telegram-notifications/page.tsx
src/components/admin/admin-telegram-notifications-view.tsx
```

---

## Manual QA checklist

1. Set `TELEGRAM_BOT_TOKEN` + channel chat ID → test send OK
2. Approve pending product → message in channel
3. Teknisi linked → checkout their product → personal Telegram message
4. Book konsultasi → teknisi gets message
5. Book inspeksi → teknisi gets message
6. Edit template in admin → re-trigger → custom text appears
7. Disable event toggle → no message sent
8. Reset default → system template restored
