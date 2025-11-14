'use client'

import { useState, useEffect } from 'react'
import BackButton from '../components/BackButton'
import { useToast } from '../components/ToastProvider'

interface DressUpOptions {
  hair: string[]
  clothes: string[]
  accessories: string[]
  shoes: string[]
}

const DRESS_UP_OPTIONS: DressUpOptions = {
  hair: ['👨‍🦱', '👩‍🦰', '👱‍♀️', '👨‍🦳', '👩‍🦲', '🧑‍🦱'],
  clothes: ['👔', '👗', '👚', '🥼', '🥻', '👘'],
  accessories: ['👓', '🕶️', '🎀', '👑', '🎩', '⛑️'],
  shoes: ['👟', '👠', '👢', '👞', '🥿', '🩴'],
}

interface SavedOutfit {
  id: string
  name: string
  hair: string
  clothes: string
  accessories: string
  shoes: string
  timestamp: number
}

export default function DressUpPage() {
  const toast = useToast()
  const [selectedHair, setSelectedHair] = useState(DRESS_UP_OPTIONS.hair[0])
  const [selectedClothes, setSelectedClothes] = useState(DRESS_UP_OPTIONS.clothes[0])
  const [selectedAccessories, setSelectedAccessories] = useState(DRESS_UP_OPTIONS.accessories[0])
  const [selectedShoes, setSelectedShoes] = useState(DRESS_UP_OPTIONS.shoes[0])
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([])
  const [outfitName, setOutfitName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  // 加载已保存的装扮
  useEffect(() => {
    const saved = localStorage.getItem('dressUpOutfits')
    if (saved) {
      setSavedOutfits(JSON.parse(saved))
    }
  }, [])

  // 保存装扮
  const saveOutfit = () => {
    if (!outfitName.trim()) {
      toast.error('请输入装扮名称')
      return
    }

    const newOutfit: SavedOutfit = {
      id: Date.now().toString(),
      name: outfitName.trim(),
      hair: selectedHair,
      clothes: selectedClothes,
      accessories: selectedAccessories,
      shoes: selectedShoes,
      timestamp: Date.now(),
    }

    const updated = [newOutfit, ...savedOutfits]
    setSavedOutfits(updated)
    localStorage.setItem('dressUpOutfits', JSON.stringify(updated))

    setOutfitName('')
    setShowSaveDialog(false)
    toast.success(`装扮 "${newOutfit.name}" 已保存！`)

    // 触觉反馈
    if (navigator.vibrate) {
      navigator.vibrate(100)
    }
  }

  // 加载装扮
  const loadOutfit = (outfit: SavedOutfit) => {
    setSelectedHair(outfit.hair)
    setSelectedClothes(outfit.clothes)
    setSelectedAccessories(outfit.accessories)
    setSelectedShoes(outfit.shoes)
    toast.success(`已加载装扮 "${outfit.name}"`)

    // 触觉反馈
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }

  // 删除装扮
  const deleteOutfit = (id: string) => {
    const updated = savedOutfits.filter((o) => o.id !== id)
    setSavedOutfits(updated)
    localStorage.setItem('dressUpOutfits', JSON.stringify(updated))
    toast.success('装扮已删除')
  }

  // 随机装扮
  const randomize = () => {
    setSelectedHair(DRESS_UP_OPTIONS.hair[Math.floor(Math.random() * DRESS_UP_OPTIONS.hair.length)])
    setSelectedClothes(
      DRESS_UP_OPTIONS.clothes[Math.floor(Math.random() * DRESS_UP_OPTIONS.clothes.length)]
    )
    setSelectedAccessories(
      DRESS_UP_OPTIONS.accessories[Math.floor(Math.random() * DRESS_UP_OPTIONS.accessories.length)]
    )
    setSelectedShoes(
      DRESS_UP_OPTIONS.shoes[Math.floor(Math.random() * DRESS_UP_OPTIONS.shoes.length)]
    )

    // 触觉反馈
    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 50])
    }
  }

  // 分享装扮（复制到剪贴板）
  const shareOutfit = () => {
    const text = `我的装扮：${selectedHair}${selectedClothes}${selectedAccessories}${selectedShoes}`
    navigator.clipboard.writeText(text)
    toast.success('装扮已复制到剪贴板！')
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <BackButton href="/" text="返回首页" />

        <div className="card text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">🎀 装扮小人游戏</h1>
          <p className="text-gray-600 mb-8">打扮你的虚拟情侣形象，保存和分享你的装扮！</p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 左侧：装扮预览 */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-3xl p-8 min-h-[400px] flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">当前装扮</h3>

                {/* 虚拟形象展示 */}
                <div className="relative w-64 h-64 bg-white rounded-full shadow-lg flex items-center justify-center mb-6">
                  <div className="text-center">
                    <div className="text-7xl mb-2">{selectedHair}</div>
                    <div className="text-6xl mb-2">{selectedClothes}</div>
                    <div className="text-5xl mb-2">{selectedAccessories}</div>
                    <div className="text-4xl">{selectedShoes}</div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-3 flex-wrap justify-center">
                  <button onClick={randomize} className="btn-secondary text-sm">
                    🎲 随机装扮
                  </button>
                  <button onClick={() => setShowSaveDialog(true)} className="btn-primary text-sm">
                    💾 保存装扮
                  </button>
                  <button
                    onClick={shareOutfit}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm transition-colors"
                  >
                    📤 分享
                  </button>
                </div>
              </div>
            </div>

            {/* 右侧：选择选项 */}
            <div className="space-y-6">
              {/* 发型 */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 text-left">发型</h3>
                <div className="grid grid-cols-6 gap-2">
                  {DRESS_UP_OPTIONS.hair.map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setSelectedHair(item)
                        if (navigator.vibrate) navigator.vibrate(30)
                      }}
                      className={`aspect-square text-4xl rounded-xl transition-all ${
                        selectedHair === item
                          ? 'bg-primary bg-opacity-20 ring-2 ring-primary scale-110'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* 服装 */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 text-left">服装</h3>
                <div className="grid grid-cols-6 gap-2">
                  {DRESS_UP_OPTIONS.clothes.map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setSelectedClothes(item)
                        if (navigator.vibrate) navigator.vibrate(30)
                      }}
                      className={`aspect-square text-4xl rounded-xl transition-all ${
                        selectedClothes === item
                          ? 'bg-primary bg-opacity-20 ring-2 ring-primary scale-110'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* 配饰 */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 text-left">配饰</h3>
                <div className="grid grid-cols-6 gap-2">
                  {DRESS_UP_OPTIONS.accessories.map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setSelectedAccessories(item)
                        if (navigator.vibrate) navigator.vibrate(30)
                      }}
                      className={`aspect-square text-4xl rounded-xl transition-all ${
                        selectedAccessories === item
                          ? 'bg-primary bg-opacity-20 ring-2 ring-primary scale-110'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* 鞋子 */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 text-left">鞋子</h3>
                <div className="grid grid-cols-6 gap-2">
                  {DRESS_UP_OPTIONS.shoes.map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setSelectedShoes(item)
                        if (navigator.vibrate) navigator.vibrate(30)
                      }}
                      className={`aspect-square text-4xl rounded-xl transition-all ${
                        selectedShoes === item
                          ? 'bg-primary bg-opacity-20 ring-2 ring-primary scale-110'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 已保存的装扮 */}
          {savedOutfits.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="font-bold text-xl mb-4 text-gray-700">📚 已保存的装扮</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {savedOutfits.map((outfit) => (
                  <div
                    key={outfit.id}
                    className="bg-gray-50 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer group relative"
                  >
                    <button
                      onClick={() => deleteOutfit(outfit.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center text-sm z-10"
                    >
                      ×
                    </button>
                    <div onClick={() => loadOutfit(outfit)}>
                      <div className="text-4xl mb-2 flex justify-center gap-1">
                        <span>{outfit.hair}</span>
                        <span>{outfit.clothes}</span>
                        <span>{outfit.accessories}</span>
                        <span>{outfit.shoes}</span>
                      </div>
                      <p className="font-semibold text-sm text-gray-700">{outfit.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 保存对话框 */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-800 mb-4">保存装扮</h3>
              <input
                type="text"
                value={outfitName}
                onChange={(e) => setOutfitName(e.target.value)}
                placeholder="给你的装扮起个名字..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary mb-4"
                onKeyPress={(e) => e.key === 'Enter' && saveOutfit()}
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowSaveDialog(false)
                    setOutfitName('')
                  }}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button onClick={saveOutfit} className="btn-primary">
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
