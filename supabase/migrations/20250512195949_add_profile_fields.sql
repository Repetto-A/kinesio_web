-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS sex text CHECK (sex IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS age integer CHECK (age >= 0),
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS clinical_notes text;

-- Update existing admin user if exists
UPDATE profiles
SET 
  first_name = 'Admin',
  last_name = 'User',
  sex = 'other',
  gender = 'other',
  age = 30,
  phone_number = '1234567890'
WHERE email = 'admin@example.com';

-- Create or replace the trigger function to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    role,
    first_name,
    last_name,
    sex,
    gender,
    age,
    phone_number,
    clinical_notes
  )
  VALUES (
    new.id,
    new.email,
    CASE 
      WHEN new.email = 'admin@example.com' THEN 'admin'
      ELSE 'user'
    END,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'sex',
    new.raw_user_meta_data->>'gender',
    (new.raw_user_meta_data->>'age')::integer,
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'clinical_notes'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 