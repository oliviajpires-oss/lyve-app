'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function CalendarPage() {
  const [today] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [busyDates, setBusyDates] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState('')
  const [gcalConnected] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('availability').select('date').eq('artist_id', user.id).eq('available', false)
      if (data) setBusyDates(new Set(data.map((d: { date: string }) => d.date)))
    })
  }, [])

  const toggleDate = async (dateStr: string) => {
    const supabase = createClient()
    const newBusy = new Set(busyDates)
    if (newBusy.has(dateStr)) {
      newBusy.delete(dateStr)
      await supabase.from('availability').delete().eq('artist_id', userId).eq('date', dateStr)
    } else {
      newBusy.add(dateStr)
      await supabase.from('availability').upsert({ artist_id: userId, date: dateStr, available: false })
    }
    setBusyDates(newBusy)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth, year, month }
  }

  const { firstDay, daysInMonth, year, month } = getDaysInMonth(currentMonth)
  const prevMonth = () => setCurrentMonth(new Date(year, month - 1))
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1))

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>Calendar & Availability</h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Mark dates you&apos;re unavailable so venues only request open dates.</p>
      </div>

      {/* Google Calendar connect banner */}
      <div className="card" style={{ marginBottom: '24px', borderColor: gcalConnected ? 'rgba(52,211,153,0.3)' : 'rgba(124,58,237,0.3)', background: gcalConnected ? 'rgba(52,211,153,0.05)' : 'rgba(124,58,237,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '32px' }}>📆</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
              {gcalConnected ? '✅ Google Calendar Connected' : 'Connect Google Calendar'}
            </div>
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
              {gcalConnected
                ? 'Your availability syncs automatically from Google Calendar.'
                : 'Sync your Google Calendar so your availability is always accurate — no manual updates needed.'}
            </p>
          </div>
          {!gcalConnected && (
            <button className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px', flexShrink: 0 }}
              onClick={() => alert('Google Calendar OAuth coming soon! For now, mark dates manually below.')}>
              Connect
            </button>
          )}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="card">
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '18px' }}>←</button>
          <h3 style={{ fontWeight: 600 }}>{MONTHS[month]} {year}</h3>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '18px' }}>→</button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px' }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '12px', color: '#9CA3AF', fontWeight: 600, padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Date grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isToday = dateStr === today.toISOString().split('T')[0]
            const isBusy = busyDates.has(dateStr)
            const isPast = new Date(dateStr) < new Date(today.toISOString().split('T')[0])

            return (
              <button key={day} onClick={() => !isPast && toggleDate(dateStr)} style={{
                padding: '8px 4px', borderRadius: '6px', border: 'none', cursor: isPast ? 'default' : 'pointer',
                textAlign: 'center', fontSize: '13px', fontWeight: isToday ? 700 : 400,
                background: isBusy ? 'rgba(239,68,68,0.2)' : isToday ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.03)',
                color: isBusy ? '#f87171' : isPast ? '#555' : isToday ? '#9F67FF' : 'white',
                transition: 'all 0.15s',
                outline: isToday ? '1px solid rgba(124,58,237,0.5)' : 'none'
              }}>
                {day}
              </button>
            )
          })}
        </div>

        <div style={{ marginTop: '16px', display: 'flex', gap: '16px', fontSize: '12px', color: '#9CA3AF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }} />
            Busy / Unavailable
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }} />
            Available
          </div>
        </div>
        <p style={{ marginTop: '12px', fontSize: '12px', color: '#9CA3AF' }}>
          Click any date to toggle busy/available. Venues will only see available dates when browsing.
        </p>
      </div>
    </div>
  )
}
