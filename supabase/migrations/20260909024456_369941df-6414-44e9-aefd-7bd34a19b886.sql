CREATE TABLE public.student_directory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL UNIQUE,
  fiscal_year integer NOT NULL,
  grade integer NOT NULL,
  class_number integer NOT NULL,
  attendance_number integer NOT NULL,
  name text NOT NULL,
  login_number text GENERATED ALWAYS AS (
    fiscal_year::text || grade::text || class_number::text || attendance_number::text
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.student_directory TO service_role;
ALTER TABLE public.student_directory ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: anon/authenticated clients must never read or write
-- this table directly. All access goes through trusted server-side code using
-- the service role after verifying the session (teacher or the student itself).

CREATE INDEX student_directory_login_number_idx ON public.student_directory (login_number);

CREATE TABLE public.login_attempts (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.login_attempts TO service_role;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: server-side rate limiting only.
