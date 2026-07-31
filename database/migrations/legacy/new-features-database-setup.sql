-- LEGACY：历史新功能 bundle，不用于当前默认初始化流程。
-- 仅为复现或修复对应历史数据库保留；执行前先备份并阅读 database/README.md。

-- 1. 塔罗牌占卜表
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

CREATE INDEX IF NOT EXISTS idx_tarot_readings_user_date ON tarot_readings(user_id, reading_date DESC);

ALTER TABLE tarot_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tarot readings" ON tarot_readings;
CREATE POLICY "Users can view own tarot readings" ON tarot_readings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own tarot readings" ON tarot_readings;
CREATE POLICY "Users can insert own tarot readings" ON tarot_readings FOR INSERT WITH CHECK (true);

-- 2. 星座运势表
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

CREATE INDEX IF NOT EXISTS idx_horoscope_readings_user_date ON horoscope_readings(user_id, reading_date DESC);

ALTER TABLE horoscope_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own horoscope readings" ON horoscope_readings;
CREATE POLICY "Users can view own horoscope readings" ON horoscope_readings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own horoscope readings" ON horoscope_readings;
CREATE POLICY "Users can insert own horoscope readings" ON horoscope_readings FOR INSERT WITH CHECK (true);

-- 3. 穿搭记录表
CREATE TABLE IF NOT EXISTS outfit_records (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  photo_url TEXT,
  style_tags TEXT[] DEFAULT '{}',
  occasion TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_outfit_records_user_date ON outfit_records(user_id, date DESC);

ALTER TABLE outfit_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own outfit records" ON outfit_records;
CREATE POLICY "Users can view own outfit records" ON outfit_records FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own outfit records" ON outfit_records;
CREATE POLICY "Users can insert own outfit records" ON outfit_records FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own outfit records" ON outfit_records;
CREATE POLICY "Users can update own outfit records" ON outfit_records FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete own outfit records" ON outfit_records;
CREATE POLICY "Users can delete own outfit records" ON outfit_records FOR DELETE USING (true);

-- 4. 增强日记表（添加天气和贴纸字段）
ALTER TABLE diary_entries 
ADD COLUMN IF NOT EXISTS weather VARCHAR(50) DEFAULT '☀️',
ADD COLUMN IF NOT EXISTS stickers TEXT[] DEFAULT '{}';

-- 5. 增强留言板表（添加信纸样式、封口状态和表情包字段）
ALTER TABLE love_notes 
ADD COLUMN IF NOT EXISTS letter_style VARCHAR(50) DEFAULT 'classic',
ADD COLUMN IF NOT EXISTS is_sealed BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS emojis TEXT[] DEFAULT '{}';

-- ==========================================
-- 执行完成！
-- 新功能已经可以使用了 🎉
-- ==========================================
