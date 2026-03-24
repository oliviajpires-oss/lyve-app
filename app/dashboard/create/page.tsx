'use client'
import { useState, useRef, useCallback } from 'react'
import { Download, Upload, Wand2, ChevronRight, ChevronLeft, X, Check, Loader2, RefreshCw } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface EventDetails {
  artistName: string
  date: string
  time: string
  venueName: string
  supportingArtists: string
  ticketLink: string
}

interface StyleConfig {
  bgType: 'photo' | 'illustrative'
  vibe: string
  accentColor: string
  textColor: string
  fontStyle: 'bold' | 'clean' | 'elegant'
  artistSize: number
}

// ─── Constants ────────────────────────────────────────────────────────────────
const VIBES = [
  { key: 'tropical',    label: 'Tropical & Vibrant',  emoji: '🌴' },
  { key: 'underground', label: 'Dark Underground',     emoji: '🖤' },
  { key: 'neon',        label: 'Neon / Cyber',         emoji: '💜' },
  { key: 'golden',      label: 'Golden Hour',          emoji: '✨' },
  { key: 'festival',    label: 'Festival & Epic',      emoji: '🎪' },
  { key: 'editorial',   label: 'Minimal Editorial',    emoji: '◻️' },
]

const ACCENT_PRESETS = ['#FFD700', '#FF3B80', '#00F5FF', '#FF6B35', '#FFFFFF', '#34D399', '#C4A0FF', '#FF4500']

const STEPS = ['Details', 'Photo', 'Style', 'Generate']

