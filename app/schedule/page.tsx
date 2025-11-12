'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Schedule {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location?: string;
  reminder_minutes?: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    reminder_minutes: 30,
    created_by: ''
  });

  const loadSchedules = useCallback(async () => {
    try {
      let query = supabase
        .from('schedules')
        .select('*')
        .order('event_date', { ascending: true });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleAddSchedule = async () => {
    if (!newSchedule.title || !newSchedule.event_date || !newSchedule.created_by) {
      alert('请填写标题、日期和你的名字');
      return;
    }

    try {
      const { error } = await supabase
        .from('schedules')
        .insert([{
          ...newSchedule,
          status: 'upcoming'
        }]);

      if (error) throw error;

      setNewSchedule({
        title: '',
        description: '',
        event_date: '',
        location: '',
        reminder_minutes: 30,
        created_by: ''
      });
      setShowAddForm(false);
      loadSchedules();
    } catch (error) {
      console.error('Error adding schedule:', error);
      alert('添加失败');
    }
  };

  const handleUpdateStatus = async (id: string, status: 'upcoming' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      loadSchedules();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('更新失败');
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('确定要删除这个日程吗？')) return;

    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('删除失败');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long'
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-block mb-6 text-white hover:text-primary transition-colors">
          ← 返回首页
        </Link>
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">📅 共享日程</h1>
            <p className="text-gray-300">记录两人的约会计划</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 bg-white text-purple-900 rounded-lg font-bold hover:bg-gray-100 transition-colors"
          >
            {showAddForm ? '取消' : '+ 添加日程'}
          </button>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-white text-purple-900'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'upcoming'
                ? 'bg-white text-purple-900'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            即将到来
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'completed'
                ? 'bg-white text-purple-900'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            已完成
          </button>
        </div>

        {showAddForm && (
          <div className="mb-8 p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">添加新日程</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2">标题 *</label>
                <input
                  type="text"
                  value={newSchedule.title}
                  onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300"
                  placeholder="例如：周末约会、看电影"
                />
              </div>

              <div>
                <label className="block text-white mb-2">描述</label>
                <textarea
                  value={newSchedule.description}
                  onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300"
                  placeholder="详细说明..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2">日期时间 *</label>
                  <input
                    type="datetime-local"
                    value={newSchedule.event_date}
                    onChange={(e) => setNewSchedule({ ...newSchedule, event_date: e.target.value })}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">地点</label>
                  <input
                    type="text"
                    value={newSchedule.location}
                    onChange={(e) => setNewSchedule({ ...newSchedule, location: e.target.value })}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300"
                    placeholder="约会地点"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2">提前提醒（分钟）</label>
                  <select
                    value={newSchedule.reminder_minutes}
                    onChange={(e) => setNewSchedule({ ...newSchedule, reminder_minutes: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white"
                  >
                    <option value={15}>15分钟</option>
                    <option value={30}>30分钟</option>
                    <option value={60}>1小时</option>
                    <option value={120}>2小时</option>
                    <option value={1440}>1天</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white mb-2">创建者 *</label>
                  <input
                    type="text"
                    value={newSchedule.created_by}
                    onChange={(e) => setNewSchedule({ ...newSchedule, created_by: e.target.value })}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300"
                    placeholder="你的名字"
                  />
                </div>
              </div>

              <button
                onClick={handleAddSchedule}
                className="w-full px-6 py-3 bg-white text-purple-900 rounded-lg font-bold hover:bg-gray-100 transition-colors"
              >
                添加日程
              </button>
            </div>
          </div>
        )}

        {schedules.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-xl text-gray-300">还没有添加任何日程</p>
            <p className="text-gray-400 mt-2">点击&ldquo;添加日程&rdquo;开始规划约会</p>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/15 transition-all ${
                  schedule.status === 'completed' ? 'opacity-75' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-white">{schedule.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        schedule.status === 'upcoming'
                          ? 'bg-green-500/30 text-green-200'
                          : schedule.status === 'completed'
                          ? 'bg-blue-500/30 text-blue-200'
                          : 'bg-gray-500/30 text-gray-200'
                      }`}>
                        {schedule.status === 'upcoming' ? '即将到来' : schedule.status === 'completed' ? '已完成' : '已取消'}
                      </span>
                      {isUpcoming(schedule.event_date) && schedule.status === 'upcoming' && (
                        <span className="animate-pulse text-yellow-400">🔔</span>
                      )}
                    </div>

                    <p className="text-lg text-gray-300 mb-3">{formatDateTime(schedule.event_date)}</p>

                    {schedule.description && (
                      <p className="text-gray-300 mb-3">{schedule.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      {schedule.location && (
                        <div className="flex items-center gap-1">
                          <span>📍</span>
                          <span>{schedule.location}</span>
                        </div>
                      )}
                      {schedule.reminder_minutes && (
                        <div className="flex items-center gap-1">
                          <span>⏰</span>
                          <span>提前{schedule.reminder_minutes >= 60 ? `${schedule.reminder_minutes / 60}小时` : `${schedule.reminder_minutes}分钟`}提醒</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span>👤</span>
                        <span>{schedule.created_by}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {schedule.status === 'upcoming' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(schedule.id, 'completed')}
                          className="px-3 py-1 bg-green-500/30 text-green-200 rounded-lg hover:bg-green-500/40 transition-colors text-sm"
                        >
                          完成
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(schedule.id, 'cancelled')}
                          className="px-3 py-1 bg-gray-500/30 text-gray-200 rounded-lg hover:bg-gray-500/40 transition-colors text-sm"
                        >
                          取消
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="text-red-300 hover:text-red-200 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
