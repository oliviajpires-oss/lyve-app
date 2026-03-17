import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, genres, city, vibe, gigs, years, influences, instagram } = body

    if (!name || !genres || !city || !vibe) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const prompt = `You are a professional music industry copywriter specializing in DJ/artist branding. Generate a complete AI Press Kit for this DJ/artist.

ARTIST INFO:
- Name: ${name}
- Genres: ${genres}
- City: ${city}
- Vibe/Style: ${vibe}
- Notable Gigs/Events: ${gigs || 'Not specified'}
- Years Active: ${years || 'Not specified'}
- Influences: ${influences || 'Not specified'}
- Instagram: ${instagram ? '@' + instagram.replace('@','') : 'Not specified'}

Generate a JSON response with EXACTLY this structure (no markdown, pure JSON):
{
  "bio_short": "A punchy 2-3 sentence bio for booking inquiries (under 100 words). Professional and energetic.",
  "bio_long": "A full 150-200 word artist bio. Tell their story, their sound, their impact. Use present tense. No clichés.",
  "booking_description": "A 50-75 word description venues use when announcing this DJ. Focus on the experience they bring to a room.",
  "genre_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "story_captions": [
    {"type": "Available to Book", "caption": "Ready to post story caption announcing availability. Include genres and city. Add 3-5 relevant hashtags. Under 150 chars."},
    {"type": "Hype/Energy", "caption": "High energy caption for promoting a set or event. Bold, punchy. Under 150 chars with hashtags."},
    {"type": "Aesthetic/Minimal", "caption": "Minimal, cool, mood-focused caption. Less is more. Under 100 chars."},
    {"type": "Post-Show Recap", "caption": "After the event caption. Grateful but not cringe. Under 150 chars."},
    {"type": "Booking Inquiry CTA", "caption": "Direct caption to drive booking inquiries. Clear call to action. Under 150 chars."}
  ],
  "canva_brief": {
    "headline": "Short bold headline for a story graphic (under 8 words)",
    "subline": "Supporting line for the graphic (under 12 words)",
    "mood_keywords": ["keyword1", "keyword2", "keyword3"],
    "color_direction": "Brief color/mood direction for their brand aesthetic"
  },
  "video_script": {
    "hook": "Opening line/visual for a 20-sec promo reel (first 3 seconds)",
    "middle": "What happens in seconds 4-15 — describe the energy, visuals, pacing",
    "cta": "Final 5 seconds — what they say or show as a call to action",
    "music_note": "Describe the type of track that should play under this reel"
  }
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json({ success: false, error: `Anthropic API error: ${response.status}`, detail: errText }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    // Strip markdown code blocks if present
    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

    const kit = JSON.parse(cleaned)
    return NextResponse.json({ success: true, kit })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
