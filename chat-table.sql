-- 创建聊天消息表
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- text, image, emoji
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以加速查询
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender);

-- 启用实时功能
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- 设置 RLS 策略（可选，如果需要的话）
-- ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 允许所有操作（因为是情侣私人网站）
-- CREATE POLICY "Allow all" ON chat_messages FOR ALL USING (true);
