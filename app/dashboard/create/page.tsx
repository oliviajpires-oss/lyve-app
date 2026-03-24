'use client'
import { useState, useRef, useCallback } from 'react'
import { Download, Upload, Wand2, ChevronRight, ChevronLeft, X, Plus, Check } from 'lucide-react'

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
  primaryColor: string
  secondaryColor: string
  accentColor: string
  bgStyle: string        // gradient key
  fontStyle: 'bold' | 'script' | 'clean'
  layout: 'bottom' | 'center' | 'split'
  textColor: string
}

// ─── Background gradient presets ──────────────────────────────────────────────
const BG_PRESETS: Record<string, { label: string; gradient: string; preview: string }> = {
  tropicalSunset:  { label: 'Tropical Sunset',  preview: 'linear-gradient(135deg,#FF6B35,#FF3B80,#7B2FBE)', gradient: 'linear-gradient(160deg, #FF6B35 0%, #FF3B80 45%, #7B2FBE 100%)' },
  deepNight:       { label: 'Deep Night',        preview: 'linear-gradient(135deg,#0F0F1A,#1A0533,#2D1B69)', gradient: 'linear-gradient(160deg, #0F0F1A 0%, #1A0533 50%, #2D1B69 100%)' },
  goldenHour:      { label: 'Golden Hour',       preview: 'linear-gradient(135deg,#F7971E,#FFD200,#FF6B35)', gradient: 'linear-gradient(160deg, #F7971E 0%, #FFD200 40%, #FF6B35 100%)' },
  neonCyber:       { label: 'Neon Cyber',        preview: 'linear-gradient(135deg,#00F5FF,#7B2FBE,#FF006E)', gradient: 'linear-gradient(160deg, #00F5FF 0%, #7B2FBE 50%, #FF006E 100%)' },
  editorialGrey:   { label: 'Editorial',         preview: 'linear-gradient(135deg,#1A1A2E,#16213E,#0F3460)', gradient: 'linear-gradient(160deg, #1A1A2E 0%, #16213E 60%, #0F3460 100%)' },
  coralDream:      { label: 'Coral Dream',       preview: 'linear-gradient(135deg,#FFECD2,#FCB69F,#FF9A9E)', gradient: 'linear-gradient(160deg, #FFECD2 0%, #FCB69F 50%, #FF9A9E 100%)' },
  forestMystic:    { label: 'Forest Mystic',     preview: 'linear-gradient(135deg,#134E5E,#71B280,#FFEAA7)', gradient: 'linear-gradient(160deg, #134E5E 0%, #71B280 60%, #FFEAA7 100%)' },
  customColor:     { label: 'Custom Color',      preview: '', gradient: '' },
}

const FONT_STYLES: Record<string, { label: string; artistFont: string; dateFont: string }> = {
  bold:   { label: 'Bold / Impact',    artistFont: '900 italic', dateFont: '700' },
  script: { label: 'Script / Elegant', artistFont: '400',        dateFont: '300' },
  clean:  { label: 'Clean / Modern',   artistFont: '800',        dateFont: '400' },
}

const STEPS = ['Details', 'Photo', 'Style', 'Create']

