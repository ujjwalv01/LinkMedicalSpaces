import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET — Fetch all enquiries for listings owned by the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const enquiries = await prisma.enquiry.findMany({
      where: {
        listing: {
          userId: session.user.id
        }
      },
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

    // Add a status field: if any message has sender ENQUIRER after a LISTER reply, or if there are no LISTER replies
    const enriched = await Promise.all(
      enquiries.map(async (enq) => {
        const hasListerReply = await prisma.enquiryMessage.findFirst({
          where: { enquiryId: enq.id, sender: 'LISTER' },
          select: { id: true },
        })

        // Simple status for owner: if they replied, it's REPLIED. If not, ACTION_REQUIRED.
        // A more advanced system would check if the LAST message is from ENQUIRER.
        const lastMessage = await prisma.enquiryMessage.findFirst({
          where: { enquiryId: enq.id },
          orderBy: { createdAt: 'desc' },
          select: { sender: true }
        })

        const status = lastMessage?.sender === 'ENQUIRER' ? 'ACTION_REQUIRED' : 'REPLIED'

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

    return NextResponse.json({ enquiries: enriched })
  } catch (error) {
    console.error('[GET /api/owner/enquiries]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
