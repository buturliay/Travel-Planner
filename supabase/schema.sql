-- Travel Planner schema
-- Run this in the Supabase SQL editor after creating a project.

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  destination text not null,
  start_date date not null,
  end_date date not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  constraint trips_date_order check (end_date >= start_date)
);

create table public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  date date not null,
  time time,
  title text not null,
  location text not null default '',
  notes text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  date date not null,
  category text not null,
  description text not null,
  amount numeric(12, 2) not null,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  constraint expenses_amount_nonnegative check (amount >= 0)
);

create index trips_user_id_idx on public.trips (user_id);
create index itinerary_items_trip_date_idx on public.itinerary_items (trip_id, date, sort_order);
create index expenses_trip_date_idx on public.expenses (trip_id, date);

create or replace function public.set_trip_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$;

create trigger trips_set_user_id
before insert on public.trips
for each row
execute function public.set_trip_user_id();

create or replace function public.keep_trip_user_id()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.user_id := old.user_id;
  return new;
end;
$$;

create trigger trips_keep_user_id
before update on public.trips
for each row
execute function public.keep_trip_user_id();

alter table public.trips enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.expenses enable row level security;

create policy "trips_select_own"
on public.trips
for select
to authenticated
using (auth.uid() = user_id);

create policy "trips_insert_own"
on public.trips
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "trips_update_own"
on public.trips
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "trips_delete_own"
on public.trips
for delete
to authenticated
using (auth.uid() = user_id);

create policy "itinerary_select_own"
on public.itinerary_items
for select
to authenticated
using (
  exists (
    select 1
    from public.trips
    where trips.id = itinerary_items.trip_id
      and trips.user_id = auth.uid()
  )
);

create policy "itinerary_insert_own"
on public.itinerary_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.trips
    where trips.id = itinerary_items.trip_id
      and trips.user_id = auth.uid()
  )
);

create policy "itinerary_update_own"
on public.itinerary_items
for update
to authenticated
using (
  exists (
    select 1
    from public.trips
    where trips.id = itinerary_items.trip_id
      and trips.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trips
    where trips.id = itinerary_items.trip_id
      and trips.user_id = auth.uid()
  )
);

create policy "itinerary_delete_own"
on public.itinerary_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.trips
    where trips.id = itinerary_items.trip_id
      and trips.user_id = auth.uid()
  )
);

create policy "expenses_select_own"
on public.expenses
for select
to authenticated
using (
  exists (
    select 1
    from public.trips
    where trips.id = expenses.trip_id
      and trips.user_id = auth.uid()
  )
);

create policy "expenses_insert_own"
on public.expenses
for insert
to authenticated
with check (
  exists (
    select 1
    from public.trips
    where trips.id = expenses.trip_id
      and trips.user_id = auth.uid()
  )
);

create policy "expenses_update_own"
on public.expenses
for update
to authenticated
using (
  exists (
    select 1
    from public.trips
    where trips.id = expenses.trip_id
      and trips.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trips
    where trips.id = expenses.trip_id
      and trips.user_id = auth.uid()
  )
);

create policy "expenses_delete_own"
on public.expenses
for delete
to authenticated
using (
  exists (
    select 1
    from public.trips
    where trips.id = expenses.trip_id
      and trips.user_id = auth.uid()
  )
);

grant select, insert, update, delete on public.trips to authenticated;
grant select, insert, update, delete on public.itinerary_items to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
