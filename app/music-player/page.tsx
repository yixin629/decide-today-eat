'use client'

import { useState, useEffect } from 'react'
import BackButton from '@/app/components/ui/BackButton'
import { useToast } from '@/app/components/feedback/ToastProvider'
import { useMusicPlayer } from '@/app/components/music/MusicPlayerContext'
import { parseYouTubeUrl } from './lib/youtube'

interface SearchResult { videoId: string; title: string; artist: string; thumbnail: string | null }

export default function MusicPlayerPage() {
  const toast = useToast()
  const { songs, currentSongIndex, selectSong, addSong, removeSong } = useMusicPlayer()

  // UI State
  const [showAddSong, setShowAddSong] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Form State
  const [newSongUrl, setNewSongUrl] = useState('')
  const [newSongTitle, setNewSongTitle] = useState('')
  const [newSongArtist, setNewSongArtist] = useState('')
  const [detectedSource, setDetectedSource] = useState<'file' | 'spotify' | 'youtube'>('file')

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

  // Add Song
  const handleAddSong = async () => {
    if (!newSongUrl) {
      toast.error('请输入链接')
      return
    }

    if (detectedSource === 'youtube' && !parseYouTubeUrl(newSongUrl)) {
      toast.error('无法识别此 YouTube / YouTube Music 链接')
      return
    }

    let finalCover = '🎵'
    if (detectedSource === 'spotify') finalCover = '🟢'
    else if (detectedSource === 'youtube') finalCover = '🔴'

    const success = await addSong({ title: newSongTitle, artist: newSongArtist, url: newSongUrl, source: detectedSource, cover: finalCover })
    if (success) {
      toast.success('添加成功！')
      setNewSongUrl('')
      setNewSongTitle('')
      setNewSongArtist('')
      setShowAddSong(false)
    } else {
      toast.error('添加失败')
    }
  }

  const searchYouTube = async () => {
    const query = searchQuery.trim()
    if (query.length < 2) { toast.warning('请输入至少两个字'); return }
    setIsSearching(true)
    try {
      const response = await fetch(`/api/youtube-search?q=${encodeURIComponent(query)}`)
      const data = await response.json() as { results?: SearchResult[]; error?: string }
      if (!response.ok) throw new Error(data.error ?? '搜索失败')
      setSearchResults(data.results ?? [])
      if (!data.results?.length) toast.info('没有找到可嵌入的视频')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '搜索失败')
    } finally { setIsSearching(false) }
  }

  const addSearchResult = async (result: SearchResult) => {
    const success = await addSong({ title: result.title, artist: result.artist, url: `https://www.youtube.com/watch?v=${result.videoId}`, source: 'youtube', cover: '🔴' })
    if (success) toast.success(`已加入：${result.title}`)
    else toast.error('加入歌单失败')
  }

  const handleRemoveSong = async (id: string) => {
    try {
      await removeSong(id)
      toast.success('已移除')
    } catch {
      toast.error('移除失败')
    }
  }

  return (
    <div className="min-h-screen p-4 pb-72 md:p-8 md:pb-8">
      <div className="max-w-2xl mx-auto">
        <BackButton href="/" text="返回首页" />

        <div className="card">
          <h1 className="text-3xl md:text-4xl font-bold text-primary text-center mb-2">
            🎵 共享音乐播放器 (Online)
          </h1>
          <p className="text-gray-600 text-center mb-2">支持 MP3 / Spotify / YouTube Music • 双方共享歌单</p>
          <p className="text-gray-400 text-center text-xs mb-6">切到其他页面音乐也会继续播放，右下角有迷你播放器</p>

          {songs.length === 0 && (
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 mb-6 shadow-inner text-center text-gray-400">
              <p className="text-4xl mb-2">☁️</p>
              <p>播放列表为空，快添加一首吧！</p>
            </div>
          )}

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
                <div>
                  <label className="label-primary">直接搜索 YouTube Music</label>
                  <div className="flex gap-2">
                    <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void searchYouTube() }} placeholder="歌曲、歌手或专辑" className="input-primary" maxLength={80} />
                    <button type="button" onClick={() => void searchYouTube()} disabled={isSearching} className="btn-primary shrink-0 px-5">{isSearching ? '搜索中…' : '搜索'}</button>
                  </div>
                </div>
                {searchResults.length > 0 && <div className="grid max-h-72 gap-2 overflow-y-auto rounded-xl border bg-white p-2">{searchResults.map((result) => <div key={result.videoId} className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50"><div className="h-12 w-20 shrink-0 rounded-md bg-cover bg-center bg-gray-200" style={result.thumbnail ? { backgroundImage: `url(${result.thumbnail})` } : undefined} /><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-semibold text-gray-900">{result.title}</p><p className="truncate text-xs text-gray-500">{result.artist}</p></div><button type="button" onClick={() => void addSearchResult(result)} className="rounded-full bg-pink-100 px-3 py-2 text-xs font-bold text-pink-700 hover:bg-pink-200">＋歌单</button></div>)}</div>}
                <div className="flex items-center gap-3 py-1 text-xs text-gray-400"><span className="h-px flex-1 bg-gray-200" /><span>或粘贴链接</span><span className="h-px flex-1 bg-gray-200" /></div>
                <input
                  type="text"
                  placeholder="链接（MP3 / Spotify / YouTube Music）"
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
                onClick={() => selectSong(index)}
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
                    void handleRemoveSong(song.id)
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
