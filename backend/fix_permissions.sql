-- Grant permissions for new tables to the API roles
GRANT ALL ON stations TO anon, authenticated, service_role;
GRANT ALL ON order_items TO anon, authenticated, service_role;

-- If RLS was somehow enabled, let's disable it so it matches the other tables (like orders, menu_items)
ALTER TABLE stations DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
