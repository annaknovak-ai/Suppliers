-- Saved suppliers become personal: each row belongs to one Google user (ARCHITECTURE 2.5, ADR-12).
-- Existing rows have no owner, so they are removed (user's decision). Not backward compatible on purpose.
delete from public.saved_suppliers;

alter table public.saved_suppliers
  add column user_id uuid not null references auth.users (id) on delete cascade;

-- Duplicates are now prevented per user (PRD FR7.2): two users may save the same supplier.
alter table public.saved_suppliers drop constraint saved_suppliers_name_unique;
alter table public.saved_suppliers
  add constraint saved_suppliers_name_unique unique (user_id, city_id, service_id, name_key);

drop index public.saved_suppliers_website_unique;
create unique index saved_suppliers_website_unique
  on public.saved_suppliers (user_id, city_id, service_id, website_domain)
  where website_domain is not null;

drop index public.saved_suppliers_saved_at_idx;
create index saved_suppliers_user_saved_at_idx on public.saved_suppliers (user_id, saved_at desc);
