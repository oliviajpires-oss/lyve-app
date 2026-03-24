'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { Download, Upload, Wand2, ChevronRight, ChevronLeft, X, Check, Loader2, RefreshCw, Palette, Type, Image as ImageIcon } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface EventDetails {
  artistName: string
  date: string
  time: string
  venueName: string
  supportingArtists: string
  ticketLink: string
}
interface BrandColors {
  artistName: string
  venueName: string
  date: string
  supporting: string
  overlay: string
  overlayOpacity: number
}
interface BrandKit {
  colors: BrandColors
  fontFamily: string
  customFontName: string | null
  venueLogoUrl: string | null
  venueLogoPos: LogoPos
  venueLogoSize: number
  artistLogoUrl: string | null
  artistLogoPos: LogoPos
  artistLogoSize: number
}
type LogoPos = 'tl' | 'tc' | 'tr' | 'bl' | 'br'

interface TextEffects {
  outline: boolean
  outlineColor: string
  outlineWidth: number
  gradient: boolean
  gradientColor2: string
  letterSpacing: number
  glow: boolean
  allCaps: boolean
}
interface StyleConfig {
  bgType: 'photo' | 'illustrative'
  vibe: string
  genre: string
  artistSize: number
  textEffects: TextEffects
}

// ─── Font library ─────────────────────────────────────────────────────────────
const FONT_GROUPS = [
  {
    label: 'Bold & Display',
    fonts: [
      { name: 'Bebas Neue', weight: '400' },
      { name: 'Anton', weight: '400' },
      { name: 'Oswald', weight: '700' },
      { name: 'Fjalla One', weight: '400' },
      { name: 'Bungee', weight: '400' },
      { name: 'Black Han Sans', weight: '400' },
    ]
  },
  {
    label: 'Condensed',
    fonts: [
      { name: 'Barlow Condensed', weight: '700' },
      { name: 'Roboto Condensed', weight: '700' },
      { name: 'DM Sans', weight: '800' },
      { name: 'Kanit', weight: '700' },
      { name: 'Exo 2', weight: '800' },
    ]
  },
  {
    label: 'Modern Clean',
    fonts: [
      { name: 'Montserrat', weight: '800' },
      { name: 'Raleway', weight: '800' },
      { name: 'Poppins', weight: '800' },
      { name: 'Nunito', weight: '900' },
      { name: 'Manrope', weight: '800' },
    ]
  },
  {
    label: 'Elegant / Serif',
    fonts: [
      { name: 'Playfair Display', weight: '900' },
      { name: 'Cormorant Garamond', weight: '700' },
      { name: 'Cinzel', weight: '700' },
      { name: 'IM Fell English', weight: '400' },
      { name: 'Libre Baskerville', weight: '700' },
    ]
  },
  {
    label: 'Script',
    fonts: [
      { name: 'Pacifico', weight: '400' },
      { name: 'Dancing Script', weight: '700' },
      { name: 'Sacramento', weight: '400' },
      { name: 'Great Vibes', weight: '400' },
      { name: 'Satisfy', weight: '400' },
    ]
  },
]
const ALL_FONTS = FONT_GROUPS.flatMap(g => g.fonts)

// ─── Constants ────────────────────────────────────────────────────────────────
const GENRES = [
  { key: 'techno',     label: 'Techno',       desc: 'Dark, industrial, Berlin' },
  { key: 'tech_house', label: 'Tech House',    desc: 'Moody warehouse, amber' },
  { key: 'deep_house', label: 'Deep House',    desc: 'Intimate, jazz-club vibes' },
  { key: 'house',      label: 'House',         desc: 'Soulful, colorful, joyful' },
  { key: 'dnb',        label: 'Drum & Bass',   desc: 'Urban, kinetic, neon' },
  { key: 'trance',     label: 'Trance',        desc: 'Cosmic, ethereal, celestial' },
  { key: 'edm',        label: 'EDM / Festival',desc: 'Epic, massive, stadium' },
  { key: 'afrobeats',  label: 'Afrobeats',     desc: 'Vibrant, golden, Lagos' },
  { key: 'hiphop',     label: 'Hip-Hop',       desc: 'Urban, editorial, cultural' },
  { key: 'reggaeton',  label: 'Reggaeton',     desc: 'Miami neon, tropical night' },
  { key: 'amapiano',   label: 'Amapiano',      desc: 'South African golden energy' },
  { key: 'dubstep',    label: 'Dubstep',       desc: 'Heavy, glitch, dark' },
  { key: 'lofi',       label: 'Lo-Fi',         desc: 'Nostalgic, soft, grainy' },
  { key: 'disco',      label: 'Disco',         desc: 'Glitter, 70s, Studio 54' },
  { key: 'ambient',    label: 'Ambient',       desc: 'Minimal, vast, ethereal' },
]

const VIBES = [
  { key: 'tropical',    label: 'Tropical',       emoji: '🌴' },
  { key: 'underground', label: 'Underground',     emoji: '🖤' },
  { key: 'neon',        label: 'Neon / Cyber',   emoji: '💜' },
  { key: 'golden',      label: 'Golden Hour',     emoji: '✨' },
  { key: 'festival',    label: 'Festival',        emoji: '🎪' },
  { key: 'editorial',   label: 'Editorial',       emoji: '◻️' },
]
const LOGO_POSITIONS: { key: LogoPos; label: string }[] = [
  { key: 'tl', label: '↖' }, { key: 'tc', label: '↑' }, { key: 'tr', label: '↗' },
  { key: 'bl', label: '↙' }, { key: 'br', label: '↘' },
]
const STEPS = ['Details', 'Photo', 'Style', 'Brand Kit', 'Generate']

