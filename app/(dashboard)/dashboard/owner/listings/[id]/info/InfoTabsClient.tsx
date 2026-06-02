'use client'

import { useState } from 'react'
import { BarChart3, MessageSquare, Inbox } from 'lucide-react'
import AnalyticsTab from './AnalyticsTab'
import EnquiriesTab from './EnquiriesTab'
import InboxTab from './InboxTab'

export default function InfoTabsClient({ listingId }: { listingId: string }) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'enquiries' | 'inbox'>('analytics')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'analytics' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics Overview
        </button>
        <button
          onClick={() => setActiveTab('enquiries')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'enquiries' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Enquiries List
        </button>
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'inbox' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Inbox Thread
        </button>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'analytics' && <AnalyticsTab listingId={listingId} />}
        {activeTab === 'enquiries' && <EnquiriesTab listingId={listingId} />}
        {activeTab === 'inbox' && <InboxTab listingId={listingId} />}
      </div>
    </div>
  )
}
