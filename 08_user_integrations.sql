-- Crear tabla para integraciones de usuarios (ej. Google)
CREATE TABLE user_integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL, -- 'google'
    refresh_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Habilitar RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view their own integrations"
    ON user_integrations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
    ON user_integrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
    ON user_integrations FOR UPDATE
    USING (auth.uid() = user_id);

-- Función para actualizar updated_at
CREATE TRIGGER update_user_integrations_modtime
    BEFORE UPDATE ON user_integrations
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Crear tabla para evitar procesar correos duplicados
CREATE TABLE email_sync_logs (
    message_id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE email_sync_logs ENABLE ROW LEVEL SECURITY;
