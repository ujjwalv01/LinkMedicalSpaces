import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = session.user.role || 'SEEKER'
    const isOwner = role === 'OWNER' || role === 'ADMIN' || role === 'SUPER_ADMIN'

    let bookings

    if (isOwner) {
      // Owners view incoming bookings on their properties
      bookings = await prisma.booking.findMany({
        where: {
          listing: {
            userId: session.user.id,
          },
        },
        include: {
          listing: {
            include: {
              media: { orderBy: { order: 'asc' }, take: 1 },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              phone: true,
            },
          },
        },
        orderBy: {
          startDate: 'desc',
        },
      })
    } else {
      // Seekers view their own reservations
      bookings = await prisma.booking.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          listing: {
            include: {
              media: { orderBy: { order: 'asc' }, take: 1 },
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: {
          startDate: 'desc',
        },
      })
    }

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('[GET /api/bookings]', error)
    return NextResponse.json({ error: 'Failed to retrieve bookings' }, { status: 500 })
  }
}
