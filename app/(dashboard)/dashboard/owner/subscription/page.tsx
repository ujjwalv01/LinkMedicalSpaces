import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShieldCheck, CreditCard, Calendar, CheckCircle2, ArrowRight } from 'lucide-react'

export default async function OwnerSubscriptionPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) redirect('/signin')

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true }
  })

  if (!user) redirect('/signin')

  const subscription = user.subscription
  const isActive = subscription?.status === 'ACTIVE'

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Subscription & Billing
        </h1>
        <p className="text-slate-500 mt-1">Manage your membership plan and billing preferences.</p>
      </div>

      {!isActive ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-sm mt-12">
          <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mx-auto text-teal-600 mb-6 relative">
            <CreditCard className="w-10 h-10" />
            <div className="absolute top-0 right-0 w-5 h-5 bg-amber-500 rounded-full border-4 border-white"></div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-800 mb-4">No Active Subscription</h3>
          <p className="text-slate-500 text-base max-w-md mx-auto mb-10 leading-relaxed">
            Upgrade to a premium plan to list your clinical spaces, accept bookings directly, and gain access to detailed analytics.
          </p>
          <Link
            href="/pricing"
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-teal-600/20 active:scale-95 transition-all text-base inline-flex items-center gap-2"
          >
            View Plans & Pricing
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-8 md:p-10 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {subscription.planName} Plan
                  </h3>
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                </div>
                <p className="text-slate-500 font-medium">
                  Your premium access is fully active.
                </p>
              </div>
            </div>
            
            <div className="text-left md:text-right">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly Billing</p>
              <p className="text-3xl font-extrabold text-slate-900">${subscription.amount.toFixed(2)}<span className="text-lg text-slate-500 font-semibold">/mo</span></p>
            </div>
          </div>

          <div className="p-8 md:p-10 bg-slate-50 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">Plan Details</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-600 text-sm font-medium">Unlimited clinic space listings</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-600 text-sm font-medium">Direct booking and inquiry management</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-600 text-sm font-medium">Premium placement in search results</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-600 text-sm font-medium">Advanced dashboard analytics</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">Billing Cycle</h4>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <Calendar className="w-4 h-4" /> Start Date
                  </div>
                  <span className="text-slate-900 font-bold">
                    {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <Calendar className="w-4 h-4 text-amber-500" /> Next Renewal
                  </div>
                  <span className="text-slate-900 font-bold">
                    {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
              </div>
              
              <button className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 rounded-xl transition-colors text-sm">
                Manage Billing Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
