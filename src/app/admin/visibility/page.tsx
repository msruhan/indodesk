'use client'

import { DashboardPageHeader, DashboardPanel } from '@/components/dashboard'
import { AdminComingSoonForm } from '@/components/admin/admin-coming-soon-form'
import { AdminFeatureFlagsForm } from '@/components/admin/admin-feature-flags-form'
import { AdminRegistrationControlForm } from '@/components/admin/admin-registration-control-form'

export default function AdminVisibilityPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Kontrol Admin"
        title="Visibilitas & Soft Launch"
        description="Atur mode coming soon untuk soft launch, serta visibilitas menu fitur untuk role yang sesuai."
      />

      <DashboardPanel
        title="Soft Launch — Coming Soon"
        description="Aktifkan untuk mengarahkan seluruh halaman publik ke halaman countdown. Admin tetap dapat mengakses dashboard."
      >
        <AdminComingSoonForm />
      </DashboardPanel>

      <DashboardPanel
        title="Kontrol Pendaftaran"
        description="Tutup atau buka kembali pendaftaran user dan teknisi secara sementara, terpisah dari mode Coming Soon."
      >
        <AdminRegistrationControlForm />
      </DashboardPanel>

      <DashboardPanel
        title="Pengaturan Visibilitas"
        description="Aktifkan atau sembunyikan menu fitur tertentu untuk teknisi dan pengguna."
      >
        <AdminFeatureFlagsForm />
      </DashboardPanel>

      <DashboardPanel
        title="Catatan Aturan Akses"
        description="Beberapa role memiliki akses tetap yang tidak terpengaruh oleh toggle ini."
      >
        <ul className="space-y-2 text-sm leading-relaxed text-surface-700">
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
            <span>
              <strong>Admin</strong> selalu memiliki akses ke seluruh panel admin (mis. Digital &amp;
              Server, Inspeksi, Monitoring) untuk keperluan operasional, terlepas dari status
              toggle.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
            <span>
              <strong>Layanan Digital</strong> hanya tampil di navigasi publik untuk teknisi
              terdaftar saat toggle aktif. User biasa &amp; pengunjung tidak melihat menu ini.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
            <span>
              <strong>Ruang Teknisi</strong> memiliki tiga toggle terpisah:{' '}
              <strong>Cari Teknisi</strong> (halaman <code className="text-xs">/teknisi</code>
              ), <strong>Remote Online</strong> (halaman <code className="text-xs">/remote</code>
              ), dan <strong>Inspeksi HP</strong> (halaman{' '}
              <code className="text-xs">/inspeksi</code> + dashboard). Grup menu Ruang Teknisi
              otomatis disembunyikan bila ketiga submenu tidak aktif.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
            <span>
              <strong>Remote Online</strong> juga mengontrol pemesanan konsultasi dengan IndoDesk.
              Sesi remote dikelola melalui menu <strong>Konsultasi</strong> di dashboard.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
            <span>
              <strong>Inspeksi HP</strong> juga mengontrol menu Inspeksi di sidebar dashboard
              user/teknisi. Admin selalu memiliki akses panel admin inspeksi.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
            <span>
              <strong>Konsultasi</strong> mengontrol menu Konsultasi di dashboard user, serta menu
              Konsultasi &amp; Iklan Konsultasi di dashboard teknisi. Pemesanan konsultasi baru
              diblokir bila dimatikan.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
            <span>
              <strong>Top Up Game</strong> mengontrol submenu Top Up di grup Belanja, tab mobile,
              footer, dan halaman <code className="text-xs">/topup</code> untuk user &amp; teknisi.
              Checkout top up diblokir bila dimatikan. Admin tetap dapat preview katalog.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
            <span>
              <strong>Kontrol Pendaftaran</strong> menutup pendaftaran user dan/atau teknisi
              secara independen. Login akun yang sudah ada tidak terpengaruh. Admin tetap dapat
              menambah user/teknisi dari panel admin.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
            <span>
              <strong>Coming Soon</strong> mengarahkan halaman publik ke soft launch. Pendaftaran
              user &amp; teknisi tetap dapat diakses; login dashboard untuk user/teknisi diblokir
              sampai mode dimatikan. Hanya <strong>Admin</strong> yang dapat login dan bypass.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
            <span>
              Perubahan toggle berlaku setelah pengguna me-refresh halaman; data feature flags
              di-cache di sisi client agar tidak menambah latensi navigasi.
            </span>
          </li>
        </ul>
      </DashboardPanel>
    </div>
  )
}
