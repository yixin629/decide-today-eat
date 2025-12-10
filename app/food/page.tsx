'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useToast } from '../components/ToastProvider'
import BackButton from '../components/BackButton'

const DEFAULT_FOODS = [
  // 基础美食
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

  // 云南特色美食
  { name: '过桥米线', emoji: '🍜' },
  { name: '汽锅鸡', emoji: '🍗' },
  { name: '宣威火腿', emoji: '🥓' },
  { name: '鲜花饼', emoji: '🌸' },
  { name: '饵块', emoji: '🍚' },
  { name: '豆焖饭', emoji: '🍛' },
  { name: '野生菌火锅', emoji: '🍄' },
  { name: '酸汤鱼', emoji: '🐟' },
  { name: '凉鸡米线', emoji: '🍜' },
  { name: '烧饵块', emoji: '🍘' },
  { name: '罐罐米线', emoji: '🥘' },
  { name: '蒙自年糕', emoji: '🍡' },
  { name: '建水豆腐', emoji: '🧈' },
  { name: '乳扇', emoji: '🥛' },
  { name: '喜洲粑粑', emoji: '🥞' },
  { name: '腾冲饵丝', emoji: '🍜' },
  { name: '大救驾', emoji: '🍽️' },
  { name: '菠萝饭', emoji: '🍍' },
  { name: '竹筒饭', emoji: '🎋' },
  { name: '烤乳猪', emoji: '🐷' },
  { name: '撒撇', emoji: '🥗' },
  { name: '傣味酸笋', emoji: '🥬' },
  { name: '香茅草烤鱼', emoji: '🐟' },
  { name: '舂鸡脚', emoji: '🍗' },
  { name: '云腿月饼', emoji: '🥮' },
  { name: '卤饵丝', emoji: '🍜' },
  { name: '鸡枞菌', emoji: '🍄' },
  { name: '松茸炖鸡', emoji: '🍗' },

  // 贵州特色美食
  { name: '酸汤鱼', emoji: '🐟' },
  { name: '羊肉粉', emoji: '🍜' },
  { name: '肠旺面', emoji: '🍜' },
  { name: '丝娃娃', emoji: '🌯' },
  { name: '豆腐圆子', emoji: '⚪' },
  { name: '牛肉粉', emoji: '🍜' },
  { name: '折耳根', emoji: '🥬' },
  { name: '糯米饭', emoji: '🍚' },
  { name: '青岩猪脚', emoji: '🦶' },
  { name: '苗家酸汤', emoji: '🥘' },
  { name: '辣子鸡', emoji: '🐔' },
  { name: '红酸汤', emoji: '🥘' },
  { name: '豆米火锅', emoji: '🍲' },
  { name: '烙锅', emoji: '🍳' },
  { name: '鸡辣子', emoji: '🌶️' },
  { name: '状元蹄', emoji: '🦶' },
  { name: '花溪牛肉粉', emoji: '🍜' },
  { name: '恋爱豆腐果', emoji: '💕' },
  { name: '炒饵块', emoji: '🍘' },
  { name: '遵义羊肉粉', emoji: '🐑' },
  { name: '凯里酸汤鱼', emoji: '🐟' },
  { name: '镇宁波波糖', emoji: '🍬' },
  { name: '威宁荞酥', emoji: '🍪' },

  // 昭通特色美食
  { name: '昭通小肉串', emoji: '🍢' },
  { name: '昭通酱', emoji: '🥫' },
  { name: '油糕稀豆粉', emoji: '🥞' },
  { name: '昭通天麻炖鸡', emoji: '🍗' },
  { name: '昭通苹果', emoji: '🍎' },
  { name: '洋芋粑粑', emoji: '🥔' },
  { name: '镇雄小碗红糖', emoji: '🍯' },
  { name: '彝良天麻', emoji: '🌿' },
  { name: '威信扎染', emoji: '🎨' },
  { name: '盐津豆腐干', emoji: '🧈' },
  { name: '大关筇竹笋', emoji: '🎋' },
  { name: '永善花椒', emoji: '🌶️' },
  { name: '绥江半边红李子', emoji: '🍑' },
  { name: '巧家小碗红糖', emoji: '🍯' },
  { name: '鲁甸樱桃', emoji: '🍒' },
  { name: '昭阳烧洋芋', emoji: '🥔' },
  { name: '镇雄洋芋鸡', emoji: '🐔' },
  { name: '彝良麻辣洋芋', emoji: '🥔' },
  { name: '威信手工面', emoji: '🍜' },
  { name: '盐津乌骨鸡', emoji: '🐔' },
  { name: '大关黄牛肉', emoji: '🥩' },
  { name: '永善松露', emoji: '🍄' },
  { name: '绥江花生', emoji: '🥜' },
  { name: '巧家核桃', emoji: '🌰' },
  { name: '昭通炒洋芋', emoji: '🥔' },
  { name: '昭通羊汤锅', emoji: '🍲' },
  { name: '昭通卷粉', emoji: '🌯' },
  { name: '昭通凉粉', emoji: '🥤' },
  { name: '昭通米线', emoji: '🍜' },
  { name: '昭通烧烤', emoji: '🍢' },
  { name: '昭通饵块', emoji: '🍘' },
  { name: '昭通臭豆腐', emoji: '🧈' },
  { name: '昭通豆花米线', emoji: '🍜' },
  { name: '昭通锅巴洋芋', emoji: '🥔' },
  { name: '昭通烤鸡', emoji: '🍗' },
  { name: '昭通凉拌鸡', emoji: '🐔' },
  { name: '昭通火腿', emoji: '🥓' },
  { name: '昭通腊肉', emoji: '🥓' },
  { name: '昭通香肠', emoji: '🌭' },
  { name: '昭通酸菜鱼', emoji: '🐟' },
  { name: '昭通水煮鱼', emoji: '🐟' },
  { name: '昭通毛豆腐', emoji: '🧈' },
]

