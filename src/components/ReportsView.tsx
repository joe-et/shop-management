import React from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Boxes,
  Receipt
} from 'lucide-react';
import {
  FinancialMetrics,
  CategorySummary,
  TimeframePeriod,
  ShopExpense
} from '../types/inventory';
import { formatBirr, formatProfit } from '../utils/formatters';
import { useTranslation } from '../context/LanguageContext';

interface ReportsViewProps {
  metrics: FinancialMetrics;
  categorySummaries: CategorySummary[];
  expenses: ShopExpense[];
  timeframe: TimeframePeriod;
  onSelectCategory: (category: string) => void;
  onOpenExpenses: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  metrics,
  categorySummaries,
  expenses,
  timeframe,
  onSelectCategory,
  onOpenExpenses,
}) => {
  const { t, getTimeframeLabel, getCategoryLabel } = useTranslation();

  const isPeriodActive = timeframe !== 'all_time';
  const displayRevenue = isPeriodActive ? metrics.periodRevenue : metrics.totalRevenue;
  const displayCostOfSold = isPeriodActive ? metrics.periodCostOfSold : metrics.totalCostOfSold;
  const displayGrossProfit = isPeriodActive ? metrics.periodNetProfit : metrics.netProfit;
  const displayExpenses = isPeriodActive ? metrics.periodExpenses : metrics.totalExpenses;
  const displayTrueProfit = isPeriodActive ? metrics.periodTrueNetProfit : metrics.trueNetProfit;
  const displayMargin = displayRevenue > 0 ? (displayTrueProfit / displayRevenue) * 100 : 0;
  const displayRoi = displayCostOfSold > 0 ? (displayTrueProfit / displayCostOfSold) * 100 : 0;
  const profitMeta = formatProfit(displayTrueProfit);

  return (
    <div className="space-y-4">
      {/* Profit & Loss Header with Active Period Indicator */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-700 shrink-0" />
          <span className="truncate">{t.dashboard.profitLossTitle}</span>
          <span className="text-[10px] lowercase font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
            {getTimeframeLabel(timeframe)}
          </span>
        </div>
      </div>

      {/* Profit & Loss Financial Summary */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              {t.metrics.realizedRevenue}
            </span>
            <span className="text-lg font-bold text-slate-900 mt-1 block whitespace-nowrap">
              {formatBirr(displayRevenue)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              {t.metrics.costOfSold}
            </span>
            <span className="text-lg font-bold text-slate-700 mt-1 block whitespace-nowrap">
              {formatBirr(displayCostOfSold)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              {t.metrics.grossProfit}
            </span>
            <span className="text-lg font-bold text-emerald-700 mt-1 block whitespace-nowrap">
              {formatBirr(displayGrossProfit)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              {t.metrics.overhead}
            </span>
            <span className="text-lg font-bold text-rose-700 mt-1 block whitespace-nowrap">
              -{formatBirr(displayExpenses)}
            </span>
          </div>

          <div className={`p-3 rounded-xl border sm:col-span-2 lg:col-span-1 ${
            displayTrueProfit > 0
              ? 'bg-emerald-50/70 border-emerald-200'
              : displayTrueProfit < 0
              ? 'bg-rose-50/70 border-rose-200'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                {t.metrics.trueNetProfit}
              </span>
              {displayTrueProfit >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-600 shrink-0" />
              )}
            </div>
            <span className={`text-lg font-bold mt-1 block whitespace-nowrap ${
              displayTrueProfit > 0
                ? 'text-emerald-700'
                : displayTrueProfit < 0
                ? 'text-rose-700'
                : 'text-slate-900'
            }`}>
              {profitMeta.text}
            </span>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
              <span>{t.metrics.margin}: <strong className="text-slate-800">{displayMargin.toFixed(1)}%</strong></span>
              <span>{t.metrics.roi}: <strong className="text-slate-800">{displayRoi.toFixed(1)}%</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* Category Inventory Valuation Table */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50">
          <div className="flex items-center gap-2 min-w-0">
            <Boxes className="w-4 h-4 text-slate-700 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 truncate">
              {t.table.distributionByCategory}
            </h3>
          </div>
          <span className="text-xs text-slate-500 shrink-0">
            {categorySummaries.length} {t.table.categoriesRepresented}
          </span>
        </div>

        {categorySummaries.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            {t.dashboard.noCategoryData}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[540px]">
              <thead className="bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">{t.itemModal.category}</th>
                  <th className="py-2.5 px-3 text-right">{t.common.quantity}</th>
                  <th className="py-2.5 px-3 text-right">{t.table.totalCost}</th>
                  <th className="py-2.5 px-3 text-right">{t.table.totalRetail}</th>
                  <th className="py-2.5 px-4 text-right">{t.dashboard.potentialProfit}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categorySummaries.map((cat) => (
                  <tr
                    key={cat.category}
                    onClick={() => onSelectCategory(cat.category)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {getCategoryLabel(cat.category)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 font-medium whitespace-nowrap">
                      {cat.count}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 whitespace-nowrap">
                      {formatBirr(cat.totalCost)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {formatBirr(cat.totalRetailValue)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-emerald-700 whitespace-nowrap">
                      +{formatBirr(cat.potentialProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                <tr>
                  <td className="py-2.5 px-4">{t.dashboard.totalValuation}</td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    {categorySummaries.reduce((acc, c) => acc + c.count, 0)}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    {formatBirr(categorySummaries.reduce((acc, c) => acc + c.totalCost, 0))}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    {formatBirr(categorySummaries.reduce((acc, c) => acc + c.totalRetailValue, 0))}
                  </td>
                  <td className="py-2.5 px-4 text-right text-emerald-700 whitespace-nowrap">
                    +{formatBirr(categorySummaries.reduce((acc, c) => acc + c.potentialProfit, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* Operating Expenses Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{t.expensesModal.modalTitle}</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {expenses.length} {t.expensesModal.recentExpenses} • {formatBirr(metrics.totalExpenses)} {t.expensesModal.totalOverhead}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenExpenses}
          className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-semibold text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs cursor-pointer text-center"
        >
          {t.expensesModal.logNewExpense}
        </button>
      </section>
    </div>
  );
};
