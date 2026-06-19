import { apiError, apiSuccess } from '@/lib/api-auth'
import { validateCronSecret } from '@/lib/cron-auth'
import { processRekberComplaintDeadlines } from '@/lib/rekber-complaint-deadlines'

export const dynamic = 'force-dynamic'

async function handle(req: Request) {
  const cronAuth = validateCronSecret(req)
  if (cronAuth) return cronAuth

  try {
    const stats = await processRekberComplaintDeadlines()
    return apiSuccess({ message: 'Deadline komplain transaksi aman diproses', ...stats })
  } catch (e) {
    console.error('[CRON_REKBER_COMPLAINT_DEADLINES]', e)
    return apiError('Gagal memproses deadline komplain transaksi aman', 500)
  }
}

export async function GET(req: Request) {
  return handle(req)
}

export async function POST(req: Request) {
  return handle(req)
}
