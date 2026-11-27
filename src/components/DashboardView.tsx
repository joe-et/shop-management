import React, { useMemo, useRef } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Boxes,
  BarChart3,
  Loader2
} from 'lucide-react';
import {
  EquipmentItem,
  FinancialMetrics,
  CategorySummary,
  TimeframePeriod,
  ItemFilters,
  ShopExpense
} from '../types/inventory';
import { MetricCards } from './MetricCards';
import { FilterBar } from './FilterBar';
import { InventoryTable } from './InventoryTable';
import { ReportsView } from './ReportsView';
import { useTranslation } from '../context/LanguageContext';

interface DashboardViewProps {
  items: EquipmentItem[];
  filteredItems: EquipmentItem[];
  loading: boolean;
  metrics: FinancialMetrics;
  categorySummaries: CategorySummary[];
  expenses: ShopExpense[];
  filters: ItemFilters;
  tabCounts: {
    all: number;
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
    sold: number;
  };
  timeframe: TimeframePeriod;
  onTimeframeChange: (timeframe: TimeframePeriod) => void;
  onFilterChange: (filters: ItemFilters) => void;
  onMarkSold: (item: EquipmentItem) => void;
  onRevertToStock: (item: EquipmentItem) => void;
  onEditItem: (item: EquipmentItem) => void;
  onDeleteItem: (item: EquipmentItem) => void;
  onViewAuditHistory: (item: EquipmentItem) => void;
  onOpenExpenses: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  items,
  filteredItems,
  loading,
  metrics,
  categorySummaries,
  expenses,
  filters,
  tabCounts,
  timeframe,
  onTimeframeChange,
  onFilterChange,
  onMarkSold,
  onRevertToStock,
  onEditItem,
  onDeleteItem,
  onViewAuditHistory,
  onOpenExpenses,
}) => {
  const { t, getCategoryLabel } = useTranslation();
  const stockSectionRef = useRef<HTMLElement>(null);

  // Low-stock and out-of-stock alerts matching calculations.ts thresholds
  const stockAlerts = useMemo(() => {
    return items
      .filter((item) => {
        if (item.status !== 'in_stock') return false;
        const qty = Number(item.quantity) || 0;
        const minThreshold =
          Number(item.min_stock_threshold) > 0
            ? Number(item.min_stock_threshold)
            : 2;
        return qty === 0 || qty <= minThreshold;
      })
      .sort((a, b) => (Number(a.quantity) || 0) - (Number(b.quantity) || 0))
      .slice(0, 6);
  }, [items]);

  const scrollToStockList = (override: Partial<ItemFilters>) => {
    onFilterChange({
      ...filters,
      ...override,
    });
    stockSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. KPI Overview Section */}
      <section aria-label="KPI Overview">
        <MetricCards
          metrics={metrics}
          timeframe={timeframe}
          onTimeframeChange={onTimeframeChange}
          onSelectStockFilter={(filter) =>
            scrollToStockList({
              status: filters.status === filter ? 'all' : filter,
            })
          }
          activeStockFilter={filters.status}
        />
      </section>

      {/* 2. Low & Out of Stock Alerts Strip */}
      <section aria-label="Stock Alerts">
        {stockAlerts.length === 0 ? (
          <div className="px-4 py-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-2.5 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-emerald-900">
              {t.dashboard.allStockHealthy}
            </span>
            <span className="text-emerald-700 hidden sm:inline">
              — {t.dashboard.allStockHealthyDesc}
            </span>
          </div>
        ) : (
          <div className="bg-white border border-amber-200 rounded-xl p-3.5 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 truncate">
                  {t.dashboard.stockAlertsTitle}
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                  {metrics.lowStockCount + metrics.outOfStockCount}
                </span>
              </div>
              <button
                type="button"
                onClick={() => scrollToStockList({ status: 'low_stock' })}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 shrink-0 cursor-pointer"
              >
                {t.dashboard.viewInCounter}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {stockAlerts.map((item) => {
                const qty = Number(item.quantity) || 0;
                const isOut = qty === 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      scrollToStockList({
                        status: isOut ? 'out_of_stock' : 'low_stock',
                        search: item.name,
                      })
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-colors cursor-pointer ${
                      isOut
                        ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {isOut ? (
                      <AlertCircle className="w-3 h-3 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                    )}
                    <span className="font-semibold truncate max-w-[140px]">
                      {item.name}
                    </span>
                    <span className="text-[10px] opacity-80 shrink-0">
                      ({getCategoryLabel(item.category)}: {isOut ? t.dashboard.outOfStockLabel : `${qty} ${t.dashboard.leftInStock}`})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 3. Shop Inventory Section (Search, Filters & Actions) */}
      <section ref={stockSectionRef} aria-label="Shop Inventory" className="space-y-3">
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4 text-slate-700 shrink-0" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {t.dashboard.inventorySectionTitle}
          </h2>
        </div>

        <FilterBar
          filters={filters}
          onFilterChange={onFilterChange}
          counts={tabCounts}
        />

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
            <Loader2 className="w-7 h-7 text-slate-700 animate-spin mx-auto mb-2.5" />
            <p className="text-sm font-medium text-slate-700">{t.common.loading}</p>
            <p className="text-xs text-slate-400 mt-1">{t.dbModal.subtitle}</p>
          </div>
        ) : (
          <InventoryTable
            items={filteredItems}
            onMarkSold={onMarkSold}
            onRevertToStock={onRevertToStock}
            onEdit={onEditItem}
            onDelete={onDeleteItem}
            onViewAuditHistory={onViewAuditHistory}
          />
        )}
      </section>

      {/* 4. Financial Reports Section (Under Dashboard, not in Navbar) */}
      <section
        aria-label="Financial Reports"
        className="pt-4 border-t border-slate-200 space-y-3"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-slate-700 shrink-0" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {t.dashboard.reportsSectionTitle}
          </h2>
        </div>

        <ReportsView
          metrics={metrics}
          categorySummaries={categorySummaries}
          expenses={expenses}
          timeframe={timeframe}
          onSelectCategory={(category) =>
            scrollToStockList({
              category: filters.category === category ? 'all' : category,
            })
          }
          onOpenExpenses={onOpenExpenses}
        />
      </section>
    </div>
  );
};
