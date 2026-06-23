import {
  buildTeknisiApprovedEmail,
  buildTeknisiRejectedEmail,
  sendEmail,
} from '@/lib/email'

export async function notifyTeknisiApprovalEmail(opts: {
  email: string
  name?: string | null
  action: 'approve' | 'reject'
  rejectionReason?: string | null
}): Promise<void> {
  const payload =
    opts.action === 'approve'
      ? buildTeknisiApprovedEmail({ name: opts.name })
      : buildTeknisiRejectedEmail({
          name: opts.name,
          rejectionReason: opts.rejectionReason,
        })

  await sendEmail({
    ...payload,
    to: opts.email,
  })
}
