-- 影响：合并同名 user_profiles，删除重复行，并建立大小写不敏感的姓名唯一索引。
-- 备份要求：只在完成 Supabase 项目备份后执行；脚本还会创建一次性表
-- user_profiles_backup_before_name_dedupe_20260828 保存执行前的全部资料。
-- 恢复方式：确认当前列结构未变化后，在事务中清空 user_profiles，再从上述备份表插回；
-- 恢复前需先 DROP INDEX IF EXISTS uq_user_profiles_normalized_name。
-- 适用范围：已有数据库出现 PGRST116，且同一 name 存在多行时。不要用于替代新库初始化。

BEGIN;

CREATE TABLE IF NOT EXISTS user_profiles_backup_before_name_dedupe_20260828 AS
TABLE user_profiles;

-- 备份表仅供项目维护者通过 SQL Editor / service role 恢复数据，客户端不得读取。
ALTER TABLE user_profiles_backup_before_name_dedupe_20260828 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE user_profiles_backup_before_name_dedupe_20260828 FROM anon, authenticated;

WITH ranked AS (
  SELECT
    id,
    LOWER(BTRIM(name)) AS normalized_name,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(BTRIM(name))
      ORDER BY created_at DESC, id ASC
    ) AS row_number
  FROM user_profiles
), merged AS (
  SELECT
    LOWER(BTRIM(name)) AS normalized_name,
    (ARRAY_AGG(nickname ORDER BY created_at DESC, id ASC)
      FILTER (WHERE NULLIF(BTRIM(nickname), '') IS NOT NULL))[1] AS nickname,
    (ARRAY_AGG(birthday ORDER BY created_at DESC, id ASC))[1] AS birthday,
    (ARRAY_AGG(avatar_emoji ORDER BY created_at DESC, id ASC)
      FILTER (WHERE NULLIF(BTRIM(avatar_emoji), '') IS NOT NULL))[1] AS avatar_emoji,
    (ARRAY_AGG(avatar_url ORDER BY created_at DESC, id ASC)
      FILTER (WHERE NULLIF(BTRIM(avatar_url), '') IS NOT NULL))[1] AS avatar_url,
    (ARRAY_AGG(partner_name ORDER BY created_at DESC, id ASC)
      FILTER (WHERE NULLIF(BTRIM(partner_name), '') IS NOT NULL))[1] AS partner_name
  FROM user_profiles
  GROUP BY LOWER(BTRIM(name))
)
UPDATE user_profiles AS profile
SET
  name = merged.normalized_name,
  nickname = COALESCE(merged.nickname, profile.nickname),
  birthday = merged.birthday,
  avatar_emoji = COALESCE(merged.avatar_emoji, profile.avatar_emoji),
  avatar_url = COALESCE(merged.avatar_url, profile.avatar_url),
  partner_name = COALESCE(merged.partner_name, profile.partner_name)
FROM ranked
JOIN merged ON merged.normalized_name = ranked.normalized_name
WHERE profile.id = ranked.id
  AND ranked.row_number = 1;

WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(BTRIM(name))
      ORDER BY created_at DESC, id ASC
    ) AS row_number
  FROM user_profiles
)
DELETE FROM user_profiles
USING duplicates
WHERE user_profiles.id = duplicates.id
  AND duplicates.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_profiles_normalized_name
ON user_profiles (LOWER(BTRIM(name)));

COMMIT;
