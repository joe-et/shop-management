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
import { EquipmentItem } from '../types/inventory';
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
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
          <PackageOpen className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">{t.table.noItemsFound}</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {t.table.noItemsSubtext}
        </p>
      </div>
    );
  }

  const getConditionBadge = (conditionVal: string) => {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {t.metrics.outOfStockAlert}
          </span>
        );
      }

      if (qty <= minThreshold) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {t.metrics.lowStockAlert} ({qty})
          </span>
        );
      }

      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {t.statuses.in_stock} ({qty})
        </span>
      );
    }

    switch (item.status) {
      case 'sold':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {t.statuses.sold}
          </span>
        );
      case 'reserved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            {t.statuses.reserved}
          </span>
        );
      case 'damaged':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {t.statuses.damaged}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {getStatusLabel(item.status)}
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Desktop / Tablet Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-2.5 px-3.5">{t.table.equipmentDetails}</th>
              <th className="py-2.5 px-3">{t.table.conditionStatus}</th>
              <th className="py-2.5 px-3 text-right">{t.table.purchaseCost}</th>
              <th className="py-2.5 px-3 text-right">{t.table.retailPrice}</th>
              <th className="py-2.5 px-3 text-right">{t.table.soldPrice}</th>
              <th className="py-2.5 px-3.5 text-right">{t.table.profitMargin}</th>
              <th className="py-2.5 px-3.5 text-center">{t.table.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {items.map((item) => {
              const metrics = calculateItemProfitMetrics(item);
              const isSold = item.status === 'sold';
              const profitMeta = formatProfit(metrics.profit);
              const isProfitable = metrics.profit > 0;
              const isLoss = metrics.profit < 0;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Equipment Details */}
                  <td className="py-2.5 px-3.5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 group-hover:text-slate-950">
                          {item.name}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            ×{formatQtyWithUnit(item.quantity, item.unit)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                        <span className="font-medium text-slate-700">{item.brand}</span>
                        {item.model && <span>• {item.model}</span>}
                        <span className="text-slate-300">•</span>
                        <span>{getCategoryLabel(item.category)}</span>
                        {item.serial_number && (
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-50 px-1 py-0.2 rounded border border-slate-200">
                            SN: {item.serial_number}
                          </span>
                        )}
                      </div>
                      {isSold && (
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {t.statuses.sold} {formatDate(item.sold_at)}
                          </span>
                          {item.customer_name && (
                            <span className="flex items-center gap-1 text-slate-600">
                              <User className="w-3 h-3 text-slate-400" />
                              {item.customer_name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Condition & Status */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex flex-col items-start gap-1">
                      {getStatusBadge(item)}
                      {getConditionBadge(item.condition)}
                    </div>
                  </td>

                  {/* Purchase Cost */}
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <span className="font-semibold text-slate-800">
                      {formatBirr(item.purchase_price)}
                    </span>
                    {item.quantity > 1 && (
                      <div className="text-[10px] text-slate-400">
                        {t.table.totalCost}: {formatBirr(item.purchase_price * item.quantity)}
                      </div>
                    )}
                  </td>

                  {/* Retail Listing Price */}
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <span className="font-semibold text-slate-900">
                      {formatBirr(item.retail_price)}
                    </span>
                    {item.quantity > 1 && (
                      <div className="text-[10px] text-slate-400">
                        {t.table.totalRetail}: {formatBirr(item.retail_price * item.quantity)}
                      </div>
                    )}
                  </td>

                  {/* Sold Price */}
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    {isSold && item.sold_price !== null ? (
                      <div>
                        <span className="font-bold text-slate-900">
                          {formatBirr(item.sold_price)}
                        </span>
                        {item.quantity > 1 && (
                          <div className="text-[10px] text-slate-500">
                            {t.table.totalRevenue}: {formatBirr(item.sold_price * item.quantity)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">{t.table.unsold}</span>
                    )}
                  </td>

                  {/* Profit / Loss & Margin */}
                  <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                    <div className="flex flex-col items-end">
                      <span
                        className={`font-semibold flex items-center gap-1 ${
                          isProfitable
                            ? 'text-emerald-600'
                            : isLoss
                            ? 'text-rose-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {isProfitable ? (
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                        ) : isLoss ? (
                          <TrendingDown className="w-3 h-3 text-rose-600" />
                        ) : null}
                        {profitMeta.text}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className={`text-[10px] font-semibold px-1 py-0.2 rounded border ${
                            isProfitable
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isLoss
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {formatPercentage(metrics.marginPercent)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isSold ? t.table.soldPrice.toLowerCase() : t.table.retailPrice.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {!isSold ? (
                        <button
                          type="button"
                          onClick={() => onMarkSold(item)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
                          title={t.soldModal.title}
                        >
                          <DollarSign className="w-3 h-3 stroke-[2.5]" />
                          <span>{t.common.sell}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onRevertToStock(item)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                          title={t.common.revertToStock}
                        >
                          <RotateCcw className="w-3 h-3 text-slate-600" />
                          <span>{t.common.revert}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        title={t.common.edit}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {onViewAuditHistory && (
                        <button
                          type="button"
                          onClick={() => onViewAuditHistory(item)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title={t.common.viewAuditHistory}
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title={t.common.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
      <div className="block lg:hidden divide-y divide-slate-100">
        {items.map((item) => {
          const metrics = calculateItemProfitMetrics(item);
          const isSold = item.status === 'sold';
          const profitMeta = formatProfit(metrics.profit);
          const isProfitable = metrics.profit > 0;
          const isLoss = metrics.profit < 0;

          return (
            <div key={item.id} className="p-3.5 space-y-2.5">
              {/* Header: Title & Status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm leading-snug">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {item.brand} {item.model ? `• ${item.model}` : ''} • {getCategoryLabel(item.category)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {getStatusBadge(item)}
                  {getConditionBadge(item.condition)}
                </div>
              </div>

              {/* Serial & Qty */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {item.serial_number && (
                  <span className="font-mono text-[10px] bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                    SN: {item.serial_number}
                  </span>
                )}
                <span className="font-semibold text-slate-700">
                  {t.common.quantity}: {formatQtyWithUnit(item.quantity, item.unit)}
                </span>
              </div>

              {/* Financial Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">{t.table.purchaseCost}</span>
                  <span className="font-semibold text-slate-800">{formatBirr(item.purchase_price)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">{t.table.retailPrice}</span>
                  <span className="font-semibold text-slate-900">{formatBirr(item.retail_price)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">{t.table.soldPrice}</span>
                  <span className="font-semibold text-slate-900">
                    {isSold && item.sold_price !== null ? formatBirr(item.sold_price) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">{t.table.profitMargin}</span>
                  <span
                    className={`font-bold ${
                      isProfitable ? 'text-emerald-600' : isLoss ? 'text-rose-600' : 'text-slate-500'
                    }`}
                  >
                    {profitMeta.text}
                  </span>
                </div>
              </div>

              {isSold && (
                <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
                  <span>{t.statuses.sold}: {formatDate(item.sold_at)}</span>
                  {item.customer_name && <span>{t.soldModal.customerName}: {item.customer_name}</span>}
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                {!isSold ? (
                  <button
                    type="button"
                    onClick={() => onMarkSold(item)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-2xs"
                  >
                    <DollarSign className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t.common.sell}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRevertToStock(item)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                    <span>{t.common.revert}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="p-1.5 rounded-lg text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
                  title={t.common.edit}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                {onViewAuditHistory && (
                  <button
                    type="button"
                    onClick={() => onViewAuditHistory(item)}
                    className="p-1.5 rounded-lg text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
                    title={t.common.viewAuditHistory}
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors"
                  title={t.common.delete}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
