'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react'

export default function SubscriptionListClient({ subscriptions }: { subscriptions: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date))
  }

  return (
    <div className="space-y-4">
      {subscriptions.map((sub, index) => {
        const isActive = sub.status === 'ACTIVE'
        const isTest = sub.stripeSubscriptionId?.includes('test') || !sub.stripeSubscriptionId
        const isExpanded = expandedId === sub.id

        return (
          <div 
            key={sub.id} 
            className={`bg-white rounded-2xl border transition-all overflow-hidden ${
              isActive ? 'border-teal-200 shadow-sm hover:shadow-md' : 'border-slate-200 opacity-90'
            }`}
          >
            {/* Header Row */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                  isActive ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {index + 1}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{sub.planName} Plan</h3>
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                      isActive ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {sub.status}
                    </div>
                    {isTest && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                        Sandbox
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5 font-medium">
                    ${sub.amount} / year
                  </p>
                </div>
              </div>

              <button 
                onClick={() => toggleExpand(sub.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  isExpanded 
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                View Details
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t border-slate-100 bg-slate-50/50 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Subscriber Info */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subscriber Details</h4>
                    
                    <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3">
                      <div>
                        <p className="text-[11px] text-slate-500 font-medium">Name</p>
                        <p className="text-sm font-semibold text-slate-900">{sub.user?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 font-medium">Email</p>
                        <p className="text-sm font-semibold text-slate-900">{sub.user?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 font-medium">Subscription ID</p>
                        <p className="text-xs font-mono font-medium text-slate-600 bg-slate-50 p-1.5 rounded truncate">
                          {sub.stripeSubscriptionId || sub.id}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Billing Info */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Billing & Dates</h4>
                    
                    <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3">
                      <div>
                        <p className="text-[11px] text-slate-500 font-medium">Status</p>
                        <p className="text-sm font-semibold text-slate-900 capitalize">{sub.status.toLowerCase()}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 font-medium">Start Date</p>
                        <p className="text-sm font-semibold text-slate-900">{formatDate(sub.startDate || sub.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 font-medium">Renewal Date</p>
                        <p className="text-sm font-semibold text-slate-900">{formatDate(sub.endDate)}</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
