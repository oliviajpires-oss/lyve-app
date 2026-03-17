'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Eye, Inbox, Radio, CheckCircle2, Circle, CalendarDays, Building2, Upload, MapPin } from 'lucide-react'

type Profile = {
  display_name?: string
  username?: string
  bio?: string
  genre?: string
}

type User = {
  user_metadata?: { full_name?: string }
}

type Booking = {
  id: string
  venue_name: string
  event_date: string
  message?: string
}

export default function DashboardHome() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [userId, setUserId] = useState('')
  const [upcomingEvents, setUpcomingEvents] = useState<Booking[]>([])
  const [bookedVenues, setBookedVenues] = useState<Booking[]>([])
  const [requestCount, setRequestCount] = useState(0)
  const [footageUploading, setFootageUploading] = useState(false)
  const [footageUploaded, setFootageUploaded] = useState(false)
  const footageRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUser(user as User)
      setUserId(user.id)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)

      const today = new Date().toISOString().split('T')[0]
      const { data: bookings } = await supabase
        .from('venue_requests').select('*')
        .eq('artist_id', user.id).eq('status', 'accepted')
        .order('event_date', { ascending: true })

      if (bookings) {
        setUpcomingEvents(bookings.filter(b => b.event_date >= today))
        setBookedVenues(bookings)
      }

      const { count } = await supabase
        .from('venue_requests').select('*', { count: 'exact', head: true })
        .eq('artist_id', user.id).eq('status', 'pending')
      setRequestCount(count || 0)
    })
  }, [])

  const uploadFootage = async (files: FileList) => {
    if (!userId) return
    setFootageUploading(true)
    const supabase = createClient()
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/footage/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('assets').upload(path, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(path)
        await supabase.from('assets').insert({
          artist_id: userId, name: file.name, type: 'footage', url: publicUrl,
          on_profile: false, in_press_kit: false
        })
      }
    }
    setFootageUploading(false)
    setFootageUploaded(true)
    setTimeout(() => setFootageUploaded(false), 3000)
  }

  const name = profile?.display_name || user?.user_metadata?.full_name || 'Artist'
  const profileComplete = !!(profile?.bio && profile?.genre)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '6px',
          background: 'linear-gradient(135deg, #ffffff 40%, #C4A0FF 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Welcome back, {name}
        </h1>
        <p style={{ color: '#6B7280', fontSize: '14px' }}>Here&apos;s what&apos;s happening with your Lyve profile.</p>
      </div>

      {/* Setup checklist */}
      {!profileComplete && (
        <div className="card" style={{ marginBottom: '24px', borderColor: 'rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.08)' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '15px' }}>Finish setting up your profile</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { done: !!profile?.display_name, label: 'Add your artist name', href: '/dashboard/profile' },
              { done: !!profile?.bio, label: 'Write your bio', href: '/dashboard/profile' },
              { done: !!profile?.genre, label: 'Set your genre & vibe', href: '/dashboard/profile' },
              { done: false, label: 'Upload a press photo or mix', href: '/dashboard/assets' },
            ].map((item, i) => (
              <Link key={i} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                borderRadius: '8px', background: 'rgba(255,255,255,0.04)', color: item.done ? '#9CA3AF' : 'white',
                textDecoration: item.done ? 'line-through' : 'none', fontSize: '14px'
              }}>
                {item.done ? <CheckCircle2 size={16} color="#34d399" /> : <Circle size={16} color="#9CA3AF" />}
                {item.label}
                {!item.done && <span style={{ marginLeft: 'auto', color: '#7C3AED', fontSize: '12px' }}>Complete →</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Profile Views', value: '—', icon: <Eye size={18} />, bg: 'rgba(59,130,246,0.15)', color: '#60A5FA', border: 'rgba(59,130,246,0.25)' },
          { label: 'Pending Requests', value: requestCount || '—', icon: <Inbox size={18} />, bg: 'rgba(124,58,237,0.2)', color: '#9F67FF', border: 'rgba(124,58,237,0.3)' },
          { label: 'Profile Status', value: profileComplete ? 'Live' : 'Incomplete', icon: <Radio size={18} />, bg: profileComplete ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.07)', color: profileComplete ? '#34d399' : '#9CA3AF', border: profileComplete ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.1)' },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <div style={{ width: 38, height: 38, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: stat.bg, border: `1px solid ${stat.border}`, color: stat.color }}>
                {stat.icon}
              </div>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px', color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Upcoming Events */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FB923C' }}>
            <CalendarDays size={16} />
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Upcoming Shows</h3>
        </div>

        {upcomingEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <div style={{ fontSize: '13px', color: '#4B5563', marginBottom: '8px' }}>No upcoming shows yet.</div>
            <Link href="/dashboard/requests" style={{ fontSize: '13px', color: '#9F67FF' }}>View booking requests →</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {upcomingEvents.map(ev => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px',
                borderRadius: '10px', background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.15)' }}>
                <div style={{ textAlign: 'center', minWidth: '44px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#FB923C', lineHeight: 1 }}>
                    {new Date(ev.event_date).getDate()}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {new Date(ev.event_date).toLocaleString('default', { month: 'short' })}
                  </div>
                </div>
                <div style={{ width: '1px', height: '32px', background: 'rgba(251,146,60,0.2)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{ev.venue_name}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    {new Date(ev.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Footage */}
      <div style={{ marginBottom: '20px', padding: '20px 24px', borderRadius: '14px',
        background: 'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(16,185,129,0.04))',
        border: '1px solid rgba(52,211,153,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'rgba(52,211,153,0.15)',
              border: '1px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
              <Upload size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '2px' }}>Just played a show?</div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>Upload photos and videos while it&apos;s fresh — they&apos;ll save to your assets.</div>
            </div>
          </div>
          <div style={{ flexShrink: 0, marginLeft: '16px' }}>
            <input ref={footageRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }}
              onChange={e => e.target.files && uploadFootage(e.target.files)} />
            <button onClick={() => footageRef.current?.click()} style={{
              padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              cursor: footageUploading ? 'not-allowed' : 'pointer', border: 'none',
              background: footageUploaded ? 'rgba(52,211,153,0.3)' : 'rgba(52,211,153,0.2)',
              color: footageUploaded ? '#34d399' : '#34d399',
              boxShadow: '0 0 16px rgba(52,211,153,0.1)'
            }}>
              {footageUploaded ? '✓ Uploaded!' : footageUploading ? 'Uploading...' : 'Upload Footage'}
            </button>
          </div>
        </div>
      </div>

      {/* Venues Booked Through Lyve */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9F67FF' }}>
            <Building2 size={16} />
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Booked Through Lyve</h3>
        </div>

        {bookedVenues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <div style={{ fontSize: '13px', color: '#4B5563', marginBottom: '6px' }}>No bookings yet.</div>
            <div style={{ fontSize: '12px', color: '#374151' }}>When venues book you through Lyve, they&apos;ll show up here.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {bookedVenues.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                borderRadius: '8px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '7px', background: 'rgba(124,58,237,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9F67FF', flexShrink: 0 }}>
                  <MapPin size={13} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{b.venue_name}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    {new Date(b.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px',
                  background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                  Confirmed
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Public profile link */}
      {profile?.username && (
        <div style={{ padding: '20px 24px', borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(80,30,180,0.08))',
          border: '1px solid rgba(124,58,237,0.3)',
          boxShadow: '0 0 30px rgba(124,58,237,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px',
              background: 'linear-gradient(135deg, #fff 50%, #C4A0FF 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Your public Lyve page is live
            </div>
            <div style={{ fontSize: '13px', color: '#6B7280' }}>getlyve.ai/{profile.username}</div>
          </div>
          <Link href={`/${profile.username}`} target="_blank" className="btn-primary" style={{ fontSize: '13px', padding: '10px 20px' }}>
            View Profile →
          </Link>
        </div>
      )}
    </div>
  )
}
