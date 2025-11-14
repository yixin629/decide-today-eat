-- 星座运势表
CREATE TABLE IF NOT EXISTS horoscope_readings (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  zodiac_sign TEXT NOT NULL,
  reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
  love_fortune TEXT NOT NULL,
  lucky_color TEXT NOT NULL,
  lucky_number INTEGER NOT NULL,
  compatibility_score INTEGER NOT NULL,
  daily_advice TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 创建索引
CREATE INDEX idx_horoscope_readings_user_date ON horoscope_readings(user_id, reading_date DESC);

-- 启用行级安全
ALTER TABLE horoscope_readings ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can view own horoscope readings" ON horoscope_readings FOR SELECT USING (true);
CREATE POLICY "Users can insert own horoscope readings" ON horoscope_readings FOR INSERT WITH CHECK (true);
