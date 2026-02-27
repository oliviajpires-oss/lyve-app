'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Request = {
  id: string
  venue_name: string
  venue_email: string
  event_date: string
  message: string
  status: string
  created_at: string
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [userId, setUserId] = useState('')

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

  const statusColor = (s: string) => {
    if (s === 'accepted') return { bg: 'rgba(52,211,153,0.1)', color: '#34d399', border: 'rgba(52,211,153,0.3)' }
    if (s === 'declined') return { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.3)' }
    return { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: 'rgba(251,191,36,0.3)' }
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>Booking Requests</h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Incoming requests from venues who want to book you.</p>
      </div>

      {requests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📩</div>
          <h3 style={{ marginBottom: '8px' }}>No booking requests yet</h3>
          <p style={{ color: '#9CA3AF', fontSize: '14px', maxWidth: '300px', margin: '0 auto' }}>
            Once your profile is live and venues find you, requests will show up here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {requests.map(req => {
            const s = statusColor(req.status)
            return (
              <div key={req.id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ marginBottom: '4px' }}>{req.venue_name}</h3>
                    <p style={{ color: '#9CA3AF', fontSize: '13px' }}>{req.venue_email}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                      background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                      {req.status}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '13px', color: '#9CA3AF' }}>
                  <span>📅 {new Date(req.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>

                {req.message && (
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)', fontSize: '14px', color: '#9CA3AF', marginBottom: '16px' }}>
                    &ldquo;{req.message}&rdquo;
                  </div>
                )}

                {req.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => updateStatus(req.id, 'accepted')} className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
                      ✓ Accept
                    </button>
                    <button onClick={() => updateStatus(req.id, 'declined')} className="btn-secondary" style={{ fontSize: '13px', padding: '8px 16px' }}>
                      Decline
                    </button>
                    <a href={`mailto:${req.venue_email}`} className="btn-secondary" style={{ fontSize: '13px', padding: '8px 16px' }}>
                      Reply by Email
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
