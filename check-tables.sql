-- 检查现有表结构的SQL
-- 在 Supabase SQL Editor 中执行这个查询来查看表结构

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
