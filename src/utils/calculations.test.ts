import { describe, it, expect } from 'vitest';
import { 
  calculateItemProfitMetrics, 
  calculateFinancialMetrics,
  calculateCategorySummaries,
  calculateBrandSummaries,
  filterAndSortItems
} from './calculations';
import { 
  formatBirr, 
  formatCurrency, 
  formatProfit, 
  formatPercentage, 
  formatDate 
} from './formatters';
import { EquipmentItem, ItemFilters, ITEM_CATEGORIES } from '../types/inventory';

// Mock helper to create partial items
function createMockItem(overrides: Partial<EquipmentItem>): EquipmentItem {
  return {
    id: 'test-item-1',
    name: 'Test Equipment',
    category: 'Laptops',
    brand: 'Dell',
    model: 'XPS 15',
    serial_number: 'SN-12345',
    condition: 'new',
    status: 'in_stock',
    purchase_price: 10000,
    retail_price: 15000,
    sold_price: null,
    sold_at: null,
    customer_name: null,
    customer_phone: null,
    quantity: 1,
    location: 'Shelf A',
    notes: 'Unit test sample',
    warranty_period_months: 12,
    image_url: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('Equipment Categories Configuration', () => {
  it('strictly contains only Household Goods, Housewares, and Domestic Equipment', () => {
    expect(ITEM_CATEGORIES).toHaveLength(3);
    expect([...ITEM_CATEGORIES]).toEqual([
      'Household Goods',
      'Housewares',
      'Domestic Equipment',
    ]);
  });
});

describe('Single Item Profit Metrics (calculateItemProfitMetrics)', () => {
  it('calculates positive realized profit on sold items', () => {
    const item = createMockItem({
      status: 'sold',
      purchase_price: 10000,
      retail_price: 16000,
      sold_price: 15000,
      quantity: 1,
    });

    const metrics = calculateItemProfitMetrics(item);

    expect(metrics.profit).toBe(5000); // 15,000 - 10,000
    // Margin %: (5,000 / 15,000) * 100 = 33.333...%
    expect(metrics.marginPercent).toBeCloseTo(33.33, 1);
    // ROI %: (5,000 / 10,000) * 100 = 50%
    expect(metrics.roiPercent).toBeCloseTo(50.0, 1);
    // Potential profit based on retail price: 16,000 - 10,000 = 6,000
    expect(metrics.potentialProfit).toBe(6000);
    expect(metrics.potentialMarginPercent).toBeCloseTo(37.5, 1);
  });

  it('calculates negative profit when item is sold at a loss', () => {
    const item = createMockItem({
      status: 'sold',
      purchase_price: 10000,
      retail_price: 12000,
      sold_price: 8000, // Sold below purchase price
      quantity: 1,
    });

    const metrics = calculateItemProfitMetrics(item);

    expect(metrics.profit).toBe(-2000); // 8,000 - 10,000
    // Margin %: (-2,000 / 8,000) * 100 = -25%
    expect(metrics.marginPercent).toBeCloseTo(-25.0, 1);
    // ROI %: (-2,000 / 10,000) * 100 = -20%
    expect(metrics.roiPercent).toBeCloseTo(-20.0, 1);
  });

  it('correctly handles discounted sale price vs listed selling price', () => {
    const item = createMockItem({
      status: 'sold',
      purchase_price: 20000,
      retail_price: 30000, // Listed selling price
      sold_price: 26000,   // Negotiated / discounted sale price
      quantity: 2,
    });

    const metrics = calculateItemProfitMetrics(item);

    // Unit realized profit: 26,000 - 20,000 = 6,000 * 2 = 12,000
    expect(metrics.profit).toBe(12000);
    // Realized margin on sold price: (6,000 / 26,000) * 100 = 23.076%
    expect(metrics.marginPercent).toBeCloseTo(23.08, 1);
    // Potential unit profit: 30,000 - 20,000 = 10,000 * 2 = 20,000
    expect(metrics.potentialProfit).toBe(20000);
    expect(metrics.potentialMarginPercent).toBeCloseTo(33.33, 1);
  });

  it('calculates potential unrealized profit for in-stock equipment', () => {
    const item = createMockItem({
      status: 'in_stock',
      purchase_price: 50000,
      retail_price: 75000,
      sold_price: null,
      quantity: 3,
    });

    const metrics = calculateItemProfitMetrics(item);

    // Potential unit profit = 75,000 - 50,000 = 25,000 * 3 = 75,000
    expect(metrics.profit).toBe(75000);
    expect(metrics.potentialProfit).toBe(75000);
    // Margin %: (25,000 / 75,000) * 100 = 33.33%
    expect(metrics.marginPercent).toBeCloseTo(33.33, 1);
    // ROI %: (25,000 / 50,000) * 100 = 50%
    expect(metrics.roiPercent).toBeCloseTo(50.0, 1);
  });

  it('handles zero division safety edge cases gracefully', () => {
    // Zero purchase price (gift, free item, or unknown)
    const freeItem = createMockItem({
      status: 'sold',
      purchase_price: 0,
      retail_price: 500,
      sold_price: 500,
      quantity: 1,
    });
    const freeMetrics = calculateItemProfitMetrics(freeItem);
    expect(freeMetrics.profit).toBe(500);
    expect(freeMetrics.marginPercent).toBe(100);
    expect(freeMetrics.roiPercent).toBe(0); // Zero purchase price should not divide by zero or result in NaN/Infinity

    // Zero retail price and zero sold price
    const zeroItem = createMockItem({
      status: 'sold',
      purchase_price: 0,
      retail_price: 0,
      sold_price: 0,
      quantity: 1,
    });
    const zeroMetrics = calculateItemProfitMetrics(zeroItem);
    expect(zeroMetrics.profit).toBe(0);
    expect(Number.isFinite(zeroMetrics.marginPercent)).toBe(true);
    expect(zeroMetrics.marginPercent).toBe(0);
    expect(Number.isFinite(zeroMetrics.roiPercent)).toBe(true);
    expect(zeroMetrics.roiPercent).toBe(0);
  });
});

describe('Aggregate Financial Metrics (calculateFinancialMetrics)', () => {
  it('correctly aggregates revenue, profit, costs and status counts', () => {
    const items: EquipmentItem[] = [
      // Sold item with profit: purchase 10k, sold 15k -> rev 15k, cost 10k, profit +5k
      createMockItem({
        id: '1',
        status: 'sold',
        purchase_price: 10000,
        retail_price: 16000,
        sold_price: 15000,
        quantity: 1,
      }),
      // Sold item with loss: purchase 20k, sold 16k -> rev 16k, cost 20k, profit -4k
      createMockItem({
        id: '2',
        status: 'sold',
        purchase_price: 20000,
        retail_price: 22000,
        sold_price: 16000,
        quantity: 1,
      }),
      // In-stock item: purchase 30k, retail 45k, qty 2 -> cost 60k, retail 90k
      createMockItem({
        id: '3',
        status: 'in_stock',
        purchase_price: 30000,
        retail_price: 45000,
        sold_price: null,
        quantity: 2,
      }),
      // In-stock item: purchase 5k, retail 8k, qty 1 -> cost 5k, retail 8k
      createMockItem({
        id: '4',
        status: 'in_stock',
        purchase_price: 5000,
        retail_price: 8000,
        sold_price: null,
        quantity: 1,
      }),
      // Reserved item: purchase 12k, retail 18k, qty 1 -> cost 12k, retail 18k
      createMockItem({
        id: '5',
        status: 'reserved',
        purchase_price: 12000,
        retail_price: 18000,
        sold_price: null,
        quantity: 1,
      }),
    ];

    const metrics = calculateFinancialMetrics(items);

    // Sold items revenue: 15,000 + 16,000 = 31,000
    expect(metrics.totalRevenue).toBe(31000);
    // Sold items cost: 10,000 + 20,000 = 30,000
    expect(metrics.totalCostOfSold).toBe(30000);
    // Net profit: 31,000 - 30,000 = 1,000
    expect(metrics.netProfit).toBe(1000);
    // Overall margin: (1,000 / 31,000) * 100 = 3.2258%
    expect(metrics.overallMargin).toBeCloseTo(3.23, 1);
    // Overall ROI: (1,000 / 30,000) * 100 = 3.333%
    expect(metrics.overallRoi).toBeCloseTo(3.33, 1);

    // Active inventory cost: in_stock(60k + 5k) + reserved(12k) = 77,000
    expect(metrics.activeInventoryCost).toBe(77000);
    // Active retail value: in_stock(90k + 8k) + reserved(18k) = 116,000
    expect(metrics.activeInventoryRetailValue).toBe(116000);
    // Potential unrealized profit: 116,000 - 77,000 = 39,000
    expect(metrics.potentialProfit).toBe(39000);

    // Counts
    expect(metrics.soldCount).toBe(2);
    expect(metrics.inStockCount).toBe(3); // 2 units in item 3 + 1 unit in item 4
    expect(metrics.reservedCount).toBe(1);
    expect(metrics.totalItemsCount).toBe(5);
  });

  it('handles empty item list without NaN or division by zero', () => {
    const metrics = calculateFinancialMetrics([]);
    expect(metrics.totalRevenue).toBe(0);
    expect(metrics.totalCostOfSold).toBe(0);
    expect(metrics.netProfit).toBe(0);
    expect(metrics.overallMargin).toBe(0);
    expect(metrics.overallRoi).toBe(0);
    expect(metrics.activeInventoryCost).toBe(0);
    expect(metrics.activeInventoryRetailValue).toBe(0);
    expect(metrics.potentialProfit).toBe(0);
    expect(metrics.totalItemsCount).toBe(0);
    expect(metrics.inStockCount).toBe(0);
    expect(metrics.soldCount).toBe(0);
  });

  it('calculates realized profit and inventory stock strictly based on partial units sold', () => {
    // Initial batch: 10 units at 10,000 Br cost, 15,000 Br retail
    // User sells 2 units at 14,000 Br each
    // Remaining in stock: 8 units at 10,000 Br cost
    const remainingInStock = createMockItem({
      id: 'batch-remaining',
      status: 'in_stock',
      purchase_price: 10000,
      retail_price: 15000,
      quantity: 8,
    });

    const partialSoldBatch = createMockItem({
      id: 'batch-sold-2',
      status: 'sold',
      purchase_price: 10000,
      retail_price: 15000,
      sold_price: 14000,
      quantity: 2,
    });

    const soldMetrics = calculateItemProfitMetrics(partialSoldBatch);
    // Unit profit: 14,000 - 10,000 = 4,000 Br
    // Total profit for 2 units sold: 4,000 * 2 = 8,000 Br
    expect(soldMetrics.profit).toBe(8000);
    // Realized margin: 4,000 / 14,000 = 28.57%
    expect(soldMetrics.marginPercent).toBeCloseTo(28.57, 1);
    // ROI: 4,000 / 10,000 = 40%
    expect(soldMetrics.roiPercent).toBeCloseTo(40.0, 1);

    // Aggregate metrics across the shop
    const aggregate = calculateFinancialMetrics([remainingInStock, partialSoldBatch]);
    // Revenue from 2 units sold: 14,000 * 2 = 28,000 Br
    expect(aggregate.totalRevenue).toBe(28000);
    // Cost of goods sold: 10,000 * 2 = 20,000 Br
    expect(aggregate.totalCostOfSold).toBe(20000);
    // Net realized profit: 28,000 - 20,000 = 8,000 Br
    expect(aggregate.netProfit).toBe(8000);

    // Active stock remaining: 8 units * 10,000 = 80,000 Br
    expect(aggregate.activeInventoryCost).toBe(80000);
    // Active stock potential retail value: 8 units * 15,000 = 120,000 Br
    expect(aggregate.activeInventoryRetailValue).toBe(120000);
    // Potential unrealized profit on remaining 8 units: 120,000 - 80,000 = 40,000 Br
    expect(aggregate.potentialProfit).toBe(40000);

    // Counts
    expect(aggregate.soldCount).toBe(2);
    expect(aggregate.inStockCount).toBe(8);
  });
});

describe('Category and Brand Summaries', () => {
  it('correctly aggregates category breakdown', () => {
    const items = [
      createMockItem({ category: 'Household Goods', purchase_price: 10000, retail_price: 15000, quantity: 2 }),
      createMockItem({ category: 'Domestic Equipment', purchase_price: 30000, retail_price: 40000, quantity: 1 }),
      createMockItem({ category: 'Household Goods', purchase_price: 5000, retail_price: 8000, quantity: 1 }),
    ];

    const summaries = calculateCategorySummaries(items);
    expect(summaries.length).toBe(2);

    const household = summaries.find(s => s.category === 'Household Goods');
    expect(household).toBeDefined();
    expect(household?.count).toBe(3);
    // Total cost: (10k * 2) + 5k = 25,000
    expect(household?.totalCost).toBe(25000);
    // Total retail: (15k * 2) + 8k = 38,000
    expect(household?.totalRetailValue).toBe(38000);
  });

  it('correctly aggregates brand breakdown', () => {
    const items = [
      createMockItem({ brand: 'Apple', retail_price: 20000, quantity: 2 }),
      createMockItem({ brand: 'Samsung', retail_price: 15000, quantity: 1 }),
      createMockItem({ brand: 'Apple', retail_price: 30000, quantity: 1 }),
    ];

    const summaries = calculateBrandSummaries(items);
    const apple = summaries.find(b => b.brand === 'Apple');
    expect(apple?.count).toBe(3);
    expect(apple?.totalValue).toBe(70000); // 40k + 30k
  });
});

describe('Filter and Sort Items (filterAndSortItems)', () => {
  const items: EquipmentItem[] = [
    createMockItem({
      id: '1',
      name: 'Sony Alpha A7 IV',
      category: 'Cameras',
      brand: 'Sony',
      status: 'in_stock',
      condition: 'new',
      retail_price: 180000,
      created_at: '2026-01-01T00:00:00Z',
    }),
    createMockItem({
      id: '2',
      name: 'Canon EOS R6 Mark II',
      category: 'Cameras',
      brand: 'Canon',
      status: 'sold',
      condition: 'used_good',
      retail_price: 160000,
      sold_price: 150000,
      created_at: '2026-02-01T00:00:00Z',
    }),
    createMockItem({
      id: '3',
      name: 'Dell XPS 15 9530',
      category: 'Laptops',
      brand: 'Dell',
      status: 'in_stock',
      condition: 'new',
      retail_price: 140000,
      created_at: '2026-03-01T00:00:00Z',
    }),
  ];

  it('filters by status tab', () => {
    const inStock = filterAndSortItems(items, { status: 'in_stock' });
    expect(inStock.length).toBe(2);
    expect(inStock.every(i => i.status === 'in_stock')).toBe(true);

    const sold = filterAndSortItems(items, { status: 'sold' });
    expect(sold.length).toBe(1);
    expect(sold[0].id).toBe('2');
  });

  it('filters by search term across brand and name', () => {
    const searchSony = filterAndSortItems(items, { search: 'sony' });
    expect(searchSony.length).toBe(1);
    expect(searchSony[0].brand).toBe('Sony');

    const searchCameras = filterAndSortItems(items, { category: 'Cameras' });
    expect(searchCameras.length).toBe(2);
  });

  it('sorts by retail price descending and ascending', () => {
    const desc = filterAndSortItems(items, { sortBy: 'retail_price', sortOrder: 'desc' });
    expect(desc[0].retail_price).toBe(180000);
    expect(desc[2].retail_price).toBe(140000);

    const asc = filterAndSortItems(items, { sortBy: 'retail_price', sortOrder: 'asc' });
    expect(asc[0].retail_price).toBe(140000);
    expect(asc[2].retail_price).toBe(180000);
  });
});

describe('Ethiopian Birr (Br) Currency & Text Formatters', () => {
  it('formats standard currency with Br prefix', () => {
    expect(formatBirr(1500)).toBe('Br 1,500.00');
    expect(formatBirr(0)).toBe('Br 0.00');
    expect(formatBirr(null)).toBe('Br 0.00');
    expect(formatBirr(undefined)).toBe('Br 0.00');
    expect(formatCurrency(125000.5)).toBe('Br 125,000.50');
  });

  it('formats compact values in K and M with Br symbol', () => {
    expect(formatBirr(55000, { compact: true })).toBe('Br 55.0K');
    expect(formatBirr(1200000, { compact: true })).toBe('Br 1.20M');
  });

  it('formats directional profit with signs and metadata', () => {
    const pos = formatProfit(4500.50);
    expect(pos.isPositive).toBe(true);
    expect(pos.isNegative).toBe(false);
    expect(pos.isZero).toBe(false);
    expect(pos.text).toBe('+Br 4,500.50');

    const neg = formatProfit(-2300);
    expect(neg.isPositive).toBe(false);
    expect(neg.isNegative).toBe(true);
    expect(neg.isZero).toBe(false);
    expect(neg.text).toBe('-Br 2,300.00');

    const zero = formatProfit(0);
    expect(zero.isZero).toBe(true);
    expect(zero.text).toBe('Br 0.00');
  });

  it('formats percentage with positive sign and decimal precision', () => {
    expect(formatPercentage(25.46, 1)).toBe('+25.5%');
    expect(formatPercentage(-12.3, 1)).toBe('-12.3%');
    expect(formatPercentage(0)).toBe('0.0%');
    expect(formatPercentage(null)).toBe('0.0%');
  });

  it('formats dates cleanly and safely', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('')).toBe('—');
    expect(formatDate('invalid-date')).toBe('—');
    const formatted = formatDate('2026-05-15T10:00:00Z');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('May');
  });
});

