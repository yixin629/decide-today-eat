-- 增强日记表，添加天气和贴纸字段
ALTER TABLE diary_entries 
ADD COLUMN IF NOT EXISTS weather VARCHAR(50) DEFAULT '☀️',
ADD COLUMN IF NOT EXISTS stickers TEXT[] DEFAULT '{}';

-- 添加注释
COMMENT ON COLUMN diary_entries.weather IS '今天的天气图标';
COMMENT ON COLUMN diary_entries.stickers IS '日记贴纸数组';