// ─── Canvas Preview Component ─────────────────────────────────────────────────
function FlierPreview({
  ratio, details, style, photoUrl, editing, onFieldEdit
}: {
  ratio: '9/16' | '4/5'
  details: EventDetails
  style: StyleConfig
  photoUrl: string | null
  editing: boolean
  onFieldEdit: (field: string, value: string) => void
}) {
  const isStory = ratio === '9/16'
  const w = isStory ? 270 : 320
  const h = isStory ? 480 : 400
  const font = FONT_STYLES[style.fontStyle]

  const bg = style.bgStyle === 'customColor'
    ? `linear-gradient(160deg, ${style.primaryColor} 0%, ${style.secondaryColor} 100%)`
    : BG_PRESETS[style.bgStyle]?.gradient || BG_PRESETS.tropicalSunset.gradient

  const supporting = details.supportingArtists.trim()
    ? details.supportingArtists.split(',').map(s => s.trim()).filter(Boolean)
    : []

  return (
    <div style={{ position: 'relative', width: w, height: h, borderRadius: 12,
      overflow: 'hidden', flexShrink: 0, boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
      background: bg, fontFamily: '-apple-system, sans-serif' }}>

      {/* Subtle overlay for text readability */}
      <div style={{ position: 'absolute', inset: 0,
        background: style.layout === 'bottom'
          ? 'linear-gradient(to top, rgba(0,0,0,0.85) 45%, transparent 75%)'
          : 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 40%, rgba(0,0,0,0.7) 70%)',
        zIndex: 1 }} />

      {/* DJ Photo */}
      {photoUrl && (
        <img src={photoUrl} alt="artist" style={{
          position: 'absolute',
          bottom: style.layout === 'bottom' ? 80 : undefined,
          top: style.layout === 'split' ? 60 : style.layout === 'center' ? '5%' : undefined,
          left: style.layout === 'split' ? '35%' : '50%',
          transform: style.layout === 'split' ? 'translateX(-50%)' : 'translateX(-50%)',
          width: style.layout === 'split' ? '60%' : '85%',
          height: style.layout === 'bottom' ? '80%' : '70%',
          objectFit: 'contain', objectPosition: 'top',
          zIndex: 2
        }} />
      )}

      {/* Top area: venue name */}
      <div style={{ position: 'absolute', top: 14, left: 0, right: 0,
        textAlign: 'center', zIndex: 3 }}>
        {editing
          ? <input value={details.venueName} onChange={e => onFieldEdit('venueName', e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: '1px dashed rgba(255,255,255,0.4)',
                color: style.textColor, fontSize: 11, fontWeight: 600, textAlign: 'center',
                letterSpacing: 2, textTransform: 'uppercase', width: '80%', padding: '2px 4px' }} />
          : <div style={{ color: style.textColor, fontSize: 11, fontWeight: 600,
              letterSpacing: 2, textTransform: 'uppercase', opacity: 0.8 }}>
              {details.venueName || 'VENUE NAME'}
            </div>
        }
      </div>

      {/* Bottom text block */}
      <div style={{ position: 'absolute',
        bottom: style.layout === 'split' ? undefined : 18,
        top: style.layout === 'split' ? '55%' : undefined,
        left: style.layout === 'split' ? 0 : 0,
        right: 0, padding: '0 18px', zIndex: 3 }}>

        {/* Artist name */}
        {editing
          ? <input value={details.artistName} onChange={e => onFieldEdit('artistName', e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: '1px dashed rgba(255,255,255,0.4)',
                color: style.textColor, fontSize: isStory ? 34 : 28, fontWeight: font.artistFont,
                fontStyle: style.fontStyle === 'bold' ? 'italic' : 'normal',
                textTransform: 'uppercase', letterSpacing: -1, width: '100%', padding: '2px 0',
                lineHeight: 1 }} />
          : <div style={{ color: style.textColor, fontSize: isStory ? 34 : 28, fontWeight: font.artistFont,
              fontStyle: style.fontStyle === 'bold' ? 'italic' : 'normal',
              textTransform: 'uppercase', letterSpacing: -1, lineHeight: 1, marginBottom: 6,
              textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              {details.artistName || 'ARTIST NAME'}
            </div>
        }

        {/* Date */}
        {editing
          ? <input value={`${details.date}${details.time ? ' · ' + details.time : ''}`}
              onChange={e => onFieldEdit('date', e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: '1px dashed rgba(255,255,255,0.4)',
                color: style.accentColor, fontSize: 13, fontWeight: font.dateFont,
                letterSpacing: 1, textTransform: 'uppercase', width: '100%', padding: '2px 0' }} />
          : <div style={{ color: style.accentColor, fontSize: 13, fontWeight: 700,
              letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10,
              textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
              {details.date
                ? new Date(details.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()
                : 'DATE'}
              {details.time ? ` · ${details.time}` : ''}
            </div>
        }

        {/* Supporting artists */}
        {supporting.length > 0 && (
          <div style={{ color: style.textColor, fontSize: 10, opacity: 0.75,
            letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
            {supporting.join('  ·  ')}
          </div>
        )}

        {/* Ticket link */}
        {details.ticketLink && (
          <div style={{ color: style.textColor, fontSize: 9, opacity: 0.55,
            letterSpacing: 0.5, marginTop: 4 }}>
            {details.ticketLink.replace('https://','').replace('http://','')}
          </div>
        )}
      </div>

      {/* Accent bar at bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${style.accentColor}, transparent)`,
        zIndex: 4 }} />
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
    primaryColor: '#FF6B35', secondaryColor: '#7B2FBE', accentColor: '#FFD200',
    bgStyle: 'tropicalSunset', fontStyle: 'bold', layout: 'bottom', textColor: '#FFFFFF'
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [removingBg, setRemovingBg] = useState(false)
  const [bgRemoved, setBgRemoved] = useState(false)
  const [editing, setEditing] = useState(false)
  const [exportingStory, setExportingStory] = useState(false)
  const [exportingFeed, setExportingFeed] = useState(false)

  const storyRef = useRef<HTMLDivElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Photo upload ────────────────────────────────────────────────────────────
  const handlePhotoUpload = useCallback((file: File) => {
    setPhotoFile(file)
    setBgRemoved(false)
    const url = URL.createObjectURL(file)
    setPhotoUrl(url)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handlePhotoUpload(file)
  }, [handlePhotoUpload])

  // ── Background removal ──────────────────────────────────────────────────────
  const removeBackground = useCallback(async () => {
    if (!photoFile) return
    setRemovingBg(true)
    try {
      const { removeBackground: removeBg } = await import('@imgly/background-removal')
      const blob = await removeBg(photoFile, {
        publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/',
        progress: () => {},
        output: { format: 'image/png', quality: 0.9 }
      })
      const url = URL.createObjectURL(blob)
      setPhotoUrl(url)
      setBgRemoved(true)
    } catch (err) {
      console.error('BG removal failed:', err)
      alert('Background removal failed. You can use a pre-cut photo instead.')
    }
    setRemovingBg(false)
  }, [photoFile])

  // ── Export ──────────────────────────────────────────────────────────────────
  const exportImage = useCallback(async (ref: React.RefObject<HTMLDivElement | null>, label: string, setLoading: (v: boolean) => void) => {
    if (!ref.current) return
    setLoading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(ref.current, {
        useCORS: true, allowTaint: true, scale: 3,
        backgroundColor: null, logging: false
      })
      const link = document.createElement('a')
      link.download = `lyve-${details.artistName.replace(/\s+/g,'-').toLowerCase() || 'flyer'}-${label}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
    }
    setLoading(false)
  }, [details.artistName])

  // ── Field edit in editor ────────────────────────────────────────────────────
  const handleFieldEdit = useCallback((field: string, value: string) => {
    if (field === 'date') {
      setDetails(prev => ({ ...prev, date: value }))
    } else {
      setDetails(prev => ({ ...prev, [field]: value } as EventDetails))
    }
  }, [])

  const canProceed = [
    details.artistName && details.date && details.venueName,
    true, // photo optional
    true, // style always ok
    true,
  ][step]

  // ── Input style helper ──────────────────────────────────────────────────────
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
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wand2 size={20} color="#C4A0FF" /> AI Content Creator
        </h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Generate event flyers in seconds — Story &amp; Feed format, ready to post.</p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: i < step ? 'pointer' : 'default' }}
              onClick={() => i < step && setStep(i)}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                background: i < step ? 'rgba(124,58,237,0.8)' : i === step ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)',
                border: i === step ? '1px solid rgba(196,160,255,0.5)' : '1px solid transparent',
                color: i <= step ? '#C4A0FF' : '#6B7280' }}>
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              <span style={{ fontSize: '13px', fontWeight: i === step ? 600 : 400, color: i === step ? '#C4A0FF' : '#6B7280' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.08)' }} />}
          </div>
        ))}
      </div>

      {/* ── Step 0: Event Details ─────────────────────────────────────────── */}
      {step === 0 && (
        <div className="card" style={{ maxWidth: 560 }}>
          <h2 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '20px' }}>Event Details</h2>
          <div style={{ display: 'grid', gap: '16px' }}>
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
                <label style={labelStyle}>Doors / Time</label>
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
              <label style={labelStyle}>Supporting Artists <span style={{ textTransform: 'none', color: '#6B7280' }}>(comma separated)</span></label>
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

      {/* ── Step 1: Photo Upload ──────────────────────────────────────────── */}
      {step === 1 && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div className="card" style={{ maxWidth: 440, flex: 1 }}>
            <h2 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>Artist Photo</h2>
            <p style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '20px' }}>
              Upload a photo — we&apos;ll remove the background automatically, or use a pre-cut PNG.
            </p>

            {/* Drop zone */}
            <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              style={{ border: '2px dashed rgba(124,58,237,0.3)', borderRadius: '12px',
                padding: '32px', textAlign: 'center', cursor: 'pointer', marginBottom: '16px',
                background: 'rgba(124,58,237,0.04)', transition: 'all 0.2s' }}>
              <Upload size={28} color="#7C3AED" style={{ marginBottom: '10px' }} />
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Drop photo here or click to upload</div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>JPG, PNG, WEBP — pre-cut PNG works best</div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])} />
            </div>

            {photoFile && (
              <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                {!bgRemoved && (
                  <button onClick={removeBackground} disabled={removingBg}
                    style={{ padding: '11px', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
                      border: 'none', cursor: removingBg ? 'wait' : 'pointer', color: 'white',
                      background: removingBg ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg, #7C3AED, #C4A0FF)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Wand2 size={15} />
                    {removingBg ? 'Removing background…' : 'Remove Background Automatically'}
                  </button>
                )}
                {bgRemoved && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
                    borderRadius: '10px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }}>
                    <Check size={14} color="#34d399" />
                    <span style={{ fontSize: '13px', color: '#34d399', fontWeight: 600 }}>Background removed</span>
                    <button onClick={() => { if (photoFile) { setPhotoUrl(URL.createObjectURL(photoFile)); setBgRemoved(false) } }}
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '12px' }}>
                      Undo
                    </button>
                  </div>
                )}
                <button onClick={() => { setPhotoFile(null); setPhotoUrl(null); setBgRemoved(false) }}
                  style={{ padding: '10px', borderRadius: '10px', fontWeight: 600, fontSize: '13px',
                    border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: '#9CA3AF', background: 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <X size={13} /> Remove photo
                </button>
              </div>
            )}

            {!photoFile && (
              <p style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center', marginTop: '4px' }}>
                Photo is optional — you can skip and use a gradient-only flyer.
              </p>
            )}
          </div>

          {/* Photo preview */}
          {photoUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>Preview</div>
              <img src={photoUrl} alt="preview" style={{ width: 160, height: 200, objectFit: 'contain',
                borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Style ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div className="card" style={{ maxWidth: 480, flex: 1 }}>
            <h2 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '20px' }}>Style & Vibe</h2>

            {/* Background */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Background</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                {Object.entries(BG_PRESETS).filter(([k]) => k !== 'customColor').map(([key, preset]) => (
                  <button key={key} onClick={() => setStyle(p => ({ ...p, bgStyle: key }))}
                    style={{ padding: '4px', borderRadius: '8px', border: style.bgStyle === key ? '2px solid #C4A0FF' : '2px solid transparent',
                      cursor: 'pointer', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '100%', height: 40, borderRadius: '6px', background: preset.preview }} />
                    <span style={{ fontSize: '10px', color: style.bgStyle === key ? '#C4A0FF' : '#6B7280', textAlign: 'center' }}>{preset.label}</span>
                  </button>
                ))}
                <button onClick={() => setStyle(p => ({ ...p, bgStyle: 'customColor' }))}
                  style={{ padding: '4px', borderRadius: '8px', border: style.bgStyle === 'customColor' ? '2px solid #C4A0FF' : '2px solid transparent',
                    cursor: 'pointer', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '100%', height: 40, borderRadius: '6px', background: 'rgba(255,255,255,0.06)',
                    border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={14} color="#6B7280" />
                  </div>
                  <span style={{ fontSize: '10px', color: style.bgStyle === 'customColor' ? '#C4A0FF' : '#6B7280' }}>Custom</span>
                </button>
              </div>
            </div>

            {/* Custom colors */}
            {style.bgStyle === 'customColor' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Color 1</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="color" value={style.primaryColor} onChange={e => setStyle(p => ({ ...p, primaryColor: e.target.value }))}
                      style={{ width: 36, height: 36, borderRadius: '8px', border: 'none', cursor: 'pointer', padding: 0 }} />
                    <input value={style.primaryColor} onChange={e => setStyle(p => ({ ...p, primaryColor: e.target.value }))}
                      style={{ ...inputStyle, width: 'auto', flex: 1 }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Color 2</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="color" value={style.secondaryColor} onChange={e => setStyle(p => ({ ...p, secondaryColor: e.target.value }))}
                      style={{ width: 36, height: 36, borderRadius: '8px', border: 'none', cursor: 'pointer', padding: 0 }} />
                    <input value={style.secondaryColor} onChange={e => setStyle(p => ({ ...p, secondaryColor: e.target.value }))}
                      style={{ ...inputStyle, width: 'auto', flex: 1 }} />
                  </div>
                </div>
              </div>
            )}

            {/* Accent color */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Accent / Date Color</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="color" value={style.accentColor} onChange={e => setStyle(p => ({ ...p, accentColor: e.target.value }))}
                  style={{ width: 36, height: 36, borderRadius: '8px', border: 'none', cursor: 'pointer', padding: 0 }} />
                <input value={style.accentColor} onChange={e => setStyle(p => ({ ...p, accentColor: e.target.value }))}
                  style={{ ...inputStyle, flex: 1 }} />
              </div>
            </div>

            {/* Font style */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Typography Style</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {Object.entries(FONT_STYLES).map(([key, f]) => (
                  <button key={key} onClick={() => setStyle(p => ({ ...p, fontStyle: key as StyleConfig['fontStyle'] }))}
                    style={{ flex: 1, padding: '10px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                      border: style.fontStyle === key ? '1px solid rgba(196,160,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      background: style.fontStyle === key ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                      color: style.fontStyle === key ? '#C4A0FF' : '#9CA3AF' }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout */}
            <div>
              <label style={labelStyle}>Photo Layout</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[['bottom', 'Bottom Text'], ['center', 'Centered'], ['split', 'Split']].map(([key, label]) => (
                  <button key={key} onClick={() => setStyle(p => ({ ...p, layout: key as StyleConfig['layout'] }))}
                    style={{ flex: 1, padding: '10px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                      border: style.layout === key ? '1px solid rgba(196,160,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      background: style.layout === key ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                      color: style.layout === key ? '#C4A0FF' : '#9CA3AF' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live preview while styling */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>Live Preview</div>
            <FlierPreview ratio="9/16" details={details} style={style} photoUrl={photoUrl} editing={false} onFieldEdit={() => {}} />
          </div>
        </div>
      )}

      {/* ── Step 3: Create & Edit ─────────────────────────────────────────── */}
      {step === 3 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>Your Flyers</h2>
              <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Click <strong style={{ color: '#C4A0FF' }}>Edit</strong> to adjust any text or colors, then download.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setEditing(e => !e)}
                style={{ padding: '10px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '13px',
                  border: editing ? '1px solid rgba(196,160,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer', color: editing ? '#C4A0FF' : '#9CA3AF',
                  background: editing ? 'rgba(124,58,237,0.2)' : 'transparent' }}>
                {editing ? '✓ Done Editing' : '✏️ Edit'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            {/* Story */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Story · 9:16</div>
              <div ref={storyRef}>
                <FlierPreview ratio="9/16" details={details} style={style} photoUrl={photoUrl} editing={editing} onFieldEdit={handleFieldEdit} />
              </div>
              <button onClick={() => exportImage(storyRef, 'story', setExportingStory)}
                disabled={exportingStory}
                style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 700, fontSize: '13px',
                  border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'linear-gradient(135deg, #7C3AED, #C4A0FF)',
                  opacity: exportingStory ? 0.6 : 1 }}>
                <Download size={13} /> {exportingStory ? 'Exporting…' : 'Download Story'}
              </button>
            </div>

            {/* Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Feed Post · 4:5</div>
              <div ref={feedRef}>
                <FlierPreview ratio="4/5" details={details} style={style} photoUrl={photoUrl} editing={editing} onFieldEdit={handleFieldEdit} />
              </div>
              <button onClick={() => exportImage(feedRef, 'feed', setExportingFeed)}
                disabled={exportingFeed}
                style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 700, fontSize: '13px',
                  border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'linear-gradient(135deg, #7C3AED, #C4A0FF)',
                  opacity: exportingFeed ? 0.6 : 1 }}>
                <Download size={13} /> {exportingFeed ? 'Exporting…' : 'Download Feed'}
              </button>
            </div>
          </div>

          {/* Style tweaks inline */}
          {editing && (
            <div className="card" style={{ marginTop: '24px', maxWidth: 560 }}>
              <h3 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '16px' }}>Quick Adjustments</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Background</label>
                  <select value={style.bgStyle} onChange={e => setStyle(p => ({ ...p, bgStyle: e.target.value }))}
                    style={{ ...inputStyle }}>
                    {Object.entries(BG_PRESETS).map(([k, v]) => <option key={k} value={k}>{v.label || 'Custom'}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Typography</label>
                  <select value={style.fontStyle} onChange={e => setStyle(p => ({ ...p, fontStyle: e.target.value as StyleConfig['fontStyle'] }))}
                    style={{ ...inputStyle }}>
                    {Object.entries(FONT_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Accent Color</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="color" value={style.accentColor} onChange={e => setStyle(p => ({ ...p, accentColor: e.target.value }))}
                      style={{ width: 36, height: 36, borderRadius: '8px', border: 'none', cursor: 'pointer', padding: 0 }} />
                    <input value={style.accentColor} onChange={e => setStyle(p => ({ ...p, accentColor: e.target.value }))}
                      style={{ ...inputStyle, flex: 1 }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Photo Layout</label>
                  <select value={style.layout} onChange={e => setStyle(p => ({ ...p, layout: e.target.value as StyleConfig['layout'] }))}
                    style={{ ...inputStyle }}>
                    <option value="bottom">Bottom Text</option>
                    <option value="center">Centered</option>
                    <option value="split">Split</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', maxWidth: step === 3 ? 'none' : 560 }}>
        <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
          style={{ padding: '11px 22px', borderRadius: '10px', fontWeight: 600, fontSize: '14px',
            border: '1px solid rgba(255,255,255,0.1)', cursor: step === 0 ? 'default' : 'pointer',
            color: '#9CA3AF', background: 'transparent', opacity: step === 0 ? 0 : 1,
            display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ChevronLeft size={15} /> Back
        </button>
        {step < 3 && (
          <button onClick={() => setStep(s => s + 1)} disabled={!canProceed}
            style={{ padding: '11px 28px', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
              border: 'none', cursor: canProceed ? 'pointer' : 'default', color: 'white',
              background: canProceed ? 'linear-gradient(135deg, #7C3AED, #C4A0FF)' : 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: canProceed ? '0 0 20px rgba(124,58,237,0.3)' : 'none' }}>
            {step === 2 ? 'Generate Flyers' : 'Continue'} <ChevronRight size={15} />
          </button>
        )}
      </div>
    </div>
  )
}
