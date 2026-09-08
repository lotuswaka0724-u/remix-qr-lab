CREATE TABLE public.class_state (
  id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.class_state TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_state TO authenticated;
GRANT ALL ON public.class_state TO service_role;

ALTER TABLE public.class_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_state readable by everyone" ON public.class_state FOR SELECT USING (true);
CREATE POLICY "class_state insertable by everyone" ON public.class_state FOR INSERT WITH CHECK (true);
CREATE POLICY "class_state updatable by everyone" ON public.class_state FOR UPDATE USING (true) WITH CHECK (true);

INSERT INTO public.class_state (id, data) VALUES ('default', '{}'::jsonb);

ALTER TABLE public.class_state REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_state;