describe('Inventory Audit & Stocktake Reconciliation', () => {
  it('correctly calculates variance and cost discrepancies during physical stocktake', () => {
    const item = createMockItem({
      id: 'inv-item-1',
      name: 'Bosch Serie 8 Washing Machine',
      purchase_price: 135000,
      retail_price: 165000,
      quantity: 5,
    });

    // Case 1: Physical count matches system expected (5 units)
    const matchCount = 5;
    const matchVariance = matchCount - item.quantity;
    const matchDiscrepancy = matchVariance * item.purchase_price;
    expect(matchVariance).toBe(0);
    expect(matchDiscrepancy).toBe(0);

    // Case 2: Physical count reveals 1 missing unit (4 units found instead of 5)
    const missingCount = 4;
    const missingVariance = missingCount - item.quantity;
    const missingDiscrepancy = missingVariance * item.purchase_price;
    expect(missingVariance).toBe(-1);
    expect(missingDiscrepancy).toBe(-135000); // Cost of lost unit

    // Case 3: Physical count reveals 1 surplus unit (6 units found)
    const surplusCount = 6;
    const surplusVariance = surplusCount - item.quantity;
    const surplusDiscrepancy = surplusVariance * item.purchase_price;
    expect(surplusVariance).toBe(1);
    expect(surplusDiscrepancy).toBe(135000);
  });
});

