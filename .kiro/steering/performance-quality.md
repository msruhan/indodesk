---
inclusion: fileMatch
fileMatchPattern: "**/*.{ts,tsx}"
---

# Performance & Quality Guidelines

## Performance Rules

- **Animations**: Hanya animasi `transform` dan `opacity`. JANGAN animasi `top`, `left`, `width`, `height`.
- **Hardware Acceleration**: Gunakan `will-change-transform` hanya jika diperlukan, hapus setelah animasi selesai.
- **Dynamic Imports**: Chart libraries (`react-apexcharts`) HARUS di-import dengan `dynamic(() => import(...), { ssr: false })`.
- **Image Optimization**: Gunakan `next/image` untuk gambar lokal. External images boleh `<img>` dengan `loading="lazy"`.
- **Bundle Size**: Jangan import seluruh library. Import spesifik: `import { motion } from 'framer-motion'`.
- **Re-renders**: Gunakan `useCallback` untuk fungsi yang di-pass sebagai props. `useMemo` untuk computed values yang mahal.
- **Debounce**: Search input HARUS di-debounce (250ms) sebelum trigger API call.

## Code Quality

- **TypeScript Strict**: Jangan gunakan `any`. Definisikan types untuk semua API responses.
- **Error Handling**: Setiap `fetch()` HARUS di-wrap dalam try/catch. Tampilkan error state ke user.
- **Null Safety**: Selalu handle `null`/`undefined` dengan optional chaining (`?.`) dan nullish coalescing (`??`).
- **Consistent Formatting**: Gunakan single quotes, trailing commas, 2-space indent.
- **No Console in Production**: `console.error` hanya di API routes untuk logging. Jangan `console.log` di client components.

## Accessibility Basics

- Semua interactive elements harus punya `aria-label` jika tidak ada visible text.
- Buttons harus `type="button"` kecuali dalam form (`type="submit"`).
- Modals harus trap focus dan bisa ditutup dengan Escape.
- Color contrast: text harus readable (gunakan `text-ink` untuk body, `text-surface-500` untuk secondary).
- Images harus punya `alt` text.

## Security

- API routes: selalu validasi input dengan Zod sebelum proses.
- Jangan expose sensitive data (password, secrets) di API response.
- Gunakan `requireApiRole()` untuk endpoint yang butuh authorization.
- Sanitize user input sebelum render (React sudah handle XSS by default).
- Prisma parameterized queries (sudah aman dari SQL injection).
