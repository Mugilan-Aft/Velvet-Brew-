-- Drop the old constraint
ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS menu_items_dietary_tag_check;

-- Add the new constraint that includes 'egg mixed'
ALTER TABLE menu_items ADD CONSTRAINT menu_items_dietary_tag_check 
  CHECK (dietary_tag IN ('none', 'veg', 'non-veg', 'vegan', 'egg mixed'));
