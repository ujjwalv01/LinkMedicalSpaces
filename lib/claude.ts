import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export default anthropic

export interface ListingDescriptionInput {
  spaceType: string
  listingType: string
  address: string
  city: string
  state: string
  squareFeet?: number
  amenities: string[]
  specialties: string[]
  pricePerMonth?: number
  additionalInfo?: string
}

export async function generateListingDescription(
  input: ListingDescriptionInput
): Promise<string> {
  const prompt = `You are a professional real estate copywriter specializing in medical office spaces. 
Write a compelling, professional listing description for a medical space with these details:

Space Type: ${input.spaceType}
Listing Type: ${input.listingType}
Location: ${input.address}, ${input.city}, ${input.state}
${input.squareFeet ? `Size: ${input.squareFeet} sq ft` : ''}
${input.pricePerMonth ? `Price: $${input.pricePerMonth}/month` : ''}
Amenities: ${input.amenities.join(', ')}
Accepted Specialties: ${input.specialties.join(', ')}
${input.additionalInfo ? `Additional Info: ${input.additionalInfo}` : ''}

Write a 2-3 paragraph description that:
1. Highlights the key features and location advantages
2. Speaks to the needs of medical professionals
3. Is professional, clean, and compelling
4. Does NOT include pricing (that will be shown separately)
5. Is under 300 words

Return only the description text, no headers or labels.`

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  return content.text
}

export async function generateListingTitle(
  spaceType: string,
  city: string,
  state: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 64,
    messages: [
      {
        role: 'user',
        content: `Generate a professional, catchy listing title for a ${spaceType} available in ${city}, ${state}. 
Keep it under 10 words. Return only the title, nothing else.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  return content.text.trim()
}
