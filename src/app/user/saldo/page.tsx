import { redirect } from 'next/navigation'

/** Halaman saldo digabung ke dashboard — redirect untuk URL lama. */
export default function UserSaldoRedirectPage() {
  redirect('/user/dashboard')
}
