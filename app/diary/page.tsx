'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: string;
  author: string;
  photos?: string[];
  created_at: string;
  updated_at: string;
}

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    content: '',
    mood: '😊',
    author: ''
  });

  const loadEntries = useCallback(async () => {
    try {
      let query = supabase
        .from('diary_entries')
        .select('*')
        .order('date', { ascending: false });

      if (selectedDate) {
        query = query.eq('date', selectedDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading diary entries:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleAddEntry = async () => {
    if (!newEntry.title || !newEntry.content || !newEntry.author) {
      alert('请填写标题、内容和作者');
      return;
    }

    try {
      const { error } = await supabase
        .from('diary_entries')
        .insert([newEntry]);

      if (error) throw error;

      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        title: '',
        content: '',
        mood: '😊',
        author: ''
      });
      setShowAddForm(false);
      loadEntries();
    } catch (error) {
      console.error('Error adding diary entry:', error);
      alert('添加失败');
    }
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry) return;

    try {
      const { error } = await supabase
        .from('diary_entries')
        .update({
          title: editingEntry.title,
          content: editingEntry.content,
          mood: editingEntry.mood,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingEntry.id);

      if (error) throw error;

      setEditingEntry(null);
      loadEntries();
    } catch (error) {
      console.error('Error updating diary entry:', error);
      alert('更新失败');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('确定要删除这篇日记吗？')) return;

    try {
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadEntries();
    } catch (error) {
      console.error('Error deleting diary entry:', error);
      alert('删除失败');
    }
  };

  const moodOptions = [
    { emoji: '😊', label: '开心' },
    { emoji: '😍', label: '甜蜜' },
    { emoji: '🥰', label: '幸福' },
    { emoji: '😘', label: '想念' },
    { emoji: '🤗', label: '温暖' },
    { emoji: '😌', label: '平静' },
    { emoji: '🥳', label: '兴奋' },
    { emoji: '😭', label: '难过' },
    { emoji: '😤', label: '生气' },
    { emoji: '🤔', label: '思考' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-900 via-pink-900 to-purple-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">📖 恋爱日记</h1>
            <p className="text-gray-300">记录每天的甜蜜瞬间</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 bg-white text-purple-900 rounded-lg font-bold hover:bg-gray-100 transition-colors"
          >
            {showAddForm ? '取消' : '+ 写日记'}
          </button>
        </div>

        <div className="mb-6 flex gap-4 items-center">
          <label className="text-white font-semibold">筛选日期：</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
            >
              清除筛选
            </button>
          )}
        </div>

        {showAddForm && (
          <div className="mb-8 p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">写下今天的故事</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2">日期 *</label>
                  <input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">作者 *</label>
                  <input
                    type="text"
                    value={newEntry.author}
                    onChange={(e) => setNewEntry({ ...newEntry, author: e.target.value })}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300"
                    placeholder="你的名字"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white mb-2">标题 *</label>
                <input
                  type="text"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300"
                  placeholder="今天发生了什么特别的事？"
                />
              </div>

              <div>
                <label className="block text-white mb-2">今天的心情</label>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood.emoji}
                      onClick={() => setNewEntry({ ...newEntry, mood: mood.emoji })}
                      className={`p-3 rounded-lg transition-all ${
                        newEntry.mood === mood.emoji
                          ? 'bg-white/30 scale-110'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                      title={mood.label}
                    >
                      <span className="text-3xl">{mood.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white mb-2">日记内容 *</label>
                <textarea
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300"
                  placeholder="记录下今天的心情、发生的事情、想说的话..."
                  rows={8}
                />
              </div>

              <button
                onClick={handleAddEntry}
                className="w-full px-6 py-3 bg-white text-purple-900 rounded-lg font-bold hover:bg-gray-100 transition-colors"
              >
                保存日记
              </button>
            </div>
          </div>
        )}

        {entries.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📖</div>
            <p className="text-xl text-gray-300">
              {selectedDate ? '这天还没有日记' : '还没有写过日记'}
            </p>
            <p className="text-gray-400 mt-2">点击&ldquo;写日记&rdquo;开始记录美好时光</p>
          </div>
        ) : (
          <div className="space-y-6">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/15 transition-all"
              >
                {editingEntry?.id === entry.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white mb-2">标题</label>
                      <input
                        type="text"
                        value={editingEntry.title}
                        onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
                        className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-2">心情</label>
                      <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                        {moodOptions.map((mood) => (
                          <button
                            key={mood.emoji}
                            onClick={() => setEditingEntry({ ...editingEntry, mood: mood.emoji })}
                            className={`p-2 rounded-lg transition-all ${
                              editingEntry.mood === mood.emoji
                                ? 'bg-white/30 scale-110'
                                : 'bg-white/10 hover:bg-white/20'
                            }`}
                          >
                            <span className="text-2xl">{mood.emoji}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-white mb-2">内容</label>
                      <textarea
                        value={editingEntry.content}
                        onChange={(e) => setEditingEntry({ ...editingEntry, content: e.target.value })}
                        className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white"
                        rows={6}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateEntry}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditingEntry(null)}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <span className="text-5xl">{entry.mood}</span>
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-1">{entry.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-300">
                            <span>📅 {new Date(entry.date).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              weekday: 'long'
                            })}</span>
                            <span>✍️ {entry.author}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingEntry(entry)}
                          className="text-blue-300 hover:text-blue-200 transition-colors"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-red-300 hover:text-red-200 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="bg-white/10 rounded-lg p-4 mb-3">
                      <p className="text-white whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                    </div>

                    <div className="text-xs text-gray-400">
                      {entry.updated_at !== entry.created_at && (
                        <span>最后编辑：{new Date(entry.updated_at).toLocaleString('zh-CN')}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
