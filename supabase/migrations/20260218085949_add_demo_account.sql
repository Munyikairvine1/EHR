/*
  # Add Demo Account

  1. Changes
    - Creates a demo user account in auth.users
    - Creates associated staff profile for the demo user
    - Demo account credentials:
      - Email: demo@chitungwizahospital.com
      - Password: Demo123!
      - Role: Doctor
      - Name: Dr. John Musara
      - Specialization: General Medicine
  
  2. Security
    - Demo account has doctor role access
    - Can view and manage patients, appointments, medical records, prescriptions, and lab results
    - Protected by existing RLS policies
*/

-- Create demo user in auth.users
DO $$
DECLARE
  demo_user_id uuid;
BEGIN
  -- Check if demo user already exists
  SELECT id INTO demo_user_id
  FROM auth.users
  WHERE email = 'demo@chitungwizahospital.com';

  -- Only create if user doesn't exist
  IF demo_user_id IS NULL THEN
    -- Insert demo user into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'demo@chitungwizahospital.com',
      crypt('Demo123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Dr. John Musara"}',
      'authenticated',
      'authenticated'
    ) RETURNING id INTO demo_user_id;

    -- Create staff profile for demo user
    INSERT INTO staff (
      user_id,
      first_name,
      last_name,
      role,
      specialization,
      phone,
      email,
      license_number
    ) VALUES (
      demo_user_id,
      'John',
      'Musara',
      'doctor',
      'General Medicine',
      '+263 77 123 4567',
      'demo@chitungwizahospital.com',
      'MD-ZW-12345'
    );
  END IF;
END $$;
