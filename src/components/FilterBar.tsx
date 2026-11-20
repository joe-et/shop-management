import React from 'react';
import { 
  Search, 
  Plus, 
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
  onOpenAddItem: () => void;
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
  onOpenAddItem,
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-md">
      {/* Top Row: Status Tabs & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => handleStatusTab('all')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              filters.status === 'all'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t.filters.tabAll}</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/60 text-slate-300">
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => handleStatusTab('in_stock')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              filters.status === 'in_stock'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-900/50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.filters.tabInStock}</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-900/60 text-emerald-300">
              {counts.in_stock}
            </span>
          </button>

          <button
            onClick={() => handleStatusTab('low_stock')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              filters.status === 'low_stock'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-amber-300 hover:bg-slate-900/50'
            }`}
            title="Items with low stock (≤ 2 units remaining)"
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${counts.low_stock > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
            <span>{t.filters.tabLowStock}</span>
            <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
              counts.low_stock > 0 ? 'bg-amber-900/80 text-amber-200 font-bold' : 'bg-slate-800 text-slate-400'
            }`}>
              {counts.low_stock}
            </span>
          </button>

          <button
            onClick={() => handleStatusTab('out_of_stock')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              filters.status === 'out_of_stock'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-rose-300 hover:bg-slate-900/50'
            }`}
            title="Items with 0 units remaining"
          >
            <AlertCircle className={`w-3.5 h-3.5 ${counts.out_of_stock > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
            <span>{t.filters.tabOutOfStock}</span>
            <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
              counts.out_of_stock > 0 ? 'bg-rose-900/80 text-rose-200 font-bold' : 'bg-slate-800 text-slate-400'
            }`}>
              {counts.out_of_stock}
            </span>
          </button>

          <button
            onClick={() => handleStatusTab('sold')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              filters.status === 'sold'
                ? 'bg-blue-950/80 text-blue-300 border border-blue-600/50 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-blue-300 hover:bg-slate-900/50'
            }`}
          >
            <Archive className="w-3.5 h-3.5 text-blue-400" />
            <span>{t.filters.tabSold}</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-blue-900/60 text-blue-300">
              {counts.sold}
            </span>
          </button>
        </div>

        {/* Add Equipment CTA Button */}
        <button
          onClick={onOpenAddItem}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t.common.newArrival}</span>
        </button>
      </div>

      {/* Bottom Row: Search, Category Filter, and Sort Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search Bar (Span 6) */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder={t.filters.searchPlaceholder}
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
          />
          {filters.search && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Dropdown (Span 3) */}
        <div className="sm:col-span-3 relative">
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={filters.category}
            onChange={handleCategoryChange}
            className="w-full pl-8 pr-8 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
          >
            <option value="all">{t.filters.categoryAll}</option>
            {ITEM_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {getCategoryLabel(cat)}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">
            ▼
          </div>
        </div>

        {/* Sort Selector (Span 3) */}
        <div className="sm:col-span-3 relative">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={currentSortValue}
            onChange={handleSortChange}
            className="w-full pl-8 pr-8 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
          >
            <option value="created_at:desc">{t.filters.sortLatest}</option>
            <option value="created_at:asc">{t.filters.sortLatest} (Oldest)</option>
            <option value="retail_price:desc">{t.filters.sortPriceHighLow}</option>
            <option value="retail_price:asc">{t.filters.sortPriceLowHigh}</option>
            <option value="purchase_price:desc">{t.itemModal.purchasePricePerUnit}: High → Low</option>
            <option value="purchase_price:asc">{t.itemModal.purchasePricePerUnit}: Low → High</option>
            <option value="profit:desc">{t.filters.sortProfit}</option>
            <option value="profit:asc">{t.filters.sortProfit} (Low → High)</option>
            <option value="name:asc">{t.filters.sortName}</option>
            <option value="name:desc">{t.filters.sortName} (Z → A)</option>
            <option value="quantity:desc">{t.filters.sortQuantity}</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">
            ▼
          </div>
        </div>
      </div>
    </div>
  );
};
