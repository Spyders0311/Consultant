create table if not exists public.client_workbook_port_runs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  workbook_key text not null,
  inputs jsonb not null default '{}'::jsonb,
  outputs jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists client_workbook_port_runs_client_workbook_created_idx
  on public.client_workbook_port_runs (client_id, workbook_key, created_at desc);

drop trigger if exists client_workbook_port_runs_set_updated_at on public.client_workbook_port_runs;
create trigger client_workbook_port_runs_set_updated_at
before update on public.client_workbook_port_runs
for each row
execute function public.set_updated_at();

alter table public.client_workbook_port_runs enable row level security;

drop policy if exists "consultants can select own workbook port runs" on public.client_workbook_port_runs;
create policy "consultants can select own workbook port runs"
on public.client_workbook_port_runs
for select
using (
  exists(
    select 1
    from public.clients c
    where c.id = client_id
      and c.consultant_id = auth.uid()
  )
);

drop policy if exists "consultants can insert own workbook port runs" on public.client_workbook_port_runs;
create policy "consultants can insert own workbook port runs"
on public.client_workbook_port_runs
for insert
with check (
  exists(
    select 1
    from public.clients c
    where c.id = client_id
      and c.consultant_id = auth.uid()
  )
);

drop policy if exists "consultants can update own workbook port runs" on public.client_workbook_port_runs;
create policy "consultants can update own workbook port runs"
on public.client_workbook_port_runs
for update
using (
  exists(
    select 1
    from public.clients c
    where c.id = client_id
      and c.consultant_id = auth.uid()
  )
)
with check (
  exists(
    select 1
    from public.clients c
    where c.id = client_id
      and c.consultant_id = auth.uid()
  )
);

drop policy if exists "consultants can delete own workbook port runs" on public.client_workbook_port_runs;
create policy "consultants can delete own workbook port runs"
on public.client_workbook_port_runs
for delete
using (
  exists(
    select 1
    from public.clients c
    where c.id = client_id
      and c.consultant_id = auth.uid()
  )
);
