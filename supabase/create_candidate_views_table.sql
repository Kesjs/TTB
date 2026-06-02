-- Create candidate_views table to track which users/sessions have viewed which candidates
-- This prevents view spamming by ensuring each user/session can only count as one view per candidate

CREATE TABLE IF NOT EXISTS public.candidate_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only view a candidate once
  CONSTRAINT unique_user_view UNIQUE (candidate_id, user_id),
  -- Ensure a session can only view a candidate once
  CONSTRAINT unique_session_view UNIQUE (candidate_id, session_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_candidate_views_candidate_id ON public.candidate_views(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_views_user_id ON public.candidate_views(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_views_session_id ON public.candidate_views(session_id);

-- Enable Row Level Security
ALTER TABLE public.candidate_views ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert views (for tracking)
CREATE POLICY "Anyone can insert candidate views"
  ON public.candidate_views
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Anyone can read views (for analytics)
CREATE POLICY "Anyone can read candidate views"
  ON public.candidate_views
  FOR SELECT
  TO public
  USING (true);

-- Policy: Users can only update their own views
CREATE POLICY "Users can update own views"
  ON public.candidate_views
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE public.candidate_views IS 'Tracks which users/sessions have viewed which candidates to prevent view spamming';
COMMENT ON COLUMN public.candidate_views.user_id IS 'ID of the authenticated user (null for anonymous visitors)';
COMMENT ON COLUMN public.candidate_views.session_id IS 'Session ID for anonymous visitors (generated client-side)';
