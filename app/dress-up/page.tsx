'use client'

import { useState, useEffect } from 'react'
import BackButton from '../components/BackButton'
import { useToast } from '../components/ToastProvider'

interface SavedOutfit {
  id: string
  name: string
  gender: 'male' | 'female'
  skinTone: number
  hairStyle: number
  hairColor: string
  topStyle: number
  topColor: string
  bottomStyle: number
  bottomColor: string
  shoesStyle: number
  shoesColor: string
  accessory: number
  timestamp: number
}

// 皮肤色调选项
const SKIN_TONES = ['#FFDFC4', '#F0D5BE', '#D1A684', '#A67C52', '#8D5524', '#614335']

// 发型名称
const HAIR_STYLES_MALE = ['短发', '寸头', '背头', '中分', '偏分', '卷发', '莫西干', '扎发']
const HAIR_STYLES_FEMALE = ['长发', '短发', '马尾', '双马尾', '丸子头', '波浪卷', '编发', '直发']

// 上装名称
const TOP_STYLES_MALE = ['T恤', '衬衫', '卫衣', '西装', '夹克', '毛衣', '运动背心', '风衣']
const TOP_STYLES_FEMALE = ['T恤', '衬衫', '连衣裙', '吊带', '卫衣', '毛衣', '礼服', '运动装']

// 下装名称
const BOTTOM_STYLES = ['长裤', '短裤', '牛仔裤', '运动裤', '裙子', '西裤', '百褶裙', '工装裤']

// 鞋子名称
const SHOES_STYLES = ['运动鞋', '皮鞋', '高跟鞋', '靴子', '凉鞋', '拖鞋', '帆布鞋', '马丁靴']

// 配饰名称
const ACCESSORIES = ['无', '眼镜', '墨镜', '帽子', '耳环', '项链', '围巾', '领结']

