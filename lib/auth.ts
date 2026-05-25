import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

// Admin email domains — auto-assign ADMIN role
const ADMIN_DOMAINS = ['mediatree.co.in', 'mediatree.com']

function getEmailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? ''
}

function isAdminEmail(email: string): boolean {
  return ADMIN_DOMAINS.includes(getEmailDomain(email))
}

export const authOptions: NextAuthOptions = {
  providers: [
    // ── Google OAuth ────────────────────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: { prompt: 'consent', access_type: 'offline', response_type: 'code' },
      },
    }),

    // ── Email / Password ────────────────────────────────────────────────────
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        if (!user?.password) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          verificationStatus: user.verificationStatus,
          subscriptionStatus: user.subscriptionStatus,
        }
      },
    }),

    // ── OTP / Magic-Link Credentials ────────────────────────────────────────
    CredentialsProvider({
      id: 'otp',
      name: 'OTP',
      credentials: {
        email: { label: 'Email', type: 'email' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) return null

        const email = credentials.email.toLowerCase()

        // Find latest valid OTP for this email
        const otpRecord = await prisma.otpCode.findFirst({
          where: {
            email,
            verified: false,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: 'desc' },
        })

        if (!otpRecord) return null
        if (otpRecord.attempts >= 5) return null
        if (otpRecord.code !== credentials.otp) {
          // Increment attempt counter
          await prisma.otpCode.update({
            where: { id: otpRecord.id },
            data: { attempts: { increment: 1 } },
          })
          return null
        }

        // Mark OTP as verified
        await prisma.otpCode.update({
          where: { id: otpRecord.id },
          data: { verified: true },
        })

        // Upsert user — auto-assign role
        const role = isAdminEmail(email) ? 'ADMIN' : undefined

        const user = await prisma.user.upsert({
          where: { email },
          update: { ...(role ? { role } : {}) },
          create: {
            email,
            role: role ?? 'SEEKER',
            verificationStatus: 'PENDING',
            subscriptionStatus: 'INACTIVE',
          },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          verificationStatus: user.verificationStatus,
          subscriptionStatus: user.subscriptionStatus,
        }
      },
    }),
  ],

  session: { strategy: 'jwt' },

  pages: {
    signIn: '/signin',
    error: '/signin',
  },

  callbacks: {
    // ── Sign In Hook — auto-sync Google users ───────────────────────────────
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        const email = user.email.toLowerCase()
        const role = isAdminEmail(email) ? 'ADMIN' : undefined

        await prisma.user.upsert({
          where: { email },
          update: {
            name: user.name ?? undefined,
            image: user.image ?? undefined,
            ...(role ? { role } : {}),
          },
          create: {
            email,
            name: user.name,
            image: user.image,
            role: role ?? 'SEEKER',
            verificationStatus: 'PENDING',
            subscriptionStatus: 'INACTIVE',
          },
        })
      }
      return true
    },

    // ── JWT — embed user data ───────────────────────────────────────────────
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.verificationStatus = (user as any).verificationStatus
        token.subscriptionStatus = (user as any).subscriptionStatus
      }

      // Re-fetch on session update trigger
      if (trigger === 'update' && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            verificationStatus: true,
            subscriptionStatus: true,
            name: true,
            image: true,
          },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.verificationStatus = dbUser.verificationStatus
          token.subscriptionStatus = dbUser.subscriptionStatus
          token.name = dbUser.name
          token.picture = dbUser.image
        }
      }

      return token
    },

    // ── Session — expose to client ──────────────────────────────────────────
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id as string
        ;(session.user as any).role = token.role as string
        ;(session.user as any).verificationStatus = token.verificationStatus as string
        ;(session.user as any).subscriptionStatus = token.subscriptionStatus as string
      }
      return session
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}
