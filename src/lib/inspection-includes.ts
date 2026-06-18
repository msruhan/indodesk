/** Relasi inspeksi — hindari `rekber: true` agar query tidak gagal bila kolom rekber baru belum dimigrasi. */
export const INSPECTION_REKBER_LINK_SELECT = {
  id: true,
  orderCode: true,
  status: true,
} as const

export const INSPECTION_TEKNISI_PARTY_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
} as const

export const INSPECTION_USER_ORDER_INCLUDE = {
  teknisi: { select: INSPECTION_TEKNISI_PARTY_SELECT },
  report: true,
  rekber: { select: INSPECTION_REKBER_LINK_SELECT },
} as const

export const INSPECTION_TEKNISI_ORDER_INCLUDE = {
  user: { select: INSPECTION_TEKNISI_PARTY_SELECT },
  teknisi: { select: INSPECTION_TEKNISI_PARTY_SELECT },
  report: true,
  rekber: { select: INSPECTION_REKBER_LINK_SELECT },
} as const

export const INSPECTION_ADMIN_ORDER_INCLUDE = {
  user: { select: INSPECTION_TEKNISI_PARTY_SELECT },
  teknisi: { select: INSPECTION_TEKNISI_PARTY_SELECT },
  report: true,
  rekber: { select: INSPECTION_REKBER_LINK_SELECT },
} as const
