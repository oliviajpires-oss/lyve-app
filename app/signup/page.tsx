'use client'
import { Mail } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: signupError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { display_name: form.name, username: form.username.toLowerCase().replace(/\s/g, '') },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Insert profile
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username: form.username.toLowerCase().replace(/\s/g, ''),
        display_name: form.name,
        email: form.email,
      })
      router.push('/dashboard')
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="card" style={{ maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><Mail size={44} color="#9F67FF" /></div>
          <h2 style={{ marginBottom: '8px' }}>Check your email</h2>
          <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
            We sent a confirmation link to <strong style={{ color: 'white' }}>{form.email}</strong>.
            Click it to activate your account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '36px', fontWeight: 800, color: 'white', letterSpacing: '-1px' }}>
            lyve<span style={{ color: '#7C3AED' }}>.</span>
          </div>
          <p style={{ color: '#9CA3AF', marginTop: '8px', fontSize: '14px' }}>Create your artist profile</p>
        </div>

        <div className="card">
          <button onClick={handleGoogle} style={{
            width: '100%', padding: '12px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'white', fontWeight: 500, cursor: 'pointer', marginBottom: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: '#9CA3AF', fontSize: '12px' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <form onSubmit={handleSignup}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label>Your Name</label>
                <input className="input" placeholder="DJ Neon"
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label>Username</label>
                <input className="input" placeholder="djneon"
                  value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label>Email</label>
              <input className="input" type="email" placeholder="you@email.com"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label>Password</label>
              <input className="input" type="password" placeholder="Min. 8 characters"
                value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={8} />
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              {loading ? 'Creating account...' : 'Create Free Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#9CA3AF', fontSize: '14px' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#9F67FF', fontWeight: 500 }}>Sign in</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '12px', color: '#9CA3AF', fontSize: '12px' }}>
          Free during early access. No credit card required.
        </p>
      </div>
    </div>
  )
}
