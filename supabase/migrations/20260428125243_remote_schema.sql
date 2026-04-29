alter table "public"."job_queue" enable row level security;

alter table "public"."users" enable row level security;


  create policy "Users can view their own orders"
  on "public"."orders"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own profile"
  on "public"."users"
  as permissive
  for select
  to public
using ((auth.uid() = id));



