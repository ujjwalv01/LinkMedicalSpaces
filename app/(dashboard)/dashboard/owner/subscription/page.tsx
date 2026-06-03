import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Plus, ShieldCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import SubscriptionListClient from './SubscriptionListClient'

export default async function OwnerSubscriptionPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'OWNER') {
    redirect('/signin')
  }

  // Fetch all subscriptions for this owner with user details
  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } }
    }
  })

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
          <Plus className="w-5 h-5 stroke-[3]" />
          List Your Space
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
        <SubscriptionListClient subscriptions={subscriptions} />
      )}
    </div>
  )
}
