-- Enable RLS on system_control table
ALTER TABLE system_control ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "system_control_select_policy" ON system_control;
DROP POLICY IF EXISTS "system_control_update_policy" ON system_control;
DROP POLICY IF EXISTS "system_control_insert_policy" ON system_control;

-- Create permissive policy for SELECT operations
CREATE POLICY "system_control_select_policy" ON system_control
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create permissive policy for UPDATE operations
CREATE POLICY "system_control_update_policy" ON system_control
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create permissive policy for INSERT operations (if needed)
CREATE POLICY "system_control_insert_policy" ON system_control
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON system_control TO anon;
GRANT ALL ON system_control TO authenticated;
