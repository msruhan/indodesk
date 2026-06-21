import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { readTeknisiRegisterCompleteUserId } from '@/lib/auth/google-register-cookie'
import { TeknisiLengkapiForm } from './form'

export default async function RegisterTeknisiLengkapiPage() {
  const userId = await readTeknisiRegisterCompleteUserId()
  if (!userId) {
    redirect('/register/teknisi?error=google_register_expired')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      password: true,
      teknisiProfile: { select: { id: true } },
    },
  })

  if (!user || user.role !== 'TEKNISI' || user.password || user.teknisiProfile) {
    redirect('/register/teknisi?error=google_register_expired')
  }

  return <TeknisiLengkapiForm name={user.name} email={user.email} />
}
