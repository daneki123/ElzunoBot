-- Run this once in Supabase: SQL Editor → New query → paste → Run.
-- Safe to re-run (IF NOT EXISTS). If you already ran an older version, this adds the new columns.

-- ============ USERS ============
create table if not exists users (
  telegram_id     bigint primary key,
  username        text,
  first_name      text,
  balance         integer not null default 0,   -- points
  last_claim      timestamptz,
  last_bonus      timestamptz,
  referrer_id     bigint,
  referrals_count integer not null default 0,
  streak_day      integer not null default 0,   -- last claimed day in the 7-day cycle (0 = none)
  created_at      timestamptz not null default now()
);
create index if not exists users_balance_idx on users (balance desc);

-- adds streak_day to a table created by an older schema.sql
alter table users add column if not exists streak_day integer not null default 0;

-- ============ BANK ACCOUNTS (NGN withdrawal) ============
create table if not exists bank_accounts (
  telegram_id     bigint primary key references users(telegram_id),
  bank_name        text,
  account_number   text,
  account_name     text,
  updated_at       timestamptz not null default now()
);

-- ============ WITHDRAWAL REQUESTS ============
create table if not exists withdrawals (
  id            bigint generated always as identity primary key,
  telegram_id   bigint not null,
  amount_ngn    integer not null,
  points_spent  integer not null,
  bank_name     text,
  account_number text,
  account_name  text,
  status        text not null default 'pending',  -- pending | paid | rejected
  created_at    timestamptz not null default now(),
  processed_at  timestamptz
);
create index if not exists withdrawals_status_idx on withdrawals (status);
create index if not exists withdrawals_user_idx on withdrawals (telegram_id);

-- Backend uses the SERVICE ROLE key (bypasses RLS); all access goes through our API.
