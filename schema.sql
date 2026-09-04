-- GTL Fleet Manager normalized Supabase schema (v8 reference)
-- Production tables are row-based; app_state is legacy and is no longer used by v8.

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  gstin text,
  state text,
  state_code text,
  legacy_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.own_trips (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null unique,
  trip_date date not null,
  truck_number text not null default 'KA07AD0725',
  from_location text,
  to_location text,
  customer_id uuid references public.customers(id),
  customer_name text,
  freight numeric not null default 0,
  payment_received_by text,
  pod_received text not null default 'NO' check (pod_received in ('YES','NO','NA')),
  invoice_applicable text not null default 'NO' check (invoice_applicable in ('YES','NO','NA')),
  invoice_generated text not null default 'NO' check (invoice_generated in ('YES','NO','NA')),
  invoice_number text,
  remarks text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.commission_trips (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null unique,
  trip_date date not null,
  truck_number text,
  driver_name text,
  from_location text,
  to_location text,
  customer_id uuid references public.customers(id),
  customer_name text,
  paying_to_driver numeric not null default 0,
  paid_so_far numeric not null default 0,
  customer_pays_wo_gst numeric not null default 0,
  customer_pays_w_gst numeric not null default 0,
  pending numeric generated always as (paying_to_driver-paid_so_far) stored,
  commission numeric generated always as (case when upper(coalesce(customer_name,'')) like 'VAHINI POLYTECH INDUSTRIES PVT LTD%' then greatest(customer_pays_wo_gst-paying_to_driver,0)*0.10 else 0 end) stored,
  net_income numeric generated always as (customer_pays_wo_gst-paying_to_driver-case when upper(coalesce(customer_name,'')) like 'VAHINI POLYTECH INDUSTRIES PVT LTD%' then greatest(customer_pays_wo_gst-paying_to_driver,0)*0.10 else 0 end) stored,
  pod_received text not null default 'NO' check (pod_received in ('YES','NO','NA')),
  invoice_applicable text not null default 'NO' check (invoice_applicable in ('YES','NO','NA')),
  invoice_generated text not null default 'NO' check (invoice_generated in ('YES','NO','NA')),
  invoice_number text,
  remarks text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Production also uses database sequences/triggers to assign GTL-OWN-#### and GTL-COM-#### IDs.
-- Supabase Realtime is enabled for customers, own_trips and commission_trips.
-- RLS restricts access to approved authenticated GTL users.
