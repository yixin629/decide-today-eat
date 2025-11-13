-- 个人资料表
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  nickname TEXT,
  birthday DATE NOT NULL,
  avatar_emoji TEXT DEFAULT '😊',
  partner_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 提醒事项表
CREATE TABLE IF NOT EXISTS reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  remind_date DATE NOT NULL,
  remind_to TEXT NOT NULL,
  created_by TEXT,
  is_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 启用行级安全（可选）
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- 创建策略允许所有操作（因为是私密应用）
CREATE POLICY "Allow all operations on user_profiles" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations on reminders" ON reminders FOR ALL USING (true);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_reminders_remind_date ON reminders(remind_date);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_to ON reminders(remind_to);
CREATE INDEX IF NOT EXISTS idx_user_profiles_birthday ON user_profiles(birthday);