export default function FoodPage() {
  const toast = useToast()
  const [selectedFood, setSelectedFood] = useState<any>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [foodOptions, setFoodOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newFood, setNewFood] = useState('')

  const [selectedCategory, setSelectedCategory] = useState('全部')

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

  // 获取所有类别
  const categories = ['全部', ...Array.from(new Set(foodOptions.map((f) => f.category || '默认')))]

  // 筛选食物
  const filteredFoods =
    selectedCategory === '全部'
      ? foodOptions
      : foodOptions.filter((f) => (f.category || '默认') === selectedCategory)

  const spinWheel = () => {
    if (isSpinning || filteredFoods.length === 0) return

    setIsSpinning(true)
    setSelectedFood(null)

    // 模拟转盘动画
    let count = 0
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * filteredFoods.length)
      setSelectedFood(filteredFoods[randomIndex])
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
      // If it's a default food that hasn't been persisted properly, just remove from local state
      if (!id) {
        setFoodOptions(
          foodOptions.filter((food) => food.name !== foodOptions.find((f) => f.id === id)?.name)
        )
        return
      }
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
            <div className="mb-8 min-h-[160px] flex items-center justify-center">
              {selectedFood ? (
                <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-8 transform scale-110 transition-all animate-bounce">
                  <div className="text-8xl mb-4">{selectedFood.emoji}</div>
                  <div className="text-4xl font-bold text-primary">{selectedFood.name}</div>
                </div>
              ) : (
                <div className="text-gray-400">
                  <div className="text-6xl mb-4">❓</div>
                  <p>点击下方按钮开始决定</p>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    selectedCategory === category
                      ? 'bg-primary text-white shadow-md transform scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Spin Button */}
            <button
              onClick={spinWheel}
              disabled={isSpinning || filteredFoods.length === 0}
              className="btn-primary text-xl px-12 py-4 mb-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
            >
              {isSpinning ? '正在随机选餐... 🎰' : '帮我决定！✨'}
            </button>
            <p className="text-sm text-gray-400 mb-8">当前候选：{filteredFoods.length} 个选项</p>

            {/* Food Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              {filteredFoods.map((food, index) => (
                <div
                  key={food.id || index}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative group cursor-pointer border border-gray-100 hover:border-primary/30"
                >
                  {food.category === '自定义' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteFood(food.id)
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center shadow-md z-10"
                    >
                      ×
                    </button>
                  )}
                  <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform">
                    {food.emoji}
                  </div>
                  <div className="text-sm font-semibold text-gray-700">{food.name}</div>
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
