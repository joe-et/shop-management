export type ItemCondition = 
  | 'new' 
  | 'open_box' 
  | 'refurbished' 
  | 'used_like_new' 
  | 'used_good' 
  | 'used_fair' 
  | 'for_parts';

export type ItemStatus = 
  | 'in_stock' 
  | 'sold' 
  | 'reserved' 
  | 'damaged' 
  | 'returned';

export interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string | null;
  serial_number: string | null;
  condition: ItemCondition;
  status: ItemStatus;
  purchase_price: number;
  retail_price: number;
  sold_price: number | null;
  sold_at: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  quantity: number;
  unit?: string | null;
  min_stock_threshold?: number | null;
  location: string | null;
  notes: string | null;
  warranty_period_months: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export type EquipmentItemInput = Omit<EquipmentItem, 'id' | 'created_at' | 'updated_at'>;

export type EquipmentItemUpdate = Partial<EquipmentItemInput>;

export interface ItemProfitMetrics {
  /** Realized profit if sold, or potential profit based on retail price */
  profit: number;
  /** Margin percentage based on selling/retail price */
  marginPercent: number;
  /** Return on Investment percentage based on purchase price */
  roiPercent: number;
  /** Potential profit based on retail_price - purchase_price */
  potentialProfit: number;
  /** Potential margin percentage */
  potentialMarginPercent: number;
}

export type TimeframePeriod = 'today' | 'this_week' | 'this_month' | 'all_time';

export interface FinancialMetrics {
  /** Sum of sold_price * quantity for all sold items */
  totalRevenue: number;
  /** Sum of purchase_price * quantity for all sold items */
  totalCostOfSold: number;
  /** Total Net Realized Profit = totalRevenue - totalCostOfSold */
  netProfit: number;
  /** Overall Profit Margin % = (netProfit / totalRevenue) * 100 */
  overallMargin: number;
  /** Overall Return on Investment % = (netProfit / totalCostOfSold) * 100 */
  overallRoi: number;

  /** Period-specific figures */
  timeframe: TimeframePeriod;
  periodRevenue: number;
  periodCostOfSold: number;
  periodNetProfit: number;
  periodMargin: number;
  periodRoi: number;
  periodSoldCount: number;

  /** Operating Overhead & True Bottom-Line Net Profit */
  totalExpenses: number;
  periodExpenses: number;
  trueNetProfit: number;
  periodTrueNetProfit: number;

  /** Total capital tied up in active/in_stock inventory (at cost) */
  activeInventoryCost: number;
  /** Total projected retail value of in_stock inventory */
  activeInventoryRetailValue: number;
  /** Potential unrealized profit = activeInventoryRetailValue - activeInventoryCost */
  potentialProfit: number;

