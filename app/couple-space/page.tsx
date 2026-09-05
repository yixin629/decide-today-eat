'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import BackButton from '@/app/components/ui/BackButton'
import PageHeader from '@/app/components/ui/PageHeader'
import { useToast } from '@/app/components/feedback/ToastProvider'
import { useAuth } from '@/hooks/useAuth'
import { createCoupleNotification, partnerOf } from '@/lib/couple-interactions'
import { supabase } from '@/lib/supabase'

type Tab = 'growth' | 'pte' | 'gifts'
interface Growth { pair_id: string; pet_name: string; pet_kind: 'cat' | 'dog' | 'rabbit'; experience: number; garden_points: number; last_cared_by: string | null; last_cared_at: string | null }
interface PteStat { user_id: string; total_plans: number; completed_items: number; activity_dates: string[] }
interface Gift { id: string; sender: string; recipient: string; gift_type: string; emoji: string; title: string; message: string; opened_at: string | null; created_at: string }
const names: Record<string, string> = { zyx: '星星', zly: '梨梨' }
const petIcons = { cat: '🐱', dog: '🐶', rabbit: '🐰' }
const cheers = ['今天也在稳稳向前，超棒！', '不用完美，完成今天这一小步就赢啦。', '你认真学习的样子闪闪发光。', '累了就歇一下，我一直给你加油！']
const giftPresets = [{ type:'milk-tea', emoji:'🧋', title:'奶茶兑换券' },{ type:'hug', emoji:'🫂', title:'无限抱抱券' },{ type:'meal', emoji:'🍽️', title:'请吃一顿券' },{ type:'movie', emoji:'🎬', title:'电影选择权' },{ type:'sleep', emoji:'🛌', title:'免做家务券' }]

