# ShopFlow — Equipment & Retail Financial Management System

A high-performance, offline-first web application built for brick-and-mortar retail shops selling **Household Goods**, **Housewares**, and **Domestic Equipment** (cookware, home appliances, kitchen tools, dinnerware).

All financial figures are tracked natively in **Ethiopian Birr (`Br` / `ETB`)**.

---

## Key Features

### 1. Equipment Inventory Tracking & Registration
- Track equipment inventory with item names, categories, brands, model numbers, serial barcodes, condition, purchase costs, and target selling prices.
- **Strict Retail Categories**: Strictly partitioned into `Household Goods`, `Housewares`, and `Domestic Equipment`.
- **Dedicated Unit Section**: Register items with standard packaging units (`Pieces`, `Sets`, `Boxes`, `Packs`, `Pairs`, `Cartons`, `Dozen`, `Rolls`, `Kilograms`, `Meters`, or custom units) and auto-adapting quantity badges.
- **Quick Arrival Intake Bar**: Instant 1-click counter registration directly from the dashboard header.

### 2. True Bottom-Line Net Profit & Realized Sales P&L
- **Realized P&L**: Profit and loss are strictly calculated on units sold ($\text{Revenue} - \text{Cost of Sold Goods}$), separating realized gains from active shelf stock.
- **Shop Operating Overhead Tracker**: Log store rent, electricity / generator fuel, transport & freight from Merkato/port, staff wages, and packing supplies.
- **True Bottom-Line Net Profit**:
  $$\text{True Net Profit} = \text{Gross Realized Sales Profit} - \text{Total Operating Expenses}$$
- **Timeframe Selector**: Toggle performance filters between **`Today`**, **`This Week`**, **`This Month`**, and **`All Time`**.

### 3. Partial Quantity Sales & Auto-Deduction
- Record equipment sales with custom quantity (e.g., selling 2 sets out of 10 available).
- Automatically calculates realized profit/loss on sold units, deducts remaining stock, and retains unsold balance on the sales floor.

### 4. Physical Stocktake & Audit Reconciliation
- Conduct physical shelf counts against recorded balances with automatic calculation of variance ($\Delta$) and cost discrepancy in Birr.
- Complete audit trail logging every creation, price edit, sale, stocktake adjustment, and expense.

### 5. Offline-First Resilience & Cloud Sync
- **Local Cache First**: Zero counter lag; writes immediately to browser storage even if shop internet drops.
- **Persistent Synchronization Queue**: Queued mutations automatically flush to Supabase PostgreSQL when connection restores.
- **Smart Header Status Pill**: Visual indicator displaying live sync, pending offline changes, and connection state.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **Backend / Database**: Supabase (PostgreSQL, Row-Level Security, Realtime subscriptions)
- **Testing**: Vitest (Unit tests for financial calculations & P&L algorithms)

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/joe-et/shopflow-management.git
cd shopflow-management

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

### Database Setup (Optional)
The application runs out of the box with offline demo storage. To connect your live Supabase cloud database:
1. Create a project in [Supabase](https://supabase.com).
2. Execute the SQL script in `supabase/schema.sql` inside the Supabase SQL Editor.
3. Click the database gear icon in the app header and paste your Supabase Project URL and Anon Key.

---

## Scripts

- `npm run dev` - Starts development server on `http://localhost:5173`
- `npm run build` - Type-checks and bundles the production app
- `npm test` - Executes Vitest test suite
- `npm run preview` - Locally previews the production build
