'use client'

import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { 
  TrendingUp,
  Users,
  UserCheck,
  ShoppingBag,
  MessageCircle,
} from 'lucide-react'

const stats = [
  {
    title: 'Total User',
    value: '1,245',
    change: '+12.5%',
    trend: 'up',
    icon: Users,
    iconBgColor: 'bg-white/20',
    iconTextColor: 'text-white',
    cardBg: 'bg-primary-500',
    titleColor: 'text-white/90',
    valueColor: 'text-white',
    changeColor: 'text-white',
  },
  {
    title: 'Total Teknisi',
    value: '234',
    change: '+8.2%',
    trend: 'up',
    icon: UserCheck,
    iconBgColor: 'bg-white/20',
    iconTextColor: 'text-white',
    cardBg: 'bg-black',
    titleColor: 'text-white/90',
    valueColor: 'text-white',
    changeColor: 'text-white',
  },
  {
    title: 'Total Transaksi',
    value: '5,678',
    change: '+23.1%',
    trend: 'up',
    icon: ShoppingBag,
    iconBgColor: 'bg-white/20',
    iconTextColor: 'text-white',
    cardBg: 'bg-primary-500',
    titleColor: 'text-white/90',
    valueColor: 'text-white',
    changeColor: 'text-white',
  },
  {
    title: 'Total Konsultasi',
    value: '3,456',
    change: '+15.7%',
    trend: 'up',
    icon: MessageCircle,
    iconBgColor: 'bg-white/20',
    iconTextColor: 'text-white',
    cardBg: 'bg-black',
    titleColor: 'text-white/90',
    valueColor: 'text-white',
    changeColor: 'text-white',
  },
]

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {stats.map((stat, index) => (
        <div
          key={stat.title}
        >
          <Card className={`p-5 ${stat.cardBg} border-0 shadow-sm hover:shadow-md transition-all duration-200`}>
            <div className="flex items-start justify-between mb-4">
              <CardTitle className={`text-sm font-medium ${stat.titleColor}`}>{stat.title}</CardTitle>
              <div className={`w-10 h-10 rounded-lg ${stat.iconBgColor} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.iconTextColor}`} />
              </div>
            </div>
            <CardContent className="p-0">
              <div className={`text-3xl font-bold ${stat.valueColor} mb-2`}>{stat.value}</div>
              <div className="flex items-center justify-end gap-2">
                <div className={`w-8 h-8 rounded-full ${stat.iconBgColor} flex items-center justify-center`}>
                  <TrendingUp className={`w-4 h-4 ${stat.iconTextColor}`} />
                </div>
                <p className={`text-xs font-medium ${stat.changeColor}`}>
                  {stat.change}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
