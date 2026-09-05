'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import BackButton from '@/app/components/ui/BackButton'
import PageHeader from '@/app/components/ui/PageHeader'
import { useToast } from '@/app/components/feedback/ToastProvider'
import { useAuth } from '@/hooks/useAuth'
import { createCoupleNotification } from '@/lib/couple-interactions'
import { supabase } from '@/lib/supabase'

type Kind = 'choice' | 'punishment'
type WheelOption = { id: string; label: string; emoji: string; kind: Kind; custom?: boolean; wheelType?: string }
type Preset = { id: string; label: string; icon: string; question: string; color: string; options: WheelOption[] }
const o = (id: string, emoji: string, label: string): WheelOption => ({ id, emoji, label, kind: 'choice' })
const PRESETS: Preset[] = [
  { id:'food', label:'今晚吃什么', icon:'🍜', question:'今晚就吃……', color:'from-orange-400 to-rose-500', options:[o('f1','🍲','火锅'),o('f2','🥩','烤肉'),o('f3','🍣','寿司'),o('f4','🍕','披萨'),o('f5','🍜','米线'),o('f6','🍔','汉堡'),o('f7','🍗','炸鸡'),o('f8','🍳','一起做饭')] },
  { id:'dishes', label:'谁洗碗', icon:'🫧', question:'今天洗碗的是……', color:'from-cyan-400 to-blue-500', options:[o('d1','⭐','zyx'),o('d2','🍐','zly'),o('d3','🫶','一起洗'),o('d4','✊','猜拳决定')] },
  { id:'movie', label:'看什么电影', icon:'🎬', question:'今晚的片单是……', color:'from-violet-500 to-fuchsia-500', options:[o('m1','😂','喜剧'),o('m2','💥','动作'),o('m3','💗','爱情'),o('m4','🧸','动画'),o('m5','🚀','科幻'),o('m6','👻','恐怖')] },
  { id:'weekend', label:'周末去哪', icon:'🗺️', question:'周末目的地是……', color:'from-emerald-400 to-teal-500', options:[o('w1','🏠','宅家做饭'),o('w2','🌳','公园散步'),o('w3','☕','咖啡店'),o('w4','🎦','电影院'),o('w5','🚶','随机散步'),o('w6','🚗','周边一日游')] },
  { id:'apology', label:'谁先道歉', icon:'🤝', question:'先迈出一步的是……', color:'from-pink-400 to-rose-500', options:[o('a1','⭐','zyx先道歉'),o('a2','🍐','zly先道歉'),o('a3','🫂','先抱抱再一起说'),o('a4','💌','各写一句真心话')] },
  { id:'boss', label:'今天听谁的', icon:'👑', question:'今天的决定权属于……', color:'from-amber-400 to-orange-500', options:[o('b1','⭐','听zyx的'),o('b2','🍐','听zly的'),o('b3','🔁','一人决定一件'),o('b4','🎲','再转一次')] },
]