  /** Counts */
  totalItemsCount: number;
  totalStockUnits: number;
  inStockCount: number;
  soldCount: number;
  reservedCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface ItemFilters {
  search: string;
  status: ItemStatus | 'all' | 'low_stock' | 'out_of_stock';
  category: string; // 'all' or category name
  brand: string; // 'all' or brand name
  condition: ItemCondition | 'all';
  minPrice?: number;
  maxPrice?: number;
  sortBy: 'created_at' | 'name' | 'purchase_price' | 'retail_price' | 'sold_price' | 'profit' | 'quantity';
  sortOrder: 'asc' | 'desc';
}

export interface CategorySummary {
  category: string;
  count: number;
  totalCost: number;
  totalRetailValue: number;
  potentialProfit: number;
}

export interface BrandSummary {
  brand: string;
  count: number;
  totalValue: number;
}

export const ITEM_CATEGORIES = [
  'Household Goods',
  'Housewares',
  'Domestic Equipment',
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const ITEM_CONDITIONS: { value: ItemCondition; label: string; badgeColor: string }[] = [
  { value: 'new', label: 'Brand New', badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300/40' },
  { value: 'open_box', label: 'Open Box', badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300/40' },
  { value: 'refurbished', label: 'Refurbished', badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300/40' },
  { value: 'used_like_new', label: 'Used - Like New', badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-300/40' },
  { value: 'used_good', label: 'Used - Good', badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300/40' },
  { value: 'used_fair', label: 'Used - Fair', badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300/40' },
  { value: 'for_parts', label: 'For Parts / Scrap', badgeColor: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300/40' },
];

export const ITEM_STATUSES: { value: ItemStatus; label: string; color: string }[] = [
  { value: 'in_stock', label: 'In Stock', color: 'emerald' },
  { value: 'sold', label: 'Sold', color: 'blue' },
  { value: 'reserved', label: 'Reserved', color: 'violet' },
  { value: 'damaged', label: 'Damaged', color: 'rose' },
  { value: 'returned', label: 'Returned', color: 'slate' },
];

export const STANDARD_UNITS = [
  { value: 'pcs', label: 'Pieces (pcs)', singular: 'Piece', plural: 'Pieces' },
  { value: 'set', label: 'Sets (set)', singular: 'Set', plural: 'Sets' },
  { value: 'box', label: 'Boxes (box)', singular: 'Box', plural: 'Boxes' },
  { value: 'pack', label: 'Packs (pack)', singular: 'Pack', plural: 'Packs' },
  { value: 'pair', label: 'Pairs (pair)', singular: 'Pair', plural: 'Pairs' },
  { value: 'ctn', label: 'Cartons (ctn)', singular: 'Carton', plural: 'Cartons' },
  { value: 'dz', label: 'Dozen (dz)', singular: 'Dozen', plural: 'Dozens' },
  { value: 'roll', label: 'Rolls (roll)', singular: 'Roll', plural: 'Rolls' },
  { value: 'kg', label: 'Kilograms (kg)', singular: 'Kilogram', plural: 'Kilograms' },
  { value: 'm', label: 'Meters (m)', singular: 'Meter', plural: 'Meters' },
] as const;

export type StandardUnit = (typeof STANDARD_UNITS)[number]['value'];

// ============================================================================
// AUDIT & STOCKTAKE RECONCILIATION TYPES
// ============================================================================

export type AuditActionType = 
  | 'item_created'
  | 'item_updated'
  | 'price_changed'
  | 'item_sold'
  | 'partial_sale'
  | 'reverted_to_stock'
  | 'item_deleted'
  | 'stocktake_adjustment';

export interface AuditLogEntry {
  id: string;
  item_id: string | null;
  item_name: string;
  action: AuditActionType;
  actor: string;
  timestamp: string;
  details: string;
  previous_state?: Partial<EquipmentItem> | null;
  new_state?: Partial<EquipmentItem> | null;
  quantity_change?: number | null;
  financial_impact?: number | null;
}

export interface StocktakeItemVariance {
  item: EquipmentItem;
  systemQuantity: number;
  countedQuantity: number;
  variance: number; // countedQuantity - systemQuantity
  costDiscrepancy: number; // variance * purchase_price
  verified: boolean;
  notes?: string;
}

// ============================================================================
// OFFLINE-FIRST SYNC QUEUE TYPES
// ============================================================================

export type SyncOperationType = 'create' | 'update' | 'delete' | 'audit_log';

export interface SyncQueueItem {
  id: string;
  type: SyncOperationType;
  table: 'equipment_items' | 'inventory_audit_logs' | 'shop_operating_expenses';
  itemId: string;
  payload: any;
  timestamp: string;
  retryCount: number;
}

export type SyncState = 'synced' | 'pending' | 'syncing' | 'offline' | 'demo';

export interface SyncStatusInfo {
  state: SyncState;
  pendingCount: number;
  lastSyncedAt: string | null;
  isOnline: boolean;
  isConfigured: boolean;
}

// ============================================================================
// SHOP OPERATING EXPENSES TYPES
// ============================================================================

export const EXPENSE_CATEGORIES = [
  'Rent',
  'Utilities',
  'Transport & Freight',
  'Staff Wages',
  'Supplies & Packaging',
  'Maintenance',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type ExpensePaymentMethod = 
  | 'Cash' 
  | 'Telebirr' 
  | 'Bank Transfer / CBE' 
  | 'Other';

export interface ShopExpense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  payment_method: ExpensePaymentMethod;
  notes?: string | null;
  created_at: string;
}

export type ShopExpenseInput = Omit<ShopExpense, 'id' | 'created_at'>;
