'use client'
import { useState } from 'react'

type StoryCaption = { type: string; caption: string }
type PressKit = {
  bio_short: string
  bio_long: string
  booking_description: string
  genre_tags: string[]
  story_captions: StoryCaption[]
  canva_brief: {
    headline: string
    subline: string
    mood_keywords: string[]
    color_direction: string
  }
  video_script: {
    hook: string
    middle: string
    cta: string
    music_note: string
  }
}

const FIELD_STYLE = {
  width: '100%', padding: '12px 14px', borderRadius: '8px', fontSize: '14px',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'white', outline: 'none', boxSizing: 'border-box' as const
}
const LABEL_STYLE = { fontSize: '13px', color: '#9CA3AF', marginBottom: '6px', display: 'block' as const }
const SECTION_STYLE = {
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '12px', padding: '20px', marginBottom: '16px'
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} style={{
      padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
      background: copied ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.1)', color: copied ? '#9F67FF' : '#9CA3AF'
    }}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

function TextBlock({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#9F67FF' }}>{label}</span>
        <CopyButton text={text} />
      </div>
      <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#E5E7EB', margin: 0 }}>{text}</p>
    </div>
  )
}

export default function PressKitPage() {
  const [form, setForm] = useState({
    name: '', genres: '', city: '', vibe: '', gigs: '', years: '', influences: '', instagram: ''
  })
  const [loading, setLoading] = useState(false)
  const [kit, setKit] = useState<PressKit | null>(null)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const generate = async () => {
    if (!form.name || !form.genres || !form.city || !form.vibe) {
      setError('Please fill in Name, Genres, City, and Vibe at minimum.')
      return
    }
    setLoading(true)
    setError('')
    setKit(null)
    try {
      const res = await fetch('/api/generate-presskit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.success) setKit(data.kit)
      else setError('Something went wrong generating your kit. Try again.')
    } catch {
      setError('Network error. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>
          ✨ AI Press Kit Generator
        </h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
          Fill in your info and get a complete press kit — bios, story captions, Canva briefs, and a promo video script — in seconds.
        </p>
      </div>

      {/* Form */}
      <div style={{ ...SECTION_STYLE, borderColor: 'rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={LABEL_STYLE}>Artist Name *</label>
            <input style={FIELD_STYLE} placeholder="e.g. DJ Solaris" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label style={LABEL_STYLE}>City *</label>
            <input style={FIELD_STYLE} placeholder="e.g. Los Angeles" value={form.city} onChange={e => set('city', e.target.value)} />
          </div>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={LABEL_STYLE}>Genres *</label>
          <input style={FIELD_STYLE} placeholder="e.g. Tech House, Melodic Techno, Afro House" value={form.genres} onChange={e => set('genres', e.target.value)} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={LABEL_STYLE}>Your Vibe / Sound Description *</label>
          <input style={FIELD_STYLE} placeholder="e.g. Dark, hypnotic sets with driving basslines. Makes dancefloors move until 4am." value={form.vibe} onChange={e => set('vibe', e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={LABEL_STYLE}>Notable Gigs / Events</label>
            <input style={FIELD_STYLE} placeholder="e.g. Palm Tree Festival, Sound LA, Coachella" value={form.gigs} onChange={e => set('gigs', e.target.value)} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Years Active</label>
            <input style={FIELD_STYLE} placeholder="e.g. 6 years, since 2018" value={form.years} onChange={e => set('years', e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={LABEL_STYLE}>Influences</label>
            <input style={FIELD_STYLE} placeholder="e.g. Fisher, Chris Liebing, Anyma" value={form.influences} onChange={e => set('influences', e.target.value)} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Instagram Handle</label>
            <input style={FIELD_STYLE} placeholder="e.g. djsolaris" value={form.instagram} onChange={e => set('instagram', e.target.value)} />
          </div>
        </div>

        {error && <p style={{ color: '#F87171', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

        <button onClick={generate} disabled={loading} style={{
          width: '100%', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer', border: 'none',
          background: loading ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, #7C3AED, #9F67FF)',
          color: 'white', transition: 'all 0.2s'
        }}>
          {loading ? '✨ Generating your kit...' : '✨ Generate Press Kit'}
        </button>
      </div>

      {/* Results */}
      {kit && (
        <div>
          {/* Bios */}
          <div style={SECTION_STYLE}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>📄 Bios</h2>
            <TextBlock label="Short Bio" text={kit.bio_short} />
            <TextBlock label="Full Bio" text={kit.bio_long} />
            <TextBlock label="Venue Booking Description" text={kit.booking_description} />
            <div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#9F67FF', display: 'block', marginBottom: '8px' }}>Genre Tags</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {kit.genre_tags.map((tag, i) => (
                  <span key={i} style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', color: '#9F67FF'
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Story Captions */}
          <div style={SECTION_STYLE}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>📱 Story Captions</h2>
            {kit.story_captions.map((sc, i) => (
              <div key={i} style={{
                padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)', marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#9F67FF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {sc.type}
                  </span>
                  <CopyButton text={sc.caption} />
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#E5E7EB', margin: 0 }}>{sc.caption}</p>
              </div>
            ))}
          </div>

          {/* Canva Brief */}
          <div style={SECTION_STYLE}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>🎨 Canva Graphics Brief</h2>
            <TextBlock label="Headline" text={kit.canva_brief.headline} />
            <TextBlock label="Subline" text={kit.canva_brief.subline} />
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#9F67FF', display: 'block', marginBottom: '8px' }}>Mood Keywords</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {kit.canva_brief.mood_keywords.map((k, i) => (
                  <span key={i} style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#E5E7EB'
                  }}>{k}</span>
                ))}
              </div>
            </div>
            <TextBlock label="Color / Mood Direction" text={kit.canva_brief.color_direction} />
          </div>

          {/* Video Script */}
          <div style={SECTION_STYLE}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>🎬 Promo Reel Script (20 sec)</h2>
            <p style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '16px' }}>Use this as your shot list for a self-shot promo clip</p>
            {[
              { label: '🎬 Hook (0–3 sec)', text: kit.video_script.hook },
              { label: '⚡ Middle (4–15 sec)', text: kit.video_script.middle },
              { label: '🎯 CTA (16–20 sec)', text: kit.video_script.cta },
              { label: '🎵 Music Direction', text: kit.video_script.music_note },
            ].map((item, i) => (
              <TextBlock key={i} label={item.label} text={item.text} />
            ))}
          </div>

          {/* Download all */}
          <button onClick={() => {
            const content = `LYVE PRESS KIT — ${kit.bio_short.split(' ')[0]}\n${'='.repeat(50)}\n\nSHORT BIO\n${kit.bio_short}\n\nFULL BIO\n${kit.bio_long}\n\nBOOKING DESCRIPTION\n${kit.booking_description}\n\nGENRE TAGS\n${kit.genre_tags.join(', ')}\n\nSTORY CAPTIONS\n${kit.story_captions.map(s => `${s.type}:\n${s.caption}`).join('\n\n')}\n\nCANVA BRIEF\nHeadline: ${kit.canva_brief.headline}\nSubline: ${kit.canva_brief.subline}\nMood: ${kit.canva_brief.mood_keywords.join(', ')}\nColor Direction: ${kit.canva_brief.color_direction}\n\nPROMO REEL SCRIPT\nHook: ${kit.video_script.hook}\nMiddle: ${kit.video_script.middle}\nCTA: ${kit.video_script.cta}\nMusic: ${kit.video_script.music_note}`
            const blob = new Blob([content], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = 'lyve-presskit.txt'; a.click()
          }} style={{
            width: '100%', padding: '14px', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
            cursor: 'pointer', border: '1px solid rgba(124,58,237,0.4)', marginBottom: '32px',
            background: 'rgba(124,58,237,0.1)', color: '#9F67FF'
          }}>
            ⬇️ Download Full Kit as .txt
          </button>
        </div>
      )}
    </div>
  )
}
