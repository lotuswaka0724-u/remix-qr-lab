CREATE POLICY "no direct client access" ON public.class_state FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "no direct client access" ON public.login_attempts FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "no direct client access" ON public.student_codes FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "no direct client access" ON public.student_directory FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);