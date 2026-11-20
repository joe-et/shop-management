import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  AlertTriangle,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { FinancialMetrics, TimeframePeriod } from '../types/inventory';
import { formatBirr, formatProfit } from '../utils/formatters';
import { useTranslation } from '../context/LanguageContext';

interface MetricCardsProps {
  metrics: FinancialMetrics;
  timeframe: TimeframePeriod;
  onTimeframeChange: (timeframe: TimeframePeriod) => void;
  onSelectStockFilter?: (filter: 'in_stock' | 'low_stock' | 'out_of_stock' | 'all') => void;
  activeStockFilter?: string;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ 
  metrics,
  timeframe,
  onTimeframeChange,
  onSelectStockFilter,
  activeStockFilter
}) => {
  const { t, getTimeframeLabel } = useTranslation();
  const isPeriodActive = timeframe !== 'all_time';
  const displayGrossProfit = isPeriodActive ? metrics.periodNetProfit : metrics.netProfit;
  const displayExpenses = isPeriodActive ? metrics.periodExpenses : metrics.totalExpenses;
  const displayTrueProfit = isPeriodActive ? metrics.periodTrueNetProfit : metrics.trueNetProfit;

  const displayRevenue = isPeriodActive ? metrics.periodRevenue : metrics.totalRevenue;
  const displayCostOfSold = isPeriodActive ? metrics.periodCostOfSold : metrics.totalCostOfSold;
  const displaySoldCount = isPeriodActive ? metrics.periodSoldCount : metrics.soldCount;

  // Bottom-line margin and ROI factoring operating overhead
  const displayMargin = displayRevenue > 0 ? (displayTrueProfit / displayRevenue) * 100 : 0;
  const displayRoi = displayCostOfSold > 0 ? (displayTrueProfit / displayCostOfSold) * 100 : 0;

  const profitMeta = formatProfit(displayTrueProfit);
  const isProfitable = displayTrueProfit > 0;
  const isLoss = displayTrueProfit < 0;

  return (
    <div className="space-y-3">
      {/* Timeframe Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-700" />
          <span>{t.metrics.financialOverview}</span>
          {isPeriodActive && (
            <span className="text-[10px] lowercase font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {getTimeframeLabel(timeframe)}
            </span>
          )}
        </div>

        {/* Timeframe Pills */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-xs self-start sm:self-auto">
          {(['today', 'this_week', 'this_month', 'all_time'] as TimeframePeriod[]).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => onTimeframeChange(period)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                timeframe === period
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {getTimeframeLabel(period)}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Net Realized Profit / Loss */}
        <div className="relative overflow-hidden rounded-xl p-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {displayExpenses > 0 ? t.metrics.trueNetProfit : (isLoss ? t.metrics.netLoss : t.metrics.trueNetProfit)}
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              {isProfitable ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : isLoss ? (
                <TrendingDown className="w-4 h-4 text-rose-600" />
              ) : (
                <DollarSign className="w-4 h-4 text-slate-600" />
              )}
            </div>
          </div>

          <div className="mt-2">
            <div
              className={`text-2xl font-bold tracking-tight ${
                isProfitable
                  ? 'text-emerald-600'
                  : isLoss
                  ? 'text-rose-600'
                  : 'text-slate-900'
              }`}
            >
              {profitMeta.text}
            </div>

            {displayExpenses > 0 ? (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 flex-wrap">
                <span className="text-emerald-700 font-medium">{t.metrics.grossProfit}: +{formatBirr(displayGrossProfit)}</span>
                <span className="text-slate-300">•</span>
                <span className="text-rose-700 font-medium">{t.metrics.overhead}: -{formatBirr(displayExpenses)}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-0.5">
                {displaySoldCount} {t.metrics.realizedRevenue} {isPeriodActive ? `(${getTimeframeLabel(timeframe).toLowerCase()})` : ''}
              </p>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <span className="text-slate-500">{t.metrics.margin}:</span>
              <span
                className={`font-semibold flex items-center ${
                  displayMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {displayMargin >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {displayMargin.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">{t.metrics.roi}:</span>
              <span
                className={`font-semibold ${
                  displayRoi >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {displayRoi.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* 2. Total Revenue */}
        <div className="relative overflow-hidden rounded-xl p-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {t.metrics.revenueCostBreakdown}
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-slate-700" />
            </div>
          </div>

          <div className="mt-2">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              {formatBirr(displayRevenue)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.metrics.realizedRevenue}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{t.metrics.costOfSold}:</span>
            <span className="font-semibold text-slate-700">
              {formatBirr(displayCostOfSold)}
            </span>
          </div>
        </div>

        {/* 3. Active Stock Investment (Cost & Retail) */}
        <div className="relative overflow-hidden rounded-xl p-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {t.metrics.activeInventoryCost}
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <Package className="w-4 h-4 text-slate-700" />
            </div>
          </div>

          <div className="mt-2">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              {formatBirr(metrics.activeInventoryCost)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.metrics.unrealizedPotential}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">{t.metrics.activeRetailValue}:</span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <span>{formatBirr(metrics.activeInventoryRetailValue)}</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                +{formatBirr(metrics.potentialProfit, { compact: true })}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Equipment Count Balance & Stock Indicators */}
        <div className="relative overflow-hidden rounded-xl p-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {t.metrics.equipmentCountBalance}
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <Layers className="w-4 h-4 text-slate-700" />
            </div>
          </div>

          <div className="mt-2">
            <div className="text-2xl font-bold tracking-tight text-slate-900 flex items-baseline gap-1.5">
              <span>{metrics.totalStockUnits}</span>
              <span className="text-xs font-normal text-slate-500">{t.metrics.totalUnitsInShop}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {metrics.inStockCount} {t.metrics.inStockOk} ({metrics.soldCount} {t.statuses.sold.toLowerCase()})
            </p>
          </div>

          {/* Interactive Stock Health Pills */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
            {/* Low Stock Badge */}
            <button
              type="button"
              onClick={() => onSelectStockFilter && onSelectStockFilter(activeStockFilter === 'low_stock' ? 'all' : 'low_stock')}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeStockFilter === 'low_stock'
                  ? 'bg-slate-900 text-white font-semibold'
                  : metrics.lowStockCount > 0
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'text-slate-400'
              }`}
              title="≤ 2 units remaining"
            >
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>{metrics.lowStockCount} {t.metrics.lowStockAlert}</span>
            </button>

            {/* Out of Stock Badge */}
            <button
              type="button"
              onClick={() => onSelectStockFilter && onSelectStockFilter(activeStockFilter === 'out_of_stock' ? 'all' : 'out_of_stock')}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeStockFilter === 'out_of_stock'
                  ? 'bg-slate-900 text-white font-semibold'
                  : metrics.outOfStockCount > 0
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'text-slate-400'
              }`}
              title="0 units remaining"
            >
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{metrics.outOfStockCount} {t.metrics.outOfStockAlert}</span>
            </button>

            {/* In Stock Count */}
            <button
              type="button"
              onClick={() => onSelectStockFilter && onSelectStockFilter(activeStockFilter === 'in_stock' ? 'all' : 'in_stock')}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeStockFilter === 'in_stock'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-600" />
              <span>{metrics.inStockCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
