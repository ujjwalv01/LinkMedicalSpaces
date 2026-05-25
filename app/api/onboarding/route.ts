import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const OnboardingSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  bio: z.string().optional().or(z.literal('')),
  image: z.string().url().optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsedData = OnboardingSchema.safeParse(body)

    if (!parsedData.success) {
      return NextResponse.json(
        { error: parsedData.error.issues[0]?.message ?? 'Invalid validation' },
        { status: 400 }
      )
    }

    const { name, phone, bio, image } = parsedData.data

    // Update the user profile and mark onboarded as true
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        bio: bio || undefined,
        image: image || undefined,
        onboarded: true,
      },
    })

    return NextResponse.json({ success: true, message: 'Onboarding completed successfully.' })
  } catch (error) {
    console.error('[POST /api/onboarding]', error)
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 })
  }
}
