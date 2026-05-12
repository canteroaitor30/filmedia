-- ============================================================
-- FILMEDIA — Schema completo + RLS
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ENUMS
create type media_type as enum ('movie', 'series', 'anime');
create type media_status as enum ('watched', 'pending');
create type privacy_level as enum ('private', 'followers', 'public');
create type platform as enum (
  'Netflix', 'HBO Max', 'Prime', 'Disney+', 'Apple TV+',
  'Filmin', 'Movistar+', 'Crunchyroll', 'Cine', 'Otro'
);
create type notification_type as enum (
  'new_follower', 'friend_reviewed_watchlist',
  'friend_rated_same', 'comment_on_review'
);

-- EXTENSIONS
create extension if not exists pg_trgm;

-- ============================================================
-- PROFILES
-- ============================================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  privacy_profile privacy_level default 'private' not null,
  privacy_watchlist privacy_level default 'followers' not null,
  privacy_reviews privacy_level default 'followers' not null,
  onboarding_completed boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index profiles_username_trgm on profiles using gin (username gin_trgm_ops);

-- ============================================================
-- INVITATION CODES
-- ============================================================
create table invitation_codes (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  created_by uuid references profiles(id) on delete set null,
  used_by uuid references profiles(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- USER MEDIA (watchlist + ratings)
-- ============================================================
create table user_media (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  media_type media_type not null,
  external_id integer not null,
  status media_status not null,
  rating numeric(3,1) check (rating >= 1 and rating <= 5),
  platform platform,
  watched_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id, media_type, external_id)
);

create index user_media_user_id on user_media(user_id);
create index user_media_external on user_media(media_type, external_id);

-- ============================================================
-- REVIEWS
-- ============================================================
create table reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  media_type media_type not null,
  external_id integer not null,
  content text not null,
  has_spoilers boolean default false not null,
  privacy privacy_level default 'followers' not null,
  edited_at timestamptz,
  created_at timestamptz default now() not null,
  unique (user_id, media_type, external_id)
);

create index reviews_user_id on reviews(user_id);
create index reviews_media on reviews(media_type, external_id);

