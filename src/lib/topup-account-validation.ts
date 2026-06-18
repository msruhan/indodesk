/** Nomor akun khusus functional test: provider mock gagal → FAILED + refund. */
export const TOPUP_STRESS_FAIL_ACCOUNT = '0812900000000'

const MSISDN_RE = /^(?:\+62|62|0)8[1-9]\d{7,11}$/

export function normalizeMsisdn(input: string): string {
  return input.replace(/[\s-]/g, '')
}

export function isValidMsisdn(input: string): boolean {
  const n = normalizeMsisdn(input)
  return MSISDN_RE.test(n)
}

export function isTopupStressFailAccount(accountId: string): boolean {
  return normalizeMsisdn(accountId) === TOPUP_STRESS_FAIL_ACCOUNT
}
