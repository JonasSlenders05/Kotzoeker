-- Custom SQL migration file, put your code below! --
-- 1. profiles.id hangt aan auth.users
alter table public.profiles
  add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;

-- 2. Profiel + rolprofiel aanmaken bij signup
--    signUp({ options: { data: { role, first_name, last_name } } })
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_role public.user_role := case
    when new.raw_user_meta_data->>'role' = 'landlord' then 'landlord'::public.user_role
    else 'student'::public.user_role end;   -- nooit 'admin' via signup
begin
  insert into public.profiles (id, email, role, first_name, last_name)
  values (new.id, new.email, v_role,
          coalesce(new.raw_user_meta_data->>'first_name', ''),
          coalesce(new.raw_user_meta_data->>'last_name', ''));
  if v_role = 'landlord' then
    insert into public.landlord_profiles (profile_id) values (new.id);
  else
    insert into public.student_profiles (profile_id) values (new.id);
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. E-mail in profiles gelijk houden met auth.users
create or replace function public.handle_user_email_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end $$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- 4. RLS aan op elke tabel in public (zonder policy = geen toegang via Supabase-client)
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- 5. Referentiedata: iedereen mag lezen
create policy "read institutions" on public.institutions for select using (true);
create policy "read campuses"     on public.campuses     for select using (true);
create policy "read amenities"    on public.amenities    for select using (true);

-- 6. Profielen: eigen profiel lezen en beperkt wijzigen (rol en e-mail niet)
create policy "read own profile" on public.profiles for select
  using ((select auth.uid()) = id);
create policy "update own profile" on public.profiles for update
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
revoke update on public.profiles from authenticated;
grant update (first_name, last_name, avatar_path, phone, preferred_language)
  on public.profiles to authenticated;

-- 7. Listings: gepubliceerde zijn publiek, kotbaas beheert eigen koten
create policy "read listings" on public.listings for select
  using (status = 'published' or (select auth.uid()) = landlord_id);
create policy "insert own listing" on public.listings for insert
  with check ((select auth.uid()) = landlord_id);
create policy "update own listing" on public.listings for update
  using ((select auth.uid()) = landlord_id) with check ((select auth.uid()) = landlord_id);
create policy "delete own listing" on public.listings for delete
  using ((select auth.uid()) = landlord_id);

-- 8. Berichten: enkel deelnemers van de conversatie
create policy "read own conversations" on public.conversations for select
  using ((select auth.uid()) in (student_id, landlord_id));
create policy "read messages" on public.messages for select using (
  exists (select 1 from public.conversations c
          where c.id = conversation_id
            and (select auth.uid()) in (c.student_id, c.landlord_id)));
create policy "send messages" on public.messages for insert with check (
  sender_id = (select auth.uid())
  and exists (select 1 from public.conversations c
              where c.id = conversation_id
                and (select auth.uid()) in (c.student_id, c.landlord_id)));

-- 9. Storage-buckets
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;