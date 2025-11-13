'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useToast } from '../components/ToastProvider'
import BackButton from '../components/BackButton'

const DEFAULT_FOODS = [
  { name: '火锅', emoji: '🍲' },
  { name: '烤肉', emoji: '🥩' },
  { name: '寿司', emoji: '🍣' },
  { name: '披萨', emoji: '🍕' },
  { name: '拉面', emoji: '🍜' },
  { name: '麻辣烫', emoji: '🌶️' },
  { name: '汉堡', emoji: '🍔' },
  { name: '炸鸡', emoji: '🍗' },
  { name: '海鲜', emoji: '🦞' },
  { name: '烧烤', emoji: '🍢' },
]

export default function FoodPage() {
  const toast = useToast()
  const [selectedFood, setSelectedFood] = useState<any>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [foodOptions, setFoodOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newFood, setNewFood] = useState('')

  // 加载食物选项
  const loadFoodOptions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('food_options')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        setFoodOptions(data)
      } else {
        // 如果数据库为空，插入默认数据
        await insertDefaultFoods()
      }
    } catch (error) {
      console.error('加载食物选项失败:', error)
      // 出错时使用默认数据
      setFoodOptions(DEFAULT_FOODS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFoodOptions()
  }, [loadFoodOptions])

  // 插入默认食物数据
  const insertDefaultFoods = async () => {
    try {
      const { data, error } = await supabase
        .from('food_options')
        .insert(
          DEFAULT_FOODS.map((food) => ({
            name: food.name,
            emoji: food.emoji,
            category: '默认',
            is_favorite: false,
          }))
        )
        .select()

      if (!error && data) {
        setFoodOptions(data)
      }
    } catch (error) {
      console.error('插入默认数据失败:', error)
      setFoodOptions(DEFAULT_FOODS)
    }
  }

  const spinWheel = () => {
    if (isSpinning || foodOptions.length === 0) return

    setIsSpinning(true)
    setSelectedFood(null)

    // 模拟转盘动画
    let count = 0
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * foodOptions.length)
      setSelectedFood(foodOptions[randomIndex])
      count++

      if (count > 20) {
        clearInterval(interval)
        setIsSpinning(false)
      }
    }, 100)
  }

  const addCustomFood = async () => {
    if (!newFood.trim()) return

    try {
      const { data, error } = await supabase
        .from('food_options')
        .insert([
          {
            name: newFood.trim(),
            emoji: '🍱',
            category: '自定义',
            is_favorite: false,
          },
        ])
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setFoodOptions([...foodOptions, data[0]])
        setNewFood('')
        toast.success('添加成功！')
      }
    } catch (error) {
      console.error('添加食物失败:', error)
      toast.error('添加食物失败，请重试')
    }
  }

  const deleteFood = async (id: number) => {
    try {
      const { error } = await supabase.from('food_options').delete().eq('id', id)

      if (error) throw error

      setFoodOptions(foodOptions.filter((food) => food.id !== id))
      toast.success('删除成功')
    } catch (error) {
      console.error('删除食物失败:', error)
      toast.error('删除失败，请重试')
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <BackButton href="/" text="返回首页" />

        {loading ? (
          <div className="card text-center">
            <div className="text-2xl">加载中...</div>
          </div>
        ) : (
          <div className="card text-center">
            <h1 className="text-4xl font-bold text-primary mb-8">🍱 今晚吃什么？ 🍱</h1>

            {/* Result Display */}
            <div className="mb-8">
              {selectedFood ? (
                <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-8 transform scale-110 transition-all">
                  <div className="text-8xl mb-4">{selectedFood.emoji}</div>
                  <div className="text-4xl font-bold text-primary">{selectedFood.name}</div>
                </div>
              ) : (
                <div className="text-6xl mb-4">❓</div>
              )}
            </div>

            {/* Spin Button */}
            <button
              onClick={spinWheel}
              disabled={isSpinning || foodOptions.length === 0}
              className="btn-primary text-xl px-12 py-4 mb-8 disabled:opacity-50"
            >
              {isSpinning ? '转转转... 🎰' : '点击决定 ✨'}
            </button>

            {/* Food Grid */}
            <div className="grid grid-cols-5 gap-4 mb-8">
              {foodOptions.map((food) => (
                <div
                  key={food.id}
                  className="bg-white rounded-lg p-4 shadow hover:shadow-lg transition-all relative group cursor-pointer"
                >
                  {food.category === '自定义' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteFood(food.id)
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center"
                    >
                      ×
                    </button>
                  )}
                  <div className="text-4xl mb-2">{food.emoji}</div>
                  <div className="text-sm font-semibold">{food.name}</div>
                </div>
              ))}
            </div>

            {/* Custom Food Input */}
            <div className="border-t pt-6">
              <h3 className="text-xl font-bold text-gray-700 mb-4">添加自定义选项</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFood}
                  onChange={(e) => setNewFood(e.target.value)}
                  placeholder="输入食物名称..."
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-full focus:outline-none focus:border-primary"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomFood()}
                />
                <button onClick={addCustomFood} className="btn-primary">
                  添加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
