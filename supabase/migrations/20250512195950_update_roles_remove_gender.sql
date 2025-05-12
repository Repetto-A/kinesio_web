-- Update role check constraint to include worker role
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'worker', 'admin'));

-- Drop gender column
ALTER TABLE profiles
DROP COLUMN IF EXISTS gender;

-- Update trigger function to handle worker role
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
    age,
    phone_number,
    clinical_notes
  )
  VALUES (
    new.id,
    new.email,
    CASE 
      WHEN new.email = 'admin@example.com' THEN 'admin'
      WHEN new.email LIKE '%@staff.com' THEN 'worker'
      ELSE 'user'
    END,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'sex',
    (new.raw_user_meta_data->>'age')::integer,
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'clinical_notes'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing policies to include worker role where needed
DROP POLICY IF EXISTS "Users can view appointments" ON appointments;
CREATE POLICY "Users can view appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('worker', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can update appointments" ON appointments;
CREATE POLICY "Users can update appointments"
  ON appointments
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('worker', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('worker', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can delete appointments" ON appointments;
CREATE POLICY "Users can delete appointments"
  ON appointments
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('worker', 'admin')
    )
  ); 