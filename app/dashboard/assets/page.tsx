'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Music, Image, Palette, Video, FileText, FileEdit, Play, ExternalLink, Star } from 'lucide-react'

type Asset = {
  id: string
  name: string
  type: string
  url: string
  created_at: string
  on_profile?: boolean
  in_press_kit?: boolean
}

const S = {
  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px', marginBottom: '16px' },
  label: { fontSize: '13px', color: '#9CA3AF', marginBottom: '6px', display: 'block' as const },
  input: { width: '100%', padding: '11px 14px', borderRadius: '8px', fontSize: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', boxSizing: 'border-box' as const },
}

function Toggle({ active, onChange, label }: { active: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button onClick={() => onChange(!active)} style={{
      display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: 'none',
      background: active ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)',
      color: active ? '#9F67FF' : '#9CA3AF'
    }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: active ? '#7C3AED' : '#4B5563', display: 'inline-block' }} />
      {label}
    </button>
  )
}

function SectionHeader({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ color: '#9F67FF' }}>{icon}</div>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#9F67FF' }}>{title}</h3>
      </div>
      {action}
    </div>
  )
}

function UploadBtn({ label, loading, onClick }: { label: string; loading: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px', borderRadius: '8px', fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer',
      fontWeight: 600, border: 'none', background: 'rgba(124,58,237,0.15)', color: '#9F67FF', whiteSpace: 'nowrap'
    }}>{loading ? 'Uploading...' : label}</button>
  )
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [bio, setBio] = useState('')
  const [kitLink, setKitLink] = useState('')
  const [mainPhotoUrl, setMainPhotoUrl] = useState('')
  const [trackLink, setTrackLink] = useState('')
  const [uploading, setUploading] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState('')
  const photoRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLInputElement>(null)
  const mainPhotoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (prof) { setBio(prof.bio || ''); setKitLink(prof.press_kit_link || ''); setMainPhotoUrl(prof.main_photo_url || '') }
      const { data } = await supabase.from('assets').select('*').eq('artist_id', user.id).order('created_at', { ascending: false })
      setAssets(data || [])
    })
  }, [])

  const uploadFile = async (file: File, type: string) => {
    const supabase = createClient()
    setUploading(type)
    const ext = file.name.split('.').pop()
    const path = `${userId}/${type}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('assets').upload(path, file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(path)
      const { data: asset } = await supabase.from('assets').insert({
        artist_id: userId, name: file.name, type, url: publicUrl, size: file.size,
        on_profile: type === 'photo' || type === 'track',
        in_press_kit: true
      }).select().single()
      if (asset) setAssets(prev => [asset, ...prev])
    }
    setUploading(null)
  }

  const addTrackLink = async () => {
    if (!trackLink.trim()) return
    const supabase = createClient()
    const { data: asset } = await supabase.from('assets').insert({
      artist_id: userId, name: trackLink, type: 'track', url: trackLink,
      on_profile: true, in_press_kit: true
    }).select().single()
    if (asset) { setAssets(prev => [asset, ...prev]); setTrackLink('') }
  }

  const toggleFlag = async (asset: Asset, flag: 'on_profile' | 'in_press_kit') => {
    const supabase = createClient()
    const newVal = !asset[flag]
    await supabase.from('assets').update({ [flag]: newVal }).eq('id', asset.id)
    setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, [flag]: newVal } : a))
  }

  const deleteAsset = async (asset: Asset) => {
    const supabase = createClient()
    await supabase.from('assets').delete().eq('id', asset.id)
    setAssets(prev => prev.filter(a => a.id !== asset.id))
  }

  const uploadMainPhoto = async (file: File) => {
    const supabase = createClient()
    setUploading('main')
    const ext = file.name.split('.').pop()
    const path = `${userId}/main/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('assets').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(path)
      setMainPhotoUrl(publicUrl)
      await supabase.from('profiles').update({ main_photo_url: publicUrl }).eq('id', userId)
    }
    setUploading(null)
  }

  const saveProfile = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ bio, press_kit_link: kitLink, main_photo_url: mainPhotoUrl }).eq('id', userId)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const byType = (type: string) => assets.filter(a => a.type === type)
  const isAudioFile = (url: string) => /\.(mp3|wav|aac|ogg|flac|m4a|aiff?)$/i.test(url)

  return (
    <div style={{ maxWidth: '780px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>Press Kit & Assets</h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Everything venues need when they book you.</p>
      </div>

      {/* Main Press Photo */}
      <div style={{ marginBottom: '16px', padding: '24px', borderRadius: '14px',
        background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(80,30,180,0.06))',
        border: '1px solid rgba(124,58,237,0.25)', boxShadow: '0 0 30px rgba(124,58,237,0.07)' }}>
        <SectionHeader icon={<Star size={16} />} title="Main Press Photo" action={
          <>
            <input ref={mainPhotoRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && uploadMainPhoto(e.target.files[0])} />
            <UploadBtn label={mainPhotoUrl ? 'Replace Photo' : '+ Upload Photo'} loading={uploading === 'main'} onClick={() => mainPhotoRef.current?.click()} />
          </>
        } />
        <p style={{ color: '#6B7280', fontSize: '12px', marginBottom: mainPhotoUrl ? '16px' : '0' }}>
          This is the hero photo venues see first — make it count. One clear, high-res shot.
        </p>
        {mainPhotoUrl && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mainPhotoUrl} alt="Main press photo" style={{ width: '160px', height: '160px', objectFit: 'cover',
              borderRadius: '10px', border: '2px solid rgba(124,58,237,0.3)', flexShrink: 0 }} />
            <div style={{ paddingTop: '4px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#C4A0FF', marginBottom: '6px' }}>Press Photo Active</div>
              <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.6 }}>
                This photo is shown at the top of your public Lyve profile and included in your press kit when venues request booking info.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bio + Kit Link */}
      <div style={S.card}>
        <SectionHeader icon={<FileEdit size={16} />} title="Bio & Press Kit Link" />
        <div style={{ marginBottom: '14px' }}>
          <label style={S.label}>Your Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4}
            placeholder="Write your bio in your own words..."
            style={{ ...S.input, resize: 'vertical', lineHeight: 1.6 }} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={S.label}>External Press Kit Link <span style={{ fontSize: '11px' }}>(Dropbox, Google Drive, Notion, etc.)</span></label>
          <input value={kitLink} onChange={e => setKitLink(e.target.value)}
            placeholder="https://drive.google.com/..." style={S.input} />
        </div>
        <button onClick={saveProfile} disabled={saving} style={{
          padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none',
          background: saved ? 'rgba(34,197,94,0.2)' : 'rgba(124,58,237,0.2)', color: saved ? '#4ADE80' : '#9F67FF'
        }}>
          {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Tracks & Mixes */}
      <div style={S.card}>
        <SectionHeader
          icon={<Music size={16} />}
          title="Tracks & Mixes"
          action={
            <div style={{ display: 'flex', gap: '8px' }}>
              <input ref={audioRef} type="file" accept="audio/*,.mp3,.wav,.aac,.flac,.m4a,.aiff" multiple
                style={{ display: 'none' }}
                onChange={e => { Array.from(e.target.files || []).forEach(f => uploadFile(f, 'track')); e.target.value = '' }} />
              <UploadBtn label="+ Upload File" loading={uploading === 'track'} onClick={() => audioRef.current?.click()} />
            </div>
          }
        />
        <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '12px' }}>
          Upload MP3, WAV, FLAC, AAC — or paste a SoundCloud / Mixcloud link.
        </p>

        {/* Link input */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input value={trackLink} onChange={e => setTrackLink(e.target.value)}
            placeholder="SoundCloud, Mixcloud, or any streaming link..."
            style={{ ...S.input, flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && addTrackLink()} />
          <button onClick={addTrackLink} style={{
            padding: '0 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none',
            background: 'rgba(124,58,237,0.15)', color: '#9F67FF', whiteSpace: 'nowrap'
          }}>Add Link</button>
        </div>

        {/* Track list */}
        {byType('track').length === 0 && (
          <p style={{ color: '#9CA3AF', fontSize: '13px' }}>No tracks yet — upload a file or paste a link.</p>
        )}
        {byType('track').map(a => (
          <div key={a.id} style={{ marginBottom: '10px', padding: '12px 14px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: isAudioFile(a.url) ? '10px' : '0' }}>
              <div style={{ color: '#7C3AED', flexShrink: 0 }}>
                {isAudioFile(a.url) ? <Play size={14} /> : <ExternalLink size={14} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {a.name.replace(/\.[^/.]+$/, '')}
                </div>
              </div>
              <Toggle active={!!a.on_profile} onChange={() => toggleFlag(a, 'on_profile')} label="Profile" />
              <Toggle active={!!a.in_press_kit} onChange={() => toggleFlag(a, 'in_press_kit')} label="Kit" />
              {!isAudioFile(a.url) && (
                <a href={a.url} target="_blank" rel="noreferrer" style={{ color: '#7C3AED', fontSize: '12px' }}>Open</a>
              )}
              <button onClick={() => deleteAsset(a)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '14px', padding: '2px 4px' }}>✕</button>
            </div>
            {/* Audio player for uploaded files */}
            {isAudioFile(a.url) && (
              <audio controls src={a.url} style={{ width: '100%', height: '36px', accentColor: '#7C3AED' }} />
            )}
          </div>
        ))}
      </div>

      {/* Photos */}
      <div style={S.card}>
        <SectionHeader
          icon={<Image size={16} />}
          title="Photos"
          action={
            <>
              <input ref={photoRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={e => { Array.from(e.target.files || []).forEach(f => uploadFile(f, 'photo')); e.target.value = '' }} />
              <UploadBtn label="+ Upload Photos" loading={uploading === 'photo'} onClick={() => photoRef.current?.click()} />
            </>
          }
        />
        <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '12px' }}>Headshots, live shots, promo pics.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: byType('photo').length > 0 ? '8px' : '0' }}>
          {byType('photo').map(a => (
            // eslint-disable-next-line @next/next/no-img-element
            <div key={a.id} style={{ position: 'relative' }}>
              <img src={a.url} alt="" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
              <div style={{ position: 'absolute', bottom: '4px', left: '4px', right: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <Toggle active={!!a.on_profile} onChange={() => toggleFlag(a, 'on_profile')} label="Profile" />
                <Toggle active={!!a.in_press_kit} onChange={() => toggleFlag(a, 'in_press_kit')} label="Kit" />
              </div>
              <button onClick={() => deleteAsset(a)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: '#EF4444', border: 'none', color: 'white', cursor: 'pointer', fontSize: '11px' }}>✕</button>
            </div>
          ))}
        </div>
        {byType('photo').length === 0 && <p style={{ color: '#9CA3AF', fontSize: '13px' }}>No photos yet.</p>}
      </div>

      {/* Logos */}
      <div style={S.card}>
        <SectionHeader
          icon={<Palette size={16} />}
          title="Logos & Branding"
          action={
            <>
              <input ref={logoRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={e => { Array.from(e.target.files || []).forEach(f => uploadFile(f, 'logo')); e.target.value = '' }} />
              <UploadBtn label="+ Upload Logo" loading={uploading === 'logo'} onClick={() => logoRef.current?.click()} />
            </>
          }
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: byType('logo').length > 0 ? '8px' : '0' }}>
          {byType('logo').map(a => (
            // eslint-disable-next-line @next/next/no-img-element
            <div key={a.id} style={{ position: 'relative' }}>
              <img src={a.url} alt="" style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', padding: '8px' }} />
              <div style={{ position: 'absolute', bottom: '4px', left: '4px', right: '4px', display: 'flex', gap: '4px' }}>
                <Toggle active={!!a.on_profile} onChange={() => toggleFlag(a, 'on_profile')} label="Profile" />
                <Toggle active={!!a.in_press_kit} onChange={() => toggleFlag(a, 'in_press_kit')} label="Kit" />
              </div>
              <button onClick={() => deleteAsset(a)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: '#EF4444', border: 'none', color: 'white', cursor: 'pointer', fontSize: '11px' }}>✕</button>
            </div>
          ))}
        </div>
        {byType('logo').length === 0 && <p style={{ color: '#9CA3AF', fontSize: '13px' }}>No logos yet.</p>}
      </div>

      {/* Videos */}
      <div style={S.card}>
        <SectionHeader
          icon={<Video size={16} />}
          title="Videos"
          action={
            <>
              <input ref={videoRef} type="file" accept="video/*" multiple style={{ display: 'none' }}
                onChange={e => { Array.from(e.target.files || []).forEach(f => uploadFile(f, 'video')); e.target.value = '' }} />
              <UploadBtn label="+ Upload Video" loading={uploading === 'video'} onClick={() => videoRef.current?.click()} />
            </>
          }
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: byType('video').length > 0 ? '8px' : '0' }}>
          {byType('video').map(a => (
            <div key={a.id} style={{ position: 'relative' }}>
              <video src={a.url} style={{ width: '160px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
              <div style={{ position: 'absolute', bottom: '4px', left: '4px', right: '4px', display: 'flex', gap: '4px' }}>
                <Toggle active={!!a.on_profile} onChange={() => toggleFlag(a, 'on_profile')} label="Profile" />
                <Toggle active={!!a.in_press_kit} onChange={() => toggleFlag(a, 'in_press_kit')} label="Kit" />
              </div>
              <button onClick={() => deleteAsset(a)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: '#EF4444', border: 'none', color: 'white', cursor: 'pointer', fontSize: '11px' }}>✕</button>
            </div>
          ))}
        </div>
        {byType('video').length === 0 && <p style={{ color: '#9CA3AF', fontSize: '13px' }}>No videos yet.</p>}
      </div>

      {/* Press Kit PDF */}
      <div style={S.card}>
        <SectionHeader
          icon={<FileText size={16} />}
          title="Press Kit PDF"
          action={
            <>
              <input ref={pdfRef} type="file" accept=".pdf" style={{ display: 'none' }}
                onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0], 'press_kit'); e.target.value = '' }} />
              <UploadBtn label="+ Upload PDF" loading={uploading === 'press_kit'} onClick={() => pdfRef.current?.click()} />
            </>
          }
        />
        <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '12px' }}>Already have a PDF press kit? Upload it here.</p>
        {byType('press_kit').map(a => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
            borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '8px' }}>
            <FileText size={14} color="#7C3AED" />
            <div style={{ flex: 1, fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
            <Toggle active={!!a.on_profile} onChange={() => toggleFlag(a, 'on_profile')} label="Profile" />
            <Toggle active={!!a.in_press_kit} onChange={() => toggleFlag(a, 'in_press_kit')} label="Kit" />
            <a href={a.url} target="_blank" rel="noreferrer" style={{ color: '#7C3AED', fontSize: '12px' }}>Open</a>
            <button onClick={() => deleteAsset(a)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '14px', padding: '2px 4px' }}>✕</button>
          </div>
        ))}
        {byType('press_kit').length === 0 && <p style={{ color: '#9CA3AF', fontSize: '13px' }}>No press kit PDF yet.</p>}
      </div>

      {/* Legend */}
      <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: '#9CA3AF' }}>
        <span style={{ color: '#9F67FF', fontWeight: 600 }}>Profile</span> = shows on your public getlyve.ai page &nbsp;·&nbsp;
        <span style={{ color: '#9F67FF', fontWeight: 600 }}>Kit</span> = sent to venues when they book you
      </div>
    </div>
  )
}
