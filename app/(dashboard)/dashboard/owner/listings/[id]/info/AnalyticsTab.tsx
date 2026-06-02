'use client'

import { useEffect, useState } from 'react'
import { Eye, Bookmark, MessageSquare, Loader2 } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AnalyticsTab({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState({ totalViews: 0, totalSaved: 0, totalEnquiries: 0 })
  const [viewsData, setViewsData] = useState([])
  const [enquiriesData, setEnquiriesData] = useState([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [overviewRes, viewsRes, enquiriesRes] = await Promise.all([
          fetch(`/api/analytics/${listingId}/overview`),
          fetch(`/api/analytics/${listingId}/views-over-time`),
          fetch(`/api/analytics/${listingId}/enquiries-over-time`),
        ])
        
        if (overviewRes.ok) setOverview(await overviewRes.json())
        if (viewsRes.ok) setViewsData(await viewsRes.json())
        if (enquiriesRes.ok) setEnquiriesData(await enquiriesRes.json())
      } catch (err) {
        console.error('Failed to load analytics', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [listingId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-white rounded-3xl border border-slate-200">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading analytics...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
            <Eye className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Views</p>
            <p className="text-3xl font-extrabold text-slate-900">{overview.totalViews}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <Bookmark className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Saves</p>
            <p className="text-3xl font-extrabold text-slate-900">{overview.totalSaved}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enquiries</p>
            <p className="text-3xl font-extrabold text-slate-900">{overview.totalEnquiries}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Views (Last 30 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={viewsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={3} dot={{ r: 4, fill: '#0d9488' }} activeDot={{ r: 6 }} />
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="5 5" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Enquiries Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Enquiries (Last 30 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enquiriesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Bar dataKey="count" fill="#d97706" radius={[4, 4, 0, 0]} />
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="5 5" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
