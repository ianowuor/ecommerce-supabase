insert into public.users (id, full_name)
select id, email from auth.users
on conflict (id) do nothing;