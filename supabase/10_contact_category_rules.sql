-- 10_contact_category_rules.sql
-- Permite que el bot recuerde a qué categoría pertenece cada persona recurrente

CREATE TABLE IF NOT EXISTS public.contact_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    category TEXT NOT NULL,
    usage_count INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, contact_name)
);

-- RLS
ALTER TABLE public.contact_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver sus propias reglas de contacto"
ON public.contact_rules FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden insertar sus propias reglas de contacto"
ON public.contact_rules FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias reglas de contacto"
ON public.contact_rules FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propias reglas de contacto"
ON public.contact_rules FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Actualizar la función de contexto para que devuelva las reglas aprendidas
CREATE OR REPLACE FUNCTION public.get_financial_context_by_whatsapp(p_phone text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_metadata jsonb;
    v_initial_balance numeric := 0;
    v_savings_goal numeric := 0;
    
    v_total_income numeric := 0;
    v_total_expense numeric := 0;
    v_total_savings_deposit numeric := 0;
    v_total_savings_withdrawal numeric := 0;
    v_total_balance_adjustment numeric := 0;
    
    v_available_balance numeric := 0;
    v_current_savings numeric := 0;
    
    v_expenses_by_category json;
    v_learned_rules json;
    
    v_clean_phone text;
BEGIN
    -- Limpiar el teléfono que llega de WhatsApp
    v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');

    -- 1. Encontrar al usuario por su número de WhatsApp
    SELECT id, raw_user_meta_data 
    INTO v_user_id, v_metadata
    FROM auth.users
    WHERE regexp_replace(raw_user_meta_data->>'whatsapp_number', '\D', '', 'g') LIKE '%' || RIGHT(v_clean_phone, 9)
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- 2. Extraer datos iniciales del Onboarding
    v_initial_balance := COALESCE((v_metadata->>'initial_balance')::numeric, 0);
    v_savings_goal := COALESCE((v_metadata->>'savings_goal')::numeric, 0);

    -- 3. Sumar transacciones reales
    SELECT 
        COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0),
        COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0),
        COALESCE(SUM(amount) FILTER (WHERE type = 'savings_deposit'), 0),
        COALESCE(SUM(amount) FILTER (WHERE type = 'savings_withdrawal'), 0),
        COALESCE(SUM(amount) FILTER (WHERE type = 'balance_adjustment'), 0)
    INTO 
        v_total_income,
        v_total_expense,
        v_total_savings_deposit,
        v_total_savings_withdrawal,
        v_total_balance_adjustment
    FROM public.transactions
    WHERE user_id = v_user_id;

    -- 4. Gastos por categoría este mes
    SELECT json_object_agg(category, total_amount)
    INTO v_expenses_by_category
    FROM (
        SELECT category, SUM(amount) as total_amount
        FROM public.transactions
        WHERE user_id = v_user_id 
          AND type = 'expense'
          AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
        GROUP BY category
    ) sub;

    v_expenses_by_category := COALESCE(v_expenses_by_category, '{}'::json);

    -- 5. Reglas aprendidas de contactos (frecuencia >= 2)
    SELECT json_object_agg(contact_name, category)
    INTO v_learned_rules
    FROM public.contact_rules
    WHERE user_id = v_user_id AND usage_count >= 2;

    v_learned_rules := COALESCE(v_learned_rules, '{}'::json);

    -- 6. Calcular métricas finales
    v_available_balance := v_initial_balance + v_total_income - v_total_expense - v_total_savings_deposit + v_total_savings_withdrawal + v_total_balance_adjustment;
    v_current_savings := v_total_savings_deposit - v_total_savings_withdrawal;

    -- 7. Retornar JSON completo
    RETURN json_build_object(
        'user_id', v_user_id,
        'initial_balance', v_initial_balance,
        'savings_goal', v_savings_goal,
        'total_income', v_total_income,
        'total_expense', v_total_expense,
        'available_balance', v_available_balance,
        'current_savings', v_current_savings,
        'expenses_by_category_this_month', v_expenses_by_category,
        'learned_rules', v_learned_rules
    );
END;
$$;
