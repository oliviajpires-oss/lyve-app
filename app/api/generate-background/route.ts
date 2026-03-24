import { NextRequest, NextResponse } from 'next/server'

// ─── Genre-specific visual DNA ────────────────────────────────────────────────
// Each genre has a distinct visual culture in the real world
const GENRE_DNA: Record<string, string> = {
  techno:       'brutalist concrete industrial warehouse Berlin underground stark harsh single-source lighting monochrome dark shadows',
  tech_house:   'moody warehouse amber candlelit exposed brick modern sophisticated low ceiling club texture cinematic',
  deep_house:   'intimate jazz club soft neon blue-purple vinyl warm analog velvet curtains late night',
  house:        'soulful Chicago New York warm golden joyful community colorful vibrant cultural rich',
  dnb:          'urban kinetic high-energy neon-lit street industrial motion blur night city concrete jungle',
  trance:       'cosmic ethereal aurora borealis dreamy celestial clouds luminous soft glowing otherworldly spiritual',
  afrobeats:    'vibrant Lagos Accra golden hour rich fabrics colorful tropical lush green warm sunburst',
  hiphop:       'urban street editorial cinematic golden hour confident cultural New York Los Angeles architectural',
  reggaeton:    'Miami neon tropical night Latin vibrant warm pink gold glamorous luxury poolside',
  edm:          'epic massive festival stage laser show aerial crowd fireworks confetti stadium electric',
  dubstep:      'dark industrial glitch distorted heavy mechanical neon green yellow alien texture',
  amapiano:     'South African golden warm dust sunsets township energy vibrant joyful colorful landscape',
  lofi:         'soft grain nostalgic warm study night city window rain pastel muted cinematic',
  ambient:      'minimal vast empty architectural negative space fog mist calm ethereal abstract slow',
  disco:        'glitter mirror ball warm golden 70s retro Studio54 glamorous sparkle vintage',
}

// ─── Vibe modifiers ───────────────────────────────────────────────────────────
const VIBE_MOD: Record<string, string> = {
  tropical:    'tropical sunset palm silhouettes vibrant orange magenta sky dramatic clouds',
  underground: 'underground dark moody fog smoke atmospheric',
  neon:        'neon city rain reflections cyberpunk wet asphalt bokeh',
  golden:      'golden hour warm amber haze sunburst dramatic backlight',
  festival:    'outdoor festival epic scale aerial perspective crowd energy',
  editorial:   'minimal clean luxury studio gradient elegant negative space',
}

// ─── Illustrative style prompts ───────────────────────────────────────────────
const ILLUS_GENRE: Record<string, string> = {
  techno:       'abstract geometric monochrome halftone industrial illustration dark harsh graphic design',
  tech_house:   'dark art deco graphic moody abstract shapes texture overlay editorial illustration',
  deep_house:   'art nouveau organic flowing curves dark elegant watercolor editorial illustration',
  house:        'colorful bold pop art graphic design vibrant shapes joyful illustration',
  dnb:          'urban graffiti kinetic bold graphic illustration neon splatter motion',
  trance:       'psychedelic cosmic fractal digital art ethereal glowing mandala illustration',
  afrobeats:    'vibrant African pattern textile bold geometric color illustration Ankara print',
  hiphop:       'urban street art bold graphic graffiti culture editorial illustration',
  reggaeton:    'tropical neon bold graphic Latin art illustration palm leaves bright',
  edm:          'epic digital art lightning energy waves laser graphic illustration',
  dubstep:      'dark glitch art distorted pixel abstract digital illustration',
  amapiano:     'vibrant African contemporary art abstract warm bold illustration',
  lofi:         'soft pastel anime aesthetic nostalgic illustration grain texture',
  ambient:      'minimal abstract watercolor soft gradient ethereal illustration',
  disco:        'retro 70s graphic design glitter geometric bold vintage illustration',
}

export async function POST(req: NextRequest) {
  try {
    const { bgType, vibe, genre, format, customPrompt } = await req.json()

    const isIllus = bgType === 'illustrative'
    const vibeKey = (vibe || 'underground') as string
    const genreKey = (genre || 'techno').replace('-', '_').replace(' ', '_').toLowerCase()

    let prompt: string

    if (customPrompt) {
      // Brand-matched prompt from flyer analysis
      prompt = `${customPrompt}, event poster background, ultra detailed, cinematic, no people, no text, no logos`
    } else if (isIllus) {
      const genreStyle = ILLUS_GENRE[genreKey] || ILLUS_GENRE.techno
      const vibeStyle  = VIBE_MOD[vibeKey] || VIBE_MOD.underground
      prompt = `${genreStyle}, ${vibeStyle}, poster background artwork, no text, no faces, no logos, high detail`
    } else {
      const genreStyle = GENRE_DNA[genreKey] || GENRE_DNA.techno
      const vibeStyle  = VIBE_MOD[vibeKey] || VIBE_MOD.underground
      prompt = `${genreStyle}, ${vibeStyle}, cinematic photography, event poster background, ultra detailed, 8k, no people, no text, no logos, atmospheric`
    }

    const width  = 1080
    const height = format === 'feed' ? 1350 : 1920
    const seed   = Math.floor(Math.random() * 9999999)
    const encodedPrompt = encodeURIComponent(prompt)

    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}&enhance=true&model=flux`

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
