-- Extend clients with contact/location profile fields (P0.4)
alter table public.clients
  add column if not exists primary_contact_name text,
  add column if not exists primary_contact_email text,
  add column if not exists primary_contact_phone text,
  add column if not exists location_city text,
  add column if not exists location_state text,
  add column if not exists profile_notes text;
