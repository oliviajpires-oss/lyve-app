'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Sparkles, Camera, PenTool, Video, FileText, Smartphone, LayoutTemplate, Film, Zap, Target, Music } from 'lucide-react'

type StoryCaption = { type: string; caption: string }
type PressKit = {
  bio_refined: string
  booking_pitch: string
  genre_tags: string[]
  one_liners: string[]
  story_captions: StoryCaption[]
  canva_brief: { headline: string; subline: string; mood_keywords: string[]; color_direction: string }
  video_script: { hook: string; middle: string; cta: string; music_note: string }
}

const S = {
  input: {
    width: '100%', padding: '12px 14px', borderRadius: '8px', fontSize: '14px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', outline: 'none', boxSizing: 'border-box' as const
  },
  label: { fontSize: '13px', color: '#9CA3AF', marginBottom: '6px', display: 'block' as const },
  card: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '12px', padding: '20px', marginBottom: '16px'
  }
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
        background: copied ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.1)', color: copied ? '#9F67FF' : '#9CA3AF' }}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#9F67FF' }}>{label}</span>
        <CopyBtn text={text} />
      </div>
      <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#E5E7EB', margin: 0 }}>{text}</p>
    </div>
  )
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
      <div style={{ color: '#9F67FF' }}>{icon}</div>
      <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{title}</h2>
    </div>
  )
}

type UploadFile = { file: File; preview: string; uploading: boolean; url?: string }

