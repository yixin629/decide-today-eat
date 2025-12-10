'use client'

import { useState, useRef, useEffect } from 'react'
import BackButton from '../components/BackButton'
import { useToast } from '../components/ToastProvider'

interface Song {
  id: string
  title: string
  artist: string
  url: string
  cover?: string
  addedBy: string
  createdAt: string
}

// 预设歌曲列表（免费音乐）
const PRESET_SONGS: Omit<Song, 'id' | 'addedBy' | 'createdAt'>[] = [
  // 林俊杰 - Always Online 设为默认第一首
  {
    title: 'Always Online',
    artist: '林俊杰',
    url: 'https://music.163.com/song/media/outer/url?id=188175.mp3',
    cover: '💻',
  },
  {
    title: '小酒窝',
    artist: '林俊杰/蔡卓妍',
    url: 'https://music.163.com/song/media/outer/url?id=188204.mp3',
    cover: '😊',
  },
  {
    title: '江南',
    artist: '林俊杰',
    url: 'https://music.163.com/song/media/outer/url?id=108242.mp3',
    cover: '🌊',
  },
  {
    title: '她说',
    artist: '林俊杰',
    url: 'https://music.163.com/song/media/outer/url?id=287682.mp3',
    cover: '💬',
  },
  {
    title: '可惜没如果',
    artist: '林俊杰',
    url: 'https://music.163.com/song/media/outer/url?id=31654343.mp3',
    cover: '😢',
  },
  {
    title: '修炼爱情',
    artist: '林俊杰',
    url: 'https://music.163.com/song/media/outer/url?id=27876224.mp3',
    cover: '❤️‍🔥',
  },
  // 曹格
  {
    title: '背叛',
    artist: '曹格',
    url: 'https://music.163.com/song/media/outer/url?id=185809.mp3',
    cover: '💔',
  },
  {
    title: '梁山伯与朱丽叶',
    artist: '曹格/卓文萱',
    url: 'https://music.163.com/song/media/outer/url?id=185820.mp3',
    cover: '🦋',
  },
  {
    title: '世界唯一的你',
    artist: '曹格',
    url: 'https://music.163.com/song/media/outer/url?id=185807.mp3',
    cover: '🌟',
  },
  {
    title: '寂寞先生',
    artist: '曹格',
    url: 'https://music.163.com/song/media/outer/url?id=185816.mp3',
    cover: '😔',
  },
  {
    title: '超级爆',
    artist: '曹格',
    url: 'https://music.163.com/song/media/outer/url?id=185819.mp3',
    cover: '💥',
  },
  {
    title: '两只恋人',
    artist: '曹格',
    url: 'https://music.163.com/song/media/outer/url?id=185806.mp3',
    cover: '👫',
  },
  {
    title: 'Superman',
    artist: '曹格',
    url: 'https://music.163.com/song/media/outer/url?id=185810.mp3',
    cover: '🦸',
  },
  {
    title: '魔鬼中的天使',
    artist: '曹格/田馥甄',
    url: 'https://music.163.com/song/media/outer/url?id=287020.mp3',
    cover: '😇',
  },
  {
    title: '数到五答应我',
    artist: '曹格',
    url: 'https://music.163.com/song/media/outer/url?id=185818.mp3',
    cover: '🖐️',
  },
  // 其他经典情歌
  {
    title: '小幸运',
    artist: '田馥甄',
    url: 'https://music.163.com/song/media/outer/url?id=25706282.mp3',
    cover: '🎵',
  },
  {
    title: '告白气球',
    artist: '周杰伦',
    url: 'https://music.163.com/song/media/outer/url?id=418602084.mp3',
    cover: '🎈',
  },
  {
    title: '喜欢你',
    artist: 'G.E.M.邓紫棋',
    url: 'https://music.163.com/song/media/outer/url?id=29567189.mp3',
    cover: '💕',
  },
  {
    title: '情非得已',
    artist: '庾澄庆',
    url: 'https://music.163.com/song/media/outer/url?id=254574.mp3',
    cover: '💝',
  },
  {
    title: '遇见',
    artist: '孙燕姿',
    url: 'https://music.163.com/song/media/outer/url?id=254753.mp3',
    cover: '✨',
  },
]

