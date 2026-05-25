---
inclusion: manual
---

# Security Review — IndoTeknizi

Panduan untuk melakukan security review pada perubahan kode di branch saat ini.

## Kapan Digunakan

Gunakan steering ini (via `#security-review` di chat) saat ingin melakukan security audit pada kode yang baru diubah atau sebelum merge ke main.

## Objective

Lakukan security-focused code review untuk mengidentifikasi kerentanan HIGH-CONFIDENCE yang memiliki potensi eksploitasi nyata. Ini bukan general code review — fokus HANYA pada implikasi keamanan.

## Kategori Keamanan yang Diperiksa

### Input Validation
- SQL injection via unsanitized user input
- Command injection di system calls
- Path traversal di file operations
- NoSQL injection di database queries

### Authentication & Authorization
- Authentication bypass logic
- Privilege escalation paths
- Session management flaws
- JWT token vulnerabilities
- Authorization logic bypasses

### Crypto & Secrets
- Hardcoded API keys, passwords, atau tokens
- Weak cryptographic algorithms
- Improper key storage

### Injection & Code Execution
- Remote code execution via deserialization
- Eval injection di dynamic code execution
- XSS vulnerabilities (reflected, stored, DOM-based)
- Template injection

### Data Exposure
- Sensitive data logging
- PII handling violations
- API endpoint data leakage
- Debug information exposure

## Metodologi Analisis

### Phase 1 — Repository Context
- Identifikasi security frameworks dan libraries yang digunakan
- Cari established secure coding patterns di codebase
- Pahami security model dan threat model project

### Phase 2 — Comparative Analysis
- Bandingkan kode baru dengan existing security patterns
- Identifikasi deviasi dari established secure practices
- Cari inconsistent security implementations
- Flag kode yang memperkenalkan attack surfaces baru

### Phase 3 — Vulnerability Assessment
- Periksa setiap file yang dimodifikasi untuk implikasi keamanan
- Trace data flow dari user inputs ke sensitive operations
- Cari privilege boundaries yang dilanggar secara tidak aman
- Identifikasi injection points dan unsafe deserialization

## Severity Guidelines

- **HIGH**: Directly exploitable → RCE, data breach, authentication bypass
- **MEDIUM**: Memerlukan kondisi spesifik tapi dampak signifikan
- **LOW**: Defense-in-depth issues atau lower-impact vulnerabilities

## Confidence Scoring

- 0.9-1.0: Certain exploit path identified
- 0.8-0.9: Clear vulnerability pattern with known exploitation methods
- 0.7-0.8: Suspicious pattern requiring specific conditions
- Below 0.7: Jangan laporkan (terlalu spekulatif)

## Hard Exclusions (JANGAN Laporkan)

1. Denial of Service (DOS) atau resource exhaustion
2. Secrets stored on disk yang sudah secured
3. Rate limiting concerns
4. Memory/CPU exhaustion issues
5. Lack of input validation pada non-security-critical fields tanpa proven impact
6. Race conditions yang theoretical bukan practical
7. Outdated third-party libraries (dikelola terpisah)
8. Files yang hanya unit tests
9. Log spoofing concerns
10. SSRF yang hanya control path (bukan host/protocol)
11. Regex injection atau Regex DOS
12. Insecure documentation (markdown files)
13. Lack of audit logs

## Konteks Spesifik IndoTeknizi

- **Auth**: NextAuth v5 dengan JWT strategy. Validasi role via `requireApiRole()`.
- **Database**: Prisma ORM (parameterized queries, aman dari SQL injection by default).
- **Frontend**: React/Next.js (aman dari XSS by default kecuali `dangerouslySetInnerHTML`).
- **API**: Semua endpoint menggunakan Zod validation + `apiError`/`apiSuccess` pattern.
- **Sensitive data**: Password di-hash bcrypt, 2FA secret encrypted, wallet balance di server-side only.
- **File uploads**: Disimpan di `public/uploads/` — perlu validasi tipe file.

## Output Format

Untuk setiap temuan, laporkan:

```markdown
# Vuln N: [Category]: `file:line`

* Severity: High/Medium
* Confidence: 0.X
* Description: [Deskripsi kerentanan]
* Exploit Scenario: [Skenario eksploitasi konkret]
* Recommendation: [Rekomendasi perbaikan]
```

Jika tidak ada temuan dengan confidence ≥ 0.8, laporkan:

```markdown
# Security Review: No High-Confidence Vulnerabilities Found

Tidak ditemukan kerentanan keamanan dengan confidence tinggi pada perubahan kode ini.
```
