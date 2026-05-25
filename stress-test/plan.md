# Stress Test Plan — IndoTeknizi MVP

> Spec lengkap: [`docs/superpowers/specs/2026-05-25-stress-test-design.md`](../docs/superpowers/specs/2026-05-25-stress-test-design.md)
> Cara pakai: lihat [`README.md`](./README.md)

## TL;DR

5 skenario k6 untuk soft launch validation:

| # | Skenario | Beban Puncak | Durasi |
|---|----------|-------------:|-------:|
| S1 | Public Discovery | 50 VU | 7 min |
| S2 | Marketplace Checkout | 15 VU | 8 min |
| S3 | Service Request | 15 VU | 6 min |
| S4 | Realtime Polling | 30 VU | 10 min |
| S5 | Soak Test | 5 VU constant | 30 min |

External API (Telegram, DhruFusion, BinderByte) di-mock via `STRESS_TEST_MODE=true`.
