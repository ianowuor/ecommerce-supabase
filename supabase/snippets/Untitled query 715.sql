-- Using a 'jobs' table to simulate a queue
CREATE TABLE public.job_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type text NOT NULL,
  payload jsonb,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Update the place_order RPC to add a job to the queue
-- Add this line inside your place_order function:
-- INSERT INTO public.job_queue (job_type, payload) VALUES ('check_inventory', json_build_object('order_id', v_order_id));