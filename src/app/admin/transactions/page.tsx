import { AdminTransactionsView } from '@/components/admin/admin-transactions-view'

export const metadata = {
  title: 'Transaksi · Admin Bantoo',
  description: 'Monitoring seluruh order dan transaksi platform: marketplace, digital, server, top up, dan transaksi aman.',
}

export default function AdminTransactionsPage() {
  return <AdminTransactionsView />
}
