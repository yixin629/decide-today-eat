'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMusicPlayer } from './MusicPlayerContext'
import { getYouTubeEmbedUrl } from '@/app/music-player/lib/youtube'

// Rendered once in the root layout so the <audio>/<iframe> element is never
// unmounted while navigating between pages — that's what keeps playback going
// after leaving /music-player (no premium APIs needed, just don't destroy the DOM node).
export default function GlobalMusicPlayer() {
  const { currentSong, isPlaying, currentTime, duration, audioRef, setCurrentTime, setDuration, setIsPlaying, togglePlay, playNext, playPrev } = useMusicPlayer()
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const onMusicPage = pathname === '/music-player'

  if (!currentSong) return null

  const showBigView = onMusicPage || expanded

  return (
    <div
      className={`fixed z-40 transition-all duration-300 ${
        showBigView
          ? 'inset-x-0 bottom-0 flex justify-center px-4 pb-4 sm:inset-auto sm:bottom-4 sm:right-4'
          : 'bottom-4 right-4'
      }`}
    >
      <div
        className={`overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-2xl transition-all duration-300 ${
          showBigView ? 'w-full max-w-sm' : 'w-72'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-pink-50 px-3 py-2">
          <span className="text-lg">{currentSong.cover || '🎵'}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-gray-800">{currentSong.title}</p>
            <p className="truncate text-xs text-gray-400">{currentSong.artist}</p>
          </div>
          {!onMusicPage && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              aria-label={expanded ? '收起播放器' : '展开播放器'}
            >
              {expanded ? '▾' : '▴'}
            </button>
          )}
          {!onMusicPage && (
            <Link href="/music-player" className="shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-50 hover:text-primary" aria-label="打开音乐播放器">
              ⤢
            </Link>
          )}
        </div>

        {currentSong.source === 'youtube' && (() => {
          const embedUrl = getYouTubeEmbedUrl(currentSong.url)
          return embedUrl ? (
            <iframe
              className={`w-full transition-all duration-300 ${showBigView ? 'aspect-video' : 'h-24'}`}
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
            className={`w-full transition-all duration-300 ${showBigView ? 'h-80' : 'h-24'}`}
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
            <div className="mb-2 h-1.5 w-full rounded-full bg-gray-200">
              <div className="h-1.5 rounded-full bg-pink-500 transition-all" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-5 border-t border-pink-50 px-3 py-2">
          <button onClick={playPrev} className="text-lg text-gray-500 hover:text-primary" aria-label="上一首">⏮️</button>
          <button onClick={togglePlay} className="text-2xl hover:scale-105" aria-label={isPlaying ? '暂停' : '播放'}>{isPlaying ? '⏸️' : '▶️'}</button>
          <button onClick={playNext} className="text-lg text-gray-500 hover:text-primary" aria-label="下一首">⏭️</button>
        </div>
      </div>
    </div>
  )
}
