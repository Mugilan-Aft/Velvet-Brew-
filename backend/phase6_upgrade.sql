-- Phase 6: Core Operations Upgrades

-- 1. Create Dynamic Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allow unrestricted API access for simplicity in demo
DROP POLICY IF EXISTS "Allow all for categories" ON public.categories;
CREATE POLICY "Allow all for categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Seed existing categories to prevent breaking the frontend menus
INSERT INTO public.categories (name) VALUES 
('Coffee'), 
('Tea & Matcha'), 
('Pastries'), 
('Signature Cold')
ON CONFLICT (name) DO NOTHING;


-- 2. Modify Orders Table to support "Holding" status 
-- (Requires dropping the old check constraint and re-adding)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('Holding', 'New', 'Preparing', 'Ready', 'Served'));
