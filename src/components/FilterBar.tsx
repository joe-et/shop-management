import React from 'react';
import { 
  Search, 
  ArrowUpDown, 
  Filter, 
  X,
  CheckCircle2,
  Archive,
  Layers,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { ItemFilters, ITEM_CATEGORIES } from '../types/inventory';
import { useTranslation } from '../context/LanguageContext';

interface FilterBarProps {
  filters: ItemFilters;
  onFilterChange: (filters: ItemFilters) => void;
  onOpenAddItem?: () => void;
  counts: {
    all: number;
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
    sold: number;
  };
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  counts,
}) => {
  const { t, getCategoryLabel } = useTranslation();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      search: e.target.value,
    });
  };

  const clearSearch = () => {
    onFilterChange({
      ...filters,
      search: '',
    });
  };

  const handleStatusTab = (status: ItemFilters['status']) => {
    onFilterChange({
      ...filters,
      status,
    });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      category: e.target.value,
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [sortBy, sortOrder] = e.target.value.split(':') as [
      ItemFilters['sortBy'],
      ItemFilters['sortOrder']
    ];
    onFilterChange({
      ...filters,
      sortBy,
      sortOrder,
    });
  };

  const currentSortValue = `${filters.sortBy}:${filters.sortOrder}`;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-2 shadow-xs">
      {/* Top Row: Compact Status Tabs (Horizontally scrollable with touch-friendly pills) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1 sm:mx-0 sm:px-0">
        {/* All */}
        <button
          type="button"
          onClick={() => handleStatusTab('all')}
          className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            filters.status === 'all'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{t.filters.tabAll}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            filters.status === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {counts.all}
          </span>
        </button>

        {/* In Stock */}
        <button
          type="button"
          onClick={() => handleStatusTab('in_stock')}
          className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            filters.status === 'in_stock'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className={`w-3.5 h-3.5 ${filters.status === 'in_stock' ? 'text-emerald-400' : 'text-emerald-600'}`} />
          <span>{t.filters.tabInStock}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            filters.status === 'in_stock' ? 'bg-slate-800 text-emerald-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {counts.in_stock}
          </span>
        </button>

        {/* Low Stock */}
        <button
          type="button"
          onClick={() => handleStatusTab('low_stock')}
          className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            filters.status === 'low_stock'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="≤ 2 units remaining"
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${filters.status === 'low_stock' ? 'text-amber-400' : 'text-amber-500'}`} />
          <span>{t.filters.tabLowStock}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            filters.status === 'low_stock' ? 'bg-slate-800 text-amber-300' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {counts.low_stock}
          </span>
        </button>

        {/* Out of Stock */}
        <button
          type="button"
          onClick={() => handleStatusTab('out_of_stock')}
          className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            filters.status === 'out_of_stock'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertCircle className={`w-3.5 h-3.5 ${filters.status === 'out_of_stock' ? 'text-rose-400' : 'text-rose-500'}`} />
          <span>{t.filters.tabOutOfStock}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            filters.status === 'out_of_stock' ? 'bg-slate-800 text-rose-300' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {counts.out_of_stock}
          </span>
        </button>

        {/* Sold */}
        <button
          type="button"
          onClick={() => handleStatusTab('sold')}
          className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            filters.status === 'sold'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Archive className="w-3.5 h-3.5 text-slate-500" />
          <span>{t.filters.tabSold}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            filters.status === 'sold' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
          }`}>
            {counts.sold}
          </span>
        </button>
      </div>

      {/* Bottom Row: Search, Category Filter, and Sort Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 border-t border-slate-100">
        {/* Search Bar (Full on mobile & tablet, Span 6 on desktop) */}
        <div className="sm:col-span-12 lg:col-span-6 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder={t.filters.searchPlaceholder}
            className="w-full pl-8 pr-7 py-2 sm:py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
          />
          {filters.search && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Dropdown (Span 6 on tablet, Span 3 on desktop) */}
        <div className="sm:col-span-6 lg:col-span-3 relative">
          <Filter className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={filters.category}
            onChange={handleCategoryChange}
            className="w-full pl-7 pr-7 py-2 sm:py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors cursor-pointer"
          >
            <option value="all">{t.filters.categoryAll}</option>
            {ITEM_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {getCategoryLabel(cat)}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Selector (Span 6 on tablet, Span 3 on desktop) */}
        <div className="sm:col-span-6 lg:col-span-3 relative">
          <ArrowUpDown className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={currentSortValue}
            onChange={handleSortChange}
            className="w-full pl-7 pr-7 py-2 sm:py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors cursor-pointer"
          >
            <option value="created_at:desc">{t.filters.sortLatest}</option>
            <option value="created_at:asc">{t.filters.sortOldest}</option>
            <option value="retail_price:desc">{t.filters.sortPriceHighLow}</option>
            <option value="retail_price:asc">{t.filters.sortPriceLowHigh}</option>
            <option value="purchase_price:desc">{t.filters.sortCostHighLow}</option>
            <option value="purchase_price:asc">{t.filters.sortCostLowHigh}</option>
            <option value="profit:desc">{t.filters.sortProfit}</option>
            <option value="profit:asc">{t.filters.sortProfitLowHigh}</option>
            <option value="name:asc">{t.filters.sortName}</option>
            <option value="name:desc">{t.filters.sortNameDesc}</option>
            <option value="quantity:desc">{t.filters.sortQuantity}</option>
          </select>
        </div>
      </div>
    </div>
  );
};
