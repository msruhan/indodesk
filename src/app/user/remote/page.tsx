import { redirect } from 'next/navigation'

/** Remote sudah digabung ke Konsultasi — arahkan URL lama ke halaman konsultasi. */
export default function UserRemotePage() {
  redirect('/user/konsultasi')
}
