import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/admin'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await verifyAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            verificationStatus: true,
            subscription: {
              select: { startDate: true, status: true, planName: true, amount: true },
            },
          },
        },
        media: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { bookings: true },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    return NextResponse.json({ listing, adminRole: admin.role })
  } catch (error) {
    console.error('[GET /api/lms-admin/properties/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
