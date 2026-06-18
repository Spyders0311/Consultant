create table if not exists public.client_twelve_month_analysis_runs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  analysis_type text not null,
  inputs jsonb not null default '{}'::jsonb,
  outputs jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists client_twelve_month_analysis_runs_client_type_created_idx
  on public.client_twelve_month_analysis_runs (client_id, analysis_type, created_at desc);

drop trigger if exists client_twelve_month_analysis_runs_set_updated_at on public.client_twelve_month_analysis_runs;
create trigger client_twelve_month_analysis_runs_set_updated_at
before update on public.client_twelve_month_analysis_runs
for each row
execute function public.set_updated_at();

alter table public.client_twelve_month_analysis_runs enable row level security;

drop policy if exists "consultants can manage own twelve month analysis runs" on public.client_twelve_month_analysis_runs;
create policy "consultants can manage own twelve month analysis runs"
on public.client_twelve_month_analysis_runs
for all
using (
  exists (select 1 from public.clients c where c.id = client_twelve_month_analysis_runs.client_id and c.consultant_id = auth.uid())
)
with check (
  exists (select 1 from public.clients c where c.id = client_twelve_month_analysis_runs.client_id and c.consultant_id = auth.uid())
);
