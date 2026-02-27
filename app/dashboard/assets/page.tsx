'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

type Asset = {
  id: string
  name: string
  type: string
  url: string
  created_at: string
}

const ASSET_TYPES = [
  { value: 'mix', label: '🎵 Mix / Track', accept: 'audio/*' },
  { value: 'video', label: '🎬 Promo Video', accept: 'video/*' },
  { value: 'photo', label: '📸 Photo', accept: 'image/*' },
  { value: 'press_kit', label: '📄 Press Kit (PDF)', accept: '.pdf' },
]

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadType, setUploadType] = useState('mix')
  const [userId, setUserId] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('assets').select('*').eq('artist_id', user.id).order('created_at', { ascending: false })
      setAssets(data || [])
    })
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploading(true)

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/${uploadType}/${Date.now()}.${ext}`

    const { data: uploadData, error } = await supabase.storage.from('assets').upload(path, file)

    if (!error && uploadData) {
      const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(path)
      const { data: asset } = await supabase.from('assets').insert({
        artist_id: userId, name: file.name, type: uploadType, url: publicUrl, size: file.size
      }).select().single()
      if (asset) setAssets(prev => [asset, ...prev])
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleDelete = async (asset: Asset) => {
    const supabase = createClient()
    await supabase.from('assets').delete().eq('id', asset.id)
    setAssets(prev => prev.filter(a => a.id !== asset.id))
  }

  const acceptType = ASSET_TYPES.find(t => t.value === uploadType)?.accept || '*'

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>Assets & Press Kit</h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Upload your mixes, photos, videos, and press kit. These appear on your public profile.</p>
      </div>

      {/* Upload card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '15px', color: '#9F67FF' }}>Upload New Asset</h3>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {ASSET_TYPES.map(type => (
            <button key={type.value} onClick={() => setUploadType(type.value)} style={{
              padding: '8px 14px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
              background: uploadType === type.value ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)',
              border: uploadType === type.value ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.08)',
              color: uploadType === type.value ? '#9F67FF' : '#9CA3AF'
            }}>
              {type.label}
            </button>
          ))}
        </div>

        <div onClick={() => fileRef.current?.click()} style={{
          border: '2px dashed rgba(124,58,237,0.3)', borderRadius: '10px', padding: '40px',
          textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
          background: 'rgba(124,58,237,0.04)'
        }}>
          {uploading ? (
            <div>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
              <p style={{ color: '#9CA3AF' }}>Uploading...</p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>☁️</div>
              <p style={{ fontWeight: 600, marginBottom: '4px' }}>Drop file here or click to upload</p>
              <p style={{ color: '#9CA3AF', fontSize: '13px' }}>
                {ASSET_TYPES.find(t => t.value === uploadType)?.label}
              </p>
            </div>
          )}
          <input ref={fileRef} type="file" accept={acceptType} style={{ display: 'none' }} onChange={handleUpload} />
        </div>
      </div>

      {/* Asset list */}
      {assets.length > 0 ? (
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '15px', color: '#9F67FF' }}>Your Assets ({assets.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {assets.map(asset => (
              <div key={asset.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <span style={{ fontSize: '20px' }}>
                  {asset.type === 'mix' ? '🎵' : asset.type === 'video' ? '🎬' : asset.type === 'photo' ? '📸' : '📄'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{asset.name}</div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                    {asset.type} · {new Date(asset.created_at).toLocaleDateString()}
                  </div>
                </div>
                <a href={asset.url} target="_blank" rel="noreferrer"
                  style={{ color: '#7C3AED', fontSize: '13px', marginRight: '8px' }}>View</a>
                <button onClick={() => handleDelete(asset)} style={{
                  background: 'transparent', border: 'none', color: '#9CA3AF',
                  cursor: 'pointer', fontSize: '16px', padding: '4px'
                }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📁</div>
          <p>No assets yet. Upload your first one above.</p>
        </div>
      )}
    </div>
  )
}
