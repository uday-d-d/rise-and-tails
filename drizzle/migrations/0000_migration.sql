create type public.app_role as enum ('staff');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.grant_first_staff()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'staff') then
    insert into public.user_roles (user_id, role) values (new.id, 'staff');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_staff after insert on auth.users
for each row execute function public.grant_first_staff();

create table public.ngo_settings (
  id int primary key default 1 check (id = 1),
  name text not null default 'Rise and Tails',
  lat double precision not null default 19.0760,
  lng double precision not null default 72.8777,
  radius_km double precision not null default 25,
  updated_at timestamptz not null default now()
);
grant select on public.ngo_settings to anon, authenticated;
grant update on public.ngo_settings to authenticated;
grant all on public.ngo_settings to service_role;
alter table public.ngo_settings enable row level security;
create policy "public read settings" on public.ngo_settings for select to anon, authenticated using (true);
create policy "staff update settings" on public.ngo_settings for update to authenticated
  using (public.has_role(auth.uid(),'staff')) with check (public.has_role(auth.uid(),'staff'));
insert into public.ngo_settings (id) values (1);

create or replace function public.haversine_km(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
  select 6371 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)))
$$;

create or replace function public.enforce_service_radius()
returns trigger language plpgsql security definer set search_path = public as $$
declare s public.ngo_settings;
begin
  select * into s from public.ngo_settings where id = 1;
  new.distance_km := public.haversine_km(s.lat, s.lng, new.lat, new.lng);
  if new.distance_km > s.radius_km then
    raise exception 'OUT_OF_RADIUS';
  end if;
  new.status := 'pending';
  return new;
end $$;

create table public.adoption_requests (
  id uuid primary key default gen_random_uuid(),
  pet_id text not null,
  pet_name text not null,
  pet_species text not null check (pet_species in ('dog','cat')),
  full_name text not null check (char_length(full_name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 255),
  phone text not null check (char_length(phone) between 5 and 20),
  address text not null check (char_length(address) between 1 and 300),
  city text not null check (char_length(city) between 1 and 100),
  housing_type text not null,
  experience text not null check (char_length(experience) between 1 and 1000),
  lat double precision not null,
  lng double precision not null,
  distance_km double precision,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
grant insert on public.adoption_requests to anon, authenticated;
grant select, update on public.adoption_requests to authenticated;
grant all on public.adoption_requests to service_role;
alter table public.adoption_requests enable row level security;
create policy "anyone can apply" on public.adoption_requests for insert to anon, authenticated with check (true);
create policy "staff read adoptions" on public.adoption_requests for select to authenticated using (public.has_role(auth.uid(),'staff'));
create policy "staff update adoptions" on public.adoption_requests for update to authenticated using (public.has_role(auth.uid(),'staff')) with check (public.has_role(auth.uid(),'staff'));
create trigger adoption_radius before insert on public.adoption_requests for each row execute function public.enforce_service_radius();

create table public.rescue_alerts (
  id uuid primary key default gen_random_uuid(),
  lat double precision not null,
  lng double precision not null,
  address text check (char_length(address) <= 300),
  description text check (char_length(description) <= 1000),
  photo_path text,
  contact text not null check (char_length(contact) between 5 and 20),
  distance_km double precision,
  status text not null default 'pending' check (status in ('pending','dispatched','resolved')),
  created_at timestamptz not null default now()
);
grant insert on public.rescue_alerts to anon, authenticated;
grant select, update on public.rescue_alerts to authenticated;
grant all on public.rescue_alerts to service_role;
alter table public.rescue_alerts enable row level security;
create policy "anyone can alert" on public.rescue_alerts for insert to anon, authenticated
  with check (coalesce(description,'') <> '' or photo_path is not null);
create policy "staff read alerts" on public.rescue_alerts for select to authenticated using (public.has_role(auth.uid(),'staff'));
create policy "staff update alerts" on public.rescue_alerts for update to authenticated using (public.has_role(auth.uid(),'staff')) with check (public.has_role(auth.uid(),'staff'));
create trigger rescue_radius before insert on public.rescue_alerts for each row execute function public.enforce_service_radius();
alter publication supabase_realtime add table public.rescue_alerts;

create policy "anyone upload rescue photos" on storage.objects for insert to anon, authenticated with check (bucket_id = 'rescue-photos');
create policy "staff read rescue photos" on storage.objects for select to authenticated using (bucket_id = 'rescue-photos' and public.has_role(auth.uid(),'staff'));