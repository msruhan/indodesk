// ============================================================
// Mock data for IMEI Service feature
// ============================================================

export interface ImeiApiProvider {
  id: string
  title: string
  host: string
  username: string
  apiType: string
  status: 'active' | 'inactive'
  servicesCount: number
  createdAt: string
  updatedAt: string
}

export interface ImeiServiceGroup {
  id: string
  title: string
  servicesCount: number
  createdAt: string
  updatedAt: string
}

export interface ImeiService {
  id: string
  title: string
  groupId: string
  groupName: string
  apiId: string
  apiName: string
  price: number
  deliveryTime: string
  status: 'active' | 'inactive'
  requiresNetwork: boolean
  requiresModel: boolean
  requiresProvider: boolean
  requiresIMEI: boolean
  description?: string
  createdAt: string
  updatedAt: string
}

export type ImeiOrderStatus = 'pending' | 'in_process' | 'success' | 'rejected'

export interface ImeiOrder {
  id: string
  imei: string
  serviceId: string
  serviceName: string
  userId: string
  userName: string
  userEmail: string
  price: number
  status: ImeiOrderStatus
  code?: string
  note?: string
  comments?: string
  createdAt: string
  updatedAt: string
}

// --- Mock API Providers ---
export const mockImeiApis: ImeiApiProvider[] = [
  {
    id: '1',
    title: 'DhruFusion Server 1',
    host: 'https://dhru1.example.com',
    username: 'admin@dhru1.com',
    apiType: 'DhruFusion',
    status: 'active',
    servicesCount: 45,
    createdAt: '2025-01-15',
    updatedAt: '2026-05-10',
  },
  {
    id: '2',
    title: 'DhruFusion Server 2',
    host: 'https://dhru2.example.com',
    username: 'reseller@dhru2.com',
    apiType: 'DhruFusion',
    status: 'active',
    servicesCount: 32,
    createdAt: '2025-03-20',
    updatedAt: '2026-05-12',
  },
  {
    id: '3',
    title: 'UnlockBase API',
    host: 'https://api.unlockbase.com',
    username: 'partner@unlockbase.com',
    apiType: 'UnlockBase',
    status: 'inactive',
    servicesCount: 18,
    createdAt: '2025-06-01',
    updatedAt: '2026-04-28',
  },
]

// --- Mock Service Groups ---
export const mockImeiServiceGroups: ImeiServiceGroup[] = [
  { id: '1', title: 'Samsung Unlock', servicesCount: 12, createdAt: '2025-01-20', updatedAt: '2026-05-10' },
  { id: '2', title: 'iPhone iCloud', servicesCount: 8, createdAt: '2025-02-10', updatedAt: '2026-05-11' },
  { id: '3', title: 'Xiaomi Unlock', servicesCount: 6, createdAt: '2025-03-05', updatedAt: '2026-05-09' },
  { id: '4', title: 'IMEI Check', servicesCount: 15, createdAt: '2025-01-10', updatedAt: '2026-05-12' },
  { id: '5', title: 'Network Unlock', servicesCount: 10, createdAt: '2025-04-15', updatedAt: '2026-05-08' },
  { id: '6', title: 'FRP Remove', servicesCount: 7, createdAt: '2025-05-20', updatedAt: '2026-05-07' },
]

