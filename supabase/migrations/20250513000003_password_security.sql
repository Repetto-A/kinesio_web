-- Crear tabla para almacenar el estado de las contraseñas
CREATE TABLE IF NOT EXISTS public.password_security (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    last_password_change timestamptz NOT NULL DEFAULT now(),
    password_strength_score integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.password_security ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view their own password security"
    ON public.password_security
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own password security"
    ON public.password_security
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Función para actualizar el timestamp de cambio de contraseña
CREATE OR REPLACE FUNCTION public.handle_password_change()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.password_security (user_id, last_password_change)
    VALUES (NEW.id, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        last_password_change = now(),
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para detectar cambios de contraseña
CREATE TRIGGER on_password_change
    AFTER INSERT OR UPDATE OF encrypted_password
    ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_password_change();

-- Función para verificar la fortaleza de la contraseña
CREATE OR REPLACE FUNCTION public.check_password_strength(password text)
RETURNS integer AS $$
DECLARE
    score integer := 0;
BEGIN
    -- Longitud mínima
    IF length(password) >= 8 THEN
        score := score + 1;
    END IF;
    
    -- Contiene mayúsculas
    IF password ~ '[A-Z]' THEN
        score := score + 1;
    END IF;
    
    -- Contiene minúsculas
    IF password ~ '[a-z]' THEN
        score := score + 1;
    END IF;
    
    -- Contiene números
    IF password ~ '[0-9]' THEN
        score := score + 1;
    END IF;
    
    -- Contiene caracteres especiales
    IF password ~ '[^A-Za-z0-9]' THEN
        score := score + 1;
    END IF;
    
    RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar el score de fortaleza de la contraseña
CREATE OR REPLACE FUNCTION public.update_password_strength()
RETURNS trigger AS $$
BEGIN
    UPDATE public.password_security
    SET 
        password_strength_score = public.check_password_strength(NEW.encrypted_password),
        updated_at = now()
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar el score de fortaleza
CREATE TRIGGER on_password_strength_update
    AFTER INSERT OR UPDATE OF encrypted_password
    ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_password_strength(); 