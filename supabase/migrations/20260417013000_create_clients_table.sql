create extension if not exists pgcrypto;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  industry text not null,
  horizon_years integer not null check (horizon_years between 1 and 50),
  current_annual_revenue numeric(14,2) not null check (current_annual_revenue >= 0),
  cogs_percent numeric(5,2) not null check (cogs_percent between 0 and 100),
  revenue_growth_percent numeric(6,2) not null check (revenue_growth_percent between -100 and 500),
  fixed_payroll numeric(14,2) not null check (fixed_payroll >= 0),
  fixed_rent_utilities numeric(14,2) not null check (fixed_rent_utilities >= 0),
  fixed_other numeric(14,2) not null check (fixed_other >= 0),
  fixed_expense_growth_percent numeric(6,2) not null check (fixed_expense_growth_percent between -100 and 500),
  market_growth_percent numeric(6,2) not null check (market_growth_percent between -100 and 500),
  target_market_share_percent numeric(6,2) not null check (target_market_share_percent between 0 and 100),
  inflation_percent numeric(6,2) not null check (inflation_percent between -100 and 500),
  tax_rate_percent numeric(6,2) not null check (tax_rate_percent between 0 and 100),
  discount_rate_percent numeric(6,2) not null check (discount_rate_percent between 0 and 100),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists clients_consultant_id_idx on public.clients (consultant_id);
create index if not exists clients_created_at_idx on public.clients (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row
execute function public.set_updated_at();

alter table public.clients enable row level security;

drop policy if exists "consultants can select own clients" on public.clients;
create policy "consultants can select own clients"
on public.clients
for select
using (auth.uid() = consultant_id);

drop policy if exists "consultants can insert own clients" on public.clients;
create policy "consultants can insert own clients"
on public.clients
for insert
with check (auth.uid() = consultant_id);

drop policy if exists "consultants can update own clients" on public.clients;
create policy "consultants can update own clients"
on public.clients
for update
using (auth.uid() = consultant_id)
with check (auth.uid() = consultant_id);

drop policy if exists "consultants can delete own clients" on public.clients;
create policy "consultants can delete own clients"
on public.clients
for delete
using (auth.uid() = consultant_id);
