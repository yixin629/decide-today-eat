'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from './ToastProvider'

interface AnniversaryReminder {
  id: string
  title: string
  date: string
  daysUntil: number
  reminderDays: number
}

export default function AnniversaryReminders() {
  const [reminders, setReminders] = useState<AnniversaryReminder[]>([])
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default')
  const toast = useToast()

  // 请求通知权限
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      if (permission === 'granted') {
        toast.success('通知权限已开启！')
      } else {
        toast.warning('通知权限被拒绝，将无法收到提醒')
      }
    } else {
      toast.error('您的浏览器不支持通知功能')
    }
  }

  // 加载纪念日数据并计算提醒
  const loadAnniversaries = async () => {
    try {
      const { data, error } = await supabase
        .from('anniversaries')
        .select('*')
        .order('date', { ascending: true })

      if (error) throw error

      if (data) {
        const today = new Date()
        const upcomingReminders: AnniversaryReminder[] = []

        data.forEach((anniversary) => {
          const anniversaryDate = new Date(anniversary.date)
          const nextDate = new Date(anniversaryDate)

          // 如果是年度纪念日，计算下一年的日期
          if (anniversary.recurring) {
            if (nextDate < today) {
              nextDate.setFullYear(today.getFullYear() + 1)
            }
          }

          const daysUntil = Math.ceil(
            (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )

          // 检查是否在提醒范围内（1-7天）
          if (daysUntil >= 1 && daysUntil <= 7) {
            upcomingReminders.push({
              id: anniversary.id,
              title: anniversary.title,
              date: anniversary.date,
              daysUntil,
              reminderDays: daysUntil, // 默认提醒天数等于剩余天数
            })
          }
        })

        setReminders(upcomingReminders)
      }
    } catch (error) {
      console.error('加载纪念日失败:', error)
    }
  }

  // 发送通知
  const sendNotification = useCallback(
    (reminder: AnniversaryReminder) => {
      if (notificationPermission === 'granted') {
        const notification = new Notification(`纪念日提醒: ${reminder.title}`, {
          body: `${reminder.daysUntil} 天后是 ${reminder.title}`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        })

        // 点击通知跳转到纪念日页面
        notification.onclick = () => {
          window.focus()
          window.location.href = '/anniversaries'
        }

        // 自动关闭通知
        setTimeout(() => {
          notification.close()
        }, 5000)
      }
    },
    [notificationPermission]
  )

  // 检查并发送提醒
  const checkAndSendReminders = useCallback(() => {
    reminders.forEach((reminder) => {
      // 这里可以根据用户设置的提醒天数来决定是否发送
      // 暂时设置为距离纪念日1天时发送提醒
      if (reminder.daysUntil === 1) {
        sendNotification(reminder)
      }
    })
  }, [reminders, sendNotification])

  useEffect(() => {
    // 检查通知权限
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }

    loadAnniversaries()

    // 每小时检查一次提醒
    const interval = setInterval(() => {
      checkAndSendReminders()
    }, 60 * 60 * 1000) // 1小时

    return () => clearInterval(interval)
  }, [checkAndSendReminders])

  return (
    <div className="anniversary-reminders">
      {/* 通知权限状态 */}
      {notificationPermission !== 'granted' && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-yellow-800">开启纪念日提醒</h4>
              <p className="text-sm text-yellow-700">允许通知权限，在纪念日临近时收到提醒</p>
            </div>
            <button
              onClick={requestNotificationPermission}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              开启通知
            </button>
          </div>
        </div>
      )}

      {/* 即将到来的纪念日 */}
      {reminders.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3">即将到来的纪念日</h4>
          <div className="space-y-2">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-3 bg-pink-50 rounded-lg border border-pink-200"
              >
                <div>
                  <span className="font-medium">{reminder.title}</span>
                  <span className="text-sm text-gray-600 ml-2">{reminder.daysUntil} 天后</span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(reminder.date).toLocaleDateString('zh-CN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 提醒设置说明 */}
      <div className="text-sm text-gray-600">
        <p>💡 纪念日将在1天前自动发送浏览器通知提醒</p>
        <p>🔕 如果不想收到通知，可以在浏览器设置中关闭</p>
      </div>
    </div>
  )
}
