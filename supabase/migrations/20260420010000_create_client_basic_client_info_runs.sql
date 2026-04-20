create table if not exists public.client_basic_client_info_runs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  inputs jsonb not null default '{}'::jsonb,
  outputs jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists client_basic_client_info_runs_client_created_idx
  on public.client_basic_client_info_runs (client_id, created_at desc);

drop trigger if exists client_basic_client_info_runs_set_updated_at on public.client_basic_client_info_runs;
create trigger client_basic_client_info_runs_set_updated_at
before update on public.client_basic_client_info_runs
for each row
execute function public.set_updated_at();

alter table public.client_basic_client_info_runs enable row level security;

drop policy if exists "consultants can select own basic client info runs" on public.client_basic_client_info_runs;
create policy "consultants can select own basic client info runs"
on public.client_basic_client_info_runs
for select
using (
  exists(
    select 1
    from public.clients c
    where c.id = client_id
      and c.consultant_id = auth.uid()
  )
);

drop policy if exists "consultants can insert own basic client info runs" on public.client_basic_client_info_runs;
create policy "consultants can insert own basic client info runs"
on public.client_basic_client_info_runs
for insert
with check (
  exists(
    select 1
    from public.clients c
    where c.id = client_id
      and c.consultant_id = auth.uid()
  )
);

drop policy if exists "consultants can update own basic client info runs" on public.client_basic_client_info_runs;
create policy "consultants can update own basic client info runs"
on public.client_basic_client_info_runs
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

drop policy if exists "consultants can delete own basic client info runs" on public.client_basic_client_info_runs;
create policy "consultants can delete own basic client info runs"
on public.client_basic_client_info_runs
for delete
using (
  exists(
    select 1
    from public.clients c
    where c.id = client_id
      and c.consultant_id = auth.uid()
  )
);
