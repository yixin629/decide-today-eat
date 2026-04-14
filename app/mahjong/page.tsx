'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BackButton from '../components/BackButton'
import { useToast } from '../components/ToastProvider'
import LoadingSkeleton from '../components/LoadingSkeleton'
import { useAuth } from '@/hooks/useAuth'
import { GameMode, initializeGameState, GameState } from './engine/MahjongLogic'

export default function MahjongLobbyPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [balance, setBalance] = useState<number>(0)
  const [games, setGames] = useState<any[]>([])
  const [isCreating, setIsCreating] = useState(false)

  // Form State
  const [mode, setMode] = useState<GameMode>('sichuan')
  const [multiplier, setMultiplier] = useState(1)
  const [botCount, setBotCount] = useState(3)

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false)
      return
    }
    fetchData()

    // Real-time subscription to see new games
    const channel = supabase
      .channel('mahjong_lobby')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mahjong_games', filter: 'status=eq.waiting' },
        () => {
          fetchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      // Fetch balance
      const { data: bData, error: bErr } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', currentUser)
        .single()

      if (bErr && bErr.code === 'PGRST116') {
        // Create balance if missing
        const { data: newB, error: newErr } = await supabase
          .from('user_balances')
          .insert({ user_id: currentUser, balance: 1000 })
          .select()
          .single()
        if (!newErr && newB) {
          setBalance(newB.balance)
        }
      } else if (bData) {
        setBalance(bData.balance)
      }

      // Fetch waiting games
      const { data: gData, error: gErr } = await supabase
        .from('mahjong_games')
        .select('id, mode, base_multiplier, players, host_id')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })

      if (gErr) throw gErr
      if (gData) setGames(gData)
    } catch (err: any) {
      console.error(err)
      showToast('获取数据失败', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateGame = async () => {
    if (!currentUser) return
    setIsCreating(true)

    try {
      // 1. Setup host player
      const hostPlayer = {
        id: currentUser,
        name: currentUser === 'zyx' ? 'Zyx' : 'Zly',
        avatar: currentUser === 'zyx' ? '👨' : '👩',
        isBot: false,
      }

      const playerIds = [hostPlayer]

      // 2. Setup bots
      for (let i = 0; i < botCount; i++) {
        playerIds.push({
          id: `bot_${i + 1}`,
          name: `机器人 ${i + 1}号`,
          avatar: '🤖',
          isBot: true,
        })
      }

      // Create dummy empty players to reach 4 total logic
      while (playerIds.length < 4) {
        playerIds.push({
            id: `empty_${playerIds.length}`, // placeholder 
            name: 'Waiting...',
            avatar: '👤',
            isBot: false
        })
      }

      // We only fully initialize game state if it's full (all bots)
      const isFull = (botCount === 3)

      const { data, error } = await supabase
        .from('mahjong_games')
        .insert({
          mode,
          base_multiplier: multiplier,
          host_id: currentUser,
          status: isFull ? 'playing' : 'waiting',
          players: playerIds,
          game_state: isFull ? {} : {}
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        // Now that we have the real DB id, initialize full game state
        if (isFull) {
          const initialState = initializeGameState(data.id, mode, multiplier, playerIds, currentUser)
          await supabase
            .from('mahjong_games')
            .update({ game_state: initialState })
            .eq('id', data.id)
        }
        showToast('房间创建成功', 'success')
        router.push(`/mahjong/${data.id}`)
      }
    } catch (err: any) {
      console.error(err)
      showToast('创建房间失败: ' + err.message, 'error')
      setIsCreating(false)
    }
  }

  const handleJoinGame = async (gameId: string, currentPlayers: any[]) => {
    if (!currentUser) return

    // Ensure not already in game
    if (currentPlayers.some(p => p.id === currentUser)) {
      router.push(`/mahjong/${gameId}`)
      return
    }

    try {
      const newPlayers = [...currentPlayers]
      const emptySlotIndex = newPlayers.findIndex(p => p.id.startsWith('empty_'))
      
      if (emptySlotIndex === -1) {
         showToast('房间已满', 'error')
         return
      }

      const newPlayer = {
        id: currentUser,
        name: currentUser === 'zyx' ? 'Zyx' : 'Zly',
        avatar: currentUser === 'zyx' ? '👨' : '👩',
        isBot: false,
      }

      newPlayers[emptySlotIndex] = newPlayer

      const isFull = newPlayers.filter(p => !p.id.startsWith('empty_')).length === 4
      
      let updateData: any = { players: newPlayers }
      
      if (isFull) {
         updateData.status = 'playing'
         // We need to fetch the full game to get mode/multiplier to init game state
         const { data: gData } = await supabase.from('mahjong_games').select('*').eq('id', gameId).single()
         if (gData) {
            updateData.game_state = initializeGameState(gameId, gData.mode, gData.base_multiplier, newPlayers, gData.host_id)
         }
      }

      const { error } = await supabase
        .from('mahjong_games')
        .update(updateData)
        .eq('id', gameId)

      if (error) throw error

      router.push(`/mahjong/${gameId}`)
    } catch(err: any) {
       console.error(err)
       showToast('加入失败', 'error')
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <BackButton href="/" text="返回首页" />
          <div className="card text-center py-12">
            <h1 className="text-3xl font-bold text-primary mb-4">🀄 欢乐麻将</h1>
            <p className="text-gray-600 mb-6">请先登录后再游玩麻将！</p>
            <a href="/login" className="btn-primary">去登录</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <BackButton href="/" text="返回首页" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Profile / Creation Panel */}
          <div className="md:col-span-1 space-y-6">
            <div className="card text-center bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-200 border">
              <div className="text-5xl mb-2">💰</div>
              <h2 className="text-xl font-bold text-gray-800">我的欢乐豆</h2>
              <div className="text-3xl font-black text-orange-500 my-2">
                {isLoading ? <span className="animate-pulse">...</span> : balance.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500">破产了可以找对方要哦</p>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-xl">🎲</span> 创建房间
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">模式</label>
                  <select 
                    value={mode} 
                    onChange={e => setMode(e.target.value as GameMode)}
                    className="w-full p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  >
                    <option value="sichuan">四川血战到底 (缺一门)</option>
                    <option value="standard">经典模式 (推倒胡)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">底分 (倍数)</label>
                  <select 
                    value={multiplier} 
                    onChange={e => setMultiplier(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value={1}>1倍 (100豆/番)</option>
                    <option value={5}>5倍 (500豆/番)</option>
                    <option value={10}>10倍 (1000豆/番)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">添加机器人数量</label>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map(num => (
                      <button
                        key={num}
                        onClick={() => setBotCount(num)}
                        className={`flex-1 py-1 px-2 text-sm rounded-lg transition-colors border ${
                          botCount === num 
                            ? 'bg-primary text-white border-primary' 
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {num}个
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleCreateGame}
                  disabled={isCreating}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? '创建中...' : '🎲 开局'}
                </button>
              </div>
            </div>
          </div>

          {/* Lobby Games List */}
          <div className="md:col-span-2">
            <div className="card h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="text-2xl">🎮</span> 等待中的房间
                </h2>
                <button onClick={fetchData} className="text-sm text-primary hover:underline">
                  刷新
                </button>
              </div>

              {isLoading ? (
                <div className="flex-1 flex flex-col gap-4">
                  <LoadingSkeleton type="card" count={3} />
                </div>
              ) : games.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-12">
                  <span className="text-6xl mb-4 opacity-50">🀄</span>
                  <p>大厅空空如也，快去创建一个房间吧！</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-4">
                  {games.map(game => {
                    const humanCount = game.players.filter((p:any) => !p.isBot && !p.id.startsWith('empty')).length;
                    const botCount = game.players.filter((p:any) => p.isBot).length;
                    const maxPlayers = 4;
                    const canJoin = humanCount + botCount < maxPlayers && !game.players.some((p:any) => p.id === currentUser);

                    return (
                      <div key={game.id} className="border border-gray-100 p-4 rounded-xl flex items-center justify-between hover:shadow-md transition-shadow bg-gray-50/50">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">
                              {game.mode === 'sichuan' ? '血战到底' : '经典模式'}
                            </span>
                            <span className="text-xs text-gray-500">底分: {game.base_multiplier * 100}豆</span>
                          </div>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <span>👩‍🦰 玩家: {humanCount}</span>
                            <span>🤖 人机: {botCount}</span>
                            <span className="text-gray-300">|</span>
                            <span>总人数: {humanCount + botCount}/4</span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleJoinGame(game.id, game.players)}
                          disabled={!canJoin && !game.players.some((p:any) => p.id === currentUser)}
                          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                            game.players.some((p:any) => p.id === currentUser)
                              ? 'bg-blue-500 text-white hover:bg-blue-600'
                              : canJoin
                                ? 'bg-primary text-white hover:bg-pink-600'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {game.players.some((p:any) => p.id === currentUser) ? '回到房间' : '加入'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
