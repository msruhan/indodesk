'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

const pendingApprovals = [
  { 
    id: '1', 
    type: 'Produk', 
    name: 'Unlock Tool Premium License', 
    submitter: 'TechSolution Store',
    date: '1 jam lalu',
    description: 'Software license untuk unlock berbagai brand handphone'
  },
  { 
    id: '2', 
    type: 'Teknisi', 
    name: 'Rudi Hartono', 
    submitter: 'Rudi Hartono',
    date: '3 jam lalu',
    description: 'Teknisi baru dengan spesialisasi hardware repair'
  },
  { 
    id: '3', 
    type: 'Toko', 
    name: 'Mobile Repair Surabaya', 
    submitter: 'Rudi Hartono',
    date: '5 jam lalu',
    description: 'Toko service handphone di Surabaya'
  },
  { 
    id: '4', 
    type: 'Produk', 
    name: 'Xiaomi Redmi Note 12 Pro', 
    submitter: 'HandPhone Center',
    date: '1 hari lalu',
    description: 'Handphone baru kondisi 95%'
  },
]

export default function AdminApprovalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Approval</h1>
        <p className="text-surface-400 mt-1">Review dan approve produk, teknisi, dan toko</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals.length}</div>
            <p className="text-xs text-surface-500">Menunggu review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-surface-500">Hari ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-surface-500">Hari ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals ({pendingApprovals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingApprovals.map((item) => (
              <div key={item.id} className="flex items-start justify-between p-4 border border-surface-200 rounded-lg hover:bg-surface-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="secondary">{item.type}</Badge>
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                  </div>
                  <p className="text-sm text-surface-400 mb-2">{item.description}</p>
                  <div className="flex items-center gap-4 text-sm text-surface-500">
                    <span>Submitter: {item.submitter}</span>
                    <span>•</span>
                    <span>{item.date}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

