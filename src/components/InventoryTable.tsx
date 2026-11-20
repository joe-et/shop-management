import React from 'react';
import { 
  RotateCcw, 
  Edit3, 
  Trash2, 
  Calendar, 
  User, 
  TrendingUp, 
  TrendingDown, 
  PackageOpen,
  DollarSign,
  History
} from 'lucide-react';
import { EquipmentItem, ITEM_CONDITIONS } from '../types/inventory';
import { calculateItemProfitMetrics } from '../utils/calculations';
import { formatBirr, formatDate, formatProfit, formatPercentage } from '../utils/formatters';
import { useTranslation } from '../context/LanguageContext';

interface InventoryTableProps {
  items: EquipmentItem[];
  onMarkSold: (item: EquipmentItem) => void;
  onRevertToStock: (item: EquipmentItem) => void;
  onEdit: (item: EquipmentItem) => void;
  onDelete: (item: EquipmentItem) => void;
  onViewAuditHistory?: (item: EquipmentItem) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  onMarkSold,
  onRevertToStock,
  onEdit,
  onDelete,
  onViewAuditHistory,
}) => {
  const { 
    t, 
    getCategoryLabel, 
    getStatusLabel, 
    getConditionLabel, 
    formatQtyWithUnit 
  } = useTranslation();

  if (items.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
          <PackageOpen className="w-8 h-8 opacity-60" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">{t.table.noItemsFound}</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          {t.table.noItemsSubtext}
        </p>
      </div>
    );
  }

  const getConditionBadge = (conditionVal: string) => {
    const cond = ITEM_CONDITIONS.find((c) => c.value === conditionVal);
    const badgeColor = cond?.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${badgeColor}`}>
        {getConditionLabel(conditionVal)}
      </span>
    );
  };

  const getStatusBadge = (item: EquipmentItem) => {
    if (item.status === 'in_stock') {
      const qty = Number(item.quantity) || 0;
      const minThreshold = Number(item.min_stock_threshold) > 0 ? Number(item.min_stock_threshold) : 2;

      if (qty === 0) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            {t.metrics.outOfStockAlert}
          </span>
        );
      }

      if (qty <= minThreshold) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {t.metrics.lowStockAlert} ({qty})
          </span>
        );
      }

      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {t.statuses.in_stock} ({qty})
        </span>
      );
    }

    switch (item.status) {
      case 'sold':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            {t.statuses.sold}
          </span>
        );
      case 'reserved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            {t.statuses.reserved}
          </span>
        );
      case 'damaged':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            {t.statuses.damaged}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {getStatusLabel(item.status)}
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-md overflow-hidden">
      {/* Desktop / Tablet Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-4">{t.table.equipmentDetails}</th>
              <th className="py-3.5 px-3">{t.table.conditionStatus}</th>
              <th className="py-3.5 px-3 text-right">{t.table.purchaseCost}</th>
              <th className="py-3.5 px-3 text-right">{t.table.retailPrice}</th>
              <th className="py-3.5 px-3 text-right">{t.table.soldPrice}</th>
              <th className="py-3.5 px-4 text-right">{t.table.profitMargin}</th>
              <th className="py-3.5 px-4 text-center">{t.table.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-sm">
            {items.map((item) => {
              const metrics = calculateItemProfitMetrics(item);
              const isSold = item.status === 'sold';
              const profitMeta = formatProfit(metrics.profit);
              const isProfitable = metrics.profit > 0;
              const isLoss = metrics.profit < 0;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-850/60 transition-colors group"
                >
                  {/* Equipment Details */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                          {item.name}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                            ×{formatQtyWithUnit(item.quantity, item.unit)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                        <span className="text-slate-300 font-medium">{item.brand}</span>
                        {item.model && <span>• {item.model}</span>}
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">{getCategoryLabel(item.category)}</span>
                        {item.serial_number && (
                          <span className="font-mono text-[11px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            SN: {item.serial_number}
                          </span>
                        )}
                      </div>
                      {isSold && (
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1 text-blue-400 font-medium">
                            <Calendar className="w-3 h-3" />
                            {t.statuses.sold} {formatDate(item.sold_at)}
                          </span>
                          {item.customer_name && (
                            <span className="flex items-center gap-1 text-slate-300">
                              <User className="w-3 h-3 text-slate-500" />
                              {item.customer_name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Condition & Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex flex-col items-start gap-1.5">
                      {getStatusBadge(item)}
                      {getConditionBadge(item.condition)}
                    </div>
                  </td>

                  {/* Purchase Cost */}
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <span className="font-semibold text-slate-300">
                      {formatBirr(item.purchase_price)}
                    </span>
                    {item.quantity > 1 && (
                      <div className="text-[10px] text-slate-500">
                        {t.table.totalCost}: {formatBirr(item.purchase_price * item.quantity)}
                      </div>
                    )}
                  </td>

                  {/* Retail Listing Price */}
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <span className="font-semibold text-slate-200">
                      {formatBirr(item.retail_price)}
                    </span>
                    {item.quantity > 1 && (
                      <div className="text-[10px] text-slate-500">
                        {t.table.totalRetail}: {formatBirr(item.retail_price * item.quantity)}
                      </div>
                    )}
                  </td>

                  {/* Sold Price */}
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    {isSold && item.sold_price !== null ? (
                      <div>
                        <span className="font-bold text-blue-300">
                          {formatBirr(item.sold_price)}
                        </span>
                        {item.quantity > 1 && (
                          <div className="text-[10px] text-blue-400/80">
                            {t.table.totalRevenue}: {formatBirr(item.sold_price * item.quantity)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-xs italic">{t.table.unsold}</span>
                    )}
                  </td>

                  {/* Profit / Loss & Margin */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex flex-col items-end">
                      <span
                        className={`font-bold flex items-center gap-1 ${
                          isProfitable
                            ? 'text-emerald-400'
                            : isLoss
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {isProfitable ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : isLoss ? (
                          <TrendingDown className="w-3.5 h-3.5" />
                        ) : null}
                        {profitMeta.text}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                            isProfitable
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : isLoss
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {formatPercentage(metrics.marginPercent)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {isSold ? t.table.soldPrice.toLowerCase() : t.table.retailPrice.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      {!isSold ? (
                        <button
                          onClick={() => onMarkSold(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-sm cursor-pointer"
                          title={t.soldModal.title}
                        >
                          <DollarSign className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{t.common.sell}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onRevertToStock(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                          title={t.common.revertToStock}
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                          <span>{t.common.revert}</span>
                        </button>
                      )}

                      <button
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
                        title={t.common.edit}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {onViewAuditHistory && (
                        <button
                          onClick={() => onViewAuditHistory(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-950/40 border border-transparent hover:border-amber-700/50 transition-colors cursor-pointer"
                          title={t.common.viewAuditHistory}
                        >
                          <History className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onDelete(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-800/40 transition-colors cursor-pointer"
                        title={t.common.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile / Tablet Cards View */}
      <div className="block lg:hidden divide-y divide-slate-800">
        {items.map((item) => {
          const metrics = calculateItemProfitMetrics(item);
          const isSold = item.status === 'sold';
          const profitMeta = formatProfit(metrics.profit);
          const isProfitable = metrics.profit > 0;
          const isLoss = metrics.profit < 0;

          return (
            <div key={item.id} className="p-4 space-y-3">
              {/* Header: Title & Status */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-white text-base leading-snug">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {item.brand} {item.model ? `• ${item.model}` : ''} • {getCategoryLabel(item.category)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {getStatusBadge(item)}
                  {getConditionBadge(item.condition)}
                </div>
              </div>

              {/* Serial & Qty */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                {item.serial_number && (
                  <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    SN: {item.serial_number}
                  </span>
                )}
                <span className="font-semibold text-slate-300">
                  {t.common.quantity}: {formatQtyWithUnit(item.quantity, item.unit)}
                </span>
              </div>

              {/* Financial Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">{t.table.purchaseCost}</span>
                  <span className="font-semibold text-slate-300">{formatBirr(item.purchase_price)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">{t.table.retailPrice}</span>
                  <span className="font-semibold text-slate-200">{formatBirr(item.retail_price)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">{t.table.soldPrice}</span>
                  <span className="font-semibold text-blue-300">
                    {isSold && item.sold_price !== null ? formatBirr(item.sold_price) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">{t.table.profitMargin}</span>
                  <span
                    className={`font-bold ${
                      isProfitable ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    {profitMeta.text}
                  </span>
                </div>
              </div>

              {isSold && (
                <div className="text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2">
                  <span>{t.statuses.sold}: {formatDate(item.sold_at)}</span>
                  {item.customer_name && <span>{t.soldModal.customerName}: {item.customer_name}</span>}
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                {!isSold ? (
                  <button
                    onClick={() => onMarkSold(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-sm"
                  >
                    <DollarSign className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t.common.sell}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onRevertToStock(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.common.revert}</span>
                  </button>
                )}

                <button
                  onClick={() => onEdit(item)}
                  className="p-1.5 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                  title={t.common.edit}
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {onViewAuditHistory && (
                  <button
                    onClick={() => onViewAuditHistory(item)}
                    className="p-1.5 rounded-lg text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-700/50 transition-colors"
                    title={t.common.viewAuditHistory}
                  >
                    <History className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => onDelete(item)}
                  className="p-1.5 rounded-lg text-rose-400 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/40 transition-colors"
                  title={t.common.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
