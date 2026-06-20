import type { PrismaClient } from '@prisma/client'
import { ShippingLocationType } from '@prisma/client'
import {
  buildBinderbyteCityId,
  buildBinderbyteDistrictId,
  buildBinderbyteVillageId,
  sortShippingLocations,
} from '../src/lib/shipping-locations'

const BASE_URL =
  'https://raw.githubusercontent.com/ridwaanhall/wilayah-indonesia/main/data'

type RawProvince = {
  kode: number
  nama: string
}

type RawParent = {
  kode: number
  nama: string
}

type RawRegency = {
  kode: number
  nama: string
  parent: RawParent
}

type RawDistrict = {
  kode: number
  nama: string
  parent: RawParent
}

type RawVillage = {
  kode: number
  nama: string
  parent: RawParent
}

type ShippingLocationRow = {
  id: string
  type: ShippingLocationType
  code: string
  name: string
  label: string
  parentId: string | null
  binderbyteId: string | null
  postalCode: string | null
  sortOrder: number
}

async function fetchRegionList<T>(path: string): Promise<T[]> {
  const res = await fetch(`${BASE_URL}/${path}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`Gagal mengambil data wilayah: ${path}`)
  }

  const json = (await res.json()) as T[]
  if (!Array.isArray(json)) {
    throw new Error(`Format data wilayah tidak valid: ${path}`)
  }
  return json
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

export async function seedShippingLocations(prisma: PrismaClient) {
  const existing = await prisma.shippingLocation.count()
  if (existing > 0) {
    console.log(`📍 Shipping locations already seeded (${existing} rows), skipping`)
    return
  }

  console.log('📍 Seeding shipping locations...')

  const provinces = sortShippingLocations(await fetchRegionList<RawProvince>('provinsi.json')).map(
    (row) => ({
      code: String(row.kode).padStart(2, '0'),
      name: row.nama,
    }),
  )
  const regencies = sortShippingLocations(await fetchRegionList<RawRegency>('kabupaten.json')).map(
    (row) => ({
      code: `${String(row.kode).padStart(4, '0').slice(0, 2)}.${String(row.kode)
        .padStart(4, '0')
        .slice(2)}`,
      name: row.nama,
      provinceCode: String(row.parent.kode).padStart(2, '0'),
      provinceName: row.parent.nama,
    }),
  )
  const districts = sortShippingLocations(await fetchRegionList<RawDistrict>('kecamatan.json')).map(
    (row) => {
      const raw = String(row.kode).padStart(6, '0')
      return {
        code: `${raw.slice(0, 2)}.${raw.slice(2, 4)}.${raw.slice(4, 6)}`,
        name: row.nama,
        cityCode: `${String(row.parent.kode).padStart(4, '0').slice(0, 2)}.${String(
          row.parent.kode,
        )
          .padStart(4, '0')
          .slice(2)}`,
        cityName: row.parent.nama,
      }
    },
  )
  const villages = sortShippingLocations(await fetchRegionList<RawVillage>('desa.json')).map(
    (row) => {
      const raw = String(row.kode).padStart(10, '0')
      return {
        code: `${raw.slice(0, 2)}.${raw.slice(2, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 10)}`,
        name: row.nama,
        districtCode: `${String(row.parent.kode).padStart(6, '0').slice(0, 2)}.${String(
          row.parent.kode,
        )
          .padStart(6, '0')
          .slice(2, 4)}.${String(row.parent.kode).padStart(6, '0').slice(4, 6)}`,
        districtName: row.parent.nama,
      }
    },
  )
  const rows: ShippingLocationRow[] = []

  for (const [provinceIndex, province] of provinces.entries()) {
    const provinceId = `province_${province.code}`
    rows.push({
      id: provinceId,
      type: ShippingLocationType.PROVINCE,
      code: province.code,
      name: province.name,
      label: province.name,
      parentId: null,
      binderbyteId: null,
      postalCode: null,
      sortOrder: provinceIndex,
    })
  }

  const citySortCounters = new Map<string, number>()
  for (const city of regencies) {
    const provinceId = `province_${city.provinceCode}`
    const cityId = buildBinderbyteCityId(city.code)
    const sortOrder = citySortCounters.get(provinceId) ?? 0
    citySortCounters.set(provinceId, sortOrder + 1)
    rows.push({
      id: cityId,
      type: ShippingLocationType.CITY,
      code: city.code,
      name: city.name,
      label: `${city.name}, ${city.provinceName}`,
      parentId: provinceId,
      binderbyteId: cityId,
      postalCode: null,
      sortOrder,
    })
  }

  const districtSortCounters = new Map<string, number>()
  for (const district of districts) {
    const cityId = buildBinderbyteCityId(district.cityCode)
    const districtId = buildBinderbyteDistrictId(district.code)
    const sortOrder = districtSortCounters.get(cityId) ?? 0
    districtSortCounters.set(cityId, sortOrder + 1)
    rows.push({
      id: districtId,
      type: ShippingLocationType.DISTRICT,
      code: district.code,
      name: district.name,
      label: `${district.name}, ${district.cityName}`,
      parentId: cityId,
      binderbyteId: districtId,
      postalCode: null,
      sortOrder,
    })
  }

  const districtNameById = new Map(
    districts.map((district) => [buildBinderbyteDistrictId(district.code), district.name]),
  )
  const cityNameByCode = new Map(regencies.map((city) => [city.code, city.name]))
  const villageSortCounters = new Map<string, number>()
  for (const village of villages) {
    const districtId = buildBinderbyteDistrictId(village.districtCode)
    const villageId = buildBinderbyteVillageId(village.code)
    const cityCode = village.code.split('.').slice(0, 2).join('.')
    const cityName = cityNameByCode.get(cityCode)
    const sortOrder = villageSortCounters.get(districtId) ?? 0
    villageSortCounters.set(districtId, sortOrder + 1)
    const parts = [
      village.name,
      districtNameById.get(districtId) ?? village.districtName,
      cityName,
    ].filter(Boolean)
    rows.push({
      id: villageId,
      type: ShippingLocationType.VILLAGE,
      code: village.code,
      name: village.name,
      label: parts.join(', '),
      parentId: districtId,
      binderbyteId: villageId,
      postalCode: null,
      sortOrder,
    })
  }

  for (const batch of chunk(rows, 2000)) {
    await prisma.shippingLocation.createMany({ data: batch })
  }

  console.log(`✅ Shipping locations seeded (${rows.length} rows)`)
}
