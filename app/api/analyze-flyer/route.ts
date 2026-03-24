import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('flyer') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Convert to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mediaType = (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 }
          },
          {
            type: 'text',
            text: `Analyze this event flyer/poster and extract its visual style. Return ONLY valid JSON with these exact fields:

{
  "primaryColor": "#hex",
  "secondaryColor": "#hex", 
  "accentColor": "#hex",
  "textColor": "#ffffff or #000000",
  "bgType": "photo" or "illustrative",
  "vibe": one of ["tropical", "underground", "neon", "golden", "festival", "editorial"],
  "fontStyle": one of ["bold", "clean", "elegant"],
  "backgroundPrompt": "a detailed 15-word cinematic description of the background style and mood for AI image generation, no people, no text",
  "styleNotes": "one sentence describing what makes this aesthetic unique"
}

Rules:
- primaryColor: the most dominant background/base color
- secondaryColor: the secondary/accent background color  
- accentColor: the color used for highlighted text (dates, names) — pick the most vibrant/eye-catching color
- bgType: "illustrative" if it uses illustration/art/graphic elements, "photo" if photographic or gradient
- vibe: pick the closest match from the list based on overall mood
- backgroundPrompt: focus on atmosphere, colors, textures, lighting — what an AI image generator needs to recreate the mood`
          }
        ]
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    
    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)

  } catch (err) {
    console.error('Flyer analysis error:', err)
    return NextResponse.json({ error: 'Failed to analyze flyer' }, { status: 500 })
  }
}
