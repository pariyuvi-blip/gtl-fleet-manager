-- PostgreSQL / Supabase schema for server-backed GTL deployment
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  gstin text,
  state text default 'KARNATAKA',
  state_code text default '29',
  created_at timestamptz default now()
);
create table own_trips (
  id text primary key,
  trip_date date not null,
  truck_number text not null default 'KA07AD0725',
  from_place text, to_place text,
  customer_id uuid references customers(id),
  freight numeric(12,2) default 0,
  payment_received_by text,
  pod_received text check (pod_received in ('YES','NO','NA')),
  invoice_applicable text check (invoice_applicable in ('YES','NO')),
  invoice_generated text check (invoice_generated in ('YES','NO','NA')),
  invoice_number text,
  remarks text,
  updated_at timestamptz default now()
);
create table commission_trips (
  id text primary key,
  trip_date date not null,
  trip_no text, truck_number text not null, driver_name text,
  from_place text, to_place text,
  customer_id uuid references customers(id),
  paying_to_driver numeric(12,2) default 0,
  paid_so_far numeric(12,2) default 0,
  pending numeric(12,2) generated always as (paying_to_driver-paid_so_far) stored,
  customer_pays_wo_gst numeric(12,2) default 0,
  customer_pays_w_gst numeric(12,2) default 0,
  commission numeric(12,2) generated always as ((customer_pays_wo_gst-paying_to_driver)*0.10) stored,
  net_income numeric(12,2) generated always as ((customer_pays_wo_gst-paying_to_driver)*0.90) stored,
  pod_received text check (pod_received in ('YES','NO','NA')),
  invoice_applicable text check (invoice_applicable in ('YES','NO')),
  invoice_generated text check (invoice_generated in ('YES','NO','NA')),
  invoice_number text,
  remarks text,
  updated_at timestamptz default now()
);
