'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardStats {
  todayVisits: number
  redeemedVouchers: number
  activeFamilies: number
  pendingVouchers: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    todayVisits: 0,
    redeemedVouchers: 0,
    activeFamilies: 0,
    pendingVouchers: 0,
  })

  useEffect(() => {
    // TODO: Fetch real stats from API
    // Mock data for now
    setStats({
      todayVisits: 12,
      redeemedVouchers: 3,
      activeFamilies: 45,
      pendingVouchers: 8,
    })
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to Teddy & Friends admin panel
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Visits</CardTitle>
            <span className="text-2xl">🎯</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayVisits}</div>
            <p className="text-xs text-muted-foreground">
              +2 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redeemed Vouchers</CardTitle>
            <span className="text-2xl">🎟️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.redeemedVouchers}</div>
            <p className="text-xs text-muted-foreground">
              Today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Families</CardTitle>
            <span className="text-2xl">👨‍👩‍👧‍👦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeFamilies}</div>
            <p className="text-xs text-muted-foreground">
              Total registered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Vouchers</CardTitle>
            <span className="text-2xl">⏳</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingVouchers}</div>
            <p className="text-xs text-muted-foreground">
              Active vouchers
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest visits and voucher redemptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-2 rounded border">
              <span className="text-2xl">🎯</span>
              <div className="flex-1">
                <p className="font-medium">New visit recorded</p>
                <p className="text-sm text-muted-foreground">Family TF-000012 • 2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-2 rounded border">
              <span className="text-2xl">🎟️</span>
              <div className="flex-1">
                <p className="font-medium">Voucher redeemed</p>
                <p className="text-sm text-muted-foreground">Family TF-000008 • 15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-2 rounded border">
              <span className="text-2xl">🌟</span>
              <div className="flex-1">
                <p className="font-medium">Loyalty completed</p>
                <p className="text-sm text-muted-foreground">Family TF-000015 • 1 hour ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
