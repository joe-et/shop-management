-- ==============================================================================
-- ShopFlow Equipment & Inventory Management Database Schema
-- Currency: Ethiopian Birr (ETB / Br)
-- Categories: Household Goods, Housewares, Domestic Equipment
-- ==============================================================================

-- 1. Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create equipment_items table
CREATE TABLE IF NOT EXISTS equipment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL 
        CHECK (category IN ('Household Goods', 'Housewares', 'Domestic Equipment')),
    brand TEXT NOT NULL,
    model TEXT,
    serial_number TEXT,
    condition TEXT NOT NULL DEFAULT 'new' 
        CHECK (condition IN ('new', 'open_box', 'refurbished', 'used_like_new', 'used_good', 'used_fair', 'for_parts')),
    status TEXT NOT NULL DEFAULT 'in_stock' 
        CHECK (status IN ('in_stock', 'sold', 'reserved', 'damaged', 'returned')),
    purchase_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    retail_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    sold_price NUMERIC(14, 2),
    sold_at TIMESTAMPTZ,
    customer_name TEXT,
    customer_phone TEXT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    unit TEXT DEFAULT 'pcs',
    location TEXT DEFAULT 'Main Shop Floor',
    notes TEXT,
    warranty_period_months INTEGER DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_equipment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_equipment_updated_at ON equipment_items;
CREATE TRIGGER trigger_equipment_updated_at
BEFORE UPDATE ON equipment_items
FOR EACH ROW
EXECUTE FUNCTION update_equipment_updated_at();

-- 4. Fast Indexes
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment_items(status);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment_items(category);
CREATE INDEX IF NOT EXISTS idx_equipment_brand ON equipment_items(brand);
CREATE INDEX IF NOT EXISTS idx_equipment_created_at ON equipment_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_equipment_serial ON equipment_items(serial_number);

-- 5. Row Level Security (RLS)
ALTER TABLE equipment_items ENABLE ROW LEVEL SECURITY;

-- Allow anonymous & authenticated access for shop management operations
CREATE POLICY "Allow select on equipment_items"
    ON equipment_items FOR SELECT
    USING (true);

CREATE POLICY "Allow insert on equipment_items"
    ON equipment_items FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow update on equipment_items"
    ON equipment_items FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow delete on equipment_items"
    ON equipment_items FOR DELETE
    USING (true);

-- 6. Enable Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE equipment_items;

-- 7. Clean Database (Ready for custom products)

-- ==============================================================================
-- 8. Audit Logs Table (Activity Tracking & Physical Stocktake Reconciliation)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS inventory_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES equipment_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    action TEXT NOT NULL 
        CHECK (action IN ('item_created', 'item_updated', 'price_changed', 'item_sold', 'partial_sale', 'reverted_to_stock', 'item_deleted', 'stocktake_adjustment')),
    actor TEXT NOT NULL DEFAULT 'Shop Manager',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    details TEXT NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    quantity_change INTEGER,
    financial_impact NUMERIC(14, 2)
);

CREATE INDEX IF NOT EXISTS idx_audit_item_id ON inventory_audit_logs(item_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON inventory_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON inventory_audit_logs(timestamp DESC);

ALTER TABLE inventory_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on inventory_audit_logs"
    ON inventory_audit_logs FOR SELECT USING (true);

CREATE POLICY "Allow public insert on inventory_audit_logs"
    ON inventory_audit_logs FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE inventory_audit_logs;

-- ==============================================================================
-- 9. Shop Operating Expenses Table (Overhead & True Net Profit Tracking)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS shop_operating_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL 
        CHECK (category IN ('Rent', 'Utilities', 'Transport & Freight', 'Staff Wages', 'Supplies & Packaging', 'Maintenance', 'Other')),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    payment_method TEXT NOT NULL DEFAULT 'Cash'
        CHECK (payment_method IN ('Cash', 'Telebirr', 'Bank Transfer / CBE', 'Other')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON shop_operating_expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON shop_operating_expenses(category);

ALTER TABLE shop_operating_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on shop_operating_expenses"
    ON shop_operating_expenses FOR SELECT USING (true);

CREATE POLICY "Allow public insert on shop_operating_expenses"
    ON shop_operating_expenses FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on shop_operating_expenses"
    ON shop_operating_expenses FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on shop_operating_expenses"
    ON shop_operating_expenses FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE shop_operating_expenses;
