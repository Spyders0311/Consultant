create table if not exists public.client_financial_snapshots (
  client_id uuid primary key references public.clients(id) on delete cascade,
  snapshot jsonb not null default '{}'::jsonb,
  provenance jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists client_financial_snapshots_updated_idx
  on public.client_financial_snapshots (updated_at desc);

drop trigger if exists client_financial_snapshots_set_updated_at on public.client_financial_snapshots;
create trigger client_financial_snapshots_set_updated_at
before update on public.client_financial_snapshots
for each row
execute function public.set_updated_at();

alter table public.client_financial_snapshots enable row level security;

drop policy if exists "consultants can select own client snapshots" on public.client_financial_snapshots;
create policy "consultants can select own client snapshots"
on public.client_financial_snapshots
for select
using (
  exists (
    select 1 from public.clients c
    where c.id = client_financial_snapshots.client_id and c.consultant_id = auth.uid()
  )
);

drop policy if exists "consultants can upsert own client snapshots" on public.client_financial_snapshots;
create policy "consultants can upsert own client snapshots"
on public.client_financial_snapshots
for all
using (
  exists (
    select 1 from public.clients c
    where c.id = client_financial_snapshots.client_id and c.consultant_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.clients c
    where c.id = client_financial_snapshots.client_id and c.consultant_id = auth.uid()
  )
);