export default function CoupleSpacePage() {
  const { user } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('growth')
  const [growth, setGrowth] = useState<Growth | null>(null)
  const [stats, setStats] = useState<PteStat[]>([])
  const [gifts, setGifts] = useState<Gift[]>([])
  const [petName, setPetName] = useState('')
  const [giftDraft, setGiftDraft] = useState({ type:'milk-tea', emoji:'🧋', title:'奶茶兑换券', message:'' })

  const load = useCallback(async () => {
    if (!user) return
    const [growthResult, statsResult, giftsResult] = await Promise.all([
      supabase.from('couple_growth').select('*').eq('pair_id', 'zyx-zly').maybeSingle(),
      supabase.rpc('get_pte_companion_stats'),
      supabase.from('couple_gifts').select('*').or(`sender.eq.${user},recipient.eq.${user}`).order('created_at', { ascending: false }).limit(50),
    ])
    if (!growthResult.error && growthResult.data) { setGrowth(growthResult.data as Growth); setPetName(String(growthResult.data.pet_name)) }
    if (!statsResult.error) setStats((statsResult.data ?? []).map((row: Record<string, unknown>) => ({ user_id: String(row.user_id), total_plans: Number(row.total_plans), completed_items: Number(row.completed_items), activity_dates: Array.isArray(row.activity_dates) ? row.activity_dates.map(String) : [] })))
    if (!giftsResult.error) setGifts((giftsResult.data ?? []) as Gift[])
  }, [user])
  useEffect(() => { void load() }, [load])

  const ranked = useMemo(() => ['zyx','zly'].map((id) => {
    const stat = stats.find((item) => item.user_id === id) ?? { user_id:id, total_plans:0, completed_items:0, activity_dates:[] }
    return { ...stat, streak: getStreak(stat.activity_dates), activeDays: new Set(stat.activity_dates).size }
  }).sort((a,b) => b.completed_items - a.completed_items || b.streak - a.streak), [stats])
  const level = Math.floor((growth?.experience ?? 0) / 100) + 1
  const levelProgress = (growth?.experience ?? 0) % 100
  const gardenStage = Math.min(4, Math.floor((growth?.garden_points ?? 0) / 40))
  const gardenViews = ['🪴 · · · ·', '🌱 🌱 · · ·', '🌷 🌱 🌿 · ·', '🌷 🌻 🌿 🌱 ·', '🌳 🌷 🌻 🌿 🪻']

  const care = async (action: string) => {
    if (!user || !growth) return
    const next = { experience: growth.experience + 10, garden_points: growth.garden_points + 5, last_cared_by: user, last_cared_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    const { data, error } = await supabase.from('couple_growth').update(next).eq('pair_id', growth.pair_id).select().single()
    if (error) return toast.error('互动失败，请先执行最新数据库迁移')
    setGrowth(data as Growth); toast.success(`${action}成功，共同花园长大了一点`)
    try { await createCoupleNotification({ actor:user, type:'growth', title:'我们的花园长大啦', message:`刚刚${action}了${growth.pet_name}，共同经验 +10`, link:'/couple-space' }) } catch { /* 成长成功不回滚 */ }
  }
  const savePet = async () => {
    if (!growth || !petName.trim()) return
    const { data, error } = await supabase.from('couple_growth').update({ pet_name:petName.trim(), updated_at:new Date().toISOString() }).eq('pair_id', growth.pair_id).select().single()
    if (!error) { setGrowth(data as Growth); toast.success('宠物名字保存好了') }
  }
  const changePet = async (kind: Growth['pet_kind']) => {
    if (!growth) return
    const { data, error } = await supabase.from('couple_growth').update({ pet_kind:kind, updated_at:new Date().toISOString() }).eq('pair_id', growth.pair_id).select().single()
    if (!error) setGrowth(data as Growth)
  }
  const cheer = async (message: string) => {
    if (!user) return
    try { await createCoupleNotification({ actor:user, type:'pte_cheer', title:'收到一张 PTE 加油卡', message, link:'/couple-space', metadata:{ privateScores:true } }); toast.success('加油卡已经送到对方手里') } catch { toast.error('发送失败，请检查数据库迁移') }
  }
  const chooseGift = (type: string) => {
    const preset = giftPresets.find((item) => item.type === type)
    if (preset) setGiftDraft({ ...giftDraft, ...preset })
    else setGiftDraft({ ...giftDraft, type: 'custom', emoji: '✨', title: '' })
  }
  const sendGift = async (event: FormEvent) => {
    event.preventDefault(); if (!user || !giftDraft.title.trim()) return
    const recipient = partnerOf(user)
    const { data, error } = await supabase.from('couple_gifts').insert({ sender:user, recipient, gift_type:giftDraft.type, emoji:giftDraft.emoji, title:giftDraft.title.trim(), message:giftDraft.message.trim() }).select().single()
    if (error) return toast.error('礼物发送失败，请先执行最新数据库迁移')
    setGifts((current) => [data as Gift, ...current]); setGiftDraft({ ...giftDraft, message:'' }); toast.success('礼物已经送出')
    try { await createCoupleNotification({ actor:user, type:'gift', title:`收到礼物：${giftDraft.title}`, message:giftDraft.message.trim() || '快来拆开看看吧！', link:'/couple-space' }) } catch { /* 礼物已送达 */ }
  }
  const openGift = async (gift: Gift) => {
    if (gift.opened_at || gift.recipient !== user) return
    const openedAt = new Date().toISOString(); setGifts((current) => current.map((item) => item.id === gift.id ? { ...item, opened_at:openedAt } : item)); await supabase.from('couple_gifts').update({ opened_at:openedAt }).eq('id', gift.id)
  }

  return <main className="min-h-screen px-4 pb-8 pt-20 sm:px-6"><div className="mx-auto max-w-6xl"><BackButton href="/" text="返回首页" /><PageHeader title="双人陪伴空间" emoji="💞" subtitle="一起养成、互相打气，也把小礼物留给彼此" />
    <div className="mx-auto mb-7 grid max-w-2xl grid-cols-3 rounded-2xl border border-pink-100 bg-white p-1.5 shadow-sm">{([{ id:'growth', label:'共同养成', icon:'🌱' },{ id:'pte', label:'PTE 陪伴', icon:'🎓' },{ id:'gifts', label:'礼物箱', icon:'🎁' }] as { id:Tab; label:string; icon:string }[]).map((item) => <button type="button" key={item.id} onClick={() => setTab(item.id)} className={`rounded-xl px-2 py-3 text-sm font-bold transition ${tab === item.id ? 'bg-gray-900 text-white shadow' : 'text-gray-500 hover:bg-pink-50'}`}>{item.icon} <span className="hidden sm:inline">{item.label}</span></button>)}</div>

    {tab === 'growth' && <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]"><section className="card overflow-hidden !p-0"><div className="bg-gradient-to-b from-sky-100 via-emerald-50 to-amber-100 p-8 text-center"><p className="text-sm font-bold text-emerald-700">我们的爱心花园 · Lv.{level}</p><div className="my-7 text-8xl drop-shadow-md">{growth ? petIcons[growth.pet_kind] : '🐾'}</div><h2 className="text-2xl font-black text-gray-800">{growth?.pet_name ?? '团团'}</h2><p className="mt-2 text-3xl tracking-widest" aria-label={`花园成长阶段 ${gardenStage + 1}`}>{gardenViews[gardenStage]}</p><div className="mx-auto mt-6 max-w-md"><div className="mb-1 flex justify-between text-xs text-gray-500"><span>本级经验</span><span>{levelProgress}/100</span></div><div className="h-3 overflow-hidden rounded-full bg-white/80"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-pink-400 transition-all" style={{ width:`${levelProgress}%` }} /></div></div></div><div className="grid grid-cols-3 gap-3 p-5"><button type="button" onClick={() => void care('喂食')} className="rounded-2xl bg-orange-50 p-4 font-bold text-orange-700 hover:-translate-y-0.5">🥕<span className="mt-1 block text-sm">喂食</span></button><button type="button" onClick={() => void care('浇水')} className="rounded-2xl bg-blue-50 p-4 font-bold text-blue-700 hover:-translate-y-0.5">💧<span className="mt-1 block text-sm">浇水</span></button><button type="button" onClick={() => void care('陪玩')} className="rounded-2xl bg-pink-50 p-4 font-bold text-pink-700 hover:-translate-y-0.5">🧶<span className="mt-1 block text-sm">陪玩</span></button></div></section><section className="card"><h2 className="text-xl font-bold text-gray-800">我们一起养</h2><p className="mt-1 text-sm leading-6 text-gray-500">两个人操作的是同一只宠物和同一座花园，数据会同步。</p><label className="mt-6 block text-sm font-bold text-gray-700" htmlFor="pet-name">宠物名字</label><div className="mt-2 flex gap-2"><input id="pet-name" value={petName} onChange={(e) => setPetName(e.target.value)} maxLength={30} className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5" /><button type="button" onClick={() => void savePet()} className="rounded-xl bg-gray-900 px-4 text-sm font-bold text-white">保存</button></div><p className="mt-6 text-sm font-bold text-gray-700">选择小伙伴</p><div className="mt-2 flex gap-3">{(['cat','dog','rabbit'] as const).map((kind) => <button key={kind} type="button" onClick={() => void changePet(kind)} className={`grid h-16 w-16 place-items-center rounded-2xl text-3xl ${growth?.pet_kind === kind ? 'bg-pink-100 ring-2 ring-pink-400' : 'bg-gray-50'}`}>{petIcons[kind]}</button>)}</div>{growth?.last_cared_at && <div className="mt-7 rounded-2xl bg-purple-50 p-4 text-sm text-purple-700">最近由 {names[growth.last_cared_by ?? ''] ?? growth.last_cared_by} 照顾 · {new Date(growth.last_cared_at).toLocaleString('zh-CN')}</div>}</section></div>}

    {tab === 'pte' && <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><section className="card"><div className="flex items-start justify-between"><div><h2 className="text-xl font-black text-gray-800">本期陪伴排行榜</h2><p className="mt-1 text-sm text-gray-500">只比较完成情况，不展示题号、分数和错题内容。</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">🔒 分数私密</span></div><div className="mt-6 space-y-4">{ranked.map((stat, index) => <div key={stat.user_id} className={`rounded-2xl border p-5 ${index === 0 && stat.completed_items > 0 ? 'border-amber-200 bg-amber-50/60' : 'border-gray-100'}`}><div className="flex items-center gap-4"><span className="text-3xl">{index === 0 && stat.completed_items > 0 ? '🥇' : index === 1 && ranked[0].completed_items > 0 ? '🥈' : stat.user_id === 'zyx' ? '⭐' : '🍐'}</span><div className="flex-1"><div className="flex items-center justify-between"><strong className="text-gray-800">{names[stat.user_id]}</strong><span className="text-sm font-bold text-pink-600">完成 {stat.completed_items} 题</span></div><div className="mt-3 grid grid-cols-3 gap-2 text-center"><Stat value={stat.activeDays} label="学习天数" /><Stat value={stat.streak} label="连续天数" /><Stat value={stat.total_plans} label="备考计划" /></div></div></div>{stat.streak >= 7 && <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-orange-600">🔥 获得「坚持一周」徽章</p>}</div>)}</div></section><section className="card"><h2 className="text-xl font-black text-gray-800">给对方加点能量</h2><p className="mt-1 text-sm text-gray-500">选一张加油卡，对方会收到通知。</p><div className="mt-5 space-y-3">{cheers.map((message, index) => <button type="button" key={message} onClick={() => void cheer(message)} className="w-full rounded-2xl border border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"><span className="mr-2 text-xl">{['🌟','🧸','💪','☕'][index]}</span><span className="text-sm font-semibold leading-6 text-gray-700">{message}</span></button>)}</div><div className="mt-6 rounded-2xl bg-gray-900 p-4 text-white"><p className="text-sm font-bold">奖励灵感</p><p className="mt-1 text-xs leading-5 text-white/70">对方完成今天的计划后，可以去礼物箱送一张奶茶券、抱抱券或免家务券。</p><button type="button" onClick={() => setTab('gifts')} className="mt-3 text-sm font-bold text-pink-300">去送奖励 →</button></div></section></div>}

    {tab === 'gifts' && <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]"><form onSubmit={sendGift} className="card"><h2 className="text-xl font-black text-gray-800">送一份小礼物</h2><p className="mt-1 text-sm text-gray-500">电子兑换券也算认真准备的浪漫。</p><label className="mt-5 block text-sm font-bold text-gray-700" htmlFor="gift-type">礼物类型</label><select id="gift-type" value={giftDraft.type} onChange={(e) => chooseGift(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3">{giftPresets.map((item) => <option key={item.type} value={item.type}>{item.emoji} {item.title}</option>)}<option value="custom">✨ 自定义礼物</option></select>{giftDraft.type === 'custom' && <div className="mt-3 grid grid-cols-[4.5rem_1fr] gap-2"><input aria-label="礼物表情" value={giftDraft.emoji} onChange={(e) => setGiftDraft({ ...giftDraft, emoji:e.target.value })} className="rounded-xl border border-gray-200 px-3 text-center text-xl" /><input aria-label="礼物名称" value={giftDraft.title} onChange={(e) => setGiftDraft({ ...giftDraft, title:e.target.value })} placeholder="礼物名称" className="rounded-xl border border-gray-200 px-3 py-3" /></div>}<label className="mt-4 block text-sm font-bold text-gray-700" htmlFor="gift-message">想说的话</label><textarea id="gift-message" value={giftDraft.message} onChange={(e) => setGiftDraft({ ...giftDraft, message:e.target.value })} rows={4} maxLength={500} placeholder="写一句只给对方看的话……" className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3" /><button type="submit" className="btn-primary mt-4 w-full">🎁 送给{names[user ? partnerOf(user) : ''] ?? '对方'}</button></form><section className="card"><h2 className="text-xl font-black text-gray-800">我们的礼物箱</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{gifts.length === 0 ? <div className="col-span-2 py-12 text-center text-gray-500"><div className="text-5xl">🎀</div><p className="mt-2">礼物箱还空着</p></div> : gifts.map((gift) => { const received = gift.recipient === user; const sealed = received && !gift.opened_at; return <button key={gift.id} type="button" onClick={() => void openGift(gift)} className={`rounded-2xl border p-4 text-left transition ${sealed ? 'border-pink-200 bg-pink-50 hover:-translate-y-0.5' : 'border-gray-100 bg-white'}`}><div className="flex items-center justify-between"><span className="text-3xl">{sealed ? '🎁' : gift.emoji}</span><span className="text-xs text-gray-400">{received ? `来自 ${names[gift.sender]}` : `送给 ${names[gift.recipient]}`}</span></div><h3 className="mt-3 font-bold text-gray-800">{sealed ? '有一份礼物等你拆开' : gift.title}</h3><p className="mt-1 line-clamp-2 text-sm text-gray-500">{sealed ? '点击拆礼物' : gift.message || '一份没有附言的心意'}</p><time className="mt-3 block text-xs text-gray-400">{new Date(gift.created_at).toLocaleDateString('zh-CN')}</time></button> })}</div></section></div>}
  </div></main>
}

function Stat({ value, label }: { value:number; label:string }) { return <div className="rounded-xl bg-white/80 p-2"><strong className="block text-lg text-gray-800">{value}</strong><span className="text-[11px] text-gray-500">{label}</span></div> }
function getStreak(dates: string[]) { const unique = new Set(dates); if (!unique.size) return 0; const cursor = new Date(); cursor.setHours(0,0,0,0); const key = () => cursor.toISOString().slice(0,10); if (!unique.has(key())) cursor.setDate(cursor.getDate()-1); let streak = 0; while (unique.has(key())) { streak += 1; cursor.setDate(cursor.getDate()-1) } return streak }
