'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { CheckCircle2 } from 'lucide-react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function CalendarPage() {
  const [today] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [busySlots, setBusySlots] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState('')
  const [gcalConnected] = useState(false)
  const [activeDate, setActiveDate] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('availability')
        .select('date')
        .eq('artist_id', user.id)
        .eq('available', false)
      if (data) setBusySlots(new Set(data.map((d: { date: string }) => d.date)))
    })
  }, [])

  const toggleSlot = async (dateStr: string, slot: 'day' | 'night') => {
    const supabase = createClient()
    const key = `${dateStr}_${slot}`
    const newBusy = new Set(busySlots)

    if (newBusy.has(key)) {
      newBusy.delete(key)
      await supabase.from('availability').delete().eq('artist_id', userId).eq('date', key)
    } else {
      newBusy.add(key)
      await supabase.from('availability').upsert({ artist_id: userId, date: key, available: false })
    }
    setBusySlots(newBusy)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth, year, month }
  }

  const { firstDay, daysInMonth, year, month } = getDaysInMonth(currentMonth)
  const prevMonth = () => { setActiveDate(null); setCurrentMonth(new Date(year, month - 1)) }
  const nextMonth = () => { setActiveDate(null); setCurrentMonth(new Date(year, month + 1)) }

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>Calendar & Availability</h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Mark when you&apos;re unavailable — by day, night, or both.</p>
      </div>

      {/* Google Calendar connect banner */}
      <div style={{ marginBottom: '24px', padding: '20px 24px', borderRadius: '14px',
        background: gcalConnected ? 'rgba(52,211,153,0.06)' : 'linear-gradient(135deg, rgba(66,133,244,0.1), rgba(52,168,83,0.06))',
        border: gcalConnected ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(66,133,244,0.25)',
        boxShadow: gcalConnected ? 'none' : '0 0 30px rgba(66,133,244,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            <svg viewBox="0 0 24 24" width="26" height="26">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {gcalConnected && <CheckCircle2 size={14} color="#34d399" />}
              {gcalConnected ? 'Google Calendar Connected' : 'Connect Google Calendar'}
            </div>
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
              {gcalConnected
                ? 'Your availability syncs automatically from Google Calendar.'
                : 'Sync your calendar so venues only see your real open dates — no manual updates.'}
            </p>
          </div>
          {!gcalConnected && (
            <button style={{ fontSize: '13px', padding: '10px 20px', flexShrink: 0, cursor: 'pointer',
              borderRadius: '8px', fontWeight: 600, border: 'none', color: 'white',
              background: 'linear-gradient(135deg, #4285F4, #34A853)',
              boxShadow: '0 0 16px rgba(66,133,244,0.3)' }}
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
            const isPast = new Date(dateStr) < new Date(today.toISOString().split('T')[0])
            const dayBusy = busySlots.has(`${dateStr}_day`)
            const nightBusy = busySlots.has(`${dateStr}_night`)
            const isActive = activeDate === dateStr

            // Background color: both busy = red, one = yellow, none = default
            const bgColor = (dayBusy && nightBusy)
              ? 'rgba(239,68,68,0.2)'
              : (dayBusy || nightBusy)
              ? 'rgba(251,191,36,0.15)'
              : isToday
              ? 'rgba(124,58,237,0.3)'
              : 'rgba(255,255,255,0.03)'

            return (
              <div key={day} style={{ position: 'relative' }}>
                <button
                  onClick={() => !isPast && setActiveDate(isActive ? null : dateStr)}
                  style={{
                    width: '100%',
                    padding: '8px 4px',
                    borderRadius: '6px',
                    border: isActive ? '1px solid rgba(124,58,237,0.6)' : 'none',
                    cursor: isPast ? 'default' : 'pointer',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: isToday ? 700 : 400,
                    background: bgColor,
                    color: (dayBusy && nightBusy) ? '#f87171' : (dayBusy || nightBusy) ? '#fbbf24' : isPast ? '#555' : isToday ? '#9F67FF' : 'white',
                    transition: 'all 0.15s',
                    outline: isToday && !isActive ? '1px solid rgba(124,58,237,0.5)' : 'none'
                  }}>
                  <div>{day}</div>
                  {/* Slot indicators */}
                  {!isPast && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '3px' }}>
                      <span style={{ fontSize: '8px', opacity: dayBusy ? 1 : 0.3 }}>☀️</span>
                      <span style={{ fontSize: '8px', opacity: nightBusy ? 1 : 0.3 }}>🌙</span>
                    </div>
                  )}
                </button>

                {/* Slot popover */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                    background: '#1a1a2e',
                    border: '1px solid rgba(124,58,237,0.4)',
                    borderRadius: '10px',
                    padding: '10px',
                    marginTop: '4px',
                    minWidth: '110px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSlot(dateStr, 'day') }}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: dayBusy ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.06)',
                        color: dayBusy ? '#fbbf24' : '#9CA3AF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                      ☀️ Day {dayBusy ? '(Busy)' : '(Free)'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSlot(dateStr, 'night') }}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: nightBusy ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.06)',
                        color: nightBusy ? '#fbbf24' : '#9CA3AF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                      🌙 Night {nightBusy ? '(Busy)' : '(Free)'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '16px', fontSize: '12px', color: '#9CA3AF', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }} />
            Fully Booked
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }} />
            Partially Booked
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }} />
            Available
          </div>
        </div>
        <p style={{ marginTop: '10px', fontSize: '12px', color: '#9CA3AF' }}>
          Click a date to toggle ☀️ day and 🌙 night availability independently.
        </p>
      </div>
    </div>
  )
}
