import { 
  EquipmentItem, 
  FinancialMetrics, 
  ItemProfitMetrics, 
  ItemFilters,
  CategorySummary,
  BrandSummary,
  TimeframePeriod,
  ShopExpense
} from '../types/inventory';

/**
 * Calculate profit, margin, and ROI metrics for a single item
 */
export function calculateItemProfitMetrics(item: EquipmentItem): ItemProfitMetrics {
  const purchasePrice = Number(item.purchase_price) || 0;
  const retailPrice = Number(item.retail_price) || 0;
  const soldPrice = item.sold_price !== null && item.sold_price !== undefined 
    ? Number(item.sold_price) 
    : null;
  const qty = Number(item.quantity) || 1;

  // Potential values (based on retail listing price)
  const unitPotentialProfit = retailPrice - purchasePrice;
  const potentialProfit = unitPotentialProfit * qty;
  const potentialMarginPercent = retailPrice > 0 
    ? (unitPotentialProfit / retailPrice) * 100 
    : 0;

  // Realized values (if sold) or fallback to potential
  if (item.status === 'sold' && soldPrice !== null) {
    const unitRealizedProfit = soldPrice - purchasePrice;
    const realizedProfit = unitRealizedProfit * qty;
    const marginPercent = soldPrice > 0 ? (unitRealizedProfit / soldPrice) * 100 : 0;
    const roiPercent = purchasePrice > 0 ? (unitRealizedProfit / purchasePrice) * 100 : 0;

    return {
      profit: realizedProfit,
      marginPercent,
      roiPercent,
      potentialProfit,
      potentialMarginPercent,
    };
  }

  // Not yet sold: metrics represent potential profit
  const roiPercent = purchasePrice > 0 ? (unitPotentialProfit / purchasePrice) * 100 : 0;

  return {
    profit: potentialProfit,
    marginPercent: potentialMarginPercent,
    roiPercent,
    potentialProfit,
    potentialMarginPercent,
  };
}

/**
 * Check if a given date string falls within the selected timeframe
 */
export function isWithinTimeframe(dateStr: string | null | undefined, timeframe: TimeframePeriod): boolean {
  if (timeframe === 'all_time') return true;
  if (!dateStr) return false;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;

  const now = new Date();

  if (timeframe === 'today') {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }

  if (timeframe === 'this_week') {
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(now.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);
    return date >= startOfWeek;
  }

  if (timeframe === 'this_month') {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }

  return true;
}

/**
 * Calculates high-level aggregate financial metrics across all inventory items and operating overhead
 */
export function calculateFinancialMetrics(
  items: EquipmentItem[],
  expensesOrTimeframe?: ShopExpense[] | TimeframePeriod,
  maybeTimeframe?: TimeframePeriod
): FinancialMetrics {
  let expenses: ShopExpense[] = [];
  let timeframe: TimeframePeriod = 'all_time';

  if (typeof expensesOrTimeframe === 'string') {
    timeframe = expensesOrTimeframe;
    expenses = [];
  } else if (Array.isArray(expensesOrTimeframe)) {
    expenses = expensesOrTimeframe;
    if (maybeTimeframe) {
      timeframe = maybeTimeframe;
    }
  }
  let totalRevenue = 0;
  let totalCostOfSold = 0;
  let activeInventoryCost = 0;
  let activeInventoryRetailValue = 0;

  let inStockCount = 0;
  let totalStockUnits = 0;
  let soldCount = 0;
  let reservedCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  // Period-specific metrics for timeframe
  let periodRevenue = 0;
  let periodCostOfSold = 0;
  let periodSoldCount = 0;

  for (const item of items) {
    const qty = Number(item.quantity) || 0;
    const purchase = Number(item.purchase_price) || 0;
    const retail = Number(item.retail_price) || 0;
    const sold = item.sold_price !== null && item.sold_price !== undefined 
      ? Number(item.sold_price) 
      : retail;
    const minThreshold = Number(item.min_stock_threshold) > 0 
      ? Number(item.min_stock_threshold) 
      : 2;

    if (item.status === 'in_stock') {
      if (qty === 0) {
        outOfStockCount++;
      } else {
        inStockCount += qty;
        totalStockUnits += qty;
        activeInventoryCost += purchase * qty;
        activeInventoryRetailValue += retail * qty;

        if (qty <= minThreshold) {
          lowStockCount++;
        }
      }
    } else if (item.status === 'sold') {
      soldCount += qty;
      totalRevenue += sold * qty;
      totalCostOfSold += purchase * qty;

      // Period filtering based on sold_at
      const soldDate = item.sold_at || item.updated_at || item.created_at;
      if (isWithinTimeframe(soldDate, timeframe)) {
        periodSoldCount += qty;
        periodRevenue += sold * qty;
        periodCostOfSold += purchase * qty;
      }
    } else if (item.status === 'reserved') {
      reservedCount += qty;
      activeInventoryCost += purchase * qty;
      activeInventoryRetailValue += retail * qty;
    } else if (item.status === 'damaged' || item.status === 'returned') {
      activeInventoryCost += purchase * qty;
    }
  }

  // Operating Expenses calculations
  let totalExpenses = 0;
  let periodExpenses = 0;

  for (const exp of expenses) {
    const amt = Number(exp.amount) || 0;
    totalExpenses += amt;
    const expDate = exp.date || exp.created_at;
    if (isWithinTimeframe(expDate, timeframe)) {
      periodExpenses += amt;
    }
  }

  const netProfit = totalRevenue - totalCostOfSold;
  const overallMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const overallRoi = totalCostOfSold > 0 ? (netProfit / totalCostOfSold) * 100 : 0;
  const potentialProfit = Math.max(0, activeInventoryRetailValue - activeInventoryCost);

  const periodNetProfit = periodRevenue - periodCostOfSold;
  const periodMargin = periodRevenue > 0 ? (periodNetProfit / periodRevenue) * 100 : 0;
  const periodRoi = periodCostOfSold > 0 ? (periodNetProfit / periodCostOfSold) * 100 : 0;

  // True Net Profit (Gross Profit - Operating Expenses)
  const trueNetProfit = netProfit - totalExpenses;
  const periodTrueNetProfit = periodNetProfit - periodExpenses;

  return {
    totalRevenue,
    totalCostOfSold,
    netProfit,
    overallMargin,
    overallRoi,
    timeframe,
    periodRevenue,
    periodCostOfSold,
    periodNetProfit,
    periodMargin,
    periodRoi,
    periodSoldCount,
    totalExpenses,
    periodExpenses,
    trueNetProfit,
    periodTrueNetProfit,
    activeInventoryCost,
    activeInventoryRetailValue,
    potentialProfit,
    totalItemsCount: items.length,
    totalStockUnits,
    inStockCount,
    soldCount,
    reservedCount,
    lowStockCount,
    outOfStockCount,
  };
}

