import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })

    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (listing.userId !== session.user.id && !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const enquiries = await prisma.enquiry.findMany({
      where: { listingId: params.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // latest message preview
        }
      }
    })

    return NextResponse.json(enquiries)
  } catch (error) {
    console.error('Failed to get enquiries', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
