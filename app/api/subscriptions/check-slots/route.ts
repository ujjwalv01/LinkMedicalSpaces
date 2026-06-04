import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ availableSlots: 0 })
    }

    const userId = session.user.id

    // Run both counts in parallel for speed
    const [activeSubs, usedSlots] = await Promise.all([
      prisma.subscription.count({
        where: { userId, status: 'ACTIVE' }
      }),
      prisma.listing.count({
        where: { userId, status: { not: 'DRAFT' } }
      })
    ])

    const availableSlots = Math.max(0, activeSubs - usedSlots)

    return NextResponse.json({ availableSlots })
  } catch (error) {
    console.error('[GET /api/subscriptions/check-slots]', error)
    return NextResponse.json({ availableSlots: 0 }, { status: 500 })
  }
}
