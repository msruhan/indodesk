import { TopupCatalogProvider } from '@/contexts/topup-catalog-context'

export default function TopupLayout({ children }: { children: React.ReactNode }) {
  return <TopupCatalogProvider>{children}</TopupCatalogProvider>
}