/**
 * Aggregates items grouped by category with total values
 */
export function calculateCategorySummaries(items: EquipmentItem[]): CategorySummary[] {
  const map = new Map<string, { count: number; totalCost: number; totalRetailValue: number }>();

  for (const item of items) {
    const cat = item.category || 'Uncategorized';
    const qty = Number(item.quantity) || 1;
    const cost = (Number(item.purchase_price) || 0) * qty;
    const retail = (Number(item.retail_price) || 0) * qty;

    const current = map.get(cat) || { count: 0, totalCost: 0, totalRetailValue: 0 };
    current.count += qty;
    current.totalCost += cost;
    current.totalRetailValue += retail;
    map.set(cat, current);
  }

  return Array.from(map.entries())
    .map(([category, data]) => ({
      category,
      ...data,
      potentialProfit: data.totalRetailValue - data.totalCost,
    }))
    .sort((a, b) => b.totalRetailValue - a.totalRetailValue);
}

/**
 * Aggregates items grouped by brand
 */
export function calculateBrandSummaries(items: EquipmentItem[]): BrandSummary[] {
  const map = new Map<string, { count: number; totalValue: number }>();

  for (const item of items) {
    const brand = item.brand || 'Unknown';
    const qty = Number(item.quantity) || 1;
    const retail = (Number(item.retail_price) || 0) * qty;

    const current = map.get(brand) || { count: 0, totalValue: 0 };
    current.count += qty;
    current.totalValue += retail;
    map.set(brand, current);
  }

  return Array.from(map.entries())
    .map(([brand, data]) => ({
      brand,
      ...data,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Pure filter and sort function for the inventory table and views
 */
export function filterAndSortItems(items: EquipmentItem[], filters: Partial<ItemFilters>): EquipmentItem[] {
  return items
    .filter((item) => {
      // 1. Text search across name, brand, model, serial_number, customer, notes
      if (filters.search && filters.search.trim() !== '') {
        const query = filters.search.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesBrand = item.brand.toLowerCase().includes(query);
        const matchesModel = item.model?.toLowerCase().includes(query) ?? false;
        const matchesSerial = item.serial_number?.toLowerCase().includes(query) ?? false;
        const matchesCustomer = item.customer_name?.toLowerCase().includes(query) ?? false;
        const matchesNotes = item.notes?.toLowerCase().includes(query) ?? false;

        if (!matchesName && !matchesBrand && !matchesModel && !matchesSerial && !matchesCustomer && !matchesNotes) {
          return false;
        }
      }

      // 2. Status & Stock Health filter
      if (filters.status && filters.status !== 'all') {
        if (filters.status === 'low_stock') {
          const qty = Number(item.quantity) || 0;
          const minThreshold = Number(item.min_stock_threshold) > 0 ? Number(item.min_stock_threshold) : 2;
          if (item.status !== 'in_stock' || qty <= 0 || qty > minThreshold) {
            return false;
          }
        } else if (filters.status === 'out_of_stock') {
          const qty = Number(item.quantity) || 0;
          if (qty > 0 && item.status !== 'sold') {
            return false;
          }
        } else if (item.status !== filters.status) {
          return false;
        }
      }

      // 3. Category filter
      if (filters.category && filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }

      // 4. Brand filter
      if (filters.brand && filters.brand !== 'all' && item.brand.toLowerCase() !== filters.brand.toLowerCase()) {
        return false;
      }

      // 5. Condition filter
      if (filters.condition && filters.condition !== 'all' && item.condition !== filters.condition) {
        return false;
      }

      // 6. Price range
      if (filters.minPrice !== undefined && item.retail_price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== undefined && item.retail_price > filters.maxPrice) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'purchase_price':
          comparison = Number(a.purchase_price) - Number(b.purchase_price);
          break;
        case 'retail_price':
          comparison = Number(a.retail_price) - Number(b.retail_price);
          break;
        case 'sold_price': {
          const priceA = a.sold_price !== null ? Number(a.sold_price) : Number(a.retail_price);
          const priceB = b.sold_price !== null ? Number(b.sold_price) : Number(b.retail_price);
          comparison = priceA - priceB;
          break;
        }
        case 'profit': {
          const profitA = calculateItemProfitMetrics(a).profit;
          const profitB = calculateItemProfitMetrics(b).profit;
          comparison = profitA - profitB;
          break;
        }
        case 'quantity':
          comparison = Number(a.quantity) - Number(b.quantity);
          break;
        case 'created_at':
        default: {
          const dateA = new Date(a.created_at).getTime() || 0;
          const dateB = new Date(b.created_at).getTime() || 0;
          comparison = dateA - dateB;
          break;
        }
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });
}
