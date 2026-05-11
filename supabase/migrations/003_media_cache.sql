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
