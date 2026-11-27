import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  User, 
  Phone, 
  TrendingUp, 
  TrendingDown, 
  Tag, 
  AlertTriangle, 
  Receipt,
  Boxes,
  Minus,
  Plus,
  Info
} from 'lucide-react';
import { EquipmentItem } from '../types/inventory';
import { formatBirr, formatPercentage } from '../utils/formatters';
import { useTranslation } from '../context/LanguageContext';

interface MarkSoldModalProps {
  isOpen: boolean;
  item: EquipmentItem | null;
  onClose: () => void;
  onConfirm: (
    id: string,
    saleDetails: {
      sold_price: number;
      sold_at: string;
      customer_name?: string;
      customer_phone?: string;
      notes?: string;
      quantity_sold?: number;
    }
  ) => Promise<void>;
}

export const MarkSoldModal: React.FC<MarkSoldModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirm,
}) => {
  const { t, getCategoryLabel, getUnitDisplay, formatQtyWithUnit } = useTranslation();
  const [soldPrice, setSoldPrice] = useState<number>(0);
  const [quantityToSell, setQuantityToSell] = useState<number>(1);
  const [soldDate, setSoldDate] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item && isOpen) {
      // Default to listed retail price or existing sold price
      setSoldPrice(item.sold_price !== null ? item.sold_price : item.retail_price);
      // Default quantity to 1 (or current quantity if only 1)
      setQuantityToSell(1);
      // Today's date formatted as YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      setSoldDate(item.sold_at ? item.sold_at.split('T')[0] : today);
      setCustomerName(item.customer_name || '');
      setCustomerPhone(item.customer_phone || '');
      setSaleNotes('');
      setError(null);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const purchasePrice = Number(item.purchase_price) || 0;
  const retailPrice = Number(item.retail_price) || 0;
  const availableQty = Number(item.quantity) || 1;
  const numSoldPrice = Number(soldPrice) || 0;
  const numQtyToSell = Math.min(Math.max(Number(quantityToSell) || 1, 1), availableQty);

  // Live calculation of profit and margin based STRICTLY on quantity sold
  const unitProfit = numSoldPrice - purchasePrice;
  const totalSaleRevenue = numSoldPrice * numQtyToSell;
  const totalSaleCost = purchasePrice * numQtyToSell;
  const totalSaleProfit = unitProfit * numQtyToSell;

  const marginPercent = numSoldPrice > 0 ? (unitProfit / numSoldPrice) * 100 : 0;
  const roiPercent = purchasePrice > 0 ? (unitProfit / purchasePrice) * 100 : 0;

  const discountAmount = retailPrice - numSoldPrice;
  const isDiscounted = discountAmount > 0;
  const isLoss = totalSaleProfit < 0;
  const isProfitable = totalSaleProfit > 0;
  const isPartialSale = numQtyToSell < availableQty;
  const remainingStock = availableQty - numQtyToSell;

  const handleStepQty = (delta: number) => {
    setQuantityToSell((prev) => {
      const next = prev + delta;
      return Math.min(Math.max(next, 1), availableQty);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numSoldPrice < 0) {
      setError('Sold price cannot be negative');
      return;
    }

    if (numQtyToSell < 1 || numQtyToSell > availableQty) {
      setError(`Quantity to sell must be between 1 and ${availableQty}`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirm(item.id, {
        sold_price: numSoldPrice,
        sold_at: new Date(soldDate).toISOString(),
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        notes: saleNotes.trim() || undefined,
        quantity_sold: numQtyToSell,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record sale';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const unitDisp = getUnitDisplay(item.unit);
  const unitLabel = numQtyToSell === 1 ? unitDisp.singular : unitDisp.plural;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="mark-sold-modal-title"
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[82dvh] sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 id="mark-sold-modal-title" className="text-sm sm:text-base font-bold text-slate-900">{t.soldModal.title}</h3>
              <p className="text-xs text-slate-500">{t.soldModal.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-3.5 sm:p-5 overflow-y-auto space-y-3.5 flex-1 overscroll-contain">
          {/* Item Context Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">{item.name}</h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <span className="text-slate-700 font-medium">{getCategoryLabel(item.category)}</span>
                  <span>•</span>
                  <span>{item.brand}</span>
                  {item.model && <span>• {item.model}</span>}
                  {item.serial_number && <span>• SN: {item.serial_number}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {formatQtyWithUnit(availableQty, item.unit)} {t.soldModal.availableBadge}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 mt-1 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">{t.soldModal.unitCost}</span>
                <span className="font-semibold text-slate-800">{formatBirr(purchasePrice)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">{t.soldModal.targetListedPrice}</span>
                <span className="font-semibold text-slate-900">{formatBirr(retailPrice)}</span>
              </div>
            </div>
          </div>

          {/* QUANTITY TO SELL SECTION */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-slate-800" />
                {t.soldModal.quantityToSell} ({unitDisp.label}) <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-500">
                {t.soldModal.maxUnits}: <strong className="text-slate-900">{availableQty}</strong> {unitLabel}
              </span>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
              {/* Stepper Input */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => handleStepQty(-1)}
                  disabled={numQtyToSell <= 1}
                  className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={availableQty}
                  required
                  value={quantityToSell}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      setQuantityToSell(val);
                    }
                  }}
                  className="w-14 text-center bg-transparent py-1.5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleStepQty(1)}
                  disabled={numQtyToSell >= availableQty}
                  className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap flex-1">
                <button
                  type="button"
                  onClick={() => setQuantityToSell(1)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    numQtyToSell === 1
                      ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t.soldModal.presetOne}
                </button>

                {availableQty >= 2 && (
                  <button
                    type="button"
                    onClick={() => setQuantityToSell(availableQty)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      numQtyToSell === availableQty
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t.soldModal.presetAll} ({availableQty})
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic Stock Deduction Explanation Pill */}
            <div className="flex items-center gap-1.5 pt-0.5 text-xs">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {isPartialSale ? (
                <span className="text-slate-700 font-medium">
                  {t.soldModal.partialSaleExplanation} ({numQtyToSell} {unitLabel} / {remainingStock} {t.statuses.in_stock})
                </span>
              ) : (
                <span className="text-slate-500">
                  {t.soldModal.fullSaleExplanation} ({availableQty} {unitLabel})
                </span>
              )}
            </div>
          </div>

          {/* Pricing Input & Discount Feedback */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                {t.soldModal.sellingPricePerUnit} ({t.common.currencySymbol}) <span className="text-rose-500">*</span>
              </label>
              {numQtyToSell > 1 && (
                <span className="text-xs text-slate-700 font-semibold">
                  {t.table.totalRevenue}: {formatBirr(totalSaleRevenue)}
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                {t.common.currencySymbol}
              </div>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={soldPrice || ''}
                onChange={(e) => setSoldPrice(parseFloat(e.target.value) || 0)}
                placeholder={t.soldModal.sellingPricePerUnit}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>

            {/* Quick Pricing Shortcuts */}
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              <button
                type="button"
                onClick={() => setSoldPrice(retailPrice)}
                className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              >
                {t.soldModal.listedPriceRef} ({formatBirr(retailPrice, { compact: true })})
              </button>
              {retailPrice > 0 && (
                <button
                  type="button"
                  onClick={() => setSoldPrice(Math.round(retailPrice * 0.95))}
                  className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  5% Discount
                </button>
              )}
              {retailPrice > 0 && (
                <button
                  type="button"
                  onClick={() => setSoldPrice(Math.round(retailPrice * 0.90))}
                  className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  10% Discount
                </button>
              )}
            </div>

            {isDiscounted && (
              <div className="text-xs text-amber-700 flex items-center gap-1.5 pt-0.5">
                <Tag className="w-3.5 h-3.5" />
                <span>
                  {t.soldModal.discountNotice}: {formatBirr(discountAmount)} ({((discountAmount / retailPrice) * 100).toFixed(1)}%)
                </span>
              </div>
            )}
          </div>

          {/* Live Net Profit & Margin Preview Card */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-500">
                {t.metrics.trueNetProfit} ({numQtyToSell} {unitLabel})
              </span>
              <div className="flex items-center gap-1 text-xs font-bold">
                {isProfitable ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                ) : isLoss ? (
                  <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                ) : null}
                <span className={isProfitable ? 'text-emerald-700' : isLoss ? 'text-rose-700' : 'text-slate-700'}>
                  {isProfitable ? t.metrics.trueNetProfit : isLoss ? t.metrics.netLoss : 'Break-Even'}
                </span>
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <span
                className={`text-xl font-black ${
                  isProfitable ? 'text-emerald-600' : isLoss ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {totalSaleProfit >= 0 ? `+${formatBirr(totalSaleProfit)}` : formatBirr(totalSaleProfit)}
              </span>
              <div className="text-right text-xs">
                <span className="text-slate-400 block text-[10px]">{t.metrics.margin} / {t.metrics.roi}</span>
                <span className="font-semibold text-slate-800">
                  {formatPercentage(marginPercent)} / {formatPercentage(roiPercent)}
                </span>
              </div>
            </div>

            {/* Financial breakdown sub-bar */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>
                {t.metrics.revenueCostBreakdown.split(' ')[0]}: <strong className="text-slate-900 font-semibold">{formatBirr(totalSaleRevenue)}</strong>
              </span>
              <span>
                {t.metrics.costOfSold}: <strong className="text-slate-900 font-semibold">{formatBirr(totalSaleCost)}</strong>
              </span>
            </div>

            {isLoss && (
              <div className="mt-1 text-xs flex items-center gap-1 text-rose-700">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{t.soldModal.lossWarning} ({formatBirr(purchasePrice)}).</span>
              </div>
            )}
          </div>

          {/* Date & Customer Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t.soldModal.saleDate}
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={soldDate}
                  onChange={(e) => setSoldDate(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t.soldModal.customerName} {t.soldModal.customerOptional}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t.soldModal.customerNamePlaceholder}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t.soldModal.customerPhone} {t.soldModal.customerOptional}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder={t.soldModal.customerPhonePlaceholder}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t.common.notes} {t.soldModal.customerOptional}
              </label>
              <input
                type="text"
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                placeholder="Payment method, CBE / Telebirr ID..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}
          </div>

          {/* Pinned Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 px-4 sm:px-5 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer text-center"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-xs transition-colors cursor-pointer disabled:opacity-50 text-center"
            >
              {isSubmitting
                ? t.common.loading
                : `${t.soldModal.confirmSaleButton} (${numQtyToSell} ${unitLabel})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};