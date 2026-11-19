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
        setReconcileSuccessMessage('All physical counts match system records perfectly. Zero discrepancies!');
        setTimeout(() => setReconcileSuccessMessage(null), 3000);
        return;
      }

      const reconciledCount = await performStocktakeReconciliation(changes);
      await onReconciliationComplete();
      await loadLogs();
      setReconcileSuccessMessage(
        `Successfully reconciled ${reconciledCount} equipment item(s) and logged audit events.`
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
          icon: <Receipt className="w-3.5 h-3.5 text-emerald-400" />,
          label: action === 'partial_sale' ? 'Partial Sale' : 'Sale Recorded',
          badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60',
        };
      case 'price_changed':
        return {
          icon: <TrendingUp className="w-3.5 h-3.5 text-violet-400" />,
          label: 'Price Adjustment',
          badgeClass: 'bg-violet-950/70 text-violet-300 border-violet-700/60',
        };
      case 'item_created':
        return {
          icon: <PackagePlus className="w-3.5 h-3.5 text-cyan-400" />,
          label: 'Stock Intake',
          badgeClass: 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60',
        };
      case 'stocktake_adjustment':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />,
          label: 'Audit Reconciliation',
          badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-700/60',
        };
      case 'item_deleted':
        return {
          icon: <Trash2 className="w-3.5 h-3.5 text-rose-400" />,
          label: 'Item Deleted',
          badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-700/60',
        };
      case 'reverted_to_stock':
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 text-slate-400" />,
          label: 'Reverted to Stock',
          badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
        };
      default:
        return {
          icon: <Tag className="w-3.5 h-3.5 text-slate-400" />,
          label: 'Item Updated',
          badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-teal-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Inventory Audit &amp; Stocktake Control
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {auditLogs.length} Logged Events
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Activity audit trail, price discrepancy tracking, and physical stock count reconciliation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Tab switch pills */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('trail')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'trail'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Audit Trail</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('stocktake')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'stocktake'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-600/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Physical Stocktake</span>
                {totalDiscrepancies > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-900 text-rose-300 text-[10px] font-bold">
                    {totalDiscrepancies}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
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
            <div className="p-4 border-b border-slate-800 bg-slate-950/40 grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Search */}
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search item, serial, or event description..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              {/* Action Filter */}
              <div className="sm:col-span-4">
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                >
                  <option value="all">All Action Types</option>
                  <option value="sales">Sales &amp; Deductions</option>
                  <option value="pricing">Price Adjustments</option>
                  <option value="intake">New Equipment Intakes</option>
                  <option value="stocktake">Audit Stocktake Adjustments</option>
                  <option value="deletions">Item Deletions</option>
                </select>
              </div>

              {/* Export Button */}
              <div className="sm:col-span-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportAuditCsv}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export Log (CSV)</span>
                </button>
              </div>
            </div>

            {/* Active Item Filter Chip */}
            {selectedItemFilter && (
              <div className="px-6 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Showing audit history filtered for item ID: <code className="text-amber-300 font-mono">{selectedItemFilter}</code>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedItemFilter(null)}
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <X className="w-3 h-3" />
                  Show All Equipment Logs
                </button>
              </div>
            )}

            {/* Timeline Log List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
              {loading ? (
                <div className="p-12 text-center text-slate-400 text-sm">
                  Loading audit logs...
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="p-12 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 space-y-2">
                  <FileSpreadsheet className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">No matching audit events found</p>
                  <p className="text-xs text-slate-500">Try adjusting your search query or action filters.</p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.badgeClass}`}
                          >
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>
                          <h4 className="font-bold text-white text-sm">{log.item_name}</h4>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatDateTime(log.timestamp)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{log.details}</p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                        <div className="flex items-center gap-3">
                          <span>
                            Actor: <strong className="text-slate-200">{log.actor}</strong>
                          </span>
                          {log.quantity_change !== undefined && log.quantity_change !== null && (
                            <span>
                              Quantity Change:{' '}
                              <strong
                                className={
                                  log.quantity_change > 0
                                    ? 'text-emerald-400'
                                    : log.quantity_change < 0
                                    ? 'text-rose-400'
                                    : 'text-slate-300'
                                }
                              >
                                {log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change}
                              </strong>
                            </span>
                          )}
                        </div>

                        {log.financial_impact !== undefined && log.financial_impact !== null && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">Financial Impact:</span>
                            <span
                              className={`font-black ${
                                log.financial_impact > 0
                                  ? 'text-emerald-400'
                                  : log.financial_impact < 0
                                  ? 'text-rose-400'
                                  : 'text-slate-400'
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
            <div className="p-4 border-b border-slate-800 bg-slate-950/40 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Tracked Stock Items</span>
                <span className="text-lg font-bold text-white">{inStockItems.length} SKUs</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Audited &amp; Verified</span>
                <span className="text-lg font-bold text-emerald-400">
                  {totalVerified} / {inStockItems.length}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Total Net Variance</span>
                <span
                  className={`text-lg font-bold ${
                    netVarianceUnits === 0
                      ? 'text-slate-200'
                      : netVarianceUnits > 0
                      ? 'text-teal-400'
                      : 'text-rose-400'
                  }`}
                >
                  {netVarianceUnits > 0 ? `+${netVarianceUnits}` : netVarianceUnits} units
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Cost Variance (Discrepancy)</span>
                <span
                  className={`text-lg font-bold ${
                    netCostVariance === 0
                      ? 'text-slate-200'
                      : netCostVariance > 0
                      ? 'text-teal-400'
                      : 'text-rose-400'
                  }`}
                >
                  {netCostVariance > 0 ? `+${formatBirr(netCostVariance)}` : formatBirr(netCostVariance)}
                </span>
              </div>
            </div>

            {/* Quick Action Helper */}
            <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Count the physical units in your shop shelves and record any variances below to synchronize your inventory records.
              </span>
              <button
                type="button"
                onClick={handleVerifyAllMatching}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 transition-all font-semibold cursor-pointer"
              >
                Mark All Matching as Counted
              </button>
            </div>

            {/* Stocktake Checklist Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">Verified</th>
                      <th className="py-3 px-3">Equipment / Specs</th>
                      <th className="py-3 px-3 text-center">System Expected</th>
                      <th className="py-3 px-3 text-center">Physical Count</th>
                      <th className="py-3 px-3 text-center">Variance</th>
                      <th className="py-3 px-3 text-right">Cost Discrepancy</th>
                      <th className="py-3 px-3">Audit Note / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {stocktakeVariances.map((v) => (
                      <tr key={v.item.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={v.verified}
                            onChange={() => handleToggleVerified(v.item.id)}
                            className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-white text-xs sm:text-sm">{v.item.name}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{v.item.category}</span>
                            <span>•</span>
                            <span>{v.item.brand}</span>
                            {v.item.serial_number && <span>• SN: {v.item.serial_number}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-300">
                          {v.systemQty}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateCount(v.item.id, -1)}
                              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={v.countedQty}
                              onChange={(e) => handleSetExactCount(v.item.id, parseInt(e.target.value) || 0)}
                              className="w-12 text-center py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateCount(v.item.id, 1)}
                              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {v.variance === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                              0 Matched
                            </span>
                          ) : v.variance > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-700">
                              +{v.variance} Surplus
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-700">
                              {v.variance} Missing
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold">
                          <span
                            className={
                              v.costDiscrepancy === 0
                                ? 'text-slate-400'
                                : v.costDiscrepancy > 0
                                ? 'text-teal-400'
                                : 'text-rose-400'
                            }
                          >
                            {v.costDiscrepancy > 0 ? `+${formatBirr(v.costDiscrepancy)}` : formatBirr(v.costDiscrepancy)}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            value={v.notes || ''}
                            onChange={(e) => handleUpdateNotes(v.item.id, e.target.value)}
                            placeholder="Reason for discrepancy..."
                            className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stocktake Bottom Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-slate-400">
                {totalDiscrepancies > 0 ? (
                  <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    {totalDiscrepancies} item(s) have quantity discrepancies that will be adjusted.
                  </span>
                ) : (
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    All entered physical quantities match system records.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isReconciling || totalDiscrepancies === 0}
                  onClick={handleApplyStocktake}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 hover:from-amber-300 hover:to-orange-300 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40"
                >
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {isReconciling
                      ? 'Reconciling...'
                      : `Apply Reconciliation (${totalDiscrepancies} changes)`}
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