// --- Mock Services ---
export const mockImeiServices: ImeiService[] = [
  {
    id: '1',
    title: 'Samsung Galaxy S24 Ultra Unlock (All Carriers)',
    groupId: '1',
    groupName: 'Samsung Unlock',
    apiId: '1',
    apiName: 'DhruFusion Server 1',
    price: 150000,
    deliveryTime: '1-24 jam',
    status: 'active',
    requiresNetwork: true,
    requiresModel: true,
    requiresProvider: false,
    requiresIMEI: true,
    description: 'Unlock Samsung Galaxy S24 Ultra dari semua carrier. Permanent unlock via server.',
    createdAt: '2025-02-01',
    updatedAt: '2026-05-10',
  },
  {
    id: '2',
    title: 'Samsung Galaxy A Series Unlock',
    groupId: '1',
    groupName: 'Samsung Unlock',
    apiId: '1',
    apiName: 'DhruFusion Server 1',
    price: 85000,
    deliveryTime: '1-12 jam',
    status: 'active',
    requiresNetwork: true,
    requiresModel: true,
    requiresProvider: false,
    requiresIMEI: true,
    description: 'Unlock Samsung Galaxy A series (A14, A34, A54, A74). Fast delivery.',
    createdAt: '2025-02-15',
    updatedAt: '2026-05-11',
  },
  {
    id: '3',
    title: 'iPhone iCloud Removal (Clean)',
    groupId: '2',
    groupName: 'iPhone iCloud',
    apiId: '1',
    apiName: 'DhruFusion Server 1',
    price: 500000,
    deliveryTime: '3-7 hari',
    status: 'active',
    requiresNetwork: false,
    requiresModel: true,
    requiresProvider: false,
    requiresIMEI: true,
    description: 'Remove iCloud activation lock untuk iPhone dengan status Clean. IMEI harus bersih.',
    createdAt: '2025-03-01',
    updatedAt: '2026-05-12',
  },
  {
    id: '4',
    title: 'iPhone iCloud Removal (Lost/Stolen)',
    groupId: '2',
    groupName: 'iPhone iCloud',
    apiId: '2',
    apiName: 'DhruFusion Server 2',
    price: 1200000,
    deliveryTime: '7-14 hari',
    status: 'active',
    requiresNetwork: false,
    requiresModel: true,
    requiresProvider: false,
    requiresIMEI: true,
    description: 'Remove iCloud untuk iPhone dengan status Lost/Stolen. Proses lebih lama.',
    createdAt: '2025-03-10',
    updatedAt: '2026-05-10',
  },
  {
    id: '5',
    title: 'Xiaomi Mi Account Unlock',
    groupId: '3',
    groupName: 'Xiaomi Unlock',
    apiId: '2',
    apiName: 'DhruFusion Server 2',
    price: 120000,
    deliveryTime: '1-48 jam',
    status: 'active',
    requiresNetwork: false,
    requiresModel: true,
    requiresProvider: false,
    requiresIMEI: true,
    description: 'Unlock Mi Account / Mi Cloud untuk semua device Xiaomi.',
    createdAt: '2025-04-01',
    updatedAt: '2026-05-09',
  },
  {
    id: '6',
    title: 'IMEI Blacklist Check (Worldwide)',
    groupId: '4',
    groupName: 'IMEI Check',
    apiId: '1',
    apiName: 'DhruFusion Server 1',
    price: 25000,
    deliveryTime: '1-5 menit',
    status: 'active',
    requiresNetwork: false,
    requiresModel: false,
    requiresProvider: false,
    requiresIMEI: true,
    description: 'Cek status blacklist IMEI di seluruh dunia. Hasil instan.',
    createdAt: '2025-01-20',
    updatedAt: '2026-05-12',
  },
  {
    id: '7',
    title: 'iPhone Carrier Check + iCloud Status',
    groupId: '4',
    groupName: 'IMEI Check',
    apiId: '1',
    apiName: 'DhruFusion Server 1',
    price: 35000,
    deliveryTime: '1-5 menit',
    status: 'active',
    requiresNetwork: false,
    requiresModel: false,
    requiresProvider: false,
    requiresIMEI: true,
    description: 'Cek carrier lock, iCloud status, Find My iPhone, dan warranty info.',
    createdAt: '2025-01-25',
    updatedAt: '2026-05-11',
  },
  {
    id: '8',
    title: 'AT&T iPhone Premium Unlock',
    groupId: '5',
    groupName: 'Network Unlock',
    apiId: '2',
    apiName: 'DhruFusion Server 2',
    price: 350000,
    deliveryTime: '1-5 hari',
    status: 'active',
    requiresNetwork: true,
    requiresModel: true,
    requiresProvider: true,
    requiresIMEI: true,
    description: 'Unlock iPhone dari AT&T. Semua model didukung. Premium service.',
    createdAt: '2025-05-01',
    updatedAt: '2026-05-08',
  },
  {
    id: '9',
    title: 'Samsung FRP Remove (All Models)',
    groupId: '6',
    groupName: 'FRP Remove',
    apiId: '1',
    apiName: 'DhruFusion Server 1',
    price: 75000,
    deliveryTime: '1-24 jam',
    status: 'active',
    requiresNetwork: false,
    requiresModel: true,
    requiresProvider: false,
    requiresIMEI: true,
    description: 'Remove Factory Reset Protection (FRP/Google Lock) Samsung semua model.',
    createdAt: '2025-06-01',
    updatedAt: '2026-05-07',
  },
  {
    id: '10',
    title: 'T-Mobile USA Unlock (All Devices)',
    groupId: '5',
    groupName: 'Network Unlock',
    apiId: '2',
    apiName: 'DhruFusion Server 2',
    price: 280000,
    deliveryTime: '1-3 hari',
    status: 'inactive',
    requiresNetwork: true,
    requiresModel: false,
    requiresProvider: true,
    requiresIMEI: true,
    description: 'Unlock semua device dari T-Mobile USA. Samsung, iPhone, LG, dll.',
    createdAt: '2025-05-15',
    updatedAt: '2026-05-06',
  },
]

