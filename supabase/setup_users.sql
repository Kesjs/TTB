-- ==========================================
-- SETUP SCRIPT: CREATE ADMIN ACCOUNT ONLY
-- ==========================================
-- INSTRUCTIONS:
-- 1. Create admin user via Supabase Dashboard > Authentication > Users
--    Email: kenkenbabatounde@gmail.com
--    Password: Topadmin2?
-- 2. Then run this script in Supabase SQL Editor to sync admin role
-- 3. Jury accounts will be created from the admin dashboard in the app
-- ==========================================

-- ==========================================
-- STEP 1: SYNC ADMIN ROLE
-- ==========================================
INSERT INTO public.profiles (id, full_name, phone, role)
SELECT
  id,
  'Administrateur Principal',
  '+22900000000',
  'admin'
FROM auth.users
WHERE email = 'kenkenbabatounde@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'Administrateur Principal';

-- ==========================================
-- STEP 2: SYNC ADMIN ROLE TO AUTH METADATA
-- ==========================================
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'::jsonb
)
WHERE email = 'kenkenbabatounde@gmail.com';

-- ==========================================
-- STEP 3: INITIALIZE SYSTEM CONTROL
-- ==========================================
INSERT INTO public.system_control (id, current_phase, is_voting_open)
VALUES (1, 'preselection', false)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- STEP 4: VERIFY ADMIN SETUP
-- ==========================================
SELECT
  u.id,
  u.email,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'kenkenbabatounde@gmail.com';