export default function DressUpPage() {
  const toast = useToast()
  const [gender, setGender] = useState<'male' | 'female'>('female')
  const [skinTone, setSkinTone] = useState(0)
  const [hairStyle, setHairStyle] = useState(0)
  const [hairColor, setHairColor] = useState('#2C1810')
  const [topStyle, setTopStyle] = useState(0)
  const [topColor, setTopColor] = useState('#FF69B4')
  const [bottomStyle, setBottomStyle] = useState(0)
  const [bottomColor, setBottomColor] = useState('#4169E1')
  const [shoesStyle, setShoesStyle] = useState(0)
  const [shoesColor, setShoesColor] = useState('#8B4513')
  const [accessory, setAccessory] = useState(0)
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([])
  const [outfitName, setOutfitName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<'hair' | 'top' | 'bottom' | 'shoes' | 'accessory'>(
    'hair'
  )

  useEffect(() => {
    const saved = localStorage.getItem('dressUpOutfits_v2')
    if (saved) {
      setSavedOutfits(JSON.parse(saved))
    }
  }, [])

  const saveOutfit = () => {
    if (!outfitName.trim()) {
      toast.error('请输入装扮名称')
      return
    }

    const newOutfit: SavedOutfit = {
      id: Date.now().toString(),
      name: outfitName.trim(),
      gender,
      skinTone,
      hairStyle,
      hairColor,
      topStyle,
      topColor,
      bottomStyle,
      bottomColor,
      shoesStyle,
      shoesColor,
      accessory,
      timestamp: Date.now(),
    }

    const updated = [newOutfit, ...savedOutfits]
    setSavedOutfits(updated)
    localStorage.setItem('dressUpOutfits_v2', JSON.stringify(updated))
    setOutfitName('')
    setShowSaveDialog(false)
    toast.success(`装扮 "${newOutfit.name}" 已保存！`)
  }

  const loadOutfit = (outfit: SavedOutfit) => {
    setGender(outfit.gender)
    setSkinTone(outfit.skinTone)
    setHairStyle(outfit.hairStyle)
    setHairColor(outfit.hairColor)
    setTopStyle(outfit.topStyle)
    setTopColor(outfit.topColor)
    setBottomStyle(outfit.bottomStyle)
    setBottomColor(outfit.bottomColor)
    setShoesStyle(outfit.shoesStyle)
    setShoesColor(outfit.shoesColor)
    setAccessory(outfit.accessory)
    toast.success(`已加载装扮 "${outfit.name}"`)
  }

  const deleteOutfit = (id: string) => {
    const updated = savedOutfits.filter((o) => o.id !== id)
    setSavedOutfits(updated)
    localStorage.setItem('dressUpOutfits_v2', JSON.stringify(updated))
    toast.success('装扮已删除')
  }

  const randomize = () => {
    setSkinTone(Math.floor(Math.random() * SKIN_TONES.length))
    setHairStyle(Math.floor(Math.random() * 8))
    setHairColor(
      ['#2C1810', '#8B4513', '#FFD700', '#FF4500', '#000000', '#A0522D'][
        Math.floor(Math.random() * 6)
      ]
    )
    setTopStyle(Math.floor(Math.random() * 8))
    setTopColor(
      ['#FF69B4', '#87CEEB', '#98FB98', '#DDA0DD', '#F0E68C', '#FF6347'][
        Math.floor(Math.random() * 6)
      ]
    )
    setBottomStyle(Math.floor(Math.random() * 8))
    setBottomColor(
      ['#4169E1', '#2F4F4F', '#8B4513', '#000080', '#800000', '#556B2F'][
        Math.floor(Math.random() * 6)
      ]
    )
    setShoesStyle(Math.floor(Math.random() * 8))
    setShoesColor(
      ['#8B4513', '#000000', '#FFFFFF', '#FF69B4', '#4169E1', '#FFD700'][
        Math.floor(Math.random() * 6)
      ]
    )
    setAccessory(Math.floor(Math.random() * 8))
    toast.success('随机搭配完成！')
  }

  const currentSkin = SKIN_TONES[skinTone]

  // 渲染头发
  const renderHair = () => {
    if (gender === 'female') {
      switch (hairStyle) {
        case 0:
          return (
            <g>
              <path
                d="M50 45 Q45 20 100 15 Q155 20 150 45 L150 120 Q150 140 130 150 L70 150 Q50 140 50 120 Z"
                fill={hairColor}
              />
              <path d="M55 50 Q55 30 100 25 Q145 30 145 50" fill={hairColor} />
            </g>
          )
        case 1:
          return (
            <g>
              <path
                d="M55 45 Q50 20 100 15 Q150 20 145 45 L145 70 Q145 85 130 90 L70 90 Q55 85 55 70 Z"
                fill={hairColor}
              />
            </g>
          )
        case 2:
          return (
            <g>
              <path
                d="M55 45 Q50 20 100 15 Q150 20 145 45 L145 65 Q145 75 130 80 L70 80 Q55 75 55 65 Z"
                fill={hairColor}
              />
              <path
                d="M130 50 Q160 50 155 100 Q150 140 145 160"
                stroke={hairColor}
                strokeWidth="15"
                fill="none"
                strokeLinecap="round"
              />
            </g>
          )
        case 3:
          return (
            <g>
              <path
                d="M55 45 Q50 20 100 15 Q150 20 145 45 L145 65 Q145 75 130 80 L70 80 Q55 75 55 65 Z"
                fill={hairColor}
              />
              <path
                d="M60 60 Q30 70 35 130"
                stroke={hairColor}
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M140 60 Q170 70 165 130"
                stroke={hairColor}
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
              />
            </g>
          )
        case 4:
          return (
            <g>
              <path
                d="M55 50 Q50 25 100 20 Q150 25 145 50 L145 70 Q145 80 130 85 L70 85 Q55 80 55 70 Z"
                fill={hairColor}
              />
              <circle cx="100" cy="15" r="18" fill={hairColor} />
            </g>
          )
        case 5:
          return (
            <g>
              <path
                d="M50 45 Q45 20 100 15 Q155 20 150 45 L150 130 Q155 145 145 155 Q135 145 130 160 Q120 145 110 160 Q100 145 90 160 Q80 145 70 160 Q60 145 55 155 Q45 145 50 130 Z"
                fill={hairColor}
              />
            </g>
          )
        case 6: // 编发
          return (
            <g>
              <path
                d="M50 45 Q30 50 35 150 Q40 160 50 150 Q55 140 50 45 Z" // Left braid
                fill={hairColor}
              />
              <path
                d="M150 45 Q170 50 165 150 Q160 160 150 150 Q145 140 150 45 Z" // Right braid
                fill={hairColor}
              />
              <path
                d="M50 45 Q45 20 100 15 Q155 20 150 45 L150 70 Q100 60 50 70 Z" // Top
                fill={hairColor}
              />
            </g>
          )
        case 7: // 直发
          return (
            <g>
              <path
                d="M50 45 Q45 20 100 15 Q155 20 150 45 L155 160 L135 160 L135 80 L65 80 L65 160 L45 160 L50 45 Z"
                fill={hairColor}
              />
              <path d="M50 50 Q50 20 100 15 Q150 20 150 50" fill={hairColor} />
            </g>
          )
        default:
          return null
      }
    } else {
      switch (hairStyle) {
        case 0:
          return (
            <g>
              <path
                d="M60 50 Q55 25 100 20 Q145 25 140 50 L140 70 Q140 80 125 82 L75 82 Q60 80 60 70 Z"
                fill={hairColor}
              />
            </g>
          )
        case 1:
          return (
            <g>
              <path
                d="M65 55 Q60 35 100 30 Q140 35 135 55 L135 68 Q135 75 120 77 L80 77 Q65 75 65 68 Z"
                fill={hairColor}
              />
            </g>
          )
        case 2:
          return (
            <g>
              <path
                d="M60 55 Q55 30 100 25 Q145 30 140 55 L140 65 Q140 72 125 75 L75 75 Q60 72 60 65 Z"
                fill={hairColor}
              />
            </g>
          )
        case 3:
          return (
            <g>
              <path
                d="M55 55 Q50 30 100 25 Q150 30 145 55 L145 75 Q145 85 125 88 L75 88 Q55 85 55 75 Z"
                fill={hairColor}
              />
              <line x1="100" y1="25" x2="100" y2="55" stroke={currentSkin} strokeWidth="2" />
            </g>
          )
        case 4:
          return (
            <g>
              <path
                d="M55 55 Q50 30 100 25 Q150 30 145 55 L145 75 Q145 85 125 88 L75 88 Q55 85 55 75 Z"
                fill={hairColor}
              />
              <path d="M70 30 Q85 28 100 55" stroke={currentSkin} strokeWidth="2" fill="none" />
            </g>
          )
        case 5:
          return (
            <g>
              <path
                d="M55 50 Q50 25 100 20 Q150 25 145 50 L145 80 Q150 85 145 90 Q140 85 138 92 Q130 85 128 92 Q120 88 100 90 Q80 88 72 92 Q70 85 62 92 Q60 85 55 90 Q50 85 55 80 Z"
                fill={hairColor}
              />
            </g>
          )
        case 6: // 莫西干
          return (
            <g>
              <path d="M80 50 Q80 10 100 5 Q120 10 120 50 L120 70 L80 70 Z" fill={hairColor} />
              <path d="M70 70 L70 80 Q100 85 130 80 L130 70" fill={hairColor} opacity="0.5" />
            </g>
          )
        case 7: // 扎发
          return (
            <g>
              <circle cx="100" cy="20" r="15" fill={hairColor} />
              <path
                d="M60 50 Q55 25 100 20 Q145 25 140 50 L140 70 Q140 80 125 82 L75 82 Q60 80 60 70 Z"
                fill={hairColor}
              />
            </g>
          )
        default:
          return null
      }
    }
  }

  // 渲染上装
  const renderTop = () => {
    if (gender === 'female') {
      switch (topStyle) {
        case 0:
          return (
            <g>
              <path
                d="M60 130 L55 150 L55 220 L145 220 L145 150 L140 130 Q120 125 100 130 Q80 125 60 130 Z"
                fill={topColor}
              />
              <path d="M55 150 L35 160 L40 180 L55 175" fill={topColor} />
              <path d="M145 150 L165 160 L160 180 L145 175" fill={topColor} />
            </g>
          )
        case 1:
          return (
            <g>
              <path
                d="M60 130 L55 150 L55 220 L145 220 L145 150 L140 130 Q120 125 100 130 Q80 125 60 130 Z"
                fill={topColor}
              />
              <path d="M55 150 L35 160 L40 190 L55 185" fill={topColor} />
              <path d="M145 150 L165 160 L160 190 L145 185" fill={topColor} />
              <line
                x1="100"
                y1="130"
                x2="100"
                y2="220"
                stroke="#FFFFFF"
                strokeWidth="2"
                opacity="0.5"
              />
              <circle cx="100" cy="145" r="3" fill="#FFFFFF" />
              <circle cx="100" cy="165" r="3" fill="#FFFFFF" />
              <circle cx="100" cy="185" r="3" fill="#FFFFFF" />
            </g>
          )
        case 2:
          return (
            <g>
              <path
                d="M65 130 L60 150 L50 280 L150 280 L140 150 L135 130 Q120 125 100 130 Q80 125 65 130 Z"
                fill={topColor}
              />
              <path d="M60 150 L40 160 L45 180 L60 175" fill={topColor} />
              <path d="M140 150 L160 160 L155 180 L140 175" fill={topColor} />
            </g>
          )
        case 3:
          return (
            <g>
              <path
                d="M70 130 L65 150 L65 220 L135 220 L135 150 L130 130 Q115 125 100 130 Q85 125 70 130 Z"
                fill={topColor}
              />
              <line x1="80" y1="130" x2="85" y2="110" stroke={topColor} strokeWidth="8" />
              <line x1="120" y1="130" x2="115" y2="110" stroke={topColor} strokeWidth="8" />
            </g>
          )
        case 4:
          return (
            <g>
              <path
                d="M55 130 L50 150 L50 230 L150 230 L150 150 L145 130 Q120 125 100 130 Q80 125 55 130 Z"
                fill={topColor}
              />
              <path d="M50 150 L25 165 L30 200 L50 195" fill={topColor} />
              <path d="M150 150 L175 165 L170 200 L150 195" fill={topColor} />
              <path d="M80 130 Q100 150 120 130" fill="none" stroke={topColor} strokeWidth="15" />
              <ellipse
                cx="100"
                cy="190"
                rx="20"
                ry="15"
                fill={topColor}
                stroke="#FFFFFF"
                strokeWidth="1"
                opacity="0.5"
              />
            </g>
          )
        case 5:
          return (
            <g>
              <path
                d="M55 130 L50 150 L50 225 L150 225 L150 150 L145 130 Q120 125 100 130 Q80 125 55 130 Z"
                fill={topColor}
              />
              <path d="M50 150 L25 165 L30 200 L50 195" fill={topColor} />
              <path d="M150 150 L175 165 L170 200 L150 195" fill={topColor} />
              <path
                d="M60 160 L140 160 M60 175 L140 175 M60 190 L140 190 M60 205 L140 205"
                stroke="#FFFFFF"
                strokeWidth="2"
                opacity="0.3"
              />
            </g>
          )
        case 6: // 礼服
          return (
            <g>
              <path
                d="M55 140 L45 160 L20 280 L180 280 L155 160 L145 140 Q100 150 55 140 Z"
                fill={topColor}
              />
              <path d="M55 140 L55 130 Q100 120 145 130 L145 140" fill={topColor} opacity="0.7" />
              <line x1="55" y1="130" x2="55" y2="110" stroke={topColor} strokeWidth="2" />
              <line x1="145" y1="130" x2="145" y2="110" stroke={topColor} strokeWidth="2" />
            </g>
          )
        case 7: // 运动装
          return (
            <g>
              <path
                d="M65 130 L60 150 L60 210 L140 210 L140 150 L135 130 Q120 125 100 130 Q80 125 65 130 Z"
                fill={topColor}
              />
              <path d="M60 150 L40 160 L45 180 L60 175" fill={topColor} />
              <path d="M140 150 L160 160 L155 180 L140 175" fill={topColor} />
              <line x1="75" y1="130" x2="75" y2="210" stroke="#FFF" strokeWidth="2" opacity="0.5" />
              <line
                x1="125"
                y1="130"
                x2="125"
                y2="210"
                stroke="#FFF"
                strokeWidth="2"
                opacity="0.5"
              />
            </g>
          )
        default:
          return null
      }
    } else {
      switch (topStyle) {
        case 0:
          return (
            <g>
              <path
                d="M55 130 L50 150 L50 230 L150 230 L150 150 L145 130 Q120 120 100 125 Q80 120 55 130 Z"
                fill={topColor}
              />
              <path d="M50 150 L25 165 L30 195 L50 190" fill={topColor} />
              <path d="M150 150 L175 165 L170 195 L150 190" fill={topColor} />
            </g>
          )
        case 1:
          return (
            <g>
              <path
                d="M55 130 L50 150 L50 230 L150 230 L150 150 L145 130 Q120 120 100 125 Q80 120 55 130 Z"
                fill={topColor}
              />
              <path d="M50 150 L25 165 L30 205 L50 200" fill={topColor} />
              <path d="M150 150 L175 165 L170 205 L150 200" fill={topColor} />
              <line
                x1="100"
                y1="125"
                x2="100"
                y2="230"
                stroke="#FFFFFF"
                strokeWidth="2"
                opacity="0.5"
              />
              <path
                d="M85 125 L100 145 L115 125"
                fill={topColor}
                stroke="#FFFFFF"
                strokeWidth="1"
              />
            </g>
          )
        case 2:
          return (
            <g>
              <path
                d="M50 130 L45 150 L45 235 L155 235 L155 150 L150 130 Q125 115 100 120 Q75 115 50 130 Z"
                fill={topColor}
              />
              <path d="M45 150 L20 170 L25 210 L45 205" fill={topColor} />
              <path d="M155 150 L180 170 L175 210 L155 205" fill={topColor} />
              <path d="M75 130 Q100 155 125 130" fill="none" stroke={topColor} strokeWidth="18" />
              <ellipse
                cx="100"
                cy="195"
                rx="22"
                ry="18"
                fill={topColor}
                stroke="#FFFFFF"
                strokeWidth="1"
                opacity="0.5"
              />
            </g>
          )
        case 3:
          return (
            <g>
              <path
                d="M50 130 L45 150 L45 235 L155 235 L155 150 L150 130 Q125 115 100 120 Q75 115 50 130 Z"
                fill={topColor}
              />
              <path d="M45 150 L20 170 L25 210 L45 205" fill={topColor} />
              <path d="M155 150 L180 170 L175 210 L155 205" fill={topColor} />
              <path d="M100 120 L85 235 M100 120 L115 235" stroke="#333" strokeWidth="2" />
              <path d="M85 125 L100 145 L115 125" fill="#FFFFFF" />
              <rect x="95" y="148" width="10" height="5" fill="#333" />
            </g>
          )
        case 4:
          return (
            <g>
              <path
                d="M50 130 L45 150 L45 230 L155 230 L155 150 L150 130 Q125 115 100 120 Q75 115 50 130 Z"
                fill={topColor}
              />
              <path d="M45 150 L20 170 L25 205 L45 200" fill={topColor} />
              <path d="M155 150 L180 170 L175 205 L155 200" fill={topColor} />
              <line x1="100" y1="120" x2="100" y2="230" stroke="#FFD700" strokeWidth="3" />
              <rect
                x="60"
                y="180"
                width="25"
                height="25"
                rx="3"
                fill={topColor}
                stroke="#333"
                strokeWidth="1"
              />
              <rect
                x="115"
                y="180"
                width="25"
                height="25"
                rx="3"
                fill={topColor}
                stroke="#333"
                strokeWidth="1"
              />
            </g>
          )
        case 5:
          return (
            <g>
              <path
                d="M50 130 L45 150 L45 230 L155 230 L155 150 L150 130 Q125 115 100 120 Q75 115 50 130 Z"
                fill={topColor}
              />
              <path d="M45 150 L20 170 L25 205 L45 200" fill={topColor} />
              <path d="M155 150 L180 170 L175 205 L155 200" fill={topColor} />
              <path
                d="M55 165 L145 165 M55 185 L145 185 M55 205 L145 205"
                stroke="#FFFFFF"
                strokeWidth="2"
                opacity="0.3"
              />
            </g>
          )
        case 6: // 运动背心
          return (
            <g>
              <path
                d="M65 130 L60 150 L60 220 L140 220 L140 150 L135 130 Q120 125 100 130 Q80 125 65 130 Z"
                fill={topColor}
              />
              <path d="M65 130 Q80 160 100 160 Q120 160 135 130" fill="#FFF" opacity="0.2" />
            </g>
          )
        case 7: // 风衣
          return (
            <g>
              <path
                d="M50 130 L40 150 L35 250 L165 250 L160 150 L150 130 Q125 120 100 125 Q75 120 50 130 Z"
                fill={topColor}
              />
              <path d="M40 150 L20 165 L25 205 L45 200" fill={topColor} />
              <path d="M160 150 L180 165 L175 205 L155 200" fill={topColor} />
              <line
                x1="100"
                y1="125"
                x2="100"
                y2="250"
                stroke="#000"
                strokeWidth="1"
                opacity="0.3"
              />
              <path d="M85 125 L100 150 L115 125" fill={topColor} stroke="#000" strokeWidth="0.5" />
            </g>
          )
        default:
          return null
      }
    }
  }

  // 渲染下装
  const renderBottom = () => {
    const needsBottom = gender === 'male' || topStyle !== 2
    if (!needsBottom) return null
    switch (bottomStyle) {
      case 0:
        return (
          <g>
            <path
              d="M55 220 L55 340 L95 340 L100 260 L105 340 L145 340 L145 220 Z"
              fill={bottomColor}
            />
          </g>
        )
      case 1:
        return (
          <g>
            <path
              d="M55 220 L55 280 L95 280 L100 250 L105 280 L145 280 L145 220 Z"
              fill={bottomColor}
            />
          </g>
        )
      case 2:
        return (
          <g>
            <path
              d="M55 220 L55 340 L95 340 L100 260 L105 340 L145 340 L145 220 Z"
              fill={bottomColor}
            />
            <path
              d="M60 240 L90 240 M110 240 L140 240"
              stroke="#FFFFFF"
              strokeWidth="1"
              opacity="0.3"
            />
            <circle cx="70" cy="230" r="2" fill="#FFD700" />
            <circle cx="130" cy="230" r="2" fill="#FFD700" />
          </g>
        )
      case 3:
        return (
          <g>
            <path
              d="M55 220 L50 340 L95 340 L100 260 L105 340 L150 340 L145 220 Z"
              fill={bottomColor}
            />
            <path d="M55 250 L70 250 M130 250 L145 250" stroke="#FFFFFF" strokeWidth="2" />
          </g>
        )
      case 4:
        return (
          <g>
            <path d="M55 220 L45 320 L155 320 L145 220 Z" fill={bottomColor} />
          </g>
        )
      case 5:
        return (
          <g>
            <path
              d="M58 220 L55 340 L95 340 L100 260 L105 340 L145 340 L142 220 Z"
              fill={bottomColor}
            />
            <line x1="75" y1="220" x2="75" y2="340" stroke="#333" strokeWidth="1" opacity="0.3" />
            <line x1="125" y1="220" x2="125" y2="340" stroke="#333" strokeWidth="1" opacity="0.3" />
          </g>
        )
      case 6: // 百褶裙
        return (
          <g>
            <path d="M55 220 L45 290 L155 290 L145 220 Z" fill={bottomColor} />
            <path
              d="M65 220 L60 290 M75 220 L75 290 M85 220 L90 290 M100 220 L100 290 M115 220 L110 290 M125 220 L125 290 M135 220 L140 290"
              stroke="#000"
              strokeWidth="1"
              opacity="0.1"
            />
          </g>
        )
      case 7: // 工装裤
        return (
          <g>
            <path
              d="M55 220 L50 340 L95 340 L100 260 L105 340 L150 340 L145 220 Z"
              fill={bottomColor}
            />
            <rect
              x="50"
              y="270"
              width="10"
              height="20"
              fill={bottomColor}
              stroke="#000"
              strokeWidth="0.5"
            />
            <rect
              x="140"
              y="270"
              width="10"
              height="20"
              fill={bottomColor}
              stroke="#000"
              strokeWidth="0.5"
            />
          </g>
        )
      default:
        return null
    }
  }

  // 渲染鞋子
  const renderShoes = () => {
    const y =
      gender === 'female' && topStyle === 2
        ? 280
        : bottomStyle === 1 || bottomStyle === 4
        ? 280
        : 340
    switch (shoesStyle) {
      case 0:
        return (
          <g>
            <ellipse cx="75" cy={y + 10} rx="20" ry="10" fill={shoesColor} />
            <ellipse cx="125" cy={y + 10} rx="20" ry="10" fill={shoesColor} />
            <path d={`M60 ${y + 8} L90 ${y + 8}`} stroke="#FFFFFF" strokeWidth="2" />
            <path d={`M110 ${y + 8} L140 ${y + 8}`} stroke="#FFFFFF" strokeWidth="2" />
          </g>
        )
      case 1:
        return (
          <g>
            <path
              d={`M55 ${y} L55 ${y + 15} L95 ${y + 15} L95 ${y} Q75 ${y - 5} 55 ${y} Z`}
              fill={shoesColor}
            />
            <path
              d={`M105 ${y} L105 ${y + 15} L145 ${y + 15} L145 ${y} Q125 ${y - 5} 105 ${y} Z`}
              fill={shoesColor}
            />
          </g>
        )
      case 2:
        return (
          <g>
            <path
              d={`M60 ${y} L60 ${y + 8} L90 ${y + 8} L85 ${y} Q72 ${y - 5} 60 ${y} Z`}
              fill={shoesColor}
            />
            <path
              d={`M110 ${y} L110 ${y + 8} L140 ${y + 8} L135 ${y} Q122 ${y - 5} 110 ${y} Z`}
              fill={shoesColor}
            />
            <line x1="65" y1={y + 8} x2="60" y2={y + 20} stroke={shoesColor} strokeWidth="4" />
            <line x1="115" y1={y + 8} x2="110" y2={y + 20} stroke={shoesColor} strokeWidth="4" />
          </g>
        )
      case 3:
        return (
          <g>
            <path
              d={`M55 ${y - 30} L55 ${y + 12} L95 ${y + 12} L95 ${y - 30} Z`}
              fill={shoesColor}
            />
            <path
              d={`M105 ${y - 30} L105 ${y + 12} L145 ${y + 12} L145 ${y - 30} Z`}
              fill={shoesColor}
            />
          </g>
        )
      case 4:
        return (
          <g>
            <ellipse cx="75" cy={y + 8} rx="18" ry="8" fill={shoesColor} />
            <ellipse cx="125" cy={y + 8} rx="18" ry="8" fill={shoesColor} />
          </g>
        )
      case 5:
        return (
          <g>
            <ellipse cx="75" cy={y + 8} rx="20" ry="10" fill={shoesColor} />
            <ellipse cx="125" cy={y + 8} rx="20" ry="10" fill={shoesColor} />
            <path d={`M65 ${y + 3} L85 ${y + 3}`} stroke="#FFFFFF" strokeWidth="4" />
            <path d={`M115 ${y + 3} L135 ${y + 3}`} stroke="#FFFFFF" strokeWidth="4" />
          </g>
        )
      case 6: // 帆布鞋
        return (
          <g>
            <path d={`M60 ${y} L60 ${y + 12} L90 ${y + 12} L90 ${y} Z`} fill={shoesColor} />
            <path d={`M110 ${y} L110 ${y + 12} L140 ${y + 12} L140 ${y} Z`} fill={shoesColor} />
            <circle cx="75" cy={y + 6} r="3" fill="#FFF" />
            <circle cx="125" cy={y + 6} r="3" fill="#FFF" />
            <path d={`M60 ${y + 12} L90 ${y + 12}`} stroke="#FFF" strokeWidth="4" />
            <path d={`M110 ${y + 12} L140 ${y + 12}`} stroke="#FFF" strokeWidth="4" />
          </g>
        )
      case 7: // 马丁靴
        return (
          <g>
            <path
              d={`M60 ${y - 10} L60 ${y + 12} L90 ${y + 12} L90 ${y - 10} Z`}
              fill={shoesColor}
            />
            <path
              d={`M110 ${y - 10} L110 ${y + 12} L140 ${y + 12} L140 ${y - 10} Z`}
              fill={shoesColor}
            />
            <line
              x1="65"
              y1={y - 5}
              x2="85"
              y2={y - 5}
              stroke="#FFF"
              strokeWidth="1"
              opacity="0.5"
            />
            <line x1="65" y1={y} x2="85" y2={y} stroke="#FFF" strokeWidth="1" opacity="0.5" />
            <line
              x1="65"
              y1={y + 5}
              x2="85"
              y2={y + 5}
              stroke="#FFF"
              strokeWidth="1"
              opacity="0.5"
            />
            <line
              x1="115"
              y1={y - 5}
              x2="135"
              y2={y - 5}
              stroke="#FFF"
              strokeWidth="1"
              opacity="0.5"
            />
            <line x1="115" y1={y} x2="135" y2={y} stroke="#FFF" strokeWidth="1" opacity="0.5" />
            <line
              x1="115"
              y1={y + 5}
              x2="135"
              y2={y + 5}
              stroke="#FFF"
              strokeWidth="1"
              opacity="0.5"
            />
          </g>
        )
      default:
        return null
    }
  }

  // 渲染配饰
  const renderAccessory = () => {
    switch (accessory) {
      case 0:
        return null
      case 1:
        return (
          <g>
            <circle cx="85" cy="72" r="12" fill="none" stroke="#333" strokeWidth="2" />
            <circle cx="115" cy="72" r="12" fill="none" stroke="#333" strokeWidth="2" />
            <line x1="97" y1="72" x2="103" y2="72" stroke="#333" strokeWidth="2" />
            <line x1="73" y1="72" x2="60" y2="68" stroke="#333" strokeWidth="2" />
            <line x1="127" y1="72" x2="140" y2="68" stroke="#333" strokeWidth="2" />
          </g>
        )
      case 2:
        return (
          <g>
            <ellipse cx="85" cy="72" rx="14" ry="10" fill="#333" />
            <ellipse cx="115" cy="72" rx="14" ry="10" fill="#333" />
            <line x1="99" y1="72" x2="101" y2="72" stroke="#333" strokeWidth="3" />
            <line x1="71" y1="70" x2="55" y2="65" stroke="#333" strokeWidth="2" />
            <line x1="129" y1="70" x2="145" y2="65" stroke="#333" strokeWidth="2" />
          </g>
        )
      case 3:
        return (
          <g>
            <ellipse cx="100" cy="35" rx="50" ry="10" fill="#333" />
            <path d="M60 35 Q60 10 100 5 Q140 10 140 35" fill="#333" />
          </g>
        )
      case 4:
        return (
          <g>
            <circle cx="58" cy="85" r="5" fill="#FFD700" />
            <circle cx="142" cy="85" r="5" fill="#FFD700" />
          </g>
        )
      case 5:
        return (
          <g>
            <path d="M75 115 Q100 135 125 115" stroke="#FFD700" strokeWidth="2" fill="none" />
            <circle cx="100" cy="130" r="6" fill="#FFD700" />
          </g>
        )
      case 6: // 围巾
        return (
          <g>
            <path d="M70 125 Q100 145 130 125 L130 145 Q100 165 70 145 Z" fill="#D32F2F" />
            <rect x="90" y="145" width="20" height="40" fill="#D32F2F" />
          </g>
        )
      case 7: // 领结
        return (
          <g>
            <path d="M85 125 L115 125 L125 115 L75 115 Z" fill="#000" />
            <circle cx="100" cy="125" r="5" fill="#000" />
          </g>
        )
      default:
        return null
    }
  }

  const hairNames = gender === 'female' ? HAIR_STYLES_FEMALE : HAIR_STYLES_MALE
  const topNames = gender === 'female' ? TOP_STYLES_FEMALE : TOP_STYLES_MALE

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <BackButton href="/" text="返回首页" />

        <div className="card">
          <h1 className="text-3xl md:text-4xl font-bold text-primary text-center mb-2">
            🎀 换装游戏
          </h1>
          <p className="text-gray-600 text-center mb-6">打扮你的虚拟形象，保存你喜欢的搭配！</p>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* 左侧：人物预览 */}
            <div className="space-y-4">
              {/* 性别选择 */}
              <div className="flex justify-center gap-4 mb-4">
                <button
                  onClick={() => setGender('female')}
                  className={`px-6 py-2 rounded-full transition-all ${
                    gender === 'female'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  👩 女生
                </button>
                <button
                  onClick={() => setGender('male')}
                  className={`px-6 py-2 rounded-full transition-all ${
                    gender === 'male'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  👨 男生
                </button>
              </div>

              {/* 人物展示 */}
              <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-3xl p-6 flex justify-center">
                <svg viewBox="0 0 200 380" width="200" height="380" className="drop-shadow-lg">
                  {renderHair()}
                  <ellipse cx="100" cy="150" rx="40" ry="50" fill={currentSkin} />
                  <ellipse cx="55" cy="170" rx="10" ry="35" fill={currentSkin} />
                  <ellipse cx="145" cy="170" rx="10" ry="35" fill={currentSkin} />
                  <rect x="75" y="200" width="15" height="140" rx="7" fill={currentSkin} />
                  <rect x="110" y="200" width="15" height="140" rx="7" fill={currentSkin} />
                  <circle cx="100" cy="70" r="35" fill={currentSkin} />
                  {renderTop()}
                  {renderBottom()}
                  {renderShoes()}
                  {renderAccessory()}
                  <circle cx="88" cy="68" r="3" fill="#333" />
                  <circle cx="112" cy="68" r="3" fill="#333" />
                  <path
                    d="M93 85 Q100 92 107 85"
                    stroke="#E57373"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <ellipse cx="80" cy="78" rx="8" ry="4" fill="#FFCDD2" opacity="0.6" />
                  <ellipse cx="120" cy="78" rx="8" ry="4" fill="#FFCDD2" opacity="0.6" />
                </svg>
              </div>

              {/* 肤色选择 */}
              <div className="flex justify-center gap-2">
                <span className="text-sm text-gray-600 mr-2">肤色:</span>
                {SKIN_TONES.map((color, index) => (
                  <button
                    key={color}
                    onClick={() => setSkinTone(index)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      skinTone === index ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-center gap-3 flex-wrap">
                <button onClick={randomize} className="btn-secondary">
                  🎲 随机搭配
                </button>
                <button onClick={() => setShowSaveDialog(true)} className="btn-primary">
                  💾 保存装扮
                </button>
              </div>
            </div>

            {/* 右侧：选择面板 */}
            <div className="space-y-4">
              {/* 分类标签 */}
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
                {[
                  { key: 'hair', label: '发型', icon: '💇' },
                  { key: 'top', label: '上装', icon: '👕' },
                  { key: 'bottom', label: '下装', icon: '👖' },
                  { key: 'shoes', label: '鞋子', icon: '👟' },
                  { key: 'accessory', label: '配饰', icon: '👓' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'bg-white shadow text-primary font-semibold'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* 选项内容 */}
              <div className="bg-gray-50 rounded-xl p-4 min-h-[200px]">
                {activeTab === 'hair' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {hairNames.map((name, index) => (
                        <button
                          key={index}
                          onClick={() => setHairStyle(index)}
                          className={`p-3 rounded-xl text-sm transition-all ${
                            hairStyle === index
                              ? 'bg-primary text-white'
                              : 'bg-white hover:bg-gray-100'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-gray-600">发色:</span>
                      <input
                        type="color"
                        value={hairColor}
                        onChange={(e) => setHairColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <div className="flex gap-1">
                        {['#2C1810', '#8B4513', '#FFD700', '#FF4500', '#000000', '#A0522D'].map(
                          (color) => (
                            <button
                              key={color}
                              onClick={() => setHairColor(color)}
                              className={`w-8 h-8 rounded-full ${
                                hairColor === color ? 'ring-2 ring-primary' : ''
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'top' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {topNames.map((name, index) => (
                        <button
                          key={index}
                          onClick={() => setTopStyle(index)}
                          className={`p-3 rounded-xl text-sm transition-all ${
                            topStyle === index
                              ? 'bg-primary text-white'
                              : 'bg-white hover:bg-gray-100'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-gray-600">颜色:</span>
                      <input
                        type="color"
                        value={topColor}
                        onChange={(e) => setTopColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <div className="flex gap-1 flex-wrap">
                        {[
                          '#FF69B4',
                          '#87CEEB',
                          '#98FB98',
                          '#DDA0DD',
                          '#F0E68C',
                          '#FF6347',
                          '#FFFFFF',
                          '#000000',
                        ].map((color) => (
                          <button
                            key={color}
                            onClick={() => setTopColor(color)}
                            className={`w-8 h-8 rounded-full border ${
                              topColor === color ? 'ring-2 ring-primary' : ''
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'bottom' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {BOTTOM_STYLES.map((name, index) => (
                        <button
                          key={index}
                          onClick={() => setBottomStyle(index)}
                          className={`p-3 rounded-xl text-sm transition-all ${
                            bottomStyle === index
                              ? 'bg-primary text-white'
                              : 'bg-white hover:bg-gray-100'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-gray-600">颜色:</span>
                      <input
                        type="color"
                        value={bottomColor}
                        onChange={(e) => setBottomColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <div className="flex gap-1 flex-wrap">
                        {[
                          '#4169E1',
                          '#2F4F4F',
                          '#8B4513',
                          '#000080',
                          '#800000',
                          '#556B2F',
                          '#000000',
                          '#1E90FF',
                        ].map((color) => (
                          <button
                            key={color}
                            onClick={() => setBottomColor(color)}
                            className={`w-8 h-8 rounded-full ${
                              bottomColor === color ? 'ring-2 ring-primary' : ''
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'shoes' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {SHOES_STYLES.map((name, index) => (
                        <button
                          key={index}
                          onClick={() => setShoesStyle(index)}
                          className={`p-3 rounded-xl text-sm transition-all ${
                            shoesStyle === index
                              ? 'bg-primary text-white'
                              : 'bg-white hover:bg-gray-100'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-gray-600">颜色:</span>
                      <input
                        type="color"
                        value={shoesColor}
                        onChange={(e) => setShoesColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <div className="flex gap-1 flex-wrap">
                        {[
                          '#8B4513',
                          '#000000',
                          '#FFFFFF',
                          '#FF69B4',
                          '#4169E1',
                          '#FFD700',
                          '#FF0000',
                          '#808080',
                        ].map((color) => (
                          <button
                            key={color}
                            onClick={() => setShoesColor(color)}
                            className={`w-8 h-8 rounded-full border ${
                              shoesColor === color ? 'ring-2 ring-primary' : ''
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'accessory' && (
                  <div className="grid grid-cols-3 gap-2">
                    {ACCESSORIES.map((name, index) => (
                      <button
                        key={index}
                        onClick={() => setAccessory(index)}
                        className={`p-3 rounded-xl text-sm transition-all ${
                          accessory === index
                            ? 'bg-primary text-white'
                            : 'bg-white hover:bg-gray-100'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 已保存的装扮 */}
              {savedOutfits.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold mb-3">💾 已保存的装扮</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {savedOutfits.map((outfit) => (
                      <div
                        key={outfit.id}
                        className="flex items-center justify-between bg-white rounded-lg p-3"
                      >
                        <span className="font-medium">{outfit.name}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadOutfit(outfit)}
                            className="text-primary hover:text-primary/80 text-sm"
                          >
                            加载
                          </button>
                          <button
                            onClick={() => deleteOutfit(outfit.id)}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 保存弹窗 */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="text-xl font-bold mb-4">💾 保存装扮</h3>
              <input
                type="text"
                value={outfitName}
                onChange={(e) => setOutfitName(e.target.value)}
                placeholder="给这套装扮起个名字..."
                className="w-full p-3 border rounded-xl mb-4 focus:border-primary focus:outline-none"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowSaveDialog(false)} className="flex-1 btn-secondary">
                  取消
                </button>
                <button onClick={saveOutfit} className="flex-1 btn-primary">
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
