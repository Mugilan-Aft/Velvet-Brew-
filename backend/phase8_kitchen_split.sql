-- Phase 8: Kitchen vs Service Items Split

-- Add the column for determining if an item routes to the kitchen
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS is_kitchen_item BOOLEAN DEFAULT true;

-- Update the schema cache just in case
NOTIFY pgrst, 'reload schema';
