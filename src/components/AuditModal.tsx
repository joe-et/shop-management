import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ShieldCheck, 
  History, 
  ClipboardCheck, 
  Search, 
  Download, 
  TrendingUp, 
  Tag, 
  PackagePlus, 
  RefreshCw, 
  Trash2, 
  Receipt,
  Minus,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { EquipmentItem, AuditLogEntry, AuditActionType } from '../types/inventory';
import { formatBirr, formatDateTime } from '../utils/formatters';
import { 
  getAuditLogs, 
  performStocktakeReconciliation, 
  subscribeToAuditLogs 
} from '../services/inventoryService';
import { useTranslation } from '../context/LanguageContext';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: EquipmentItem[];
  filterItemId?: string | null;
  onReconciliationComplete: () => Promise<void>;
}

export const AuditModal: React.FC<AuditModalProps> = ({
  isOpen,
  onClose,
  items,
  filterItemId,
  onReconciliationComplete,
}) => {
  const { t, getAuditActionLabel, getCategoryLabel } = useTranslation();
  const [activeTab, setActiveTab] = useState<'trail' | 'stocktake'>('trail');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedItemFilter, setSelectedItemFilter] = useState<string | null>(filterItemId || null);

  // Stocktake state: map of itemId -> { countedQty: number, notes: string, verified: boolean }
  const inStockItems = useMemo(() => items.filter((i) => i.status === 'in_stock'), [items]);
  const [counts, setCounts] = useState<Record<string, { counted: number; notes: string; verified: boolean }>>({});
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const [reconcileSuccessMessage, setReconcileSuccessMessage] = useState<string | null>(null);

  // Sync selectedItemFilter with prop
  useEffect(() => {
    setSelectedItemFilter(filterItemId || null);
    if (filterItemId) {
      setActiveTab('trail');
    }
  }, [filterItemId]);

  // Load audit logs
  const loadLogs = async () => {
    try {
      const logs = await getAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      const unsub = subscribeToAuditLogs(() => {
        loadLogs();
      });
      return () => unsub();
    }
  }, [isOpen]);

  // Initialize stocktake counts from inStockItems
  useEffect(() => {
    if (isOpen && inStockItems.length > 0) {
      const initialCounts: Record<string, { counted: number; notes: string; verified: boolean }> = {};
      inStockItems.forEach((item) => {
        initialCounts[item.id] = {
          counted: item.quantity,
          notes: '',
          verified: false,
        };
      });
      setCounts(initialCounts);
    }
  }, [isOpen, inStockItems]);

  // Filtered audit logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Filter by item if selected
      if (selectedItemFilter && log.item_id !== selectedItemFilter) {
        return false;
      }

      // Filter by action type
      if (selectedAction !== 'all') {
        if (selectedAction === 'sales' && !['item_sold', 'partial_sale'].includes(log.action)) {
          return false;
        }
        if (selectedAction === 'pricing' && log.action !== 'price_changed') {
          return false;
        }
        if (selectedAction === 'intake' && log.action !== 'item_created') {
          return false;
        }
        if (selectedAction === 'stocktake' && log.action !== 'stocktake_adjustment') {
          return false;
        }
        if (selectedAction === 'deletions' && log.action !== 'item_deleted') {
          return false;
        }
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = log.item_name.toLowerCase().includes(q);
        const matchDetails = log.details.toLowerCase().includes(q);
        const matchActor = log.actor.toLowerCase().includes(q);
        return matchName || matchDetails || matchActor;
      }

      return true;
    });
  }, [auditLogs, selectedItemFilter, selectedAction, searchQuery]);

  // Stocktake variance calculations
  const stocktakeVariances = useMemo(() => {
    return inStockItems.map((item) => {
      const current = counts[item.id] || { counted: item.quantity, notes: '', verified: false };
      const systemQty = item.quantity;
      const countedQty = current.counted;
      const variance = countedQty - systemQty;
      const costDiscrepancy = variance * item.purchase_price;

      return {
        item,
        systemQty,
        countedQty,
        variance,
        costDiscrepancy,
        verified: current.verified,
        notes: current.notes,
      };
    });
  }, [inStockItems, counts]);

  const totalDiscrepancies = stocktakeVariances.filter((v) => v.variance !== 0).length;
  const netVarianceUnits = stocktakeVariances.reduce((acc, v) => acc + v.variance, 0);
  const netCostVariance = stocktakeVariances.reduce((acc, v) => acc + v.costDiscrepancy, 0);
  const totalVerified = stocktakeVariances.filter((v) => v.verified).length;

  if (!isOpen) return null;

  // Step quantity handler in stocktake
  const handleUpdateCount = (itemId: string, delta: number) => {
    setCounts((prev) => {
      const cur = prev[itemId] || { counted: 1, notes: '', verified: false };
      const next = Math.max(0, cur.counted + delta);
      return {
        ...prev,
        [itemId]: { ...cur, counted: next, verified: true },
      };
    });
  };

  const handleSetExactCount = (itemId: string, val: number) => {
    setCounts((prev) => {
      const cur = prev[itemId] || { counted: 1, notes: '', verified: false };
      return {
        ...prev,
        [itemId]: { ...cur, counted: Math.max(0, val), verified: true },
      };
    });
  };

  const handleToggleVerified = (itemId: string) => {
    setCounts((prev) => {
      const cur = prev[itemId] || { counted: 1, notes: '', verified: false };
      return {
        ...prev,
        [itemId]: { ...cur, verified: !cur.verified },
      };
    });
  };

  const handleUpdateNotes = (itemId: string, notes: string) => {
    setCounts((prev) => {
      const cur = prev[itemId] || { counted: 1, notes: '', verified: false };
      return {
        ...prev,
        [itemId]: { ...cur, notes },
      };
    });
  };

  const handleVerifyAllMatching = () => {
    setCounts((prev) => {
      const updated = { ...prev };
      inStockItems.forEach((item) => {
        updated[item.id] = {
          counted: item.quantity,
          notes: updated[item.id]?.notes || '',
          verified: true,
        };
      });
      return updated;
    });
  };

  // Submit stocktake reconciliation
  const handleApplyStocktake = async () => {
    try {
      setIsReconciling(true);
      const changes = stocktakeVariances
        .filter((v) => v.variance !== 0)
        .map((v) => ({
          itemId: v.item.id,
          countedQty: v.countedQty,
          notes: v.notes,
        }));

      if (changes.length === 0) {
        setReconcileSuccessMessage(t.auditModal.perfectStockTitle);
        setTimeout(() => setReconcileSuccessMessage(null), 3000);
        return;
      }

      const reconciledCount = await performStocktakeReconciliation(changes);
      await onReconciliationComplete();
      await loadLogs();
      setReconcileSuccessMessage(
        `${t.toasts.reconciledCount}: ${reconciledCount}`
      );
      setTimeout(() => setReconcileSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to apply stocktake:', err);
    } finally {
      setIsReconciling(false);
    }
  };

  // Export audit logs to CSV
  const handleExportAuditCsv = () => {
    const headers = [
      'Timestamp',
      'Action',
      'Item Name',
      'Actor',
      'Details',
      'Quantity Change',
      'Financial Impact (Br)',
    ];

    const rows = filteredLogs.map((log) => [
      log.timestamp,
      log.action,
      `"${log.item_name.replace(/"/g, '""')}"`,
      `"${log.actor.replace(/"/g, '""')}"`,
      `"${log.details.replace(/"/g, '""')}"`,
      log.quantity_change ?? 0,
      log.financial_impact ?? 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ShopFlow_Audit_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'item_sold':
      case 'partial_sale':
        return {
          icon: <Receipt className="w-3.5 h-3.5 text-emerald-600" />,
          label: getAuditActionLabel(action),
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'price_changed':
        return {
          icon: <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />,
          label: getAuditActionLabel(action),
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      case 'item_created':
        return {
          icon: <PackagePlus className="w-3.5 h-3.5 text-cyan-600" />,
          label: getAuditActionLabel(action),
          badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        };
      case 'stocktake_adjustment':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />,
          label: getAuditActionLabel(action),
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'item_deleted':
        return {
          icon: <Trash2 className="w-3.5 h-3.5 text-rose-600" />,
          label: getAuditActionLabel(action),
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'reverted_to_stock':
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 text-slate-500" />,
          label: getAuditActionLabel(action),
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        };
      default:
        return {
          icon: <Tag className="w-3.5 h-3.5 text-slate-500" />,
          label: getAuditActionLabel(action),
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-modal-title"
        className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[82dvh] sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-200 bg-slate-50 gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="audit-modal-title" className="text-sm sm:text-base font-bold text-slate-900">
                  {t.auditModal.modalTitle}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {auditLogs.length} {t.common.actions}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {t.auditModal.modalSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Tab switch pills */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('trail')}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'trail'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[90px] xs:max-w-none sm:max-w-none">{t.auditModal.tabActivityTrail}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('stocktake')}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'stocktake'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[90px] xs:max-w-none sm:max-w-none">{t.auditModal.tabPhysicalStocktake}</span>
                {totalDiscrepancies > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                    {totalDiscrepancies}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {reconcileSuccessMessage && (
          <div className="bg-emerald-950/80 border-b border-emerald-800/60 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-300 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{reconcileSuccessMessage}</span>
            </div>
            <button
              onClick={() => setReconcileSuccessMessage(null)}
              className="text-emerald-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TAB 1: Activity Audit Trail */}
        {activeTab === 'trail' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Control & Filter Strip */}
            <div className="p-3 border-b border-slate-200 bg-slate-50 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* Search */}
              <div className="sm:col-span-5 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.filters.searchPlaceholder}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Action Filter */}
              <div className="sm:col-span-4">
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="all">{t.common.all}</option>
                  <option value="sales">{t.auditActions.item_sold}</option>
                  <option value="pricing">{t.auditActions.price_changed}</option>
                  <option value="intake">{t.auditActions.item_created}</option>
                  <option value="stocktake">{t.auditActions.stocktake_adjustment}</option>
                  <option value="deletions">{t.auditActions.item_deleted}</option>
                </select>
              </div>

              {/* Export Button */}
              <div className="sm:col-span-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportAuditCsv}
                  className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t.auditModal.exportAuditCsv}</span>
                </button>
              </div>
            </div>

            {/* Active Item Filter Chip */}
            {selectedItemFilter && (
              <div className="px-5 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {t.auditModal.filterByItem}: <code className="text-slate-900 font-mono font-semibold">{selectedItemFilter}</code>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedItemFilter(null)}
                  className="text-slate-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  {t.auditModal.allEquipmentItems}
                </button>
              </div>
            )}

            {/* Timeline Log List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
              {loading ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  {t.common.loading}
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <FileSpreadsheet className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-800">{t.auditModal.noActivityFound}</p>
                  <p className="text-[11px] text-slate-400">{t.filters.searchPlaceholder}</p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all space-y-1.5 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${badge.badgeClass}`}
                          >
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>
                          <h4 className="font-semibold text-slate-900 text-xs sm:text-sm">{log.item_name}</h4>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDateTime(log.timestamp)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{log.details}</p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-[11px] text-slate-500">
                        <div className="flex items-center gap-3">
                          <span>
                            Actor: <strong className="text-slate-800">{log.actor}</strong>
                          </span>
                          {log.quantity_change !== undefined && log.quantity_change !== null && (
                            <span>
                              {t.common.quantity}:{' '}
                              <strong
                                className={
                                  log.quantity_change > 0
                                    ? 'text-emerald-600'
                                    : log.quantity_change < 0
                                    ? 'text-rose-600'
                                    : 'text-slate-700'
                                }
                              >
                                {log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change}
                              </strong>
                            </span>
                          )}
                        </div>

                        {log.financial_impact !== undefined && log.financial_impact !== null && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">{t.metrics.financialOverview}:</span>
                            <span
                              className={`font-bold ${
                                log.financial_impact > 0
                                  ? 'text-emerald-600'
                                  : log.financial_impact < 0
                                  ? 'text-rose-600'
                                  : 'text-slate-600'
                              }`}
                            >
                              {log.financial_impact >= 0
                                ? `+${formatBirr(log.financial_impact)}`
                                : formatBirr(log.financial_impact)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Physical Stocktake / Inventory Audit */}
        {activeTab === 'stocktake' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Stocktake KPI Cards Header */}
            <div className="p-3 border-b border-slate-200 bg-slate-50 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.metrics.equipmentCountBalance}</span>
                <span className="text-base font-bold text-slate-900">{inStockItems.length} SKUs</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.auditModal.reconciledBadge}</span>
                <span className="text-base font-bold text-emerald-600">
                  {totalVerified} / {inStockItems.length}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.auditModal.columnVariance}</span>
                <span
                  className={`text-base font-bold ${
                    netVarianceUnits === 0
                      ? 'text-slate-700'
                      : netVarianceUnits > 0
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}
                >
                  {netVarianceUnits > 0 ? `+${netVarianceUnits}` : netVarianceUnits} {t.units.pcs.plural}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.auditModal.columnCostDiscrepancy}</span>
                <span
                  className={`text-base font-bold ${
                    netCostVariance === 0
                      ? 'text-slate-700'
                      : netCostVariance > 0
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}
                >
                  {netCostVariance > 0 ? `+${formatBirr(netCostVariance)}` : formatBirr(netCostVariance)}
                </span>
              </div>
            </div>

            {/* Quick Action Helper */}
            <div className="px-5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {t.auditModal.stocktakeSubtitle}
              </span>
              <button
                type="button"
                onClick={handleVerifyAllMatching}
                className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 transition-colors font-semibold cursor-pointer shadow-2xs"
              >
                {t.auditModal.quickAllMatch}
              </button>
            </div>

            {/* Stocktake Checklist Table */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5">
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[640px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">{t.auditModal.reconciledBadge}</th>
                      <th className="py-2.5 px-3">{t.auditModal.columnEquipment}</th>
                      <th className="py-2.5 px-3 text-center">{t.auditModal.columnExpectedSystem}</th>
                      <th className="py-2.5 px-3 text-center">{t.auditModal.columnCountedPhysical}</th>
                      <th className="py-2.5 px-3 text-center">{t.auditModal.columnVariance}</th>
                      <th className="py-2.5 px-3 text-right">{t.auditModal.columnCostDiscrepancy}</th>
                      <th className="py-2.5 px-3">{t.common.notes}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stocktakeVariances.map((v) => (
                      <tr key={v.item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={v.verified}
                            onChange={() => handleToggleVerified(v.item.id)}
                            className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">{v.item.name}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>{getCategoryLabel(v.item.category)}</span>
                            <span>•</span>
                            <span>{v.item.brand}</span>
                            {v.item.serial_number && <span>• SN: {v.item.serial_number}</span>}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                          {v.systemQty}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateCount(v.item.id, -1)}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={v.countedQty}
                              onChange={(e) => handleSetExactCount(v.item.id, parseInt(e.target.value) || 0)}
                              className="w-12 text-center py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateCount(v.item.id, 1)}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {v.variance === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              0 {t.auditModal.reconciledBadge}
                            </span>
                          ) : v.variance > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              +{v.variance} Surplus
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              {v.variance} Missing
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">
                          <span
                            className={
                              v.costDiscrepancy === 0
                                ? 'text-slate-500'
                                : v.costDiscrepancy > 0
                                ? 'text-emerald-600'
                                : 'text-rose-600'
                            }
                          >
                            {v.costDiscrepancy > 0 ? `+${formatBirr(v.costDiscrepancy)}` : formatBirr(v.costDiscrepancy)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={v.notes || ''}
                            onChange={(e) => handleUpdateNotes(v.item.id, e.target.value)}
                            placeholder={t.common.notes}
                            className="w-full px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

            {/* Stocktake Bottom Actions */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div className="text-xs text-slate-600">
                {totalDiscrepancies > 0 ? (
                  <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    {totalDiscrepancies} {t.auditModal.columnVariance}
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {t.auditModal.perfectStockTitle}
                  </span>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer text-center"
                >
                  {t.common.close}
                </button>
                <button
                  type="button"
                  disabled={isReconciling || totalDiscrepancies === 0}
                  onClick={handleApplyStocktake}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-xs transition-colors cursor-pointer disabled:opacity-40 text-center"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isReconciling
                      ? t.common.loading
                      : `${t.auditModal.reconcileSelected} (${totalDiscrepancies})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};