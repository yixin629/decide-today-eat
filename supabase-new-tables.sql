-- Supabase SQL Schema for New Features
-- 在 Supabase Dashboard 中执行这些 SQL 语句来添加新功能表

-- 1. 倒计时/正计时表
create table countdowns (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  target_date timestamp with time zone not null,
  type text not null check (type in ('countdown', 'countup')),
  emoji text default '⏰'
);

-- 为 countdowns 表启用行级安全策略
alter table countdowns enable row level security;

-- 创建策略：允许所有人读取和插入
create policy "Allow public read access"
  on countdowns for select
  using (true);

create policy "Allow public insert"
  on countdowns for insert
  with check (true);

create policy "Allow public update"
  on countdowns for update
  using (true);

create policy "Allow public delete"
  on countdowns for delete
  using (true);

-- 2. 共享日程表
create table schedules (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  event_date timestamp with time zone not null,
  location text,
  reminder_minutes integer default 30,
  status text default 'upcoming' check (status in ('upcoming', 'completed', 'cancelled')),
  created_by text not null
);

-- 为 schedules 表启用行级安全策略
alter table schedules enable row level security;

create policy "Allow public read access"
  on schedules for select
  using (true);

create policy "Allow public insert"
  on schedules for insert
  with check (true);

create policy "Allow public update"
  on schedules for update
  using (true);

create policy "Allow public delete"
  on schedules for delete
  using (true);

-- 3. 时光胶囊表
create table time_capsules (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  content text not null,
  created_by text not null,
  recipient text,
  open_date timestamp with time zone not null,
  is_opened boolean default false,
  opened_at timestamp with time zone
);

-- 为 time_capsules 表启用行级安全策略
alter table time_capsules enable row level security;

create policy "Allow public read access"
  on time_capsules for select
  using (true);

create policy "Allow public insert"
  on time_capsules for insert
  with check (true);

create policy "Allow public update"
  on time_capsules for update
  using (true);

create policy "Allow public delete"
  on time_capsules for delete
  using (true);

-- 4. 恋爱日记表
create table diary_entries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  date date not null,
  title text not null,
  content text not null,
  mood text default '😊',
  author text not null,
  photos text[] default array[]::text[]
);

-- 为 diary_entries 表启用行级安全策略
alter table diary_entries enable row level security;

create policy "Allow public read access"
  on diary_entries for select
  using (true);

create policy "Allow public insert"
  on diary_entries for insert
  with check (true);

create policy "Allow public update"
  on diary_entries for update
  using (true);

create policy "Allow public delete"
  on diary_entries for delete
  using (true);

-- 创建触发器自动更新 updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_diary_entries_updated_at
  before update on diary_entries
  for each row
  execute function update_updated_at_column();

-- 创建索引以提高查询性能
create index countdowns_target_date_idx on countdowns(target_date);
create index schedules_event_date_idx on schedules(event_date);
create index schedules_status_idx on schedules(status);
create index time_capsules_open_date_idx on time_capsules(open_date);
create index time_capsules_is_opened_idx on time_capsules(is_opened);
create index diary_entries_date_idx on diary_entries(date desc);
create index diary_entries_author_idx on diary_entries(author);
