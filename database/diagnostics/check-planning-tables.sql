-- 只读检查计划与记录功能的现有表结构
-- 在 Supabase SQL Editor 中执行；不会修改数据或结构

-- 检查 countdowns 表
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'countdowns' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 检查 schedules 表
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'schedules' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 检查 time_capsules 表
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'time_capsules' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 检查 diary_entries 表
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'diary_entries' AND table_schema = 'public'
ORDER BY ordinal_position;
