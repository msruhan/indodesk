'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { teknisiServiceMix } from '@/data/mock-analytics'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

export type TeknisiServiceChartData = Array<{ name: string; value: number; color: string }>

type Props = {
  data?: TeknisiServiceChartData
}

export function TeknisiServiceChart({ data }: Props) {
  const [chartHeight, setChartHeight] = useState(260)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const update = () => setChartHeight(mq.matches ? 210 : 260)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const mix = data?.length ? data : teknisiServiceMix

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
        size: '60%',
        labels: {
          show: true,
          name: { fontSize: '12px', color: '#18181b' },
          value: { fontSize: '18px', fontWeight: 700, color: '#18181b', formatter: (v) => `${v}%` },
          total: { show: true, label: 'Layanan', fontSize: '11px', color: '#71717a', formatter: () => '100%' },
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
      transition={{ duration: 0.5, delay: 0.06 }}
    >
      <Card>
        <CardHeader className="border-b border-surface-100 px-4 pb-2 pt-4 sm:px-6 sm:pb-3 sm:pt-6">
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-lg">Breakdown Layanan</CardTitle>
            <p className="mt-0.5 text-[10px] text-surface-500 sm:text-[11px]">
              Distribusi pendapatan per layanan
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-3 pt-2 sm:px-6 sm:pb-6 sm:pt-4">
          <Chart
            options={options}
            series={mix.map((d) => d.value)}
            type="donut"
            height={chartHeight}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}
