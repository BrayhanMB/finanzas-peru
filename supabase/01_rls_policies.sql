-- 1. Habilitar RLS en la tabla
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas anteriores por si acaso
DROP POLICY IF EXISTS "Los usuarios solo pueden ver sus propios gastos" ON public.transactions;
DROP POLICY IF EXISTS "Los usuarios solo pueden insertar sus propios gastos" ON public.transactions;
DROP POLICY IF EXISTS "Los usuarios solo pueden editar sus propios gastos" ON public.transactions;
DROP POLICY IF EXISTS "Los usuarios solo pueden borrar sus propios gastos" ON public.transactions;

-- 3. Crear política de Selección (Lectura)
CREATE POLICY "Los usuarios solo pueden ver sus propios gastos"
ON public.transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Crear política de Inserción
CREATE POLICY "Los usuarios solo pueden insertar sus propios gastos"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Crear política de Actualización
CREATE POLICY "Los usuarios solo pueden editar sus propios gastos"
ON public.transactions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Crear política de Eliminación
CREATE POLICY "Los usuarios solo pueden borrar sus propios gastos"
ON public.transactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
