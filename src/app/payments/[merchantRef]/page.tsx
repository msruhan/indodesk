import { PaymentWaitingView } from '@/components/payments/payment-waiting-view'

type PageProps = {
  params: Promise<{ merchantRef: string }>
}

export default async function PaymentPage({ params }: PageProps) {
  const { merchantRef } = await params
  return <PaymentWaitingView merchantRef={merchantRef} />
}
