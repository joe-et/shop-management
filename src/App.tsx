import { useState, useEffect, useCallback, useMemo } from 'react';
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
  resetToDemoData, 
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

export default function App() {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(isSupabaseConfigured());
  const [isResetting, setIsResetting] = useState<boolean>(false);

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
        ? 'Connected to Supabase live database!'
        : 'Switched to local demo storage'
    );
  };

  // Reset Demo Data
  const handleResetDemo = async () => {
    try {
      setIsResetting(true);
      const demoData = await resetToDemoData();
      setItems(demoData);
      showToast('Loaded initial equipment catalog');
    } catch (err) {
      console.error('Failed to reset demo data:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // Create or Update Item
  const handleSaveItem = async (input: EquipmentItemInput, itemId?: string) => {
    if (itemId) {
      await updateItem(itemId, input);
      showToast(`Updated "${input.name}"`);
    } else {
      await createItem(input);
      showToast(`Added incoming equipment: "${input.name}"`);
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
      `Recorded sale: ${qtySold} unit(s) at ${formatBirr(saleDetails.sold_price * qtySold)}!`
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
    showToast(`Reverted "${item.name}" back to stock`);
    await loadInventory();
  };

  // Delete Item
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      setIsDeleting(true);
      await deleteItem(deletingItem.id);
      showToast(`Deleted "${deletingItem.name}"`);
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
    showToast(`Recorded expense: "${input.title}" (-${formatBirr(input.amount)})`);
    await loadExpenses();
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id);
    showToast('Deleted expense record');
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 pb-16 sm:pb-6">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 shadow-2xl shadow-emerald-950/50 text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        items={items}
        isConfigured={isConfigured}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        onResetDemo={handleResetDemo}
        onOpenAddItem={() => {
          setEditingItem(null);
          setIsItemModalOpen(true);
        }}
        onOpenAudit={() => {
          setAuditFilterItemId(null);
          setIsAuditModalOpen(true);
        }}
        onOpenExpenses={() => setIsExpensesModalOpen(true)}
        isResetting={isResetting}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top KPI Metric Cards */}
        <section aria-label="Financial Overview">
          <MetricCards 
            metrics={metrics} 
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            onSelectStockFilter={(filter) => {
              setFilters((f) => ({ ...f, status: filter }));
            }}
            activeStockFilter={filters.status}
          />
        </section>

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
            onOpenAddItem={() => {
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
            counts={tabCounts}
          />
        </section>

        {/* Main Equipment Inventory Table */}
        <section aria-label="Equipment Table">
          {loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center shadow-md">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-300">Loading equipment inventory...</p>
              <p className="text-xs text-slate-500 mt-1">Connecting to database</p>
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

        {/* Category Distribution Quick Summary Bar */}
        {!loading && categorySummaries.length > 0 && (
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Inventory Distribution by Category
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {categorySummaries.length} categories represented
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {categorySummaries.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      category: prev.category === cat.category ? 'all' : cat.category,
                    }))
                  }
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border transition-all ${
                    filters.category === cat.category
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-semibold'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>{cat.category}</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400">
                    {cat.count}
                  </span>
                  <span className="text-[11px] font-semibold text-teal-400">
                    {formatBirr(cat.totalRetailValue, { compact: true })}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Floating Action Button for rapid access on any device */}
      <button
        onClick={() => {
          setEditingItem(null);
          setIsItemModalOpen(true);
        }}
        title="Register new equipment arrival (Alt+N)"
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-black text-sm shadow-2xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer ring-2 ring-white/20"
      >
        <PackagePlus className="w-5 h-5 stroke-[2.5]" />
        <span className="font-bold">New Arrival</span>
      </button>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>
          ShopFlow Equipment &amp; Financial Management System • All prices in Ethiopian Birr (Br)
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Equipment</h3>
                <p className="text-xs text-slate-400">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-slate-300">
              Are you sure you want to delete <span className="font-semibold text-white">"{deletingItem.name}"</span>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}