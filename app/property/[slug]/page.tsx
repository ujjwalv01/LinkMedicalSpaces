import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import PropertyDetailClient from './PropertyDetailClient'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface PropertyPageProps {
  params: {
    slug: string
  }
}

// Generate dynamic SEO metadata server-side
export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const listing = await prisma.listing.findUnique({
    where: { slug: params.slug },
    include: {
      media: { orderBy: { order: 'asc' }, take: 1 },
    },
  })

  if (!listing) {
    return {
      title: 'Space Not Found | LinkMedicalSpaces',
      description: 'The requested medical space listing was not found.',
    }
  }

  const title = `${listing.title} — LinkMedicalSpaces`
  const description = listing.description
    ? listing.description.substring(0, 160)
    : 'Find exam rooms, surgical suites, and specialized medical offices to rent or lease.'

  const ogImage =
    listing.media?.[0]?.originalUrl ||
    'https://www.linkmedicalspaces.com/wp-content/uploads/2024/04/LMS-Image-1-1473559425.jpg'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://www.linkmedicalspaces.com/property/${listing.slug}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: listing.title || 'Medical Space',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function PropertyDetailPage({ params }: PropertyPageProps) {
  // Query listing details
  const listing = await prisma.listing.findUnique({
    where: { slug: params.slug },
    include: {
      media: { orderBy: { order: 'asc' } },
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          verificationStatus: true,
          createdAt: true,
        },
      },
    },
  })

  if (!listing) {
    notFound()
  }

  // Enforce access control for unpublished (draft/pending) listings
  if (listing.status !== 'PUBLISHED') {
    const session = await getServerSession(authOptions)
    const isOwner = session?.user?.id === listing.userId
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')

    if (!isOwner && !isAdmin) {
      notFound()
    }
  }

  // Convert dates and custom Prisma types to plain JSON objects for Client components
  const serializedListing = {
    ...listing,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    amenities: typeof listing.amenities === 'string' 
      ? JSON.parse(listing.amenities) 
      : Array.isArray(listing.amenities)
      ? listing.amenities
      : [],
    availabilityHours: typeof listing.availabilityHours === 'string'
      ? JSON.parse(listing.availabilityHours)
      : listing.availabilityHours || {},
    user: listing.user
      ? {
          ...listing.user,
          createdAt: listing.user.createdAt.toISOString(),
        }
      : null,
    media: listing.media.map(mediaItem => ({
      ...mediaItem,
      createdAt: mediaItem.createdAt.toISOString(),
    })),
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <Navbar />
      <main className="flex-grow">
        <PropertyDetailClient listing={serializedListing} />
      </main>
      <Footer />
    </div>
  )
}
