import React, { useState } from 'react';
import { 
  PackagePlus, 
  Plus, 
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { EquipmentItemInput, ITEM_CATEGORIES, STANDARD_UNITS } from '../types/inventory';
import { formatBirr, formatPercentage } from '../utils/formatters';
import { useTranslation } from '../context/LanguageContext';

interface QuickAddBarProps {
  onSave: (input: EquipmentItemInput) => Promise<void>;
  onOpenFullModal: () => void;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({
  onSave,
  onOpenFullModal,
}) => {
  const { t, getCategoryLabel, getUnitDisplay } = useTranslation();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(ITEM_CATEGORIES[0]);
  const [unit, setUnit] = useState<string>('pcs');
  const [quantity, setQuantity] = useState<number>(1);
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [retailPrice, setRetailPrice] = useState<number | ''>('');
  const [serialNumber, setSerialNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successPing, setSuccessPing] = useState(false);

  const numPurchase = Number(purchasePrice) || 0;
  const numRetail = Number(retailPrice) || 0;
  const unitProfit = numRetail - numPurchase;
  const marginPercent = numRetail > 0 ? (unitProfit / numRetail) * 100 : 0;

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      const detectedBrand = name.trim().split(' ')[0] || 'General';

      const input: EquipmentItemInput = {
        name: name.trim(),
        category,
        brand: detectedBrand,
        model: null,
        serial_number: serialNumber.trim() || null,
        condition: 'new',
        status: 'in_stock',
        purchase_price: numPurchase,
        retail_price: numRetail,
        sold_price: null,
        sold_at: null,
        customer_name: null,
        customer_phone: null,
        quantity: Math.max(1, Number(quantity) || 1),
        unit,
        location: 'Main Shop Floor',
        warranty_period_months: 12,
        notes: null,
        image_url: null,
      };

      await onSave(input);
      setName('');
      setPurchasePrice('');
      setRetailPrice('');
      setSerialNumber('');
      setSuccessPing(true);
      setTimeout(() => setSuccessPing(false), 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 shadow-lg shadow-emerald-950/20 backdrop-blur-sm">
      {/* Header bar of Quick Add */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <PackagePlus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>{t.quickAdd.title}</span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 lowercase">
                {t.quickAdd.rapidIntake}
              </span>
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenFullModal}
          className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors font-medium border border-slate-700 cursor-pointer"
          title={t.quickAdd.detailedForm}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
          <span>{t.quickAdd.detailedForm}</span>
        </button>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleQuickSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Equipment Name (Span 3) */}
          <div className="sm:col-span-3">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.quickAdd.namePlaceholder}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Category (Span 2) */}
          <div className="sm:col-span-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {ITEM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity (Span 1) */}
          <div className="sm:col-span-1">
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              placeholder={t.common.quantity}
              title={t.quickAdd.qtyTitle}
              className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-center font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Unit (Span 1) */}
          <div className="sm:col-span-1">
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              title={t.quickAdd.unitTitle}
              className="w-full px-1.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-cyan-400 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
            >
              {STANDARD_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {getUnitDisplay(u.value).label}
                </option>
              ))}
            </select>
          </div>

          {/* Purchase Price (Span 2) */}
          <div className="sm:col-span-2 relative">
            <input
              type="number"
              step="any"
              min="0"
              required
              value={purchasePrice}
              onChange={(e) =>
                setPurchasePrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)
              }
              placeholder={t.quickAdd.costPlaceholder}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Selling Price (Span 2) */}
          <div className="sm:col-span-2 relative">
            <input
              type="number"
              step="any"
              min="0"
              required
              value={retailPrice}
              onChange={(e) =>
                setRetailPrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)
              }
              placeholder={t.quickAdd.sellPlaceholder}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Submit Button (Span 1) */}
          <div className="sm:col-span-1 flex items-center">
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className={`w-full flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-bold text-slate-950 transition-all cursor-pointer shadow-md disabled:opacity-50 ${
                successPing
                  ? 'bg-emerald-300 shadow-emerald-400/40 scale-[0.98]'
                  : 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-emerald-500/20 active:scale-[0.98]'
              }`}
              title={t.quickAdd.addStock}
            >
              {successPing ? (
                <Check className="w-4 h-4 text-slate-950" />
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.quickAdd.addStock}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time Calculation Micro-banner */}
        {(numPurchase > 0 || numRetail > 0) && (
          <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 px-1">
            <div className="flex items-center gap-2">
              <span>{t.quickAdd.expectedProfit}:</span>
              <span
                className={`font-bold ${
                  unitProfit > 0
                    ? 'text-emerald-400'
                    : unitProfit < 0
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              >
                {unitProfit > 0 ? `+${formatBirr(unitProfit)}` : formatBirr(unitProfit)}
              </span>
              <span className="text-slate-500">
                ({formatPercentage(marginPercent)} margin)
              </span>
            </div>
            <span className="text-slate-500">
              {t.quickAdd.autoRegisters}
            </span>
          </div>
        )}
      </form>
    </div>
  );
};