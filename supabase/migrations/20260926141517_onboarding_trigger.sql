-- Custom SQL migration file, put your code below! --
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_full text := trim(coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    ''));
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    split_part(v_full, ' ', 1),
    trim(substr(v_full, length(split_part(v_full, ' ', 1)) + 1))
  );
  return new;
end $$;