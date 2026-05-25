'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { teknisiEarningsWeekly } from '@/data/mock-analytics'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

export type TeknisiEarningsChartData = {
  weeks: string[]
  earnings: number[]
  consultations: number[]
  remote: number[]
  wowPercent?: number | null
}

type Props = {
  data?: TeknisiEarningsChartData
}

function formatWowBadge(percent: number | null | undefined): string | null {
  if (percent === null || percent === undefined) return null
  const sign = percent > 0 ? '+' : ''
  return `${sign}${percent}% WoW`
}

export function TeknisiEarningsChart({ data }: Props) {
  const useMock = !data
  const weeks = data?.weeks ?? teknisiEarningsWeekly.map((d) => d.week)
  const earnings = data?.earnings ?? teknisiEarningsWeekly.map((d) => d.earnings)
  const consultations =
    data?.consultations ?? teknisiEarningsWeekly.map((d) => d.consultations)
  const remote = data?.remote ?? teknisiEarningsWeekly.map((d) => d.remote)
  const wowLabel = useMock ? '+14% WoW' : formatWowBadge(data?.wowPercent)
  const hasSessionSeries =
    consultations.some((n) => n > 0) || remote.some((n) => n > 0)

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        toolbar: { show: false },
        foreColor: '#71717a',
        animations: { enabled: true, speed: 800 },
      },
      colors: ['#10b981', '#8b5cf6', '#06b6d4'],
      stroke: { curve: 'smooth', width: hasSessionSeries ? [3, 2, 2] : [3] },
      fill: {
        type: hasSessionSeries ? ['gradient', 'solid', 'solid'] : ['gradient'],
        gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 90, 100] },
      },
      dataLabels: { enabled: false },
      grid: { borderColor: '#f4f4f5', strokeDashArray: 4, padding: { left: 8, right: 8 } },
      xaxis: {
        categories: weeks,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#71717a', fontSize: '11px' } },
      },
      yaxis: [
        {
          title: {
            text: 'Earnings (rb)',
            style: { color: '#71717a', fontSize: '11px', fontWeight: 500 },
          },
          labels: { style: { colors: '#71717a', fontSize: '11px' }, formatter: (v) => `${v}` },
        },
        ...(hasSessionSeries
          ? [
              {
                opposite: true,
                title: {
                  text: 'Sesi',
                  style: { color: '#71717a', fontSize: '11px', fontWeight: 500 },
                },
                labels: { style: { colors: '#71717a', fontSize: '11px' } },
                min: 0,
                forceNiceScale: true,
              },
            ]
          : []),
      ],
      legend: { position: 'top', horizontalAlign: 'right', fontSize: '11px', markers: { size: 4 } },
      tooltip: {
        theme: 'light',
        shared: true,
        y: { formatter: (v: number) => `${v}` },
      },
    }),
    [weeks, hasSessionSeries],
  )

  const series = useMemo(() => {
    const base = [{ name: 'Pendapatan (rb)', type: 'area' as const, data: earnings }]
    if (!hasSessionSeries) return base
    return [
      ...base,
      { name: 'Konsultasi', type: 'line' as const, data: consultations },
      { name: 'Remote', type: 'line' as const, data: remote },
    ]
  }, [earnings, consultations, remote, hasSessionSeries])

  const wowPositive = (data?.wowPercent ?? 14) >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader className="border-b border-surface-100 pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Pendapatan Mingguan</CardTitle>
              <p className="mt-0.5 text-[11px] text-surface-500">
                Pendapatan dari wallet vs sesi konsultasi & remote selesai
              </p>
            </div>
            {wowLabel ? (
              <span
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold',
                  wowPositive
                    ? 'bg-primary-50 text-primary-700'
                    : 'bg-rose-50 text-rose-700',
                )}
              >
                {wowLabel}
              </span>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Chart options={options} series={series} type="line" height={260} />
        </CardContent>
      </Card>
    </motion.div>
  )
}
