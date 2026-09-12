'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useMusicPlayer } from './MusicPlayerContext'
import { getYouTubeEmbedUrl } from '@/app/music-player/lib/youtube'

// Rendered once in the root layout so the <audio>/<iframe> element is never
// unmounted while navigating between pages — that's what keeps playback going
// after leaving /music-player (no premium APIs needed, just don't destroy the DOM node).
// Follows the same fixed-FAB + slide-up-panel convention as AIChatbot / UnifiedThemePanel
// so it docks into the same bottom-right button row instead of overlapping them.
//
// IMPORTANT: the panel below is always mounted once currentSong exists — only its
// visibility classes toggle. Conditionally rendering it (`{open && <section>...}`)
// would unmount the <audio>/<iframe> every time the panel is collapsed, which is
// exactly the "music stops" bug this component exists to avoid.
interface LyricsState {
  loading: boolean
  found: boolean
  text: string | null
  error: boolean
}

const REPEAT_LABELS: Record<string, { icon: string; label: string }> = {
  off: { icon: '➡️', label: '不循环' },
  all: { icon: '🔁', label: '列表循环' },
  one: { icon: '🔂', label: '单曲循环' },
}

export default function GlobalMusicPlayer() {
  const { currentSong, isPlaying, currentTime, duration, repeatMode, audioRef, setCurrentTime, setDuration, setIsPlaying, togglePlay, playNext, playPrev, handleTrackEnded, cycleRepeatMode, toggleLike, togglePin } = useMusicPlayer()
  const pathname = usePathname()
  const onMusicPage = pathname === '/music-player'
  const [isOpen, setIsOpen] = useState(false)
  const [lyricsOpen, setLyricsOpen] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [lyrics, setLyrics] = useState<LyricsState>({ loading: false, found: false, text: null, error: false })

  // Landing on the dedicated page opens the panel automatically; leaving it collapses back to the FAB.
  useEffect(() => { setIsOpen(onMusicPage) }, [onMusicPage])

  useEffect(() => { setIsBuffering(false) }, [currentSong?.id])

  const panelOpen = isOpen || onMusicPage
  const hasSong = Boolean(currentSong)

  useEffect(() => {
    if (!lyricsOpen || !currentSong) return
    let cancelled = false
    setLyrics({ loading: true, found: false, text: null, error: false })
    const params = new URLSearchParams({ title: currentSong.title, artist: currentSong.artist })
    fetch(`/api/lyrics?${params}`)
      .then((response) => response.json() as Promise<{ found?: boolean; plainLyrics?: string | null; error?: string }>)
      .then((data) => {
        if (cancelled) return
        if (data.error) { setLyrics({ loading: false, found: false, text: null, error: true }); return }
        setLyrics({ loading: false, found: Boolean(data.found), text: data.plainLyrics ?? null, error: false })
      })
      .catch(() => { if (!cancelled) setLyrics({ loading: false, found: false, text: null, error: true }) })
    return () => { cancelled = true }
  }, [lyricsOpen, currentSong?.id, currentSong?.title, currentSong?.artist])

  // Bake `autoplay=1` into an embed's src only for the moment a new song becomes current
  // (and only if it should already be playing) — never in response to later play/pause
  // toggles, since changing an <iframe> src always reloads it and would restart the track.
  const [lastSeenId, setLastSeenId] = useState<string | null>(null)
  const [autoplayId, setAutoplayId] = useState<string | null>(null)
  if (currentSong && currentSong.id !== lastSeenId) {
    setLastSeenId(currentSong.id)
    if (isPlaying) setAutoplayId(currentSong.id)
  }
  const autoplayParam = currentSong && autoplayId === currentSong.id ? '&autoplay=1' : ''

  return (
    <>
      {hasSong && (
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className={`fixed bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] right-[7.75rem] flex h-12 w-12 items-center justify-center rounded-full text-xl text-white shadow-lg transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:bottom-6 sm:right-[10.5rem] sm:h-14 sm:w-14 sm:text-2xl ${
            panelOpen ? 'z-[70]' : 'z-50'
          } bg-gradient-to-br from-rose-400 to-fuchsia-600`}
          aria-label={panelOpen ? '收起音乐播放器' : '打开音乐播放器'}
          aria-expanded={panelOpen}
          aria-controls="global-music-panel"
          title={isPlaying ? `正在播放：${currentSong?.title}` : '音乐播放器'}
        >
          <span aria-hidden="true">{isPlaying ? '🎶' : '🎵'}</span>
          {isPlaying && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-white bg-emerald-400" aria-hidden="true" />}
        </button>
      )}

      {hasSong && panelOpen && !onMusicPage && (
        <div
          className="fixed inset-0 z-[55] bg-slate-950/35 backdrop-blur-[1px]"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Always mounted once a song exists — visibility only, never unmount/remount (see note above). */}
      <section
        id="global-music-panel"
        role="dialog"
        aria-label="音乐播放器"
        aria-hidden={!hasSong || !panelOpen}
        className={`fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+8.5rem)] z-[60] flex max-h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-2xl transition-[opacity,transform] duration-200 sm:inset-x-auto sm:bottom-24 sm:right-6 sm:max-h-[calc(100dvh-6rem)] sm:w-[360px] ${
          hasSong && panelOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        {currentSong && (
          <>
            <div className="flex items-center gap-2 border-b border-pink-50 px-3 py-2">
              <span className="text-lg">{currentSong.cover || '🎵'}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-800">{currentSong.title}</p>
                <p className="truncate text-xs text-gray-400">{currentSong.artist}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleLike(currentSong.id)}
                className={`shrink-0 rounded-full p-1.5 transition-colors ${currentSong.liked ? 'text-rose-500' : 'text-gray-300 hover:text-rose-400'}`}
                aria-label={currentSong.liked ? '取消喜欢' : '喜欢这首歌'}
                aria-pressed={Boolean(currentSong.liked)}
              >
                {currentSong.liked ? '❤️' : '🤍'}
              </button>
              <button
                type="button"
                onClick={() => togglePin(currentSong.id)}
                className={`shrink-0 rounded-full p-1.5 transition-colors ${currentSong.pinned ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
                aria-label={currentSong.pinned ? '取消置顶' : '置顶这首歌'}
                aria-pressed={Boolean(currentSong.pinned)}
              >
                📌
              </button>
              {!onMusicPage && (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  aria-label="收起播放器"
                >
                  ▾
                </button>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* Lyrics is just an overlay of visibility — the media below stays mounted so toggling it never interrupts playback. */}
              <div className={lyricsOpen ? '' : 'hidden'}>
                <div className="min-h-[10rem] px-3 py-3 text-sm leading-relaxed text-gray-700">
                  {lyrics.loading && <p className="text-gray-400">歌词加载中…</p>}
                  {!lyrics.loading && lyrics.error && <p className="text-red-500">歌词服务暂时不可用</p>}
                  {!lyrics.loading && !lyrics.error && !lyrics.found && <p className="text-gray-400">没有找到这首歌的歌词</p>}
                  {!lyrics.loading && lyrics.found && lyrics.text && <pre className="whitespace-pre-wrap font-sans">{lyrics.text}</pre>}
                </div>
              </div>

              <div className={lyricsOpen ? 'hidden' : ''}>
                {currentSong.source === 'youtube' && (() => {
                  const embedUrl = getYouTubeEmbedUrl(currentSong.url)
                  return embedUrl ? (
                    <iframe
                      key={currentSong.id}
                      className="aspect-video w-full"
                      src={`${embedUrl}${autoplayParam}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                      title={`${currentSong.title} - YouTube 播放器`}
                    />
                  ) : (
                    <p className="p-3 text-xs text-red-500">无法解析 YouTube 链接</p>
                  )
                })()}

                {currentSong.source === 'spotify' && (() => {
                  const base = currentSong.url.includes('/embed/') ? currentSong.url : currentSong.url.replace('spotify.com/', 'spotify.com/embed/')
                  const embedUrl = `${base}${base.includes('?') ? '&' : '?'}${autoplayParam ? 'autoplay=1' : 'autoplay=0'}`
                  return (
                    <iframe
                      key={currentSong.id}
                      className="h-80 w-full"
                      src={embedUrl}
                      allow="autoplay; encrypted-media"
                      title="Spotify"
                    />
                  )
                })()}

                {currentSong.source === 'file' && (
                  <div className="px-3 py-3">
                    <audio
                      ref={audioRef}
                      src={currentSong.url}
                      onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
                      onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
                      onEnded={handleTrackEnded}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onWaiting={() => setIsBuffering(true)}
                      onStalled={() => setIsBuffering(true)}
                      onPlaying={() => setIsBuffering(false)}
                      onCanPlay={() => setIsBuffering(false)}
                      autoPlay={isPlaying}
                    />
                    {isBuffering && (
                      <p className="mb-1 flex items-center gap-1.5 text-[11px] text-gray-400">
                        <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-gray-300 border-t-pink-500" aria-hidden="true" />
                        缓冲中…这段还没加载好，稍等一下
                      </p>
                    )}
                    <div
                      role="slider"
                      tabIndex={0}
                      aria-label="播放进度"
                      aria-valuemin={0}
                      aria-valuemax={Math.round(duration) || 0}
                      aria-valuenow={Math.round(currentTime)}
                      className="mb-1 h-1.5 w-full cursor-pointer rounded-full bg-gray-200"
                      onClick={(event) => {
                        const audio = audioRef.current
                        if (!audio || !duration) return
                        const rect = event.currentTarget.getBoundingClientRect()
                        const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
                        audio.currentTime = ratio * duration
                        setCurrentTime(audio.currentTime)
                      }}
                      onKeyDown={(event) => {
                        const audio = audioRef.current
                        if (!audio || !duration) return
                        if (event.key === 'ArrowRight') { audio.currentTime = Math.min(duration, audio.currentTime + 5); setCurrentTime(audio.currentTime) }
                        if (event.key === 'ArrowLeft') { audio.currentTime = Math.max(0, audio.currentTime - 5); setCurrentTime(audio.currentTime) }
                      }}
                    >
                      <div className="h-1.5 rounded-full bg-pink-500 transition-all" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
                      <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 border-t border-pink-50 px-3 py-2">
              <button
                onClick={cycleRepeatMode}
                className={`text-base transition-opacity ${repeatMode === 'off' ? 'opacity-40 hover:opacity-70' : 'opacity-100'}`}
                aria-label={`播放模式：${REPEAT_LABELS[repeatMode].label}，点击切换`}
                title={REPEAT_LABELS[repeatMode].label}
              >
                {REPEAT_LABELS[repeatMode].icon}
              </button>
              <button onClick={playPrev} className="text-lg text-gray-500 hover:text-primary" aria-label="上一首">⏮️</button>
              <button onClick={togglePlay} className="text-2xl hover:scale-105" aria-label={isPlaying ? '暂停' : '播放'}>{isPlaying ? '⏸️' : '▶️'}</button>
              <button onClick={playNext} className="text-lg text-gray-500 hover:text-primary" aria-label="下一首">⏭️</button>
              <button
                onClick={() => setLyricsOpen((open) => !open)}
                className={`text-base transition-opacity ${lyricsOpen ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                aria-label={lyricsOpen ? '关闭歌词' : '显示歌词'}
                aria-pressed={lyricsOpen}
                title="歌词"
              >
                📜
              </button>
            </div>
          </>
        )}
      </section>
    </>
  )
}
