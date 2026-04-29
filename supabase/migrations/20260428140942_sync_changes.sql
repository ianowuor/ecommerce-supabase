drop policy "Users can view their own orders" on "public"."orders";

drop policy "Users can view own profile" on "public"."users";

alter table "public"."job_queue" disable row level security;

alter table "public"."users" disable row level security;