export default function PressKitPage() {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [instagram, setInstagram] = useState('')
  const [bio, setBio] = useState('')
  const [photos, setPhotos] = useState<UploadFile[]>([])
  const [videos, setVideos] = useState<UploadFile[]>([])
  const [logos, setLogos] = useState<UploadFile[]>([])
  const [loading, setLoading] = useState(false)
  const [kit, setKit] = useState<PressKit | null>(null)
  const [kitPhotos, setKitPhotos] = useState<string[]>([])
  const [kitVideos, setKitVideos] = useState<string[]>([])
  const [kitLogos, setKitLogos] = useState<string[]>([])
  const [error, setError] = useState('')
  const photoRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  const addPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5 - photos.length)
    const newPhotos = files.map(f => ({ file: f, preview: URL.createObjectURL(f), uploading: false }))
    setPhotos(p => [...p, ...newPhotos].slice(0, 5))
  }

  const addVideos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 2 - videos.length)
    const newVideos = files.map(f => ({ file: f, preview: URL.createObjectURL(f), uploading: false }))
    setVideos(v => [...v, ...newVideos].slice(0, 2))
  }

  const addLogos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3 - logos.length)
    const newLogos = files.map(f => ({ file: f, preview: URL.createObjectURL(f), uploading: false }))
    setLogos(l => [...l, ...newLogos].slice(0, 3))
  }

  const uploadToSupabase = async (file: File, bucket: string, folder: string) => {
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  const generate = async () => {
    if (!bio.trim() || bio.trim().length < 30) {
      setError('Please write a bio of at least a few sentences.')
      return
    }
    setLoading(true)
    setError('')
    setKit(null)

    try {
      const photoUrls: string[] = []
      for (const p of photos) {
        try {
          const url = await uploadToSupabase(p.file, 'assets', 'presskit/photos')
          photoUrls.push(url)
        } catch { /* skip failed uploads */ }
      }

      const videoUrls: string[] = []
      for (const v of videos) {
        try {
          const url = await uploadToSupabase(v.file, 'assets', 'presskit/videos')
          videoUrls.push(url)
        } catch { /* skip failed uploads */ }
      }

      const logoUrls: string[] = []
      for (const l of logos) {
        try {
          const url = await uploadToSupabase(l.file, 'assets', 'presskit/logos')
          logoUrls.push(url)
        } catch { /* skip failed uploads */ }
      }

      setKitPhotos(photoUrls)
      setKitVideos(videoUrls)
      setKitLogos(logoUrls)

      const res = await fetch('/api/generate-presskit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, city, instagram, bio })
      })
      const data = await res.json()
      if (data.success) setKit(data.kit)
      else setError(data.error || 'Something went wrong. Try again.')
    } catch {
      setError('Network error. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '32px', padding: '24px', borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(80,30,180,0.08) 100%)',
        border: '1px solid rgba(124,58,237,0.25)', boxShadow: '0 0 40px rgba(124,58,237,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'rgba(124,58,237,0.3)',
            border: '1px solid rgba(124,58,237,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={20} color="#C4A0FF" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0,
            background: 'linear-gradient(135deg, #ffffff 40%, #C4A0FF 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            AI Press Kit Generator
          </h1>
        </div>
        <p style={{ color: '#8B8B9E', fontSize: '14px', margin: 0, paddingLeft: '54px' }}>
          Write your bio in your own words — the AI handles the rest.
        </p>
      </div>

      {/* Form */}
      <div style={{ ...S.card, borderColor: 'rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.05)' }}>

        {/* Bio */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ ...S.label, fontSize: '14px', color: 'white', fontWeight: 600 }}>
            Your Bio <span style={{ color: '#9CA3AF', fontWeight: 400 }}>— write it yourself, in your own voice *</span>
          </label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder={"E.g. I started DJing at house parties in LA two years ago and somehow ended up playing Palm Tree Festival. I play tech house — think heavy bass, hypnotic loops, the kind of sets where people miss their Uber home. Influences are Fisher, Mau P, Cloonee. I'm @livpiress on Instagram."}
            rows={6}
            style={{ ...S.input, resize: 'vertical', lineHeight: 1.6 }}
          />
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
            Don&apos;t overthink it. The more real, the better. {bio.length > 0 && `(${bio.length} chars)`}
          </div>
        </div>

        {/* Quick fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div>
            <label style={S.label}>Artist Name</label>
            <input style={S.input} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label style={S.label}>City</label>
            <input style={S.input} placeholder="Los Angeles" value={city} onChange={e => setCity(e.target.value)} />
          </div>
          <div>
            <label style={S.label}>Instagram</label>
            <input style={S.input} placeholder="@handle" value={instagram} onChange={e => setInstagram(e.target.value)} />
          </div>
        </div>

        {/* Photo upload */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ ...S.label, fontSize: '14px', color: 'white', fontWeight: 600 }}>
            Photos <span style={{ color: '#9CA3AF', fontWeight: 400 }}>— headshots, live shots, promo pics (up to 5)</span>
          </label>
          <input ref={photoRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={addPhotos} />
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {photos.map((p, i) => (
              <div key={i} style={{ position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.preview} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
                <button onClick={() => setPhotos(ps => ps.filter((_, j) => j !== i))}
                  style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px',
                    borderRadius: '50%', background: '#EF4444', border: 'none', color: 'white', cursor: 'pointer', fontSize: '12px', lineHeight: '20px', textAlign: 'center' }}>×</button>
              </div>
            ))}
            {photos.length < 5 && (
              <button onClick={() => photoRef.current?.click()} style={{
                width: '80px', height: '80px', borderRadius: '8px', border: '2px dashed rgba(124,58,237,0.4)',
                background: 'rgba(124,58,237,0.05)', color: '#9CA3AF', cursor: 'pointer', fontSize: '24px' }}>+</button>
            )}
          </div>
        </div>

        {/* Logo upload */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ ...S.label, fontSize: '14px', color: 'white', fontWeight: 600 }}>
            Logos <span style={{ color: '#9CA3AF', fontWeight: 400 }}>— your artist logo, DJ tag, or brand mark (up to 3)</span>
          </label>
          <input ref={logoRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={addLogos} />
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {logos.map((l, i) => (
              <div key={i} style={{ position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.preview} alt="" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', padding: '4px' }} />
                <button onClick={() => setLogos(ls => ls.filter((_, j) => j !== i))}
                  style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px',
                    borderRadius: '50%', background: '#EF4444', border: 'none', color: 'white', cursor: 'pointer', fontSize: '12px', lineHeight: '20px', textAlign: 'center' }}>×</button>
              </div>
            ))}
            {logos.length < 3 && (
              <button onClick={() => logoRef.current?.click()} style={{
                width: '80px', height: '80px', borderRadius: '8px', border: '2px dashed rgba(124,58,237,0.4)',
                background: 'rgba(124,58,237,0.05)', color: '#9CA3AF', cursor: 'pointer', fontSize: '13px', padding: '8px' }}>
                + Logo
              </button>
            )}
          </div>
        </div>

        {/* Video upload */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ ...S.label, fontSize: '14px', color: 'white', fontWeight: 600 }}>
            Videos <span style={{ color: '#9CA3AF', fontWeight: 400 }}>— promo clips, set recordings (up to 2)</span>
          </label>
          <input ref={videoRef} type="file" accept="video/*" multiple style={{ display: 'none' }} onChange={addVideos} />
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {videos.map((v, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <video src={v.preview} style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
                <button onClick={() => setVideos(vs => vs.filter((_, j) => j !== i))}
                  style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px',
                    borderRadius: '50%', background: '#EF4444', border: 'none', color: 'white', cursor: 'pointer', fontSize: '12px', lineHeight: '20px', textAlign: 'center' }}>×</button>
              </div>
            ))}
            {videos.length < 2 && (
              <button onClick={() => videoRef.current?.click()} style={{
                width: '120px', height: '80px', borderRadius: '8px', border: '2px dashed rgba(124,58,237,0.4)',
                background: 'rgba(124,58,237,0.05)', color: '#9CA3AF', cursor: 'pointer', fontSize: '13px', padding: '8px' }}>
                + Add Video
              </button>
            )}
          </div>
        </div>

        {error && <p style={{ color: '#F87171', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

        <button onClick={generate} disabled={loading} style={{
          width: '100%', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer', border: 'none',
          background: loading ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, #7C3AED, #9F67FF)',
          color: 'white', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        }}>
          <Sparkles size={16} />
          {loading ? 'Building your kit...' : 'Generate Press Kit'}
        </button>
      </div>

      {/* Results */}
      {kit && (
        <div>
          {kitPhotos.length > 0 && (
            <div style={S.card}>
              <SectionHeader icon={<Camera size={16} />} title="Your Photos" />
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {kitPhotos.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt="" style={{ height: '120px', width: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
                ))}
              </div>
            </div>
          )}

          {kitLogos.length > 0 && (
            <div style={S.card}>
              <SectionHeader icon={<PenTool size={16} />} title="Your Logos" />
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                {kitLogos.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt="" style={{ height: '80px', width: 'auto', maxWidth: '160px', objectFit: 'contain',
                    borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', padding: '8px' }} />
                ))}
              </div>
            </div>
          )}

          {kitVideos.length > 0 && (
            <div style={S.card}>
              <SectionHeader icon={<Video size={16} />} title="Your Videos" />
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {kitVideos.map((url, i) => (
                  <video key={i} src={url} controls style={{ height: '160px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
                ))}
              </div>
            </div>
          )}

          <div style={S.card}>
            <SectionHeader icon={<FileText size={16} />} title="Copy" />
            <Block label="Polished Bio" text={kit.bio_refined} />
            <Block label="Booking Pitch (for venues)" text={kit.booking_pitch} />
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#9F67FF', display: 'block', marginBottom: '8px' }}>Genre Tags</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {kit.genre_tags.map((t, i) => (
                  <span key={i} style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', color: '#9F67FF' }}>{t}</span>
                ))}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#9F67FF', display: 'block', marginBottom: '8px' }}>One-Liners</span>
              {kit.one_liners.map((l, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#E5E7EB' }}>{l}</span>
                  <CopyBtn text={l} />
                </div>
              ))}
            </div>
          </div>

          <div style={S.card}>
            <SectionHeader icon={<Smartphone size={16} />} title="Story Captions" />
            {kit.story_captions.map((sc, i) => (
              <div key={i} style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#9F67FF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{sc.type}</span>
                  <CopyBtn text={sc.caption} />
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#E5E7EB', margin: 0 }}>{sc.caption}</p>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <SectionHeader icon={<LayoutTemplate size={16} />} title="Canva Graphics Brief" />
            <Block label="Headline" text={kit.canva_brief.headline} />
            <Block label="Subline" text={kit.canva_brief.subline} />
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#9F67FF', display: 'block', marginBottom: '8px' }}>Mood Keywords</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {kit.canva_brief.mood_keywords.map((k, i) => (
                  <span key={i} style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#E5E7EB' }}>{k}</span>
                ))}
              </div>
            </div>
            <Block label="Color / Mood Direction" text={kit.canva_brief.color_direction} />
          </div>

          <div style={S.card}>
            <SectionHeader icon={<Film size={16} />} title="Promo Reel Script (20 sec)" />
            <p style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '16px' }}>Shot list for a self-shot promo clip</p>
            {[
              { icon: <Film size={13} />, label: 'Hook (0–3 sec)', text: kit.video_script.hook },
              { icon: <Zap size={13} />, label: 'Middle (4–15 sec)', text: kit.video_script.middle },
              { icon: <Target size={13} />, label: 'CTA (16–20 sec)', text: kit.video_script.cta },
              { icon: <Music size={13} />, label: 'Music Direction', text: kit.video_script.music_note },
            ].map((item, i) => (
              <Block key={i} label={item.label} text={item.text} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
