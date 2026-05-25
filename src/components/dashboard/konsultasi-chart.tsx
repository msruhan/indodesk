'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { transactionMix as mockMix } from '@/data/mock-analytics'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

type MixItem = { name: string; value: number; color: string }

type Props = {
  data?: MixItem[]
}

export function KonsultasiChart({ data }: Props) {
  const mix = data && data.length > 0 ? data : mockMix

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        toolbar: { show: false },
        foreColor: '#71717a',
        animations: { enabled: true, speed: 800 },
      },
      colors: mix.map((d) => d.color),
      labels: mix.map((d) => d.name),
      dataLabels: {
        enabled: true,
        formatter: (val) => `${(val as number).toFixed(0)}%`,
        style: { fontSize: '11px', fontWeight: 600 },
        dropShadow: { enabled: false },
      },
      plotOptions: {
        pie: {
          donut: {
            size: '62%',
            labels: {
              show: true,
              name: { fontSize: '12px', color: '#18181b' },
              value: { fontSize: '18px', fontWeight: 700, color: '#18181b', formatter: (v) => `${v}%` },
              total: {
                show: true,
                label: 'Total',
                fontSize: '11px',
                color: '#71717a',
                formatter: () => '100%',
              },
            },
          },
        },
      },
      stroke: { width: 2, colors: ['#fff'] },
      legend: {
        position: 'bottom',
        fontSize: '11px',
        markers: { size: 6, shape: 'circle' as const },
        itemMargin: { horizontal: 8, vertical: 4 },
      },
      tooltip: { theme: 'light', y: { formatter: (v) => `${v}%` } },
    }),
    [mix],
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.08 }}
    >
      <Card>
        <CardHeader className="border-b border-surface-100 pb-3">
          <CardTitle>Mix Transaksi</CardTitle>
          <p className="mt-0.5 text-[11px] text-surface-500">Distribusi kategori order platform</p>
        </CardHeader>
        <CardContent className="pt-4">
          <Chart options={options} series={mix.map((d) => d.value)} type="donut" height={280} />
        </CardContent>
      </Card>
    </motion.div>
  )
}
