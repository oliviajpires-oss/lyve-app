'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { X, Camera } from 'lucide-react'

const AVATAR_BUCKET = 'assets'

const GENRES = [
  'Tech House', 'Deep House', 'Afro House', 'Bass House', 'Nu-Disco', 'Funky House', 'Chicago House', 'Soulful House',
  'Techno', 'Melodic Techno', 'Industrial Techno', 'Detroit Techno', 'Dark Techno', 'Minimal',
  'Trance', 'Progressive Trance', 'Psy-Trance', 'Ambient', 'Downtempo', 'Chill-Out', 'Electronica',
  'Drum & Bass', 'Liquid DnB', 'Jungle', 'Neurofunk',
  'Dubstep', 'Riddim', 'Future Bass', 'Trap', 'UK Bass', 'Grime', 'UK Garage',
  'Breaks', 'Breakbeat',
  'Hip-Hop', 'R&B', 'Lo-Fi Hip-Hop',
  'Pop', 'Dance-Pop', 'Disco', 'Funk', 'Electro Pop',
  'Latin House', 'Reggaeton', 'Latin Trap',
  'Afrobeats', 'Dancehall', 'Baile Funk',
  'Experimental', 'Other',
]

export default function ProfilePage() {
  const [form, setForm] = useState({
    display_name: '', username: '', bio: '', genre: '', location: '',
    instagram: '', soundcloud: '', spotify: '', website: '',
  })
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [otherGenre, setOtherGenre] = useState('')
  const [venues, setVenues] = useState<string[]>([])
  const [venueInput, setVenueInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const venueInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setForm({ ...form, ...data })
        if (data.avatar_url) setAvatarUrl(data.avatar_url)
        if (data.genre) {
          const saved = data.genre.split(',').map((g: string) => g.trim()).filter(Boolean)
          const known = saved.filter((g: string) => GENRES.includes(g) || g === 'Other')
          const custom = saved.filter((g: string) => !GENRES.includes(g))
          if (custom.length > 0) {
            setSelectedGenres([...known, 'Other'])
            setOtherGenre(custom[0])
          } else {
            setSelectedGenres(known)
          }
        }
        if (data.notable_venues) {
          try { setVenues(JSON.parse(data.notable_venues)) } catch { setVenues([]) }
        }
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleGenre = (g: string) => {
    if (selectedGenres.includes(g)) {
      setSelectedGenres(prev => prev.filter(x => x !== g))
      if (g === 'Other') setOtherGenre('')
    } else {
      if (selectedGenres.length >= 5) return
      setSelectedGenres(prev => [...prev, g])
    }
  }

  const addVenue = () => {
    const v = venueInput.trim()
    if (v && !venues.includes(v)) {
      setVenues(prev => [...prev, v])
      setVenueInput('')
    }
  }

  const removeVenue = (v: string) => setVenues(prev => prev.filter(x => x !== v))

  const handleVenueKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addVenue() }
    if (e.key === ',' ) { e.preventDefault(); addVenue() }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setAvatarUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`
    const supabase = createClient()
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadError) { setAvatarUploading(false); return }
    const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
    const publicUrl = urlData.publicUrl
    await supabase.from('profiles').upsert({ id: userId, avatar_url: publicUrl, updated_at: new Date().toISOString() })
    setAvatarUrl(publicUrl)
    setAvatarUploading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const genreList = selectedGenres.map(g => g === 'Other' && otherGenre.trim() ? otherGenre.trim() : g)
    const genreStr = genreList.join(', ')
    const supabase = createClient()
    await supabase.from('profiles').upsert({
      id: userId, ...form, genre: genreStr,
      notable_venues: JSON.stringify(venues),
      updated_at: new Date().toISOString()
    })
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const field = (key: keyof typeof form, label: string, placeholder: string, type = 'text', multi = false) => (
    <div style={{ marginBottom: '20px' }}>
      <label>{label}</label>
      {multi ? (
        <textarea className="input" placeholder={placeholder} rows={4}
          value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
          style={{ resize: 'vertical', fontFamily: 'inherit' }} />
      ) : (
        <input className="input" type={type} placeholder={placeholder}
          value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
      )}
    </div>
  )

  const showOther = selectedGenres.includes('Other')

  return (
    <div style={{ maxWidth: '680px' }}>

      {/* ── Artist Identity Hero ────────────────────────────────── */}
      <div style={{
        marginBottom: '32px', padding: '28px', borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(40,14,100,0.25) 100%)',
        border: '1px solid rgba(124,58,237,0.3)',
        boxShadow: '0 0 60px rgba(124,58,237,0.12)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background glow orb */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(159,103,255,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              onClick={() => !avatarUploading && fileInputRef.current?.click()}
              style={{
                width: '96px', height: '96px', borderRadius: '50%', cursor: avatarUploading ? 'wait' : 'pointer',
                background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, rgba(124,58,237,0.5), rgba(80,30,180,0.6))',
                border: '3px solid rgba(159,103,255,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', boxShadow: '0 0 24px rgba(124,58,237,0.4)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '36px' }}>🎛️</span>
              )}
            </div>
            {/* Camera badge */}
            <div
              onClick={() => !avatarUploading && fileInputRef.current?.click()}
              style={{
                position: 'absolute', bottom: '2px', right: '2px',
                width: '26px', height: '26px', borderRadius: '50%',
                background: '#7C3AED', border: '2px solid #0f0d1a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Camera size={12} color="white" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
          </div>

          {/* Identity preview */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '22px', fontWeight: 800, marginBottom: '4px',
              background: 'linear-gradient(135deg, #ffffff 40%, #C4A0FF 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {form.display_name || <span style={{ opacity: 0.4, fontSize: '18px' }}>Your Artist Name</span>}
            </div>
            <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '10px' }}>
              {form.username ? `@${form.username}` : <span style={{ opacity: 0.4 }}>@username</span>}
              {form.location && <span style={{ marginLeft: '10px' }}>· 📍 {form.location}</span>}
            </div>
            {selectedGenres.length > 0 ? (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {selectedGenres.slice(0, 3).map(g => (
                  <span key={g} style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                    background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(159,103,255,0.4)', color: '#C4A0FF',
                  }}>{g === 'Other' && otherGenre ? otherGenre : g}</span>
                ))}
                {selectedGenres.length > 3 && <span style={{ fontSize: '11px', color: '#6B7280', padding: '3px 6px' }}>+{selectedGenres.length - 3}</span>}
              </div>
            ) : (
              <span style={{ fontSize: '12px', color: '#4B5563' }}>No genres selected yet</span>
            )}
          </div>
        </div>

        {/* Upload hint */}
        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>
            {avatarUploading ? (
              <span style={{ color: '#9F67FF' }}>Uploading...</span>
            ) : avatarUrl ? (
              <span>
                <span style={{ color: '#34d399' }}>✓ Photo set</span>
                <span style={{ marginLeft: '8px', cursor: 'pointer', color: '#7C3AED' }}
                  onClick={() => fileInputRef.current?.click()}>Change →</span>
              </span>
            ) : (
              <span>
                Click the photo to upload · Use your press photo or Spotify artist image
              </span>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* Basic Info */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '15px', color: '#9F67FF' }}>Basic Info</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label>Artist / DJ Name</label>
              <input className="input" placeholder="DJ Neon" value={form.display_name}
                onChange={e => setForm({ ...form, display_name: e.target.value })} />
            </div>
            <div>
              <label>Username</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '12px', color: '#9CA3AF', fontSize: '14px' }}>@</span>
                <input className="input" placeholder="djneon" value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  style={{ paddingLeft: '28px' }} />
              </div>
            </div>
          </div>
          {field('location', 'Location', 'Los Angeles, CA')}
          {field('bio', 'Bio', 'Tell venues about your sound, background, and what makes your sets unique...', 'text', true)}
        </div>

        {/* Genre & Vibe */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '4px', fontSize: '15px', color: '#9F67FF' }}>Genre & Vibe</h3>
          <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '16px' }}>
            Pick up to 5 — {selectedGenres.length}/5 selected
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {GENRES.map(g => {
              const active = selectedGenres.includes(g)
              const disabled = !active && selectedGenres.length >= 5
              return (
                <button key={g} type="button" onClick={() => !disabled && toggleGenre(g)} style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '13px',
                  fontWeight: active ? 500 : 400, cursor: disabled ? 'not-allowed' : 'pointer',
                  border: active ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.1)',
                  background: active ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
                  color: active ? '#9F67FF' : disabled ? '#555' : '#9CA3AF',
                  transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
                }}>
                  {g}
                </button>
              )
            })}
          </div>
          {showOther && (
            <div style={{ marginTop: '12px' }}>
              <label>What genre?</label>
              <input className="input" placeholder="e.g. Tribal House, Italo Disco, Jersey Club..."
                value={otherGenre} onChange={e => setOtherGenre(e.target.value)} />
            </div>
          )}
        </div>

        {/* Notable Venues */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '4px', fontSize: '15px', color: '#9F67FF' }}>Notable Places Played</h3>
          <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '16px' }}>
            Add venues, festivals, or clubs you&apos;ve performed at. Press Enter or comma to add each one.
          </p>
          {venues.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {venues.map(v => (
                <div key={v} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '5px 12px', borderRadius: '20px', fontSize: '13px',
                  background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#9F67FF'
                }}>
                  {v}
                  <button type="button" onClick={() => removeVenue(v)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    color: '#9F67FF', display: 'flex', alignItems: 'center', opacity: 0.7
                  }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              ref={venueInputRef}
              className="input"
              placeholder="e.g. Palm Tree Festival, Zouk LA, Exchange LA..."
              value={venueInput}
              onChange={e => setVenueInput(e.target.value)}
              onKeyDown={handleVenueKey}
              style={{ flex: 1 }}
            />
            <button type="button" onClick={addVenue} style={{
              padding: '0 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
              background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)',
              color: '#9F67FF', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap'
            }}>
              Add
            </button>
          </div>
        </div>

        {/* Social Links */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '15px', color: '#9F67FF' }}>Social Links</h3>
          {field('instagram', 'Instagram', '@yourhandle')}
          {field('soundcloud', 'SoundCloud URL', 'soundcloud.com/yourname')}
          {field('spotify', 'Spotify Artist URL', 'open.spotify.com/artist/...')}
          {field('website', 'Website', 'yoursite.com')}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px 28px' }}>
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
          {saved && <span style={{ color: '#34d399', fontSize: '14px' }}>✓ Saved!</span>}
        </div>
      </form>
    </div>
  )
}
