import { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar, WorkspaceTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { QuickAddBar } from './components/QuickAddBar';
import { ItemModal } from './components/ItemModal';
import { MarkSoldModal } from './components/MarkSoldModal';
import { SystemSettingsModal } from './components/SystemSettingsModal';
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
  CheckCircle2
} from 'lucide-react';
import { useTranslation } from './context/LanguageContext';

export default function App() {
  const { t } = useTranslation();
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(isSupabaseConfigured());
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceTab>('dashboard');

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pl-0 md:pl-16 selection:bg-slate-200 selection:text-slate-900 pb-20 md:pb-6">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-xl text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Sidebar (Desktop left rail, expands on hover; Mobile bottom bar) */}
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
      />

      {/* Main Content Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-4">
        {/* WORKSPACE 1: Dashboard (KPIs, Alerts, Shop Inventory Table, and Financial Reports Section) */}
        {activeWorkspace === 'dashboard' && (
          <DashboardView
            items={items}
            filteredItems={filteredItems}
            loading={loading}
            metrics={metrics}
            categorySummaries={categorySummaries}
            expenses={expenses}
            filters={filters}
            tabCounts={tabCounts}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            onFilterChange={setFilters}
            onMarkSold={(item) => {
              setItemToSell(item);
              setIsMarkSoldModalOpen(true);
            }}
            onRevertToStock={handleRevertToStock}
            onEditItem={(item) => {
              setEditingItem(item);
              setIsItemModalOpen(true);
            }}
            onDeleteItem={(item) => setDeletingItem(item)}
            onViewAuditHistory={(item) => {
              setAuditFilterItemId(item.id);
              setIsAuditModalOpen(true);
            }}
            onOpenExpenses={() => setIsExpensesModalOpen(true)}
          />
        )}

        {/* WORKSPACE 2: Items (Strictly for adding items only) */}
        {activeWorkspace === 'items' && (
          <section aria-label="Add Items">
            <QuickAddBar onSave={handleSaveItem} />
          </section>
        )}
      </main>

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

      {/* System Settings Modal */}
      <SystemSettingsModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSettingsSaved={() => {
          setIsConfigured(isSupabaseConfigured());
          showToast(t.settingsModal.saveSuccess);
        }}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-item-title"
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-4 sm:p-5 space-y-3.5"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 id="delete-item-title" className="text-sm sm:text-base font-bold text-slate-900">{t.toasts.deleteItemTitle}</h3>
                <p className="text-xs text-slate-500">{t.toasts.deleteItemWarning}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              {t.toasts.deleteItemWarning}: <span className="font-semibold text-slate-900">"{deletingItem.name}"</span>?
            </p>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="w-full sm:w-auto px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer text-center"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors disabled:opacity-50 cursor-pointer text-center"
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