CREATE TABLE public.push_subscriptions (
  endpoint text PRIMARY KEY,
  student_id text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX push_subscriptions_student_idx ON public.push_subscriptions(student_id);
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;