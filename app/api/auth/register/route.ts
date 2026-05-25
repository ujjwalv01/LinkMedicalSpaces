import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const ADMIN_DOMAINS = ['mediatree.co.in', 'mediatree.com']

function isAdminEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  return ADMIN_DOMAINS.includes(domain)
}

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['SEEKER', 'OWNER']),
  mciNumber: z.string().optional(),
  documentUrl: z.string().url().optional(),
  acceptedTerms: z.boolean().refine((v) => v === true, 'You must accept the terms'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = RegisterSchema.parse(body)

    const normalizedEmail = data.email.toLowerCase()

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in.' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12)

    // Determine role — admin override for trusted domains
    const role = isAdminEmail(normalizedEmail)
      ? 'ADMIN'
      : data.role

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: normalizedEmail,
        password: hashedPassword,
        role,
        mciNumber: data.role === 'OWNER' ? data.mciNumber : undefined,
        documentUrl: data.role === 'OWNER' ? data.documentUrl : undefined,
        verificationStatus: data.role === 'OWNER' ? 'PENDING' : 'VERIFIED',
        subscriptionStatus: 'INACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        verificationStatus: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        user,
        message:
          role === 'OWNER'
            ? 'Account created! Your documents are under review.'
            : 'Account created successfully!',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Validation failed' },
        { status: 400 }
      )
    }
    console.error('[POST /api/auth/register]', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
