-- Phase 2.1: per-client worksheet completion + draft persistence

create table if not exists public.client_worksheet_status (
  client_id uuid not null references public.clients(id) on delete cascade,
  worksheet_key text not null,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'complete')),
  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc'::text, now()),
  completed_by uuid references auth.users(id) on delete set null,
  primary key (client_id, worksheet_key)
);

create index if not exists client_worksheet_status_client_idx
  on public.client_worksheet_status (client_id);

create index if not exists client_worksheet_status_client_status_idx
  on public.client_worksheet_status (client_id, status);

drop trigger if exists client_worksheet_status_set_updated_at on public.client_worksheet_status;
create trigger client_worksheet_status_set_updated_at
before update on public.client_worksheet_status
for each row
execute function public.set_updated_at();

alter table public.client_worksheet_status enable row level security;

drop policy if exists "consultants can manage own worksheet status" on public.client_worksheet_status;
create policy "consultants can manage own worksheet status"
on public.client_worksheet_status
for all
using (
  exists (
    select 1
    from public.clients c
    where c.id = client_worksheet_status.client_id
      and c.consultant_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.clients c
    where c.id = client_worksheet_status.client_id
      and c.consultant_id = auth.uid()
  )
);

create table if not exists public.client_worksheet_drafts (
  client_id uuid not null references public.clients(id) on delete cascade,
  worksheet_key text not null,
  draft_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc'::text, now()),
  primary key (client_id, worksheet_key)
);

create index if not exists client_worksheet_drafts_client_idx
  on public.client_worksheet_drafts (client_id);

drop trigger if exists client_worksheet_drafts_set_updated_at on public.client_worksheet_drafts;
create trigger client_worksheet_drafts_set_updated_at
before update on public.client_worksheet_drafts
for each row
execute function public.set_updated_at();

alter table public.client_worksheet_drafts enable row level security;

drop policy if exists "consultants can manage own worksheet drafts" on public.client_worksheet_drafts;
create policy "consultants can manage own worksheet drafts"
on public.client_worksheet_drafts
for all
using (
  exists (
    select 1
    from public.clients c
    where c.id = client_worksheet_drafts.client_id
      and c.consultant_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.clients c
    where c.id = client_worksheet_drafts.client_id
      and c.consultant_id = auth.uid()
  )
);

grant select, insert, update, delete on table
  public.client_worksheet_status,
  public.client_worksheet_drafts
to authenticated;
