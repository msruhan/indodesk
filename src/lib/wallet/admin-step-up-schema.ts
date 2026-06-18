import { z } from 'zod'

export const adminStepUpFields = {
  confirmPassword: z.string().min(1).optional(),
  totp: z.string().min(1).optional(),
}

export const adminStepUpSchema = z.object(adminStepUpFields)
