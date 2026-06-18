import { redirect } from 'next/navigation'

/** @deprecated Remote dikelola melalui Konsultasi */
export default function TeknisiRemoteRedirectPage() {
  redirect('/teknisi/konsultasi?from=remote-deprecated')
}
