'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import BackButton from '../components/BackButton'

interface UserProfile {
  id: string
  name: string
  nickname: string
  birthday: string
  avatar_emoji: string
  partner_name: string
  created_at: string
}

interface Reminder {
  id: string
  title: string
  description: string
  remind_date: string
  remind_to: string
  created_by: string
  is_sent: boolean
  created_at: string
}

export default function ProfilePage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState('')
  const [showAddProfile, setShowAddProfile] = useState(false)
  const [showAddReminder, setShowAddReminder] = useState(false)

  const [newProfile, setNewProfile] = useState({
    name: '',
    nickname: '',
    birthday: '',
    avatar_emoji: '😊',
    partner_name: '',
  })

  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    remind_date: '',
    remind_to: '',
    created_by: '',
  })

  const emojiOptions = ['😊', '🥰', '😎', '🤗', '😘', '💕', '⭐', '🍐', '🌟', '💖']

  useEffect(() => {
    // 从localStorage获取当前登录用户
    const loggedInUser = localStorage.getItem('loggedInUser')
    if (loggedInUser) {
      setCurrentUser(loggedInUser)
    }

    loadData()
    checkBirthdayReminders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    try {
      // 加载个人资料
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: true })

      if (profileError) throw profileError
      setProfiles(profileData || [])

      // 加载提醒
      const { data: reminderData, error: reminderError } = await supabase
        .from('reminders')
        .select('*')
        .order('remind_date', { ascending: true })

      if (reminderError) throw reminderError
      setReminders(reminderData || [])
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkBirthdayReminders = async () => {
    try {
      const today = new Date()
      const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

      const { data: profileData } = await supabase.from('user_profiles').select('*')

      if (profileData) {
        for (const profile of profileData) {
          const birthday = new Date(profile.birthday)
          const thisYearBirthday = new Date(
            today.getFullYear(),
            birthday.getMonth(),
            birthday.getDate()
          )

          if (thisYearBirthday >= today && thisYearBirthday <= in7Days) {
            // 检查是否已经有提醒
            const { data: existingReminder } = await supabase
              .from('reminders')
              .select('*')
              .eq('title', `${profile.name}的生日`)
              .gte('remind_date', today.toISOString().split('T')[0])
              .single()

            if (!existingReminder) {
              // 自动创建生日提醒
              await supabase.from('reminders').insert([
                {
                  title: `${profile.name}的生日`,
                  description: `别忘了给${profile.nickname || profile.name}准备生日惊喜！🎂`,
                  remind_date: thisYearBirthday.toISOString().split('T')[0],
                  remind_to: profile.partner_name,
                  created_by: 'system',
                  is_sent: false,
                },
              ])
            }
          }
        }
        loadData() // 重新加载数据
      }
    } catch (error) {
      console.error('检查生日提醒失败:', error)
    }
  }

  const handleAddProfile = async () => {
    if (!newProfile.name || !newProfile.birthday) {
      alert('请填写姓名和生日')
      return
    }

    try {
      const { error } = await supabase.from('user_profiles').insert([newProfile])

      if (error) throw error

      setNewProfile({
        name: '',
        nickname: '',
        birthday: '',
        avatar_emoji: '😊',
        partner_name: '',
      })
      setShowAddProfile(false)
      loadData()
      checkBirthdayReminders()
    } catch (error) {
      console.error('添加资料失败:', error)
      alert('添加失败')
    }
  }

  const handleAddReminder = async () => {
    if (!newReminder.title || !newReminder.remind_date || !newReminder.remind_to) {
      alert('请填写提醒标题、日期和提醒对象')
      return
    }

    try {
      const { error } = await supabase.from('reminders').insert([
        {
          ...newReminder,
          is_sent: false,
        },
      ])

      if (error) throw error

      setNewReminder({
        title: '',
        description: '',
        remind_date: '',
        remind_to: '',
        created_by: '',
      })
      setShowAddReminder(false)
      loadData()
      alert('提醒创建成功！')
    } catch (error) {
      console.error('创建提醒失败:', error)
      alert('创建失败')
    }
  }

  const handleDeleteReminder = async (id: string) => {
    if (!confirm('确定要删除这个提醒吗？')) return

    try {
      const { error } = await supabase.from('reminders').delete().eq('id', id)

      if (error) throw error
      loadData()
    } catch (error) {
      console.error('删除提醒失败:', error)
      alert('删除失败')
    }
  }

  const markReminderAsSent = async (id: string) => {
    try {
      const { error } = await supabase.from('reminders').update({ is_sent: true }).eq('id', id)

      if (error) throw error
      loadData()
    } catch (error) {
      console.error('标记失败:', error)
    }
  }

  const getDaysUntil = (dateStr: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDate = new Date(dateStr)
    targetDate.setHours(0, 0, 0, 0)
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getAge = (birthday: string) => {
    const today = new Date()
    const birthDate = new Date(birthday)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <BackButton href="/" text="返回首页" />

        <div className="card mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2 text-center">
            👥 个人资料
          </h1>
          <p className="text-gray-600 text-center mb-6">管理个人信息和生日提醒</p>

          <button
            onClick={() => setShowAddProfile(!showAddProfile)}
            className="btn-primary w-full mb-6"
          >
            {showAddProfile ? '取消' : '+ 添加/编辑个人资料'}
          </button>

          {/* Add Profile Form */}
          {showAddProfile && (
            <div className="mb-6 p-6 bg-pink-50 rounded-xl border border-pink-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4">个人资料</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-800 mb-2">姓名 *</label>
                    <input
                      type="text"
                      value={newProfile.name}
                      onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                      placeholder="例如：zyx"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-800 mb-2">昵称</label>
                    <input
                      type="text"
                      value={newProfile.nickname}
                      onChange={(e) => setNewProfile({ ...newProfile, nickname: e.target.value })}
                      placeholder="例如：星星"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-800 mb-2">生日 *</label>
                    <input
                      type="date"
                      value={newProfile.birthday}
                      onChange={(e) => setNewProfile({ ...newProfile, birthday: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-800 mb-2">对方的名字</label>
                    <input
                      type="text"
                      value={newProfile.partner_name}
                      onChange={(e) =>
                        setNewProfile({ ...newProfile, partner_name: e.target.value })
                      }
                      placeholder="例如：zly"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-800 mb-2">头像表情</label>
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                    {emojiOptions.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setNewProfile({ ...newProfile, avatar_emoji: emoji })}
                        className={`p-3 rounded-lg transition-all ${
                          newProfile.avatar_emoji === emoji
                            ? 'bg-primary/20 scale-110'
                            : 'bg-white hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-3xl">{emoji}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleAddProfile} className="w-full btn-primary">
                  保存资料
                </button>
              </div>
            </div>
          )}

          {/* Profiles Display */}
          {profiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {profiles.map((profile) => {
                const age = getAge(profile.birthday)
                const birthday = new Date(profile.birthday)
                const nextBirthday = new Date(
                  new Date().getFullYear(),
                  birthday.getMonth(),
                  birthday.getDate()
                )
                if (nextBirthday < new Date()) {
                  nextBirthday.setFullYear(nextBirthday.getFullYear() + 1)
                }
                const daysUntilBirthday = getDaysUntil(nextBirthday.toISOString().split('T')[0])

                return (
                  <div
                    key={profile.id}
                    className="p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl border-2 border-pink-200"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-6xl">{profile.avatar_emoji}</span>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">
                          {profile.nickname || profile.name}
                        </h3>
                        <p className="text-gray-600">{profile.name}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-gray-700">
                      <p>
                        🎂 生日：{new Date(profile.birthday).toLocaleDateString('zh-CN')} ({age}岁)
                      </p>
                      <p className="text-primary font-semibold">
                        ⏰ 距离下次生日还有 {daysUntilBirthday} 天
                      </p>
                      {profile.partner_name && <p>💕 另一半：{profile.partner_name}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">还没有添加个人资料</p>
              <p className="text-sm">点击上方按钮添加你们的信息吧</p>
            </div>
          )}
        </div>

        {/* Reminders Section */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">🔔 提醒事项</h2>
              <p className="text-gray-600 text-sm">生日提醒会自动创建，你也可以创建其他提醒</p>
            </div>
            <button onClick={() => setShowAddReminder(!showAddReminder)} className="btn-primary">
              {showAddReminder ? '取消' : '+ 新提醒'}
            </button>
          </div>

          {/* Add Reminder Form */}
          {showAddReminder && (
            <div className="mb-6 p-6 bg-yellow-50 rounded-xl border border-yellow-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4">创建提醒</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-800 mb-2">提醒标题 *</label>
                  <input
                    type="text"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                    placeholder="例如：买纪念日礼物"
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 mb-2">提醒内容</label>
                  <textarea
                    value={newReminder.description}
                    onChange={(e) =>
                      setNewReminder({ ...newReminder, description: e.target.value })
                    }
                    placeholder="详细说明..."
                    rows={3}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-800 mb-2">提醒日期 *</label>
                    <input
                      type="date"
                      value={newReminder.remind_date}
                      onChange={(e) =>
                        setNewReminder({ ...newReminder, remind_date: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-800 mb-2">提醒谁 *</label>
                    <select
                      value={newReminder.remind_to}
                      onChange={(e) =>
                        setNewReminder({ ...newReminder, remind_to: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg"
                    >
                      <option value="">选择...</option>
                      {profiles.map((profile) => (
                        <option key={profile.id} value={profile.name}>
                          {profile.nickname || profile.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-800 mb-2">创建者</label>
                    <input
                      type="text"
                      value={newReminder.created_by}
                      onChange={(e) =>
                        setNewReminder({ ...newReminder, created_by: e.target.value })
                      }
                      placeholder="你的名字"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <button onClick={handleAddReminder} className="w-full btn-primary">
                  创建提醒
                </button>
              </div>
            </div>
          )}

          {/* Reminders List */}
          {reminders.length > 0 ? (
            <div className="space-y-4">
              {reminders.map((reminder) => {
                const daysUntil = getDaysUntil(reminder.remind_date)
                const isPast = daysUntil < 0
                const isToday = daysUntil === 0
                const isUrgent = daysUntil > 0 && daysUntil <= 3

                return (
                  <div
                    key={reminder.id}
                    className={`p-4 rounded-xl border-2 ${
                      reminder.is_sent
                        ? 'bg-gray-50 border-gray-300 opacity-60'
                        : isToday
                        ? 'bg-red-50 border-red-400'
                        : isUrgent
                        ? 'bg-orange-50 border-orange-400'
                        : isPast
                        ? 'bg-gray-50 border-gray-300'
                        : 'bg-blue-50 border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-800">{reminder.title}</h3>
                          {reminder.is_sent && (
                            <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                              已完成
                            </span>
                          )}
                          {isToday && !reminder.is_sent && (
                            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded animate-pulse">
                              今天！
                            </span>
                          )}
                          {isUrgent && !reminder.is_sent && (
                            <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded">
                              紧急
                            </span>
                          )}
                        </div>

                        {reminder.description && (
                          <p className="text-gray-700 mb-2">{reminder.description}</p>
                        )}

                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          <span>
                            📅 {new Date(reminder.remind_date).toLocaleDateString('zh-CN')}
                          </span>
                          {!isPast && !isToday && (
                            <span className="text-primary font-semibold">
                              ({Math.abs(daysUntil)}天后)
                            </span>
                          )}
                          {isPast && <span className="text-gray-500">(已过期)</span>}
                          <span>👤 提醒：{reminder.remind_to}</span>
                          {reminder.created_by && reminder.created_by !== 'system' && (
                            <span>✍️ 创建者：{reminder.created_by}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {!reminder.is_sent && (
                          <button
                            onClick={() => markReminderAsSent(reminder.id)}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                          >
                            ✓ 完成
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">还没有任何提醒</p>
              <p className="text-sm">添加个人资料后会自动创建生日提醒</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