// --- Mock Orders ---
export const mockImeiOrders: ImeiOrder[] = [
  {
    id: 'ORD-001',
    imei: '356938035643809',
    serviceId: '1',
    serviceName: 'Samsung Galaxy S24 Ultra Unlock (All Carriers)',
    userId: 'usr-1',
    userName: 'Budi Santoso',
    userEmail: 'budi@email.com',
    price: 150000,
    status: 'success',
    code: 'NCK: 12345678\nFREEZE: 87654321',
    note: '',
    comments: 'Unlock code berhasil digenerate',
    createdAt: '2026-05-14 10:30:00',
    updatedAt: '2026-05-14 11:45:00',
  },
  {
    id: 'ORD-002',
    imei: '490154203237518',
    serviceId: '3',
    serviceName: 'iPhone iCloud Removal (Clean)',
    userId: 'usr-2',
    userName: 'Andi Wijaya',
    userEmail: 'andi@email.com',
    price: 500000,
    status: 'in_process',
    note: 'iPhone 14 Pro Max, status clean',
    createdAt: '2026-05-13 14:20:00',
    updatedAt: '2026-05-14 08:00:00',
  },
  {
    id: 'ORD-003',
    imei: '353456789012345',
    serviceId: '6',
    serviceName: 'IMEI Blacklist Check (Worldwide)',
    userId: 'usr-3',
    userName: 'Siti Rahayu',
    userEmail: 'siti@email.com',
    price: 25000,
    status: 'success',
    code: 'Status: CLEAN\nCarrier: Telkomsel\nCountry: Indonesia',
    createdAt: '2026-05-14 09:15:00',
    updatedAt: '2026-05-14 09:16:00',
  },
  {
    id: 'ORD-004',
    imei: '867530012345678',
    serviceId: '5',
    serviceName: 'Xiaomi Mi Account Unlock',
    userId: 'usr-1',
    userName: 'Budi Santoso',
    userEmail: 'budi@email.com',
    price: 120000,
    status: 'pending',
    note: 'Redmi Note 12 Pro',
    createdAt: '2026-05-14 16:00:00',
    updatedAt: '2026-05-14 16:00:00',
  },
  {
    id: 'ORD-005',
    imei: '123456789054321',
    serviceId: '8',
    serviceName: 'AT&T iPhone Premium Unlock',
    userId: 'usr-4',
    userName: 'Dimas Pratama',
    userEmail: 'dimas@email.com',
    price: 350000,
    status: 'rejected',
    note: 'iPhone 15 Pro',
    comments: 'IMEI not found in AT&T database. Please verify the IMEI.',
    createdAt: '2026-05-12 11:00:00',
    updatedAt: '2026-05-13 15:30:00',
  },
  {
    id: 'ORD-006',
    imei: '987654321098765',
    serviceId: '9',
    serviceName: 'Samsung FRP Remove (All Models)',
    userId: 'usr-5',
    userName: 'Rina Kusuma',
    userEmail: 'rina@email.com',
    price: 75000,
    status: 'in_process',
    note: 'Samsung A54',
    createdAt: '2026-05-14 13:45:00',
    updatedAt: '2026-05-14 14:00:00',
  },
  {
    id: 'ORD-007',
    imei: '111222333444555',
    serviceId: '7',
    serviceName: 'iPhone Carrier Check + iCloud Status',
    userId: 'usr-2',
    userName: 'Andi Wijaya',
    userEmail: 'andi@email.com',
    price: 35000,
    status: 'success',
    code: 'Carrier: Verizon (Locked)\niCloud: OFF\nFind My: OFF\nWarranty: Expired',
    createdAt: '2026-05-14 08:30:00',
    updatedAt: '2026-05-14 08:31:00',
  },
]
