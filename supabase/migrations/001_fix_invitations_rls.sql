drop policy if exists "invitations: usar código válido" on invitation_codes;

create policy "invitations: usar código válido"
  on invitation_codes for update
  using (used_by is null and expires_at > now())
  with check (used_by = auth.uid());

update invitation_codes
set used_by = 'a5f988f6-bd59-42a1-b36e-c78a005e1bf6',
    used_at = now()
where code = 'FILMEDIA01';
