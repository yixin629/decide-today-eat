-- 共同账本 (Shared Expense Tracker)
-- 在 Supabase SQL Editor 中执行

CREATE TABLE IF NOT EXISTS shared_expenses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expense_date date default current_date not null,
  title text not null,
  amount numeric(10, 2) not null CHECK (amount > 0),
  category text default 'other' CHECK (category IN ('food', 'date', 'travel', 'gift', 'home', 'transport', 'shopping', 'other')),
  paid_by text not null,          -- 'zyx' or 'zly'
  split_mode text default 'equal' CHECK (split_mode IN ('equal', 'full', 'custom')),
  split_ratio numeric(3, 2) default 0.5 CHECK (split_ratio >= 0 AND split_ratio <= 1),  -- ratio that paid_by covers for themselves
  note text,
  created_by text
);

-- RLS
ALTER TABLE shared_expenses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shared_expenses' AND policyname = 'Enable all access for shared_expenses') THEN
    CREATE POLICY "Enable all access for shared_expenses" ON shared_expenses FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE shared_expenses;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_shared_expenses_date ON shared_expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_shared_expenses_paid_by ON shared_expenses(paid_by);
