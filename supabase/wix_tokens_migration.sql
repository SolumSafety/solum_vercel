CREATE TABLE IF NOT EXISTS public.wix_tokens (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  wix_member_id  TEXT NOT NULL,
  access_token   TEXT NOT NULL,
  refresh_token  TEXT,
  expires_at     TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.wix_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_all_wix_tokens" ON public.wix_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "own_wix_tokens"          ON public.wix_tokens FOR SELECT TO authenticated USING (auth.uid() = user_id);
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS monthly_download_limit INTEGER DEFAULT 20;
SELECT 'done' AS status;
