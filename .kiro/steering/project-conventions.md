---
inclusion: auto
---

# IndoTeknizi — Project Conventions

## Tech Stack

- **Framework**: Next.js 16 (App Router, RSC + Client Components)
- **Language**: TypeScript (strict)
- **Database**: PostgreSQL + Prisma ORM (adapter: pg)
- **Auth**: NextAuth v5 (credentials + JWT strategy)
- **Styling**: Tailwind CSS v3 + class-variance-authority (cva)
- **Animation**: Framer Motion
- **Charts**: ApexCharts (react-apexcharts, dynamic import SSR-safe)
- **Icons**: @phosphor-icons/react (re-exported via `@/lib/icons` with duotone weight)
- **UI Components**: Custom (`@/components/ui/*`) — Card, Button, Badge, Input, Table, Tabs, SearchInput
- **Validation**: Zod

## File Structure

- `src/app/` — Next.js App Router pages & layouts
- `src/app/api/` — API routes (REST, JSON responses)
- `src/components/` — Reusable components (ui/, admin/, dashboard/, marketplace/, etc.)
- `src/lib/` — Utilities, helpers, serializers, workers
- `src/contexts/` — React contexts (auth, sidebar, wallet, chat, etc.)
- `src/data/` — Mock/static data
- `prisma/` — Schema, migrations, seed

## API Patterns

- Auth guard: `requireApiRole(['ADMIN'])` atau `requireApiAuth()`
- Response: `apiSuccess(data)` / `apiError(message, status)`
- Always `export const dynamic = 'force-dynamic'` for API routes
- Prisma queries with `include` for relations, `select` for optimization
- Error handling: try/catch + `console.error('[TAG]', e)` + return apiError

## Component Patterns

- Client components: `'use client'` directive at top
- State management: `useState` + `useCallback` + `useEffect` for data fetching
- Debounced search: `useRef` timer + `debouncedQ` state
- Lists: `motion.div` with staggered entrance
- Modals/Drawers: `AnimatePresence` + `motion.div/aside`
- Loading: skeleton pulse divs
- Empty: Card with icon + message

## Naming Conventions

- Pages: `page.tsx` (Next.js convention)
- Components: PascalCase (`AdminMonitoringView.tsx` → `admin-monitoring-view.tsx` file)
- API routes: `route.ts`
- Lib helpers: kebab-case (`admin-saldo.ts`, `activity-log.ts`)
- Types: PascalCase suffix `Dto`, `Props`, `Input`

## Roles

- `ADMIN` — full platform access, sidebar at `/admin/*`
- `TEKNISI` — service provider, sidebar at `/teknisi/*`
- `USER` — buyer/consumer, sidebar at `/user/*`

## Shell Layouts

- Admin: `AdminShell` (auto via `/admin/layout.tsx`)
- Teknisi: `TeknisiWorkspaceShell` (per-folder `layout.tsx` required)
- User: `UserShell` (auto via `/user/layout.tsx`)

## Database

- Prisma client: `import { prisma } from '@/lib/db'`
- Decimal fields: use `.toString()` when serializing to JSON
- Dates: `.toISOString()` for API responses
- Enums: defined in schema, imported from `@prisma/client`
