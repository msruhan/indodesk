import { AdminTransactionsView } from '@/components/admin/admin-transactions-view'

export const metadata = {
  title: 'Transaksi · Admin IndoTeknizi',
  description: 'Monitoring seluruh order dan transaksi platform: marketplace, IMEI, server, top up, dan rekber.',
}

export default function AdminTransactionsPage() {
  return <AdminTransactionsView />
}
