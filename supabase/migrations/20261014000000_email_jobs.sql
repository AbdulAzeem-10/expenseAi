-- State required to safely send budget and weekly recap emails.
alter table public.budgets
  add column if not exists last_alert_sent timestamptz,
  add column if not exists last_alert_threshold integer;

alter table public.users
  add column if not exists weekly_tip_sent_at timestamptz;

create index if not exists transactions_user_date_type_idx
  on public.transactions (user_id, type, date);
