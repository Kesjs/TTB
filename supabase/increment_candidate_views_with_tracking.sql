-- RPC function to increment candidate views with duplicate prevention
-- This function checks if the user/session has already viewed the candidate before incrementing

CREATE OR REPLACE FUNCTION increment_candidate_views_with_tracking(
  p_candidate_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  view_exists BOOLEAN;
  increment_success BOOLEAN;
BEGIN
  -- Check if a view already exists for this user or session
  SELECT EXISTS(
    SELECT 1 FROM candidate_views
    WHERE candidate_id = p_candidate_id
    AND (user_id = p_user_id OR session_id = p_session_id)
  ) INTO view_exists;

  -- If view doesn't exist, create it and increment the counter
  IF NOT view_exists THEN
    -- Insert the view record
    INSERT INTO candidate_views (candidate_id, user_id, session_id)
    VALUES (p_candidate_id, p_user_id, p_session_id);

    -- Increment the views_count in candidates table
    UPDATE candidates
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = p_candidate_id;

    RETURN TRUE;
  END IF;

  -- View already exists, don't increment
  RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users and public
GRANT EXECUTE ON FUNCTION increment_candidate_views_with_tracking(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_candidate_views_with_tracking(UUID, UUID, TEXT) TO anon;
