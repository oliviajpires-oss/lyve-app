import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Parse iCal VEVENT blocks and return day/night slot keys
function parseIcalEvents(icalData: string, tzOffset = -7): string[] {
  const slots = new Set<string>()
  const events = icalData.split('BEGIN:VEVENT')
  
  for (let i = 1; i < events.length; i++) {
    const event = events[i]
    
    // Skip cancelled events
    if (event.includes('STATUS:CANCELLED')) continue
    
    // Extract DTSTART (handles VALUE=DATE and TZID variants)
    const startMatch = event.match(/DTSTART(?:[^:]*):(\d{8}(?:T\d{6}Z?)?)/i)
    if (!startMatch) continue
    
    const rawStart = startMatch[1]
    const isAllDay = rawStart.length === 8 // YYYYMMDD only
    
    if (isAllDay) {
      // All-day event → mark both day and night busy
      const dateStr = `${rawStart.slice(0,4)}-${rawStart.slice(4,6)}-${rawStart.slice(6,8)}`
      
      // Also check DTEND for multi-day events
      const endMatch = event.match(/DTEND(?:[^:]*):(\d{8})/i)
      if (endMatch) {
        const endRaw = endMatch[1]
        let current = new Date(`${rawStart.slice(0,4)}-${rawStart.slice(4,6)}-${rawStart.slice(6,8)}`)
        const end = new Date(`${endRaw.slice(0,4)}-${endRaw.slice(4,6)}-${endRaw.slice(6,8)}`)
        while (current < end) {
          const d = current.toISOString().split('T')[0]
          slots.add(`${d}_day`)
          slots.add(`${d}_night`)
          current.setDate(current.getDate() + 1)
        }
      } else {
        slots.add(`${dateStr}_day`)
        slots.add(`${dateStr}_night`)
      }
    } else {
      // Timed event → determine day or night
      let hour: number
      if (rawStart.endsWith('Z')) {
        // UTC — convert to local (approximate)
        const utcHour = parseInt(rawStart.slice(9, 11))
        hour = (utcHour + 24 + tzOffset) % 24
      } else {
        hour = parseInt(rawStart.slice(9, 11))
      }
      
      const dateStr = `${rawStart.slice(0,4)}-${rawStart.slice(4,6)}-${rawStart.slice(6,8)}`
      
      // Day = before 18:00, Night = 18:00 and after
      if (hour < 18) {
        slots.add(`${dateStr}_day`)
      } else {
        slots.add(`${dateStr}_night`)
      }
      
      // Check if event spans into night (DTEND > 18:00 on same day)
      const endMatch = event.match(/DTEND(?:[^:]*):(\d{8}T\d{6}Z?)/i)
      if (endMatch && hour < 18) {
        const endRaw = endMatch[1]
        let endHour: number
        if (endRaw.endsWith('Z')) {
          endHour = (parseInt(endRaw.slice(9, 11)) + 24 + tzOffset) % 24
        } else {
          endHour = parseInt(endRaw.slice(9, 11))
        }
        if (endHour >= 18 || endHour < hour) {
          slots.add(`${dateStr}_night`)
        }
      }
    }
  }
  
  return Array.from(slots)
}

async function caldavFetch(url: string, method: string, auth: string, body?: string, depth = '0') {
  const headers: Record<string, string> = {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/xml; charset=utf-8',
    'Depth': depth,
  }
  const res = await fetch(url, { method, headers, body, redirect: 'follow' })
  return res
}

function extractXmlValue(xml: string, tag: string): string | null {
  const patterns = [
    new RegExp(`<[^>]*:${tag}[^>]*>([^<]+)<`, 'i'),
    new RegExp(`<${tag}[^>]*>([^<]+)<`, 'i'),
  ]
  for (const pattern of patterns) {
    const m = xml.match(pattern)
    if (m) return m[1].trim()
  }
  return null
}

function extractHref(xml: string): string[] {
  const matches = xml.matchAll(/<[Dd]:\s*href>([^<]+)<\/[Dd]:\s*href>/g)
  return Array.from(matches).map(m => m[1].trim())
}

