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
}

interface MusicPlayerContextValue {
  songs: Song[]
  currentSong: Song | null
  currentSongIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  audioRef: RefObject<HTMLAudioElement | null>
  setCurrentTime: (value: number) => void
  setDuration: (value: number) => void
  setIsPlaying: (value: boolean) => void
  selectSong: (index: number, autoplay?: boolean) => void
  togglePlay: () => void
  playNext: () => void
  playPrev: () => void
  addSong: (song: { title: string; artist: string; url: string; source: Song['source']; cover: string }) => Promise<boolean>
  removeSong: (id: string) => Promise<void>
  loadSongs: () => Promise<void>
}

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null)

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast()
  const audioRef = useRef<HTMLAudioElement>(null)

  const [songs, setSongs] = useState<Song[]>([])
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

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
    }
  }, [toast])

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

  const currentSong = songs[currentSongIndex] ?? null

  const selectSong = useCallback((index: number, autoplay = true) => {
    setCurrentSongIndex(index)
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
    const nextIndex = (currentSongIndex + 1) % songs.length
    selectSong(nextIndex)
  }, [songs.length, currentSongIndex, selectSong])

  const playPrev = useCallback(() => {
    if (songs.length === 0) return
    const prevIndex = currentSongIndex - 1 < 0 ? songs.length - 1 : currentSongIndex - 1
    selectSong(prevIndex)
  }, [songs.length, currentSongIndex, selectSong])

  const addSong = useCallback(async (song: { title: string; artist: string; url: string; source: Song['source']; cover: string }) => {
    try {
      const { error } = await supabase.from('songs').insert({
        title: song.title || '未知歌曲',
        artist: song.artist || '未知歌手',
        url: song.url,
        source: song.source,
        cover: song.cover,
        added_by: 'user',
      })
      if (error) throw error
      await loadSongs()
      return true
    } catch (error) {
      console.error('Add song failed:', error)
      return false
    }
  }, [loadSongs])

  const removeSong = useCallback(async (id: string) => {
    const { error } = await supabase.from('songs').delete().eq('id', id)
    if (error) throw error
    if (currentSongIndex >= songs.length - 1) {
      setCurrentSongIndex(Math.max(0, songs.length - 2))
    }
    await loadSongs()
  }, [currentSongIndex, songs.length, loadSongs])

  const value = useMemo<MusicPlayerContextValue>(() => ({
    songs,
    currentSong,
    currentSongIndex,
    isPlaying,
    currentTime,
    duration,
    audioRef,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    selectSong,
    togglePlay,
    playNext,
    playPrev,
    addSong,
    removeSong,
    loadSongs,
  }), [songs, currentSong, currentSongIndex, isPlaying, currentTime, duration, selectSong, togglePlay, playNext, playPrev, addSong, removeSong, loadSongs])

  return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext)
  if (!context) throw new Error('useMusicPlayer must be used within MusicPlayerProvider')
  return context
}