export default function MusicPlayerPage() {
  const toast = useToast()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playlist, setPlaylist] = useState<Song[]>([])
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isRepeat, setIsRepeat] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [showAddSong, setShowAddSong] = useState(false)
  const [newSongUrl, setNewSongUrl] = useState('')
  const [newSongTitle, setNewSongTitle] = useState('')
  const [newSongArtist, setNewSongArtist] = useState('')

  // 加载播放列表
  useEffect(() => {
    const saved = localStorage.getItem('couplePlaylist')
    if (saved) {
      setPlaylist(JSON.parse(saved))
    } else {
      // 初始化预设歌曲
      const initialPlaylist = PRESET_SONGS.map((song, i) => ({
        ...song,
        id: `preset-${i}`,
        addedBy: '系统',
        createdAt: new Date().toISOString(),
      }))
      setPlaylist(initialPlaylist)
      localStorage.setItem('couplePlaylist', JSON.stringify(initialPlaylist))
    }
  }, [])

  // 保存播放列表
  const savePlaylist = (newPlaylist: Song[]) => {
    setPlaylist(newPlaylist)
    localStorage.setItem('couplePlaylist', JSON.stringify(newPlaylist))
  }

  // 当前歌曲
  const currentSong = playlist[currentSongIndex]

  // 播放/暂停
  const togglePlay = () => {
    if (!audioRef.current || !currentSong) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => {
        toast.error('播放失败，请检查音频链接')
      })
    }
    setIsPlaying(!isPlaying)
  }

  // 上一首
  const playPrev = () => {
    if (playlist.length === 0) return
    let newIndex = currentSongIndex - 1
    if (newIndex < 0) newIndex = playlist.length - 1
    setCurrentSongIndex(newIndex)
    setIsPlaying(true)
  }

  // 下一首
  const playNext = () => {
    if (playlist.length === 0) return
    let newIndex: number
    if (isShuffle) {
      newIndex = Math.floor(Math.random() * playlist.length)
    } else {
      newIndex = (currentSongIndex + 1) % playlist.length
    }
    setCurrentSongIndex(newIndex)
    setIsPlaying(true)
  }

  // 歌曲结束
  const handleEnded = () => {
    if (isRepeat) {
      audioRef.current?.play()
    } else {
      playNext()
    }
  }

  // 更新播放进度
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  // 加载歌曲元数据
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  // 跳转进度
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  // 调整音量
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    if (audioRef.current) {
      audioRef.current.volume = vol
    }
  }

  // 当歌曲索引变化时，自动播放
  useEffect(() => {
    if (audioRef.current && currentSong && isPlaying) {
      audioRef.current.load()
      audioRef.current.play().catch(() => {})
    }
  }, [currentSongIndex, currentSong, isPlaying])

  // 设置初始音量
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // 添加歌曲
  const addSong = () => {
    if (!newSongUrl.trim()) {
      toast.error('请输入歌曲链接')
      return
    }

    const newSong: Song = {
      id: Date.now().toString(),
      title: newSongTitle || '未知歌曲',
      artist: newSongArtist || '未知歌手',
      url: newSongUrl,
      cover: '🎵',
      addedBy: 'zyx', // 可以根据登录用户变化
      createdAt: new Date().toISOString(),
    }

    const newPlaylist = [...playlist, newSong]
    savePlaylist(newPlaylist)
    setNewSongUrl('')
    setNewSongTitle('')
    setNewSongArtist('')
    setShowAddSong(false)
    toast.success('歌曲添加成功！')
  }

  // 删除歌曲
  const removeSong = (id: string) => {
    const index = playlist.findIndex((s) => s.id === id)
    const newPlaylist = playlist.filter((s) => s.id !== id)
    savePlaylist(newPlaylist)

    // 调整当前索引
    if (index < currentSongIndex) {
      setCurrentSongIndex(currentSongIndex - 1)
    } else if (index === currentSongIndex) {
      setCurrentSongIndex(0)
      setIsPlaying(false)
    }
    toast.info('歌曲已移除')
  }

  // 格式化时间
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <BackButton href="/" text="返回首页" />

        <div className="card">
          <h1 className="text-3xl md:text-4xl font-bold text-primary text-center mb-2">
            🎵 共享音乐播放器
          </h1>
          <p className="text-gray-600 text-center mb-6">一起听歌，分享浪漫时刻</p>

          {/* 当前播放 */}
          <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl p-6 mb-6">
            {currentSong ? (
              <>
                <div className="text-center mb-4">
                  <div className="text-6xl mb-3 animate-pulse">{currentSong.cover || '🎵'}</div>
                  <h2 className="text-xl font-bold text-gray-800">{currentSong.title}</h2>
                  <p className="text-gray-600">{currentSong.artist}</p>
                </div>

                {/* 进度条 */}
                <div className="mb-4">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* 控制按钮 */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={() => setIsShuffle(!isShuffle)}
                    className={`text-2xl transition-all ${
                      isShuffle ? 'text-pink-500' : 'text-gray-400'
                    }`}
                    title="随机播放"
                  >
                    🔀
                  </button>
                  <button
                    onClick={playPrev}
                    className="text-3xl hover:scale-110 transition-transform"
                  >
                    ⏮️
                  </button>
                  <button
                    onClick={togglePlay}
                    className="text-5xl hover:scale-110 transition-transform"
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </button>
                  <button
                    onClick={playNext}
                    className="text-3xl hover:scale-110 transition-transform"
                  >
                    ⏭️
                  </button>
                  <button
                    onClick={() => setIsRepeat(!isRepeat)}
                    className={`text-2xl transition-all ${
                      isRepeat ? 'text-pink-500' : 'text-gray-400'
                    }`}
                    title="单曲循环"
                  >
                    🔁
                  </button>
                </div>

                {/* 音量控制 */}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">🔈</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                  <span className="text-lg">🔊</span>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎵</div>
                <p>播放列表为空，添加一些歌曲吧！</p>
              </div>
            )}
          </div>

          {/* 隐藏的audio元素 */}
          <audio
            ref={audioRef}
            src={currentSong?.url}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onError={() => {
              if (isPlaying) {
                toast.error(`"${currentSong?.title}" 播放失败，自动播放下一首`)
                playNext()
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* 播放列表 */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-700">📋 播放列表 ({playlist.length})</h3>
              <button
                onClick={() => setShowAddSong(!showAddSong)}
                className="text-pink-500 hover:text-pink-600 text-sm font-medium"
              >
                + 添加歌曲
              </button>
            </div>

            {/* 添加歌曲表单 */}
            {showAddSong && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
                <input
                  type="text"
                  placeholder="歌曲链接 (mp3 URL)"
                  value={newSongUrl}
                  onChange={(e) => setNewSongUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="歌曲名称"
                    value={newSongTitle}
                    onChange={(e) => setNewSongTitle(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="歌手"
                    value={newSongArtist}
                    onChange={(e) => setNewSongArtist(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={addSong} className="btn-primary text-sm flex-1">
                    添加
                  </button>
                  <button
                    onClick={() => setShowAddSong(false)}
                    className="btn-secondary text-sm flex-1"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {/* 歌曲列表 */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {playlist.map((song, index) => (
                <div
                  key={song.id}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    index === currentSongIndex
                      ? 'bg-pink-100 border-2 border-pink-300'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    setCurrentSongIndex(index)
                    setIsPlaying(true)
                  }}
                >
                  <span className="text-2xl">{song.cover || '🎵'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{song.title}</div>
                    <div className="text-xs text-gray-500 truncate">{song.artist}</div>
                  </div>
                  {index === currentSongIndex && isPlaying && (
                    <span className="text-pink-500 animate-pulse">♪</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeSong(song.id)
                    }}
                    className="text-gray-400 hover:text-red-500 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 使用提示 */}
          <div className="mt-6 text-center text-xs text-gray-400">
            <p>💡 提示：可以添加网易云、QQ音乐等平台的歌曲外链</p>
            <p>🔗 格式：https://xxx.mp3</p>
          </div>
        </div>
      </div>
    </div>
  )
}