describe('Dashboard Performance: Date Range P&L & Stock Count Balance', () => {
  it('correctly calculates period-specific P&L for Today vs All-Time', () => {
    const today = new Date().toISOString();
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();

    const items: EquipmentItem[] = [
      // Sold today: profit = (20,000 - 15,000) * 2 = 10,000
      createMockItem({
        id: 'sale-today',
        status: 'sold',
        purchase_price: 15000,
        sold_price: 20000,
        quantity: 2,
        sold_at: today,
      }),
      // Sold 3 days ago: profit = (30,000 - 25,000) * 1 = 5,000
      createMockItem({
        id: 'sale-past',
        status: 'sold',
        purchase_price: 25000,
        sold_price: 30000,
        quantity: 1,
        sold_at: threeDaysAgo,
      }),
      // Active In Stock: 5 units
      createMockItem({
        id: 'in-stock-1',
        status: 'in_stock',
        purchase_price: 10000,
        retail_price: 14000,
        quantity: 5,
        min_stock_threshold: 2,
      }),
      // Low Stock: 1 unit remaining (≤ threshold 2)
      createMockItem({
        id: 'in-stock-low',
        status: 'in_stock',
        purchase_price: 8000,
        retail_price: 12000,
        quantity: 1,
        min_stock_threshold: 2,
      }),
      // Out of Stock: 0 units
      createMockItem({
        id: 'out-of-stock-1',
        status: 'in_stock',
        purchase_price: 5000,
        retail_price: 7000,
        quantity: 0,
      }),
    ];

    // Check Today timeframe metrics
    const todayMetrics = calculateFinancialMetrics(items, 'today');
    expect(todayMetrics.timeframe).toBe('today');
    expect(todayMetrics.periodSoldCount).toBe(2);
    expect(todayMetrics.periodRevenue).toBe(40000); // 2 * 20,000
    expect(todayMetrics.periodNetProfit).toBe(10000); // 40,000 - 30,000
    expect(todayMetrics.totalStockUnits).toBe(6); // 5 + 1
    expect(todayMetrics.lowStockCount).toBe(1); // in-stock-low has 1 unit
    expect(todayMetrics.outOfStockCount).toBe(1); // out-of-stock-1 has 0 units

    // Check All Time timeframe metrics
    const allTimeMetrics = calculateFinancialMetrics(items, 'all_time');
    expect(allTimeMetrics.periodSoldCount).toBe(3); // 2 today + 1 past
    expect(allTimeMetrics.totalRevenue).toBe(70000); // 40,000 + 30,000
    expect(allTimeMetrics.netProfit).toBe(15000); // 10,000 + 5,000
  });

  it('correctly filters items by low_stock and out_of_stock status', () => {
    const items: EquipmentItem[] = [
      createMockItem({ id: 'item-normal', name: 'Pot Set', status: 'in_stock', quantity: 10, min_stock_threshold: 2 }),
      createMockItem({ id: 'item-low', name: 'Coffee Grinder', status: 'in_stock', quantity: 2, min_stock_threshold: 2 }),
      createMockItem({ id: 'item-out', name: 'Juicer', status: 'in_stock', quantity: 0 }),
      createMockItem({ id: 'item-sold', name: 'Kettle', status: 'sold', quantity: 1 }),
    ];

    const lowStockFilter: ItemFilters = {
      search: '',
      status: 'low_stock',
      category: 'all',
      brand: 'all',
      condition: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc',
    };

    const lowResults = filterAndSortItems(items, lowStockFilter);
    expect(lowResults).toHaveLength(1);
    expect(lowResults[0].id).toBe('item-low');

    const outOfStockFilter: ItemFilters = {
      ...lowStockFilter,
      status: 'out_of_stock',
    };

    const outResults = filterAndSortItems(items, outOfStockFilter);
    expect(outResults.some((i) => i.id === 'item-out')).toBe(true);
  });

  it('calculates operating expenses and True Bottom-Line Net Profit across timeframes', () => {
    const today = new Date().toISOString();
    const lastMonth = new Date(Date.now() - 40 * 86400000).toISOString();

    const items: EquipmentItem[] = [
      createMockItem({
        id: 'sale-today-1',
        status: 'sold',
        purchase_price: 10000,
        sold_price: 15000,
        quantity: 2, // revenue: 30,000, cost: 20,000, gross: 10,000
        sold_at: today,
      }),
      createMockItem({
        id: 'sale-old-1',
        status: 'sold',
        purchase_price: 5000,
        sold_price: 9000,
        quantity: 1, // revenue: 9,000, cost: 5,000, gross: 4,000
        sold_at: lastMonth,
      }),
    ];

    const expenses = [
      {
        id: 'exp-1',
        title: 'Shop Rent',
        category: 'rent' as const,
        amount: 3000,
        date: today,
        payment_method: 'telebirr' as const,
        created_at: today,
      },
      {
        id: 'exp-2',
        title: 'Prior Generator Fuel',
        category: 'utilities' as const,
        amount: 2000,
        date: lastMonth,
        payment_method: 'cash' as const,
        created_at: lastMonth,
      },
    ];

    // Today timeframe
    const todayMetrics = calculateFinancialMetrics(items, expenses, 'today');
    expect(todayMetrics.periodRevenue).toBe(30000);
    expect(todayMetrics.periodCostOfSold).toBe(20000);
    expect(todayMetrics.periodNetProfit).toBe(10000); // Gross
    expect(todayMetrics.periodExpenses).toBe(3000);
    expect(todayMetrics.periodTrueNetProfit).toBe(7000); // True Net Profit: 10,000 - 3,000
    expect(todayMetrics.totalExpenses).toBe(5000);
    expect(todayMetrics.netProfit).toBe(14000);
    expect(todayMetrics.trueNetProfit).toBe(9000); // Total True: 14,000 - 5,000

    // All Time timeframe
    const allMetrics = calculateFinancialMetrics(items, expenses, 'all_time');
    expect(allMetrics.totalRevenue).toBe(39000);
    expect(allMetrics.totalCostOfSold).toBe(25000);
    expect(allMetrics.netProfit).toBe(14000);
    expect(allMetrics.totalExpenses).toBe(5000);
    expect(allMetrics.trueNetProfit).toBe(9000);
  });
});
