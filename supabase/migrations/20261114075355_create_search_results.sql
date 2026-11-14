-- Latest web search result per city and service, reused for 30 days (ARCHITECTURE 2.5, ADR-11).

create table public.search_results (
  city_id text not null,
  service_id text not null,
  -- SearchResponse after the business rules, without savedId.
  response jsonb not null,
  -- Time of the web search; the 30-day validity is checked against it when reading.
  searched_at timestamptz not null,
  primary key (city_id, service_id)
);

-- Only the server (Secret Key, which bypasses RLS) may access the table; no policies on purpose.
alter table public.search_results enable row level security;
