-- ブラウザからの直接アクセスを完全に遮断する
ALTER PUBLICATION supabase_realtime DROP TABLE public.class_state;

DROP POLICY IF EXISTS "class_state readable by everyone" ON public.class_state;
DROP POLICY IF EXISTS "class_state insertable by everyone" ON public.class_state;
DROP POLICY IF EXISTS "class_state updatable by everyone" ON public.class_state;

REVOKE ALL ON public.class_state FROM anon;
REVOKE ALL ON public.class_state FROM authenticated;
GRANT ALL ON public.class_state TO service_role;

-- 児童ごとの合言葉（ハッシュのみ保存）
CREATE TABLE public.student_codes (
  student_id text PRIMARY KEY,
  code_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.student_codes TO service_role;

ALTER TABLE public.student_codes ENABLE ROW LEVEL SECURITY;
-- ポリシーなし = anon / authenticated からは一切読み書きできない