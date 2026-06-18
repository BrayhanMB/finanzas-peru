-- Función para obtener todo el contexto financiero de un usuario basado en su WhatsApp
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
    
    v_available_balance numeric := 0;
    v_current_savings numeric := 0;
BEGIN
    -- 1. Encontrar al usuario por su número de WhatsApp
    SELECT id, raw_user_meta_data 
    INTO v_user_id, v_metadata
    FROM auth.users
    WHERE raw_user_meta_data->>'whatsapp_number' = p_phone
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
        COALESCE(SUM(amount) FILTER (WHERE type = 'savings_withdrawal'), 0)
    INTO 
        v_total_income,
        v_total_expense,
        v_total_savings_deposit,
        v_total_savings_withdrawal
    FROM public.transactions
    WHERE user_id = v_user_id;

    -- 4. Calcular métricas finales
    -- El dinero disponible baja si mandas al ahorro (deposit), pero sube si retiras del ahorro (withdrawal)
    v_available_balance := v_initial_balance + v_total_income - v_total_expense - v_total_savings_deposit + v_total_savings_withdrawal;
    
    -- El ahorro actual es simplemente lo depositado menos lo retirado
    v_current_savings := v_total_savings_deposit - v_total_savings_withdrawal;

    -- 5. Retornar un JSON completo para que la Edge Function lo procese
    RETURN json_build_object(
        'user_id', v_user_id,
        'initial_balance', v_initial_balance,
        'savings_goal', v_savings_goal,
        'total_income', v_total_income,
        'total_expense', v_total_expense,
        'available_balance', v_available_balance,
        'current_savings', v_current_savings
    );
END;
$$;
