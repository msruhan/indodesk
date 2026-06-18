'use client'

import { DashboardPageHeader, DashboardPanel } from '@/components/dashboard'
import { AdminFeatureFlagsForm } from '@/components/admin/admin-feature-flags-form'

export default function AdminVisibilityPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Kontrol Admin"
        title="Visibilitas Menu"
        description="Atur menu fitur tertentu agar hanya tampil ke role yang sesuai. Perubahan langsung berlaku untuk seluruh pengguna platform."
      />

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
              <strong>IndoDesk &amp; Konsultasi Remote</strong> mengontrol halaman publik{' '}
              <code className="text-xs">/remote</code> dan pemesanan konsultasi dengan IndoDesk.
              Tidak ada menu Remote terpisah di dashboard — sesi remote dikelola melalui{' '}
              <strong>Konsultasi</strong>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
            <span>
              <strong>Inspeksi</strong> tampil di navigasi publik dan sidebar user/teknisi saat
              toggle aktif. Dashboard user diblokir bila dimatikan; teknisi dengan order aktif
              masih dapat mengakses <code className="text-xs">/teknisi/inspeksi</code> langsung.
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
