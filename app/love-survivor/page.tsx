'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import BackButton from '../components/BackButton'
import { useToast } from '../components/ToastProvider'

interface Pos { x: number; y: number }

interface Enemy {
  id: number
  x: number; y: number
  hp: number; maxHp: number
  type: 'fighter' | 'bomber' | 'tank' | 'heli' | 'boss'
  speed: number
  shootCooldown?: number
  driftPhase?: number
}

interface Bullet {
  id: number
  x: number; y: number
  vx: number; vy: number
  damage: number
  color: string
  size: number
  isEnemy?: boolean
  weapon?: 'vulcan' | 'laser' | 'missile' | 'spread'
}

interface PowerUp {
  id: number; x: number; y: number
  type: 'vulcan' | 'laser' | 'missile' | 'spread' | 'speed' | 'shield' | 'bomb' | 'life' | 'heal'
}

interface Particle {
  id: number; x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number
  size: number; color: string; kind: 'spark' | 'smoke' | 'explosion'
}

interface Star { x: number; y: number; speed: number; size: number }

// ── Game Config ──────────────────────────────────────────────
const W = 420, H = 640
const PLAYER_SIZE = 28

const WEAPONS = {
  vulcan:  { name: '机枪', color: '#fde047', fireRate: 180, count: 1 },
  spread:  { name: '散弹', color: '#60a5fa', fireRate: 250, count: 3 },
  laser:   { name: '激光', color: '#f87171', fireRate: 90,  count: 1 },
  missile: { name: '导弹', color: '#fb923c', fireRate: 600, count: 2 },
} as const
type WeaponType = keyof typeof WEAPONS

