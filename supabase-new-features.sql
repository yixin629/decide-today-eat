-- 新增功能的数据库表结构
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 真心话大冒险表
CREATE TABLE IF NOT EXISTS truth_or_dare (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(10) NOT NULL, -- 'truth' 或 'dare'
  content TEXT NOT NULL,
  difficulty VARCHAR(10) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(50)
);

-- 2. 情侣问答题目表
CREATE TABLE IF NOT EXISTS couple_quiz (
  id BIGSERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- 存储选项数组
  correct_answer TEXT NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 情侣问答答题记录表
CREATE TABLE IF NOT EXISTS quiz_results (
  id BIGSERIAL PRIMARY KEY,
  player_name VARCHAR(50) NOT NULL,
  quiz_id BIGINT REFERENCES couple_quiz(id),
  selected_answer TEXT,
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 画板作品表
CREATE TABLE IF NOT EXISTS drawings (
  id BIGSERIAL PRIMARY KEY,
  image_data TEXT NOT NULL, -- base64图片数据
  drawer VARCHAR(50) NOT NULL,
  prompt TEXT, -- 画的是什么
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 石头剪刀布游戏记录
CREATE TABLE IF NOT EXISTS rps_games (
  id BIGSERIAL PRIMARY KEY,
  player1 VARCHAR(50) NOT NULL,
  player2 VARCHAR(50) NOT NULL,
  player1_choice VARCHAR(10) NOT NULL,
  player2_choice VARCHAR(10) NOT NULL,
  winner VARCHAR(50),
  played_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 倒计时事件表
CREATE TABLE IF NOT EXISTS countdowns (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  target_date DATE NOT NULL,
  description TEXT,
  icon VARCHAR(10) DEFAULT '⏰',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 共享日程表
CREATE TABLE IF NOT EXISTS shared_calendar (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  description TEXT,
  location VARCHAR(200),
  reminder_enabled BOOLEAN DEFAULT false,
  created_by VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 爱的任务清单（100件想做的事）
CREATE TABLE IF NOT EXISTS love_bucket_list (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by VARCHAR(50),
  priority INTEGER DEFAULT 0, -- 优先级
  category VARCHAR(50), -- 分类：旅行、美食、体验等
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. 情话库
CREATE TABLE IF NOT EXISTS love_quotes (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  author VARCHAR(50) DEFAULT '匿名',
  is_custom BOOLEAN DEFAULT false,
  created_by VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. 时光胶囊
CREATE TABLE IF NOT EXISTS time_capsules (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  sender VARCHAR(50) NOT NULL,
  receiver VARCHAR(50),
  unlock_date DATE NOT NULL,
  is_opened BOOLEAN DEFAULT false,
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. 恋爱日记
CREATE TABLE IF NOT EXISTS love_diary (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  mood VARCHAR(50), -- 心情标签
  weather VARCHAR(50), -- 天气
  author VARCHAR(50) NOT NULL,
  diary_date DATE DEFAULT CURRENT_DATE,
  photos TEXT[], -- 照片URL数组
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. 功能申请表
CREATE TABLE IF NOT EXISTS feature_requests (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  requester VARCHAR(50) NOT NULL, -- 'zyx' 或 'zly'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'rejected'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入一些默认的真心话大冒险数据
INSERT INTO truth_or_dare (type, content, difficulty) VALUES
('truth', '你最喜欢我的哪一点？', 'easy'),
('truth', '如果只能选一个，你会选择爱情还是面包？', 'medium'),
('truth', '你做过最浪漫的梦是什么？', 'easy'),
('truth', '你觉得我们的关系中最需要改进的是什么？', 'hard'),
('dare', '给对方一个拥抱，保持30秒', 'easy'),
('dare', '唱一首情歌给对方听', 'medium'),
('dare', '说出你爱对方的10个理由', 'medium'),
('dare', '做10个俯卧撑', 'easy'),
('dare', '模仿对方最常见的动作', 'easy'),
('dare', '用方言说"我爱你"', 'medium');

-- 插入一些默认的情话
INSERT INTO love_quotes (content, author, is_custom) VALUES
('世界上有那么多的城镇，城镇中有那么多的酒馆，她却走进了我的。', '卡萨布兰卡', false),
('我爱你，不是因为你是一个怎样的人，而是因为我喜欢与你在一起时的感觉。', '佚名', false),
('想你的时候，我就看看天空，因为我知道我们在同一片天空下。', '佚名', false),
('遇见你，是我这辈子最幸运的事。', '佚名', false),
('我不要短暂的温存，只要你一世的陪伴。', '佚名', false);

-- 插入一些默认的情侣问答题
INSERT INTO couple_quiz (question, options, correct_answer, category) VALUES
('我们第一次见面是什么时候？', '["2024年春天", "2024年夏天", "2024年秋天", "2024年冬天"]', '根据实际填写', '纪念日'),
('我最喜欢的颜色是什么？', '["红色", "蓝色", "粉色", "绿色"]', '根据实际填写', '喜好'),
('我的生日是哪天？', '["1月", "5月", "10月", "12月"]', '根据实际填写', '基本信息'),
('我最喜欢吃的食物是？', '["火锅", "寿司", "披萨", "烧烤"]', '根据实际填写', '喜好');

-- 启用所有表的 RLS (Row Level Security)
ALTER TABLE truth_or_dare ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rps_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE countdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE love_bucket_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE love_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE love_diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;

-- 创建允许所有访问的策略（因为是私人使用）
CREATE POLICY "Enable all access for truth_or_dare" ON truth_or_dare FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for couple_quiz" ON couple_quiz FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for quiz_results" ON quiz_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for drawings" ON drawings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for rps_games" ON rps_games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for countdowns" ON countdowns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for shared_calendar" ON shared_calendar FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for love_bucket_list" ON love_bucket_list FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for love_quotes" ON love_quotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for time_capsules" ON time_capsules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for love_diary" ON love_diary FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for feature_requests" ON feature_requests FOR ALL USING (true) WITH CHECK (true);
