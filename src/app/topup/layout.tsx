import { TopupCatalogProvider } from '@/contexts/topup-catalog-context'
import { TopupAccessGate } from '@/components/topup/topup-access-gate'

export default function TopupLayout({ children }: { children: React.ReactNode }) {
  return (
    <TopupCatalogProvider>
      <TopupAccessGate>{children}</TopupAccessGate>
    </TopupCatalogProvider>
  )
}
