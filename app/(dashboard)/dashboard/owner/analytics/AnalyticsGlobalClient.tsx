'use client'

import { Eye, Bookmark, MessageSquare } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

type Overview = { totalViews: number; totalSaved: number; totalEnquiries: number }
type EnquiriesData = { date: string; count: number }[]
type ListingData = { id: string; title: string; status: string; views: number; saves: number; enquiries: number }

export default function AnalyticsGlobalClient({ 
  overview, 
  enquiriesData,
  listings
}: { 
  overview: Overview
  enquiriesData: EnquiriesData
  listings: ListingData[]
}) {
  return (
    <div className="space-y-8">
      {/* Overview Cards */}
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
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Enquiries</p>
            <p className="text-3xl font-extrabold text-slate-900">{overview.totalEnquiries}</p>
          </div>
        </div>
      </div>

      {/* Global Line Chart */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Total Enquiries (Last 30 Days)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={enquiriesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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

      {/* Individual Listings Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">Listing Performance Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Listing Title</th>
                <th className="px-6 py-4 text-center">Views</th>
                <th className="px-6 py-4 text-center">Saves</th>
                <th className="px-6 py-4 text-center">Enquiries</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-medium">No listings found.</td>
                </tr>
              ) : listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{listing.title}</p>
                    <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      listing.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {listing.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-slate-600">{listing.views}</td>
                  <td className="px-6 py-4 text-center font-semibold text-slate-600">{listing.saves}</td>
                  <td className="px-6 py-4 text-center font-semibold text-slate-600">{listing.enquiries}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/owner/listings/${listing.id}/info`}
                      className="text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