export default function FoodPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [wheelId, setWheelId] = useState('food')
  const [custom, setCustom] = useState<WheelOption[]>([])
  const [draft, setDraft] = useState({ label: '', emoji: '✨', kind: 'choice' as Kind })
  const [result, setResult] = useState<WheelOption | null>(null)
  const [punishment, setPunishment] = useState<WheelOption | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const preset = PRESETS.find((item) => item.id === wheelId) ?? PRESETS[0]

  const loadCustom = useCallback(async () => {
    const { data } = await supabase.from('decision_options').select('id, wheel_type, option_kind, label, emoji').order('created_at')
    setCustom((data ?? []).map((row) => ({ id: String(row.id), label: String(row.label), emoji: String(row.emoji || '✨'), kind: row.option_kind as Kind, custom: true, wheelType: String(row.wheel_type) })))
  }, [])
  useEffect(() => { void loadCustom() }, [loadCustom])
  useEffect(() => { setResult(null); setPunishment(null) }, [wheelId])

  const wheelCustom = custom.filter((item) => item.wheelType === wheelId)
  const choices = useMemo(() => [...preset.options, ...wheelCustom.filter((item) => item.kind === 'choice')], [preset, wheelCustom])
  const punishments = wheelCustom.filter((item) => item.kind === 'punishment')

  const spin = () => {
    if (spinning || !choices.length) return
    setSpinning(true); setResult(null); setPunishment(null)
    const chosen = choices[Math.floor(Math.random() * choices.length)]
    setRotation((value) => value + 1440 + Math.floor(Math.random() * 360))
    window.setTimeout(() => { setResult(chosen); setPunishment(punishments.length ? punishments[Math.floor(Math.random() * punishments.length)] : null); setSpinning(false) }, 1500)
  }
  const add = async () => {
    if (!user || !draft.label.trim()) return
    const { error } = await supabase.from('decision_options').insert({ user_id: user, wheel_type: wheelId, option_kind: draft.kind, label: draft.label.trim(), emoji: draft.emoji.trim() || '✨' })
    if (error) return toast.error('保存失败，请先执行最新数据库迁移')
    setDraft({ ...draft, label: '' }); await loadCustom(); toast.success(draft.kind === 'choice' ? '选项已添加' : '小惩罚已添加')
  }
  const remove = async (id: string) => {
    const { error } = await supabase.from('decision_options').delete().eq('id', id)
    if (!error) { setCustom((items) => items.filter((item) => item.id !== id)); toast.success('已删除') }
  }
  const share = async () => {
    if (!user || !result) return
    try {
      await createCoupleNotification({ actor: user, type: 'wheel', title: `${preset.icon} ${preset.label}有结果了`, message: `${result.emoji} ${result.label}${punishment ? `；附加挑战：${punishment.emoji} ${punishment.label}` : ''}`, link: '/food', metadata: { wheelId, result: result.label } })
      toast.success('结果已经告诉对方啦')
    } catch { toast.error('发送失败，请检查数据库迁移') }
  }

  return <main className="min-h-screen px-4 pb-8 pt-20 sm:px-6"><div className="mx-auto max-w-6xl">
    <BackButton href="/" text="返回首页" />
    <PageHeader title="万能转盘" emoji="🎡" subtitle="吃什么、谁洗碗、去哪玩——难选的都交给一点运气" />
    <div className="mb-6 flex gap-2 overflow-x-auto pb-2" aria-label="选择转盘主题">{PRESETS.map((item) => <button key={item.id} type="button" onClick={() => setWheelId(item.id)} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition ${wheelId === item.id ? 'bg-gray-900 text-white shadow-lg' : 'border border-gray-200 bg-white text-gray-600 hover:border-pink-300'}`}>{item.icon} {item.label}</button>)}</div>
    <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
      <section className="card overflow-hidden !p-0"><div className={`bg-gradient-to-br ${preset.color} px-5 py-8 text-center text-white sm:px-8`}><p className="text-sm font-medium text-white/80">{preset.question}</p><div className="relative mx-auto my-6 h-64 w-64 sm:h-72 sm:w-72"><div className="absolute left-1/2 top-[-8px] z-10 -translate-x-1/2 text-4xl drop-shadow">🔻</div><div className="grid h-full w-full place-items-center rounded-full border-[10px] border-white/90 bg-[conic-gradient(#fda4af_0_45deg,#fde68a_45deg_90deg,#86efac_90deg_135deg,#93c5fd_135deg_180deg,#c4b5fd_180deg_225deg,#f9a8d4_225deg_270deg,#fdba74_270deg_315deg,#67e8f9_315deg)] shadow-2xl transition-transform duration-[1500ms] ease-out" style={{ transform: `rotate(${rotation}deg)` }}><div className="grid h-28 w-28 place-items-center rounded-full border-4 border-white bg-white/95 text-center text-gray-800 shadow-lg"><span><span className="block text-4xl">{spinning ? '✨' : result?.emoji ?? preset.icon}</span><span className="mt-1 block max-w-20 text-xs font-bold">{spinning ? '转动中' : result?.label ?? '准备好'}</span></span></div></div></div><button type="button" onClick={spin} disabled={spinning} className="rounded-full bg-white px-10 py-3.5 text-lg font-black text-gray-900 shadow-xl transition hover:-translate-y-0.5 disabled:opacity-60">{spinning ? '命运正在选择…' : '开始转动'}</button></div>
      {result && <div className="p-5 text-center"><p className="text-sm text-gray-500">本次结果</p><p className="mt-1 text-2xl font-black text-gray-800">{result.emoji} {result.label}</p>{punishment && <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">附加挑战：{punishment.emoji} {punishment.label}</p>}<button type="button" onClick={() => void share()} className="mt-4 rounded-full bg-pink-100 px-5 py-2 text-sm font-bold text-pink-700 hover:bg-pink-200">💌 告诉对方</button></div>}</section>
      <section className="card"><h2 className="text-xl font-bold text-gray-800">这个转盘的内容</h2><p className="mt-1 text-sm text-gray-500">自定义内容会存进两个人共用的数据库。</p><div className="my-5 flex flex-wrap gap-2">{choices.map((item) => <span key={item.id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-2 text-sm text-gray-700">{item.emoji} {item.label}{item.custom && <button type="button" onClick={() => void remove(item.id)} className="ml-1 text-gray-400 hover:text-red-500" aria-label={`删除${item.label}`}>×</button>}</span>)}</div>
      {punishments.length > 0 && <div className="mb-6"><h3 className="mb-2 text-sm font-bold text-amber-800">🎯 随结果抽取的小惩罚</h3><div className="flex flex-wrap gap-2">{punishments.map((item) => <span key={item.id} className="rounded-full bg-amber-50 px-3 py-2 text-sm text-amber-800">{item.emoji} {item.label} <button type="button" onClick={() => void remove(item.id)} aria-label={`删除${item.label}`}>×</button></span>)}</div></div>}
      <div className="rounded-2xl border border-pink-100 bg-pink-50/60 p-4"><h3 className="font-bold text-gray-800">添加自定义内容</h3><div className="mt-3 grid grid-cols-[4.5rem_1fr] gap-2"><input value={draft.emoji} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} aria-label="表情" maxLength={4} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-center text-xl" /><input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') void add() }} placeholder="例如：唱一首歌" className="min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-pink-400" /></div><div className="mt-3 flex flex-wrap items-center gap-2"><button type="button" onClick={() => setDraft({ ...draft, kind: 'choice' })} className={`rounded-full px-3 py-2 text-sm ${draft.kind === 'choice' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'}`}>普通选项</button><button type="button" onClick={() => setDraft({ ...draft, kind: 'punishment' })} className={`rounded-full px-3 py-2 text-sm ${draft.kind === 'punishment' ? 'bg-amber-500 text-white' : 'bg-white text-gray-600'}`}>小惩罚</button><button type="button" onClick={() => void add()} disabled={!draft.label.trim()} className="ml-auto rounded-full bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">添加</button></div></div></section>
    </div>
  </div></main>
}
