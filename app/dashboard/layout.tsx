'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Home, SlidersHorizontal, FolderOpen, CalendarDays, Inbox, ExternalLink, Users } from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Home', icon: <Home size={15} /> },
  { href: '/dashboard/profile', label: 'My Profile', icon: <SlidersHorizontal size={15} /> },
  { href: '/dashboard/assets', label: 'Press Kit & Assets', icon: <FolderOpen size={15} /> },
  { href: '/dashboard/calendar', label: 'Calendar', icon: <CalendarDays size={15} /> },
  { href: '/dashboard/requests', label: 'Booking Requests', icon: <Inbox size={15} /> },
  { href: '/browse', label: 'Browse Artists', icon: <Users size={15} /> },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email?: string; user_metadata?: Record<string, string> } | null>(null)
  const [profile, setProfile] = useState<{ display_name?: string; username?: string } | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    })
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px', background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '24px 16px', flexShrink: 0,
        position: 'fixed', height: '100vh', overflowY: 'auto'
      }}>
        <div style={{ marginBottom: '32px', paddingLeft: '8px' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #C4A0FF, #7C3AED)', WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block' }}>
            lyve.
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          {NAV.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                borderRadius: '8px', marginBottom: '4px', fontSize: '14px', fontWeight: 400,
                background: active ? 'rgba(124,58,237,0.2)' : 'transparent',
                color: active ? '#C4A0FF' : '#9CA3AF',
                border: active ? '1px solid rgba(124,58,237,0.35)' : '1px solid transparent',
                transition: 'all 0.2s',
                boxShadow: active ? '0 0 12px rgba(124,58,237,0.15)' : 'none',
              }}>
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          {profile?.username && (
            <Link href={`/${profile.username}`} target="_blank" style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
              borderRadius: '8px', fontSize: '13px', color: '#9CA3AF',
              background: 'rgba(124,58,237,0.08)', marginBottom: '8px',
              border: '1px solid rgba(124,58,237,0.15)'
            }}>
              <ExternalLink size={13} /> View Public Profile
            </Link>
          )}
          <div style={{ padding: '8px 12px', fontSize: '13px', color: '#9CA3AF', marginBottom: '8px' }}>
            {profile?.display_name || user?.user_metadata?.full_name || user?.email}
          </div>
          <button onClick={handleSignOut} style={{
            width: '100%', padding: '10px 12px', borderRadius: '8px', fontSize: '13px',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
            color: '#9CA3AF', cursor: 'pointer', textAlign: 'left'
          }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, marginLeft: '240px', padding: '32px', maxWidth: 'calc(100vw - 240px)' }}>
        {children}
      </main>
    </div>
  )
}
