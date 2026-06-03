import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { CreditCard, Calendar, CheckCircle, XCircle, ArrowRight, ShieldCheck, Activity } from 'lucide-react'
import Link from 'next/link'

export default async function OwnerSubscriptionPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'OWNER') {
    redirect('/signin')
  }

  // Fetch all subscriptions for this owner
  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  // Format dates
  const formatDate = (date: Date | null) => {
    if (!date) return '—'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date))
  }

  const activeCount = subscriptions.filter(s => s.status === 'ACTIVE').length

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Subscriptions</h1>
          <p className="text-sm text-slate-500 font-medium mt-2 max-w-2xl leading-relaxed">
            Manage your listing subscriptions here. Each active property listing requires one active subscription. 
            You currently have <span className="font-bold text-slate-700">{activeCount} active</span> subscription(s).
          </p>
        </div>
        
        <Link 
          href="/add-listing" 
          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-teal-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 flex-shrink-0"
        >
          <CreditCard className="w-5 h-5" />
          Buy New Subscription
        </Link>
      </div>

      {subscriptions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 mb-3">No Subscriptions Yet</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8 text-base leading-relaxed font-medium">
            You haven't subscribed to any listing plans yet. Purchase a subscription to unlock the ability to publish your medical spaces to thousands of seekers.
          </p>
          <Link 
            href="/add-listing" 
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-all active:scale-95"
          >
            Start Listing Process <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((sub) => {
            const isActive = sub.status === 'ACTIVE'
            const isTest = sub.stripeSubscriptionId?.includes('test') || !sub.stripeSubscriptionId
            
            return (
              <div 
                key={sub.id} 
                className={`bg-white rounded-3xl border-2 p-6 shadow-sm relative overflow-hidden transition-all ${
                  isActive ? 'border-teal-500 shadow-teal-500/10 hover:shadow-teal-500/20' : 'border-slate-200 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Background decorative blob */}
                {isActive && (
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-50 rounded-full blur-2xl z-0 pointer-events-none" />
                )}
                
                <div className="relative z-10 flex flex-col h-full">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Plan</span>
                        <h3 className="text-lg font-extrabold text-slate-900">{sub.planName}</h3>
                      </div>
                      
                      <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        isActive ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-50 text-slate-500 border border-slate-200'
                      }`}>
                        {isActive ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {sub.status}
                      </div>
                    </div>

                    <div className="flex items-end gap-1 mb-8">
                      <span className="text-4xl font-black text-slate-900">${sub.amount}</span>
                      <span className="text-sm font-semibold text-slate-500 mb-1">/year</span>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-500 font-medium">
                          <Calendar className="w-4 h-4" /> Start Date
                        </span>
                        <span className="font-bold text-slate-900">{formatDate(sub.startDate || sub.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-500 font-medium">
                          <Activity className="w-4 h-4" /> Renewal
                        </span>
                        <span className="font-bold text-slate-900">{formatDate(sub.endDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">ID:</span>
                      <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-50 px-2 py-1 rounded truncate">
                        {sub.stripeSubscriptionId || sub.id}
                      </span>
                    </div>
                    
                    {isTest && (
                      <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md uppercase tracking-wider flex-shrink-0 ml-2">
                        Sandbox
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
