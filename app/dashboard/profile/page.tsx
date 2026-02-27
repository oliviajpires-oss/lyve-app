'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const GENRES = ['Tech House', 'Deep House', 'Melodic Techno', 'Afro House', 'Minimal', 'Techno', 'House', 'Drum & Bass', 'Trance', 'Ambient', 'Hip-Hop', 'Electronic', 'Other']

export default function ProfilePage() {
  const [form, setForm] = useState({
    display_name: '', username: '', bio: '', genre: '', location: '',
    instagram: '', soundcloud: '', spotify: '', website: '',
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setForm({ ...form, ...data })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.from('profiles').upsert({ id: userId, ...form, updated_at: new Date().toISOString() })
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

  return (
    <div style={{ maxWidth: '680px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>My Profile</h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px' }}>This is what venues and bookers see on your public Lyve page.</p>
      </div>

      <form onSubmit={handleSave}>
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

        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '15px', color: '#9F67FF' }}>Genre & Vibe</h3>
          <div style={{ marginBottom: '16px' }}>
            <label>Primary Genre</label>
            <select className="input" value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })}
              style={{ cursor: 'pointer' }}>
              <option value="">Select genre...</option>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

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
