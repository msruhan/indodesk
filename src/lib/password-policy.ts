const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/

export function validatePasswordPolicy(password: string): { ok: true } | { ok: false; message: string } {
  if (password.length < 10) {
    return { ok: false, message: 'Password minimal 10 karakter' }
  }
  if (!PASSWORD_REGEX.test(password)) {
    return {
      ok: false,
      message: 'Password harus mengandung huruf besar, angka, dan simbol',
    }
  }
  return { ok: true }
}

export const passwordPolicySchemaMessage =
  'Password minimal 10 karakter, mengandung huruf besar, angka, dan simbol'
