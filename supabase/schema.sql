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

-- 7. Seed Data strictly across Household Goods, Housewares, and Domestic Equipment
INSERT INTO equipment_items (
    id, name, category, brand, model, serial_number, condition, status, 
    purchase_price, retail_price, sold_price, sold_at, customer_name, customer_phone, 
    quantity, location, notes, warranty_period_months, created_at
) VALUES 
(
    'a1111111-1111-4111-a111-111111111111',
    'Bosch Serie 8 Front-Load Inverter Washing Machine 9kg',
    'Domestic Equipment',
    'Bosch',
    'WAV28M90ME',
    'BSH-WM9-88129',
    'new',
    'in_stock',
    135000.00,
    165000.00,
    NULL,
    NULL,
    NULL,
    NULL,
    2,
    'Major Appliances Section - Bay 1',
    'EcoSilence Drive motor, 1400 RPM, AntiStain Plus system',
    24,
    NOW() - INTERVAL '3 days'
),
(
    'a2222222-2222-4222-a222-222222222222',
    'Samsung 500L Twin Cooling Frost-Free Refrigerator',
    'Domestic Equipment',
    'Samsung',
    'RT50K6030S8',
    'SAM-RF-500L-X1',
    'new',
    'sold',
    155000.00,
    185000.00,
    182000.00,
    NOW() - INTERVAL '1 day',
    'Dawit Tadesse',
    '+251 91 123 4567',
    1,
    'Sold / Delivered',
    'Digital Inverter Compressor, CBE Birr instant payment',
    36,
    NOW() - INTERVAL '7 days'
),
(
    'a3333333-3333-4333-a333-333333333333',
    'De''Longhi Magnifica S Automatic Bean-to-Cup Espresso Machine',
    'Domestic Equipment',
    'De''Longhi',
    'ECAM22.110.B',
    'DLG-MAG-77123',
    'new',
    'in_stock',
    78000.00,
    98000.00,
    NULL,
    NULL,
    NULL,
    NULL,
    3,
    'Countertop Display 2',
    'Integrated steel burr grinder with 13 grind settings, cappuccino frother',
    24,
    NOW() - INTERVAL '5 days'
),
(
    'a4444444-4444-4444-a444-444444444444',
    'Miele G 7110 SC AutoDos Built-in Dishwasher',
    'Domestic Equipment',
    'Miele',
    'G7110SC',
    'MIE-DW-99401',
    'open_box',
    'sold',
    190000.00,
    225000.00,
    220000.00,
    NOW() - INTERVAL '2 days',
    'Selamawit Kebede',
    '+251 92 987 6543',
    1,
    'Sold / Delivered',
    'AutoDos system with integrated PowerDisk, QuickPowerWash',
    24,
    NOW() - INTERVAL '10 days'
),
(
    'a5555555-5555-4555-a555-555555555555',
    'Dyson V12 Detect Slim Cordless Vacuum Cleaner',
    'Household Goods',
    'Dyson',
    '368340-01',
    'DYS-V12-90214',
    'new',
    'in_stock',
    88000.00,
    110000.00,
    NULL,
    NULL,
    NULL,
    NULL,
    4,
    'Cleaning Appliances Shelf B-2',
    'Laser Slim Fluffy cleaner head, piezo sensor particle counter',
    24,
    NOW() - INTERVAL '12 days'
),
(
    'a6666666-6666-4666-a666-666666666666',
    'Philips Series 3000 Smart Room Air Purifier (HEPA H13)',
    'Household Goods',
    'Philips',
    'AC3033/10',
    'PHL-AP3-44120',
    'refurbished',
    'reserved',
    42000.00,
    54000.00,
    NULL,
    NULL,
    'Henok Girma Studio',
    '+251 93 456 7890',
    1,
    'Reserved Shelf R-1',
    'Purifies rooms up to 104m², AeraSense real-time allergen display',
    12,
    NOW() - INTERVAL '4 days'
),
(
    'a7777777-7777-4777-a777-777777777777',
    'Tefal Pro Express Ultimate Steam Generator Iron Station',
    'Household Goods',
    'Tefal',
    'GV9580',
    'TEF-GV-882193',
    'new',
    'in_stock',
    36000.00,
    46000.00,
    NULL,
    NULL,
    NULL,
    NULL,
    3,
    'Household Appliances Aisle 1',
    '8 bar high pressure boiler, 180g/min continuous steam, Protect System',
    24,
    NOW() - INTERVAL '8 days'
),
(
    'a8888888-8888-4888-a888-888888888888',
    'Xiaomi Robot Vacuum-Mop 2 Ultra with Auto-Empty Station',
    'Household Goods',
    'Xiaomi',
    'BHR5195EU',
    'MI-ROB-901842',
    'new',
    'sold',
    72000.00,
    88000.00,
    86500.00,
    NOW() - INTERVAL '3 days',
    'Biniam Alemu',
    '+251 94 567 1234',
    1,
    'Sold / Delivered',
    '4,000Pa suction power, 3D ToF obstacle avoidance technology',
    12,
    NOW() - INTERVAL '14 days'
),
(
    'a9999999-9999-4999-a999-999999999999',
    'KitchenAid Artisan 4.8L Tilt-Head Stand Mixer Empire Red',
    'Housewares',
    'KitchenAid',
    '5KSM125BER',
    'KA-ART-88129',
    'new',
    'in_stock',
    68000.00,
    85000.00,
    NULL,
    NULL,
    NULL,
    NULL,
    2,
    'Housewares Center Island',
    'Direct drive 300W motor, full metal construction, wire whisk & dough hook',
    60,
    NOW() - INTERVAL '6 days'
),
(
    'b1111111-1111-4111-b111-111111111111',
    'WMF Function 4 Stainless Steel Cookware Set (5 Pieces)',
    'Housewares',
    'WMF',
    '0760056380',
    'WMF-F4-55102',
    'open_box',
    'in_stock',
    52000.00,
    68000.00,
    NULL,
    NULL,
    NULL,
    NULL,
    1,
    'Cookware Section - Shelf B',
    'Cromargan 18/10 stainless steel, TransTherm universal induction base',
    120,
    NOW() - INTERVAL '9 days'
),
(
    'b2222222-2222-4222-b222-222222222222',
    'Zwilling Pro 7-Piece Self-Sharpening Block Set',
    'Housewares',
    'Zwilling',
    '38435-007-0',
    'ZWL-PRO-7PC-01',
    'new',
    'in_stock',
    38000.00,
    49000.00,
    NULL,
    NULL,
    NULL,
    NULL,
    3,
    'Housewares Display Case 1',
    'Special formula high carbon steel, FRIODUR ice-hardened blades',
    120,
    NOW() - INTERVAL '2 days'
),
(
    'b3333333-3333-4333-b333-333333333333',
    'Le Creuset Signature Enameled Cast Iron Round Casserole 26cm',
    'Housewares',
    'Le Creuset',
    '21177260602430',
    'LC-CAS-26CM',
    'new',
    'sold',
    32000.00,
    42000.00,
    40000.00,
    NOW() - INTERVAL '4 hours',
    'Yordanos Mengistu',
    '+251 91 334 5566',
    1,
    'Sold / Picked Up',
    'Cerise Red finish, lifetime guarantee, suitable for all heat sources',
    120,
    NOW() - INTERVAL '5 days'
)
ON CONFLICT (id) DO NOTHING;

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
