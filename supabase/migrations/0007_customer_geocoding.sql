-- Caches geocoded coordinates for a customer's address so the operations
-- map doesn't re-geocode on every page load (Nominatim's usage policy caps
-- at 1 request/second and asks callers to cache results).

alter table public.customers
  add column latitude double precision,
  add column longitude double precision;

comment on column public.customers.latitude is
  'Best-effort geocode of `address` via Nominatim (OpenStreetMap), cached at create/update time. Null if geocoding failed or address is empty — never blocks the customer record.';
