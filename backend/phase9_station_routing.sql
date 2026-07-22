-- 1. Create stations table
CREATE TABLE IF NOT EXISTS stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. Seed initial stations
INSERT INTO stations (name, slug, sort_order) VALUES 
  ('Kitchen', 'kitchen', 1),
  ('Tea Counter', 'tea_counter', 2),
  ('Ready Stock', 'ready_stock', 3)
ON CONFLICT (slug) DO NOTHING;

-- 3. Alter menu_items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS station_id uuid REFERENCES stations(id);

-- If preparation_type doesn't exist, this will add it. 
-- Note: It seems it exists from a previous phase but as uppercase ('KITCHEN', 'READY', 'BARISTA').
-- We'll drop the old constraint if it exists (for safety, though usually it's just a text column)
-- and update existing rows to lowercase to match the new check constraint.
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_items' AND column_name='preparation_type') THEN
    ALTER TABLE menu_items ADD COLUMN preparation_type text DEFAULT 'kitchen';
  END IF;
END $$;

-- 4. Backfill existing menu_items
-- Normalize existing prep types
UPDATE menu_items 
SET preparation_type = 
  CASE 
    WHEN is_kitchen_item = false THEN 'ready'
    WHEN preparation_type IN ('READY') THEN 'ready'
    ELSE 'kitchen' 
  END;

-- Assign station_id based on preparation_type
UPDATE menu_items 
SET station_id = (SELECT id FROM stations WHERE slug = 'ready_stock')
WHERE preparation_type = 'ready';

UPDATE menu_items 
SET station_id = (SELECT id FROM stations WHERE slug = 'kitchen')
WHERE preparation_type = 'kitchen';

-- Drop the constraint if it existed from previous iteration to replace it
ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS chk_prep_type;

-- Add Check Constraint for menu_items.preparation_type
ALTER TABLE menu_items ADD CONSTRAINT chk_prep_type CHECK (preparation_type IN ('kitchen', 'ready'));

-- 5. Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id),
  name text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  station_id uuid REFERENCES stations(id),
  preparation_type text CHECK (preparation_type IN ('kitchen', 'ready')),
  item_status text DEFAULT 'pending' CHECK (item_status IN ('pending', 'preparing', 'prepared', 'ready_to_serve', 'served')),
  customizations jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_station_status ON order_items(station_id, item_status);
