-- Habilitar MFA para todos los usuarios
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Crear tabla para almacenar factores de autenticación
CREATE TABLE IF NOT EXISTS auth.mfa_factors (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('totp', 'sms', 'email')),
    status text NOT NULL DEFAULT 'unverified' CHECK (status IN ('unverified', 'verified')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Crear tabla para almacenar desafíos MFA
CREATE TABLE IF NOT EXISTS auth.mfa_challenges (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    factor_id uuid NOT NULL REFERENCES auth.mfa_factors(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    verified_at timestamptz,
    ip_address inet
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS mfa_factors_user_id_idx ON auth.mfa_factors(user_id);
CREATE INDEX IF NOT EXISTS mfa_challenges_factor_id_idx ON auth.mfa_challenges(factor_id);

-- Habilitar políticas de seguridad
ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

-- Políticas para mfa_factors
CREATE POLICY "Users can view their own MFA factors"
    ON auth.mfa_factors
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own MFA factors"
    ON auth.mfa_factors
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own MFA factors"
    ON auth.mfa_factors
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own MFA factors"
    ON auth.mfa_factors
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Políticas para mfa_challenges
CREATE POLICY "Users can view their own MFA challenges"
    ON auth.mfa_challenges
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.mfa_factors
            WHERE auth.mfa_factors.id = auth.mfa_challenges.factor_id
            AND auth.mfa_factors.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own MFA challenges"
    ON auth.mfa_challenges
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.mfa_factors
            WHERE auth.mfa_factors.id = auth.mfa_challenges.factor_id
            AND auth.mfa_factors.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own MFA challenges"
    ON auth.mfa_challenges
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.mfa_factors
            WHERE auth.mfa_factors.id = auth.mfa_challenges.factor_id
            AND auth.mfa_factors.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.mfa_factors
            WHERE auth.mfa_factors.id = auth.mfa_challenges.factor_id
            AND auth.mfa_factors.user_id = auth.uid()
        )
    );

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION auth.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER handle_mfa_factors_updated_at
    BEFORE UPDATE ON auth.mfa_factors
    FOR EACH ROW
    EXECUTE FUNCTION auth.handle_updated_at();

-- Configurar MFA para requerir al menos un factor
ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS mfa_enabled boolean DEFAULT false;

-- Función para verificar si un usuario tiene MFA habilitado
CREATE OR REPLACE FUNCTION auth.check_mfa_enabled(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.mfa_factors
        WHERE auth.mfa_factors.user_id = check_mfa_enabled.user_id
        AND auth.mfa_factors.status = 'verified'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 