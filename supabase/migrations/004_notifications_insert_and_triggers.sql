-- Allow users to insert notifications where they are the actor
create policy "notifications: insertar como actor"
  on notifications for insert with check (actor_id = auth.uid());

-- Trigger: notify followers when a friend reviews something in their watchlist
create or replace function notify_friend_reviewed_watchlist()
returns trigger as $$
begin
  insert into notifications (user_id, type, actor_id, media_type, external_id, review_id)
  select um.user_id, 'friend_reviewed_watchlist', NEW.user_id, NEW.media_type, NEW.external_id, NEW.id
  from user_media um
  join follows f on f.follower_id = um.user_id and f.following_id = NEW.user_id
  where um.media_type = NEW.media_type
    and um.external_id = NEW.external_id
    and um.user_id != NEW.user_id
  on conflict do nothing;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_friend_reviewed_watchlist on reviews;
create trigger trg_notify_friend_reviewed_watchlist
  after insert on reviews
  for each row execute function notify_friend_reviewed_watchlist();
