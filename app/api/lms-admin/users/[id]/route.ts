import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAdminSession, isSuperAdmin, logAdminAction } from '@/lib/admin'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await verifyAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        listings: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            spaceType: true,
            city: true,
            state: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        bookings: {
          select: {
            id: true,
            listingId: true,
            status: true,
            createdAt: true,
            listing: {
              select: { title: true, slug: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        subscription: true,
        _count: {
          select: {
            listings: true,
            bookings: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user, adminRole: admin.role })
  } catch (error) {
    console.error('[GET /api/lms-admin/users/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await verifyAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Only Super Admin can delete users
  if (!isSuperAdmin(admin.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, name: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Don't allow deleting other admins
    const { isAdminEmail } = await import('@/lib/admin')
    if (isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Cannot delete admin users' }, { status: 403 })
    }

    await prisma.user.delete({ where: { id: params.id } })

    await logAdminAction(
      admin.email,
      'DELETE_USER',
      params.id,
      'User',
      JSON.stringify({ email: user.email, name: user.name })
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/lms-admin/users/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
