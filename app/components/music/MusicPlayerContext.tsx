'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useToast } from '@/app/components/feedback/ToastProvider'
import { supabase } from '@/lib/supabase'

export interface Song {
  id: string
  title: string
  artist: string
  url: string
  cover?: string
  source: 'file' | 'spotify' | 'youtube'
  added_by?: string
  created_at?: string
  liked?: boolean
  pinned?: boolean
  pinned_at?: string | null
}

export type RepeatMode = 'off' | 'all' | 'one'

const REPEAT_STORAGE_KEY = 'music-player-repeat-mode'
const LAST_SONG_STORAGE_KEY = 'music-player-last-song-id'

function sortSongs(list: Song[]) {
  return [...list].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1
    if (a.pinned && b.pinned) {
      return (a.pinned_at ?? '').localeCompare(b.pinned_at ?? '')
    }
    return (a.created_at ?? '').localeCompare(b.created_at ?? '')
  })
}

interface MusicPlayerContextValue {
  songs: Song[]
  currentSong: Song | null
  currentSongIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  repeatMode: RepeatMode
  pinnedArtists: string[]
  audioRef: RefObject<HTMLAudioElement | null>
  setCurrentTime: (value: number) => void
  setDuration: (value: number) => void
  setIsPlaying: (value: boolean) => void
  selectSong: (id: string, autoplay?: boolean) => void
  togglePlay: () => void
  playNext: () => void
  playPrev: () => void
  handleTrackEnded: () => void
  cycleRepeatMode: () => void
  addSong: (song: { title: string; artist: string; url: string; source: Song['source']; cover: string }) => Promise<Song | null>
  removeSong: (id: string) => Promise<void>
  toggleLike: (id: string) => Promise<void>
  togglePin: (id: string) => Promise<void>
  togglePinnedArtist: (artist: string) => Promise<void>
  loadSongs: () => Promise<void>
}

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null)

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast()
  const audioRef = useRef<HTMLAudioElement>(null)

  const [songs, setSongs] = useState<Song[]>([])
  const [currentSongId, setCurrentSongId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all')
  const [pinnedArtists, setPinnedArtists] = useState<string[]>([])
  const hasRestoredLastSong = useRef(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(REPEAT_STORAGE_KEY)
      if (stored === 'off' || stored === 'all' || stored === 'one') setRepeatMode(stored)
    } catch {
      // localStorage unavailable (private mode etc.) — keep default
    }
  }, [])

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((mode) => {
      const next = mode === 'all' ? 'one' : mode === 'one' ? 'off' : 'all'
      try { window.localStorage.setItem(REPEAT_STORAGE_KEY, next) } catch { /* ignore */ }
      return next
    })
  }, [])

  const loadSongs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      setSongs(sortSongs(data || []))
    } catch (error) {
      console.error('Failed to load songs:', error)
      toast.error('加载歌单失败')
    }
  }, [toast])

  const loadPinnedArtists = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pinned_artists')
        .select('artist')
        .order('pinned_at', { ascending: true })
      if (error) throw error
      setPinnedArtists((data ?? []).map((row) => row.artist as string))
    } catch (error) {
      // Table may not exist yet if the enhancements migration hasn't been run — fail quietly.
      console.warn('Failed to load pinned artists (has the migration been run?):', error)
    }
  }, [])

  useEffect(() => {
    loadSongs()
    loadPinnedArtists()

    const songsChannel = supabase
      .channel('songs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'songs' }, () => {
        loadSongs()
      })
      .subscribe()

    const artistsChannel = supabase
      .channel('pinned_artists_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pinned_artists' }, () => {
        loadPinnedArtists()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(songsChannel)
      supabase.removeChannel(artistsChannel)
    }
  }, [loadSongs, loadPinnedArtists])

  // Restore the last-played track (paused) after a hard page reload, so the floating
  // player doesn't just vanish — currentSongId otherwise only lives in memory and a
  // full refresh (not a client-side Link navigation) wipes it.
  useEffect(() => {
    if (hasRestoredLastSong.current || currentSongId || songs.length === 0) return
    hasRestoredLastSong.current = true
    try {
      const storedId = window.localStorage.getItem(LAST_SONG_STORAGE_KEY)
      if (storedId && songs.some((song) => song.id === storedId)) {
        setCurrentSongId(storedId)
      }
    } catch {
      // ignore
    }
  }, [songs, currentSongId])

  useEffect(() => {
    try {
      if (currentSongId) window.localStorage.setItem(LAST_SONG_STORAGE_KEY, currentSongId)
      else window.localStorage.removeItem(LAST_SONG_STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [currentSongId])

  const currentSong = songs.find((song) => song.id === currentSongId) ?? null
  const currentSongIndex = currentSong ? songs.indexOf(currentSong) : -1

  // Actually drive the <audio> element: React's `autoPlay` prop only fires on mount,
  // and this element stays mounted across song switches (that's what keeps navigation
  // from killing playback), so switching songs or hitting play needs an explicit play() call.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || currentSong?.source !== 'file') return
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [isPlaying, currentSong?.id, currentSong?.source])

  const selectSong = useCallback((id: string, autoplay = true) => {
    setCurrentSongId(id)
    setCurrentTime(0)
    setDuration(0)
    if (autoplay) setIsPlaying(true)
  }, [])

  const togglePlay = useCallback(() => {
    if (currentSong?.source === 'file' && audioRef.current) {
      if (isPlaying) audioRef.current.pause()
      else audioRef.current.play()
      setIsPlaying(!isPlaying)
    } else {
      setIsPlaying(!isPlaying)
    }
  }, [currentSong, isPlaying])

  const playNext = useCallback(() => {
    if (songs.length === 0) return
    const index = currentSongIndex < 0 ? -1 : currentSongIndex
    const nextIndex = (index + 1) % songs.length
    selectSong(songs[nextIndex].id)
  }, [songs, currentSongIndex, selectSong])

  const playPrev = useCallback(() => {
    if (songs.length === 0) return
    const index = currentSongIndex < 0 ? 0 : currentSongIndex
    const prevIndex = index - 1 < 0 ? songs.length - 1 : index - 1
    selectSong(songs[prevIndex].id)
  }, [songs, currentSongIndex, selectSong])

  // Wired to the file <audio>'s onEnded. (YouTube/Spotify iframes don't expose an end event
  // without their JS APIs, so repeat-one/auto-advance only apply to uploaded MP3s for now.)
  const handleTrackEnded = useCallback(() => {
    if (repeatMode === 'one') {
      const audio = audioRef.current
      if (audio) { audio.currentTime = 0; audio.play().catch(() => setIsPlaying(false)) }
      return
    }
    if (repeatMode === 'off' && currentSongIndex === songs.length - 1) {
      setIsPlaying(false)
      return
    }
    playNext()
  }, [repeatMode, currentSongIndex, songs.length, playNext])

  const addSong = useCallback(async (song: { title: string; artist: string; url: string; source: Song['source']; cover: string }) => {
    try {
      const { data, error } = await supabase.from('songs').insert({
        title: song.title || '未知歌曲',
        artist: song.artist || '未知歌手',
        url: song.url,
        source: song.source,
        cover: song.cover,
        added_by: 'user',
      }).select().single()
      if (error) throw error

      const newSong = data as Song
      // Jump straight to the new song and start playing it instead of just adding it silently.
      setSongs((prev) => {
        if (prev.some((existing) => existing.id === newSong.id)) return prev
        return sortSongs([...prev, newSong])
      })
      setCurrentSongId(newSong.id)
      setCurrentTime(0)
      setDuration(0)
      setIsPlaying(true)

      await loadSongs()
      return newSong
    } catch (error) {
      console.error('Add song failed:', error)
      return null
    }
  }, [loadSongs])

  const removeSong = useCallback(async (id: string) => {
    const { error } = await supabase.from('songs').delete().eq('id', id)
    if (error) throw error
    if (currentSongId === id) setCurrentSongId(null)
    await loadSongs()
  }, [currentSongId, loadSongs])

  const toggleLike = useCallback(async (id: string) => {
    const song = songs.find((item) => item.id === id)
    if (!song) return
    const liked = !song.liked
    setSongs((prev) => prev.map((item) => item.id === id ? { ...item, liked } : item))
    const { error } = await supabase.from('songs').update({ liked }).eq('id', id)
    if (error) {
      console.error('Toggle like failed:', error)
      toast.error('操作失败，请确认已执行 music-player-enhancements.sql 迁移')
      await loadSongs()
    }
  }, [songs, toast, loadSongs])

  const togglePin = useCallback(async (id: string) => {
    const song = songs.find((item) => item.id === id)
    if (!song) return
    const pinned = !song.pinned
    const pinnedAt = pinned ? new Date().toISOString() : null
    setSongs((prev) => sortSongs(prev.map((item) => item.id === id ? { ...item, pinned, pinned_at: pinnedAt } : item)))
    const { error } = await supabase.from('songs').update({ pinned, pinned_at: pinnedAt }).eq('id', id)
    if (error) {
      console.error('Toggle pin failed:', error)
      toast.error('操作失败，请确认已执行 music-player-enhancements.sql 迁移')
      await loadSongs()
    }
  }, [songs, toast, loadSongs])

  const togglePinnedArtist = useCallback(async (artist: string) => {
    const isPinned = pinnedArtists.includes(artist)
    setPinnedArtists((prev) => isPinned ? prev.filter((name) => name !== artist) : [...prev, artist])
    try {
      if (isPinned) {
        const { error } = await supabase.from('pinned_artists').delete().eq('artist', artist)
        if (error) throw error
      } else {
        const { error } = await supabase.from('pinned_artists').upsert({ artist })
        if (error) throw error
      }
    } catch (error) {
      console.error('Toggle pinned artist failed:', error)
      toast.error('操作失败，请确认已执行 music-player-enhancements.sql 迁移')
      await loadPinnedArtists()
    }
  }, [pinnedArtists, toast, loadPinnedArtists])

  const value = useMemo<MusicPlayerContextValue>(() => ({
    songs,
    currentSong,
    currentSongIndex,
    isPlaying,
    currentTime,
    duration,
    repeatMode,
    pinnedArtists,
    audioRef,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    selectSong,
    togglePlay,
    playNext,
    playPrev,
    handleTrackEnded,
    cycleRepeatMode,
    addSong,
    removeSong,
    toggleLike,
    togglePin,
    togglePinnedArtist,
    loadSongs,
  }), [songs, currentSong, currentSongIndex, isPlaying, currentTime, duration, repeatMode, pinnedArtists, selectSong, togglePlay, playNext, playPrev, handleTrackEnded, cycleRepeatMode, addSong, removeSong, toggleLike, togglePin, togglePinnedArtist, loadSongs])

  return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext)
  if (!context) throw new Error('useMusicPlayer must be used within MusicPlayerProvider')
  return context
}
