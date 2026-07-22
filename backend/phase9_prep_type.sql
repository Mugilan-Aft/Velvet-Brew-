-- Phase 9: Preparation Types

-- 1. Add preparation_type to menu_items
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS preparation_type VARCHAR(50) DEFAULT 'KITCHEN';

-- Migrate existing data based on the old is_kitchen_item column
UPDATE public.menu_items 
SET preparation_type = CASE 
  WHEN is_kitchen_item = false THEN 'READY' 
  ELSE 'KITCHEN' 
END;

-- 2. Add prep_status JSONB to orders table for independent tracking
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS prep_status JSONB DEFAULT '{}'::jsonb;

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
