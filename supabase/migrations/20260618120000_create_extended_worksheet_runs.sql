create table if not exists public.client_valuation_runs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  scenario text not null,
  inputs jsonb not null default '{}'::jsonb,
  outputs jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists client_valuation_runs_client_created_idx
  on public.client_valuation_runs (client_id, created_at desc);

create table if not exists public.client_goals_runs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  goal_type text not null,
  inputs jsonb not null default '{}'::jsonb,
  outputs jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists client_goals_runs_client_created_idx
  on public.client_goals_runs (client_id, created_at desc);

create table if not exists public.client_matrix_questionnaire_runs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  matrix_key text not null,
  inputs jsonb not null default '{}'::jsonb,
  outputs jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists client_matrix_questionnaire_runs_client_key_idx
  on public.client_matrix_questionnaire_runs (client_id, matrix_key, created_at desc);

create table if not exists public.client_form_document_runs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  form_type text not null,
  invoice_type text,
  inputs jsonb not null default '{}'::jsonb,
  outputs jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists client_form_document_runs_client_created_idx
  on public.client_form_document_runs (client_id, created_at desc);

alter table public.client_valuation_runs enable row level security;
alter table public.client_goals_runs enable row level security;
alter table public.client_matrix_questionnaire_runs enable row level security;
alter table public.client_form_document_runs enable row level security;

create policy "consultants manage valuation runs" on public.client_valuation_runs for all
using (exists (select 1 from public.clients c where c.id = client_valuation_runs.client_id and c.consultant_id = auth.uid()))
with check (exists (select 1 from public.clients c where c.id = client_valuation_runs.client_id and c.consultant_id = auth.uid()));

create policy "consultants manage goals runs" on public.client_goals_runs for all
using (exists (select 1 from public.clients c where c.id = client_goals_runs.client_id and c.consultant_id = auth.uid()))
with check (exists (select 1 from public.clients c where c.id = client_goals_runs.client_id and c.consultant_id = auth.uid()));

create policy "consultants manage matrix runs" on public.client_matrix_questionnaire_runs for all
using (exists (select 1 from public.clients c where c.id = client_matrix_questionnaire_runs.client_id and c.consultant_id = auth.uid()))
with check (exists (select 1 from public.clients c where c.id = client_matrix_questionnaire_runs.client_id and c.consultant_id = auth.uid()));

create policy "consultants manage form runs" on public.client_form_document_runs for all
using (exists (select 1 from public.clients c where c.id = client_form_document_runs.client_id and c.consultant_id = auth.uid()))
with check (exists (select 1 from public.clients c where c.id = client_form_document_runs.client_id and c.consultant_id = auth.uid()));

grant all on public.client_valuation_runs to authenticated;
grant all on public.client_goals_runs to authenticated;
grant all on public.client_matrix_questionnaire_runs to authenticated;
grant all on public.client_form_document_runs to authenticated;
