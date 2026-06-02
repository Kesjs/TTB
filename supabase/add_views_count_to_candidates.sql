-- Add views_count column to candidates table
-- This column tracks how many times a candidate's video has been viewed

DO $$
BEGIN
    -- Check if column exists before adding
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'views_count'
    ) THEN
        ALTER TABLE public.candidates 
        ADD COLUMN views_count INT DEFAULT 0;
        
        RAISE NOTICE 'Column views_count added to candidates table';
    ELSE
        RAISE NOTICE 'Column views_count already exists in candidates table';
    END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN public.candidates.views_count IS 'Number of times the candidate video has been viewed';
