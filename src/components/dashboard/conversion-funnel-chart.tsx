'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { conversionFunnel as mockFunnel } from '@/data/mock-analytics'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

type FunnelItem = { stage: string; value: number }

type Props = {
  data?: FunnelItem[]
}

export function ConversionFunnelChart({ data }: Props) {
  const funnel = data && data.length > 0 ? data : mockFunnel

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        toolbar: { show: false },
        foreColor: '#71717a',
        animations: { enabled: true, speed: 700 },
      },
      colors: ['#10b981'],
      plotOptions: {
        bar: { borderRadius: 6, horizontal: true, barHeight: '60%' },
      },
      fill: {
        type: 'gradient',
        gradient: { shade: 'light', type: 'horizontal', shadeIntensity: 0.2, opacityFrom: 1, opacityTo: 0.7 },
      },
      dataLabels: {
        enabled: true,
        formatter: (v) => `${(v as number).toLocaleString('id-ID')}`,
        style: { fontSize: '11px', fontWeight: 600, colors: ['#fff'] },
        offsetX: -4,
      },
      grid: {
        borderColor: '#f4f4f5',
        strokeDashArray: 4,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
      },
      xaxis: {
        categories: funnel.map((d) => d.stage),
        labels: { style: { colors: '#71717a', fontSize: '11px' } },
      },
      yaxis: { labels: { style: { colors: '#52525b', fontSize: '11px', fontWeight: 500 } } },
      tooltip: { theme: 'light', y: { formatter: (v) => v.toLocaleString('id-ID') } },
    }),
    [funnel],
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card>
        <CardHeader className="border-b border-surface-100 pb-3">
          <CardTitle>Funnel Platform</CardTitle>
          <p className="mt-0.5 text-[11px] text-surface-500">Kunjungan → order → selesai (agregat DB)</p>
        </CardHeader>
        <CardContent className="pt-4">
          <Chart
            options={options}
            series={[{ name: 'Volume', data: funnel.map((d) => d.value) }]}
            type="bar"
            height={240}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}
