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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Record Equipment Sale</h3>
              <p className="text-xs text-slate-400">Finalize units sold, actual price &amp; realized profit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Item Context Card */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-white text-sm">{item.name}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="text-slate-300 font-medium">{item.category}</span>
                  <span>•</span>
                  <span>{item.brand}</span>
                  {item.model && <span>• {item.model}</span>}
                  {item.serial_number && <span>• SN: {item.serial_number}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-300 border border-emerald-500/30">
                  {availableQty} {item.unit || 'units'} Available
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 mt-1 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 block">Unit Cost (Purchase)</span>
                <span className="font-semibold text-slate-200">{formatBirr(purchasePrice)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Target Listed Price</span>
                <span className="font-semibold text-teal-400">{formatBirr(retailPrice)}</span>
              </div>
            </div>
          </div>

          {/* QUANTITY TO SELL SECTION */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-emerald-400" />
                Quantity to Sell ({item.unit || 'units'}) <span className="text-emerald-400">*</span>
              </label>
              <span className="text-xs text-slate-400">
                Max: <strong className="text-white">{availableQty}</strong> unit{availableQty > 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Stepper Input */}
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-inner">
                <button
                  type="button"
                  onClick={() => handleStepQty(-1)}
                  disabled={numQtyToSell <= 1}
                  className="px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
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
                  className="w-16 text-center bg-transparent py-2 text-sm font-bold text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleStepQty(1)}
                  disabled={numQtyToSell >= availableQty}
                  className="px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap flex-1">
                <button
                  type="button"
                  onClick={() => setQuantityToSell(1)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                    numQtyToSell === 1
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-600 font-bold'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  1 unit
                </button>

                {availableQty >= 2 && (
                  <button
                    type="button"
                    onClick={() => setQuantityToSell(availableQty)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                      numQtyToSell === availableQty
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-600 font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    All ({availableQty})
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic Stock Deduction Explanation Pill */}
            <div className="flex items-center gap-2 pt-1 text-xs">
              <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              {isPartialSale ? (
                <span className="text-teal-300">
                  Selling <strong>{numQtyToSell}</strong> {item.unit || 'unit(s)'}. Remaining stock will be{' '}
                  <strong className="text-white">{remainingStock}</strong> {item.unit || 'unit(s)'} In Stock.
                </span>
              ) : (
                <span className="text-slate-400">
                  Full sale of all <strong>{availableQty}</strong> {item.unit || 'unit(s)'}. This item will move completely to Sold.
                </span>
              )}
            </div>
          </div>

          {/* Pricing Input & Discount Feedback */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Agreed Sold Price per Unit (Br) <span className="text-emerald-400">*</span>
              </label>
              {numQtyToSell > 1 && (
                <span className="text-xs text-teal-400 font-medium">
                  Total Revenue: {formatBirr(totalSaleRevenue)}
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                Br
              </div>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={soldPrice || ''}
                onChange={(e) => setSoldPrice(parseFloat(e.target.value) || 0)}
                placeholder="Enter sold price per unit..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Quick Pricing Shortcuts */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSoldPrice(retailPrice)}
                className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                Match Listed ({formatBirr(retailPrice, { compact: true })})
              </button>
              {retailPrice > 0 && (
                <button
                  type="button"
                  onClick={() => setSoldPrice(Math.round(retailPrice * 0.95))}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  5% Discount
                </button>
              )}
              {retailPrice > 0 && (
                <button
                  type="button"
                  onClick={() => setSoldPrice(Math.round(retailPrice * 0.90))}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  10% Discount
                </button>
              )}
            </div>

            {isDiscounted && (
              <div className="text-xs text-amber-400 flex items-center gap-1.5 pt-1">
                <Tag className="w-3.5 h-3.5" />
                <span>
                  Discount: {formatBirr(discountAmount)} off per unit ({((discountAmount / retailPrice) * 100).toFixed(1)}%)
                </span>
              </div>
            )}
          </div>

          {/* Live Net Profit & Margin Preview Card */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isProfitable
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : isLoss
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
                {numQtyToSell > 1 
                  ? `Realized Net Profit for ${numQtyToSell} Units Sold` 
                  : 'Realized Net Profit (1 Unit Sold)'}
              </span>
              <div className="flex items-center gap-1 text-xs font-bold">
                {isProfitable ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : isLoss ? (
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                ) : null}
                <span>{isProfitable ? 'Profitable' : isLoss ? 'Loss' : 'Break-Even'}</span>
              </div>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <span
                className={`text-2xl font-black ${
                  isProfitable ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-200'
                }`}
              >
                {totalSaleProfit >= 0 ? `+${formatBirr(totalSaleProfit)}` : formatBirr(totalSaleProfit)}
              </span>
              <div className="text-right">
                <span className="text-xs block text-slate-400">Margin / ROI</span>
                <span className="text-sm font-bold">
                  {formatPercentage(marginPercent)} / {formatPercentage(roiPercent)}
                </span>
              </div>
            </div>

            {/* Financial breakdown sub-bar */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>
                Revenue: <strong className="text-slate-200">{formatBirr(totalSaleRevenue)}</strong>
              </span>
              <span>
                Cost of Sold: <strong className="text-slate-200">{formatBirr(totalSaleCost)}</strong>
              </span>
            </div>

            {isLoss && (
              <div className="mt-2 text-xs flex items-center gap-1.5 text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Unit sold price is below purchase cost ({formatBirr(purchasePrice)}).</span>
              </div>
            )}
          </div>

          {/* Date & Customer Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Sale Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={soldDate}
                  onChange={(e) => setSoldDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Customer Name (Optional)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Dawit Tadesse"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Customer Phone (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+251 91 123 4567"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Sale Note (Optional)
              </label>
              <input
                type="text"
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                placeholder="Payment method, CBE transaction ID..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? 'Recording Sale...'
                : `Confirm Sale of ${numQtyToSell} Unit${numQtyToSell > 1 ? 's' : ''} & Record Profit`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};