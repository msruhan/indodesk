import {
  buildTeknisiRegistrationWelcomeEmail,
  buildUserRegistrationWelcomeEmail,
  sendEmail,
} from '@/lib/email'

export async function notifyRegistrationWelcomeEmail(opts: {
  email: string
  name?: string | null
  role: 'USER' | 'TEKNISI'
  emailAlreadyVerified?: boolean
}): Promise<void> {
  const payload =
    opts.role === 'TEKNISI'
      ? buildTeknisiRegistrationWelcomeEmail({
          name: opts.name,
          emailAlreadyVerified: opts.emailAlreadyVerified,
        })
      : buildUserRegistrationWelcomeEmail({
          name: opts.name,
          emailAlreadyVerified: opts.emailAlreadyVerified,
        })

  await sendEmail({
    ...payload,
    to: opts.email,
  })
}