export async function POST(req: NextRequest) {
  try {
    const { appleId, appPassword } = await req.json()
    
    if (!appleId || !appPassword) {
      return NextResponse.json({ error: 'Apple ID and app-specific password required' }, { status: 400 })
    }
    
    // Get authenticated user
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const auth = Buffer.from(`${appleId}:${appPassword}`).toString('base64')
    
    // Step 1: Discover principal URL
    const discoverBody = `<?xml version="1.0" encoding="UTF-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop><D:current-user-principal/></D:prop>
</D:propfind>`

    const discoverRes = await caldavFetch('https://caldav.icloud.com/', 'PROPFIND', auth, discoverBody, '0')
    const discoverXml = await discoverRes.text()
    
    if (discoverRes.status === 401) {
      return NextResponse.json({ error: 'Invalid Apple ID or app-specific password. Make sure to use an app-specific password from appleid.apple.com.' }, { status: 401 })
    }
    
    // Extract principal URL
    const principalMatch = discoverXml.match(/<current-user-principal[^>]*>\s*<href[^>]*>([^<]+)<\/href>/i) ||
                           discoverXml.match(/href[^>]*>([^<]*\/principal\/[^<]*)</i)
    
    let principalUrl = principalMatch ? principalMatch[1] : null
    
    // If relative URL, build full URL
    if (principalUrl && !principalUrl.startsWith('http')) {
      const base = discoverRes.url || 'https://caldav.icloud.com'
      const baseUrl = new URL(base)
      principalUrl = `${baseUrl.origin}${principalUrl}`
    }
    
    if (!principalUrl) {
      return NextResponse.json({ error: 'Could not discover iCloud CalDAV principal. Check your Apple ID.' }, { status: 400 })
    }
    
    // Step 2: Get calendar home set
    const homeBody = `<?xml version="1.0" encoding="UTF-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop><C:calendar-home-set/></D:prop>
</D:propfind>`

    const homeRes = await caldavFetch(principalUrl, 'PROPFIND', auth, homeBody, '0')
    const homeXml = await homeRes.text()
    
    const homeHrefs = extractHref(homeXml)
    const homeUrl = homeHrefs.find(h => h.includes('/calendars/')) || homeHrefs[0]
    
    if (!homeUrl) {
      return NextResponse.json({ error: 'Could not find iCloud calendar home.' }, { status: 400 })
    }
    
    const baseUrl = new URL(principalUrl)
    const fullHomeUrl = homeUrl.startsWith('http') ? homeUrl : `${baseUrl.origin}${homeUrl}`
    
    // Step 3: List calendars
    const listBody = `<?xml version="1.0" encoding="UTF-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:resourcetype/>
    <D:displayname/>
  </D:prop>
</D:propfind>`

    const listRes = await caldavFetch(fullHomeUrl, 'PROPFIND', auth, listBody, '1')
    const listXml = await listRes.text()
    
    // Find calendar URLs (entries with calendar resourcetype)
    const calendarUrls: string[] = []
    const responseBlocks = listXml.split('<response').slice(1)
    for (const block of responseBlocks) {
      if (block.includes('calendar') && block.includes('href')) {
        const hrefMatch = block.match(/<href[^>]*>([^<]+)<\/href>/i)
        if (hrefMatch && hrefMatch[1] !== homeUrl) {
          const calUrl = hrefMatch[1].startsWith('http') ? hrefMatch[1] : `${baseUrl.origin}${hrefMatch[1]}`
          calendarUrls.push(calUrl)
        }
      }
    }
    
    if (calendarUrls.length === 0) {
      return NextResponse.json({ error: 'No calendars found in iCloud account.' }, { status: 400 })
    }
    
    // Step 4: Fetch events from all calendars (next 90 days)
    const now = new Date()
    const future = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
    const startStr = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const endStr = future.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    
    const reportBody = `<?xml version="1.0" encoding="UTF-8"?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${startStr}" end="${endStr}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`

    const allSlots = new Set<string>()
    
    for (const calUrl of calendarUrls) {
      try {
        const reportRes = await caldavFetch(calUrl, 'REPORT', auth, reportBody, '1')
        const reportXml = await reportRes.text()
        
        // Extract calendar-data blocks
        const calDataMatches = reportXml.matchAll(/<calendar-data[^>]*>([\s\S]*?)<\/calendar-data>/gi)
        for (const match of calDataMatches) {
          const icalData = match[1]
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
          const slots = parseIcalEvents(icalData)
          slots.forEach(s => allSlots.add(s))
        }
      } catch {
        // Skip failed calendars
      }
    }
    
    if (allSlots.size === 0) {
      return NextResponse.json({ message: 'Connected successfully — no upcoming events found in the next 90 days.', slots: [] })
    }
    
    // Step 5: Upsert all busy slots into Supabase availability table
    const rows = Array.from(allSlots).map(slot => ({
      artist_id: user.id,
      date: slot,
      available: false,
    }))
    
    const { error: upsertError } = await supabase
      .from('availability')
      .upsert(rows, { onConflict: 'artist_id,date' })
    
    if (upsertError) {
      // Table might not have unique constraint — try insert
      await supabase.from('availability').insert(rows)
    }
    
    return NextResponse.json({ 
      message: `Synced ${allSlots.size} busy slots from iCloud Calendar.`,
      slots: Array.from(allSlots)
    })
    
  } catch (err) {
    console.error('iCloud CalDAV error:', err)
    return NextResponse.json({ error: 'Failed to connect to iCloud Calendar. Please try again.' }, { status: 500 })
  }
}
