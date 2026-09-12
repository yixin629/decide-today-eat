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
export default function GlobalMusicPlayer() {
  const { currentSong, isPlaying, currentTime, duration, audioRef, setCurrentTime, setDuration, setIsPlaying, togglePlay, playNext, playPrev } = useMusicPlayer()
  const pathname = usePathname()
  const onMusicPage = pathname === '/music-player'
  const [isOpen, setIsOpen] = useState(false)

  // Landing on the dedicated page opens the panel automatically; leaving it collapses back to the FAB.
  useEffect(() => { setIsOpen(onMusicPage) }, [onMusicPage])

  const panelOpen = isOpen || onMusicPage
  const hasSong = Boolean(currentSong)

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
              {currentSong.source === 'youtube' && (() => {
                const embedUrl = getYouTubeEmbedUrl(currentSong.url)
                return embedUrl ? (
                  <iframe
                    className="aspect-video w-full"
                    src={embedUrl}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    title={`${currentSong.title} - YouTube 播放器`}
                  />
                ) : (
                  <p className="p-3 text-xs text-red-500">无法解析 YouTube 链接</p>
                )
              })()}

              {currentSong.source === 'spotify' && (
                <iframe
                  className="h-80 w-full"
                  src={currentSong.url.includes('/embed/') ? currentSong.url : currentSong.url.replace('spotify.com/', 'spotify.com/embed/')}
                  allow="encrypted-media"
                  title="Spotify"
                />
              )}

              {currentSong.source === 'file' && (
                <div className="px-3 py-3">
                  <audio
                    ref={audioRef}
                    src={currentSong.url}
                    onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
                    onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
                    onEnded={() => playNext()}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    autoPlay={isPlaying}
                  />
                  <div className="mb-1 h-1.5 w-full rounded-full bg-gray-200">
                    <div className="h-1.5 rounded-full bg-pink-500 transition-all" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
                    <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-5 border-t border-pink-50 px-3 py-2">
              <button onClick={playPrev} className="text-lg text-gray-500 hover:text-primary" aria-label="上一首">⏮️</button>
              <button onClick={togglePlay} className="text-2xl hover:scale-105" aria-label={isPlaying ? '暂停' : '播放'}>{isPlaying ? '⏸️' : '▶️'}</button>
              <button onClick={playNext} className="text-lg text-gray-500 hover:text-primary" aria-label="下一首">⏭️</button>
            </div>
          </>
        )}
      </section>
    </>
  )
}
