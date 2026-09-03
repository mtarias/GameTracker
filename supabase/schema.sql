-- GameTracker: esquema inicial + RLS
-- Ejecutar en Supabase: Dashboard -> SQL Editor -> New query -> pegar y correr.

-- 1. profiles: extiende auth.users con un username público
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cualquiera puede leer perfiles (necesario para resolver /usuario/[username])
create policy "profiles_public_read"
  on public.profiles for select
  using (true);

-- Solo el dueño puede crear/editar su propio perfil
create policy "profiles_owner_insert"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_owner_update"
  on public.profiles for update
  using (auth.uid() = id);

-- Genera un username provisorio (parte local del email + sufijo si hay colision)
-- al crear un usuario en auth.users, y lo inserta en profiles automaticamente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
  candidate_username text;
  suffix integer := 0;
begin
  base_username := regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g');
  if base_username = '' then
    base_username := 'user';
  end if;

  candidate_username := base_username;
  while exists (select 1 from public.profiles where username = candidate_username) loop
    suffix := suffix + 1;
    candidate_username := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, username) values (new.id, candidate_username);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. user_games: coleccion de juegos por usuario
create type public.game_status as enum (
  'backlog', 'wishlist', 'playing', 'completed', 'abandoned', 'endless'
);

create table if not exists public.user_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  igdb_id integer not null,
  title text not null,
  cover_url text,
  status public.game_status not null default 'backlog',
  start_date date,
  end_date date,
  release_date date,
  story_length_hours numeric(5,1),
  completion_percentage integer check (completion_percentage between 0 and 100),
  description text,
  screenshots text[],
  platforms text[],
  video_url text,
  custom_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists user_games_user_status_order_idx
  on public.user_games (user_id, status, custom_order);

alter table public.user_games enable row level security;

-- Cualquiera puede leer (necesario para la vista publica /usuario/[username])
create policy "user_games_public_read"
  on public.user_games for select
  using (true);

-- Solo el dueño puede insertar/editar/borrar sus propios juegos
create policy "user_games_owner_insert"
  on public.user_games for insert
  with check (auth.uid() = user_id);

create policy "user_games_owner_update"
  on public.user_games for update
  using (auth.uid() = user_id);

create policy "user_games_owner_delete"
  on public.user_games for delete
  using (auth.uid() = user_id);

-- 3. twitch_auth_cache: fila unica con el token vigente de IGDB
-- Sin RLS abierta: solo el service_role (usado por la Edge Function) puede leer/escribir.
create table if not exists public.twitch_auth_cache (
  id integer primary key default 1,
  access_token text,
  expires_at timestamptz,
  constraint single_row check (id = 1)
);

alter table public.twitch_auth_cache enable row level security;
-- No se crean policies: por defecto, con RLS activo y sin policies, nadie (excepto
-- el service_role, que bypassea RLS) puede leer ni escribir esta tabla.
