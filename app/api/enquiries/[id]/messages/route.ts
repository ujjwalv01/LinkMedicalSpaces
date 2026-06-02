import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const enquiry = await prisma.enquiry.findUnique({
      where: { id: params.id },
      include: { listing: { select: { userId: true } } }
    })

    if (!enquiry) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (enquiry.listing.userId !== session.user.id && !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const messages = await prisma.enquiryMessage.findMany({
      where: { enquiryId: params.id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Failed to get messages', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { content } = await req.json()
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 })
    }

    const enquiry = await prisma.enquiry.findUnique({
      where: { id: params.id },
      include: { listing: { select: { userId: true } } }
    })

    if (!enquiry) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (enquiry.listing.userId !== session.user.id && !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const message = await prisma.$transaction([
      prisma.enquiryMessage.create({
        data: {
          enquiryId: params.id,
          content,
          sender: 'LISTER',
        }
      }),
      prisma.enquiry.update({
        where: { id: params.id },
        data: { updatedAt: new Date() }
      })
    ])

    return NextResponse.json(message[0])
  } catch (error) {
    console.error('Failed to post message', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
