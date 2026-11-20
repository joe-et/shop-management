import React, { useState } from 'react';
import { 
  Plus, 
  SlidersHorizontal,
  Check,
  Zap
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
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
      {/* Header bar of Quick Add */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-slate-700" />
          <h3 className="text-xs font-semibold text-slate-800 tracking-tight flex items-center gap-1.5">
            <span>{t.quickAdd.title}</span>
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
              {t.quickAdd.rapidIntake}
            </span>
          </h3>
        </div>

        <button
          type="button"
          onClick={onOpenFullModal}
          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium transition-colors cursor-pointer"
          title={t.quickAdd.detailedForm}
        >
          <SlidersHorizontal className="w-3 h-3 text-slate-500" />
          <span>{t.quickAdd.detailedForm}</span>
        </button>
      </div>

      {/* Form Fields - 1 Row Compact Grid */}
      <form onSubmit={handleQuickSubmit} className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          {/* Equipment Name (Span 3) */}
          <div className="sm:col-span-3">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.quickAdd.namePlaceholder}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors font-medium"
            />
          </div>

          {/* Category (Span 2) */}
          <div className="sm:col-span-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors cursor-pointer"
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
              className="w-full px-1.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-center font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
            />
          </div>

          {/* Unit (Span 1) */}
          <div className="sm:col-span-1">
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              title={t.quickAdd.unitTitle}
              className="w-full px-1 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors cursor-pointer"
            >
              {STANDARD_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {getUnitDisplay(u.value).label}
                </option>
              ))}
            </select>
          </div>

          {/* Purchase Price (Span 2) */}
          <div className="sm:col-span-2">
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
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
            />
          </div>

          {/* Selling Price (Span 2) */}
          <div className="sm:col-span-2">
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
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
            />
          </div>

          {/* Submit Button (Span 1) - Reserved Black CTA */}
          <div className="sm:col-span-1 flex items-center">
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className={`w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer shadow-xs disabled:opacity-40 ${
                successPing
                  ? 'bg-emerald-600'
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
              title={t.quickAdd.addStock}
            >
              {successPing ? (
                <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
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
          <div className="flex items-center justify-between text-[11px] pt-0.5 text-slate-500 px-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span>{t.quickAdd.expectedProfit}:</span>
              <span
                className={`font-semibold ${
                  unitProfit > 0
                    ? 'text-emerald-600'
                    : unitProfit < 0
                    ? 'text-rose-600'
                    : 'text-slate-600'
                }`}
              >
                {unitProfit > 0 ? `+${formatBirr(unitProfit)}` : formatBirr(unitProfit)}
              </span>
              <span className="text-slate-400">
                ({formatPercentage(marginPercent)} margin)
              </span>
            </div>
            <span className="text-slate-400 text-[10px]">
              {t.quickAdd.autoRegisters}
            </span>
          </div>
        )}
      </form>
    </div>
  );
};
