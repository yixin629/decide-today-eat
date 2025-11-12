'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Countdown {
  id: string;
  title: string;
  target_date: string;
  type: 'countdown' | 'countup';
  emoji: string;
  created_at: string;
}

export default function CountdownPage() {
  const [countdowns, setCountdowns] = useState<Countdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCountdown, setNewCountdown] = useState({
    title: '',
    target_date: '',
    type: 'countdown' as 'countdown' | 'countup',
    emoji: '⏰'
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  const loadCountdowns = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('countdowns')
        .select('*')
        .order('target_date', { ascending: true });

      if (error) throw error;
      setCountdowns(data || []);
    } catch (error) {
      console.error('Error loading countdowns:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCountdowns();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [loadCountdowns]);

  const calculateTimeDifference = (targetDate: string, type: string) => {
    const target = new Date(targetDate);
    const now = currentTime;
    const diff = type === 'countdown' 
      ? target.getTime() - now.getTime()
      : now.getTime() - target.getTime();

    if (diff < 0 && type === 'countdown') {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
    }

    const days = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((Math.abs(diff) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((Math.abs(diff) % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isPast: false };
  };

  const handleAddCountdown = async () => {
    if (!newCountdown.title || !newCountdown.target_date) {
      alert('请填写标题和日期');
      return;
    }

    try {
      const { error } = await supabase
        .from('countdowns')
        .insert([newCountdown]);

      if (error) throw error;

      setNewCountdown({
        title: '',
        target_date: '',
        type: 'countdown',
        emoji: '⏰'
      });
      setShowAddForm(false);
      loadCountdowns();
    } catch (error) {
      console.error('Error adding countdown:', error);
      alert('添加失败');
    }
  };

  const handleDeleteCountdown = async (id: string) => {
    if (!confirm('确定要删除这个倒计时吗？')) return;

    try {
      const { error } = await supabase
        .from('countdowns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadCountdowns();
    } catch (error) {
      console.error('Error deleting countdown:', error);
      alert('删除失败');
    }
  };

  const emojiOptions = ['⏰', '💝', '🎂', '🎉', '✈️', '💍', '🌟', '❤️', '🎁', '🌹'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">⏰ 时光计时器</h1>
            <p className="text-gray-300">记录每一个重要时刻</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 bg-white text-purple-900 rounded-lg font-bold hover:bg-gray-100 transition-colors"
          >
            {showAddForm ? '取消' : '+ 添加计时'}
          </button>
        </div>

        {showAddForm && (
          <div className="mb-8 p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">添加新计时</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2">标题</label>
                <input
                  type="text"
                  value={newCountdown.title}
                  onChange={(e) => setNewCountdown({ ...newCountdown, title: e.target.value })}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300"
                  placeholder="例如：下次见面、在一起纪念日"
                />
              </div>

              <div>
                <label className="block text-white mb-2">日期时间</label>
                <input
                  type="datetime-local"
                  value={newCountdown.target_date}
                  onChange={(e) => setNewCountdown({ ...newCountdown, target_date: e.target.value })}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-white mb-2">类型</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="radio"
                      value="countdown"
                      checked={newCountdown.type === 'countdown'}
                      onChange={(e) => setNewCountdown({ ...newCountdown, type: e.target.value as 'countdown' })}
                      className="w-4 h-4"
                    />
                    倒计时（未来事件）
                  </label>
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="radio"
                      value="countup"
                      checked={newCountdown.type === 'countup'}
                      onChange={(e) => setNewCountdown({ ...newCountdown, type: e.target.value as 'countup' })}
                      className="w-4 h-4"
                    />
                    正计时（已过天数）
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-white mb-2">选择图标</label>
                <div className="flex gap-2 flex-wrap">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setNewCountdown({ ...newCountdown, emoji })}
                      className={`text-3xl p-2 rounded-lg transition-all ${
                        newCountdown.emoji === emoji
                          ? 'bg-white/30 scale-110'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddCountdown}
                className="w-full px-6 py-3 bg-white text-purple-900 rounded-lg font-bold hover:bg-gray-100 transition-colors"
              >
                添加计时
              </button>
            </div>
          </div>
        )}

        {countdowns.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⏰</div>
            <p className="text-xl text-gray-300">还没有添加任何计时器</p>
            <p className="text-gray-400 mt-2">点击"添加计时"开始记录重要时刻</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {countdowns.map((countdown) => {
              const time = calculateTimeDifference(countdown.target_date, countdown.type);
              return (
                <div
                  key={countdown.id}
                  className="p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/15 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{countdown.emoji}</span>
                      <div>
                        <h3 className="text-xl font-bold text-white">{countdown.title}</h3>
                        <p className="text-sm text-gray-300">
                          {new Date(countdown.target_date).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCountdown(countdown.id)}
                      className="text-red-300 hover:text-red-200 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>

                  {time.isPast ? (
                    <div className="text-center py-4 text-gray-400">
                      时间已过
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">{time.days}</div>
                        <div className="text-sm text-gray-300">天</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">{time.hours}</div>
                        <div className="text-sm text-gray-300">时</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">{time.minutes}</div>
                        <div className="text-sm text-gray-300">分</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">{time.seconds}</div>
                        <div className="text-sm text-gray-300">秒</div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      countdown.type === 'countdown'
                        ? 'bg-blue-500/30 text-blue-200'
                        : 'bg-green-500/30 text-green-200'
                    }`}>
                      {countdown.type === 'countdown' ? '倒计时' : '正计时'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
