CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Demo account used by the mobile login form.
-- Password: Password123!
INSERT INTO users (id, name, email, password_hash)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'ExpenseMate Demo',
  'demo@expensemate.com',
  '$2b$12$b3LHMOqGfhtKgEeytRlguuhfdaBwyOQLkuQHubal7IXqJNseQXlaG'
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_expires_at_idx ON refresh_tokens(expires_at);

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(80) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  icon VARCHAR(80) NOT NULL DEFAULT 'category',
  color VARCHAR(20) NOT NULL DEFAULT '#2563EB',
  background_color VARCHAR(20) NOT NULL DEFAULT '#DBEAFE',
  type VARCHAR(10) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS categories_user_id_idx ON categories(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS categories_user_name_idx
  ON categories(user_id, lower(name)) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id VARCHAR(120),
  title VARCHAR(200) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER')),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  category_id VARCHAR(80),
  note TEXT,
  "date" DATE NOT NULL,
  payment_method VARCHAR(80) NOT NULL DEFAULT 'CASH',
  wallet_id VARCHAR(120),
  target_wallet_id VARCHAR(120),
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS client_id VARCHAR(120);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS wallet_id VARCHAR(120);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS target_wallet_id VARCHAR(120);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE transactions ALTER COLUMN category_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS transactions_user_date_idx ON transactions(user_id, "date" DESC);
CREATE INDEX IF NOT EXISTS transactions_user_category_idx ON transactions(user_id, category_id);
CREATE UNIQUE INDEX IF NOT EXISTS transactions_user_client_idx
  ON transactions(user_id, client_id) WHERE client_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id VARCHAR(80) NOT NULL,
  month DATE NOT NULL,
  allocated_amount NUMERIC(14, 2) NOT NULL CHECK (allocated_amount >= 0),
  color VARCHAR(20) NOT NULL DEFAULT '#2563EB',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (user_id, category_id, month)
);

CREATE INDEX IF NOT EXISTS budgets_user_month_idx ON budgets(user_id, month);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(40) NOT NULL DEFAULT 'INFO',
  due_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS wallets (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id VARCHAR(120) NOT NULL,
  name VARCHAR(120) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('CASH', 'BANK', 'E_WALLET', 'SAVINGS', 'CREDIT')),
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'VND',
  icon VARCHAR(80) NOT NULL DEFAULT 'account-balance-wallet',
  color VARCHAR(20) NOT NULL DEFAULT '#2563EB',
  background_color VARCHAR(20) NOT NULL DEFAULT '#DBEAFE',
  account_number VARCHAR(120),
  credit_limit NUMERIC(14, 2),
  is_excluded_from_total BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS wallets_user_idx ON wallets(user_id);

CREATE TABLE IF NOT EXISTS jars (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(120) NOT NULL,
  vietnamese_name VARCHAR(120) NOT NULL,
  percentage NUMERIC(5, 2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  allocated_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  spent_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  color VARCHAR(20) NOT NULL DEFAULT '#2563EB',
  icon VARCHAR(80) NOT NULL DEFAULT 'savings',
  description TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, code)
);

CREATE TABLE IF NOT EXISTS recurring_transactions (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id VARCHAR(120) NOT NULL,
  title VARCHAR(200) NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  type VARCHAR(10) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  category_id VARCHAR(80) NOT NULL,
  wallet_id VARCHAR(120) NOT NULL,
  frequency VARCHAR(10) NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),
  day_of_month INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED')),
  next_due_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS recurring_user_due_idx ON recurring_transactions(user_id, next_due_date);

CREATE TABLE IF NOT EXISTS debts_loans (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id VARCHAR(120) NOT NULL,
  person_name VARCHAR(160) NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  type VARCHAR(10) NOT NULL CHECK (type IN ('LENT', 'BORROWED')),
  due_date DATE NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SETTLED')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  phone_number VARCHAR(40),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS debts_user_due_idx ON debts_loans(user_id, status, due_date);

CREATE TABLE IF NOT EXISTS whatif_scenarios (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id VARCHAR(120) NOT NULL,
  title VARCHAR(200) NOT NULL,
  target_amount NUMERIC(14, 2) NOT NULL CHECK (target_amount > 0),
  monthly_payment NUMERIC(14, 2),
  duration_months INTEGER,
  category VARCHAR(120) NOT NULL,
  impact_assessment TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  feasibility_score NUMERIC(5, 2) NOT NULL CHECK (feasibility_score BETWEEN 0 AND 100),
  safe_to_buy BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS scenarios_user_created_idx ON whatif_scenarios(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS challenges (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id VARCHAR(120) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  target_days INTEGER NOT NULL CHECK (target_days > 0),
  current_days INTEGER NOT NULL DEFAULT 0 CHECK (current_days >= 0),
  potential_savings NUMERIC(14, 2) NOT NULL DEFAULT 0,
  icon VARCHAR(80) NOT NULL DEFAULT 'flag',
  status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
  badge_name VARCHAR(120) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

INSERT INTO categories (id, user_id, name, icon, color, background_color, type)
VALUES
  ('cat_food', NULL, 'Ăn uống', 'restaurant', '#F97316', '#FFEDD5', 'EXPENSE'),
  ('cat_transport', NULL, 'Di chuyển', 'directions-car', '#3B82F6', '#DBEAFE', 'EXPENSE'),
  ('cat_shopping', NULL, 'Mua sắm', 'shopping-bag', '#A855F7', '#F3E8FF', 'EXPENSE'),
  ('cat_bills', NULL, 'Hóa đơn', 'receipt-long', '#EF4444', '#FEE2E2', 'EXPENSE'),
  ('cat_entertainment', NULL, 'Giải trí', 'movie', '#EC4899', '#FCE7F3', 'EXPENSE'),
  ('cat_health', NULL, 'Sức khỏe', 'favorite', '#14B8A6', '#CCFBF1', 'EXPENSE'),
  ('cat_transfer', NULL, 'Chuyển ví', 'sync-alt', '#0284C7', '#E0F2FE', 'EXPENSE'),
  ('cat_salary', NULL, 'Lương', 'payments', '#16A34A', '#DCFCE7', 'INCOME'),
  ('cat_bonus', NULL, 'Thưởng', 'card-giftcard', '#CA8A04', '#FEF9C3', 'INCOME')
ON CONFLICT (id) DO NOTHING;
