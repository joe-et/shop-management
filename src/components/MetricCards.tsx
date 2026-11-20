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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t.metrics.financialOverview}</span>
          {isPeriodActive && (
            <span className="text-[10px] lowercase font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {getTimeframeLabel(timeframe)}
            </span>
          )}
        </div>

        {/* Timeframe Pills */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-inner self-start sm:self-auto">
          {(['today', 'this_week', 'this_month', 'all_time'] as TimeframePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => onTimeframeChange(period)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                timeframe === period
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {getTimeframeLabel(period)}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Net Realized Profit / Loss */}
        <div
          className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-200 shadow-lg ${
            isProfitable
              ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/30 shadow-emerald-950/20'
              : isLoss
              ? 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/30 shadow-rose-950/20'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {displayExpenses > 0 ? t.metrics.trueNetProfit : (isLoss ? t.metrics.netLoss : t.metrics.trueNetProfit)}
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isProfitable
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : isLoss
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {isProfitable ? (
                <TrendingUp className="w-5 h-5" />
              ) : isLoss ? (
                <TrendingDown className="w-5 h-5" />
              ) : (
                <DollarSign className="w-5 h-5" />
              )}
            </div>
          </div>

          <div className="mt-3">
            <div
              className={`text-2xl lg:text-3xl font-black tracking-tight ${
                isProfitable
                  ? 'text-emerald-400'
                  : isLoss
                  ? 'text-rose-400'
                  : 'text-slate-200'
              }`}
            >
              {profitMeta.text}
            </div>

            {displayExpenses > 0 ? (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 flex-wrap">
                <span className="text-emerald-400/90 font-medium">{t.metrics.grossProfit}: +{formatBirr(displayGrossProfit)}</span>
                <span className="text-slate-600">•</span>
                <span className="text-rose-400 font-medium">{t.metrics.overhead}: -{formatBirr(displayExpenses)}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-1">
                {displaySoldCount} {t.metrics.realizedRevenue} {isPeriodActive ? `(${getTimeframeLabel(timeframe).toLowerCase()})` : ''}
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">{t.metrics.margin}:</span>
              <span
                className={`font-semibold flex items-center ${
                  displayMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {displayMargin >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {displayMargin.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">{t.metrics.roi}:</span>
              <span
                className={`font-semibold ${
                  displayRoi >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {displayRoi.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* 2. Total Revenue */}
        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-blue-950/30 via-slate-900 to-slate-900 border border-blue-500/20 shadow-lg shadow-blue-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t.metrics.revenueCostBreakdown} ({getTimeframeLabel(timeframe)})
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-black tracking-tight text-white">
              {formatBirr(displayRevenue)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t.metrics.realizedRevenue}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>{t.metrics.costOfSold}:</span>
            <span className="font-semibold text-slate-300">
              {formatBirr(displayCostOfSold)}
            </span>
          </div>
        </div>

        {/* 3. Active Stock Investment (Cost & Retail) */}
        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-indigo-950/30 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-lg shadow-indigo-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t.metrics.activeInventoryCost}
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-black tracking-tight text-white">
              {formatBirr(metrics.activeInventoryCost)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t.metrics.unrealizedPotential}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">{t.metrics.activeRetailValue}:</span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <span>{formatBirr(metrics.activeInventoryRetailValue)}</span>
              <span className="text-[10px] text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">
                +{formatBirr(metrics.potentialProfit, { compact: true })}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Equipment Count Balance & Low Stock Alerts */}
        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-violet-950/30 via-slate-900 to-slate-900 border border-violet-500/20 shadow-lg shadow-violet-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t.metrics.equipmentCountBalance}
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-baseline gap-2">
              <span>{metrics.totalStockUnits}</span>
              <span className="text-sm font-normal text-slate-400">{t.metrics.totalUnitsInShop}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {metrics.inStockCount} {t.metrics.inStockOk} ({metrics.soldCount} {t.statuses.sold.toLowerCase()})
            </p>
          </div>

          {/* Interactive Stock Health Pills */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1 text-xs">
            {/* Low Stock Badge */}
            <button
              type="button"
              onClick={() => onSelectStockFilter && onSelectStockFilter(activeStockFilter === 'low_stock' ? 'all' : 'low_stock')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                metrics.lowStockCount > 0
                  ? activeStockFilter === 'low_stock'
                    ? 'bg-amber-500 text-slate-950 border border-amber-400 font-bold'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                  : 'bg-slate-800 text-slate-400'
              }`}
              title="Click to view items running low (≤ 2 units)"
            >
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span>{metrics.lowStockCount} {t.metrics.lowStockAlert}</span>
            </button>

            {/* Out of Stock Badge */}
            <button
              type="button"
              onClick={() => onSelectStockFilter && onSelectStockFilter(activeStockFilter === 'out_of_stock' ? 'all' : 'out_of_stock')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                metrics.outOfStockCount > 0
                  ? activeStockFilter === 'out_of_stock'
                    ? 'bg-rose-500 text-slate-950 border border-rose-400 font-bold'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
                  : 'bg-slate-800 text-slate-400'
              }`}
              title="Click to view out of stock items"
            >
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>{metrics.outOfStockCount} {t.metrics.outOfStockAlert}</span>
            </button>

            {/* In Stock Count */}
            <button
              type="button"
              onClick={() => onSelectStockFilter && onSelectStockFilter(activeStockFilter === 'in_stock' ? 'all' : 'in_stock')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                activeStockFilter === 'in_stock'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`}
              title="Click to view all in-stock items"
            >
              <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
              <span>{metrics.inStockCount} {t.metrics.inStockOk}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
