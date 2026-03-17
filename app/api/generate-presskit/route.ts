import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, city, instagram, bio } = body

    if (!bio || bio.trim().length < 20) {
      return NextResponse.json({ success: false, error: 'Bio is too short' }, { status: 400 })
    }

    const prompt = `You are a music industry publicist helping a DJ build their press kit. A DJ has written their own bio in their own words. Your job is to take their authentic voice and create press kit assets that sound like THEM — not like a generic AI bio.

THEIR WRITTEN BIO:
"${bio}"

ADDITIONAL INFO:
- Name: ${name || '(use what\'s in the bio)'}
- City: ${city || '(use what\'s in the bio)'}
- Instagram: ${instagram ? '@' + instagram.replace('@', '') : '(not provided)'}

RULES:
1. Pull specific phrases, words, and personality from THEIR bio — do not invent new facts
2. Match their tone — if they're casual, keep it casual. If they're more formal, match that
3. Never use clichés like "takes listeners on a journey", "has been making waves", "seamlessly blends"
4. Keep everything grounded in what they actually said
5. Story captions should feel like something a real person would post — not a press release

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "bio_refined": "A polished version of their bio, keeping their voice and personality but cleaning up any awkward phrasing. 3-4 sentences. Should still sound like them.",
  "booking_pitch": "A 2-3 sentence pitch specifically for venue bookers. Lead with what they bring to a room, end with availability/contact hook. Pulled from their actual story.",
  "genre_tags": ["5 specific genre/style tags extracted from their bio — be specific, not generic"],
  "one_liners": [
    "A punchy one-liner description (under 15 words) in their voice",
    "A second one-liner with a different angle",
    "A third one-liner — funny or self-aware if their bio suggests that personality"
  ],
  "story_captions": [
    {"type": "Available to Book", "caption": "Caption using their actual language and references. Feels like them. 1-2 sentences + 3-4 hashtags."},
    {"type": "Hype/Pre-Show", "caption": "Hype caption before a set. Uses their personality. Short and punchy."},
    {"type": "Aesthetic/Mood", "caption": "Minimal vibe caption. Could just be a lyric, a feeling, or a short phrase that fits their aesthetic."},
    {"type": "Post-Show", "caption": "After the set caption. Grateful but not cringe. Feels natural."},
    {"type": "Booking CTA", "caption": "Direct ask for bookings. Their voice, not corporate."}
  ],
  "canva_brief": {
    "headline": "Headline for a story graphic — pulled from their language, under 6 words",
    "subline": "Supporting text for the graphic, under 10 words",
    "mood_keywords": ["3 mood/aesthetic words that describe their vibe based on their bio"],
    "color_direction": "Brief description of what colors/aesthetic fits their described sound and personality"
  },
  "video_script": {
    "hook": "First 3 seconds of a 20-sec promo reel — what visual or line grabs attention based on their personality",
    "middle": "Seconds 4-15 — what clips/energy/vibe would work based on how they describe their sets",
    "cta": "Final 5 seconds — what they say or show, in their voice",
    "music_note": "What kind of track from their described genre/vibe would work under this reel"
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json({ success: false, error: `API error ${response.status}`, detail: errText }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''
    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
    const kit = JSON.parse(cleaned)
    return NextResponse.json({ success: true, kit })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
