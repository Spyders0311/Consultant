-- Phase 3A: Basic Client Info profile fields (EIN, entity, address, partners jsonb)

alter table public.clients
  add column if not exists ein text,
  add column if not exists entity_type text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists address_postal_code text,
  add column if not exists client_profile jsonb not null default '{}'::jsonb;