// ─── Canvas Compositor ────────────────────────────────────────────────────────
async function compositeFlyer({
  bgUrl, photoUrl, details, style, width, height
}: {
  bgUrl: string
  photoUrl: string | null
  details: EventDetails
  style: StyleConfig
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

  // ── Layer 1: Background ───────────────────────────────────────────────────
  try {
    const bgImg = await loadImg(bgUrl)
    // Cover-fit
    const scale = Math.max(width / bgImg.width, height / bgImg.height)
    const bw = bgImg.width * scale
    const bh = bgImg.height * scale
    const bx = (width - bw) / 2
    const by = (height - bh) / 2
    ctx.drawImage(bgImg, bx, by, bw, bh)
  } catch {
    // fallback gradient
    const grad = ctx.createLinearGradient(0, 0, width, height)
    grad.addColorStop(0, '#1a0533')
    grad.addColorStop(1, '#0f0f1a')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
  }

  // ── Layer 2: Color grade overlay (mood) ───────────────────────────────────
  const moodGrad = ctx.createLinearGradient(0, 0, 0, height)
  moodGrad.addColorStop(0, 'rgba(0,0,0,0.35)')
  moodGrad.addColorStop(0.5, 'rgba(0,0,0,0.1)')
  moodGrad.addColorStop(1, 'rgba(0,0,0,0.7)')
  ctx.fillStyle = moodGrad
  ctx.fillRect(0, 0, width, height)

  // ── Layer 3: DJ Photo ─────────────────────────────────────────────────────
  if (photoUrl) {
    try {
      const photo = await loadImg(photoUrl)
      const photoH = height * 0.72
      const photoW = (photo.width / photo.height) * photoH
      const px = (width - photoW) / 2
      const py = height - photoH - (height * 0.06)

      // Glow / halo effect
      ctx.save()
      ctx.globalAlpha = 0.22
      ctx.filter = 'blur(40px)'
      ctx.drawImage(photo, px - 30, py - 30, photoW + 60, photoH + 60)
      ctx.filter = 'none'
      ctx.globalAlpha = 1
      ctx.restore()

      // Slight accent tint on the photo base (colored glow)
      ctx.save()
      ctx.globalAlpha = 0.12
      ctx.fillStyle = style.accentColor
      ctx.filter = `blur(60px)`
      ctx.drawImage(photo, px, py, photoW, photoH)
      ctx.filter = 'none'
      ctx.globalAlpha = 1
      ctx.restore()

      // The actual photo
      ctx.drawImage(photo, px, py, photoW, photoH)

      // Fade bottom of photo into background
      const fadeGrad = ctx.createLinearGradient(0, py + photoH * 0.6, 0, py + photoH)
      fadeGrad.addColorStop(0, 'rgba(0,0,0,0)')
      fadeGrad.addColorStop(1, 'rgba(0,0,0,0.85)')
      ctx.fillStyle = fadeGrad
      ctx.fillRect(px - 20, py + photoH * 0.6, photoW + 40, photoH * 0.4 + 20)
    } catch { /* skip photo if load fails */ }
  }

  // ── Layer 4: Vignette ─────────────────────────────────────────────────────
  const vig = ctx.createRadialGradient(width/2, height/2, height*0.25, width/2, height/2, height*0.85)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, width, height)

  // ── Layer 5: Bottom gradient for text ─────────────────────────────────────
  const textGrad = ctx.createLinearGradient(0, height * 0.62, 0, height)
  textGrad.addColorStop(0, 'rgba(0,0,0,0)')
  textGrad.addColorStop(0.4, 'rgba(0,0,0,0.6)')
  textGrad.addColorStop(1, 'rgba(0,0,0,0.92)')
  ctx.fillStyle = textGrad
  ctx.fillRect(0, height * 0.62, width, height * 0.38)

  // ── Layer 6: Accent line at bottom ────────────────────────────────────────
  const accentGrad = ctx.createLinearGradient(0, 0, width, 0)
  accentGrad.addColorStop(0, 'rgba(0,0,0,0)')
  accentGrad.addColorStop(0.5, style.accentColor)
  accentGrad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = accentGrad
  ctx.fillRect(0, height - 4, width, 4)

  // ── Layer 7: Typography ───────────────────────────────────────────────────
  const textPad = width * 0.07
  const fontMap = {
    bold:    'Impact, "Arial Black", sans-serif',
    clean:   '"Helvetica Neue", Arial, sans-serif',
    elegant: 'Georgia, "Times New Roman", serif',
  }
  const ff = fontMap[style.fontStyle]
  const tc = style.textColor

  // Venue name (top)
  ctx.save()
  ctx.font = `600 ${Math.round(width * 0.034)}px ${ff}`
  ctx.fillStyle = tc
  ctx.globalAlpha = 0.7
  ctx.letterSpacing = `${width * 0.008}px`
  ctx.textAlign = 'center'
  ctx.fillText(details.venueName.toUpperCase() || 'VENUE NAME', width / 2, height * 0.052)
  ctx.restore()

  // Artist name — main headline
  const artistFontSize = Math.round(width * (style.artistSize / 100))
  ctx.save()
  ctx.font = `${style.fontStyle === 'bold' ? '900' : style.fontStyle === 'elegant' ? '700' : '800'} ${artistFontSize}px ${ff}`
  ctx.textAlign = 'center'
  ctx.fillStyle = tc
  ctx.shadowColor = 'rgba(0,0,0,0.9)'
  ctx.shadowBlur = 20

  // Fit text to canvas width
  let fontSize = artistFontSize
  while (ctx.measureText(details.artistName.toUpperCase() || 'ARTIST').width > width - textPad * 2 && fontSize > 30) {
    fontSize -= 2
    ctx.font = `${style.fontStyle === 'bold' ? '900' : '800'} ${fontSize}px ${ff}`
  }
  ctx.font = `${style.fontStyle === 'bold' ? '900' : '800'} ${fontSize}px ${ff}`
  if (style.fontStyle === 'bold') {
    ctx.fillStyle = tc
    ctx.fillText((details.artistName || 'ARTIST NAME').toUpperCase(), width / 2, height * 0.81)
  } else {
    ctx.fillText(details.artistName || 'Artist Name', width / 2, height * 0.81)
  }
  ctx.shadowBlur = 0
  ctx.restore()

  // Date in accent color
  if (details.date) {
    const dateStr = new Date(details.date + 'T12:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    }).toUpperCase()
    const dateLine = details.time ? `${dateStr}  ·  ${details.time.toUpperCase()}` : dateStr
    ctx.save()
    ctx.font = `700 ${Math.round(width * 0.038)}px ${ff}`
    ctx.textAlign = 'center'
    ctx.fillStyle = style.accentColor
    ctx.shadowColor = 'rgba(0,0,0,0.8)'
    ctx.shadowBlur = 12
    ctx.fillText(dateLine, width / 2, height * 0.867)
    ctx.shadowBlur = 0
    ctx.restore()
  }

  // Supporting artists
  const supporting = details.supportingArtists.trim()
    ? details.supportingArtists.split(',').map(s => s.trim()).filter(Boolean)
    : []
  if (supporting.length > 0) {
    ctx.save()
    ctx.font = `500 ${Math.round(width * 0.028)}px ${ff}`
    ctx.textAlign = 'center'
    ctx.fillStyle = tc
    ctx.globalAlpha = 0.65
    ctx.fillText(supporting.join('  ·  '), width / 2, height * 0.908)
    ctx.restore()
  }

  // Ticket link
  if (details.ticketLink) {
    ctx.save()
    ctx.font = `400 ${Math.round(width * 0.022)}px ${ff}`
    ctx.textAlign = 'center'
    ctx.fillStyle = tc
    ctx.globalAlpha = 0.4
    ctx.fillText(details.ticketLink.replace(/^https?:\/\//i, ''), width / 2, height * 0.945)
    ctx.restore()
  }

  // ── Layer 8: Film grain ───────────────────────────────────────────────────
  const imageData = ctx.getImageData(0, 0, width, height)
  const d = imageData.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 18
    d[i]     = Math.min(255, Math.max(0, d[i]     + n))
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n))
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n))
  }
  ctx.putImageData(imageData, 0, 0)

  return canvas.toDataURL('image/jpeg', 0.95)
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreatePage() {
  const [step, setStep] = useState(0)
  const [details, setDetails] = useState<EventDetails>({
    artistName: '', date: '', time: '', venueName: '', supportingArtists: '', ticketLink: ''
  })
  const [style, setStyle] = useState<StyleConfig>({
    bgType: 'photo', vibe: 'tropical', accentColor: '#FFD700',
    textColor: '#FFFFFF', fontStyle: 'bold', artistSize: 14
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [bgRemovedUrl, setBgRemovedUrl] = useState<string | null>(null)
  const [removingBg, setRemovingBg] = useState(false)

  const [generating, setGenerating] = useState(false)
  const [storyDataUrl, setStoryDataUrl] = useState<string | null>(null)
  const [feedDataUrl, setFeedDataUrl] = useState<string | null>(null)
  const [genError, setGenError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Photo handling ──────────────────────────────────────────────────────────
  const handlePhotoUpload = useCallback((file: File) => {
    setPhotoFile(file)
    setBgRemovedUrl(null)
    setPhotoUrl(URL.createObjectURL(file))
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) handlePhotoUpload(file)
  }, [handlePhotoUpload])

  const removeBackground = useCallback(async () => {
    if (!photoFile) return
    setRemovingBg(true)
    try {
      const { removeBackground: removeBg } = await import('@imgly/background-removal')
      const blob = await removeBg(photoFile, {
        publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/',
        progress: () => {},
        output: { format: 'image/png', quality: 0.95 }
      })
      const url = URL.createObjectURL(blob)
      setBgRemovedUrl(url)
      setPhotoUrl(url)
    } catch {
      alert('Background removal failed — try a pre-cut PNG.')
    }
    setRemovingBg(false)
  }, [photoFile])

  // ── Generation ──────────────────────────────────────────────────────────────
  const generate = useCallback(async (regenerateBg = true) => {
    setGenerating(true)
    setGenError(null)
    try {
      // Fetch background images (both formats in parallel)
      const [storyBgRes, feedBgRes] = await Promise.all([
        regenerateBg ? fetch('/api/generate-background', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bgType: style.bgType, vibe: style.vibe, format: 'story' })
        }) : null,
        regenerateBg ? fetch('/api/generate-background', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bgType: style.bgType, vibe: style.vibe, format: 'feed' })
        }) : null,
      ])

      let storyBgUrl: string
      let feedBgUrl: string

      if (storyBgRes && feedBgRes) {
        const [storyBlob, feedBlob] = await Promise.all([storyBgRes.blob(), feedBgRes.blob()])
        storyBgUrl = URL.createObjectURL(storyBlob)
        feedBgUrl = URL.createObjectURL(feedBlob)
      } else {
        // Keep existing background - we'd normally cache these but for simplicity regenerate
        setGenerating(false)
        return
      }

      const activePhoto = bgRemovedUrl || photoUrl

      const [storyCanvas, feedCanvas] = await Promise.all([
        compositeFlyer({ bgUrl: storyBgUrl, photoUrl: activePhoto, details, style, width: 1080, height: 1920 }),
        compositeFlyer({ bgUrl: feedBgUrl,  photoUrl: activePhoto, details, style, width: 1080, height: 1350 }),
      ])

      setStoryDataUrl(storyCanvas)
      setFeedDataUrl(feedCanvas)
      setStep(3)
    } catch (err) {
      console.error(err)
      setGenError('Generation failed. Please try again.')
    }
    setGenerating(false)
  }, [style, details, photoUrl, bgRemovedUrl])

  // ── Re-composite without new background ────────────────────────────────────
  const recomposite = useCallback(async () => {
    if (!storyDataUrl || !feedDataUrl) return
    setGenerating(true)
    // For recomposite we'd need to cache bg URLs - for now just regenerate
    await generate(true)
  }, [generate, storyDataUrl, feedDataUrl])

  // ── Download ────────────────────────────────────────────────────────────────
  const download = (dataUrl: string, label: string) => {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `lyve-${(details.artistName || 'flyer').replace(/\s+/g, '-').toLowerCase()}-${label}.jpg`
    a.click()
  }

  const canProceed = [
    !!(details.artistName && details.date && details.venueName),
    true,
    true,
    true,
  ][step]

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
    color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: 600, color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block'
  }

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wand2 size={20} color="#C4A0FF" /> AI Content Creator
        </h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px' }}>AI-generated event flyers — Story &amp; Feed, ready to post.</p>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '28px', alignItems: 'center' }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: i < step ? 'pointer' : 'default' }}
              onClick={() => i < step && setStep(i)}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '11px', fontWeight: 700,
                background: i < step ? 'rgba(124,58,237,0.8)' : i === step ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.05)',
                border: i === step ? '1px solid rgba(196,160,255,0.4)' : '1px solid transparent',
                color: i <= step ? '#C4A0FF' : '#555' }}>
                {i < step ? <Check size={11} /> : i + 1}
              </div>
              <span style={{ fontSize: '13px', color: i === step ? '#C4A0FF' : i < step ? '#9CA3AF' : '#555', fontWeight: i === step ? 600 : 400 }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 2px' }} />}
          </div>
        ))}
      </div>

      {/* ── Step 0: Details ───────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="card" style={{ maxWidth: 540 }}>
          <h2 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '20px' }}>Event Details</h2>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Artist / Headliner *</label>
              <input style={inputStyle} placeholder="e.g. Chris Lorenzo" value={details.artistName}
                onChange={e => setDetails(p => ({ ...p, artistName: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Date *</label>
                <input style={inputStyle} type="date" value={details.date}
                  onChange={e => setDetails(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Time / Doors</label>
                <input style={inputStyle} placeholder="e.g. 10 PM" value={details.time}
                  onChange={e => setDetails(p => ({ ...p, time: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Venue Name *</label>
              <input style={inputStyle} placeholder="e.g. Palm Tree Club Miami" value={details.venueName}
                onChange={e => setDetails(p => ({ ...p, venueName: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Supporting Artists <span style={{ textTransform: 'none', fontWeight: 400, color: '#555' }}>(comma separated)</span></label>
              <input style={inputStyle} placeholder="e.g. Solardo, Rebüke, Max Stern" value={details.supportingArtists}
                onChange={e => setDetails(p => ({ ...p, supportingArtists: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Ticket / Info Link</label>
              <input style={inputStyle} placeholder="https://ra.co/..." value={details.ticketLink}
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
            <p style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '20px' }}>
              Upload a photo — we&apos;ll remove the background, or use a pre-cut PNG for best results.
            </p>
            <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              style={{ border: '2px dashed rgba(124,58,237,0.25)', borderRadius: '12px', padding: '28px',
                textAlign: 'center', cursor: 'pointer', marginBottom: '14px', background: 'rgba(124,58,237,0.03)' }}>
              <Upload size={26} color="#7C3AED" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 600, marginBottom: '3px', fontSize: '14px' }}>Drop photo or click to upload</div>
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
                {removingBg ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Removing background…</> : <><Wand2 size={14} /> Remove Background</>}
              </button>
            )}
            {bgRemovedUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px',
                background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', marginBottom: '10px' }}>
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
            {!photoFile && (
              <p style={{ fontSize: '12px', color: '#555', textAlign: 'center' }}>Photo is optional — skip for art-only flyers.</p>
            )}
          </div>
          {photoUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: 1 }}>Preview</div>
              <img src={photoUrl} alt="preview" style={{ width: 150, height: 190, objectFit: 'contain',
                borderRadius: '10px', background: 'repeating-conic-gradient(#1a1a1a 0% 25%, #111 0% 50%) 0 0/16px 16px' }} />
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Style ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="card" style={{ maxWidth: 600 }}>
          <h2 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '20px' }}>Style & Vibe</h2>

          {/* Background type */}
          <div style={{ marginBottom: '22px' }}>
            <label style={labelStyle}>Background Type</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[['photo', '📷', 'Photographic', 'Cinematic, real-world feel'],
                ['illustrative', '🎨', 'Illustrative', 'Art-forward, graphic design']
               ].map(([key, em, label, desc]) => (
                <button key={key} onClick={() => setStyle(p => ({ ...p, bgType: key as StyleConfig['bgType'] }))}
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer',
                    border: style.bgType === key ? '1px solid rgba(196,160,255,0.5)' : '1px solid rgba(255,255,255,0.07)',
                    background: style.bgType === key ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>{em}</div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: style.bgType === key ? '#C4A0FF' : 'white', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Vibe */}
          <div style={{ marginBottom: '22px' }}>
            <label style={labelStyle}>Vibe</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
              {VIBES.map(v => (
                <button key={v.key} onClick={() => setStyle(p => ({ ...p, vibe: v.key }))}
                  style={{ padding: '12px 10px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center',
                    border: style.vibe === v.key ? '1px solid rgba(196,160,255,0.5)' : '1px solid rgba(255,255,255,0.07)',
                    background: style.vibe === v.key ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>{v.emoji}</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: style.vibe === v.key ? '#C4A0FF' : '#9CA3AF' }}>{v.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Accent color */}
          <div style={{ marginBottom: '22px' }}>
            <label style={labelStyle}>Accent Color <span style={{ textTransform: 'none', fontWeight: 400, color: '#555' }}>(for date & highlights)</span></label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {ACCENT_PRESETS.map(c => (
                <button key={c} onClick={() => setStyle(p => ({ ...p, accentColor: c }))}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: style.accentColor === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer', outline: style.accentColor === c ? '2px solid rgba(255,255,255,0.3)' : 'none' }} />
              ))}
              <input type="color" value={style.accentColor} onChange={e => setStyle(p => ({ ...p, accentColor: e.target.value }))}
                style={{ width: 32, height: 32, borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.2)', cursor: 'pointer', background: 'none', padding: 0 }} />
            </div>
          </div>

          {/* Typography */}
          <div style={{ marginBottom: '22px' }}>
            <label style={labelStyle}>Typography</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[['bold','Bold / Impact'],['clean','Clean / Modern'],['elegant','Elegant / Serif']].map(([k, l]) => (
                <button key={k} onClick={() => setStyle(p => ({ ...p, fontStyle: k as StyleConfig['fontStyle'] }))}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    border: style.fontStyle === k ? '1px solid rgba(196,160,255,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    background: style.fontStyle === k ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                    color: style.fontStyle === k ? '#C4A0FF' : '#9CA3AF' }}>{l}</button>
              ))}
            </div>
          </div>

          {/* Artist name size */}
          <div>
            <label style={labelStyle}>Artist Name Size — {style.artistSize}%</label>
            <input type="range" min={8} max={20} value={style.artistSize}
              onChange={e => setStyle(p => ({ ...p, artistSize: Number(e.target.value) }))}
              style={{ width: '100%', accentColor: '#7C3AED' }} />
          </div>
        </div>
      )}

      {/* ── Step 3: Results ───────────────────────────────────────────────── */}
      {step === 3 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '3px' }}>Your Flyers</h2>
              <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Download or regenerate for a new background variation.</p>
            </div>
            <button onClick={() => generate(true)} disabled={generating}
              style={{ padding: '10px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', border: '1px solid rgba(255,255,255,0.1)',
                cursor: generating ? 'wait' : 'pointer', color: '#9CA3AF', background: 'transparent',
                display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={13} style={generating ? { animation: 'spin 1s linear infinite' } : {}} />
              Regenerate
            </button>
          </div>

          {generating && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '16px' }}>
              <Loader2 size={32} color="#C4A0FF" style={{ animation: 'spin 1s linear infinite' }} />
              <div style={{ color: '#9CA3AF', fontSize: '14px' }}>Generating your flyers…</div>
              <div style={{ color: '#555', fontSize: '12px' }}>AI is creating a custom background — this takes about 15–30 seconds</div>
            </div>
          )}

          {!generating && genError && (
            <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', marginBottom: '20px' }}>
              ⚠️ {genError}
            </div>
          )}

          {!generating && storyDataUrl && feedDataUrl && (
            <div style={{ display: 'flex', gap: '36px', flexWrap: 'wrap' }}>
              {/* Story */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Story · 9:16</div>
                <img src={storyDataUrl} alt="story flyer" style={{ width: 240, height: 427, borderRadius: 12, objectFit: 'cover',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }} />
                <button onClick={() => download(storyDataUrl, 'story')}
                  style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', border: 'none',
                    cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'linear-gradient(135deg,#7C3AED,#C4A0FF)' }}>
                  <Download size={13} /> Download Story
                </button>
              </div>
              {/* Feed */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Feed · 4:5</div>
                <img src={feedDataUrl} alt="feed flyer" style={{ width: 300, height: 375, borderRadius: 12, objectFit: 'cover',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }} />
                <button onClick={() => download(feedDataUrl, 'feed')}
                  style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', border: 'none',
                    cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'linear-gradient(135deg,#7C3AED,#C4A0FF)' }}>
                  <Download size={13} /> Download Feed
                </button>
              </div>
            </div>
          )}

          {/* Style tweaks */}
          {!generating && storyDataUrl && (
            <div className="card" style={{ marginTop: '28px', maxWidth: 560 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontWeight: 700, fontSize: '14px' }}>Adjust & Regenerate</h3>
                <button onClick={recomposite} disabled={generating}
                  style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(196,160,255,0.3)',
                    cursor: 'pointer', color: '#C4A0FF', background: 'rgba(124,58,237,0.1)' }}>
                  Apply changes
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Vibe</label>
                  <select value={style.vibe} onChange={e => setStyle(p => ({ ...p, vibe: e.target.value }))} style={inputStyle}>
                    {VIBES.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Typography</label>
                  <select value={style.fontStyle} onChange={e => setStyle(p => ({ ...p, fontStyle: e.target.value as StyleConfig['fontStyle'] }))} style={inputStyle}>
                    <option value="bold">Bold / Impact</option>
                    <option value="clean">Clean / Modern</option>
                    <option value="elegant">Elegant / Serif</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Accent Color</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {ACCENT_PRESETS.map(c => (
                      <button key={c} onClick={() => setStyle(p => ({ ...p, accentColor: c }))}
                        style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: style.accentColor === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Nav buttons ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', maxWidth: step === 3 ? 'none' : 560 }}>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          style={{ padding: '11px 22px', borderRadius: '10px', fontWeight: 600, fontSize: '14px',
            border: '1px solid rgba(255,255,255,0.08)', cursor: step === 0 ? 'default' : 'pointer',
            color: '#9CA3AF', background: 'transparent', opacity: step === 0 ? 0 : 1,
            display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ChevronLeft size={15} /> Back
        </button>

        {step < 2 && (
          <button onClick={() => setStep(s => s + 1)} disabled={!canProceed}
            style={{ padding: '11px 28px', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
              border: 'none', cursor: canProceed ? 'pointer' : 'default', color: 'white',
              background: canProceed ? 'linear-gradient(135deg,#7C3AED,#C4A0FF)' : 'rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: canProceed ? '0 0 20px rgba(124,58,237,0.3)' : 'none' }}>
            Continue <ChevronRight size={15} />
          </button>
        )}

        {step === 2 && (
          <button onClick={() => generate(true)} disabled={generating}
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
