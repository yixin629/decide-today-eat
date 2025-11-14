'use client'

import { useEffect } from 'react'

interface Heart {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  duration: number
}

export default function HeartParticles() {
  useEffect(() => {
    const hearts: Heart[] = []
    let heartId = 0

    const createHeart = (x: number, y: number) => {
      const heart: Heart = {
        id: heartId++,
        x,
        y,
        size: Math.random() * 20 + 10,
        opacity: 1,
        duration: Math.random() * 1000 + 1000,
      }

      hearts.push(heart)

      const heartEl = document.createElement('div')
      heartEl.className = 'heart-particle'
      heartEl.textContent = ['❤️', '💕', '💖', '💗', '💝'][Math.floor(Math.random() * 5)]
      heartEl.style.left = `${x}px`
      heartEl.style.top = `${y}px`
      heartEl.style.fontSize = `${heart.size}px`
      heartEl.style.animation = `float-up ${heart.duration}ms ease-out`

      document.body.appendChild(heartEl)

      setTimeout(() => {
        heartEl.remove()
        const index = hearts.findIndex((h) => h.id === heart.id)
        if (index > -1) hearts.splice(index, 1)
      }, heart.duration)
    }

    const handleClick = (e: MouseEvent) => {
      // 10% 概率触发爱心特效
      if (Math.random() < 0.1) {
        createHeart(e.clientX, e.clientY)
      }
    }

    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [])

  return (
    <style jsx global>{`
      .heart-particle {
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        user-select: none;
      }

      @keyframes float-up {
        0% {
          transform: translateY(0) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(-100px) rotate(20deg);
          opacity: 0;
        }
      }
    `}</style>
  )
}
