'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Search, MapPin, X } from 'lucide-react'

type Artist = {
  id: string
  display_name: string
  username: string
  bio?: string
  genre?: string
  location?: string
  avatar_url?: string
  notable_venues?: string
}

const GENRE_FILTERS = [
  'Tech House', 'Deep House', 'Afro House', 'Bass House', 'Techno', 'Melodic Techno',
  'Minimal', 'Drum & Bass', 'Dubstep', 'Future Bass', 'Trap', 'Hip-Hop', 'R&B',
  'Trance', 'Ambient', 'Downtempo', 'Afrobeats', 'Latin House', 'Breaks', 'Experimental',
]

function ArtistCard({ artist }: { artist: Artist }) {
  const genres = artist.genre?.split(',').map(g => g.trim()).filter(Boolean) || []

  return (
    <Link href={`/${artist.username}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{
        borderRadius: '16px', overflow: 'hidden',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(124,58,237,0.4)'
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(124,58,237,0.15)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(255,255,255,0.07)'
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
        }}
      >
        {/* Hero banner */}
        <div style={{
          height: '80px',
          background: `linear-gradient(135deg, hsl(${(artist.display_name.charCodeAt(0) * 17) % 360}, 60%, 20%) 0%, hsl(${(artist.display_name.charCodeAt(0) * 17 + 60) % 360}, 50%, 10%) 100%)`,
          position: 'relative',
        }}>
          {/* Avatar */}
          <div style={{
            position: 'absolute', bottom: '-28px', left: '20px',
            width: '56px', height: '56px', borderRadius: '50%',
            border: '3px solid #0f0d1a',
            background: `linear-gradient(135deg, hsl(${(artist.display_name.charCodeAt(0) * 17) % 360}, 70%, 35%), hsl(${(artist.display_name.charCodeAt(0) * 17 + 80) % 360}, 60%, 25%))`,
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', flexShrink: 0,
          }}>
            {artist.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={artist.avatar_url} alt={artist.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              '🎛️'
            )}
          </div>
        </div>

        {/* Card body */}
        <div style={{ padding: '36px 20px 20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {artist.display_name}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>@{artist.username}</div>
          </div>

          {artist.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9CA3AF', marginBottom: '12px' }}>
              <MapPin size={11} />
              {artist.location}
            </div>
          )}

          {genres.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '14px' }}>
              {genres.slice(0, 3).map(g => (
                <span key={g} style={{
                  padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                  background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', color: '#9F67FF',
                }}>
                  {g}
                </span>
              ))}
              {genres.length > 3 && (
                <span style={{ padding: '3px 9px', borderRadius: '20px', fontSize: '11px', color: '#6B7280', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  +{genres.length - 3}
                </span>
              )}
            </div>
          )}

          {artist.bio && (
            <p style={{
              fontSize: '12px', color: '#6B7280', lineHeight: 1.5, margin: '0 0 14px',
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
            }}>
              {artist.bio}
            </p>
          )}

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            fontSize: '12px', fontWeight: 600, color: '#9F67FF',
            padding: '7px 14px', borderRadius: '8px',
            background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)',
          }}>
            View Profile →
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function BrowsePage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeGenres, setActiveGenres] = useState<string[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('profiles')
      .select('id, display_name, username, bio, genre, location, avatar_url, notable_venues')
      .not('display_name', 'is', null)
      .not('username', 'is', null)
      .not('genre', 'is', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setArtists((data || []).filter(a => a.display_name && a.username && a.genre))
        setLoading(false)
      })
  }, [])

  const toggleGenre = (g: string) => {
    setActiveGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  const filtered = useMemo(() => {
    let out = artists
    if (search.trim()) {
      const q = search.toLowerCase()
      out = out.filter(a =>
        a.display_name.toLowerCase().includes(q) ||
        a.username.toLowerCase().includes(q) ||
        a.location?.toLowerCase().includes(q) ||
        a.genre?.toLowerCase().includes(q)
      )
    }
    if (activeGenres.length > 0) {
      out = out.filter(a =>
        activeGenres.some(g => a.genre?.toLowerCase().includes(g.toLowerCase()))
      )
    }
    return out
  }, [artists, search, activeGenres])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background, #0f0d1a)', color: 'white' }}>

      {/* ── Top nav ────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(15,13,26,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <Link href="/" style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', flexShrink: 0,
            background: 'linear-gradient(135deg, #C4A0FF, #7C3AED)', WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', backgroundClip: 'text', textDecoration: 'none' }}>
            lyve.
          </Link>

          {/* Search */}
          <div style={{ flex: 1, minWidth: '200px', maxWidth: '480px', position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search artists, genres, cities..."
              style={{
                width: '100%', padding: '9px 12px 9px 34px', borderRadius: '10px', fontSize: '14px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', outline: 'none', boxSizing: 'border-box',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 0 }}>
                <X size={13} />
              </button>
            )}
          </div>

          <Link href="/login" style={{ marginLeft: 'auto', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            background: 'linear-gradient(135deg, #7C3AED, #9F67FF)', color: 'white', textDecoration: 'none', flexShrink: 0 }}>
            For Artists →
          </Link>
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '52px 24px 32px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '20px', marginBottom: '20px',
          background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', fontSize: '12px', fontWeight: 600, color: '#9F67FF' }}>
          🎛️ {artists.length > 0 ? `${artists.length} artist${artists.length !== 1 ? 's' : ''} on Lyve` : 'Artists on Lyve'}
        </div>
        <h1 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '12px', lineHeight: 1.15,
          background: 'linear-gradient(135deg, #ffffff 40%, #C4A0FF 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Find Your Next<br />Headliner
        </h1>
        <p style={{ fontSize: '16px', color: '#6B7280', maxWidth: '440px', margin: '0 auto 0', lineHeight: 1.6 }}>
          Browse independent DJs and artists available for bookings. Send a request directly from their profile.
        </p>
      </div>

      {/* ── Genre filters ──────────────────────────────────────── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 28px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', alignItems: 'center' }}>
          {activeGenres.length > 0 && (
            <button onClick={() => setActiveGenres([])} style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              <X size={11} /> Clear
            </button>
          )}
          {GENRE_FILTERS.map(g => {
            const active = activeGenres.includes(g)
            return (
              <button key={g} onClick={() => toggleGenre(g)} style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: active ? 600 : 400,
                background: active ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
                border: active ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.08)',
                color: active ? '#C4A0FF' : '#9CA3AF', cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {g}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Results ────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 80px' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#6B7280' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎛️</div>
            Loading artists...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>No artists found</h3>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>
              {search || activeGenres.length > 0 ? 'Try adjusting your search or filters.' : 'No artists have signed up yet.'}
            </p>
            {(search || activeGenres.length > 0) && (
              <button onClick={() => { setSearch(''); setActiveGenres([]) }} style={{
                marginTop: '16px', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', color: '#9F67FF', cursor: 'pointer',
              }}>
                Clear all filters
              </button>
            )}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <>
            <div style={{ marginBottom: '20px', fontSize: '13px', color: '#6B7280' }}>
              {filtered.length === artists.length
                ? `${artists.length} artist${artists.length !== 1 ? 's' : ''}`
                : `${filtered.length} of ${artists.length} artists`}
              {activeGenres.length > 0 && ` · ${activeGenres.join(', ')}`}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '16px',
            }}>
              {filtered.map(artist => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: '#4B5563' }}>
          Are you a DJ or artist?{' '}
          <Link href="/signup" style={{ color: '#7C3AED', fontWeight: 600 }}>Create your Lyve profile →</Link>
        </p>
      </div>
    </div>
  )
}
