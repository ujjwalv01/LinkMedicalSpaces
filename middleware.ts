import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    
    // User role & subscription status
    const role = token?.role as string | undefined
    const subscriptionStatus = token?.subscriptionStatus as string | undefined

    const isOwner = role === 'OWNER' || role === 'ADMIN' || role === 'SUPER_ADMIN'
    const isSubscribed = subscriptionStatus === 'ACTIVE'

    // Guard path: /add-listing
    if (req.nextUrl.pathname.startsWith('/add-listing')) {
      // Seekers are not allowed to post listings at all
      if (!isOwner) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }

      // Owners must have an active subscription
      if (!isSubscribed) {
        const pricingUrl = new URL('/pricing', req.url)
        pricingUrl.searchParams.set('message', 'Subscribe to post your listing')
        return NextResponse.redirect(pricingUrl)
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/signin',
    },
  }
)

export const config = {
  matcher: ['/add-listing/:path*'],
}
