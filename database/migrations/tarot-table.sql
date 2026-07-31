-- 塔罗牌占卜表
CREATE TABLE IF NOT EXISTS tarot_readings (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  card_name TEXT NOT NULL,
  card_meaning TEXT NOT NULL,
  card_advice TEXT NOT NULL,
  love_fortune TEXT NOT NULL,
  reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 创建索引
CREATE INDEX idx_tarot_readings_user_date ON tarot_readings(user_id, reading_date DESC);

-- 启用行级安全
ALTER TABLE tarot_readings ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can view own tarot readings" ON tarot_readings FOR SELECT USING (true);
CREATE POLICY "Users can insert own tarot readings" ON tarot_readings FOR INSERT WITH CHECK (true);
