-- Custom SQL migration file, put your code below! --

-- 1. Enkel webp tot 5 MB: de browser comprimeert altijd naar webp.
update storage.buckets
set file_size_limit = 5242880, allowed_mime_types = array['image/webp']
where id = 'listing-photos';

-- 2. Is de eerste map van dit pad ({listing_id}/...) een kot van de ingelogde gebruiker?
--    Vergelijk als tekst: een cast naar uuid geeft een error bij een raar pad.
create or replace function public.owns_listing_folder(object_name text)
returns boolean language sql stable set search_path = '' as $$
  select exists (
    select 1 from public.listings l
    where l.id::text = (storage.foldername(object_name))[1]
      and l.landlord_id = (select auth.uid())
  );
$$;

-- 3. Policies. Lezen via de publieke URL heeft geen policy nodig (publieke bucket),
--    maar list() en remove() via de API wel een select-policy.
create policy "listing photos: owner reads"
on storage.objects for select to authenticated
using (bucket_id = 'listing-photos' and public.owns_listing_folder(name));

create policy "listing photos: owner uploads"
on storage.objects for insert to authenticated
with check (bucket_id = 'listing-photos' and public.owns_listing_folder(name));

create policy "listing photos: owner updates"
on storage.objects for update to authenticated
using (bucket_id = 'listing-photos' and public.owns_listing_folder(name))
with check (bucket_id = 'listing-photos' and public.owns_listing_folder(name));

create policy "listing photos: owner deletes"
on storage.objects for delete to authenticated
using (bucket_id = 'listing-photos' and public.owns_listing_folder(name));
