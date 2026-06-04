import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import prisma from '@/lib/prisma'

const resend = new Resend(process.env.RESEND_API_KEY)

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase()

    // Rate limit: max 3 OTPs per 10 minutes
    const recentOtps = await prisma.otpCode.count({
      where: {
        email: normalizedEmail,
        createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) },
      },
    })

    if (recentOtps >= 3) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please wait 10 minutes.' },
        { status: 429 }
      )
    }

    // Invalidate previous OTPs for this email
    await prisma.otpCode.updateMany({
      where: { email: normalizedEmail, verified: false },
      data: { verified: true }, // Mark as used
    })

    // Generate and save new OTP (expires in 10 minutes)
    const code = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.otpCode.create({
      data: { email: normalizedEmail, code, expiresAt },
    })

    // Send email via Resend
    await resend.emails.send({
      from: 'LinkMedicalSpaces <onboarding@resend.dev>',
      to: normalizedEmail,
      subject: `${code} — Your LinkMedicalSpaces verification code`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0f766e); 
                        padding: 12px 24px; border-radius: 12px;">
              <span style="color: white; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">
                LinkMedicalSpaces
              </span>
            </div>
          </div>

          <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 40px;">
            <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #111827;">
              Your verification code
            </h2>
            <p style="margin: 0 0 32px; color: #6b7280; font-size: 15px;">
              Enter this code to sign in to your LinkMedicalSpaces account.
            </p>

            <!-- OTP Display -->
            <div style="background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; 
                        padding: 24px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 42px; font-weight: 800; letter-spacing: 12px; 
                           color: #0d9488; font-family: monospace;">
                ${code}
              </span>
            </div>

            <p style="margin: 0; color: #9ca3af; font-size: 13px; text-align: center;">
              ⏱ This code expires in <strong>10 minutes</strong>.<br/>
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>

          <p style="text-align: center; color: #d1d5db; font-size: 12px; margin-top: 24px;">
            © ${new Date().getFullYear()} LinkMedicalSpaces. All rights reserved.
          </p>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('[POST /api/auth/send-otp]', error)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
