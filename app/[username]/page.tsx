'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams } from 'next/navigation'

type Profile = {
  id: string
  display_name?: string
  username?: string
  bio?: string
  genre?: string
  location?: string
  instagram?: string
  soundcloud?: string
  spotify?: string
  website?: string
  avatar_url?: string
}

type Asset = {
  id: string
  name: string
  type: string
  url: string
}

export default function PublicProfilePage() {
  const params = useParams()
  const username = params.username as string
  const [profile, setProfile] = useState<Profile | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [notFound, setNotFound] = useState(false)
  const [showRequest, setShowRequest] = useState(false)
  const [reqForm, setReqForm] = useState({ venue_name: '', venue_email: '', event_date: '', message: '' })
  const [reqSent, setReqSent] = useState(false)
  const [reqLoading, setReqLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('profiles').select('*').eq('username', username).single().then(({ data }) => {
      if (!data) { setNotFound(true); return }
      setProfile(data)
      supabase.from('assets').select('*').eq('artist_id', data.id).order('created_at').then(({ data: a }) => {
        setAssets(a || [])
      })
    })
  }, [username])

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setReqLoading(true)
    const supabase = createClient()
    await supabase.from('venue_requests').insert({
      artist_id: profile?.id, ...reqForm, status: 'pending'
    })
    setReqLoading(false)
    setReqSent(true)
  }

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎛️</div>
        <h2>Artist not found</h2>
        <p style={{ color: '#9CA3AF' }}>No profile found for @{username}</p>
      </div>
    </div>
  )

  if (!profile) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#7C3AED' }}>Loading...</div>
    </div>
  )

  const mixes = assets.filter(a => a.type === 'mix')
  const videos = assets.filter(a => a.type === 'video')
  const photos = assets.filter(a => a.type === 'photo')
  const pressKits = assets.filter(a => a.type === 'press_kit')

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #9F67FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', flexShrink: 0, overflow: 'hidden' }}>
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              '🎛️'
            )}
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>{profile.display_name}</h1>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {profile.genre && <span className="badge">{profile.genre}</span>}
              {profile.location && <span style={{ color: '#9CA3AF', fontSize: '13px' }}>📍 {profile.location}</span>}
            </div>
          </div>
        </div>
        <button onClick={() => setShowRequest(true)} className="btn-primary" style={{ flexShrink: 0 }}>
          📩 Request Booking
        </button>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <p style={{ lineHeight: 1.7, color: '#d1d5db' }}>{profile.bio}</p>
        </div>
      )}

      {/* Social links */}
      {(profile.instagram || profile.soundcloud || profile.spotify || profile.website) && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {profile.instagram && (
            <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noreferrer"
              style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '13px', color: 'white' }}>
              📸 Instagram
            </a>
          )}
          {profile.soundcloud && (
            <a href={profile.soundcloud.startsWith('http') ? profile.soundcloud : `https://${profile.soundcloud}`} target="_blank" rel="noreferrer"
              style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '13px', color: 'white' }}>
              🎵 SoundCloud
            </a>
          )}
          {profile.spotify && (
            <a href={profile.spotify} target="_blank" rel="noreferrer"
              style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '13px', color: 'white' }}>
              💚 Spotify
            </a>
          )}
          {profile.website && (
            <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer"
              style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '13px', color: 'white' }}>
              🌐 Website
            </a>
          )}
        </div>
      )}

      {/* Mixes */}
      {mixes.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#9F67FF' }}>🎵 Mixes & Tracks</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {mixes.map(mix => (
              <div key={mix.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span>🎵</span>
                <span style={{ flex: 1, fontSize: '14px' }}>{mix.name}</span>
                <a href={mix.url} target="_blank" rel="noreferrer" style={{ color: '#7C3AED', fontSize: '13px' }}>Play →</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#9F67FF' }}>🎬 Promo Videos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {videos.map(v => (
              <a key={v.id} href={v.url} target="_blank" rel="noreferrer" style={{ display: 'block', borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎬</div>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{v.name}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#9F67FF' }}>📸 Photos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
            {photos.map(p => (
              <a key={p.id} href={p.url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.name} style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', aspectRatio: '1', display: 'block' }} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Press Kits */}
      {pressKits.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#9F67FF' }}>📄 Press Kit</h2>
          {pressKits.map(pk => (
            <a key={pk.id} href={pk.url} target="_blank" rel="noreferrer" className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
              📄 {pk.name}
            </a>
          ))}
        </div>
      )}

      {/* Booking request modal */}
      {showRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 100 }}
          onClick={e => { if (e.target === e.currentTarget) setShowRequest(false) }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%' }}>
            {reqSent ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <h3 style={{ marginBottom: '8px' }}>Request Sent!</h3>
                <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
                  {profile.display_name} will review your request and get back to you.
                </p>
                <button onClick={() => { setShowRequest(false); setReqSent(false) }} className="btn-primary" style={{ marginTop: '16px' }}>Close</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3>Request Booking — {profile.display_name}</h3>
                  <button onClick={() => setShowRequest(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '20px' }}>✕</button>
                </div>
                <form onSubmit={handleRequest}>
                  <div style={{ marginBottom: '14px' }}>
                    <label>Venue / Event Name</label>
                    <input className="input" placeholder="Club Nova" value={reqForm.venue_name}
                      onChange={e => setReqForm({ ...reqForm, venue_name: e.target.value })} required />
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label>Your Email</label>
                    <input className="input" type="email" placeholder="booking@clubnova.com" value={reqForm.venue_email}
                      onChange={e => setReqForm({ ...reqForm, venue_email: e.target.value })} required />
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label>Event Date</label>
                    <input className="input" type="date" value={reqForm.event_date}
                      onChange={e => setReqForm({ ...reqForm, event_date: e.target.value })} required />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label>Message (optional)</label>
                    <textarea className="input" rows={3} placeholder="Tell the artist about your venue and event..."
                      value={reqForm.message} onChange={e => setReqForm({ ...reqForm, message: e.target.value })}
                      style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                  </div>
                  <button type="submit" className="btn-primary" disabled={reqLoading} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                    {reqLoading ? 'Sending...' : 'Send Booking Request'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '48px', textAlign: 'center', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <a href="https://getlyve.ai" style={{ color: '#9CA3AF', fontSize: '13px' }}>
          Powered by <span style={{ color: '#7C3AED', fontWeight: 600 }}>lyve.</span>
        </a>
      </div>
    </div>
  )
}
