-- Trigger: new follower notification
create or replace function notify_new_follower()
returns trigger as $$
begin
  insert into notifications (user_id, type, actor_id)
  values (NEW.following_id, 'new_follower', NEW.follower_id)
  on conflict do nothing;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_new_follower on follows;
create trigger trg_notify_new_follower
  after insert on follows
  for each row execute function notify_new_follower();

-- Trigger: friend rated same media notification
-- Fires when someone marks media as watched; notifies mutual followers who already have it watched
create or replace function notify_friend_rated_same()
returns trigger as $$
begin
  -- Only notify when status changes to 'watched'
  if NEW.status = 'watched' then
    insert into notifications (user_id, type, actor_id, media_type, external_id)
    select f.follower_id, 'friend_rated_same', NEW.user_id, NEW.media_type, NEW.external_id
    from follows f
    join user_media um on um.user_id = f.follower_id
      and um.media_type = NEW.media_type
      and um.external_id = NEW.external_id
      and um.status = 'watched'
    where f.following_id = NEW.user_id
      and f.follower_id != NEW.user_id
    on conflict do nothing;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_friend_rated_same on user_media;
create trigger trg_notify_friend_rated_same
  after insert or update on user_media
  for each row execute function notify_friend_rated_same();
