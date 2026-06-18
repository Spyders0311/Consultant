create table if not exists public.client_misc_direct_expense_runs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  inputs jsonb not null default '{}'::jsonb,
  outputs jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists client_misc_direct_expense_runs_client_created_idx
  on public.client_misc_direct_expense_runs (client_id, created_at desc);

drop trigger if exists client_misc_direct_expense_runs_set_updated_at on public.client_misc_direct_expense_runs;
create trigger client_misc_direct_expense_runs_set_updated_at
before update on public.client_misc_direct_expense_runs
for each row
execute function public.set_updated_at();

alter table public.client_misc_direct_expense_runs enable row level security;

drop policy if exists "consultants can manage own misc direct runs" on public.client_misc_direct_expense_runs;
create policy "consultants can manage own misc direct runs"
on public.client_misc_direct_expense_runs
for all
using (
  exists (select 1 from public.clients c where c.id = client_misc_direct_expense_runs.client_id and c.consultant_id = auth.uid())
)
with check (
  exists (select 1 from public.clients c where c.id = client_misc_direct_expense_runs.client_id and c.consultant_id = auth.uid())
);

create table if not exists public.client_misc_indirect_expense_runs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  inputs jsonb not null default '{}'::jsonb,
  outputs jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists client_misc_indirect_expense_runs_client_created_idx
  on public.client_misc_indirect_expense_runs (client_id, created_at desc);

drop trigger if exists client_misc_indirect_expense_runs_set_updated_at on public.client_misc_indirect_expense_runs;
create trigger client_misc_indirect_expense_runs_set_updated_at
before update on public.client_misc_indirect_expense_runs
for each row
execute function public.set_updated_at();

alter table public.client_misc_indirect_expense_runs enable row level security;

drop policy if exists "consultants can manage own misc indirect runs" on public.client_misc_indirect_expense_runs;
create policy "consultants can manage own misc indirect runs"
on public.client_misc_indirect_expense_runs
for all
using (
  exists (select 1 from public.clients c where c.id = client_misc_indirect_expense_runs.client_id and c.consultant_id = auth.uid())
)
with check (
  exists (select 1 from public.clients c where c.id = client_misc_indirect_expense_runs.client_id and c.consultant_id = auth.uid())
);

create table if not exists public.client_twelve_month_pl_runs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  inputs jsonb not null default '{}'::jsonb,
  outputs jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists client_twelve_month_pl_runs_client_created_idx
  on public.client_twelve_month_pl_runs (client_id, created_at desc);

drop trigger if exists client_twelve_month_pl_runs_set_updated_at on public.client_twelve_month_pl_runs;
create trigger client_twelve_month_pl_runs_set_updated_at
before update on public.client_twelve_month_pl_runs
for each row
execute function public.set_updated_at();

alter table public.client_twelve_month_pl_runs enable row level security;

drop policy if exists "consultants can manage own twelve month pl runs" on public.client_twelve_month_pl_runs;
create policy "consultants can manage own twelve month pl runs"
on public.client_twelve_month_pl_runs
for all
using (
  exists (select 1 from public.clients c where c.id = client_twelve_month_pl_runs.client_id and c.consultant_id = auth.uid())
)
with check (
  exists (select 1 from public.clients c where c.id = client_twelve_month_pl_runs.client_id and c.consultant_id = auth.uid())
);
