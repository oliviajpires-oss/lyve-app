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
  const [showIcloudModal, setShowIcloudModal] = useState(false)
  const [icloudStep, setIcloudStep] = useState(1)
  const [icloudId, setIcloudId] = useState('')
  const [icloudPass, setIcloudPass] = useState('')
  const [icloudStatus, setIcloudStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null)
  const [icloudLoading, setIcloudLoading] = useState(false)
  const [icloudConnected, setIcloudConnected] = useState(false)

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

  const syncIcloud = async () => {
    if (!icloudId || !icloudPass) return
    setIcloudLoading(true)
    setIcloudStatus(null)
    try {
      const res = await fetch('/api/calendar/icloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appleId: icloudId, appPassword: icloudPass }),
      })
      const data = await res.json()
      if (!res.ok) {
        setIcloudStatus({ type: 'error', msg: data.error || 'Connection failed.' })
      } else {
        // Update local busySlots with synced data
        if (data.slots?.length) {
          setBusySlots(prev => new Set([...prev, ...data.slots]))
        }
        setIcloudConnected(true)
        setIcloudStatus({ type: 'success', msg: data.message })
        setShowIcloudModal(false)
        setIcloudStep(1)
        setIcloudPass('') // clear password from memory
      }
    } catch {
      setIcloudStatus({ type: 'error', msg: 'Network error. Please try again.' })
    }
    setIcloudLoading(false)
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

      {/* iCloud Calendar connect */}
      <div style={{ marginBottom: '24px', padding: '20px 24px', borderRadius: '14px',
        background: icloudConnected ? 'rgba(52,211,153,0.06)' : 'linear-gradient(135deg, rgba(252,94,94,0.08), rgba(252,163,17,0.06))',
        border: icloudConnected ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(252,94,94,0.2)',
        boxShadow: icloudConnected ? 'none' : '0 0 30px rgba(252,94,94,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Apple Calendar icon */}
          <div style={{ width: 44, height: 44, borderRadius: '12px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.35)' }}>
            <svg viewBox="0 0 44 44" width="44" height="44">
              <defs>
                <linearGradient id="calTop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF3B30"/>
                  <stop offset="100%" stopColor="#FF6B35"/>
                </linearGradient>
              </defs>
              <rect width="44" height="44" fill="white"/>
              <rect width="44" height="13" fill="url(#calTop)"/>
              {/* Ring hooks */}
              <rect x="12" y="4" width="3" height="8" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="29" y="4" width="3" height="8" rx="1.5" fill="white" opacity="0.9"/>
              {/* Date number */}
              <text x="22" y="36" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1C1C1E" fontFamily="-apple-system,sans-serif">
                {new Date().getDate()}
              </text>
              {/* Day label */}
              <text x="22" y="22" textAnchor="middle" fontSize="7" fontWeight="600" fill="#FF3B30" fontFamily="-apple-system,sans-serif" letterSpacing="0.5">
                {['SUN','MON','TUE','WED','THU','FRI','SAT'][new Date().getDay()]}
              </text>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {icloudConnected && <CheckCircle2 size={14} color="#34d399" />}
              {icloudConnected ? 'Apple Calendar Synced' : 'Connect Apple Calendar'}
            </div>
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
              {icloudConnected
                ? icloudStatus?.msg
                : 'Sync iCloud so venues only see your real open dates.'}
            </p>
          </div>
          {!icloudConnected && (
            <button
              onClick={() => { setShowIcloudModal(true); setIcloudStep(1) }}
              style={{ fontSize: '13px', padding: '10px 20px', flexShrink: 0, cursor: 'pointer',
                borderRadius: '8px', fontWeight: 600, border: 'none', color: 'white',
                background: 'linear-gradient(135deg, #FF3B30, #FF6B35)',
                boxShadow: '0 0 16px rgba(255,59,48,0.3)' }}>
              Connect
            </button>
          )}
        </div>
      </div>

      {/* iCloud Modal */}
      {showIcloudModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowIcloudModal(false)}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
            padding: '32px', maxWidth: '440px', width: '90%', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '13px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
                <svg viewBox="0 0 44 44" width="48" height="48">
                  <defs>
                    <linearGradient id="calTop2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF3B30"/>
                      <stop offset="100%" stopColor="#FF6B35"/>
                    </linearGradient>
                  </defs>
                  <rect width="44" height="44" fill="white"/>
                  <rect width="44" height="13" fill="url(#calTop2)"/>
                  <rect x="12" y="4" width="3" height="8" rx="1.5" fill="white" opacity="0.9"/>
                  <rect x="29" y="4" width="3" height="8" rx="1.5" fill="white" opacity="0.9"/>
                  <text x="22" y="36" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1C1C1E" fontFamily="-apple-system,sans-serif">{new Date().getDate()}</text>
                  <text x="22" y="22" textAnchor="middle" fontSize="7" fontWeight="600" fill="#FF3B30" fontFamily="-apple-system,sans-serif" letterSpacing="0.5">{['SUN','MON','TUE','WED','THU','FRI','SAT'][new Date().getDay()]}</text>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '17px' }}>Connect Apple Calendar</div>
                <div style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '2px' }}>Secure iCloud sync in 3 steps</div>
              </div>
              <button onClick={() => setShowIcloudModal(false)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
            </div>

            {/* Step indicators */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {[1,2,3].map(s => (
                <div key={s} style={{ flex: 1, height: '3px', borderRadius: '2px',
                  background: s <= icloudStep ? 'linear-gradient(90deg,#FF3B30,#FF6B35)' : 'rgba(255,255,255,0.1)' }}/>
              ))}
            </div>

            {/* Step 1 */}
            {icloudStep === 1 && (
              <div>
                <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Step 1 of 3</div>
                <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '12px' }}>Generate an App Password</div>
                <p style={{ fontSize: '14px', color: '#9CA3AF', lineHeight: 1.6, marginBottom: '20px' }}>
                  Apple requires an <strong style={{ color: 'white' }}>app-specific password</strong> for third-party calendar access. This is a separate token — not your main Apple ID password — and can be revoked anytime.
                </p>
                <button
                  onClick={() => { window.open('https://appleid.apple.com/account/manage', '_blank'); setIcloudStep(2) }}
                  style={{ width: '100%', padding: '13px', borderRadius: '10px', fontWeight: 700, fontSize: '15px',
                    border: 'none', cursor: 'pointer', color: 'white',
                    background: 'linear-gradient(135deg, #FF3B30, #FF6B35)',
                    boxShadow: '0 0 20px rgba(255,59,48,0.3)', marginBottom: '10px' }}>
                  Open Apple ID → App-Specific Passwords
                </button>
                <p style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center', margin: 0 }}>Opens appleid.apple.com in a new tab</p>
              </div>
            )}

            {/* Step 2 */}
            {icloudStep === 2 && (
              <div>
                <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Step 2 of 3</div>
                <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '12px' }}>Create the password</div>
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  {[
                    ['1.', 'Sign in at appleid.apple.com'],
                    ['2.', 'Go to Sign-In & Security'],
                    ['3.', 'Click App-Specific Passwords'],
                    ['4.', 'Click + and name it "Lyve"'],
                    ['5.', 'Copy the generated password'],
                  ].map(([num, text]) => (
                    <div key={num} style={{ display: 'flex', gap: '10px', marginBottom: '8px', fontSize: '14px', color: '#D1D5DB' }}>
                      <span style={{ color: '#FF3B30', fontWeight: 700, minWidth: '18px' }}>{num}</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setIcloudStep(1)} style={{ flex: 1, padding: '12px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: '#9CA3AF', background: 'transparent' }}>← Back</button>
                  <button onClick={() => setIcloudStep(3)} style={{ flex: 2, padding: '12px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', color: 'white', background: 'linear-gradient(135deg, #FF3B30, #FF6B35)' }}>I have the password →</button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {icloudStep === 3 && (
              <div>
                <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Step 3 of 3</div>
                <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '16px' }}>Enter your credentials</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  <input
                    type="email"
                    placeholder="Apple ID (your iCloud email)"
                    value={icloudId}
                    onChange={e => setIcloudId(e.target.value)}
                    style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '14px', outline: 'none' }}
                  />
                  <input
                    type="password"
                    placeholder="App-specific password (xxxx-xxxx-xxxx-xxxx)"
                    value={icloudPass}
                    onChange={e => setIcloudPass(e.target.value)}
                    style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                {icloudStatus?.type === 'error' && (
                  <p style={{ fontSize: '13px', color: '#f87171', marginBottom: '12px' }}>⚠️ {icloudStatus.msg}</p>
                )}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setIcloudStep(2)} style={{ flex: 1, padding: '12px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: '#9CA3AF', background: 'transparent' }}>← Back</button>
                  <button
                    onClick={syncIcloud}
                    disabled={icloudLoading || !icloudId || !icloudPass}
                    style={{ flex: 2, padding: '12px', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
                      border: 'none', cursor: icloudLoading ? 'wait' : 'pointer', color: 'white',
                      background: icloudLoading ? 'rgba(255,59,48,0.4)' : 'linear-gradient(135deg, #FF3B30, #FF6B35)',
                      opacity: (!icloudId || !icloudPass) ? 0.5 : 1 }}>
                    {icloudLoading ? 'Syncing...' : 'Sync My Calendar ✓'}
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center', marginTop: '12px', marginBottom: 0 }}>
                  🔒 Your password is never stored — only your busy dates are saved
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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
