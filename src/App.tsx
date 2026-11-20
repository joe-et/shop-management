import { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { FilterBar } from './components/FilterBar';
import { QuickAddBar } from './components/QuickAddBar';
import { InventoryTable } from './components/InventoryTable';
import { ItemModal } from './components/ItemModal';
import { MarkSoldModal } from './components/MarkSoldModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { AuditModal } from './components/AuditModal';
import { ExpensesModal } from './components/ExpensesModal';
import { 
  getItems, 
  createItem, 
  updateItem, 
  deleteItem, 
  markAsSold, 
  subscribeToInventory,
  getExpenses,
  createExpense,
  deleteExpense,
  subscribeToExpenses
} from './services/inventoryService';
import { isSupabaseConfigured } from './lib/supabase';
import { 
  EquipmentItem, 
  EquipmentItemInput, 
  ItemFilters,
  TimeframePeriod,
  ShopExpense,
  ShopExpenseInput
} from './types/inventory';
import { 
  calculateFinancialMetrics, 
  filterAndSortItems,
  calculateCategorySummaries 
} from './utils/calculations';
import { formatBirr } from './utils/formatters';
import { 
  AlertTriangle, 
  Loader2, 
  CheckCircle2, 
  Boxes,
  PackagePlus
} from 'lucide-react';
import { useTranslation } from './context/LanguageContext';

export default function App() {
  const { t, getCategoryLabel } = useTranslation();
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(isSupabaseConfigured());
  const [activeWorkspace, setActiveWorkspace] = useState<'counter' | 'reports'>('counter');

  // Filters State
  const [filters, setFilters] = useState<ItemFilters>({
    search: '',
    status: 'all',
    category: 'all',
    brand: 'all',
    condition: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
  const [timeframe, setTimeframe] = useState<TimeframePeriod>('all_time');

  // Modal States
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [isMarkSoldModalOpen, setIsMarkSoldModalOpen] = useState(false);
  const [itemToSell, setItemToSell] = useState<EquipmentItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<EquipmentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditFilterItemId, setAuditFilterItemId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<ShopExpense[]>([]);
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);

  // Notification Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  }, []);

  // Fetch Items
  const loadInventory = useCallback(async () => {
    try {
      const data = await getItems();
      setItems(data);
    } catch (err) {
      console.error('Failed to load equipment items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Operating Expenses
  const loadExpenses = useCallback(async () => {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error('Failed to load operating expenses:', err);
    }
  }, []);

  useEffect(() => {
    loadInventory();
    loadExpenses();

    // Subscribe to real-time changes
    const unsubscribeInventory = subscribeToInventory(() => {
      loadInventory();
    });
    const unsubscribeExpenses = subscribeToExpenses(() => {
      loadExpenses();
    });

    return () => {
      unsubscribeInventory();
      unsubscribeExpenses();
    };
  }, [loadInventory, loadExpenses]);

  // Global Keyboard Shortcut: Alt+N opens Add Item
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'n') || (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        setEditingItem(null);
        setIsItemModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle configuration update
  const handleConfigSaved = () => {
    setIsConfigured(isSupabaseConfigured());
    loadInventory();
    showToast(
      isSupabaseConfigured()
        ? t.toasts.connectedSupabase
        : t.toasts.switchedDemo
    );
  };

  // Create or Update Item
  const handleSaveItem = async (input: EquipmentItemInput, itemId?: string) => {
    if (itemId) {
      await updateItem(itemId, input);
      showToast(`${t.toasts.updatedEquipment} "${input.name}"`);
    } else {
      await createItem(input);
      showToast(`${t.toasts.addedEquipment}: "${input.name}"`);
    }
    await loadInventory();
  };

  // Mark as Sold Confirm
  const handleConfirmSold = async (
    id: string,
    saleDetails: {
      sold_price: number;
      sold_at: string;
      customer_name?: string;
      customer_phone?: string;
      notes?: string;
      quantity_sold?: number;
    }
  ) => {
    const qtySold = saleDetails.quantity_sold ?? 1;
    await markAsSold(id, saleDetails);
    showToast(
      `${t.toasts.recordedSale}: ${qtySold} at ${formatBirr(saleDetails.sold_price * qtySold)}!`
    );
    await loadInventory();
  };

  // Revert back to stock
  const handleRevertToStock = async (item: EquipmentItem) => {
    await updateItem(item.id, {
      status: 'in_stock',
      sold_price: null,
      sold_at: null,
      customer_name: null,
      customer_phone: null,
      location: 'Main Shop Floor',
    });
    showToast(`${t.toasts.revertedStock}: "${item.name}"`);
    await loadInventory();
  };

  // Delete Item
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      setIsDeleting(true);
      await deleteItem(deletingItem.id);
      showToast(`${t.toasts.deletedEquipment}: "${deletingItem.name}"`);
      setDeletingItem(null);
      await loadInventory();
    } catch (err) {
      console.error('Failed to delete item:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Operating Expenses Handlers
  const handleAddExpense = async (input: ShopExpenseInput) => {
    await createExpense(input);
    showToast(`${t.toasts.recordedExpense}: "${input.title}" (-${formatBirr(input.amount)})`);
    await loadExpenses();
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id);
    showToast(t.toasts.deletedExpense);
    await loadExpenses();
  };

  // Financial Metrics (Factoring real gross sales margin minus operating expenses)
  const metrics = useMemo(
    () => calculateFinancialMetrics(items, expenses, timeframe),
    [items, expenses, timeframe]
  );

  // Category Summaries for insights
  const categorySummaries = useMemo(() => calculateCategorySummaries(items), [items]);

  // Filtered & Sorted items
  const filteredItems = useMemo(
    () => filterAndSortItems(items, filters),
    [items, filters]
  );

  // Tab counts
  const tabCounts = useMemo(
    () => ({
      all: items.length,
      in_stock: items.filter((i) => i.status === 'in_stock' && (Number(i.quantity) || 0) > 0).length,
      low_stock: metrics.lowStockCount,
      out_of_stock: metrics.outOfStockCount,
      sold: items.filter((i) => i.status === 'sold').length,
    }),
    [items, metrics.lowStockCount, metrics.outOfStockCount]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pl-0 sm:pl-16 selection:bg-slate-200 selection:text-slate-900 pb-16 sm:pb-6">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-xl text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Slim Left Sidebar (Icon rail, expands on hover) */}
      <Sidebar
        activeWorkspace={activeWorkspace}
        onChangeWorkspace={setActiveWorkspace}
        onOpenExpenses={() => setIsExpensesModalOpen(true)}
        onOpenAudit={() => {
          setAuditFilterItemId(null);
          setIsAuditModalOpen(true);
        }}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        isConfigured={isConfigured}
      />

      {/* Main Top Header */}
      <Header
        items={items}
        activeWorkspace={activeWorkspace}
        onChangeWorkspace={setActiveWorkspace}
        onOpenAddItem={() => {
          setEditingItem(null);
          setIsItemModalOpen(true);
        }}
        onOpenAudit={() => {
          setAuditFilterItemId(null);
          setIsAuditModalOpen(true);
        }}
        onOpenExpenses={() => setIsExpensesModalOpen(true)}
      />

      {/* Main Content Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* WORKSPACE 1: Counter & Inventory (High Cashier Productivity) */}
        {activeWorkspace === 'counter' && (
          <>
            {/* Quick Arrival Entry Bar */}
            <section aria-label="Quick Intake">
              <QuickAddBar
                onSave={handleSaveItem}
                onOpenFullModal={() => {
                  setEditingItem(null);
                  setIsItemModalOpen(true);
                }}
              />
            </section>

            {/* Filter and Control Bar */}
            <section aria-label="Inventory Controls">
              <FilterBar
                filters={filters}
                onFilterChange={setFilters}
                counts={tabCounts}
              />
            </section>

            {/* Main Equipment Inventory Table */}
            <section aria-label="Equipment Table">
              {loading ? (
                <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-xs">
                  <Loader2 className="w-8 h-8 text-slate-700 animate-spin mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-700">{t.common.loading}</p>
                  <p className="text-xs text-slate-400 mt-1">{t.dbModal.subtitle}</p>
                </div>
              ) : (
                <InventoryTable
                  items={filteredItems}
                  onMarkSold={(item) => {
                    setItemToSell(item);
                    setIsMarkSoldModalOpen(true);
                  }}
                  onRevertToStock={handleRevertToStock}
                  onEdit={(item) => {
                    setEditingItem(item);
                    setIsItemModalOpen(true);
                  }}
                  onDelete={(item) => setDeletingItem(item)}
                  onViewAuditHistory={(item) => {
                    setAuditFilterItemId(item.id);
                    setIsAuditModalOpen(true);
                  }}
                />
              )}
            </section>
          </>
        )}

        {/* WORKSPACE 2: Financial Reports & Analytics (Business Intelligence) */}
        {activeWorkspace === 'reports' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Top KPI Metric Cards with dynamic Timeframe Filter */}
            <section aria-label="Financial Overview">
              <MetricCards 
                metrics={metrics} 
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                onSelectStockFilter={(filter) => {
                  setFilters((f) => ({ ...f, status: filter }));
                  setActiveWorkspace('counter');
                }}
                activeStockFilter={filters.status}
              />
            </section>

            {/* Category Distribution Quick Summary Bar */}
            {!loading && categorySummaries.length > 0 && (
              <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-slate-700" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {t.table.distributionByCategory}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    {categorySummaries.length} {t.table.categoriesRepresented}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {categorySummaries.map((cat) => (
                    <button
                      key={cat.category}
                      type="button"
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          category: prev.category === cat.category ? 'all' : cat.category,
                        }));
                        setActiveWorkspace('counter');
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition-all cursor-pointer ${
                        filters.category === cat.category
                          ? 'bg-slate-900 border-slate-900 text-white font-semibold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{getCategoryLabel(cat.category)}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                        filters.category === cat.category ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {cat.count}
                      </span>
                      <span className={`text-[11px] font-semibold ${
                        filters.category === cat.category ? 'text-emerald-300' : 'text-emerald-700'
                      }`}>
                        {formatBirr(cat.totalRetailValue, { compact: true })}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Operating Expenses Card */}
            <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{t.expensesModal.modalTitle}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {expenses.length} {t.expensesModal.recentExpenses} • {formatBirr(metrics.totalExpenses)} {t.expensesModal.totalOverhead}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExpensesModalOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              >
                {t.expensesModal.logNewExpense}
              </button>
            </section>
          </div>
        )}
      </main>

      {/* Floating Action Button for rapid access on mobile devices */}
      <button
        onClick={() => {
          setEditingItem(null);
          setIsItemModalOpen(true);
        }}
        title="Register new equipment arrival (Alt+N)"
        className="fixed bottom-5 right-5 z-40 sm:hidden flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-lg hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
      >
        <PackagePlus className="w-4 h-4 stroke-[2.5]" />
        <span>{t.common.newArrival}</span>
      </button>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        <p>
          {t.footer.systemInfo}
        </p>
      </footer>

      {/* Item Create / Edit Modal */}
      <ItemModal
        isOpen={isItemModalOpen}
        item={editingItem}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
      />

      {/* Mark Sold Modal */}
      <MarkSoldModal
        isOpen={isMarkSoldModalOpen}
        item={itemToSell}
        onClose={() => {
          setIsMarkSoldModalOpen(false);
          setItemToSell(null);
        }}
        onConfirm={handleConfirmSold}
      />

      {/* Supabase Config Modal */}
      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConfigSaved={handleConfigSaved}
      />

      {/* Audit & Physical Stocktake Modal */}
      <AuditModal
        isOpen={isAuditModalOpen}
        onClose={() => {
          setIsAuditModalOpen(false);
          setAuditFilterItemId(null);
        }}
        items={items}
        filterItemId={auditFilterItemId}
        onReconciliationComplete={loadInventory}
      />

      {/* Shop Operating Expenses Modal */}
      <ExpensesModal
        isOpen={isExpensesModalOpen}
        onClose={() => setIsExpensesModalOpen(false)}
        expenses={expenses}
        onAddExpense={handleAddExpense}
        onDeleteExpense={handleDeleteExpense}
      />

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-5 space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">{t.toasts.deleteItemTitle}</h3>
                <p className="text-xs text-slate-500">{t.toasts.deleteItemWarning}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              {t.toasts.deleteItemWarning}: <span className="font-semibold text-slate-900">"{deletingItem.name}"</span>?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? t.toasts.deleting : t.toasts.deleteItemConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}