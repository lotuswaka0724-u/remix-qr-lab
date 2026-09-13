CREATE TABLE public.custom_prizes (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  rarity text NOT NULL DEFAULT 'N',
  asset_url text NOT NULL,
  description text NOT NULL DEFAULT '',
  obtainable boolean NOT NULL DEFAULT true,
  sort integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.custom_prizes TO service_role;

ALTER TABLE public.custom_prizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no direct client access" ON public.custom_prizes
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);