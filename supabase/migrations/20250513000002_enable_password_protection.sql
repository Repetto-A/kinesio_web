-- Habilitar la protección contra contraseñas comprometidas
ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS password_compromised boolean DEFAULT false;

-- Crear función para verificar si una contraseña está comprometida
CREATE OR REPLACE FUNCTION auth.check_password_compromised(password text)
RETURNS boolean AS $$
DECLARE
    hash text;
    prefix text;
    suffix text;
    count integer;
BEGIN
    -- Calcular el hash SHA-1 de la contraseña
    hash := encode(digest(password, 'sha1'), 'hex');
    
    -- Obtener el prefijo y sufijo del hash
    prefix := substring(hash from 1 for 5);
    suffix := substring(hash from 6);
    
    -- Verificar contra la API de HaveIBeenPwned
    -- Nota: En producción, esto debería hacerse a través de un servicio externo
    -- que maneje la API de HaveIBeenPwned de manera segura
    SELECT COUNT(*) INTO count
    FROM auth.compromised_passwords
    WHERE hash_prefix = prefix AND hash_suffix = suffix;
    
    RETURN count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear tabla para almacenar hashes de contraseñas comprometidas
CREATE TABLE IF NOT EXISTS auth.compromised_passwords (
    hash_prefix text NOT NULL,
    hash_suffix text NOT NULL,
    count integer NOT NULL,
    last_updated timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (hash_prefix, hash_suffix)
);

-- Crear índice para mejorar el rendimiento de las búsquedas
CREATE INDEX IF NOT EXISTS compromised_passwords_hash_prefix_idx 
ON auth.compromised_passwords(hash_prefix);

-- Habilitar RLS en la tabla de contraseñas comprometidas
ALTER TABLE auth.compromised_passwords ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir solo lectura a usuarios autenticados
CREATE POLICY "Allow authenticated users to read compromised passwords"
    ON auth.compromised_passwords
    FOR SELECT
    TO authenticated
    USING (true);

-- Crear trigger para verificar contraseñas al registrarse o cambiar contraseña
CREATE OR REPLACE FUNCTION auth.check_password_on_change()
RETURNS trigger AS $$
BEGIN
    IF NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password THEN
        IF auth.check_password_compromised(NEW.encrypted_password) THEN
            NEW.password_compromised := true;
        ELSE
            NEW.password_compromised := false;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para la tabla auth.users
CREATE TRIGGER check_password_compromised
    BEFORE INSERT OR UPDATE OF encrypted_password
    ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auth.check_password_on_change();

-- Crear función para actualizar la base de datos de contraseñas comprometidas
CREATE OR REPLACE FUNCTION auth.update_compromised_passwords()
RETURNS void AS $$
BEGIN
    -- Aquí iría la lógica para actualizar la base de datos
    -- desde la API de HaveIBeenPwned
    -- Esta función debería ser llamada periódicamente por un job
    RAISE NOTICE 'Actualizando base de datos de contraseñas comprometidas...';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 