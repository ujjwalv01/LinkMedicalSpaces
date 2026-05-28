import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const prompt = `You are a professional real estate copywriter for medical spaces.
Write an engaging, highly professional property description for a medical office lease/sublease based on the following details.
Return ONLY the generated description text, no conversational filler or intro/outro. Do not use markdown formatting like asterisks. Make it approximately 2-3 short paragraphs.

Details:
Address: ${data.address || 'Unknown'}, ${data.city || 'Unknown'}, ${data.state || ''}
Rooms Available: ${data.rooms || 1}
Monthly Rent: $${data.rent || 'Negotiable'}/month
Amenities/Features: ${data.amenities?.join(', ') || 'Standard medical office features'}
Property Type: ${data.constructionType || 'Established'}
Target Professionals: ${data.targetProfessionals?.join(', ') || 'Any medical professional'}
`

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    })

    // Create a ReadableStream from the async iterable
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              controller.enqueue(chunk.delta.text)
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      }
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain', 'Transfer-Encoding': 'chunked' },
    })

  } catch (error) {
    console.error('[POST /api/generate-description]', error)
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 })
  }
}
