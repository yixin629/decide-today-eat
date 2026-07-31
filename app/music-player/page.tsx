'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import BackButton from '@/app/components/ui/BackButton'
import { useToast } from '@/app/components/feedback/ToastProvider'
import { supabase } from '@/lib/supabase'

interface Song {
  id: string
  title: string
  artist: string
  url: string
  cover?: string
  source: 'file' | 'spotify' | 'youtube'
  added_by?: string
  created_at?: string
}

export default function MusicPlayerPage() {
  const toast = useToast()
  const audioRef = useRef<HTMLAudioElement>(null)

  // State
  const [songs, setSongs] = useState<Song[]>([])
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  // Playback Modes
  const isRepeat = false
  const isShuffle = false

  // UI State
  const [showAddSong, setShowAddSong] = useState(false)

  // Form State
  const [newSongUrl, setNewSongUrl] = useState('')
  const [newSongTitle, setNewSongTitle] = useState('')
  const [newSongArtist, setNewSongArtist] = useState('')
  const [detectedSource, setDetectedSource] = useState<'file' | 'spotify' | 'youtube'>('file')

  // Load songs from Supabase
  const loadSongs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      setSongs(data || [])
    } catch (error) {
      console.error('Failed to load songs:', error)
      toast.error('加载歌单失败')
    } finally {
    }
  }, [toast])

  // Initial Load & Realtime Subscription
  useEffect(() => {
    loadSongs()

    const channel = supabase
      .channel('songs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'songs' }, () => {
        loadSongs()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadSongs])

  // Detect Source when URL changes
  useEffect(() => {
    if (!newSongUrl) return

    if (newSongUrl.includes('spotify.com')) {
      setDetectedSource('spotify')
    } else if (newSongUrl.includes('youtube.com') || newSongUrl.includes('youtu.be')) {
      setDetectedSource('youtube')
    } else {
      setDetectedSource('file')
    }
  }, [newSongUrl])

  // Current Song
  const currentSong = songs[currentSongIndex]

  // Add Song
  const handleAddSong = async () => {
    if (!newSongUrl) {
      toast.error('请输入链接')
      return
    }

    try {
      const finalUrl = newSongUrl
      let finalCover = '🎵'

      // Process Links
      if (detectedSource === 'spotify') {
        finalCover = '🟢' // Spotify Icon
        // Extract Track ID if needed, or store full URL.
        // Spotify Embed works with full URL usually.
      } else if (detectedSource === 'youtube') {
        finalCover = '🔴' // YouTube Icon
        // Convert watch URL to embed URL if necessary, but we can do it at render time.
      }

      const { error } = await supabase.from('songs').insert({
        title: newSongTitle || '未知歌曲',
        artist: newSongArtist || '未知歌手',
        url: finalUrl,
        source: detectedSource,
        cover: finalCover,
        added_by: 'user', // In real app, get current user
      })

      if (error) throw error

      toast.success('添加成功！')
      setNewSongUrl('')
      setNewSongTitle('')
      setNewSongArtist('')
      setShowAddSong(false)
    } catch (error) {
      console.error('Add song failed:', error)
      toast.error('添加失败')
    }
  }

  // Remove Song
  const removeSong = async (id: string) => {
    try {
      const { error } = await supabase.from('songs').delete().eq('id', id)
      if (error) throw error
      toast.success('已移除')

      // Adjust index
      if (currentSongIndex >= songs.length - 1) {
        setCurrentSongIndex(Math.max(0, songs.length - 2))
      }
    } catch {
      toast.error('移除失败')
    }
  }

  // Play Controls
  const togglePlay = () => {
    if (currentSong?.source === 'file' && audioRef.current) {
      if (isPlaying) audioRef.current.pause()
      else audioRef.current.play()
      setIsPlaying(!isPlaying)
    } else {
      // For Iframe players, we can't easily control play/pause from outside without API
      // So we just toggle state to update UI, but user has to click the iframe usually.
      setIsPlaying(!isPlaying)
    }
  }

  const playNext = () => {
    if (songs.length === 0) return
    const nextIndex = isShuffle
      ? Math.floor(Math.random() * songs.length)
      : (currentSongIndex + 1) % songs.length
    setCurrentSongIndex(nextIndex)
    setIsPlaying(true)
  }

  const playPrev = () => {
    if (songs.length === 0) return
    let prevIndex = currentSongIndex - 1
    if (prevIndex < 0) prevIndex = songs.length - 1
    setCurrentSongIndex(prevIndex)
    setIsPlaying(true)
  }

  // Helper to render Player
  const renderPlayer = () => {
    if (!currentSong) return null

    if (currentSong.source === 'spotify') {
      // Convert URL to Embed URL
      // https://open.spotify.com/track/ID?si=... -> https://open.spotify.com/embed/track/ID
      let embedUrl = currentSong.url
      if (!embedUrl.includes('/embed/')) {
        embedUrl = embedUrl.replace('spotify.com/', 'spotify.com/embed/')
      }
      return (
        <iframe
          className="w-full h-80 rounded-xl"
          src={embedUrl}
          allow="encrypted-media"
          title="Spotify"
        />
      )
    }

    if (currentSong.source === 'youtube') {
      // https://www.youtube.com/watch?v=ID -> https://www.youtube.com/embed/ID
      // https://youtu.be/ID -> https://www.youtube.com/embed/ID
      const embedUrl = currentSong.url
      let videoId = ''

      if (embedUrl.includes('v=')) {
        videoId = embedUrl.split('v=')[1]?.split('&')[0]
      } else if (embedUrl.includes('youtu.be/')) {
        videoId = embedUrl.split('youtu.be/')[1]?.split('?')[0]
      }

      if (videoId) {
        return (
          <iframe
            className="w-full h-60 rounded-xl"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title="YouTube"
          />
        )
      } else {
        return <div className="text-red-500">无法解析 YouTube 链接</div>
      }
    }

    // Default File Player
    return (
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">{currentSong.cover || '🎵'}</div>
        <h2 className="text-xl font-bold text-gray-800">{currentSong.title}</h2>
        <p className="text-gray-600 mb-6">{currentSong.artist}</p>

        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={currentSong.url}
          onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
          onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
          onEnded={() => {
            if (isRepeat) audioRef.current?.play()
            else playNext()
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          autoPlay={isPlaying}
        />

        {/* Simple Progress (Visual Only for now as customizing range is verbose) */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-6">
          <span>
            {Math.floor(currentTime / 60)}:
            {Math.floor(currentTime % 60)
              .toString()
              .padStart(2, '0')}
          </span>
          <span>
            {Math.floor(duration / 60)}:
            {Math.floor(duration % 60)
              .toString()
              .padStart(2, '0')}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          <button onClick={playPrev} className="text-3xl hover:text-primary transition-colors">
            ⏮️
          </button>
          <button onClick={togglePlay} className="text-5xl hover:scale-105 transition-transform">
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <button onClick={playNext} className="text-3xl hover:text-primary transition-colors">
            ⏭️
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <BackButton href="/" text="返回首页" />

        <div className="card">
          <h1 className="text-3xl md:text-4xl font-bold text-primary text-center mb-2">
            🎵 共享音乐播放器 (Online)
          </h1>
          <p className="text-gray-600 text-center mb-6">支持 MP3 / Spotify / YouTube • 实时同步</p>

          {/* Player Display */}
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 mb-6 shadow-inner min-h-[300px] flex flex-col justify-center">
            {songs.length > 0 ? (
              renderPlayer()
            ) : (
              <div className="text-center text-gray-400">
                <p className="text-4xl mb-2">☁️</p>
                <p>播放列表为空，快添加一首吧！</p>
              </div>
            )}
          </div>

          {/* Playlist Controls */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-700">播放列表 ({songs.length})</h3>
            <button
              onClick={() => setShowAddSong(!showAddSong)}
              className="px-4 py-2 bg-pink-100 text-pink-600 rounded-full text-sm font-medium hover:bg-pink-200 transition-colors"
            >
              + 添加歌曲
            </button>
          </div>

          {/* Add Song Form */}
          {showAddSong && (
            <div className="bg-gray-50 p-4 rounded-xl mb-6 animate-fade-in border border-gray-100">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="链接 (MP3 / Spotify / YouTube)"
                  value={newSongUrl}
                  onChange={(e) => setNewSongUrl(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary outline-none"
                />
                <div className="text-xs text-gray-500 text-right">
                  已识别来源:{' '}
                  <span className="font-bold uppercase text-primary">{detectedSource}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="歌曲名"
                    value={newSongTitle}
                    onChange={(e) => setNewSongTitle(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary outline-none"
                  />
                  <input
                    type="text"
                    placeholder="歌手"
                    value={newSongArtist}
                    onChange={(e) => setNewSongArtist(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <button
                  onClick={handleAddSong}
                  className="w-full py-2 bg-primary text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  确认添加
                </button>
              </div>
            </div>
          )}

          {/* Song List */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {songs.map((song, index) => (
              <div
                key={song.id}
                onClick={() => {
                  setCurrentSongIndex(index)
                  setIsPlaying(true)
                }}
                className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all border ${
                  index === currentSongIndex
                    ? 'bg-white border-primary shadow-md transform scale-[1.02]'
                    : 'bg-white border-transparent hover:border-gray-200 hover:shadow-sm'
                }`}
              >
                <span className="text-xl">{song.cover}</span>
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-bold truncate ${
                      index === currentSongIndex ? 'text-primary' : 'text-gray-800'
                    }`}
                  >
                    {song.title}
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-2">
                    <span className="uppercase bg-gray-100 px-1 rounded text-[10px]">
                      {song.source}
                    </span>
                    {song.artist}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeSong(song.id)
                  }}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
