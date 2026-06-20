import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { resolveShippingLabelRedirect } from '@/lib/shipping-label'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ token: string }>
}

export default async function ShippingLabelLinkPage({ params }: Props) {
  const { token } = await params

  const order = await prisma.order.findUnique({
    where: { shippingLabelToken: token },
    select: { id: true, buyerId: true, sellerId: true, orderCode: true },
  })

  if (!order) {
    redirect('/')
  }

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/l/${token}`)}`)
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, isActive: true },
  })

  if (!dbUser?.isActive) {
    redirect('/login')
  }

  const target = resolveShippingLabelRedirect(order, dbUser.id, dbUser.role)
  if (target) {
    redirect(target)
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-xl font-bold text-ink">Akses ditolak</h1>
      <p className="mt-3 text-sm text-surface-600">
        QR label pesanan <span className="font-mono font-semibold">{order.orderCode}</span> hanya
        dapat dibuka oleh pembeli, penjual, atau admin terkait.
      </p>
      <Link href="/" className="mt-6 text-sm font-medium text-primary-600 hover:underline">
        Kembali ke beranda
      </Link>
    </main>
  )
}
