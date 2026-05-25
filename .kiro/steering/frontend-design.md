---
inclusion: fileMatch
fileMatchPattern: "**/*.tsx"
---

# Frontend Design Excellence — IndoTeknizi

Panduan desain UI/UX premium untuk seluruh komponen frontend IndoTeknizi.

## Design Principles

- **Bold & Intentional**: Setiap keputusan desain harus disengaja. Hindari default generik.
- **Premium Craft**: Perhatian detail pada spacing, typography, shadows, dan micro-interactions.
- **Cohesive System**: Gunakan design tokens yang konsisten (warna, radius, shadow) dari Tailwind config project.
- **Performance First**: Animasi hanya via `transform` dan `opacity`. Jangan animasi `top/left/width/height`.

## Typography Rules

- Headlines: `tracking-tightest` atau `tracking-tight`, font-weight `semibold` atau `bold`.
- Body: `text-sm` atau `text-[13px]`, `text-surface-500` atau `text-surface-600`, `leading-relaxed`.
- Labels: `text-[10px] font-bold uppercase tracking-[0.14em] text-surface-500`.
- Monospace untuk kode/ID: `font-mono`.
- Jangan gunakan font generik. Project ini menggunakan system font stack yang sudah dikonfigurasi.

## Color Strategy

- **Restrained palette**: Tinted neutrals (surface-*) + satu accent (primary-*: emerald/teal).
- Jangan gunakan `#000` atau `#fff` mentah. Gunakan `text-ink`, `bg-white`, `bg-surface-50`.
- Status colors: primary (success/active), amber (warning/pending), red (danger/error), blue/accent (info).
- Gradients: `from-primary-500 via-primary-600 to-primary-700` untuk CTA utama.

## Component Patterns (IndoTeknizi Style)

- **Cards**: `rounded-2xl border border-surface-200/70 bg-white shadow-soft-sm` + hover: `hover:shadow-soft-md hover:-translate-y-0.5`.
- **Badges**: Gunakan `<Badge variant="...">` dengan variant: primary, success, warning, danger, info, default.
- **Buttons**: Rounded-full, variant primary/outline/ghost. Gunakan `<Button>` component.
- **Metric Cards**: Gunakan `<MetricCard>` dari `@/components/dashboard` untuk statistik.
- **Tables**: Gunakan `<Table>` component untuk data tabular di desktop, card list untuk mobile.
- **Modals/Drawers**: Framer-motion animated, backdrop blur, spring physics.

## Motion & Animation

- Gunakan `framer-motion` untuk entrance animations: `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}`.
- Staggered children: `transition={{ delay: idx * 0.03 }}`.
- Expand/collapse: `AnimatePresence` + `motion.div` dengan `height: 'auto'`.
- Spring physics untuk modals: `type: 'spring', stiffness: 380, damping: 32`.
- Loading states: skeleton pulse (`animate-pulse rounded-2xl bg-surface-50`).

## Layout Rules

- Responsive grid: `grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3` untuk metrics.
- Content max-width diatur oleh shell layout (sidebar + main padding).
- Mobile-first: selalu mulai dari layout mobile, tambahkan `sm:` / `lg:` breakpoints.
- Spacing konsisten: `space-y-5` atau `space-y-6` untuk section gaps.

## Anti-Patterns (JANGAN lakukan)

- ❌ Jangan gunakan emoji di UI. Gunakan Phosphor icons dari `@/lib/icons`.
- ❌ Jangan hardcode warna hex. Gunakan Tailwind classes.
- ❌ Jangan buat komponen tanpa loading state dan empty state.
- ❌ Jangan gunakan `h-screen`. Gunakan `min-h-screen` atau `min-h-[100dvh]`.
- ❌ Jangan import library baru tanpa cek `package.json` dulu.
- ❌ Jangan buat layout tanpa responsive breakpoints.

## Interactive States (Wajib)

Setiap komponen interaktif HARUS punya:
1. **Loading**: Skeleton pulse atau spinner.
2. **Empty**: Card dengan ikon + pesan informatif.
3. **Error**: Border merah + pesan + tombol retry.
4. **Success**: Toast atau badge hijau.
5. **Hover**: Subtle translate-y atau shadow change.

## Icon Usage

- Import dari `@/lib/icons` (re-export Phosphor icons dengan duotone weight).
- Ukuran standar: `h-3.5 w-3.5` (dalam button), `h-4 w-4` (standalone), `h-[18px] w-[18px]` (card icon).
- Warna mengikuti konteks: `text-primary-700`, `text-surface-500`, `text-amber-600`, dll.
