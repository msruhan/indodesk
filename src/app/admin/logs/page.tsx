import { AdminLogsView } from '@/components/admin/admin-logs-view'

export const metadata = {
  title: 'Log Aktivitas · Admin IndoTeknizi',
  description: 'Audit trail seluruh aktivitas platform: login, order, deposit, chat, dan keamanan.',
}

export default function AdminLogsPage() {
  return <AdminLogsView />
}
