import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const OnboardingSchema = z.object({
  userType: z.enum(['OWNER', 'SEEKER']),
  userSubType: z.enum(['Doctor', 'Staff', 'Real Estate Agent']),
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
        { error: parsedData.error.issues[0]?.message ?? 'Invalid data' },
        { status: 400 }
      )
    }

    const { userType, userSubType } = parsedData.data

    // Update the user role, sub-type, and mark as onboarded
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role: userType as any,
        userSubType,
        onboarded: true,
      },
    })

    return NextResponse.json({ success: true, message: 'Onboarding completed successfully.' })
  } catch (error: any) {
    console.error('[POST /api/onboarding] Error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })
    }
    return NextResponse.json({ error: error?.message || 'Failed to complete onboarding' }, { status: 500 })
  }
}
