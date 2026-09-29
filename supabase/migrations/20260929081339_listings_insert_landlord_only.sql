-- Custom SQL migration file, put your code below! --
-- Enkel een kotbaas mag een kot aanmaken, en enkel op zijn eigen naam.
-- De policy uit auth_rls liet elke ingelogde gebruiker (ook een student) een kot invoegen.
create or replace function public.is_landlord()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'landlord'
  );
$$;

drop policy "insert own listing" on public.listings;
create policy "insert own listing" on public.listings for insert
  with check ((select auth.uid()) = landlord_id and (select public.is_landlord()));
