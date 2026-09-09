CREATE TABLE public.student_game (
  student_id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT ALL ON public.student_game TO service_role;
ALTER TABLE public.student_game ENABLE ROW LEVEL SECURITY;