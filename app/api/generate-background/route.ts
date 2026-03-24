import { NextRequest, NextResponse } from 'next/server'

const PROMPTS: Record<string, Record<string, string>> = {
  photo: {
    tropical:    'cinematic tropical sunset sky dramatic clouds palm tree silhouettes orange magenta purple golden glow atmospheric event poster background ultra detailed 8k no people no text no logos',
    underground: 'dark moody underground club atmosphere fog smoke lights beams concrete industrial dark blue purple event background cinematic no people no text',
    neon:        'neon city night rain reflections cyberpunk vibrant pink blue green neon lights bokeh wet street event poster background cinematic no text no people',
    golden:      'golden hour sunburst haze warm amber orange cinematic sky dramatic light rays atmospheric event background no people no text ultra detailed',
    festival:    'epic outdoor music festival crowd stage lights fireworks confetti aerial view golden sunset no faces no text cinematic wide angle dramatic',
    editorial:   'minimal luxury studio gradient dark charcoal slate cold blue editorial fashion photography background soft light elegant no people no text',
  },
  illustrative: {
    tropical:    'lush tropical paradise illustration digital art palm leaves exotic flowers vibrant teal turquoise pink editorial graphic design poster art no text',
    underground: 'dark surreal underground labyrinth illustration abstract art moody dark blue purple black graphic poster art no text no people',
    neon:        'neon synthwave retro futuristic grid city illustration digital art pink blue purple glowing geometric poster art 80s aesthetic no text',
    golden:      'golden art nouveau floral botanical illustration ornate decorative warm amber gold luxury poster art no text elegant',
    festival:    'psychedelic colorful festival illustration surreal mushroom forest cosmic stars swirling colors poster art vibrant no text',
    editorial:   'minimalist abstract geometric illustration clean bold shapes pastel gradient editorial modern graphic design poster art no text',
  }
}

export async function POST(req: NextRequest) {
  try {
    const { bgType, vibe, format, customPrompt } = await req.json()

    const type = (bgType === 'illustrative' ? 'illustrative' : 'photo') as 'photo' | 'illustrative'
    const vibeKey = (vibe || 'tropical') as string
    // Use custom prompt from flyer analysis if provided, otherwise use preset
    const prompt = customPrompt
      ? `${customPrompt}, event poster background, ultra detailed, cinematic, no people, no text, no logos`
      : PROMPTS[type]?.[vibeKey] || PROMPTS.photo.tropical

    const width  = format === 'feed' ? 1080 : 1080
    const height = format === 'feed' ? 1350 : 1920
    const seed   = Math.floor(Math.random() * 999999)
    const encodedPrompt = encodeURIComponent(prompt)

    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}&enhance=true`

    const response = await fetch(url, {
      headers: { 'User-Agent': 'LyveApp/1.0' },
      signal: AbortSignal.timeout(60000)
    })

    if (!response.ok) throw new Error(`Pollinations failed: ${response.status}`)

    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (err) {
    console.error('Background generation error:', err)
    return NextResponse.json({ error: 'Failed to generate background' }, { status: 500 })
  }
}
