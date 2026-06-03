import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { unstable_cache } from 'next/cache'
import { MessageCircle } from 'lucide-react'
import ContactedClientWrapper from './ContactedClientWrapper'

export const dynamic = 'force-dynamic'

async function getEnquiries(email: string) {
  const getCachedEnquiries = unstable_cache(
    async (userEmail: string) => {
      const enquiries = await prisma.enquiry.findMany({
        where: { email: userEmail },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          listingId: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
          listing: {
            select: {
              id: true,
              title: true,
              slug: true,
              city: true,
              state: true,
              spaceType: true,
              media: {
                orderBy: { order: 'asc' },
                take: 1,
                select: {
                  id: true,
                  originalUrl: true,
                  optimizedUrl: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              content: true,
              sender: true,
              createdAt: true,
            },
          },
        },
      })

      // Add a status field
      const enriched = await Promise.all(
        enquiries.map(async (enq) => {
          const hasListerReply = await prisma.enquiryMessage.findFirst({
            where: { enquiryId: enq.id, sender: 'LISTER' },
            select: { id: true },
          })
          const status = hasListerReply ? 'REPLIED' : 'AWAITING_REPLY'

          return {
            ...enq,
            status,
            createdAt: enq.createdAt.toISOString(),
            updatedAt: enq.updatedAt.toISOString(),
            messages: enq.messages.map(m => ({
              ...m,
              createdAt: m.createdAt.toISOString(),
            })),
          }
        })
      )

      return enriched
    },
    [`contacted-${email}`],
    { tags: [`contacted-${email}`], revalidate: 300 }
  )

  return getCachedEnquiries(email)
}

function ContactedSkeleton() {
  return (
    <div className="space-y-4 mt-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse bg-white rounded-2xl border border-slate-200 p-5 flex gap-4">
          <div className="w-20 h-20 bg-slate-100 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="h-3 bg-slate-100 rounded w-1/4" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

async function ContactedData({ email }: { email: string }) {
  const enquiries = await getEnquiries(email)
  
  if (enquiries.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 px-6 mt-8 shadow-sm">
        <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="w-9 h-9" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">No enquiries yet</h3>
        <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
          You haven't contacted any medical space listers yet. Browse available spaces and send your first enquiry.
        </p>
      </div>
    )
  }

  // Passing data to a client wrapper that manages the expanded state for rows
  return <ContactedClientWrapper enquiries={enquiries as any} />
}

export default async function SeekerContactedPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    redirect('/signin')
  }

  return (
    <>
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Contacted Listings
        </h1>
        <p className="text-slate-500 mt-1">Enquiries you've sent to space listers</p>
      </div>

      <Suspense fallback={<ContactedSkeleton />}>
        <ContactedData email={session.user.email} />
      </Suspense>
    </>
  )
}
