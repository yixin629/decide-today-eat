-- 为 photos 表添加 tag 字段
ALTER TABLE photos ADD COLUMN IF NOT EXISTS tag TEXT DEFAULT '日常';

-- 创建索引以提升按标签查询的性能
CREATE INDEX IF NOT EXISTS idx_photos_tag ON photos(tag);
