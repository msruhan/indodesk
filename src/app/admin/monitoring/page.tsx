import { AdminMonitoringView } from '@/components/admin/admin-monitoring-view'

export const metadata = {
  title: 'Monitoring · Admin IndoTeknizi',
  description:
    'Pantau seluruh aktivitas dan komunikasi antara user dan teknisi: chat, konsultasi, dan remote support.',
}

export default function AdminMonitoringPage() {
  return <AdminMonitoringView />
}
