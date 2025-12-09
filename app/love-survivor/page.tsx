'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import BackButton from '../components/BackButton'
import { useToast } from '../components/ToastProvider'

interface Position {
  x: number
  y: number
}

interface Enemy {
  id: number
  x: number
  y: number
  hp: number
  maxHp: number
  type: 'normal' | 'fast' | 'tank' | 'boss' | 'shooter'
  speed: number
  shootCooldown?: number
}

interface Bullet {
  id: number
  x: number
  y: number
  angle: number
  damage: number
  isEnemy?: boolean
}

interface PowerUp {
  id: number
  x: number
  y: number
  type:
    | 'speed'
    | 'damage'
    | 'heal'
    | 'shield'
    | 'multishot'
    | 'firerate'
    | 'magnet'
    | 'bomb'
    | 'life'
}

interface Particle {
  id: number
  x: number
  y: number
  emoji: string
  life: number
  vx?: number
  vy?: number
  scale?: number
}

interface ExpOrb {
  id: number
  x: number
  y: number
  value: number
}

// 游戏配置
const GAME_WIDTH = 400
const GAME_HEIGHT = 600
const PLAYER_SIZE = 30
const ENEMY_SIZE = 25
const BULLET_SIZE = 10
const POWERUP_SIZE = 20

// 玩家角色选择
const PLAYER_CHARACTERS = [
  { emoji: '😊', name: '小开心', bonus: 'hp', bonusValue: 20 },
  { emoji: '🥰', name: '小甜心', bonus: 'damage', bonusValue: 5 },
  { emoji: '😎', name: '小酷哥', bonus: 'speed', bonusValue: 1 },
  { emoji: '🤗', name: '小暖心', bonus: 'heal', bonusValue: 0.5 },
]

