-- 穿搭记录表
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

-- 创建索引
CREATE INDEX idx_outfit_records_user_date ON outfit_records(user_id, date DESC);

-- 启用行级安全
ALTER TABLE outfit_records ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can view own outfit records" ON outfit_records FOR SELECT USING (true);
CREATE POLICY "Users can insert own outfit records" ON outfit_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own outfit records" ON outfit_records FOR UPDATE USING (true);
CREATE POLICY "Users can delete own outfit records" ON outfit_records FOR DELETE USING (true);