export default function ThunderFighterPage() {
  const toast = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const keysRef = useRef<Set<string>>(new Set())

  // Game state
  const [started, setStarted] = useState(false)
  const [over, setOver] = useState(false)
  const [paused, setPaused] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [wave, setWave] = useState(1)
  const [kills, setKills] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [bombs, setBombs] = useState(3)

  // Player state
  const [pos, setPos] = useState<Pos>({ x: W / 2, y: H - 80 })
  const [hp, setHp] = useState(100)
  const [maxHp, setMaxHp] = useState(100)
  const [weapon, setWeapon] = useState<WeaponType>('vulcan')
  const [weaponLv, setWeaponLv] = useState(1)
  const [speed, setSpeed] = useState(5)
  const [shield, setShield] = useState(false)
  const [invincible, setInvincible] = useState(false)

  // World objects
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [bullets, setBullets] = useState<Bullet[]>([])
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const starsRef = useRef<Star[]>([])

  // Refs for game loop
  const posRef = useRef(pos)
  const enemiesRef = useRef(enemies)
  const weaponRef = useRef(weapon)
  const weaponLvRef = useRef(weaponLv)
  const waveRef = useRef(wave)
  const comboRef = useRef(combo)
  const lastFireRef = useRef(0)
  const lastSpawnRef = useRef(0)
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { posRef.current = pos }, [pos])
  useEffect(() => { enemiesRef.current = enemies }, [enemies])
  useEffect(() => { weaponRef.current = weapon }, [weapon])
  useEffect(() => { weaponLvRef.current = weaponLv }, [weaponLv])
  useEffect(() => { waveRef.current = wave }, [wave])
  useEffect(() => { comboRef.current = combo }, [combo])

  // Initialize starfield
  useEffect(() => {
    starsRef.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      speed: 0.5 + Math.random() * 3,
      size: Math.random() < 0.3 ? 2 : 1,
    }))
    const saved = localStorage.getItem('thunderHighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase())
      if (e.key === 'Escape') setPaused(p => !p)
      if ((e.key === 'b' || e.key === 'B') && started && !over && bombs > 0) useBomb()
    }
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase())
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [started, over, bombs])

  // Touch control
  const handleTouch = useCallback((e: React.TouchEvent) => {
    if (!started || over || paused) return
    const t = e.touches[0]
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((t.clientX - rect.left) / rect.width) * W
    const y = ((t.clientY - rect.top) / rect.height) * H
    setPos({
      x: Math.max(PLAYER_SIZE / 2, Math.min(W - PLAYER_SIZE / 2, x)),
      y: Math.max(PLAYER_SIZE / 2, Math.min(H - PLAYER_SIZE / 2, y)),
    })
  }, [started, over, paused])

  // ── Start / Restart ──
  const startGame = () => {
    setStarted(true); setOver(false); setPaused(false)
    setScore(0); setWave(1); setKills(0); setCombo(0); setMaxCombo(0); setBombs(3)
    setPos({ x: W / 2, y: H - 80 })
    setHp(100); setMaxHp(100)
    setWeapon('vulcan'); setWeaponLv(1)
    setSpeed(5); setShield(false); setInvincible(false)
    setEnemies([]); setBullets([]); setPowerUps([]); setParticles([])
  }

  // ── Effects ──
  const spawnExplosion = useCallback((x: number, y: number, big = false) => {
    const count = big ? 24 : 12
    const parts: Particle[] = []
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2
      const sp = 1 + Math.random() * (big ? 5 : 3)
      parts.push({
        id: Date.now() + Math.random(),
        x, y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: big ? 40 : 25,
        maxLife: big ? 40 : 25,
        size: big ? 4 + Math.random() * 4 : 2 + Math.random() * 3,
        color: ['#fbbf24', '#f97316', '#ef4444', '#fde047'][Math.floor(Math.random() * 4)],
        kind: 'explosion',
      })
    }
    setParticles(prev => [...prev, ...parts])
  }, [])

  const spawnSmoke = useCallback((x: number, y: number) => {
    setParticles(prev => [...prev, {
      id: Date.now() + Math.random(), x, y,
      vx: (Math.random() - 0.5) * 0.5, vy: 1 + Math.random(),
      life: 20, maxLife: 20, size: 4, color: '#64748b', kind: 'smoke',
    }])
  }, [])

  const addCombo = useCallback(() => {
    setCombo(c => {
      const n = c + 1
      if (n > maxCombo) setMaxCombo(n)
      return n
    })
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current)
    comboTimerRef.current = setTimeout(() => setCombo(0), 2500)
  }, [maxCombo])

  const useBomb = useCallback(() => {
    if (bombs <= 0) return
    setBombs(b => b - 1)
    enemiesRef.current.forEach(e => {
      spawnExplosion(e.x, e.y, e.type === 'boss')
      setScore(s => s + (e.type === 'boss' ? 100 : 20))
      setKills(k => k + 1)
    })
    setEnemies([])
    setBullets(prev => prev.filter(b => !b.isEnemy))
    toast.warning('💣 核弹引爆！')
  }, [bombs, spawnExplosion, toast])

  // ── Enemy Spawning ──
  const spawnEnemy = useCallback(() => {
    const w = waveRef.current

    // Boss every 5 waves
    if (w % 5 === 0 && enemiesRef.current.filter(e => e.type === 'boss').length === 0) {
      setEnemies(prev => [...prev, {
        id: Date.now(), x: W / 2, y: -60,
        hp: 200 + w * 30, maxHp: 200 + w * 30,
        type: 'boss', speed: 0.3,
        shootCooldown: 0, driftPhase: 0,
      }])
      toast.error('⚠️ 巨型战舰接近！')
      return
    }

    // Formation-based spawning (more like Raiden)
    const r = Math.random()
    let type: Enemy['type']
    if (w >= 3 && r < 0.2) type = 'heli'
    else if (r < 0.35) type = 'tank'
    else if (r < 0.55) type = 'bomber'
    else type = 'fighter'

    // Formation: sometimes spawn 3 fighters in a row
    if (type === 'fighter' && Math.random() < 0.4) {
      const startX = 60 + Math.random() * (W - 120)
      for (let i = 0; i < 3; i++) {
        setEnemies(prev => [...prev, {
          id: Date.now() + i + Math.random(),
          x: startX + i * 45,
          y: -40 - i * 30,
          hp: 15 + w * 2, maxHp: 15 + w * 2,
          type: 'fighter',
          speed: 2 + w * 0.1,
          driftPhase: Math.random() * Math.PI * 2,
        }])
      }
      return
    }

    setEnemies(prev => [...prev, {
      id: Date.now() + Math.random(),
      x: 40 + Math.random() * (W - 80),
      y: -40,
      hp: type === 'tank' ? 40 + w * 5 : type === 'heli' ? 30 + w * 3 : type === 'bomber' ? 25 + w * 2 : 15 + w * 2,
      maxHp: type === 'tank' ? 40 + w * 5 : type === 'heli' ? 30 + w * 3 : type === 'bomber' ? 25 + w * 2 : 15 + w * 2,
      type,
      speed: type === 'tank' ? 0.8 : type === 'heli' ? 1 : type === 'bomber' ? 1.2 : 2 + w * 0.08,
      shootCooldown: (type === 'heli' || type === 'bomber') ? 0 : undefined,
      driftPhase: Math.random() * Math.PI * 2,
    }])
  }, [toast])

  // ── Power-up Spawn ──
  const maybeSpawnPowerUp = useCallback((x: number, y: number) => {
    if (Math.random() > 0.18) return
    const r = Math.random()
    let type: PowerUp['type']
    if (r < 0.04) type = 'bomb'
    else if (r < 0.08) type = 'life'
    else if (r < 0.14) type = 'shield'
    else if (r < 0.25) type = 'heal'
    else if (r < 0.45) type = 'speed'
    else {
      const ws: PowerUp['type'][] = ['vulcan', 'spread', 'laser', 'missile']
      type = ws[Math.floor(Math.random() * 4)]
    }
    setPowerUps(prev => [...prev, { id: Date.now() + Math.random(), x, y, type }])
  }, [])

  // ── Fire Weapons ──
  const fireWeapon = useCallback(() => {
    const p = posRef.current
    const w = weaponRef.current
    const lv = weaponLvRef.current
    const conf = WEAPONS[w]
    const bullets: Bullet[] = []

    if (w === 'vulcan') {
      // Straight rapid fire, scales with level
      const count = Math.min(lv, 3)
      for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * 6
        bullets.push({
          id: Date.now() + Math.random() + i,
          x: p.x + offset, y: p.y - PLAYER_SIZE / 2,
          vx: 0, vy: -12,
          damage: 10 + lv * 2,
          color: conf.color, size: 3, weapon: 'vulcan',
        })
      }
    } else if (w === 'spread') {
      const count = 2 + lv
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (i - (count - 1) / 2) * 0.22
        bullets.push({
          id: Date.now() + Math.random() + i,
          x: p.x, y: p.y - PLAYER_SIZE / 2,
          vx: Math.cos(angle) * 9,
          vy: Math.sin(angle) * 9,
          damage: 8 + lv,
          color: conf.color, size: 4, weapon: 'spread',
        })
      }
    } else if (w === 'laser') {
      // Thick fast piercing beam
      bullets.push({
        id: Date.now() + Math.random(),
        x: p.x, y: p.y - PLAYER_SIZE / 2,
        vx: 0, vy: -18,
        damage: 6 + lv * 2,
        color: conf.color, size: 5 + lv, weapon: 'laser',
      })
    } else if (w === 'missile') {
      // 2-4 homing missiles
      const count = Math.min(2 + Math.floor(lv / 2), 4)
      for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * 12
        bullets.push({
          id: Date.now() + Math.random() + i,
          x: p.x + offset, y: p.y,
          vx: (i % 2 === 0 ? -1 : 1) * 2,
          vy: -6,
          damage: 20 + lv * 5,
          color: conf.color, size: 5, weapon: 'missile',
        })
      }
    }
    setBullets(prev => [...prev, ...bullets])
  }, [])

  // ── Main Game Loop ──
  useEffect(() => {
    if (!started || over || paused) return

    const loop = () => {
      const now = Date.now()
      const keys = keysRef.current

      // Player movement
      setPos(prev => {
        let x = prev.x, y = prev.y
        if (keys.has('arrowleft') || keys.has('a')) x -= speed
        if (keys.has('arrowright') || keys.has('d')) x += speed
        if (keys.has('arrowup') || keys.has('w')) y -= speed
        if (keys.has('arrowdown') || keys.has('s')) y += speed
        return {
          x: Math.max(PLAYER_SIZE / 2, Math.min(W - PLAYER_SIZE / 2, x)),
          y: Math.max(PLAYER_SIZE / 2, Math.min(H - PLAYER_SIZE / 2, y)),
        }
      })

      // Auto-fire
      const fireRate = WEAPONS[weaponRef.current].fireRate
      if (now - lastFireRef.current > fireRate) {
        fireWeapon()
        lastFireRef.current = now
      }

      // Spawn enemies
      const spawnInt = Math.max(400, 1400 - waveRef.current * 80)
      if (now - lastSpawnRef.current > spawnInt) {
        spawnEnemy()
        lastSpawnRef.current = now
      }

      // Update bullets (including missile homing)
      setBullets(prev => prev.map(b => {
        if (b.weapon === 'missile' && !b.isEnemy) {
          // Seek nearest enemy
          let tgt: Enemy | null = null, best = Infinity
          enemiesRef.current.forEach(e => {
            const d = Math.hypot(e.x - b.x, e.y - b.y)
            if (d < best) { best = d; tgt = e }
          })
          if (tgt && best < 300) {
            const t = tgt as Enemy
            const ang = Math.atan2(t.y - b.y, t.x - b.x)
            b.vx = b.vx * 0.9 + Math.cos(ang) * 9 * 0.1
            b.vy = b.vy * 0.9 + Math.sin(ang) * 9 * 0.1
          }
          spawnSmoke(b.x, b.y)
        }
        return { ...b, x: b.x + b.vx, y: b.y + b.vy }
      }).filter(b => b.y > -30 && b.y < H + 30 && b.x > -30 && b.x < W + 30))

      // Update enemies
      setEnemies(prev => prev.map(e => {
        const phase = (e.driftPhase || 0) + 0.03
        const driftX = e.type === 'fighter' ? Math.sin(phase) * 1.2 : 0
        const newX = e.x + driftX
        const newY = e.y + e.speed

        let shootCD = e.shootCooldown
        if (shootCD !== undefined && newY > 30) {
          shootCD += 16
          const interval = e.type === 'boss' ? 700 : e.type === 'heli' ? 1500 : 2400
          if (shootCD > interval) {
            shootCD = 0
            const pp = posRef.current
            const ang = Math.atan2(pp.y - newY, pp.x - newX)
            if (e.type === 'boss') {
              // Boss: 3-way spread
              for (let i = -1; i <= 1; i++) {
                const a = ang + i * 0.25
                setBullets(bs => [...bs, {
                  id: Date.now() + Math.random() + i,
                  x: newX, y: newY,
                  vx: Math.cos(a) * 5, vy: Math.sin(a) * 5,
                  damage: 15, color: '#ef4444', size: 5, isEnemy: true,
                }])
              }
            } else {
              setBullets(bs => [...bs, {
                id: Date.now() + Math.random(),
                x: newX, y: newY,
                vx: Math.cos(ang) * 4.5, vy: Math.sin(ang) * 4.5,
                damage: 12, color: '#ef4444', size: 4, isEnemy: true,
              }])
            }
          }
        }

        return { ...e, x: newX, y: newY, driftPhase: phase, shootCooldown: shootCD }
      }).filter(e => e.y < H + 40))

      // Update particles
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.vx, y: p.y + p.vy,
        vx: p.vx * 0.95, vy: p.vy * 0.95 + (p.kind === 'smoke' ? -0.05 : 0),
        life: p.life - 1,
      })).filter(p => p.life > 0))

      // Update power-ups (drift down)
      setPowerUps(prev => prev.map(p => ({ ...p, y: p.y + 1.3 })).filter(p => p.y < H + 20))

      // Collision: player bullets vs enemies
      setBullets(prevBullets => {
        const remain: Bullet[] = []
        prevBullets.forEach(b => {
          if (b.isEnemy) { remain.push(b); return }
          let hit = false
          setEnemies(prevEn => prevEn.map(e => {
            if (hit) return e
            const hitR = e.type === 'boss' ? 45 : e.type === 'tank' ? 22 : 18
            if (Math.hypot(b.x - e.x, b.y - e.y) < hitR) {
              // Laser pierces
              if (b.weapon !== 'laser') hit = true
              const newHp = e.hp - b.damage
              if (newHp <= 0) {
                addCombo()
                const comboMul = 1 + comboRef.current * 0.05
                const pts = Math.floor((e.type === 'boss' ? 200 : e.type === 'tank' ? 40 : e.type === 'heli' ? 30 : e.type === 'bomber' ? 25 : 15) * comboMul)
                setScore(s => s + pts)
                setKills(k => {
                  const nk = k + 1
                  if (nk % 10 === 0) {
                    setWave(w => w + 1)
                    toast.success(`🌊 第 ${waveRef.current + 1} 波`)
                  }
                  return nk
                })
                spawnExplosion(e.x, e.y, e.type === 'boss' || e.type === 'tank')
                maybeSpawnPowerUp(e.x, e.y)
                return null as any
              }
              spawnExplosion(e.x, e.y, false)
              return { ...e, hp: newHp }
            }
            return e
          }).filter(Boolean) as Enemy[])
          if (!hit) remain.push(b)
        })
        return remain
      })

      // Collision: player vs enemies
      const p = posRef.current
      if (!invincible) {
        enemiesRef.current.forEach(e => {
          const hitR = e.type === 'boss' ? 50 : 22
          if (Math.hypot(p.x - e.x, p.y - e.y) < hitR) {
            if (shield) {
              setShield(false)
              spawnExplosion(p.x, p.y, false)
              setEnemies(prev => prev.filter(x => x.id !== e.id))
            } else {
              const dmg = e.type === 'boss' ? 35 : e.type === 'tank' ? 25 : 15
              setHp(h => {
                const nh = h - dmg
                if (nh <= 0) {
                  setOver(true)
                  if (score > highScore) {
                    setHighScore(score)
                    localStorage.setItem('thunderHighScore', score.toString())
                  }
                }
                return Math.max(0, nh)
              })
              setEnemies(prev => prev.filter(x => x.id !== e.id))
              spawnExplosion(p.x, p.y, true)
              setInvincible(true)
              setTimeout(() => setInvincible(false), 800)
            }
          }
        })
      }

      // Collision: enemy bullets vs player
      if (!invincible) {
        setBullets(prev => prev.filter(b => {
          if (!b.isEnemy) return true
          if (Math.hypot(p.x - b.x, p.y - b.y) < PLAYER_SIZE / 2 + b.size) {
            if (shield) {
              setShield(false)
              spawnExplosion(p.x, p.y, false)
            } else {
              setHp(h => {
                const nh = h - b.damage
                if (nh <= 0) {
                  setOver(true)
                  if (score > highScore) {
                    setHighScore(score)
                    localStorage.setItem('thunderHighScore', score.toString())
                  }
                }
                return Math.max(0, nh)
              })
              spawnExplosion(p.x, p.y, false)
              setInvincible(true)
              setTimeout(() => setInvincible(false), 600)
            }
            return false
          }
          return true
        }))
      }

      // Collect power-ups
      setPowerUps(prev => prev.filter(pu => {
        if (Math.hypot(p.x - pu.x, p.y - pu.y) < PLAYER_SIZE) {
          applyPowerUp(pu.type)
          return false
        }
        return true
      }))

      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [started, over, paused, speed, shield, invincible, fireWeapon, spawnEnemy, maybeSpawnPowerUp, spawnExplosion, spawnSmoke, addCombo, score, highScore, toast]) // eslint-disable-line react-hooks/exhaustive-deps

  const applyPowerUp = (type: PowerUp['type']) => {
    switch (type) {
      case 'vulcan':
      case 'spread':
      case 'laser':
      case 'missile':
        if (weaponRef.current === type) {
          setWeaponLv(l => Math.min(5, l + 1))
          toast.success(`🔼 ${WEAPONS[type].name} 升级`)
        } else {
          setWeapon(type); setWeaponLv(1)
          toast.success(`🔫 切换至 ${WEAPONS[type].name}`)
        }
        break
      case 'speed':    setSpeed(s => Math.min(9, s + 0.8)); toast.success('⚡ 速度+'); break
      case 'shield':   setShield(true); toast.success('🛡️ 能量护盾'); break
      case 'heal':     setHp(h => Math.min(maxHp, h + 30)); toast.success('💉 修复'); break
      case 'bomb':     setBombs(b => Math.min(9, b + 1)); toast.success('💣 +1 核弹'); break
      case 'life':     setMaxHp(m => m + 25); setHp(h => h + 25); toast.success('❤️ 最大生命+'); break
    }
  }

  // ── Canvas Rendering ─────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Dark space gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
    bgGrad.addColorStop(0, '#0a0e27')
    bgGrad.addColorStop(0.5, '#1a1f3a')
    bgGrad.addColorStop(1, '#0f1628')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // Parallax starfield
    if (started && !paused && !over) {
      starsRef.current.forEach(s => {
        s.y += s.speed
        if (s.y > H) { s.y = 0; s.x = Math.random() * W }
      })
    }
    starsRef.current.forEach(s => {
      ctx.fillStyle = s.speed > 2 ? '#ffffff' : s.speed > 1 ? '#a5b4fc' : '#6366f1'
      ctx.fillRect(s.x, s.y, s.size, s.size + s.speed * 0.5)
    })

    // Power-ups (classic capsule design)
    powerUps.forEach(p => {
      const colors: Record<string, [string, string, string]> = {
        vulcan:  ['#fde047', '#eab308', 'V'],
        spread:  ['#60a5fa', '#2563eb', 'S'],
        laser:   ['#f87171', '#dc2626', 'L'],
        missile: ['#fb923c', '#ea580c', 'M'],
        speed:   ['#a78bfa', '#7c3aed', '⚡'],
        shield:  ['#22d3ee', '#0891b2', '🛡'],
        heal:    ['#4ade80', '#16a34a', '+'],
        bomb:    ['#f43f5e', '#be123c', 'B'],
        life:    ['#ec4899', '#be185d', '♥'],
      }
      const [bg, border, label] = colors[p.type]
      ctx.fillStyle = bg
      ctx.strokeStyle = border
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px monospace'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(label, p.x, p.y)
    })

    // Bullets
    bullets.forEach(b => {
      if (b.isEnemy) {
        ctx.fillStyle = '#fca5a5'
        ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 8
        ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0
      } else if (b.weapon === 'laser') {
        // Bright laser beam with glow
        ctx.shadowColor = b.color; ctx.shadowBlur = 12
        ctx.fillStyle = b.color
        ctx.fillRect(b.x - b.size / 2, b.y - 10, b.size, 20)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(b.x - 1, b.y - 10, 2, 20)
        ctx.shadowBlur = 0
      } else if (b.weapon === 'missile') {
        ctx.fillStyle = b.color
        ctx.shadowColor = b.color; ctx.shadowBlur = 8
        ctx.beginPath()
        const ang = Math.atan2(b.vy, b.vx)
        ctx.translate(b.x, b.y); ctx.rotate(ang + Math.PI / 2)
        ctx.fillRect(-3, -8, 6, 14)
        ctx.rotate(-ang - Math.PI / 2); ctx.translate(-b.x, -b.y)
        ctx.shadowBlur = 0
      } else {
        // Vulcan / spread - bright tracer
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = b.color; ctx.shadowBlur = 8
        ctx.fillRect(b.x - b.size / 2, b.y - 4, b.size, 8)
        ctx.fillStyle = b.color
        ctx.fillRect(b.x - b.size / 2, b.y - 2, b.size, 4)
        ctx.shadowBlur = 0
      }
    })

    // Enemies
    enemies.forEach(e => {
      const emoji = e.type === 'boss' ? '🛸' : e.type === 'tank' ? '🚜' : e.type === 'heli' ? '🚁' : e.type === 'bomber' ? '🛩️' : '⚔️'
      const size = e.type === 'boss' ? 48 : e.type === 'tank' ? 32 : 28
      ctx.font = `${size}px Arial`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      // Flash red if low HP
      const lowHp = e.hp / e.maxHp < 0.3
      if (lowHp && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 10
      }
      ctx.fillText(emoji, e.x, e.y)
      ctx.shadowBlur = 0

      // HP bar
      const bw = e.type === 'boss' ? 80 : 34
      const hpp = e.hp / e.maxHp
      ctx.fillStyle = '#00000080'
      ctx.fillRect(e.x - bw / 2 - 1, e.y - size / 2 - 7, bw + 2, 5)
      ctx.fillStyle = hpp > 0.5 ? '#4ade80' : hpp > 0.25 ? '#fbbf24' : '#ef4444'
      ctx.fillRect(e.x - bw / 2, e.y - size / 2 - 6, bw * hpp, 3)
    })

    // Particles
    particles.forEach(p => {
      const a = p.life / p.maxLife
      ctx.globalAlpha = a
      if (p.kind === 'smoke') {
        ctx.fillStyle = p.color
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 + (1 - a) * 0.8), 0, Math.PI * 2); ctx.fill()
      } else {
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color; ctx.shadowBlur = 6
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0
      }
    })
    ctx.globalAlpha = 1

    // Player
    if (!invincible || Math.floor(Date.now() / 80) % 2 === 0) {
      // Jet body
      ctx.save()
      ctx.translate(pos.x, pos.y)

      // Engine trail
      ctx.fillStyle = '#60a5fa'
      ctx.shadowColor = '#60a5fa'; ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.moveTo(-4, 10); ctx.lineTo(0, 22 + Math.random() * 6); ctx.lineTo(4, 10); ctx.closePath()
      ctx.fill()
      ctx.shadowBlur = 0

      // Body (metallic gradient fighter shape)
      ctx.font = '28px Arial'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('✈️', 0, 0)

      ctx.restore()

      // Shield ring
      if (shield) {
        ctx.strokeStyle = '#22d3ee'
        ctx.lineWidth = 2
        ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 10
        ctx.beginPath(); ctx.arc(pos.x, pos.y, PLAYER_SIZE, 0, Math.PI * 2); ctx.stroke()
        ctx.shadowBlur = 0
      }
    }

    // HUD: Combo counter
    if (combo > 2) {
      ctx.font = `bold ${20 + Math.min(combo, 20)}px "Courier New", monospace`
      ctx.textAlign = 'center'
      ctx.fillStyle = combo >= 15 ? '#fde047' : combo >= 8 ? '#fb923c' : '#ffffff'
      ctx.shadowColor = '#000'; ctx.shadowBlur = 4
      ctx.fillText(`x${combo}`, W / 2, 40)
      ctx.shadowBlur = 0
    }
  }, [pos, enemies, bullets, powerUps, particles, shield, invincible, combo, started, paused, over])

  const weaponConfig = WEAPONS[weapon]

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'linear-gradient(180deg, #0a0e27 0%, #1a1f3a 100%)' }}>
      <div className="max-w-lg mx-auto">
        <BackButton className="bg-white/10 text-white hover:bg-white/20 border-white/20" />

        <div className="rounded-2xl p-4 md:p-6 shadow-2xl" style={{
          background: 'linear-gradient(180deg, rgba(26, 31, 58, 0.95) 0%, rgba(15, 22, 40, 0.95) 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <h1 className="text-3xl md:text-4xl font-black text-center mb-1 tracking-wider"
            style={{ color: '#fde047', textShadow: '0 0 20px rgba(253, 224, 71, 0.5)', fontFamily: 'monospace' }}
          >
            ⚡ 雷霆战机 ⚡
          </h1>
          <p className="text-center text-cyan-300/70 text-xs mb-4 tracking-[0.3em] font-mono">THUNDER FIGHTER</p>

          {/* Canvas */}
          <div className="relative inline-block w-full">
            <canvas
              ref={canvasRef} width={W} height={H}
              className="w-full rounded-lg touch-none"
              style={{ border: '2px solid #334155', boxShadow: '0 0 30px rgba(6, 182, 212, 0.2)' }}
              onTouchMove={handleTouch} onTouchStart={handleTouch}
            />

            {/* Start overlay */}
            {!started && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm">
                <div className="text-7xl mb-4 animate-pulse">✈️</div>
                <h2 className="text-3xl font-black text-yellow-300 mb-2 tracking-widest" style={{ textShadow: '0 0 20px #fde047' }}>雷霆战机</h2>
                <p className="text-cyan-300 text-sm mb-6">最高分: <span className="font-bold text-yellow-200">{highScore}</span></p>
                <button onClick={startGame}
                  className="px-8 py-3 bg-gradient-to-b from-yellow-400 to-orange-500 text-black font-black rounded-lg shadow-lg shadow-yellow-500/40 active:scale-95 transition-all text-lg tracking-wider"
                >▶ 开始任务</button>
                <div className="mt-6 text-gray-400 text-xs font-mono space-y-1 text-center">
                  <p>WASD / 方向键 移动 | B 使用核弹 | ESC 暂停</p>
                  <p>手机: 触摸拖动</p>
                </div>
              </div>
            )}

            {/* Pause */}
            {paused && started && !over && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
                <div className="text-5xl mb-3">⏸</div>
                <h2 className="text-xl font-bold text-white mb-4">暂停中</h2>
                <button onClick={() => setPaused(false)} className="px-6 py-2 bg-cyan-500 text-white rounded-lg font-bold">继续</button>
              </div>
            )}

            {/* Game over */}
            {over && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-lg p-4 backdrop-blur-sm">
                <div className="text-5xl mb-2">💥</div>
                <h2 className="text-2xl font-black text-red-400 mb-4 tracking-widest" style={{ textShadow: '0 0 15px #ef4444' }}>MISSION FAILED</h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-5 font-mono">
                  <p className="text-yellow-300">分数: <span className="font-bold">{score}</span></p>
                  <p className="text-cyan-300">波数: <span className="font-bold">{wave}</span></p>
                  <p className="text-green-300">击落: <span className="font-bold">{kills}</span></p>
                  <p className="text-orange-300">连击: <span className="font-bold">{maxCombo}</span></p>
                </div>
                {score >= highScore && score > 0 && (
                  <p className="text-yellow-300 mb-4 animate-pulse font-bold">🏆 新纪录！</p>
                )}
                <button onClick={startGame}
                  className="px-6 py-2 bg-gradient-to-b from-yellow-400 to-orange-500 text-black rounded-lg font-bold active:scale-95"
                >再次出击</button>
              </div>
            )}
          </div>

          {/* HUD */}
          {started && !over && (
            <>
              <div className="mt-3 grid grid-cols-4 gap-2 text-xs font-mono">
                <div className="bg-black/40 border border-red-500/30 rounded p-2">
                  <div className="text-red-400/70 text-[10px]">HP</div>
                  <div className="font-bold text-red-300">{hp}/{maxHp}</div>
                  <div className="w-full bg-red-900/50 rounded h-1 mt-1">
                    <div className="bg-red-500 h-1 rounded" style={{ width: `${(hp / maxHp) * 100}%` }} />
                  </div>
                </div>
                <div className="bg-black/40 border border-yellow-500/30 rounded p-2">
                  <div className="text-yellow-400/70 text-[10px]">SCORE</div>
                  <div className="font-bold text-yellow-300">{score}</div>
                </div>
                <div className="bg-black/40 border border-cyan-500/30 rounded p-2">
                  <div className="text-cyan-400/70 text-[10px]">WAVE</div>
                  <div className="font-bold text-cyan-300">{wave}</div>
                </div>
                <div className="bg-black/40 border border-orange-500/30 rounded p-2">
                  <div className="text-orange-400/70 text-[10px]">BOMBS</div>
                  <div className="font-bold text-orange-300">×{bombs}</div>
                </div>
              </div>
              <div className="mt-2 flex justify-center items-center gap-2 text-xs font-mono">
                <span className="bg-white/10 px-3 py-1 rounded border border-white/10">
                  🔫 <span style={{ color: weaponConfig.color }}>{weaponConfig.name}</span> Lv.{weaponLv}
                </span>
                <span className="bg-white/10 px-3 py-1 rounded border border-white/10">⚡ {speed.toFixed(1)}</span>
                {shield && <span className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded animate-pulse">🛡️</span>}
                <button onClick={useBomb} disabled={bombs === 0}
                  className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded border border-orange-500/30 font-bold disabled:opacity-30 active:scale-95"
                >💣 核弹 (B)</button>
              </div>
            </>
          )}

          {/* Info */}
          <div className="mt-4 text-xs text-gray-400 space-y-1 font-mono">
            <p className="text-yellow-300 font-bold">武器：</p>
            <p>V 机枪 · S 散弹 · L 激光（穿透）· M 导弹（追踪）</p>
            <p>拾取同类武器升级（Lv 5 封顶）</p>
          </div>
        </div>
      </div>
    </div>
  )
}
