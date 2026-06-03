'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidateTag } from 'next/cache'

export async function removeSavedListing(listingId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  try {
    await prisma.savedListing.delete({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId: listingId,
        },
      },
    })
    
    // Invalidate the cache for this user's saved listings
    revalidateTag(`saved-listings-${session.user.id}`)
    
    return { success: true }
  } catch (error) {
    console.error('Failed to remove saved listing', error)
    throw new Error('Failed to remove saved listing')
  }
}