// ─── Font loader ──────────────────────────────────────────────────────────────
async function loadGoogleFont(fontName: string) {
  if (fontName === 'custom' || !fontName) return
  try {
    const loaded = document.fonts.check(`900 16px "${fontName}"`)
    if (loaded) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName).replace(/%20/g, '+')}:wght@400;700;900&display=swap`
    document.head.appendChild(link)
    await document.fonts.ready
    await document.fonts.load(`900 16px "${fontName}"`)
  } catch { /* fallback to system font */ }
}

// ─── Canvas compositor ────────────────────────────────────────────────────────
function logoXY(pos: LogoPos, w: number, h: number, size: number, pad: number) {
  const positions: Record<LogoPos, [number, number]> = {
    tl: [pad, pad],
    tc: [(w - size) / 2, pad],
    tr: [w - size - pad, pad],
    bl: [pad, h - size - pad],
    br: [w - size - pad, h - size - pad],
  }
  return positions[pos]
}

async function compositeFlyer({
  bgUrl, photoUrl, details, style, brand, width, height
}: {
  bgUrl: string
  photoUrl: string | null
  details: EventDetails
  style: StyleConfig
  brand: BrandKit
  width: number
  height: number
}): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  const loadImg = (src: string): Promise<HTMLImageElement> =>
    new Promise((res, rej) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => res(img)
      img.onerror = rej
      img.src = src
    })

  const ff = brand.fontFamily && brand.fontFamily !== 'custom'
    ? `"${brand.fontFamily}", sans-serif`
    : '"Helvetica Neue", Arial, sans-serif'
  const te = style.textEffects

  // Layer 1: Background
  try {
    const bgImg = await loadImg(bgUrl)
    const scale = Math.max(width / bgImg.width, height / bgImg.height)
    const bw = bgImg.width * scale, bh = bgImg.height * scale
    ctx.drawImage(bgImg, (width - bw) / 2, (height - bh) / 2, bw, bh)
  } catch {
    const g = ctx.createLinearGradient(0, 0, width, height)
    g.addColorStop(0, '#1a0533'); g.addColorStop(1, '#0f0f1a')
    ctx.fillStyle = g; ctx.fillRect(0, 0, width, height)
  }

  // Layer 2: Custom overlay
  ctx.fillStyle = brand.colors.overlay
  ctx.globalAlpha = brand.colors.overlayOpacity
  ctx.fillRect(0, 0, width, height)
  ctx.globalAlpha = 1

  // Layer 3: Mood gradient
  const moodGrad = ctx.createLinearGradient(0, 0, 0, height)
  moodGrad.addColorStop(0, 'rgba(0,0,0,0.3)')
  moodGrad.addColorStop(0.5, 'rgba(0,0,0,0.05)')
  moodGrad.addColorStop(1, 'rgba(0,0,0,0.75)')
  ctx.fillStyle = moodGrad; ctx.fillRect(0, 0, width, height)

  // Layer 4: DJ Photo
  if (photoUrl) {
    try {
      const photo = await loadImg(photoUrl)
      const photoH = height * 0.73
      const photoW = (photo.width / photo.height) * photoH
      const px = (width - photoW) / 2
      const py = height - photoH - height * 0.05

      // Glow
      ctx.save(); ctx.globalAlpha = 0.2; ctx.filter = 'blur(40px)'
      ctx.drawImage(photo, px - 30, py - 30, photoW + 60, photoH + 60)
      ctx.filter = 'none'; ctx.globalAlpha = 1; ctx.restore()

      ctx.drawImage(photo, px, py, photoW, photoH)

      // Bottom fade
      const fade = ctx.createLinearGradient(0, py + photoH * 0.58, 0, py + photoH)
      fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,0.88)')
      ctx.fillStyle = fade; ctx.fillRect(px - 20, py + photoH * 0.58, photoW + 40, photoH * 0.42 + 20)
    } catch { /* skip */ }
  }

  // Layer 4b: Artist logo (if no photo or as overlay)
  if (brand.artistLogoUrl) {
    try {
      const logo = await loadImg(brand.artistLogoUrl)
      const size = (width * brand.artistLogoSize) / 100
      const [lx, ly] = logoXY(brand.artistLogoPos, width, height, size, width * 0.05)
      ctx.drawImage(logo, lx, ly, size, (logo.height / logo.width) * size)
    } catch { /* skip */ }
  }

  // Layer 5: Vignette
  const vig = ctx.createRadialGradient(width/2, height/2, height*0.25, width/2, height/2, height*0.85)
  vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.5)')
  ctx.fillStyle = vig; ctx.fillRect(0, 0, width, height)

  // Layer 6: Text gradient
  const tg = ctx.createLinearGradient(0, height * 0.6, 0, height)
  tg.addColorStop(0, 'rgba(0,0,0,0)'); tg.addColorStop(0.4, 'rgba(0,0,0,0.55)'); tg.addColorStop(1, 'rgba(0,0,0,0.92)')
  ctx.fillStyle = tg; ctx.fillRect(0, height * 0.6, width, height * 0.4)

  // Layer 7: Accent line
  const al = ctx.createLinearGradient(0, 0, width, 0)
  al.addColorStop(0, 'rgba(0,0,0,0)'); al.addColorStop(0.5, brand.colors.date); al.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = al; ctx.fillRect(0, height - 4, width, 4)

  // Layer 8: Typography
  const pad = width * 0.07

  // Venue name
  ctx.save()
  ctx.font = `600 ${Math.round(width * 0.033)}px ${ff}`
  ctx.fillStyle = brand.colors.venueName
  ctx.globalAlpha = 0.8; ctx.textAlign = 'center'
  ctx.fillText((details.venueName || 'VENUE NAME').toUpperCase(), width / 2, height * 0.052)
  ctx.restore()

  // Artist name — auto-size + text effects
  let artistFontSize = Math.round(width * (style.artistSize / 100))
  ctx.save()
  ctx.font = `900 ${artistFontSize}px ${ff}`
  ctx.textAlign = 'center'
  const artistRaw = details.artistName || 'ARTIST NAME'
  const artistText = te.allCaps ? artistRaw.toUpperCase() : artistRaw
  while (ctx.measureText(artistText).width > width - pad * 2 && artistFontSize > 28) {
    artistFontSize -= 2
    ctx.font = `900 ${artistFontSize}px ${ff}`
  }
  // Letter spacing (approximate via character spacing)
  const aX = width / 2
  const aY = height * 0.815

  // Glow effect
  if (te.glow) {
    ctx.save()
    ctx.shadowColor = brand.colors.artistName
    ctx.shadowBlur = 30
    ctx.globalAlpha = 0.5
    ctx.fillStyle = brand.colors.artistName
    ctx.fillText(artistText, aX, aY)
    ctx.restore()
  }

  // Gradient text
  if (te.gradient) {
    const tw = ctx.measureText(artistText).width
    const grad = ctx.createLinearGradient(aX - tw/2, 0, aX + tw/2, 0)
    grad.addColorStop(0, brand.colors.artistName)
    grad.addColorStop(1, te.gradientColor2)
    ctx.fillStyle = grad
  } else {
    ctx.fillStyle = brand.colors.artistName
  }

  ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 20

  // Outline
  if (te.outline) {
    ctx.strokeStyle = te.outlineColor
    ctx.lineWidth = te.outlineWidth * (width / 1080)
    ctx.lineJoin = 'round'
    ctx.strokeText(artistText, aX, aY)
  }

  ctx.fillText(artistText, aX, aY)
  ctx.shadowBlur = 0; ctx.restore()

  // Date
  if (details.date) {
    const dateStr = new Date(details.date + 'T12:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    }).toUpperCase()
    const line = details.time ? `${dateStr}  ·  ${details.time.toUpperCase()}` : dateStr
    ctx.save()
    ctx.font = `700 ${Math.round(width * 0.037)}px ${ff}`
    ctx.textAlign = 'center'; ctx.fillStyle = brand.colors.date
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10
    ctx.fillText(line, width / 2, height * 0.868)
    ctx.shadowBlur = 0; ctx.restore()
  }

  // Supporting artists
  const supporting = details.supportingArtists.trim()
    ? details.supportingArtists.split(',').map(s => s.trim()).filter(Boolean) : []
  if (supporting.length > 0) {
    ctx.save()
    ctx.font = `500 ${Math.round(width * 0.027)}px ${ff}`
    ctx.textAlign = 'center'; ctx.fillStyle = brand.colors.supporting; ctx.globalAlpha = 0.75
    ctx.fillText(supporting.join('  ·  '), width / 2, height * 0.909)
    ctx.restore()
  }

  // Ticket link
  if (details.ticketLink) {
    ctx.save()
    ctx.font = `400 ${Math.round(width * 0.021)}px ${ff}`
    ctx.textAlign = 'center'; ctx.fillStyle = brand.colors.supporting; ctx.globalAlpha = 0.4
    ctx.fillText(details.ticketLink.replace(/^https?:\/\//i, ''), width / 2, height * 0.945)
    ctx.restore()
  }

  // Layer 9: Venue logo
  if (brand.venueLogoUrl) {
    try {
      const logo = await loadImg(brand.venueLogoUrl)
      const size = (width * brand.venueLogoSize) / 100
      const [lx, ly] = logoXY(brand.venueLogoPos, width, height, size, width * 0.05)
      ctx.drawImage(logo, lx, ly, size, (logo.height / logo.width) * size)
    } catch { /* skip */ }
  }

  // Layer 10: Film grain
  const imgData = ctx.getImageData(0, 0, width, height)
  const d = imgData.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 16
    d[i] = Math.min(255, Math.max(0, d[i] + n))
    d[i+1] = Math.min(255, Math.max(0, d[i+1] + n))
    d[i+2] = Math.min(255, Math.max(0, d[i+2] + n))
  }
  ctx.putImageData(imgData, 0, 0)

  return canvas.toDataURL('image/jpeg', 0.95)
}

// ─── Shared input styles ──────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 13px', borderRadius: '9px',
  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
  color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box'
}
const lbl: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: '#9CA3AF',
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px', display: 'block'
}

// ─── Logo uploader sub-component ─────────────────────────────────────────────
function LogoUploader({
  label, url, pos, size,
  onUpload, onPos, onSize, onClear
}: {
  label: string
  url: string | null
  pos: LogoPos
  size: number
  onUpload: (f: File) => void
  onPos: (p: LogoPos) => void
  onSize: (s: number) => void
  onClear: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600 }}>{label}</span>
        {url
          ? <button onClick={onClear} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '11px' }}>Remove</button>
          : <button onClick={() => ref.current?.click()}
              style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', border: 'none',
                cursor: 'pointer', color: 'white', background: 'rgba(124,58,237,0.6)' }}>Upload PNG</button>
        }
        <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} />
      </div>
      {url && (
        <>
          <img src={url} alt={label} style={{ width: '100%', maxHeight: 60, objectFit: 'contain', marginBottom: '10px',
            background: 'repeating-conic-gradient(#1a1a1a 0% 25%,#111 0% 50%) 0 0/12px 12px', borderRadius: '6px' }} />
          <div style={{ marginBottom: '8px' }}>
            <div style={{ ...lbl, marginBottom: '6px' }}>Position</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '4px' }}>
              {LOGO_POSITIONS.map(p => (
                <button key={p.key} onClick={() => onPos(p.key)}
                  style={{ padding: '6px', borderRadius: '6px', border: pos === p.key ? '1px solid rgba(196,160,255,0.5)' : '1px solid rgba(255,255,255,0.06)',
                    background: pos === p.key ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer', color: pos === p.key ? '#C4A0FF' : '#555', fontSize: '14px' }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ ...lbl }}>Size — {size}%</div>
            <input type="range" min={8} max={50} value={size} onChange={e => onSize(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#7C3AED' }} />
          </div>
        </>
      )}
    </div>
  )
}

// ─── Color row ────────────────────────────────────────────────────────────────
function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: 30, height: 30, borderRadius: '6px', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>{label}</div>
        <input value={value} onChange={e => onChange(e.target.value)}
          style={{ ...inp, padding: '5px 10px', fontSize: '12px' }} />
      </div>
    </div>
  )
}

// ─── Font picker ──────────────────────────────────────────────────────────────
function FontPicker({ value, onChange }: { value: string; onChange: (f: string) => void }) {
  const [loaded, setLoaded] = useState<Set<string>>(new Set())
  const [activeGroup, setActiveGroup] = useState(0)

  const preloadFont = async (fontName: string) => {
    if (loaded.has(fontName)) return
    await loadGoogleFont(fontName)
    setLoaded(prev => new Set([...prev, fontName]))
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {FONT_GROUPS.map((g, i) => (
          <button key={g.label} onClick={() => setActiveGroup(i)}
            style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              border: activeGroup === i ? '1px solid rgba(196,160,255,0.4)' : '1px solid rgba(255,255,255,0.07)',
              background: activeGroup === i ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
              color: activeGroup === i ? '#C4A0FF' : '#6B7280' }}>
            {g.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: 200, overflowY: 'auto' }}>
        {FONT_GROUPS[activeGroup].fonts.map(f => (
          <button key={f.name}
            onMouseEnter={() => preloadFont(f.name)}
            onClick={() => { preloadFont(f.name); onChange(f.name) }}
            style={{ padding: '10px 14px', borderRadius: '8px', border: value === f.name ? '1px solid rgba(196,160,255,0.45)' : '1px solid rgba(255,255,255,0.06)',
              background: value === f.name ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.02)',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
            <span style={{ fontFamily: loaded.has(f.name) ? `"${f.name}", sans-serif` : 'sans-serif',
              fontSize: '16px', fontWeight: f.weight as React.CSSProperties['fontWeight'],
              color: value === f.name ? '#C4A0FF' : 'white' }}>
              {f.name}
            </span>
            {value === f.name && <span style={{ float: 'right', fontSize: '11px', color: '#7C3AED' }}>✓ Selected</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreatePage() {
  const [step, setStep] = useState(0)
  const [details, setDetails] = useState<EventDetails>({
    artistName: '', date: '', time: '', venueName: '', supportingArtists: '', ticketLink: ''
  })
  const [style, setStyle] = useState<StyleConfig>({
    bgType: 'photo', vibe: 'underground', genre: 'techno', artistSize: 14,
    textEffects: {
      outline: false, outlineColor: '#000000', outlineWidth: 2,
      gradient: false, gradientColor2: '#FF3B80',
      letterSpacing: 2, glow: false, allCaps: true,
    }
  })
  const [brand, setBrand] = useState<BrandKit>({
    colors: {
      artistName: '#FFFFFF', venueName: '#FFFFFF',
      date: '#FFD700', supporting: '#FFFFFF', overlay: '#000000', overlayOpacity: 0
    },
    fontFamily: 'Bebas Neue',
    customFontName: null,
    venueLogoUrl: null, venueLogoPos: 'tr', venueLogoSize: 20,
    artistLogoUrl: null, artistLogoPos: 'tl', artistLogoSize: 18,
  })

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [bgRemovedUrl, setBgRemovedUrl] = useState<string | null>(null)
  const [removingBg, setRemovingBg] = useState(false)

  const [flyerFile, setFlyerFile] = useState<File | null>(null)
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null)
  const [analyzingFlyer, setAnalyzingFlyer] = useState(false)
  const [flyerAnalyzed, setFlyerAnalyzed] = useState(false)
  const [flyerStyleNotes, setFlyerStyleNotes] = useState<string | null>(null)
  const [customBgPrompt, setCustomBgPrompt] = useState<string | null>(null)

  const [generating, setGenerating] = useState(false)
  const [variations, setVariations] = useState<{ story: string; feed: string }[]>([])
  const [selectedVar, setSelectedVar] = useState(0)
  const [storyDataUrl, setStoryDataUrl] = useState<string | null>(null)
  const [feedDataUrl, setFeedDataUrl] = useState<string | null>(null)
  const [genError, setGenError] = useState<string | null>(null)
  const [genProgress, setGenProgress] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const flyerInputRef = useRef<HTMLInputElement>(null)
  const customFontRef = useRef<HTMLInputElement>(null)

  // Preload default font
  useEffect(() => { loadGoogleFont('Bebas Neue') }, [])

  // ── Photo ────────────────────────────────────────────────────────────────────
  const handlePhotoUpload = useCallback((file: File) => {
    setPhotoFile(file); setBgRemovedUrl(null); setPhotoUrl(URL.createObjectURL(file))
  }, [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('image/')) handlePhotoUpload(f)
  }, [handlePhotoUpload])
  const removeBackground = useCallback(async () => {
    if (!photoFile) return
    setRemovingBg(true)
    try {
      const { removeBackground: removeBg } = await import('@imgly/background-removal')
      const blob = await removeBg(photoFile, {
        publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/',
        progress: () => {}, output: { format: 'image/png', quality: 0.95 }
      })
      const url = URL.createObjectURL(blob)
      setBgRemovedUrl(url); setPhotoUrl(url)
    } catch { alert('Background removal failed — try a pre-cut PNG.') }
    setRemovingBg(false)
  }, [photoFile])

  // ── Custom font ──────────────────────────────────────────────────────────────
  const handleCustomFont = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file)
    const name = file.name.replace(/\.[^.]+$/, '')
    const ff = new FontFace(name, `url(${url})`)
    await ff.load()
    document.fonts.add(ff)
    setBrand(p => ({ ...p, fontFamily: 'custom', customFontName: name }))
  }, [])

  // ── Flyer analysis ───────────────────────────────────────────────────────────
  const analyzeFlyer = useCallback(async (file: File) => {
    setAnalyzingFlyer(true); setFlyerAnalyzed(false)
    try {
      const fd = new FormData(); fd.append('flyer', file)
      const res = await fetch('/api/analyze-flyer', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setStyle(p => ({
        ...p,
        bgType: data.bgType || p.bgType,
        vibe:   data.vibe   || p.vibe,
      }))
      setBrand(p => ({
        ...p,
        colors: {
          ...p.colors,
          date:       data.accentColor  || p.colors.date,
          artistName: data.textColor    || p.colors.artistName,
          venueName:  data.textColor    || p.colors.venueName,
          supporting: data.textColor    || p.colors.supporting,
        },
        fontStyle: data.fontStyle || p.fontFamily,
      }))
      if (data.backgroundPrompt) setCustomBgPrompt(data.backgroundPrompt)
      if (data.styleNotes) setFlyerStyleNotes(data.styleNotes)
      setFlyerAnalyzed(true)
    } catch { alert('Could not analyze flyer — set style manually.') }
    setAnalyzingFlyer(false)
  }, [])

  const handleFlyerUpload = useCallback((file: File) => {
    setFlyerFile(file); setFlyerPreview(URL.createObjectURL(file)); analyzeFlyer(file)
  }, [analyzeFlyer])

  // ── Logo helpers ─────────────────────────────────────────────────────────────
  const handleLogoUpload = (field: 'venueLogoUrl' | 'artistLogoUrl') => (file: File) => {
    setBrand(p => ({ ...p, [field]: URL.createObjectURL(file) }))
  }

  // ── Generation ───────────────────────────────────────────────────────────────
  const generate = useCallback(async () => {
    setGenerating(true); setGenError(null); setVariations([]); setSelectedVar(0)
    try {
      await loadGoogleFont(brand.fontFamily)
      const activePhoto = bgRemovedUrl || photoUrl
      const bgParams = { bgType: style.bgType, vibe: style.vibe, genre: style.genre, customPrompt: customBgPrompt }

      // Generate 3 background variations in parallel (story format)
      setGenProgress('Generating 3 background variations…')
      const bgReqs = await Promise.all([1,2,3].map(() =>
        fetch('/api/generate-background', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...bgParams, format: 'story' })
        })
      ))
      const bgBlobs = await Promise.all(bgReqs.map(r => r.blob()))
      const bgUrls = bgBlobs.map(b => URL.createObjectURL(b))

      setGenProgress('Compositing flyers…')
      // Composite story + feed for each variation
      const vars = await Promise.all(bgUrls.map(async (bgUrl) => {
        const [feedBgRes] = await Promise.all([
          fetch('/api/generate-background', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...bgParams, format: 'feed' })
          })
        ])
        const feedBlob = await feedBgRes.blob()
        const feedBgUrl = URL.createObjectURL(feedBlob)
        const [story, feed] = await Promise.all([
          compositeFlyer({ bgUrl, photoUrl: activePhoto, details, style, brand, width: 1080, height: 1920 }),
          compositeFlyer({ bgUrl: feedBgUrl, photoUrl: activePhoto, details, style, brand, width: 1080, height: 1350 }),
        ])
        return { story, feed }
      }))

      setVariations(vars)
      setStoryDataUrl(vars[0].story)
      setFeedDataUrl(vars[0].feed)
      setSelectedVar(0)
      setStep(4)
    } catch (e) {
      console.error(e); setGenError('Generation failed. Please try again.')
    }
    setGenProgress('')
    setGenerating(false)
  }, [style, details, brand, photoUrl, bgRemovedUrl, customBgPrompt])

  const download = (dataUrl: string, label: string) => {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `lyve-${(details.artistName || 'flyer').replace(/\s+/g, '-').toLowerCase()}-${label}.jpg`
    a.click()
  }

  const canProceed = [
    !!(details.artistName && details.date && details.venueName),
    true, true, true, true
  ][step]

  const activeFontName = brand.fontFamily === 'custom' ? brand.customFontName : brand.fontFamily

  return (
    <div style={{ maxWidth: 980 }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wand2 size={20} color="#C4A0FF" /> AI Content Creator
        </h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px' }}>AI-generated event flyers — fully customizable, Story &amp; Feed ready.</p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', alignItems: 'center', flexWrap: 'wrap' }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: i < step ? 'pointer' : 'default' }}
              onClick={() => i < step && setStep(i)}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 700,
                background: i < step ? 'rgba(124,58,237,0.8)' : i === step ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.05)',
                border: i === step ? '1px solid rgba(196,160,255,0.4)' : '1px solid transparent',
                color: i <= step ? '#C4A0FF' : '#444' }}>
                {i < step ? <Check size={10} /> : i + 1}
              </div>
              <span style={{ fontSize: '12px', color: i === step ? '#C4A0FF' : i < step ? '#9CA3AF' : '#444', fontWeight: i === step ? 600 : 400 }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ width: 16, height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 1px' }} />}
          </div>
        ))}
      </div>

      {/* ── Step 0: Details ───────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="card" style={{ maxWidth: 540 }}>
          <h2 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '18px' }}>Event Details</h2>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label style={lbl}>Artist / Headliner *</label>
              <input style={inp} placeholder="e.g. Chris Lorenzo" value={details.artistName}
                onChange={e => setDetails(p => ({ ...p, artistName: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lbl}>Date *</label>
                <input style={inp} type="date" value={details.date}
                  onChange={e => setDetails(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Time / Doors</label>
                <input style={inp} placeholder="e.g. 10 PM" value={details.time}
                  onChange={e => setDetails(p => ({ ...p, time: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={lbl}>Venue Name *</label>
              <input style={inp} placeholder="e.g. Palm Tree Club Miami" value={details.venueName}
                onChange={e => setDetails(p => ({ ...p, venueName: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Supporting Artists <span style={{ textTransform: 'none', fontWeight: 400, color: '#555' }}>(comma separated)</span></label>
              <input style={inp} placeholder="e.g. Solardo, Rebüke" value={details.supportingArtists}
                onChange={e => setDetails(p => ({ ...p, supportingArtists: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Ticket / Info Link</label>
              <input style={inp} placeholder="https://ra.co/..." value={details.ticketLink}
                onChange={e => setDetails(p => ({ ...p, ticketLink: e.target.value }))} />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Photo ─────────────────────────────────────────────────── */}
      {step === 1 && (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div className="card" style={{ maxWidth: 440, flex: 1 }}>
            <h2 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>Artist Photo</h2>
            <p style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '18px' }}>
              Upload a photo — remove the background automatically, or use a pre-cut PNG.
            </p>
            <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              style={{ border: '2px dashed rgba(124,58,237,0.22)', borderRadius: '12px', padding: '28px',
                textAlign: 'center', cursor: 'pointer', marginBottom: '14px', background: 'rgba(124,58,237,0.03)' }}>
              <Upload size={26} color="#7C3AED" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '3px' }}>Drop photo or click to upload</div>
              <div style={{ fontSize: '12px', color: '#555' }}>JPG, PNG, WEBP</div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])} />
            </div>
            {photoFile && !bgRemovedUrl && (
              <button onClick={removeBackground} disabled={removingBg}
                style={{ width: '100%', padding: '11px', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
                  border: 'none', cursor: removingBg ? 'wait' : 'pointer', color: 'white', marginBottom: '10px',
                  background: removingBg ? 'rgba(124,58,237,0.35)' : 'linear-gradient(135deg,#7C3AED,#C4A0FF)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {removingBg ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Removing…</> : <><Wand2 size={14} /> Remove Background</>}
              </button>
            )}
            {bgRemovedUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px',
                background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.22)', marginBottom: '10px' }}>
                <Check size={13} color="#34d399" />
                <span style={{ fontSize: '13px', color: '#34d399', fontWeight: 600 }}>Background removed</span>
                <button onClick={() => { setPhotoUrl(URL.createObjectURL(photoFile!)); setBgRemovedUrl(null) }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '12px' }}>Undo</button>
              </div>
            )}
            {photoFile && (
              <button onClick={() => { setPhotoFile(null); setPhotoUrl(null); setBgRemovedUrl(null) }}
                style={{ width: '100%', padding: '9px', borderRadius: '10px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.07)',
                  cursor: 'pointer', color: '#555', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <X size={12} /> Remove photo
              </button>
            )}
            {!photoFile && <p style={{ fontSize: '12px', color: '#555', textAlign: 'center' }}>Optional — skip for art/logo-only flyers.</p>}
          </div>
          {photoUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: 1 }}>Preview</div>
              <img src={photoUrl} alt="preview" style={{ width: 150, height: 190, objectFit: 'contain', borderRadius: '10px',
                background: 'repeating-conic-gradient(#1a1a1a 0% 25%,#111 0% 50%) 0 0/16px 16px' }} />
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: AI Style ──────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="card" style={{ maxWidth: 620 }}>
          <h2 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>AI Background Style</h2>
          <p style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '20px' }}>
            Upload a past flyer to auto-match your brand, or set the vibe manually.
          </p>

          {/* Match existing flyer */}
          <div style={{ marginBottom: '22px', padding: '14px 16px', borderRadius: '12px',
            background: flyerAnalyzed ? 'rgba(52,211,153,0.06)' : 'rgba(196,160,255,0.05)',
            border: flyerAnalyzed ? '1px solid rgba(52,211,153,0.22)' : '1px solid rgba(196,160,255,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {flyerPreview
                ? <img src={flyerPreview} alt="ref" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                : <div style={{ width: 48, height: 48, borderRadius: '6px', background: 'rgba(196,160,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px' }}>🎨</div>
              }
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: flyerAnalyzed ? '#34d399' : 'white', marginBottom: '2px' }}>
                  {flyerAnalyzed ? '✓ Brand matched' : 'Match my brand'}
                </div>
                <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>
                  {flyerStyleNotes || 'Upload a past flyer — AI extracts your colors, vibe & style.'}
                </p>
              </div>
              {analyzingFlyer
                ? <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#C4A0FF', flexShrink: 0 }}>
                    <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing…
                  </div>
                : <button onClick={() => flyerInputRef.current?.click()}
                    style={{ padding: '7px 14px', borderRadius: '7px', fontWeight: 600, fontSize: '12px', border: 'none',
                      cursor: 'pointer', color: 'white', flexShrink: 0,
                      background: flyerAnalyzed ? 'rgba(52,211,153,0.2)' : 'linear-gradient(135deg,#7C3AED,#C4A0FF)' }}>
                    {flyerAnalyzed ? 'Change' : 'Upload Flyer'}
                  </button>
              }
              <input ref={flyerInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleFlyerUpload(e.target.files[0])} />
            </div>
          </div>

          {/* Genre selector */}
          <div style={{ marginBottom: '22px' }}>
            <label style={lbl}>Music Genre <span style={{ textTransform: 'none', fontWeight: 400, color: '#555' }}>— drives the visual DNA</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px' }}>
              {GENRES.map(g => (
                <button key={g.key} onClick={() => setStyle(p => ({ ...p, genre: g.key }))}
                  style={{ padding: '10px 8px', borderRadius: '9px', cursor: 'pointer', textAlign: 'left',
                    border: style.genre === g.key ? '1px solid rgba(196,160,255,0.5)' : '1px solid rgba(255,255,255,0.07)',
                    background: style.genre === g.key ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.03)',
                    transition: 'all 0.15s' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: style.genre === g.key ? '#C4A0FF' : '#D1D5DB', marginBottom: '2px' }}>{g.label}</div>
                  <div style={{ fontSize: '10px', color: '#555', lineHeight: 1.3 }}>{g.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* BG type */}
          <div style={{ marginBottom: '20px' }}>
            <label style={lbl}>Background Type</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[['photo','📷','Photographic'],['illustrative','🎨','Illustrative']].map(([k, e, l]) => (
                <button key={k} onClick={() => setStyle(p => ({ ...p, bgType: k as StyleConfig['bgType'] }))}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                    border: style.bgType === k ? '1px solid rgba(196,160,255,0.45)' : '1px solid rgba(255,255,255,0.07)',
                    background: style.bgType === k ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>{e}</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: style.bgType === k ? '#C4A0FF' : '#9CA3AF' }}>{l}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Vibe */}
          <div style={{ marginBottom: '20px' }}>
            <label style={lbl}>Vibe</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
              {VIBES.map(v => (
                <button key={v.key} onClick={() => setStyle(p => ({ ...p, vibe: v.key }))}
                  style={{ padding: '10px', borderRadius: '9px', cursor: 'pointer', textAlign: 'center',
                    border: style.vibe === v.key ? '1px solid rgba(196,160,255,0.45)' : '1px solid rgba(255,255,255,0.07)',
                    background: style.vibe === v.key ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: '16px', marginBottom: '3px' }}>{v.emoji}</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: style.vibe === v.key ? '#C4A0FF' : '#9CA3AF' }}>{v.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Artist size */}
          <div>
            <label style={lbl}>Artist Name Size — {style.artistSize}%</label>
            <input type="range" min={8} max={20} value={style.artistSize}
              onChange={e => setStyle(p => ({ ...p, artistSize: Number(e.target.value) }))}
              style={{ width: '100%', accentColor: '#7C3AED' }} />
          </div>
        </div>
      )}

      {/* ── Step 3: Brand Kit ─────────────────────────────────────────────── */}
      {step === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: 820 }}>

          {/* Colors */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Palette size={15} color="#C4A0FF" />
              <h3 style={{ fontWeight: 700, fontSize: '14px' }}>Brand Colors</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <ColorRow label="Artist Name" value={brand.colors.artistName}
                onChange={v => setBrand(p => ({ ...p, colors: { ...p.colors, artistName: v } }))} />
              <ColorRow label="Venue Name" value={brand.colors.venueName}
                onChange={v => setBrand(p => ({ ...p, colors: { ...p.colors, venueName: v } }))} />
              <ColorRow label="Date / Accent" value={brand.colors.date}
                onChange={v => setBrand(p => ({ ...p, colors: { ...p.colors, date: v } }))} />
              <ColorRow label="Supporting Artists" value={brand.colors.supporting}
                onChange={v => setBrand(p => ({ ...p, colors: { ...p.colors, supporting: v } }))} />
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
              <ColorRow label="Color Overlay" value={brand.colors.overlay}
                onChange={v => setBrand(p => ({ ...p, colors: { ...p.colors, overlay: v } }))} />
              <div>
                <div style={{ ...lbl }}>Overlay Opacity — {Math.round(brand.colors.overlayOpacity * 100)}%</div>
                <input type="range" min={0} max={0.7} step={0.01} value={brand.colors.overlayOpacity}
                  onChange={e => setBrand(p => ({ ...p, colors: { ...p.colors, overlayOpacity: Number(e.target.value) } }))}
                  style={{ width: '100%', accentColor: '#7C3AED' }} />
              </div>
            </div>
          </div>

          {/* Fonts */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Type size={15} color="#C4A0FF" />
              <h3 style={{ fontWeight: 700, fontSize: '14px' }}>Typography</h3>
            </div>
            {activeFontName && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(196,160,255,0.25)', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '4px' }}>Selected font</div>
                <div style={{ fontSize: '18px', fontFamily: `"${activeFontName}", sans-serif`, fontWeight: 900, color: '#C4A0FF' }}>
                  {activeFontName}
                </div>
              </div>
            )}
            <FontPicker value={brand.fontFamily} onChange={f => setBrand(p => ({ ...p, fontFamily: f, customFontName: null }))} />
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ ...lbl, marginBottom: '8px' }}>Or upload your font</div>
              <button onClick={() => customFontRef.current?.click()}
                style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.15)',
                  cursor: 'pointer', color: '#9CA3AF', background: 'transparent', fontSize: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Upload size={12} /> Upload TTF / OTF / WOFF
              </button>
              <input ref={customFontRef} type="file" accept=".ttf,.otf,.woff,.woff2" style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleCustomFont(e.target.files[0])} />
              {brand.customFontName && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#34d399' }}>
                  ✓ {brand.customFontName} loaded
                </div>
              )}
            </div>
          </div>

          {/* Logos */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ImageIcon size={15} color="#C4A0FF" />
              <h3 style={{ fontWeight: 700, fontSize: '14px' }}>Logos</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <LogoUploader
                label="Venue Logo" url={brand.venueLogoUrl} pos={brand.venueLogoPos} size={brand.venueLogoSize}
                onUpload={handleLogoUpload('venueLogoUrl')}
                onPos={p => setBrand(prev => ({ ...prev, venueLogoPos: p }))}
                onSize={s => setBrand(prev => ({ ...prev, venueLogoSize: s }))}
                onClear={() => setBrand(p => ({ ...p, venueLogoUrl: null }))}
              />
              <LogoUploader
                label="Artist Logo" url={brand.artistLogoUrl} pos={brand.artistLogoPos} size={brand.artistLogoSize}
                onUpload={handleLogoUpload('artistLogoUrl')}
                onPos={p => setBrand(prev => ({ ...prev, artistLogoPos: p }))}
                onSize={s => setBrand(prev => ({ ...prev, artistLogoSize: s }))}
                onClear={() => setBrand(p => ({ ...p, artistLogoUrl: null }))}
              />
            </div>
          </div>

          {/* Text effects */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Type size={15} color="#C4A0FF" />
              <h3 style={{ fontWeight: 700, fontSize: '14px' }}>Text Effects</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Toggles */}
              {[
                ['allCaps', 'ALL CAPS artist name'],
                ['outline', 'Text outline / stroke'],
                ['gradient', 'Gradient text (two-color)'],
                ['glow', 'Text glow / halo'],
              ].map(([key, label]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#D1D5DB' }}>{label}</span>
                  <button onClick={() => setStyle(p => ({ ...p, textEffects: { ...p.textEffects, [key]: !p.textEffects[key as keyof TextEffects] } }))}
                    style={{ width: 40, height: 22, borderRadius: '11px', border: 'none', cursor: 'pointer', position: 'relative',
                      background: style.textEffects[key as keyof TextEffects] ? '#7C3AED' : 'rgba(255,255,255,0.1)',
                      transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute',
                      top: 3, left: style.textEffects[key as keyof TextEffects] ? 21 : 3, transition: 'left 0.2s' }} />
                  </button>
                </div>
              ))}
              {/* Outline settings */}
              {style.textEffects.outline && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                  <div>
                    <div style={{ ...lbl }}>Outline Color</div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input type="color" value={style.textEffects.outlineColor}
                        onChange={e => setStyle(p => ({ ...p, textEffects: { ...p.textEffects, outlineColor: e.target.value } }))}
                        style={{ width: 28, height: 28, borderRadius: '6px', border: 'none', cursor: 'pointer', padding: 0 }} />
                      <input value={style.textEffects.outlineColor}
                        onChange={e => setStyle(p => ({ ...p, textEffects: { ...p.textEffects, outlineColor: e.target.value } }))}
                        style={{ ...inp, flex: 1, padding: '5px 8px', fontSize: '11px' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ ...lbl }}>Width — {style.textEffects.outlineWidth}px</div>
                    <input type="range" min={1} max={8} value={style.textEffects.outlineWidth}
                      onChange={e => setStyle(p => ({ ...p, textEffects: { ...p.textEffects, outlineWidth: Number(e.target.value) } }))}
                      style={{ width: '100%', accentColor: '#7C3AED', marginTop: 6 }} />
                  </div>
                </div>
              )}
              {/* Gradient color 2 */}
              {style.textEffects.gradient && (
                <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                  <ColorRow label="Gradient end color" value={style.textEffects.gradientColor2}
                    onChange={v => setStyle(p => ({ ...p, textEffects: { ...p.textEffects, gradientColor2: v } }))} />
                </div>
              )}
              {/* Letter spacing */}
              <div>
                <div style={{ ...lbl }}>Letter Spacing — {style.textEffects.letterSpacing}px</div>
                <input type="range" min={-5} max={30} value={style.textEffects.letterSpacing}
                  onChange={e => setStyle(p => ({ ...p, textEffects: { ...p.textEffects, letterSpacing: Number(e.target.value) } }))}
                  style={{ width: '100%', accentColor: '#7C3AED' }} />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '14px' }}>Ready to Generate</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#9CA3AF' }}>
                <div>🎵 <strong style={{ color: 'white' }}>{GENRES.find(g => g.key === style.genre)?.label}</strong> · {style.bgType === 'photo' ? 'Photo' : 'Illustrative'} · {VIBES.find(v => v.key === style.vibe)?.label}</div>
                <div>🔤 <strong style={{ color: 'white' }}>{activeFontName || 'Default'}</strong>{style.textEffects.outline ? ' + Outline' : ''}{style.textEffects.gradient ? ' + Gradient' : ''}{style.textEffects.glow ? ' + Glow' : ''}</div>
                <div>🎨 Accent: <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: brand.colors.date, verticalAlign: 'middle', marginRight: 4 }} /><strong style={{ color: 'white' }}>{brand.colors.date}</strong></div>
                {flyerAnalyzed && <div>✓ <strong style={{ color: '#34d399' }}>Brand matched from uploaded flyer</strong></div>}
                {brand.venueLogoUrl && <div>🏢 Venue logo added</div>}
                {brand.artistLogoUrl && <div>🎧 Artist logo added</div>}
                {(bgRemovedUrl || photoUrl) && <div>📸 Artist photo ready</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Results ───────────────────────────────────────────────── */}
      {step === 4 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '3px' }}>Your Flyers</h2>
              <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Download both formats or regenerate for a fresh variation.</p>
            </div>
            <button onClick={generate} disabled={generating}
              style={{ padding: '9px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '13px',
                border: '1px solid rgba(255,255,255,0.1)', cursor: generating ? 'wait' : 'pointer',
                color: '#9CA3AF', background: 'transparent', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={12} style={generating ? { animation: 'spin 1s linear infinite' } : {}} />
              Regenerate
            </button>
          </div>

          {generating && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '14px' }}>
              <Loader2 size={32} color="#C4A0FF" style={{ animation: 'spin 1s linear infinite' }} />
              <div style={{ color: '#9CA3AF', fontSize: '14px' }}>{genProgress || 'Generating your flyers…'}</div>
              <div style={{ color: '#555', fontSize: '12px' }}>Creating 3 unique variations — ~30–60 seconds</div>
            </div>
          )}
          {!generating && genError && (
            <div style={{ padding: '18px', borderRadius: '12px', background: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', marginBottom: '20px' }}>⚠️ {genError}</div>
          )}
          {!generating && variations.length > 1 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: '10px' }}>
                Pick a variation
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {variations.map((v, i) => (
                  <div key={i} onClick={() => { setSelectedVar(i); setStoryDataUrl(v.story); setFeedDataUrl(v.feed) }}
                    style={{ cursor: 'pointer', position: 'relative' }}>
                    <img src={v.story} alt={`variation ${i+1}`}
                      style={{ width: 90, height: 160, objectFit: 'cover', borderRadius: '8px',
                        border: selectedVar === i ? '2px solid #C4A0FF' : '2px solid transparent',
                        opacity: selectedVar === i ? 1 : 0.5, transition: 'all 0.2s',
                        boxShadow: selectedVar === i ? '0 0 16px rgba(196,160,255,0.4)' : 'none' }} />
                    <div style={{ position: 'absolute', bottom: 5, left: 0, right: 0, textAlign: 'center',
                      fontSize: '10px', fontWeight: 700, color: selectedVar === i ? '#C4A0FF' : '#555' }}>
                      {selectedVar === i ? '✓ Selected' : `V${i+1}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!generating && storyDataUrl && feedDataUrl && (
            <div style={{ display: 'flex', gap: '36px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Story · 9:16</div>
                <img src={storyDataUrl} alt="story" style={{ width: 240, height: 427, borderRadius: 12, objectFit: 'cover', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }} />
                <button onClick={() => download(storyDataUrl, 'story')}
                  style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', border: 'none',
                    cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'linear-gradient(135deg,#7C3AED,#C4A0FF)' }}>
                  <Download size={13} /> Download Story
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Feed · 4:5</div>
                <img src={feedDataUrl} alt="feed" style={{ width: 300, height: 375, borderRadius: 12, objectFit: 'cover', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }} />
                <button onClick={() => download(feedDataUrl, 'feed')}
                  style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', border: 'none',
                    cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'linear-gradient(135deg,#7C3AED,#C4A0FF)' }}>
                  <Download size={13} /> Download Feed
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', maxWidth: step === 3 ? 820 : step === 4 ? 'none' : 540 }}>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          style={{ padding: '11px 22px', borderRadius: '10px', fontWeight: 600, fontSize: '14px',
            border: '1px solid rgba(255,255,255,0.08)', cursor: step === 0 ? 'default' : 'pointer',
            color: '#9CA3AF', background: 'transparent', opacity: step === 0 ? 0 : 1,
            display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ChevronLeft size={15} /> Back
        </button>
        {step < 3 && (
          <button onClick={() => setStep(s => s + 1)} disabled={!canProceed}
            style={{ padding: '11px 28px', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
              border: 'none', cursor: canProceed ? 'pointer' : 'default', color: 'white',
              background: canProceed ? 'linear-gradient(135deg,#7C3AED,#C4A0FF)' : 'rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: canProceed ? '0 0 20px rgba(124,58,237,0.3)' : 'none' }}>
            Continue <ChevronRight size={15} />
          </button>
        )}
        {step === 3 && (
          <button onClick={generate} disabled={generating}
            style={{ padding: '11px 28px', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
              border: 'none', cursor: generating ? 'wait' : 'pointer', color: 'white',
              background: generating ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#7C3AED,#C4A0FF)',
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: generating ? 'none' : '0 0 20px rgba(124,58,237,0.35)' }}>
            {generating
              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
              : <><Wand2 size={15} /> Generate Flyers</>}
          </button>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
