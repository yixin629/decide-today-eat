import { NextRequest, NextResponse } from 'next/server'

interface LrcLibResult {
  trackName?: string
  artistName?: string
  plainLyrics?: string | null
  syncedLyrics?: string | null
  instrumental?: boolean
}

// lrclib.net is a free, keyless, CORS-open lyrics API — fetched server-side anyway to keep
// third-party calls out of the client bundle and to normalize errors for the UI.
export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get('title')?.trim() ?? ''
  const artist = request.nextUrl.searchParams.get('artist')?.trim() ?? ''
  if (!title) return NextResponse.json({ error: '缺少歌曲名' }, { status: 400 })

  const params = new URLSearchParams({ track_name: title })
  if (artist) params.set('artist_name', artist)

  try {
    const response = await fetch(`https://lrclib.net/api/search?${params}`, {
      cache: 'no-store',
      headers: { 'User-Agent': 'decide-today-eat music player (personal project)' },
    })
    if (!response.ok) return NextResponse.json({ error: '歌词服务暂时不可用' }, { status: 502 })

    const results = await response.json() as LrcLibResult[]
    const best = results.find((item) => !item.instrumental && (item.syncedLyrics || item.plainLyrics)) ?? results[0]
    if (!best || (!best.syncedLyrics && !best.plainLyrics)) {
      return NextResponse.json({ found: false })
    }

    return NextResponse.json({
      found: true,
      instrumental: Boolean(best.instrumental),
      plainLyrics: best.plainLyrics ?? null,
      syncedLyrics: best.syncedLyrics ?? null,
    })
  } catch (error) {
    console.error('Lyrics lookup failed:', error)
    return NextResponse.json({ error: '无法连接歌词服务' }, { status: 502 })
  }
}
