-- Saved suppliers: the shared list of suppliers saved from search results (ARCHITECTURE 2.5).

create table public.saved_suppliers (
  id uuid primary key default gen_random_uuid(),
  country_id text not null check (country_id in ('UA', 'MD')),
  city_id text not null,
  service_id text not null,
  name text not null,
  name_key text not null,
  website_domain text,
  description text,
  address text,
  phone text,
  email text,
  website text,
  registration_or_license_number text,
  years_active integer,
  business_clients_count integer,
  business_client_examples jsonb not null default '[]'::jsonb,
  criteria jsonb not null,
  meets_all_criteria boolean not null,
  sources jsonb not null default '[]'::jsonb,
  status text not null default 'new' check (status in ('new', 'contacted', 'approved', 'not_suitable')),
  note text not null default '' check (char_length(note) <= 1000),
  saved_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Reserved for the future weekly re-check (ARCHITECTURE 2.12).
  last_checked_at timestamptz,
  constraint saved_suppliers_name_unique unique (city_id, service_id, name_key)
);

-- Same website in the same city and service counts as the same supplier (PRD FR7.2).
create unique index saved_suppliers_website_unique
  on public.saved_suppliers (city_id, service_id, website_domain)
  where website_domain is not null;

create index saved_suppliers_saved_at_idx on public.saved_suppliers (saved_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger saved_suppliers_set_updated_at
  before update on public.saved_suppliers
  for each row execute function public.set_updated_at();

-- Only the server (Secret Key, which bypasses RLS) may access the table; no policies on purpose.
alter table public.saved_suppliers enable row level security;
