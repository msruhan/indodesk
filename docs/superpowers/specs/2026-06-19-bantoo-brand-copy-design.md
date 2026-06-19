# Bantoo Brand Copy — Messaging & Landing

**Date:** 2026-06-19  
**Status:** Approved for implementation  
**Audience:** Dual — penjual (teknisi/toko HP) + pembeli (user)

## Positioning

**Bantoo** = platform ekosistem teknisi handphone Indonesia. Seller jual dengan fee lebih masuk akal; buyer beli dengan tenang (teknisi terverifikasi + rekber).

**Verb brand:** *bantoo-in* = kami bantuin dari listing sampai transaksi selesai.

**Master tagline:** `bantoo.in — kami bantoo-in.`

## Hero — Dual Rotasi

| Variant | Headline | Sub | Trust |
|---------|----------|-----|-------|
| **Seller** | Fee marketplace bikin margin tipis? **Kami bantoo-in jual handphone kamu.** | Jual di bantoo.in — komisi mulai 3–5% (Pro: 1–2%), buyer ekosistem teknisi, rekber aman. | Komisi ringan · Buyer teknisi · Rekber aman |
| **Buyer** | Beli HP second bingung takut tipu? **Kami bantoo-in transaksinya.** | Beli dari teknisi terverifikasi — inspeksi, konsultasi, rekber aman. | Teknisi verified · Rekber aman · Inspeksi tersedia |

Auto-rotate ~8s; dot indicators untuk manual switch.

## Brand Voice Rules

1. **Bantoo** = brand (kapital); **bantoo-in** = verb (max 1–2× per materi)
2. Pair wordplay dengan benefit konkret (fee, rekber, verified)
3. Sosmed: boleh "toko oren/hijau"; landing resmi: "marketplace besar"

## Social Ads (reference)

See brainstorming session — 3 ads (seller carousel, buyer reel, dual static) + WA template.

## Implementation Scope

- `hero.tsx` — rotating dual copy
- `benefits.tsx` — header subtitle dual audience
- `cta.tsx` — closing copy with bantoo-in
