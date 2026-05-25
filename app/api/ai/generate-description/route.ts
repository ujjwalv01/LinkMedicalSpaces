import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

// Helper function to generate fallback description if API key is invalid/missing
function generateFallbackDescription(listing: {
  spaceType: string | null
  city: string | null
  state: string | null
  squareFeet: number | null
  rooms: number | null
  amenities: string[]
}) {
  const typeLabel = listing.spaceType
    ? listing.spaceType.replace(/_/g, ' ').toLowerCase()
    : 'medical space'
  const sizeText = listing.squareFeet ? `${listing.squareFeet} sq. ft.` : ''
  const locationText =
    listing.city && listing.state ? `${listing.city}, ${listing.state}` : 'our premier medical center'
  const amenitiesList =
    listing.amenities.length > 0
      ? listing.amenities.join(', ')
      : 'essential clinical infrastructure and utilities'

  return `This is a premium, fully-equipped ${typeLabel} located in the heart of ${locationText}. Specially tailored to meet the exacting standards of healthcare practitioners and medical professionals, this ${
    sizeText ? `${sizeText} ` : ''
  }space offers a seamless environment to deliver exceptional patient care. The layout has been optimized for clean patient flow, safety, and modern clinical efficiency.

Equipped with premium infrastructure, this medical space includes access to ${amenitiesList}. The environment features modern finishes, professional lighting, and compliant design standards suitable for general examinations, consultations, or specialized procedures depending on your practice requirements.

Located in a highly accessible area of ${
    listing.city || 'the city'
  } with convenient transport links and ample parking, this space provides a premium presence for your healthcare practice. Benefit from a collaborative professional environment designed to elevate the patient experience and streamline your daily operations.`
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { listingId } = body

    if (!listingId) {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 })
    }

    // Retrieve listing details from DB
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Verify ownership
    if (listing.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse amenities JSON
    let parsedAmenities: string[] = []
    try {
      parsedAmenities =
        typeof listing.amenities === 'string'
          ? JSON.parse(listing.amenities)
          : (listing.amenities as string[]) || []
    } catch (_) {
      parsedAmenities = []
    }

    const spaceType = listing.spaceType || 'Medical Space'
    const city = listing.city || 'N/A'
    const state = listing.state || 'N/A'
    const size = listing.squareFeet ? `${listing.squareFeet} sq. ft.` : 'N/A'
    const amenities = parsedAmenities.length > 0 ? parsedAmenities.join(', ') : 'Standard clinical amenities'

    // Format the prompt as explicitly requested
    const prompt = `You are a professional real estate copywriter specializing in medical spaces. 
Generate a compelling, professional description for a medical space listing with these details:
Space Type: ${spaceType}
Location: ${city}, ${state}
Amenities: ${amenities}
Size: ${size}
Write 2-3 paragraphs. Be specific, professional and highlight the medical features.
Do not use generic phrases. Make it sound premium and trustworthy.`

    const apiKey = process.env.ANTHROPIC_API_KEY

    // Check if the key is missing or is the default placeholder
    if (!apiKey || apiKey.includes('your-anthropic-api-key')) {
      console.warn('Anthropic API key is not configured. Using high-quality fallback generator.')
      const description = generateFallbackDescription({
        spaceType: listing.spaceType,
        city: listing.city,
        state: listing.state,
        squareFeet: listing.squareFeet,
        rooms: listing.rooms,
        amenities: parsedAmenities,
      })
      return NextResponse.json({ description })
    }

    try {
      const anthropic = new Anthropic({ apiKey })
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      })

      const content = message.content[0]
      if (content && content.type === 'text') {
        return NextResponse.json({ description: content.text.trim() })
      } else {
        throw new Error('Unexpected response type from Claude')
      }
    } catch (apiError) {
      console.error('Claude API call failed, falling back to template generation:', apiError)
      const description = generateFallbackDescription({
        spaceType: listing.spaceType,
        city: listing.city,
        state: listing.state,
        squareFeet: listing.squareFeet,
        rooms: listing.rooms,
        amenities: parsedAmenities,
      })
      return NextResponse.json({ description })
    }
  } catch (error) {
    console.error('[POST /api/ai/generate-description]', error)
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 })
  }
}
