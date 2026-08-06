-- 1. Eliminar la restricción actual de tipos
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- 2. Crear la nueva restricción incluyendo 'balance_adjustment'
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('income', 'expense', 'savings_deposit', 'savings_withdrawal', 'balance_adjustment'));
