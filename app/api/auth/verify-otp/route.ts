import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json()

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase()

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email: normalizedEmail,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'OTP expired or not found. Please request a new one.' },
        { status: 400 }
      )
    }

    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Please request a new OTP.' },
        { status: 429 }
      )
    }

    if (otpRecord.code !== otp) {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      })
      const remaining = 4 - otpRecord.attempts
      return NextResponse.json(
        { error: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` },
        { status: 400 }
      )
    }

    // OTP is correct — mark as verified
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    })

    return NextResponse.json({ success: true, email: normalizedEmail })
  } catch (error) {
    console.error('[POST /api/auth/verify-otp]', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
