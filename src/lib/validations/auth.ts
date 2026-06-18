import { z } from 'zod'
import { passwordPolicySchemaMessage, validatePasswordPolicy } from '@/lib/password-policy'

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

const passwordField = z
  .string()
  .min(10, passwordPolicySchemaMessage)
  .superRefine((val, ctx) => {
    const result = validatePasswordPolicy(val)
    if (!result.ok) {
      ctx.addIssue({ code: 'custom', message: result.message })
    }
  })

/** Registrasi pelanggan (user) — teknisi memakai endpoint terpisah. */
export const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Email tidak valid'),
  password: passwordField.max(100),
  role: z.literal('USER', {
    message: 'Gunakan halaman daftar teknisi untuk mendaftar sebagai teknisi',
  }),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: passwordField.max(100),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
