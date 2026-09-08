-- Finlight production schema.
-- Every user-owned table is keyed by auth.uid() via a `user_id` column that
-- defaults to auth.uid(), and is protected by Row Level Security so a user
-- can only ever see or modify their own rows. Categories are intentionally
-- NOT a database table: the app treats them as a small static, app-level
-- reference list (see src/lib/default-categories.ts), so category_id here
-- is a plain text column, not a foreign key.

-- ---------------------------------------------------------------------
-- Helper: keep `updated_at` current on every row update.
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- user_settings: one row per authenticated user (id = auth.users.id).
-- ---------------------------------------------------------------------
create table if not exists public.user_settings (
  id uuid primary key references auth.users (id) on delete cascade,
  currency text not null default 'TRY'
    check (currency in ('TRY', 'USD', 'EUR', 'GBP')),
  theme text not null default 'system'
    check (theme in ('light', 'dark', 'system')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "Users can view their own settings"
  on public.user_settings for select
  using (auth.uid() = id);

create policy "Users can insert their own settings"
  on public.user_settings for insert
  with check (auth.uid() = id);

create policy "Users can update their own settings"
  on public.user_settings for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Settings rows are created automatically by handle_new_user() below;
-- users are never allowed to delete their own settings row directly.

create trigger set_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount > 0),
  date timestamptz not null,
  category_id text not null,
  description text not null,
  merchant text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);
create index if not exists transactions_user_category_idx
  on public.transactions (user_id, category_id);
create index if not exists transactions_user_type_idx
  on public.transactions (user_id, type);

create trigger set_transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- budgets: one budget per category per user.
-- ---------------------------------------------------------------------
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id text not null,
  amount numeric(12, 2) not null check (amount > 0),
  period text not null default 'monthly' check (period in ('monthly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id)
);

alter table public.budgets enable row level security;

create policy "Users can view their own budgets"
  on public.budgets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own budgets"
  on public.budgets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own budgets"
  on public.budgets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own budgets"
  on public.budgets for delete
  using (auth.uid() = user_id);

create index if not exists budgets_user_idx on public.budgets (user_id);

create trigger set_budgets_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- recurring_expenses
-- ---------------------------------------------------------------------
create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  merchant text not null,
  amount numeric(12, 2) not null check (amount > 0),
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  category_id text not null,
  start_date timestamptz not null,
  next_date timestamptz not null,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recurring_expenses enable row level security;

create policy "Users can view their own recurring expenses"
  on public.recurring_expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own recurring expenses"
  on public.recurring_expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own recurring expenses"
  on public.recurring_expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own recurring expenses"
  on public.recurring_expenses for delete
  using (auth.uid() = user_id);

create index if not exists recurring_expenses_user_idx
  on public.recurring_expenses (user_id);

create trigger set_recurring_expenses_updated_at
  before update on public.recurring_expenses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Auto-provision a settings row the moment a new auth user is created,
-- so the app never has to special-case "no settings row yet".
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_settings (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
