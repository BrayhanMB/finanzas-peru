-- Crea la tabla para gastos/pagos recurrentes
CREATE TABLE public.recurring_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilita RLS (Row Level Security)
ALTER TABLE public.recurring_payments ENABLE ROW LEVEL SECURITY;

-- Crea las políticas de seguridad para que cada usuario solo vea/edite sus propios pagos
CREATE POLICY "Users can view own recurring payments"
    ON public.recurring_payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring payments"
    ON public.recurring_payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring payments"
    ON public.recurring_payments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring payments"
    ON public.recurring_payments FOR DELETE
    USING (auth.uid() = user_id);
