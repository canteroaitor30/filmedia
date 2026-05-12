-- Allow authenticated users to find profiles by username/display_name
-- Privacy is enforced in the UI (bio, watchlist, etc.), not at discovery level
drop policy if exists "profiles: ver según privacidad" on profiles;

create policy "profiles: ver según privacidad"
  on profiles for select using (
    auth.uid() is not null
    or id = auth.uid()
  );
