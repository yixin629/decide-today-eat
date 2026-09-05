-- 万能转盘非破坏性扩充：保留已有 decision_options 和 food_options 的全部数据。
-- 先执行 couple-companion-features.sql，再执行本文件。可安全重复执行。

ALTER TABLE decision_options
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '自定义',
  ADD COLUMN IF NOT EXISTS is_builtin BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS decision_options_source_key_idx
  ON decision_options(source_key) WHERE source_key IS NOT NULL;

WITH seed(wheel_type, option_kind, label, emoji, category, source_key) AS (
  VALUES
    ('dishes', 'choice', 'zyx 洗碗', '⭐', '直接决定', 'dishes-zyx'),
    ('dishes', 'choice', 'zly 洗碗', '🍐', '直接决定', 'dishes-zly'),
    ('dishes', 'choice', '一起洗', '🫶', '一起完成', 'dishes-together'),
    ('dishes', 'choice', '猜拳决定', '✊', '再玩一局', 'dishes-rps'),
    ('dishes', 'choice', '做饭的人不用洗', '🍳', '公平规则', 'dishes-cook-rest'),
    ('dishes', 'choice', '今天休息，明天补上', '🌙', '延期处理', 'dishes-tomorrow'),
    ('dishes', 'choice', '各洗一半', '🫧', '一起完成', 'dishes-half'),
    ('dishes', 'choice', '输家洗碗', '🎮', '再玩一局', 'dishes-loser'),
    ('dishes', 'choice', '洗碗机全权负责', '🤖', '科技帮忙', 'dishes-machine'),
    ('dishes', 'choice', '点外卖，今晚不洗', '🥡', '快乐偷懒', 'dishes-takeaway'),

    ('movie', 'choice', '喜剧', '😂', '电影类型', 'movie-comedy'),
    ('movie', 'choice', '动作片', '💥', '电影类型', 'movie-action'),
    ('movie', 'choice', '爱情片', '💗', '电影类型', 'movie-romance'),
    ('movie', 'choice', '动画片', '🧸', '电影类型', 'movie-animation'),
    ('movie', 'choice', '科幻片', '🚀', '电影类型', 'movie-scifi'),
    ('movie', 'choice', '恐怖片', '👻', '电影类型', 'movie-horror'),
    ('movie', 'choice', '悬疑片', '🔍', '电影类型', 'movie-mystery'),
    ('movie', 'choice', '纪录片', '🌍', '电影类型', 'movie-documentary'),
    ('movie', 'choice', '经典老片', '📽️', '特别片单', 'movie-classic'),
    ('movie', 'choice', '高分新片', '🌟', '特别片单', 'movie-new'),
    ('movie', 'choice', '国产片', '🐼', '地区片单', 'movie-cn'),
    ('movie', 'choice', '韩国电影', '🇰🇷', '地区片单', 'movie-kr'),
    ('movie', 'choice', '日本电影', '🇯🇵', '地区片单', 'movie-jp'),
    ('movie', 'choice', '闭眼盲选一部', '🙈', '特别片单', 'movie-random'),

    ('weekend', 'choice', '宅家做饭', '🏠', '宅家约会', 'weekend-home'),
    ('weekend', 'choice', '公园散步', '🌳', '轻松出门', 'weekend-park'),
    ('weekend', 'choice', '探一家咖啡店', '☕', '轻松出门', 'weekend-cafe'),
    ('weekend', 'choice', '去电影院', '🎦', '室内活动', 'weekend-cinema'),
    ('weekend', 'choice', '随机散步探索', '🚶', '轻松出门', 'weekend-walk'),
    ('weekend', 'choice', '周边一日游', '🚗', '短途旅行', 'weekend-trip'),
    ('weekend', 'choice', '野餐晒太阳', '🧺', '户外活动', 'weekend-picnic'),
    ('weekend', 'choice', '逛博物馆', '🏛️', '室内活动', 'weekend-museum'),
    ('weekend', 'choice', '逛周末市集', '🎪', '轻松出门', 'weekend-market'),
    ('weekend', 'choice', '徒步看风景', '🥾', '户外活动', 'weekend-hiking'),
    ('weekend', 'choice', '去海边吹风', '🏖️', '短途旅行', 'weekend-beach'),
    ('weekend', 'choice', '逛水族馆', '🐠', '室内活动', 'weekend-aquarium'),
    ('weekend', 'choice', '一起逛书店', '📚', '轻松出门', 'weekend-bookstore'),
    ('weekend', 'choice', '泡温泉放松', '♨️', '短途旅行', 'weekend-spa'),
    ('weekend', 'choice', '桌游约会', '🎲', '室内活动', 'weekend-boardgame'),
    ('weekend', 'choice', '尝一家新餐厅', '🍽️', '美食约会', 'weekend-restaurant'),

    ('apology', 'choice', 'zyx 先道歉', '⭐', '谁先开口', 'apology-zyx'),
    ('apology', 'choice', 'zly 先道歉', '🍐', '谁先开口', 'apology-zly'),
    ('apology', 'choice', '先抱抱，再一起说', '🫂', '温柔和好', 'apology-hug'),
    ('apology', 'choice', '各写一句真心话', '💌', '温柔和好', 'apology-letter'),
    ('apology', 'choice', '石头剪刀布决定', '✊', '轻松破冰', 'apology-rps'),
    ('apology', 'choice', '一起吃顿好吃的再聊', '🍰', '温柔和好', 'apology-food'),
    ('apology', 'choice', '先冷静十分钟', '⏳', '冷静一下', 'apology-pause'),
    ('apology', 'choice', '每人说一件感谢对方的事', '🌷', '温柔和好', 'apology-thanks'),
    ('apology', 'choice', '交换一个拥抱券', '🎟️', '轻松破冰', 'apology-ticket'),
    ('apology', 'choice', '一起复盘，不分输赢', '🤝', '认真沟通', 'apology-review'),

    ('boss', 'choice', '今天听 zyx 的', '⭐', '今日主理人', 'boss-zyx'),
    ('boss', 'choice', '今天听 zly 的', '🍐', '今日主理人', 'boss-zly'),
    ('boss', 'choice', '一人决定一件', '🔁', '公平分配', 'boss-one-each'),
    ('boss', 'choice', '重要的事一起决定', '🤝', '公平分配', 'boss-together'),
    ('boss', 'choice', '猜拳赢家决定', '✊', '小游戏决定', 'boss-rps'),
    ('boss', 'choice', '掷骰子决定', '🎲', '小游戏决定', 'boss-dice'),
    ('boss', 'choice', '轮到上次没做主的人', '🔄', '公平分配', 'boss-alternate'),
    ('boss', 'choice', '各提方案再投票', '🗳️', '认真决定', 'boss-vote'),
    ('boss', 'choice', '今天让对方开心的人决定', '💗', '甜蜜规则', 'boss-happy'),
    ('boss', 'choice', '再转一次', '🎡', '小游戏决定', 'boss-again'),

    ('dishes', 'punishment', '洗完后负责擦桌子', '🧽', '小惩罚', 'punish-dishes-table'),
    ('dishes', 'punishment', '洗碗时唱一首歌', '🎤', '小惩罚', 'punish-dishes-song'),
    ('movie', 'punishment', '输的人准备零食', '🍿', '小惩罚', 'punish-movie-snack'),
    ('movie', 'punishment', '不能中途玩手机', '📵', '小惩罚', 'punish-movie-phone'),
    ('weekend', 'punishment', '负责拍一张合照', '📷', '小惩罚', 'punish-weekend-photo'),
    ('weekend', 'punishment', '回来后写一句今日回忆', '📝', '小惩罚', 'punish-weekend-memory'),
    ('apology', 'punishment', '认真夸对方三句', '🥰', '甜蜜任务', 'punish-apology-praise'),
    ('apology', 'punishment', '送出一张拥抱券', '🎫', '甜蜜任务', 'punish-apology-hug'),
    ('boss', 'punishment', '做主的人也要负责收尾', '🧹', '公平规则', 'punish-boss-clean'),
    ('boss', 'punishment', '给对方一个小奖励', '🎁', '甜蜜任务', 'punish-boss-gift')
)
INSERT INTO decision_options (
  user_id, wheel_type, option_kind, label, emoji, category, is_builtin, source_key
)
SELECT 'zyx', seed.wheel_type, seed.option_kind, seed.label, seed.emoji,
       seed.category, true, seed.source_key
FROM seed
WHERE NOT EXISTS (
  SELECT 1 FROM decision_options existing WHERE existing.source_key = seed.source_key
);

SELECT wheel_type, option_kind, COUNT(*) AS option_count
FROM decision_options
GROUP BY wheel_type, option_kind
ORDER BY wheel_type, option_kind;
