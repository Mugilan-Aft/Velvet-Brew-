-- Phase 5: CRM, Inventory, and Analytics tracking

-- 1. Customers Table (Loyalty Program)
CREATE TABLE IF NOT EXISTS public.customers (
    phone_number TEXT PRIMARY KEY,
    name TEXT,
    beans_balance INTEGER DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allow unrestricted API access for simplicity in demo
DROP POLICY IF EXISTS "Allow all for customers" ON public.customers;
CREATE POLICY "Allow all for customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;


-- 2. Inventory Items
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT NOT NULL, -- e.g. 'grams', 'ml', 'units'
    stock_level DECIMAL DEFAULT 0,
    minimum_threshold DECIMAL DEFAULT 0, -- Alert level
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP POLICY IF EXISTS "Allow all for inventory" ON public.inventory;
CREATE POLICY "Allow all for inventory" ON public.inventory FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;


-- 3. Recipes (Bill of Materials linking Menu Items to Inventory)
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE,
    quantity_required DECIMAL NOT NULL
);

DROP POLICY IF EXISTS "Allow all for recipes" ON public.recipes;
CREATE POLICY "Allow all for recipes" ON public.recipes FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;


-- 4. Modifying Orders Table to track Served Time
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS served_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.tabs ADD COLUMN IF NOT EXISTS customer_phone TEXT REFERENCES public.customers(phone_number);

-- Seed some default inventory logic for testing alerts
INSERT INTO public.inventory (id, name, unit, stock_level, minimum_threshold)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Espresso Beans', 'grams', 200, 1000),
  ('22222222-2222-2222-2222-222222222222', 'Oat Milk', 'ml', 5000, 1000),
  ('33333333-3333-3333-3333-333333333333', 'Pastry Box', 'units', 15, 10)
ON CONFLICT (id) DO NOTHING;
