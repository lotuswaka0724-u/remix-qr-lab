CREATE TABLE public.prize_asset_overrides (
  prize_id text PRIMARY KEY,
  asset_url text NOT NULL,
  thumb_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.prize_asset_overrides TO service_role;

ALTER TABLE public.prize_asset_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no direct client access" ON public.prize_asset_overrides
  AS PERMISSIVE FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);