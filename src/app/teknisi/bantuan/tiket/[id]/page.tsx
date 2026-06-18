import { SupportTicketDetailPage } from '@/components/support-ticket/support-ticket-detail-page'

export default async function TeknisiBantuanTiketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <SupportTicketDetailPage ticketId={id} basePath="/teknisi/bantuan/tiket" />
}
