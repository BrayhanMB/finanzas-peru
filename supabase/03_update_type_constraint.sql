-- Eliminar la restricción antigua que solo permitía 'income' o 'expense'
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Crear la nueva restricción que permite los 4 tipos de movimientos
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('income', 'expense', 'savings_deposit', 'savings_withdrawal'));
