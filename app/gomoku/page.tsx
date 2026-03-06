'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BackButton from '../components/BackButton'
import { useToast } from '../components/ToastProvider'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { GomokuGameState, createEmptyBoard, Player } from './engine/GomokuLogic'
import LoadingSkeleton from '../components/LoadingSkeleton'

export default function GomokuLobbyPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { user: currentUser } = useAuth()
  
  const [waitingRooms, setWaitingRooms] = useState<any[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) {
       router.push('/login?redirect=/gomoku')
       return
    }

    fetchRooms()

    const channel = supabase
      .channel('gomoku_lobby')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gomoku_games' },
        () => {
          fetchRooms()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('gomoku_games')
        .select(`
          id,
          created_at,
          status,
          players,
          game_mode,
          host_id
        `)
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })

      if (error) throw error
      setWaitingRooms(data || [])
    } catch (error) {
      console.error('获取房间失败:', error)
      showToast('获取房间列表失败', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRoom = async (mode: 'pvp' | 'pve') => {
    if (!currentUser) {
      showToast('请先登录', 'error')
      return
    }

    setIsCreating(true)
    try {
      // Get User Profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('name, avatar_url')
        .eq('id', currentUser)
        .single()

      const hostPlayer = {
         id: currentUser,
         name: profileData?.name || 'Player 1',
         avatar: profileData?.avatar_url || '👤',
         color: 'black' as Player, // Creator is black (first move typically)
         isBot: false
      }

      const initialState: Partial<GomokuGameState> = {
         board: createEmptyBoard(),
         currentPlayer: 'black',
         status: mode === 'pve' ? 'playing' : 'waiting', // PvE starts immediately
         winner: null,
         lastMove: null,
         history: [],
         players: [hostPlayer],
         gameMode: mode,
         hostId: currentUser
      }

      if (mode === 'pve') {
         // Auto-add bot
         initialState.players!.push({
            id: 'bot-1',
            name: 'Gomoku Bot',
            avatar: '🤖',
            color: 'white' as Player,
            isBot: true
         })
      }

      const { data, error } = await supabase
        .from('gomoku_games')
        .insert([{
          game_state: initialState,
          status: initialState.status,
          host_id: currentUser,
          game_mode: mode,
          players: initialState.players!.map(p => p.id)
        }])
        .select()
        .single()

      if (error) throw error

      showToast(`已创建${mode === 'pve' ? '人机' : '对战'}房间`, 'success')
      router.push(`/gomoku/${data.id}`)
    } catch (error) {
      console.error('创建房间失败:', error)
      showToast('创建房间失败', 'error')
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinRoom = async (gameId: string, currentPlayers: any[]) => {
    if (!currentUser) return
    setIsCreating(true)

    try {
      // Check if already in room
      const existingPlayer = currentPlayers.find((p: any) => p.id === currentUser)
      if (existingPlayer) {
        router.push(`/gomoku/${gameId}`)
        return
      }

      if (currentPlayers.length >= 2) {
        showToast('房间已满', 'error')
        setIsCreating(false)
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('name, avatar_url')
        .eq('id', currentUser)
        .single()

      const newPlayer = {
        id: currentUser,
        name: profile?.name || 'Player 2',
        avatar: profile?.avatar_url || '👤',
        color: 'white' as Player, // Second player is white
        isBot: false
      }

      // We need to fetch the full game state to append the new player properly to the JSON
      const { data: gameData, error: fetchErr } = await supabase
         .from('gomoku_games')
         .select('game_state')
         .eq('id', gameId)
         .single()

      if (fetchErr) throw fetchErr

      const nextState = { ...gameData.game_state, status: 'playing' }
      nextState.players.push(newPlayer)

      const { error } = await supabase
        .from('gomoku_games')
        .update({
          game_state: nextState,
          status: 'playing',
          players: nextState.players.map((p: any) => p.id)
        })
        .eq('id', gameId)

      if (error) throw error

      showToast('成功加入房间', 'success')
      router.push(`/gomoku/${gameId}`)
    } catch (error) {
      console.error('加入房间失败:', error)
      showToast('加入房间失败', 'error')
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
      return (
         <div className="min-h-screen p-4 md:p-8 flex flex-col justify-center max-w-4xl mx-auto">
            <LoadingSkeleton type="card" count={3} />
         </div>
      )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <BackButton href="/" text="返回首页" />

        <div className="card text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">⚫⚪ 五子棋大厅 ⚫⚪</h1>
          <p className="text-gray-600 mb-6">在线实时对战，一决高下</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <button
               onClick={() => handleCreateRoom('pve')}
               disabled={isCreating}
               className="btn-secondary px-8 py-4 text-lg disabled:opacity-50"
             >
               🤖 单人挑战 (打电脑)
             </button>
             <button
               onClick={() => handleCreateRoom('pvp')}
               disabled={isCreating}
               className="btn-primary px-8 py-4 text-lg disabled:opacity-50"
             >
               ⚔️ 创建双人对战
             </button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>🎮</span> 等待中的对战
          </h2>
          
          {waitingRooms.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <span className="text-4xl block mb-2">👻</span>
              暂无等待中的房间，自己创建一个吧！
            </div>
          ) : (
            <div className="grid gap-3">
              {waitingRooms.map((room) => {
                 const host = room.players[0]
                 return (
                  <div 
                    key={room.id}
                    className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white border rounded-xl hover:shadow-md transition-shadow gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
                        {host?.avatar || '👤'}
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-lg">{host?.name || '未知玩家'}</div>
                        <div className="text-sm text-gray-500">
                           {room.game_mode === 'pvp' ? '双人在线对战' : '人机对战'} | 
                           等待加入...
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleJoinRoom(room.id, room.players)}
                      disabled={isCreating}
                      className="w-full sm:w-auto px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50"
                    >
                      加入对局
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