export default function LoveSurvivorPage() {
  const toast = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number | null>(null)
  const keysRef = useRef<Set<string>>(new Set())

  // 游戏状态
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showCharacterSelect, setShowCharacterSelect] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState(0)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [wave, setWave] = useState(1)
  const [kills, setKills] = useState(0)
  const [gameTime, setGameTime] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [exp, setExp] = useState(0)
  const [level, setLevel] = useState(1)
  const [expToNextLevel, setExpToNextLevel] = useState(100)

  // 玩家状态
  const [playerPos, setPlayerPos] = useState<Position>({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 80 })
  const [playerHp, setPlayerHp] = useState(100)
  const [playerMaxHp, setPlayerMaxHp] = useState(100)
  const [playerSpeed, setPlayerSpeed] = useState(5)
  const [damage, setDamage] = useState(10)
  const [fireRate, setFireRate] = useState(300) // ms
  const [multishot, setMultishot] = useState(1)
  const [hasShield, setHasShield] = useState(false)
  const [magnetRange, setMagnetRange] = useState(50)
  const [critChance, setCritChance] = useState(0.1)
  const [lifeSteal, setLifeSteal] = useState(0)
  const [invincible, setInvincible] = useState(false)

  // 游戏对象
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [bullets, setBullets] = useState<Bullet[]>([])
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [expOrbs, setExpOrbs] = useState<ExpOrb[]>([])

  // Refs for game loop
  const playerPosRef = useRef(playerPos)
  const enemiesRef = useRef(enemies)
  const bulletsRef = useRef(bullets)
  const powerUpsRef = useRef(powerUps)
  const lastFireRef = useRef(0)
  const lastEnemySpawnRef = useRef(0)
  const waveRef = useRef(wave)
  const comboRef = useRef(combo)
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const damageRef = useRef(damage)
  const critChanceRef = useRef(critChance)
  const lifeStealRef = useRef(lifeSteal)

  // 同步 refs
  useEffect(() => {
    playerPosRef.current = playerPos
  }, [playerPos])
  useEffect(() => {
    enemiesRef.current = enemies
  }, [enemies])
  useEffect(() => {
    bulletsRef.current = bullets
  }, [bullets])
  useEffect(() => {
    powerUpsRef.current = powerUps
  }, [powerUps])
  useEffect(() => {
    waveRef.current = wave
  }, [wave])
  useEffect(() => {
    comboRef.current = combo
  }, [combo])
  useEffect(() => {
    damageRef.current = damage
  }, [damage])
  useEffect(() => {
    critChanceRef.current = critChance
  }, [critChance])
  useEffect(() => {
    lifeStealRef.current = lifeSteal
  }, [lifeSteal])

  // 加载最高分
  useEffect(() => {
    const saved = localStorage.getItem('loveSurvivorHighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase())
      if (e.key === 'Escape') setIsPaused((p) => !p)
      if (e.key === ' ' && !gameStarted && !showCharacterSelect) {
        setShowCharacterSelect(true)
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase())
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameStarted, showCharacterSelect])

  // 触摸控制
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!gameStarted || gameOver || isPaused) return
      const touch = e.touches[0]
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = ((touch.clientX - rect.left) / rect.width) * GAME_WIDTH
      const y = ((touch.clientY - rect.top) / rect.height) * GAME_HEIGHT

      setPlayerPos({
        x: Math.max(PLAYER_SIZE / 2, Math.min(GAME_WIDTH - PLAYER_SIZE / 2, x)),
        y: Math.max(PLAYER_SIZE / 2, Math.min(GAME_HEIGHT - PLAYER_SIZE / 2, y)),
      })
    },
    [gameStarted, gameOver, isPaused]
  )

  // 开始游戏
  const startGame = (characterIndex: number) => {
    const character = PLAYER_CHARACTERS[characterIndex]
    setSelectedCharacter(characterIndex)
    setShowCharacterSelect(false)
    setGameStarted(true)
    setGameOver(false)
    setIsPaused(false)
    setScore(0)
    setWave(1)
    setKills(0)
    setGameTime(0)
    setCombo(0)
    setMaxCombo(0)
    setExp(0)
    setLevel(1)
    setExpToNextLevel(100)
    setPlayerPos({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 80 })

    // 根据角色应用加成
    const baseHp = character.bonus === 'hp' ? 100 + character.bonusValue : 100
    const baseDamage = character.bonus === 'damage' ? 10 + character.bonusValue : 10
    const baseSpeed = character.bonus === 'speed' ? 5 + character.bonusValue : 5

    setPlayerHp(baseHp)
    setPlayerMaxHp(baseHp)
    setPlayerSpeed(baseSpeed)
    setDamage(baseDamage)
    setFireRate(300)
    setMultishot(1)
    setHasShield(false)
    setMagnetRange(50)
    setCritChance(0.1)
    setLifeSteal(character.bonus === 'heal' ? character.bonusValue : 0)
    setInvincible(false)
    setEnemies([])
    setBullets([])
    setPowerUps([])
    setParticles([])
    setExpOrbs([])
  }

  // 添加粒子效果
  const addParticle = useCallback((x: number, y: number, emoji: string, burst = false) => {
    if (burst) {
      // 爆炸效果
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        setParticles((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            x,
            y,
            emoji,
            life: 20,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3,
            scale: 1,
          },
        ])
      }
    } else {
      setParticles((prev) => [
        ...prev,
        { id: Date.now() + Math.random(), x, y, emoji, life: 30, vx: 0, vy: -1, scale: 1 },
      ])
    }
  }, [])

  // 添加经验球
  const addExpOrb = useCallback((x: number, y: number, value: number) => {
    setExpOrbs((prev) => [...prev, { id: Date.now() + Math.random(), x, y, value }])
  }, [])

  // 增加连击
  const addCombo = useCallback(() => {
    setCombo((c) => {
      const newCombo = c + 1
      if (newCombo > maxCombo) setMaxCombo(newCombo)
      return newCombo
    })
    // 重置连击计时器
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current)
    comboTimerRef.current = setTimeout(() => setCombo(0), 2000)
  }, [maxCombo])

  // 获得经验
  const gainExp = useCallback(
    (amount: number) => {
      setExp((prev) => {
        const newExp = prev + amount
        if (newExp >= expToNextLevel) {
          // 升级
          setLevel((l) => l + 1)
          setExpToNextLevel((e) => Math.floor(e * 1.5))
          toast.success(`🎉 升级！等级 ${level + 1}`)
          // 升级奖励
          setPlayerMaxHp((hp) => hp + 10)
          setPlayerHp((hp) => Math.min(hp + 20, playerMaxHp + 10))
          setDamage((d) => d + 2)
          return newExp - expToNextLevel
        }
        return newExp
      })
    },
    [expToNextLevel, level, playerMaxHp, toast]
  )

  // 使用炸弹
  const activateBomb = useCallback(() => {
    // 清除所有敌人
    setEnemies((prev) => {
      prev.forEach((e) => {
        addParticle(e.x, e.y, '💥', true)
        const points = e.type === 'boss' ? 100 : e.type === 'tank' ? 30 : 10
        setScore((s) => s + points)
        setKills((k) => k + 1)
        addExpOrb(e.x, e.y, e.type === 'boss' ? 50 : 10)
      })
      return []
    })
    // 清除敌人子弹
    setBullets((prev) => prev.filter((b) => !b.isEnemy))
    toast.success('💣 炸弹！清除所有敌人！')
  }, [addParticle, addExpOrb, toast])

  // 生成敌人
  const spawnEnemy = useCallback(() => {
    const types: Enemy['type'][] = ['normal', 'fast', 'tank', 'shooter']
    const currentWave = waveRef.current

    // Boss 每5波出现一次
    if (currentWave % 5 === 0 && enemiesRef.current.filter((e) => e.type === 'boss').length === 0) {
      const boss: Enemy = {
        id: Date.now(),
        x: GAME_WIDTH / 2,
        y: -50,
        hp: 100 + currentWave * 20,
        maxHp: 100 + currentWave * 20,
        type: 'boss',
        speed: 0.5 + currentWave * 0.05,
        shootCooldown: 0,
      }
      setEnemies((prev) => [...prev, boss])
      toast.info(`👾 Boss 出现！`)
      return
    }

    // 根据波数调整敌人类型概率
    let type: Enemy['type']
    const rand = Math.random()
    if (currentWave >= 3 && rand < 0.15) {
      type = 'shooter'
    } else if (rand < 0.3) {
      type = 'fast'
    } else if (rand < 0.45) {
      type = 'tank'
    } else {
      type = 'normal'
    }

    const enemy: Enemy = {
      id: Date.now() + Math.random(),
      x: Math.random() * (GAME_WIDTH - ENEMY_SIZE * 2) + ENEMY_SIZE,
      y: -ENEMY_SIZE,
      hp:
        type === 'tank'
          ? 30 + currentWave * 5
          : type === 'fast'
          ? 10
          : type === 'shooter'
          ? 15
          : 20 + currentWave * 2,
      maxHp:
        type === 'tank'
          ? 30 + currentWave * 5
          : type === 'fast'
          ? 10
          : type === 'shooter'
          ? 15
          : 20 + currentWave * 2,
      type,
      speed:
        type === 'fast'
          ? 3 + currentWave * 0.2
          : type === 'tank'
          ? 1
          : type === 'shooter'
          ? 0.8
          : 1.5 + currentWave * 0.1,
      shootCooldown: type === 'shooter' ? 0 : undefined,
    }
    setEnemies((prev) => [...prev, enemy])
  }, [toast])

  // 生成道具
  const spawnPowerUp = useCallback((x: number, y: number) => {
    if (Math.random() > 0.35) return // 35% 概率掉落

    const types: PowerUp['type'][] = [
      'speed',
      'damage',
      'heal',
      'shield',
      'multishot',
      'firerate',
      'magnet',
      'bomb',
      'life',
    ]
    // 稀有道具概率更低
    const rand = Math.random()
    let type: PowerUp['type']
    if (rand < 0.05) {
      type = 'bomb'
    } else if (rand < 0.1) {
      type = 'life'
    } else if (rand < 0.2) {
      type = 'shield'
    } else {
      const commonTypes: PowerUp['type'][] = [
        'speed',
        'damage',
        'heal',
        'multishot',
        'firerate',
        'magnet',
      ]
      type = commonTypes[Math.floor(Math.random() * commonTypes.length)]
    }
    setPowerUps((prev) => [...prev, { id: Date.now(), x, y, type }])
  }, [])

  // 发射子弹
  const fireBullets = useCallback(() => {
    const pos = playerPosRef.current
    const newBullets: Bullet[] = []

    for (let i = 0; i < multishot; i++) {
      const spread = multishot > 1 ? ((i - (multishot - 1) / 2) * 15 * Math.PI) / 180 : 0
      newBullets.push({
        id: Date.now() + i,
        x: pos.x,
        y: pos.y - PLAYER_SIZE / 2,
        angle: -Math.PI / 2 + spread,
        damage,
      })
    }

    setBullets((prev) => [...prev, ...newBullets])
  }, [multishot, damage])

  // 游戏主循环
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return

    const gameLoop = () => {
      const now = Date.now()
      const keys = keysRef.current

      // 移动玩家
      setPlayerPos((prev) => {
        let newX = prev.x
        let newY = prev.y

        if (keys.has('arrowleft') || keys.has('a')) newX -= playerSpeed
        if (keys.has('arrowright') || keys.has('d')) newX += playerSpeed
        if (keys.has('arrowup') || keys.has('w')) newY -= playerSpeed
        if (keys.has('arrowdown') || keys.has('s')) newY += playerSpeed

        return {
          x: Math.max(PLAYER_SIZE / 2, Math.min(GAME_WIDTH - PLAYER_SIZE / 2, newX)),
          y: Math.max(PLAYER_SIZE / 2, Math.min(GAME_HEIGHT - PLAYER_SIZE / 2, newY)),
        }
      })

      // 自动射击
      if (now - lastFireRef.current > fireRate) {
        fireBullets()
        lastFireRef.current = now
      }

      // 生成敌人
      const spawnInterval = Math.max(500, 2000 - waveRef.current * 100)
      if (now - lastEnemySpawnRef.current > spawnInterval) {
        spawnEnemy()
        lastEnemySpawnRef.current = now
      }

      // 更新子弹
      setBullets((prev) =>
        prev
          .map((b) => ({
            ...b,
            x: b.x + Math.cos(b.angle) * (b.isEnemy ? 5 : 10),
            y: b.y + Math.sin(b.angle) * (b.isEnemy ? 5 : 10),
          }))
          .filter(
            (b) =>
              b.y > -BULLET_SIZE &&
              b.y < GAME_HEIGHT + BULLET_SIZE &&
              b.x > -BULLET_SIZE &&
              b.x < GAME_WIDTH + BULLET_SIZE
          )
      )

      // 更新敌人 (包括射击)
      setEnemies((prev) =>
        prev
          .map((e) => {
            const updated = { ...e, y: e.y + e.speed }
            // 射击型敌人和Boss发射子弹
            if ((e.type === 'shooter' || e.type === 'boss') && e.shootCooldown !== undefined) {
              updated.shootCooldown = (e.shootCooldown || 0) + 16 // 约60fps
              if (updated.shootCooldown > (e.type === 'boss' ? 1000 : 2000) && e.y > 0) {
                updated.shootCooldown = 0
                // 发射敌人子弹
                const playerPos = playerPosRef.current
                const angle = Math.atan2(playerPos.y - e.y, playerPos.x - e.x)
                setBullets((bullets) => [
                  ...bullets,
                  {
                    id: Date.now() + Math.random(),
                    x: e.x,
                    y: e.y,
                    angle,
                    damage: 15,
                    isEnemy: true,
                  },
                ])
              }
            }
            return updated
          })
          .filter((e) => e.y < GAME_HEIGHT + ENEMY_SIZE)
      )

      // 更新粒子
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            life: p.life - 1,
            x: p.x + (p.vx || 0),
            y: p.y + (p.vy || -1),
            scale: (p.scale || 1) * 0.95,
          }))
          .filter((p) => p.life > 0)
      )

      // 更新经验球（磁吸效果）
      const playerPos = playerPosRef.current
      setExpOrbs((prev) =>
        prev
          .map((orb) => {
            const dx = playerPos.x - orb.x
            const dy = playerPos.y - orb.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < magnetRange) {
              // 磁吸效果
              const speed = 5 + (magnetRange - dist) * 0.1
              return {
                ...orb,
                x: orb.x + (dx / dist) * speed,
                y: orb.y + (dy / dist) * speed,
              }
            }
            return { ...orb, y: orb.y + 0.5 }
          })
          .filter((orb) => orb.y < GAME_HEIGHT + 20)
      )

      // 收集经验球
      setExpOrbs((prev) =>
        prev.filter((orb) => {
          const dx = playerPos.x - orb.x
          const dy = playerPos.y - orb.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < PLAYER_SIZE) {
            gainExp(orb.value)
            return false
          }
          return true
        })
      )

      // 更新游戏时间
      setGameTime((t) => t + 16)

      // 碰撞检测：玩家子弹 vs 敌人
      setBullets((prevBullets) => {
        const remainingBullets: Bullet[] = []

        prevBullets.forEach((bullet) => {
          if (bullet.isEnemy) {
            remainingBullets.push(bullet)
            return
          }

          let hit = false
          // 暴击判定
          const isCrit = Math.random() < critChanceRef.current
          const actualDamage = isCrit ? bullet.damage * 2 : bullet.damage

          setEnemies((prevEnemies) => {
            return prevEnemies
              .map((enemy) => {
                const dx = bullet.x - enemy.x
                const dy = bullet.y - enemy.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                const hitRadius = enemy.type === 'boss' ? 40 : ENEMY_SIZE

                if (dist < hitRadius && !hit) {
                  hit = true
                  const newHp = enemy.hp - actualDamage

                  // 吸血效果
                  if (lifeStealRef.current > 0) {
                    setPlayerHp((hp) =>
                      Math.min(playerMaxHp, hp + actualDamage * lifeStealRef.current)
                    )
                  }

                  if (newHp <= 0) {
                    // 敌人死亡
                    addCombo()
                    const comboBonus = 1 + comboRef.current * 0.1
                    const points = Math.floor(
                      (enemy.type === 'boss'
                        ? 100
                        : enemy.type === 'tank'
                        ? 30
                        : enemy.type === 'fast'
                        ? 15
                        : enemy.type === 'shooter'
                        ? 20
                        : 10) * comboBonus
                    )
                    setScore((s) => s + points)
                    setKills((k) => {
                      const newKills = k + 1
                      // 每杀10个敌人升一波
                      if (newKills % 10 === 0) {
                        setWave((w) => w + 1)
                        toast.success(`🌊 第 ${waveRef.current + 1} 波！`)
                      }
                      return newKills
                    })
                    spawnPowerUp(enemy.x, enemy.y)
                    addExpOrb(
                      enemy.x,
                      enemy.y,
                      enemy.type === 'boss' ? 50 : enemy.type === 'tank' ? 20 : 10
                    )
                    addParticle(
                      enemy.x,
                      enemy.y,
                      enemy.type === 'boss' ? '💥' : isCrit ? '💫' : '✨',
                      enemy.type === 'boss'
                    )
                    return null
                  }

                  addParticle(enemy.x, enemy.y, isCrit ? '💥' : '💔')
                  return { ...enemy, hp: newHp }
                }
                return enemy
              })
              .filter((e): e is Enemy => e !== null)
          })

          if (!hit) remainingBullets.push(bullet)
        })

        return remainingBullets
      })

      // 碰撞检测：玩家 vs 敌人
      const currentPos = playerPosRef.current
      enemiesRef.current.forEach((enemy) => {
        const dx = currentPos.x - enemy.x
        const dy = currentPos.y - enemy.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const hitRadius = enemy.type === 'boss' ? 50 : ENEMY_SIZE + PLAYER_SIZE / 2

        if (dist < hitRadius) {
          if (hasShield) {
            setHasShield(false)
            addParticle(currentPos.x, currentPos.y, '🛡️')
            setEnemies((prev) => prev.filter((e) => e.id !== enemy.id))
          } else {
            const dmg = enemy.type === 'boss' ? 30 : enemy.type === 'tank' ? 20 : 10
            setPlayerHp((hp) => {
              const newHp = hp - dmg
              if (newHp <= 0) {
                setGameOver(true)
                if (score > highScore) {
                  setHighScore(score)
                  localStorage.setItem('loveSurvivorHighScore', score.toString())
                }
              }
              return Math.max(0, newHp)
            })
            setEnemies((prev) => prev.filter((e) => e.id !== enemy.id))
            addParticle(currentPos.x, currentPos.y, '💢')
          }
        }
      })

      // 碰撞检测：玩家 vs 道具
      setPowerUps((prevPowerUps) => {
        return prevPowerUps.filter((powerUp) => {
          const dx = currentPos.x - powerUp.x
          const dy = currentPos.y - powerUp.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < PLAYER_SIZE / 2 + POWERUP_SIZE / 2) {
            // 获得道具
            switch (powerUp.type) {
              case 'speed':
                setPlayerSpeed((s) => Math.min(10, s + 0.5))
                toast.success('⚡ 速度提升！')
                break
              case 'damage':
                setDamage((d) => d + 5)
                toast.success('💪 攻击力提升！')
                break
              case 'heal':
                setPlayerHp((hp) => Math.min(playerMaxHp, hp + 30))
                toast.success('💚 恢复生命！')
                break
              case 'shield':
                setHasShield(true)
                toast.success('🛡️ 获得护盾！')
                break
              case 'multishot':
                setMultishot((m) => Math.min(5, m + 1))
                toast.success('🎯 多重射击！')
                break
              case 'firerate':
                setFireRate((r) => Math.max(100, r - 30))
                toast.success('🔥 射速提升！')
                break
              case 'magnet':
                setMagnetRange((m) => Math.min(200, m + 30))
                toast.success('🧲 磁吸范围增加！')
                break
              case 'bomb':
                activateBomb()
                break
              case 'life':
                setPlayerMaxHp((hp) => hp + 20)
                setPlayerHp((hp) => hp + 20)
                toast.success('❤️ 最大生命值增加！')
                break
            }
            addParticle(powerUp.x, powerUp.y, '⭐')
            return false
          }
          return true
        })
      })

      // 碰撞检测：敌人子弹 vs 玩家
      if (!invincible) {
        setBullets((prev) =>
          prev.filter((bullet) => {
            if (!bullet.isEnemy) return true
            const dx = currentPos.x - bullet.x
            const dy = currentPos.y - bullet.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < PLAYER_SIZE) {
              if (hasShield) {
                setHasShield(false)
                addParticle(currentPos.x, currentPos.y, '🛡️')
              } else {
                setPlayerHp((hp) => {
                  const newHp = hp - bullet.damage
                  if (newHp <= 0) {
                    setGameOver(true)
                    if (score > highScore) {
                      setHighScore(score)
                      localStorage.setItem('loveSurvivorHighScore', score.toString())
                    }
                  }
                  return Math.max(0, newHp)
                })
                addParticle(currentPos.x, currentPos.y, '💢')
                // 无敌时间
                setInvincible(true)
                setTimeout(() => setInvincible(false), 500)
              }
              return false
            }
            return true
          })
        )
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [
    gameStarted,
    gameOver,
    isPaused,
    playerSpeed,
    fireRate,
    fireBullets,
    spawnEnemy,
    spawnPowerUp,
    addParticle,
    addExpOrb,
    addCombo,
    gainExp,
    activateBomb,
    hasShield,
    invincible,
    magnetRange,
    score,
    highScore,
    playerMaxHp,
    toast,
  ])

  // 渲染游戏
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // 绘制星星背景
    ctx.fillStyle = '#ffffff20'
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % GAME_WIDTH
      const y = (i * 53 + Date.now() * 0.02) % GAME_HEIGHT
      ctx.beginPath()
      ctx.arc(x, y, 1, 0, Math.PI * 2)
      ctx.fill()
    }

    // 绘制道具
    powerUps.forEach((p) => {
      const emoji =
        p.type === 'speed'
          ? '⚡'
          : p.type === 'damage'
          ? '💪'
          : p.type === 'heal'
          ? '💚'
          : p.type === 'shield'
          ? '🛡️'
          : p.type === 'multishot'
          ? '🎯'
          : p.type === 'firerate'
          ? '🔥'
          : p.type === 'magnet'
          ? '🧲'
          : p.type === 'bomb'
          ? '💣'
          : '❤️'
      ctx.font = '20px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      // 道具发光效果
      ctx.shadowColor = '#ffff00'
      ctx.shadowBlur = 10
      ctx.fillText(emoji, p.x, p.y)
      ctx.shadowBlur = 0
    })

    // 绘制经验球
    expOrbs.forEach((orb) => {
      ctx.fillStyle = '#4ade80'
      ctx.beginPath()
      ctx.arc(orb.x, orb.y, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#22c55e'
      ctx.beginPath()
      ctx.arc(orb.x, orb.y, 3, 0, Math.PI * 2)
      ctx.fill()
    })

    // 绘制子弹
    bullets.forEach((b) => {
      ctx.font = '15px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      if (b.isEnemy) {
        ctx.fillStyle = '#ef4444'
        ctx.beginPath()
        ctx.arc(b.x, b.y, 6, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillText('💕', b.x, b.y)
      }
    })

    // 绘制敌人
    enemies.forEach((e) => {
      const emoji =
        e.type === 'boss'
          ? '👾'
          : e.type === 'tank'
          ? '🤖'
          : e.type === 'fast'
          ? '👻'
          : e.type === 'shooter'
          ? '🔫'
          : '💀'
      const size = e.type === 'boss' ? 40 : 25
      ctx.font = `${size}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(emoji, e.x, e.y)

      // 血条
      const barWidth = e.type === 'boss' ? 60 : 30
      const barHeight = 4
      const hpPercent = e.hp / e.maxHp
      ctx.fillStyle = '#333'
      ctx.fillRect(e.x - barWidth / 2, e.y - size / 2 - 8, barWidth, barHeight)
      ctx.fillStyle = hpPercent > 0.5 ? '#4ade80' : hpPercent > 0.25 ? '#fbbf24' : '#ef4444'
      ctx.fillRect(e.x - barWidth / 2, e.y - size / 2 - 8, barWidth * hpPercent, barHeight)
    })

    // 绘制玩家
    const character = PLAYER_CHARACTERS[selectedCharacter]
    ctx.font = '30px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // 无敌闪烁效果
    if (!invincible || Math.floor(Date.now() / 100) % 2 === 0) {
      ctx.fillText(character.emoji, playerPos.x, playerPos.y)
    }

    // 绘制护盾
    if (hasShield) {
      ctx.strokeStyle = '#60a5fa'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(playerPos.x, playerPos.y, PLAYER_SIZE, 0, Math.PI * 2)
      ctx.stroke()
    }

    // 绘制磁吸范围（淡淡的圆）
    if (magnetRange > 50) {
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.2)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(playerPos.x, playerPos.y, magnetRange, 0, Math.PI * 2)
      ctx.stroke()
    }

    // 绘制粒子
    particles.forEach((p) => {
      ctx.globalAlpha = p.life / 30
      ctx.font = `${20 * (p.scale || 1)}px Arial`
      ctx.fillText(p.emoji, p.x, p.y)
    })
    ctx.globalAlpha = 1

    // 绘制连击数
    if (combo > 0) {
      ctx.font = 'bold 24px Arial'
      ctx.fillStyle = combo >= 10 ? '#f59e0b' : '#fff'
      ctx.textAlign = 'center'
      ctx.fillText(`${combo} COMBO!`, GAME_WIDTH / 2, 30)
    }
  }, [
    playerPos,
    enemies,
    bullets,
    powerUps,
    particles,
    expOrbs,
    hasShield,
    invincible,
    magnetRange,
    combo,
    selectedCharacter,
  ])

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <BackButton />

        <div className="card text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">💕 爱心大作战</h1>
          <p className="text-gray-600 mb-4">控制角色，自动发射爱心，消灭敌人！</p>

          {/* 游戏画布 */}
          <div className="relative inline-block">
            <canvas
              ref={canvasRef}
              width={GAME_WIDTH}
              height={GAME_HEIGHT}
              className="border-4 border-pink-300 rounded-xl touch-none"
              style={{ maxWidth: '100%', height: 'auto' }}
              onTouchMove={handleTouchMove}
              onTouchStart={handleTouchMove}
            />

            {/* 开始界面 */}
            {!gameStarted && !showCharacterSelect && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-xl">
                <div className="text-6xl mb-4 animate-bounce">💕</div>
                <h2 className="text-2xl font-bold text-white mb-2">爱心大作战</h2>
                <p className="text-gray-300 mb-4">最高分: {highScore}</p>
                <button
                  onClick={() => setShowCharacterSelect(true)}
                  className="btn-primary text-lg px-8 py-3"
                >
                  🎮 开始游戏
                </button>
                <p className="text-gray-400 text-sm mt-4">⌨️ WASD/方向键移动 | 📱 触摸拖动</p>
              </div>
            )}

            {/* 角色选择界面 */}
            {showCharacterSelect && !gameStarted && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-xl p-4">
                <h2 className="text-2xl font-bold text-white mb-4">选择角色</h2>
                <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                  {PLAYER_CHARACTERS.map((char, index) => (
                    <button
                      key={index}
                      onClick={() => startGame(index)}
                      className="bg-white/10 hover:bg-white/20 rounded-xl p-3 transition-all transform hover:scale-105 border-2 border-transparent hover:border-pink-400"
                    >
                      <div className="text-4xl mb-1">{char.emoji}</div>
                      <div className="text-white font-bold">{char.name}</div>
                      <div className="text-xs text-green-400">
                        {char.bonus === 'hp' && `+${char.bonusValue} 生命`}
                        {char.bonus === 'damage' && `+${char.bonusValue} 攻击`}
                        {char.bonus === 'speed' && `+${char.bonusValue} 速度`}
                        {char.bonus === 'heal' && `+${(char.bonusValue * 100).toFixed(0)}% 吸血`}
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowCharacterSelect(false)}
                  className="mt-4 text-gray-400 hover:text-white"
                >
                  返回
                </button>
              </div>
            )}

            {/* 暂停界面 */}
            {isPaused && gameStarted && !gameOver && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-xl">
                <div className="text-4xl mb-4">⏸️</div>
                <h2 className="text-2xl font-bold text-white mb-4">游戏暂停</h2>
                <button onClick={() => setIsPaused(false)} className="btn-primary">
                  继续游戏
                </button>
              </div>
            )}

            {/* 游戏结束 */}
            {gameOver && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-xl p-4">
                <div className="text-4xl mb-2">💔</div>
                <h2 className="text-2xl font-bold text-white mb-2">游戏结束</h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-center mb-4">
                  <p className="text-pink-300">
                    得分: <span className="font-bold">{score}</span>
                  </p>
                  <p className="text-blue-300">
                    等级: <span className="font-bold">{level}</span>
                  </p>
                  <p className="text-purple-300">
                    波数: <span className="font-bold">{wave}</span>
                  </p>
                  <p className="text-green-300">
                    击杀: <span className="font-bold">{kills}</span>
                  </p>
                  <p className="text-yellow-300">
                    最大连击: <span className="font-bold">{maxCombo}</span>
                  </p>
                  <p className="text-gray-300">
                    时间: <span className="font-bold">{Math.floor(gameTime / 1000)}秒</span>
                  </p>
                </div>
                {score >= highScore && score > 0 && (
                  <p className="text-yellow-400 mb-4 animate-pulse">🎉 新纪录！</p>
                )}
                <button onClick={() => setShowCharacterSelect(true)} className="btn-primary">
                  再来一次
                </button>
              </div>
            )}
          </div>

          {/* 经验条 */}
          {gameStarted && !gameOver && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Lv.{level}</span>
                <span>
                  {exp}/{expToNextLevel} EXP
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${(exp / expToNextLevel) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* 游戏信息 */}
          {gameStarted && !gameOver && (
            <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
              <div className="bg-pink-100 rounded-lg p-2">
                <div className="text-gray-600">生命</div>
                <div className="font-bold text-pink-600">
                  {playerHp}/{playerMaxHp}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-pink-500 h-2 rounded-full transition-all"
                    style={{ width: `${(playerHp / playerMaxHp) * 100}%` }}
                  />
                </div>
              </div>
              <div className="bg-purple-100 rounded-lg p-2">
                <div className="text-gray-600">得分</div>
                <div className="font-bold text-purple-600">{score}</div>
              </div>
              <div className="bg-blue-100 rounded-lg p-2">
                <div className="text-gray-600">波数</div>
                <div className="font-bold text-blue-600">{wave}</div>
              </div>
              <div className="bg-green-100 rounded-lg p-2">
                <div className="text-gray-600">击杀</div>
                <div className="font-bold text-green-600">{kills}</div>
              </div>
            </div>
          )}

          {/* 状态显示 */}
          {gameStarted && !gameOver && (
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
              <span className="bg-yellow-100 px-2 py-1 rounded">⚡ {playerSpeed.toFixed(1)}</span>
              <span className="bg-red-100 px-2 py-1 rounded">💪 {damage}</span>
              <span className="bg-blue-100 px-2 py-1 rounded">🎯 x{multishot}</span>
              <span className="bg-orange-100 px-2 py-1 rounded">
                🔥 {(1000 / fireRate).toFixed(1)}/s
              </span>
              <span className="bg-green-100 px-2 py-1 rounded">🧲 {magnetRange}</span>
              {hasShield && <span className="bg-cyan-100 px-2 py-1 rounded animate-pulse">🛡️</span>}
              {combo > 0 && (
                <span className="bg-amber-100 px-2 py-1 rounded font-bold">{combo}x 连击</span>
              )}
            </div>
          )}

          {/* 操作说明 */}
          <div className="mt-6 text-left bg-gray-50 p-4 rounded-lg text-sm">
            <h3 className="font-bold mb-2">🎮 游戏说明</h3>
            <ul className="space-y-1 text-gray-600">
              <li>⌨️ WASD/方向键移动，ESC暂停</li>
              <li>📱 手机上触摸拖动控制</li>
              <li>💕 自动发射爱心攻击敌人</li>
              <li>🟢 收集绿色经验球升级</li>
              <li>👾 每5波出现Boss，小心红色子弹！</li>
            </ul>
            <h3 className="font-bold mt-3 mb-2">✨ 道具说明</h3>
            <div className="grid grid-cols-3 gap-1 text-gray-600 text-xs">
              <span>⚡ 速度</span>
              <span>💪 攻击</span>
              <span>💚 回血</span>
              <span>🛡️ 护盾</span>
              <span>🎯 多弹</span>
              <span>🔥 射速</span>
              <span>🧲 磁吸</span>
              <span>💣 炸弹</span>
              <span>❤️ 生命</span>
            </div>
            <h3 className="font-bold mt-3 mb-2">👹 敌人类型</h3>
            <div className="grid grid-cols-2 gap-1 text-gray-600 text-xs">
              <span>💀 普通 - 标准敌人</span>
              <span>👻 快速 - 移动很快</span>
              <span>🤖 坦克 - 血量很厚</span>
              <span>🔫 射手 - 会发射子弹</span>
              <span>👾 Boss - 超强敌人</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
