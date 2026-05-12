create table if not exists media_cache (
  media_type text not null,
  external_id integer not null,
  title text not null,
  genres text[] not null default '{}',
  runtime_minutes integer,
  year integer,
  cached_at timestamptz default now() not null,
  primary key (media_type, external_id)
);

alter table media_cache enable row level security;

create policy "media_cache: lectura pública"
  on media_cache for select using (true);

create policy "media_cache: escritura solo servidor"
  on media_cache for all using (true);
