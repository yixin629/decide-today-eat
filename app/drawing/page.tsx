'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function DrawingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#ff6b9d')
  const [lineWidth, setLineWidth] = useState(3)
  const [drawings, setDrawings] = useState<any[]>([])
  const [prompt, setPrompt] = useState('')
  const [drawer, setDrawer] = useState('zyx')
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  useEffect(() => {
    loadDrawings()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(t => t + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const loadDrawings = async () => {
    try {
      const { data, error } = await supabase
        .from('drawings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setDrawings(data || [])
    } catch (error) {
      console.error('加载作品失败:', error)
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    if (!isTimerRunning) {
      setIsTimerRunning(true)
    }

    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setTimer(0)
    setIsTimerRunning(false)
  }

  const saveDrawing = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (!prompt.trim()) {
      alert('请输入你画的是什么')
      return
    }

    const imageData = canvas.toDataURL('image/png')

    try {
      const { error } = await supabase
        .from('drawings')
        .insert([{
          image_data: imageData,
          drawer,
          prompt: prompt.trim(),
        }])

      if (error) throw error

      alert('作品已保存！')
      clearCanvas()
      setPrompt('')
      loadDrawings()
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请重试')
    }
  }

  const deleteDrawing = async (id: number) => {
    if (!confirm('确定要删除这幅画吗？')) return

    try {
      const { error } = await supabase
        .from('drawings')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadDrawings()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const colors = ['#ff6b9d', '#c44569', '#ffa502', '#26de81', '#45aaf2', '#a55eea', '#000000']

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-block mb-6 text-white hover:text-primary transition-colors">
          ← 返回首页
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 画板 */}
          <div className="lg:col-span-2 card">
            <h1 className="text-3xl font-bold mb-6">🎨 猜猜我画的</h1>

            {/* 计时器 */}
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-primary">
                ⏱️ {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
              </div>
            </div>

            {/* 画布 */}
            <div className="mb-4 bg-white rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full cursor-crosshair"
              />
            </div>

            {/* 工具栏 */}
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-2">颜色</label>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        color === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  粗细: {lineWidth}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">我画的是...</label>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-primary focus:outline-none"
                    placeholder="例如：爱心"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">画家</label>
                  <select
                    value={drawer}
                    onChange={(e) => setDrawer(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-primary focus:outline-none"
                  >
                    <option value="zyx">zyx</option>
                    <option value="zly">zly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 按钮 */}
            <div className="flex gap-4">
              <button
                onClick={clearCanvas}
                className="flex-1 px-6 py-3 rounded-lg bg-red-500 hover:bg-red-600 transition-colors"
              >
                🗑️ 清空
              </button>
              <button
                onClick={saveDrawing}
                className="flex-1 btn-primary"
              >
                💾 保存作品
              </button>
            </div>
          </div>

          {/* 作品集 */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">🖼️ 作品集</h2>
            <div className="space-y-4 max-h-[800px] overflow-y-auto">
              {drawings.length === 0 ? (
                <p className="text-center text-gray-400 py-8">还没有作品</p>
              ) : (
                drawings.map((drawing) => (
                  <div
                    key={drawing.id}
                    className="p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <img
                      src={drawing.image_data}
                      alt={drawing.prompt}
                      className="w-full rounded mb-2"
                    />
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{drawing.prompt}</div>
                        <div className="text-sm text-gray-400">by {drawing.drawer}</div>
                      </div>
                      <button
                        onClick={() => deleteDrawing(drawing.id)}
                        className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/40 transition-colors text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
