'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Inbox, CalendarDays, Mail, CheckCircle2, XCircle, Clock } from 'lucide-react'

type Request = {
  id: string
  venue_name: string
  venue_email: string
  event_date: string
  message: string
  status: string
  created_at: string
}

type Filter = 'all' | 'pending' | 'accepted' | 'declined'

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [userId, setUserId] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('venue_requests')
        .select('*')
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false })
      setRequests(data || [])
    })
  }, [userId])

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient()
    await supabase.from('venue_requests').update({ status }).eq('id', id)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    accepted: requests.filter(r => r.status === 'accepted').length,
    declined: requests.filter(r => r.status === 'declined').length,
  }

  const visible = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  const STATUS_CONFIG = {
    pending:  { label: 'Pending',  color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)',  glow: 'rgba(251,191,36,0.08)',  icon: <Clock size={13} />,        accent: '#fbbf24' },
    accepted: { label: 'Accepted', color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)',  glow: 'rgba(52,211,153,0.06)',  icon: <CheckCircle2 size={13} />, accent: '#34d399' },
    declined: { label: 'Declined', color: '#f87171', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.25)',  glow: 'transparent',             icon: <XCircle size={13} />,     accent: '#f87171' },
  }

  return (
    <div style={{ maxWidth: '760px' }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>Booking Requests</h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Incoming requests from venues who want to book you.</p>
      </div>

      {/* ── Stats row ─────────────────────────────────────────── */}
      {requests.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {(['pending', 'accepted', 'declined'] as const).map(s => {
            const cfg = STATUS_CONFIG[s]
            return (
              <div key={s} style={{
                padding: '16px 18px', borderRadius: '12px',
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: cfg.color, lineHeight: 1 }}>{counts[s]}</div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: cfg.color }}>{cfg.label}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>request{counts[s] !== 1 ? 's' : ''}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Filter tabs ───────────────────────────────────────── */}
      {requests.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', padding: '4px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', width: 'fit-content' }}>
          {(['all', 'pending', 'accepted', 'declined'] as Filter[]).map(f => {
            const active = filter === f
            const label = f === 'all' ? `All (${counts.all})` : `${STATUS_CONFIG[f].label} (${counts[f]})`
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: active ? 600 : 400,
                border: 'none', cursor: 'pointer',
                background: active ? (f === 'all' ? 'rgba(124,58,237,0.3)' : STATUS_CONFIG[f].bg) : 'transparent',
                color: active ? (f === 'all' ? '#C4A0FF' : STATUS_CONFIG[f].color) : '#9CA3AF',
                transition: 'all 0.15s',
              }}>
                {label}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────── */}
      {requests.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '80px 40px', borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(255,255,255,0.02))',
          border: '1px dashed rgba(255,255,255,0.1)',
        }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '16px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Inbox size={28} color="#9F67FF" />
            </div>
          </div>
          <h3 style={{ marginBottom: '8px', fontSize: '17px' }}>No booking requests yet</h3>
          <p style={{ color: '#6B7280', fontSize: '14px', maxWidth: '320px', margin: '0 auto', lineHeight: 1.6 }}>
            Once your profile is live and venues find you, requests will show up here.
          </p>
        </div>
      )}

      {/* ── No results for filter ─────────────────────────────── */}
      {requests.length > 0 && visible.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280', fontSize: '14px' }}>
          No {filter} requests.
        </div>
      )}

      {/* ── Request cards ─────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {visible.map(req => {
          const cfg = STATUS_CONFIG[req.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
          return (
            <div key={req.id} style={{
              borderRadius: '14px', overflow: 'hidden',
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid rgba(255,255,255,0.07)`,
              boxShadow: req.status === 'pending' ? `0 0 24px ${cfg.glow}` : 'none',
              transition: 'box-shadow 0.2s',
            }}>
              {/* Colored top stripe */}
              <div style={{ height: '3px', background: `linear-gradient(90deg, ${cfg.color}, transparent)`, opacity: 0.6 }} />

              <div style={{ padding: '20px 22px' }}>
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '12px' }}>
                  <div>
                    <h3 style={{ marginBottom: '3px', fontSize: '17px', fontWeight: 700 }}>{req.venue_name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6B7280', fontSize: '13px' }}>
                      <Mail size={12} />
                      {req.venue_email}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                    flexShrink: 0,
                  }}>
                    {cfg.icon}
                    {cfg.label}
                  </div>
                </div>

                {/* Date */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '8px 14px', borderRadius: '8px', marginBottom: req.message ? '12px' : '16px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                  fontSize: '13px', color: '#E5E7EB',
                }}>
                  <CalendarDays size={13} color="#9F67FF" />
                  {new Date(req.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </div>

                {/* Message */}
                {req.message && (
                  <div style={{
                    padding: '12px 14px', borderRadius: '8px', marginBottom: '16px',
                    background: 'rgba(255,255,255,0.025)', borderLeft: `3px solid ${cfg.color}`,
                    fontSize: '14px', color: '#9CA3AF', lineHeight: 1.6, fontStyle: 'italic',
                  }}>
                    &ldquo;{req.message}&rdquo;
                  </div>
                )}

                {/* Actions */}
                {req.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button onClick={() => updateStatus(req.id, 'accepted')} style={{
                      padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
                      background: 'rgba(52,211,153,0.2)', color: '#34d399',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      <CheckCircle2 size={14} /> Accept
                    </button>
                    <button onClick={() => updateStatus(req.id, 'declined')} style={{
                      padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                      background: 'transparent', color: '#9CA3AF',
                    }}>
                      Decline
                    </button>
                    <a href={`mailto:${req.venue_email}`} style={{
                      padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                      border: '1px solid rgba(255,255,255,0.08)', color: '#9CA3AF',
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                    }}>
                      <Mail size={13} /> Reply by Email
                    </a>
                  </div>
                )}

                {req.status === 'accepted' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <a href={`mailto:${req.venue_email}`} style={{
                      padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                      background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
                      color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '6px',
                    }}>
                      <Mail size={13} /> Email Venue
                    </a>
                    <button onClick={() => updateStatus(req.id, 'declined')} style={{
                      padding: '9px 16px', borderRadius: '8px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.06)',
                      background: 'transparent', color: '#6B7280', cursor: 'pointer',
                    }}>
                      Cancel
                    </button>
                  </div>
                )}

                {/* Received timestamp */}
                <div style={{ marginTop: req.status !== 'pending' && req.status !== 'accepted' ? '0' : '12px', fontSize: '11px', color: '#4B5563' }}>
                  Received {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
