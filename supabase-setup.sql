-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor)

-- Profiles table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  display_name text,
  bio text,
  genre text,
  location text,
  instagram text,
  soundcloud text,
  spotify text,
  website text,
  avatar_url text,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Assets table
create table if not exists public.assets (
  id uuid default gen_random_uuid() primary key,
  artist_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('mix', 'video', 'photo', 'press_kit')),
  url text not null,
  size bigint,
  created_at timestamptz default now()
);

-- Availability table
create table if not exists public.availability (
  id uuid default gen_random_uuid() primary key,
  artist_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  available boolean default true,
  notes text,
  unique(artist_id, date)
);

-- Venue requests table
create table if not exists public.venue_requests (
  id uuid default gen_random_uuid() primary key,
  artist_id uuid references public.profiles(id) on delete cascade,
  venue_name text not null,
  venue_email text not null,
  event_date date not null,
  message text,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now()
);

-- RLS Policies

-- Profiles: anyone can read, only owner can write
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Assets: public read, owner write
alter table public.assets enable row level security;

create policy "Public assets are viewable by everyone"
  on public.assets for select using (true);

create policy "Artists can manage their own assets"
  on public.assets for all using (auth.uid() = artist_id);

-- Availability: public read, owner write
alter table public.availability enable row level security;

create policy "Availability is viewable by everyone"
  on public.availability for select using (true);

create policy "Artists can manage their own availability"
  on public.availability for all using (auth.uid() = artist_id);

-- Venue requests: artist can read their own, anyone can insert
alter table public.venue_requests enable row level security;

create policy "Artists can view their own requests"
  on public.venue_requests for select using (auth.uid() = artist_id);

create policy "Artists can update their own requests"
  on public.venue_requests for update using (auth.uid() = artist_id);

create policy "Anyone can submit a booking request"
  on public.venue_requests for insert with check (true);

-- Storage bucket for assets
insert into storage.buckets (id, name, public) values ('assets', 'assets', true)
  on conflict do nothing;

create policy "Anyone can view assets"
  on storage.objects for select using (bucket_id = 'assets');

create policy "Authenticated users can upload assets"
  on storage.objects for insert with check (bucket_id = 'assets' and auth.role() = 'authenticated');

create policy "Users can delete their own assets"
  on storage.objects for delete using (bucket_id = 'assets' and auth.uid()::text = (storage.foldername(name))[1]);
