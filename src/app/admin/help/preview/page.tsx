import Link from 'next/link'
import { HelpSupportPage } from '@/components/help/help-support-page'

export default function AdminHelpPreviewPage() {
  return (
    <div className="space-y-4">
      <Link href="/admin/help" className="text-sm font-medium text-primary-600 hover:underline">
        ← Kembali ke kelola FAQ
      </Link>
      <HelpSupportPage audience="admin" />
    </div>
  )
}
