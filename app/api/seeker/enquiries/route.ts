import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET — Fetch all enquiries sent by the current seeker (matched by email)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const enquiries = await prisma.enquiry.findMany({
      where: { email: session.user.email },
      orderBy: { updatedAt: 'desc' },
      include: {
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

    // Add a status field: if any message has sender LISTER → "Replied", else "Awaiting Reply"
    const enriched = await Promise.all(
      enquiries.map(async (enq) => {
        const hasListerReply = await prisma.enquiryMessage.findFirst({
          where: { enquiryId: enq.id, sender: 'LISTER' },
          select: { id: true },
        })
        return {
          ...enq,
          status: hasListerReply ? 'REPLIED' : 'AWAITING_REPLY',
          createdAt: enq.createdAt.toISOString(),
          updatedAt: enq.updatedAt.toISOString(),
          messages: enq.messages.map(m => ({
            ...m,
            createdAt: m.createdAt.toISOString(),
          })),
        }
      })
    )

    return NextResponse.json({ enquiries: enriched })
  } catch (error) {
    console.error('[GET /api/seeker/enquiries]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
