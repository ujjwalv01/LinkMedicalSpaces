import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'OWNER') {
      return NextResponse.json({ hasUnread: false, count: 0 })
    }

    // Find all enquiries for the owner's listings where the LAST message is from 'ENQUIRER'
    // To do this efficiently, we can just find any enquiry for the owner's listings
    // where the count of messages from ENQUIRER is greater than 0 AND...
    // Actually, let's just fetch the enquiries and their latest message
    const enquiries = await prisma.enquiry.findMany({
      where: {
        listing: { userId: session.user.id }
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    const unreadCount = enquiries.filter(enq => {
      if (enq.messages.length === 0) return true // No messages yet means it's a new enquiry (unread)
      return enq.messages[0].sender === 'ENQUIRER'
    }).length

    return NextResponse.json({
      hasUnread: unreadCount > 0,
      count: unreadCount
    })
  } catch (error) {
    console.error('Failed to fetch unread count:', error)
    return NextResponse.json({ hasUnread: false, count: 0 }, { status: 500 })
  }
}
