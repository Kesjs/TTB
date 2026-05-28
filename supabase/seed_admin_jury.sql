-- ==========================================
-- SEED SCRIPT: CREATE INITIAL ADMIN AND JURY ACCOUNTS
-- ==========================================
-- IMPORTANT: Run this script in Supabase SQL Editor to create initial admin and jury accounts
-- Replace the email/password values with your actual credentials before running

-- ==========================================
-- 1. CREATE ADMIN ACCOUNT
-- ==========================================

-- Step 1: Create the auth user (run this in Supabase Auth or use the dashboard)
-- For security, create the admin user via Supabase Dashboard > Authentication > Users
-- Email: admin@toptalentbenin.com
-- Password: [YOUR_SECURE_PASSWORD]

-- Step 2: Create the profile with admin role
-- Replace 'USER_UUID_FROM_AUTH' with the actual UUID from the auth.users table
INSERT INTO public.profiles (id, full_name, phone, role)
VALUES (
  'USER_UUID_FROM_AUTH', -- Replace with actual UUID from auth.users
  'Administrateur Principal',
  '+22900000000',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'Administrateur Principal';

-- ==========================================
-- 2. CREATE JURY ACCOUNTS
-- ==========================================

-- Jury Member 1
-- Replace 'JURY_1_UUID_FROM_AUTH' with actual UUID from auth.users
INSERT INTO public.profiles (id, full_name, phone, role)
VALUES (
  'JURY_1_UUID_FROM_AUTH', -- Replace with actual UUID from auth.users
  'Membre Jury 1',
  '+22900000001',
  'jury'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'jury',
  full_name = 'Membre Jury 1';

-- Jury Member 2
-- Replace 'JURY_2_UUID_FROM_AUTH' with actual UUID from auth.users
INSERT INTO public.profiles (id, full_name, phone, role)
VALUES (
  'JURY_2_UUID_FROM_AUTH', -- Replace with actual UUID from auth.users
  'Membre Jury 2',
  '+22900000002',
  'jury'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'jury',
  full_name = 'Membre Jury 2';

-- ==========================================
-- 3. VERIFY ROLE SYNC
-- ==========================================

-- After running the above, the PostgreSQL trigger should automatically
-- sync the role to auth.users.app_metadata. Verify with:

-- SELECT id, email, app_metadata FROM auth.users WHERE email IN (
--   'admin@toptalentbenin.com',
--   'jury1@toptalentbenin.com',
--   'jury2@toptalentbenin.com'
-- );

-- ==========================================
-- 4. MANUAL ROLE SYNC (IF TRIGGER FAILED)
-- ==========================================

-- If the trigger didn't work, manually sync the role to app_metadata:

-- UPDATE auth.users
-- SET app_metadata = jsonb_set(
--   COALESCE(app_metadata, '{}'::jsonb),
--   '{role}',
--   'admin'::jsonb
-- )
-- WHERE email = 'admin@toptalentbenin.com';

-- UPDATE auth.users
-- SET app_metadata = jsonb_set(
--   COALESCE(app_metadata, '{}'::jsonb),
--   '{role}',
--   'jury'::jsonb
-- )
-- WHERE email IN ('jury1@toptalentbenin.com', 'jury2@toptalentbenin.com');

-- ==========================================
-- 5. INITIALIZE SYSTEM CONTROL
-- ==========================================

-- Ensure system_control has a single row
INSERT INTO public.system_control (id, current_phase, is_voting_open)
VALUES (1, 'preselection', false)
ON CONFLICT (id) DO NOTHING;
