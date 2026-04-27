select exists (
   select from information_schema.tables 
   where table_schema = 'public' 
   and table_name = 'job_queue'
);