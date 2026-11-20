import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  PackagePlus, 
  Barcode, 
  MapPin, 
  ShieldCheck,
  Calendar,
  Sparkles,
  TrendingUp,
  Plus,
  CheckCircle2,
  RefreshCw,
  Layers
} from 'lucide-react';
import { 
  EquipmentItem, 
  EquipmentItemInput, 
  ITEM_CATEGORIES, 
  ITEM_CONDITIONS, 
  ITEM_STATUSES, 
  STANDARD_UNITS,
  ItemCondition, 
  ItemStatus 
} from '../types/inventory';
import { formatBirr, formatPercentage } from '../utils/formatters';
import { useTranslation } from '../context/LanguageContext';

interface ItemModalProps {
  isOpen: boolean;
  item: EquipmentItem | null; // null for new arrival, non-null for edit
  onClose: () => void;
  onSave: (itemData: EquipmentItemInput, itemId?: string) => Promise<void>;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  item,
  onClose,
  onSave,
}) => {
  const { 
    t, 
    getCategoryLabel, 
    getConditionLabel, 
    getStatusLabel, 
    getUnitDisplay 
  } = useTranslation();

  const isEditing = Boolean(item);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(ITEM_CATEGORIES[0]);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('new');
  const [status, setStatus] = useState<ItemStatus>('in_stock');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [retailPrice, setRetailPrice] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('pcs');
  const [customUnit, setCustomUnit] = useState<string>('');
  const [minStockThreshold, setMinStockThreshold] = useState<number | ''>(2);
  const [location, setLocation] = useState('Main Shop Floor');
  const [warrantyMonths, setWarrantyMonths] = useState<number>(12);
  const [arrivalDate, setArrivalDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchCount, setBatchCount] = useState<number>(0);
  const [justSavedName, setJustSavedName] = useState<string | null>(null);

  // Initialize or reset form on open
  useEffect(() => {
    if (isOpen) {
      if (item) {
        setName(item.name || '');
        setCategory(item.category || ITEM_CATEGORIES[0]);
        setBrand(item.brand || '');
        setModel(item.model || '');
        setSerialNumber(item.serial_number || '');
        setCondition(item.condition || 'new');
        setStatus(item.status || 'in_stock');
        setPurchasePrice(Number(item.purchase_price) || 0);
        setRetailPrice(Number(item.retail_price) || 0);
        setQuantity(Number(item.quantity) || 1);
        const itemUnit = item.unit || 'pcs';
        const isStandard = STANDARD_UNITS.some((u) => u.value === itemUnit);
        setUnit(isStandard ? itemUnit : 'custom');
        setCustomUnit(isStandard ? '' : itemUnit);
        setMinStockThreshold(item.min_stock_threshold !== undefined && item.min_stock_threshold !== null ? Number(item.min_stock_threshold) : 2);
        setLocation(item.location || 'Main Shop Floor');
        setWarrantyMonths(Number(item.warranty_period_months) ?? 12);
        setNotes(item.notes || '');
        setArrivalDate(
          item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
        );
      } else {
        resetForm();
        setBatchCount(0);
        setJustSavedName(null);
      }
      setError(null);
      // Auto-focus name field
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, item]);

  const resetForm = () => {
    setName('');
    setModel('');
    setSerialNumber('');
    setPurchasePrice('');
    setRetailPrice('');
    setQuantity(1);
    setUnit('pcs');
    setCustomUnit('');
    setMinStockThreshold(2);
    setNotes('');
    setBrand('');
    setArrivalDate(new Date().toISOString().split('T')[0]);
  };

  // Real-time Calculation previews
  const numPurchase = Number(purchasePrice) || 0;
  const numRetail = Number(retailPrice) || 0;
  const numQty = Number(quantity) || 1;
  const unitProfit = numRetail - numPurchase;
  const totalProfit = unitProfit * numQty;
  const marginPercent = numRetail > 0 ? (unitProfit / numRetail) * 100 : 0;
  const roiPercent = numPurchase > 0 ? (unitProfit / numPurchase) * 100 : 0;

  // Active unit labels
  const activeUnitLabel = useMemo(() => {
    if (unit === 'custom') return customUnit.trim() || t.units.pcs.plural;
    const u = getUnitDisplay(unit);
    return numQty === 1 ? u.singular : u.plural;
  }, [unit, customUnit, numQty, getUnitDisplay, t.units.pcs.plural]);

  const activeUnitSingular = useMemo(() => {
    if (unit === 'custom') return customUnit.trim() || t.units.pcs.singular;
    const u = getUnitDisplay(unit);
    return u.singular;
  }, [unit, customUnit, getUnitDisplay, t.units.pcs.singular]);

  // Auto-generate SKU/Serial for items without barcodes
  const handleGenerateSerial = () => {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const prefix = category.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'EQ');
    setSerialNumber(`${prefix}-${new Date().getFullYear()}-${randomHex}`);
  };

  // Quick Markup presets
  const applyMarkup = (percent: number) => {
    if (numPurchase <= 0) return;
    const markupPrice = Math.round(numPurchase * (1 + percent / 100));
    setRetailPrice(markupPrice);
  };

  // Handle smart submission
  const processSubmit = async (addAnother: boolean) => {
    if (!name.trim()) {
      setError(t.itemModal.equipmentNamePlaceholder);
      nameInputRef.current?.focus();
      return;
    }

    if (numPurchase < 0 || numRetail < 0) {
      setError('Prices cannot be negative');
      return;
    }

    // Auto-detect brand from name if left empty
    const detectedBrand = brand.trim() || name.trim().split(' ')[0] || 'General';
    const finalUnit = unit === 'custom' ? (customUnit.trim() || 'pcs') : unit;

    try {
      setIsSubmitting(true);
      setError(null);

      const input: EquipmentItemInput = {
        name: name.trim(),
        category,
        brand: detectedBrand,
        model: model.trim() || null,
        serial_number: serialNumber.trim() || null,
        condition,
        status,
        purchase_price: numPurchase,
        retail_price: numRetail,
        sold_price: item?.sold_price ?? null,
        sold_at: item?.sold_at ?? null,
        customer_name: item?.customer_name ?? null,
        customer_phone: item?.customer_phone ?? null,
        quantity: numQty,
        unit: finalUnit,
        min_stock_threshold: minStockThreshold === '' ? 2 : Math.max(0, Number(minStockThreshold)),
        location: location.trim() || 'Main Shop Floor',
        warranty_period_months: warrantyMonths,
        notes: notes.trim() || null,
        image_url: item?.image_url ?? null,
      };

      await onSave(input, item?.id);

      if (addAnother && !isEditing) {
        setJustSavedName(input.name);
        setBatchCount((prev) => prev + 1);
        resetForm();
        setTimeout(() => {
          nameInputRef.current?.focus();
        }, 50);
      } else {
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register equipment item';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {isEditing ? t.itemModal.titleEdit : t.itemModal.titleNew}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {isEditing ? t.itemModal.updateMode : t.itemModal.stockIntake}
                </span>
                {batchCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">
                    {batchCount} {t.itemModal.addedSessionCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? t.itemModal.titleEdit
                  : t.itemModal.section1Subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Batch Success Banner */}
        {justSavedName && !isEditing && (
          <div className="bg-emerald-950/70 border-b border-emerald-800/40 px-6 py-2 flex items-center justify-between text-xs text-emerald-300 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                Added <strong className="text-white font-semibold">"{justSavedName}"</strong>. Ready for next item!
              </span>
            </div>
            <span className="text-emerald-400/80 text-[11px]">Keep typing to continue</span>
          </div>
        )}

        {/* Modal Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            processSubmit(false);
          }}
          className="p-6 overflow-y-auto space-y-5"
        >
          {/* SECTION 1: Item Identification */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                {t.itemModal.section1Title}
              </span>
              <span className="text-[11px] text-slate-500">
                * {t.common.required}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.itemModal.equipmentName} <span className="text-emerald-400">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.itemModal.equipmentNamePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.itemModal.category} <span className="text-emerald-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {ITEM_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryLabel(cat)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.itemModal.brand}
                  <span className="text-[10px] text-slate-500 font-normal ml-1.5">({t.itemModal.brandHint})</span>
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder={t.itemModal.brandPlaceholder}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.itemModal.model}
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={t.itemModal.modelPlaceholder}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    {t.itemModal.serialBarcode}
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSerial}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium hover:underline"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {t.itemModal.autoGenerate}
                  </button>
                </div>
                <div className="relative">
                  <Barcode className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="e.g. SN-88294021"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Financial Pricing (Birr) & Profit Calculator */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3.5 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                {t.itemModal.section2Title} ({t.common.currencySymbol})
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500">
                {t.common.currencyName}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  {t.itemModal.purchasePricePerUnit} ({activeUnitSingular}) <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black">
                    {t.common.currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={purchasePrice}
                    onChange={(e) =>
                      setPurchasePrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-200">
                    {t.itemModal.targetSellingPricePerUnit} ({activeUnitSingular}) <span className="text-emerald-400">*</span>
                  </label>
                  {numPurchase > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <span>{t.itemModal.markup}:</span>
                      <button
                        type="button"
                        onClick={() => applyMarkup(20)}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 text-slate-300 transition-colors"
                      >
                        +20%
                      </button>
                      <button
                        type="button"
                        onClick={() => applyMarkup(35)}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 text-slate-300 transition-colors"
                      >
                        +35%
                      </button>
                      <button
                        type="button"
                        onClick={() => applyMarkup(50)}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 text-slate-300 transition-colors"
                      >
                        +50%
                      </button>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-400 text-xs font-black">
                    {t.common.currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={retailPrice}
                    onChange={(e) =>
                      setRetailPrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Live Profit Preview Box */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">
                  {numQty > 1 ? `${t.itemModal.projectedProfitPrefix} (${numQty} ${activeUnitLabel}):` : `${t.itemModal.projectedProfitPer} ${activeUnitSingular}:`}
                </span>
                <span
                  className={`text-sm font-black ${
                    totalProfit > 0
                      ? 'text-emerald-400'
                      : totalProfit < 0
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {totalProfit > 0 ? `+${formatBirr(totalProfit)}` : formatBirr(totalProfit)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold">
                  {formatPercentage(marginPercent)} {t.metrics.margin}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold">
                  {formatPercentage(roiPercent)} {t.metrics.roi}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: Unit of Measure & Inventory Stocking */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3.5 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                {t.itemModal.section3Title}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500">
                {t.itemModal.section3Subtitle}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Unit of Measurement Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.itemModal.unitOfMeasurement} <span className="text-emerald-400">*</span>
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-cyan-300 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                >
                  {STANDARD_UNITS.map((u) => (
                    <option key={u.value} value={u.value} className="bg-slate-900 text-slate-200">
                      {getUnitDisplay(u.value).label}
                    </option>
                  ))}
                  <option value="custom" className="bg-slate-900 text-slate-200">
                    {t.units.customOption}
                  </option>
                </select>
                {unit === 'custom' && (
                  <input
                    type="text"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    placeholder={t.itemModal.customUnitPlaceholder}
                    className="mt-2 w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                  />
                )}
              </div>

              {/* Quantity Arrived */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>{t.itemModal.quantityArrived} <span className="text-emerald-400">*</span></span>
                  <span className="text-[10px] text-cyan-400 font-semibold uppercase">{activeUnitLabel}</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full pl-3 pr-14 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-cyan-400/90 pointer-events-none truncate max-w-[50px]">
                    {activeUnitLabel}
                  </span>
                </div>
              </div>

              {/* Low Stock Alert */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>{t.itemModal.lowStockAlert}</span>
                  <span className="text-[10px] text-slate-500 font-normal">{t.itemModal.reorderLevelHint}</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={minStockThreshold}
                    onChange={(e) => setMinStockThreshold(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="2"
                    className="w-full pl-3 pr-14 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    title="Alerts when available stock drops to this amount or lower"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 pointer-events-none truncate max-w-[50px]">
                    {activeUnitLabel}
                  </span>
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.itemModal.condition}
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ItemCondition)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {ITEM_CONDITIONS.map((cond) => (
                    <option key={cond.value} value={cond.value}>
                      {getConditionLabel(cond.value)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.itemModal.stockStatus}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ItemStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {ITEM_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {getStatusLabel(st.value)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Shop Location / Shelf */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.itemModal.shopLocation}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t.itemModal.shopLocationPlaceholder}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Arrival / Intake Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.itemModal.arrivalDate}
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Warranty Period */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.itemModal.warrantyMonths}
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(parseInt(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.itemModal.notesLabel}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.itemModal.notesPlaceholder}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
            >
              {t.common.cancel}
            </button>

            <div className="flex items-center gap-2.5">
              {!isEditing && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => processSubmit(true)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-700/60 shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  title="Register this item and keep modal open for the next arrival"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.itemModal.registerAndAddAnother}</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting
                  ? t.common.loading
                  : isEditing
                  ? t.itemModal.updateEquipment
                  : t.itemModal.registerEquipment}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};