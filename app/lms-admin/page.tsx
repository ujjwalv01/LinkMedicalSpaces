'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Building,
  DollarSign,
  UserPlus,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle2,
  Loader2,
} from 'lucide-react'

interface Stats {
  totalUsers: number
  totalListers: number
  totalSeekers: number
  totalProperties: number
  publishedCount: number
  pendingCount: number
  draftCount: number
  totalRevenue: number
  newSignupsToday: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/lms-admin/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-slate-500 font-semibold">
        Failed to load dashboard data.
      </div>
    )
  }

  const primaryCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      iconBg: 'bg-blue-100',
    },
    {
      label: 'Total Properties',
      value: stats.totalProperties,
      icon: Building,
      color: 'bg-teal-50 text-teal-600 border-teal-100',
      iconBg: 'bg-teal-100',
    },
    {
      label: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      iconBg: 'bg-emerald-100',
    },
    {
      label: 'New Signups Today',
      value: stats.newSignupsToday,
      icon: UserPlus,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      iconBg: 'bg-amber-100',
    },
  ]

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Platform statistics at a glance
        </p>
      </div>

      {/* Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {primaryCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className={`rounded-2xl border p-5 ${card.color} transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <TrendingUp className="w-4 h-4 opacity-40" />
              </div>
              <p className="text-2xl font-black tracking-tight">{card.value}</p>
              <p className="text-xs font-bold uppercase tracking-wider mt-1 opacity-70">{card.label}</p>
            </div>
          )
        })}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* User Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">User Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">Listers</span>
              <span className="text-sm font-extrabold text-slate-900">{stats.totalListers}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-teal-500 h-2 rounded-full transition-all"
                style={{ width: `${stats.totalUsers ? (stats.totalListers / stats.totalUsers) * 100 : 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">Seekers</span>
              <span className="text-sm font-extrabold text-slate-900">{stats.totalSeekers}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${stats.totalUsers ? (stats.totalSeekers / stats.totalUsers) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Properties Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Properties by Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-slate-600">Published</span>
              </div>
              <span className="text-sm font-extrabold text-emerald-600">{stats.publishedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-slate-600">Pending</span>
              </div>
              <span className="text-sm font-extrabold text-amber-600">{stats.pendingCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-600">Draft</span>
              </div>
              <span className="text-sm font-extrabold text-slate-500">{stats.draftCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
