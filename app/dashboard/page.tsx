'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

type Profile = {
  display_name?: string
  username?: string
  bio?: string
  genre?: string
  location?: string
}

type User = {
  user_metadata?: { full_name?: string }
}

export default function DashboardHome() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [requestCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user as User)
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
      }
    })
  }, [])

  const name = profile?.display_name || user?.user_metadata?.full_name || 'Artist'
  const profileComplete = !!(profile?.bio && profile?.genre)

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
          Welcome back, {name} 👋
        </h1>
        <p style={{ color: '#9CA3AF' }}>Here&apos;s what&apos;s happening with your Lyve profile.</p>
      </div>

      {/* Setup checklist */}
      {!profileComplete && (
        <div className="card" style={{ marginBottom: '24px', borderColor: 'rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.08)' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '15px' }}>🚀 Finish setting up your profile</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { done: !!profile?.display_name, label: 'Add your artist name', href: '/dashboard/profile' },
              { done: !!profile?.bio, label: 'Write your bio', href: '/dashboard/profile' },
              { done: !!profile?.genre, label: 'Set your genre & vibe', href: '/dashboard/profile' },
              { done: false, label: 'Upload a press kit or mix', href: '/dashboard/assets' },
            ].map((item, i) => (
              <Link key={i} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                borderRadius: '8px', background: 'rgba(255,255,255,0.04)', color: item.done ? '#9CA3AF' : 'white',
                textDecoration: item.done ? 'line-through' : 'none', fontSize: '14px'
              }}>
                <span style={{ fontSize: '16px' }}>{item.done ? '✅' : '⬜'}</span>
                {item.label}
                {!item.done && <span style={{ marginLeft: 'auto', color: '#7C3AED', fontSize: '12px' }}>Complete →</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Profile Views', value: '—', icon: '👀' },
          { label: 'Booking Requests', value: requestCount, icon: '📩' },
          { label: 'Profile Status', value: profileComplete ? 'Live' : 'Incomplete', icon: '🟢' },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ fontSize: '13px', color: '#9CA3AF' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="card">
        <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {[
            { href: '/dashboard/presskit', icon: '✨', label: 'AI Press Kit', desc: 'Generate your bio, captions & reel script' },
            { href: '/dashboard/profile', icon: '🎛️', label: 'Edit Profile', desc: 'Update your bio, genre, socials' },
            { href: '/dashboard/assets', icon: '📁', label: 'Upload Assets', desc: 'Press kit, mixes, promo videos' },
            { href: '/dashboard/requests', icon: '📩', label: 'Booking Requests', desc: 'View incoming venue requests' },
          ].map((action, i) => (
            <Link key={i} href={action.href} style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px',
              borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              transition: 'all 0.2s'
            }}>
              <span style={{ fontSize: '22px' }}>{action.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '3px' }}>{action.label}</div>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{action.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Public profile link */}
      {profile?.username && (
        <div style={{ marginTop: '24px', padding: '16px', borderRadius: '10px',
          background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>Your public Lyve page</div>
            <div style={{ fontSize: '13px', color: '#9CA3AF' }}>getlyve.ai/{profile.username}</div>
          </div>
          <Link href={`/${profile.username}`} target="_blank" className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
            View →
          </Link>
        </div>
      )}
    </div>
  )
}
