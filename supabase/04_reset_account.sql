-- 1. Borrar absolutamente todos los movimientos (ingresos, gastos, ahorros)
DELETE FROM public.transactions;

-- 2. Reiniciar el estado de la cuenta (borrar número, balances y metas)
-- Esto forzará a que la aplicación te muestre la pantalla de Bienvenida (Onboarding) de nuevo
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data 
  - 'onboarding_completed' 
  - 'whatsapp_number' 
  - 'initial_balance' 
  - 'monthly_income' 
  - 'savings_goal';
