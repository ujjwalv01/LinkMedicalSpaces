// Extend NextAuth types to include custom fields
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      verificationStatus: string
      subscriptionStatus: string
    }
  }

  interface User {
    id: string
    role: string
    verificationStatus: string
    subscriptionStatus: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    verificationStatus: string
    subscriptionStatus: string
  }
}