-- ============================================================
-- REVIEW LIKES
-- ============================================================
create table review_likes (
  review_id uuid references reviews(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (review_id, user_id)
);

-- ============================================================
-- REVIEW COMMENTS (threading 1 nivel)
-- ============================================================
create table review_comments (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references reviews(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  parent_id uuid references review_comments(id) on delete cascade,
  content text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index review_comments_review_id on review_comments(review_id);

-- ============================================================
-- CUSTOM LISTS
-- ============================================================
create table custom_lists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  privacy privacy_level default 'private' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table custom_list_items (
  id uuid default gen_random_uuid() primary key,
  list_id uuid references custom_lists(id) on delete cascade not null,
  media_type media_type not null,
  external_id integer not null,
  position integer not null,
  created_at timestamptz default now() not null,
  unique (list_id, media_type, external_id)
);

-- ============================================================
-- FOLLOWS (asimétrico tipo Letterboxd)
-- ============================================================
create table follows (
  follower_id uuid references profiles(id) on delete cascade not null,
  following_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

create index follows_following_id on follows(following_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  type notification_type not null,
  actor_id uuid references profiles(id) on delete cascade not null,
  review_id uuid references reviews(id) on delete cascade,
  media_type media_type,
  external_id integer,
  read boolean default false not null,
  created_at timestamptz default now() not null
);

create index notifications_user_id on notifications(user_id, read);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();
create trigger user_media_updated_at before update on user_media
  for each row execute function update_updated_at();
create trigger reviews_updated_at before update on reviews
  for each row execute function update_updated_at();
create trigger review_comments_updated_at before update on review_comments
  for each row execute function update_updated_at();
create trigger custom_lists_updated_at before update on custom_lists
  for each row execute function update_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- RLS — habilitar en todas las tablas
-- ============================================================
alter table profiles enable row level security;
alter table invitation_codes enable row level security;
alter table user_media enable row level security;
alter table reviews enable row level security;
alter table review_likes enable row level security;
alter table review_comments enable row level security;
alter table custom_lists enable row level security;
alter table custom_list_items enable row level security;
alter table follows enable row level security;
alter table notifications enable row level security;

-- ============================================================
-- RLS POLICIES — PROFILES
-- ============================================================
create policy "profiles: ver según privacidad"
  on profiles for select using (
    id = auth.uid()
    or privacy_profile = 'public'
    or (
      privacy_profile = 'followers'
      and exists (select 1 from follows where follower_id = auth.uid() and following_id = profiles.id)
    )
  );

create policy "profiles: editar propio"
  on profiles for update using (id = auth.uid());

-- ============================================================
-- RLS POLICIES — INVITATION CODES
-- ============================================================
create policy "invitations: ver las propias o las que me usaron"
  on invitation_codes for select using (
    created_by = auth.uid() or used_by = auth.uid()
  );

create policy "invitations: crear las propias"
  on invitation_codes for insert with check (created_by = auth.uid());

create policy "invitations: usar código válido"
  on invitation_codes for update using (
    used_by is null and expires_at > now()
  );

-- ============================================================
-- RLS POLICIES — USER MEDIA
-- ============================================================
create policy "user_media: ver según privacidad del perfil"
  on user_media for select using (
    user_id = auth.uid()
    or exists (
      select 1 from profiles p where p.id = user_media.user_id and (
        p.privacy_watchlist = 'public'
        or (
          p.privacy_watchlist = 'followers'
          and exists (select 1 from follows where follower_id = auth.uid() and following_id = user_media.user_id)
        )
      )
    )
  );

create policy "user_media: gestionar propio"
  on user_media for all using (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES — REVIEWS
-- ============================================================
create policy "reviews: ver según privacidad"
  on reviews for select using (
    user_id = auth.uid()
    or privacy = 'public'
    or (
      privacy = 'followers'
      and exists (select 1 from follows where follower_id = auth.uid() and following_id = reviews.user_id)
    )
  );

create policy "reviews: gestionar propias"
  on reviews for all using (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES — REVIEW LIKES
-- ============================================================
create policy "review_likes: ver los de reseñas visibles"
  on review_likes for select using (
    exists (select 1 from reviews r where r.id = review_likes.review_id)
  );

create policy "review_likes: gestionar propios"
  on review_likes for all using (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES — REVIEW COMMENTS
-- ============================================================
create policy "review_comments: ver los de reseñas visibles"
  on review_comments for select using (
    exists (select 1 from reviews r where r.id = review_comments.review_id)
  );

create policy "review_comments: gestionar propios"
  on review_comments for all using (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES — CUSTOM LISTS
-- ============================================================
create policy "custom_lists: ver según privacidad"
  on custom_lists for select using (
    user_id = auth.uid()
    or privacy = 'public'
    or (
      privacy = 'followers'
      and exists (select 1 from follows where follower_id = auth.uid() and following_id = custom_lists.user_id)
    )
  );

create policy "custom_lists: gestionar propias"
  on custom_lists for all using (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES — CUSTOM LIST ITEMS
-- ============================================================
create policy "custom_list_items: ver items de listas visibles"
  on custom_list_items for select using (
    exists (select 1 from custom_lists l where l.id = custom_list_items.list_id)
  );

create policy "custom_list_items: gestionar items propios"
  on custom_list_items for all using (
    exists (select 1 from custom_lists l where l.id = custom_list_items.list_id and l.user_id = auth.uid())
  );

-- ============================================================
-- RLS POLICIES — FOLLOWS
-- ============================================================
create policy "follows: ver todos"
  on follows for select using (true);

create policy "follows: gestionar propios"
  on follows for all using (follower_id = auth.uid());

-- ============================================================
-- RLS POLICIES — NOTIFICATIONS
-- ============================================================
create policy "notifications: ver propias"
  on notifications for select using (user_id = auth.uid());

create policy "notifications: marcar como leídas"
  on notifications for update using (user_id = auth.uid());
