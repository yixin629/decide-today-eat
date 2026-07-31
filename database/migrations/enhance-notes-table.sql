-- 增强留言板表，添加信纸样式、封口状态和表情包字段
ALTER TABLE love_notes 
ADD COLUMN IF NOT EXISTS letter_style VARCHAR(50) DEFAULT 'classic',
ADD COLUMN IF NOT EXISTS is_sealed BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS emojis TEXT[] DEFAULT '{}';

-- 添加注释
COMMENT ON COLUMN love_notes.letter_style IS '信纸样式：classic, love, cute, elegant';
COMMENT ON COLUMN love_notes.is_sealed IS '是否密封状态';
COMMENT ON COLUMN love_notes.emojis IS '留言中的表情包数组';
