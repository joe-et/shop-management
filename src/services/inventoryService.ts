import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  EquipmentItem, 
  EquipmentItemInput, 
  EquipmentItemUpdate, 
  ITEM_CATEGORIES,
  AuditLogEntry,
  SyncQueueItem,
  SyncStatusInfo,
  SyncState,
  ShopExpense,
  ShopExpenseInput
} from '../types/inventory';
import { formatBirr } from '../utils/formatters';

const LOCAL_STORAGE_KEY = 'shopflow_inventory_items';
const LOCAL_AUDIT_STORAGE_KEY = 'shopflow_inventory_audit_logs';
const LOCAL_EXPENSES_STORAGE_KEY = 'shopflow_operating_expenses';
const SYNC_QUEUE_KEY = 'shopflow_sync_queue';
const LAST_SYNCED_KEY = 'shopflow_last_synced_at';

// In-memory / custom event dispatcher for demo real-time sync
const DEMO_EVENT_CHANNEL = 'shopflow_inventory_updated';
const AUDIT_EVENT_CHANNEL = 'shopflow_audit_updated';
const EXPENSES_EVENT_CHANNEL = 'shopflow_expenses_updated';
const SYNC_STATUS_CHANNEL = 'shopflow_sync_status_updated';

// Clean out any legacy demo records from previous demo sessions immediately
if (typeof window !== 'undefined') {
  try {
    const rawItems = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (rawItems && (rawItems.includes('a1111111') || rawItems.includes('WAV28M90ME') || rawItems.includes('Bosch Serie 8 Front-Load'))) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    const rawExpenses = localStorage.getItem(LOCAL_EXPENSES_STORAGE_KEY);
    if (rawExpenses && (rawExpenses.includes('exp-001') || rawExpenses.includes('Bole Medhanialem'))) {
      localStorage.removeItem(LOCAL_EXPENSES_STORAGE_KEY);
    }
    const rawAudit = localStorage.getItem(LOCAL_AUDIT_STORAGE_KEY);
    if (rawAudit && (rawAudit.includes('aud-001') || rawAudit.includes('Xiaomi Robot Vacuum-Mop'))) {
      localStorage.removeItem(LOCAL_AUDIT_STORAGE_KEY);
    }
  } catch {
    // Ignore in non-browser contexts
  }
}

// Default initial audit log entries (empty clean state)
export const INITIAL_DEMO_AUDIT_LOGS: AuditLogEntry[] = [];

// Helper to normalize any category strictly to the 3 permitted categories
export function normalizeCategory(cat: string): string {
  if ((ITEM_CATEGORIES as readonly string[]).includes(cat)) {
    return cat;
  }
  if (cat.toLowerCase().includes('ware') || cat.toLowerCase().includes('kitchen') || cat.toLowerCase().includes('cook')) {
    return 'Housewares';
  }
  if (cat.toLowerCase().includes('good') || cat.toLowerCase().includes('clean') || cat.toLowerCase().includes('vacuum')) {
    return 'Household Goods';
  }
  // Default to Domestic Equipment
  return 'Domestic Equipment';
}

// Empty initial equipment catalog (demo storage removed)
export const INITIAL_DEMO_ITEMS: EquipmentItem[] = [];

// ============================================================================
// AUDIT LOG SERVICE
// ============================================================================

export function getLocalAuditLogs(): AuditLogEntry[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(LOCAL_AUDIT_STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to parse local audit log storage:', err);
    return [];
  }
}

export function setLocalAuditLogs(logs: AuditLogEntry[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_AUDIT_STORAGE_KEY, JSON.stringify(logs));
    window.dispatchEvent(new CustomEvent(AUDIT_EVENT_CHANNEL, { detail: logs }));
  }
}

export async function getAuditLogs(itemId?: string): Promise<AuditLogEntry[]> {
  if (isSupabaseConfigured()) {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (isOnline) {
      try {
        let query = supabase
          .from('equipment_audit_logs')
          .select('*')
          .order('timestamp', { ascending: false });
        if (itemId) {
          query = query.eq('item_id', itemId);
        }
        const { data, error } = await query;
        if (!error && data) {
          const list = data as AuditLogEntry[];
          if (typeof window !== 'undefined' && !itemId) {
            localStorage.setItem(LOCAL_AUDIT_STORAGE_KEY, JSON.stringify(list));
          }
          return list;
        }
      } catch (err) {
        console.warn('Supabase audit fetch error, using local:', err);
      }
    }
  }

  const allLogs = getLocalAuditLogs();
  if (itemId) {
    return allLogs.filter((log) => log.item_id === itemId);
  }
  return allLogs;
}

export async function logAuditEvent(
  entry: Omit<AuditLogEntry, 'id' | 'timestamp'>
): Promise<AuditLogEntry> {
  const newLog: AuditLogEntry = {
    ...entry,
    id: typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  const logs = getLocalAuditLogs();
  const updatedLogs = [newLog, ...logs];
  setLocalAuditLogs(updatedLogs);

  // Sync to Supabase or queue for offline sync
  if (isSupabaseConfigured()) {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (isOnline) {
      try {
        const { error } = await supabase.from('inventory_audit_logs').insert([newLog]);
        if (error) {
          addToSyncQueue({
            type: 'audit_log',
            table: 'inventory_audit_logs',
            itemId: newLog.id,
            payload: newLog,
          });
        }
      } catch {
        addToSyncQueue({
          type: 'audit_log',
          table: 'inventory_audit_logs',
          itemId: newLog.id,
          payload: newLog,
        });
      }
    } else {
      addToSyncQueue({
        type: 'audit_log',
        table: 'inventory_audit_logs',
        itemId: newLog.id,
        payload: newLog,
      });
    }
  }

  return newLog;
}

export function subscribeToAuditLogs(callback: () => void): () => void {
  const handler = () => callback();
  if (typeof window !== 'undefined') {
    window.addEventListener(AUDIT_EVENT_CHANNEL, handler);
    window.addEventListener('storage', handler);
  }
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(AUDIT_EVENT_CHANNEL, handler);
      window.removeEventListener('storage', handler);
    }
  };
}

// ============================================================================
// OFFLINE-FIRST LOCAL CACHE & SYNC ENGINE
// ============================================================================

let isSyncInProgress = false;

export function getPendingSyncQueue(): SyncQueueItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(SYNC_QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse sync queue:', err);
    return [];
  }
}

export function setPendingSyncQueue(queue: SyncQueueItem[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    notifySyncStatusChange();
  }
}

export function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): void {
  const queue = getPendingSyncQueue();
  const newEntry: SyncQueueItem = {
    ...item,
    id: typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };
  setPendingSyncQueue([...queue, newEntry]);
}

export function getLastSyncedAt(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_SYNCED_KEY);
}

export function setLastSyncedAt(timestamp: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LAST_SYNCED_KEY, timestamp);
    notifySyncStatusChange();
  }
}

export function getSyncStatus(): SyncStatusInfo {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const isConfigured = isSupabaseConfigured();
  const queue = getPendingSyncQueue();
  const lastSyncedAt = getLastSyncedAt();

  let state: SyncState = 'demo';
  if (isConfigured) {
    if (isSyncInProgress) {
      state = 'syncing';
    } else if (!isOnline) {
      state = 'offline';
    } else if (queue.length > 0) {
      state = 'pending';
    } else {
      state = 'synced';
    }
  }

  return {
    state,
    pendingCount: queue.length,
    lastSyncedAt,
    isOnline,
    isConfigured,
  };
}

export function notifySyncStatusChange(): void {
  if (typeof window !== 'undefined') {
    const status = getSyncStatus();
    window.dispatchEvent(new CustomEvent(SYNC_STATUS_CHANNEL, { detail: status }));
  }
}

export function subscribeToSyncStatus(callback: (status: SyncStatusInfo) => void): () => void {
  const handler = () => callback(getSyncStatus());
  if (typeof window !== 'undefined') {
    window.addEventListener(SYNC_STATUS_CHANNEL, handler);
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
  }
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(SYNC_STATUS_CHANNEL, handler);
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    }
  };
}

/**
 * Flush all pending offline operations to Supabase
 */
export async function flushSyncQueue(): Promise<{ success: boolean; syncedCount: number; errors: number }> {
  if (!isSupabaseConfigured()) {
    return { success: true, syncedCount: 0, errors: 0 };
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, syncedCount: 0, errors: 0 };
  }
  if (isSyncInProgress) {
    return { success: false, syncedCount: 0, errors: 0 };
  }

  const queue = getPendingSyncQueue();
  if (queue.length === 0) {
    setLastSyncedAt(new Date().toISOString());
    return { success: true, syncedCount: 0, errors: 0 };
  }

  isSyncInProgress = true;
  notifySyncStatusChange();

  const remainingQueue: SyncQueueItem[] = [];
  let syncedCount = 0;
  let errors = 0;

  for (const item of queue) {
    try {
      if (item.table === 'equipment_items') {
        if (item.type === 'delete') {
          const { error } = await supabase.from('equipment_items').delete().eq('id', item.itemId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('equipment_items').upsert([item.payload]);
          if (error) throw error;
        }
      } else if (item.table === 'inventory_audit_logs') {
        const { error } = await supabase.from('inventory_audit_logs').upsert([item.payload]);
        if (error) throw error;
      } else if (item.table === 'shop_operating_expenses') {
        if (item.type === 'delete') {
          const { error } = await supabase.from('shop_operating_expenses').delete().eq('id', item.itemId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('shop_operating_expenses').upsert([item.payload]);
          if (error) throw error;
        }
      }
      syncedCount++;
    } catch (err) {
      console.warn(`Failed to sync queue item ${item.id}:`, err);
      errors++;
      remainingQueue.push({ ...item, retryCount: item.retryCount + 1 });
    }
  }

  setPendingSyncQueue(remainingQueue);
  isSyncInProgress = false;

  if (syncedCount > 0) {
    setLastSyncedAt(new Date().toISOString());
  } else {
    notifySyncStatusChange();
  }

  return { success: errors === 0, syncedCount, errors };
}

// Auto-sync on connection restoration in browser
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    notifySyncStatusChange();
    flushSyncQueue();
  });
  window.addEventListener('offline', () => {
    notifySyncStatusChange();
  });
}

// ============================================================================
// SHOP OPERATING EXPENSES (OVERHEAD TRACKING)
// ============================================================================

export const INITIAL_DEMO_EXPENSES: ShopExpense[] = [];

export function getLocalExpenses(): ShopExpense[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LOCAL_EXPENSES_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse local expenses:', err);
    return [];
  }
}

export function setLocalExpenses(expenses: ShopExpense[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
    window.dispatchEvent(new CustomEvent(EXPENSES_EVENT_CHANNEL, { detail: expenses }));
  }
}

export async function getExpenses(): Promise<ShopExpense[]> {
  if (isSupabaseConfigured()) {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('shop_operating_expenses')
          .select('*')
          .order('date', { ascending: false });

        if (!error && data) {
          const list = data as ShopExpense[];
          if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_EXPENSES_STORAGE_KEY, JSON.stringify(list));
          }
          return list;
        }
      } catch (err) {
        console.warn('Supabase expenses fetch error, using local:', err);
      }
    }
  }

  return getLocalExpenses();
}

export async function createExpense(input: ShopExpenseInput): Promise<ShopExpense> {
  const now = new Date().toISOString();
  const newExpense: ShopExpense = {
    ...input,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    amount: Number(input.amount) || 0,
    date: input.date || now,
    created_at: now,
  };

  const list = getLocalExpenses();
  const updated = [newExpense, ...list];
  setLocalExpenses(updated);

  if (isSupabaseConfigured()) {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (isOnline) {
      try {
        const { error } = await supabase
          .from('shop_operating_expenses')
          .insert([newExpense]);

        if (error) {
          addToSyncQueue({
            type: 'create',
            table: 'shop_operating_expenses',
            itemId: newExpense.id,
            payload: newExpense,
          });
        }
      } catch {
        addToSyncQueue({
          type: 'create',
          table: 'shop_operating_expenses',
          itemId: newExpense.id,
          payload: newExpense,
        });
      }
    } else {
      addToSyncQueue({
        type: 'create',
        table: 'shop_operating_expenses',
        itemId: newExpense.id,
        payload: newExpense,
      });
    }
  }

  return newExpense;
}

export async function deleteExpense(id: string): Promise<boolean> {
  const list = getLocalExpenses();
  const filtered = list.filter((e) => e.id !== id);
  setLocalExpenses(filtered);

  if (isSupabaseConfigured()) {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (isOnline) {
      try {
        const { error } = await supabase
          .from('shop_operating_expenses')
          .delete()
          .eq('id', id);

        if (error) {
          addToSyncQueue({
            type: 'delete',
            table: 'shop_operating_expenses',
            itemId: id,
            payload: null,
          });
        }
      } catch {
        addToSyncQueue({
          type: 'delete',
          table: 'shop_operating_expenses',
          itemId: id,
          payload: null,
        });
      }
    } else {
      addToSyncQueue({
        type: 'delete',
        table: 'shop_operating_expenses',
        itemId: id,
        payload: null,
      });
    }
  }

  return true;
}

export function subscribeToExpenses(callback: () => void): () => void {
  const handler = () => callback();
  if (typeof window !== 'undefined') {
    window.addEventListener(EXPENSES_EVENT_CHANNEL, handler);
    window.addEventListener('storage', handler);
  }
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(EXPENSES_EVENT_CHANNEL, handler);
      window.removeEventListener('storage', handler);
    }
  };
}

// ============================================================================
// STOCKTAKE RECONCILIATION
// ============================================================================

export async function performStocktakeReconciliation(
  variances: { itemId: string; countedQty: number; notes?: string }[]
): Promise<number> {
  let adjustedCount = 0;
  for (const v of variances) {
    const item = await getItemById(v.itemId);
    if (!item) continue;
    const systemQty = item.quantity;
    const diff = v.countedQty - systemQty;
    if (diff === 0) continue;

    await updateItem(v.itemId, { quantity: v.countedQty });

    await logAuditEvent({
      item_id: item.id,
      item_name: item.name,
      action: 'stocktake_adjustment',
      actor: 'Physical Stocktake Audit',
      details: `Reconciled stock: System was ${systemQty}, physical count is ${v.countedQty} (${diff > 0 ? '+' : ''}${diff} units). Financial variance: ${formatBirr(diff * item.purchase_price)}. ${v.notes ? `Note: ${v.notes}` : ''}`,
      quantity_change: diff,
      financial_impact: diff * item.purchase_price,
      previous_state: { quantity: systemQty },
      new_state: { quantity: v.countedQty },
    });
    adjustedCount++;
  }
  return adjustedCount;
}

// ============================================================================
// EQUIPMENT ITEMS CRUD & LOCAL CACHE
// ============================================================================

function getLocalItems(): EquipmentItem[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) return [];
  try {
    const parsed: EquipmentItem[] = JSON.parse(data);
    let changed = false;
    const normalized = parsed.map((item) => {
      let updatedItem = item;
      const validCategory = normalizeCategory(item.category);
      if (validCategory !== item.category) {
        changed = true;
        updatedItem = { ...updatedItem, category: validCategory };
      }
      if ((updatedItem.status as string) === 'in_repair') {
        changed = true;
        updatedItem = { ...updatedItem, status: 'in_stock' };
      }
      if (!updatedItem.unit) {
        changed = true;
        const nameLower = updatedItem.name.toLowerCase();
        const unitGuess = nameLower.includes('set') ? 'set' : nameLower.includes('box') ? 'box' : nameLower.includes('pack') ? 'pack' : 'pcs';
        updatedItem = { ...updatedItem, unit: unitGuess };
      }
      return updatedItem;
    });

    if (changed) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch (err) {
    console.error('Failed to parse local inventory storage:', err);
    return [];
  }
}

function setLocalItems(items: EquipmentItem[]): void {
  if (typeof window !== 'undefined') {
    const normalized = items.map((item) => ({
      ...item,
      category: normalizeCategory(item.category),
    }));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(DEMO_EVENT_CHANNEL, { detail: normalized }));
  }
}

export async function getItems(): Promise<EquipmentItem[]> {
  if (isSupabaseConfigured()) {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (isOnline) {
      const queue = getPendingSyncQueue();
      if (queue.length > 0) {
        await flushSyncQueue();
      }

      try {
        const { data, error } = await supabase
          .from('equipment_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const normalized = (data as EquipmentItem[]).map((item) => ({
            ...item,
            category: normalizeCategory(item.category),
          }));
          if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
          }
          setLastSyncedAt(new Date().toISOString());
          return normalized;
        }
      } catch (err) {
        console.warn('Supabase fetch error, using local items:', err);
      }
    }
  }

  return getLocalItems();
}

export async function getItemById(id: string): Promise<EquipmentItem | null> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('equipment_items')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return {
          ...(data as EquipmentItem),
          category: normalizeCategory(data.category),
        };
      }
    } catch (err) {
      console.warn('Supabase fetch single error:', err);
    }
  }

  const items = getLocalItems();
  return items.find((i) => i.id === id) || null;
}

export async function createItem(input: EquipmentItemInput): Promise<EquipmentItem> {
  const now = new Date().toISOString();
  const newItem: EquipmentItem = {
    ...input,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    category: normalizeCategory(input.category),
    purchase_price: Number(input.purchase_price) || 0,
    retail_price: Number(input.retail_price) || 0,
    sold_price: input.sold_price !== null && input.sold_price !== undefined ? Number(input.sold_price) : null,
    quantity: Number(input.quantity) || 1,
    min_stock_threshold: input.min_stock_threshold !== undefined && input.min_stock_threshold !== null ? Number(input.min_stock_threshold) : 2,
    created_at: now,
    updated_at: now,
  };

  // 1. Immediately store locally
  const items = getLocalItems();
  const updatedList = [newItem, ...items];
  setLocalItems(updatedList);

  // 2. Sync to Supabase or queue
  if (isSupabaseConfigured()) {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (isOnline) {
      try {
        const { error } = await supabase
          .from('equipment_items')
          .insert([newItem]);

        if (error) {
          addToSyncQueue({
            type: 'create',
            table: 'equipment_items',
            itemId: newItem.id,
            payload: newItem,
          });
        }
      } catch {
        addToSyncQueue({
          type: 'create',
          table: 'equipment_items',
          itemId: newItem.id,
          payload: newItem,
        });
      }
    } else {
      addToSyncQueue({
        type: 'create',
        table: 'equipment_items',
        itemId: newItem.id,
        payload: newItem,
      });
    }
  }

  // 3. Log audit event
  await logAuditEvent({
    item_id: newItem.id,
    item_name: newItem.name,
    action: 'item_created',
    actor: 'Shop Intake',
    details: `Registered new arrival: ${newItem.quantity} unit(s) at unit cost ${formatBirr(newItem.purchase_price)}, listed at ${formatBirr(newItem.retail_price)}.`,
    quantity_change: newItem.quantity,
    financial_impact: newItem.purchase_price * newItem.quantity,
    new_state: {
      purchase_price: newItem.purchase_price,
      retail_price: newItem.retail_price,
      quantity: newItem.quantity,
      category: newItem.category,
    },
  });

  return newItem;
}

export async function updateItem(id: string, updates: EquipmentItemUpdate): Promise<EquipmentItem> {
  const now = new Date().toISOString();
  const sanitizedUpdates: EquipmentItemUpdate = {
    ...updates,
    ...(updates.category ? { category: normalizeCategory(updates.category) } : {}),
  };

  const items = getLocalItems();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) {
    throw new Error(`Item with id ${id} not found`);
  }

  const existing = items[index];
  const oldCost = existing.purchase_price;
  const newCost = sanitizedUpdates.purchase_price !== undefined ? Number(sanitizedUpdates.purchase_price) : oldCost;
  const oldRetail = existing.retail_price;
  const newRetail = sanitizedUpdates.retail_price !== undefined ? Number(sanitizedUpdates.retail_price) : oldRetail;

  if (newCost !== oldCost || newRetail !== oldRetail) {
    await logAuditEvent({
      item_id: existing.id,
      item_name: existing.name,
      action: 'price_changed',
      actor: 'Shop Manager',
      details: `Price changed for "${existing.name}": Cost (${formatBirr(oldCost)} → ${formatBirr(newCost)}), Retail (${formatBirr(oldRetail)} → ${formatBirr(newRetail)}).`,
      previous_state: { purchase_price: oldCost, retail_price: oldRetail },
      new_state: { purchase_price: newCost, retail_price: newRetail },
    });
  } else if (sanitizedUpdates.status && sanitizedUpdates.status !== existing.status) {
    await logAuditEvent({
      item_id: existing.id,
      item_name: existing.name,
      action: sanitizedUpdates.status === 'in_stock' ? 'reverted_to_stock' : 'item_updated',
      actor: 'Shop Manager',
      details: `Status of "${existing.name}" changed from ${existing.status} to ${sanitizedUpdates.status}.`,
      previous_state: { status: existing.status },
      new_state: { status: sanitizedUpdates.status },
    });
  }

  const updated: EquipmentItem = {
    ...items[index],
    ...sanitizedUpdates,
    updated_at: now,
  };

  // 1. Immediately store locally
  items[index] = updated;
  setLocalItems(items);

  // 2. Sync to Supabase or queue
  if (isSupabaseConfigured()) {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (isOnline) {
      try {
        const { error } = await supabase
          .from('equipment_items')
          .update({
            ...sanitizedUpdates,
            updated_at: now,
          })
          .eq('id', id);

        if (error) {
          addToSyncQueue({
            type: 'update',
            table: 'equipment_items',
            itemId: id,
            payload: updated,
          });
        }
      } catch {
        addToSyncQueue({
          type: 'update',
          table: 'equipment_items',
          itemId: id,
          payload: updated,
        });
      }
    } else {
      addToSyncQueue({
        type: 'update',
        table: 'equipment_items',
        itemId: id,
        payload: updated,
      });
    }
  }

  return updated;
}

export async function deleteItem(id: string): Promise<boolean> {
  const items = getLocalItems();
  const existing = items.find((i) => i.id === id);

  // 1. Immediately delete locally
  const filtered = items.filter((i) => i.id !== id);
  setLocalItems(filtered);

  if (existing) {
    await logAuditEvent({
      item_id: existing.id,
      item_name: existing.name,
      action: 'item_deleted',
      actor: 'Shop Manager',
      details: `Deleted equipment item "${existing.name}" (Quantity: ${existing.quantity}, Unit Cost: ${formatBirr(existing.purchase_price)}).`,
      quantity_change: -existing.quantity,
      financial_impact: -(existing.purchase_price * existing.quantity),
    });
  }

  // 2. Sync to Supabase or queue
  if (isSupabaseConfigured()) {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (isOnline) {
      try {
        const { error } = await supabase
          .from('equipment_items')
          .delete()
          .eq('id', id);

        if (error) {
          addToSyncQueue({
            type: 'delete',
            table: 'equipment_items',
            itemId: id,
            payload: null,
          });
        }
      } catch {
        addToSyncQueue({
          type: 'delete',
          table: 'equipment_items',
          itemId: id,
          payload: null,
        });
      }
    } else {
      addToSyncQueue({
        type: 'delete',
        table: 'equipment_items',
        itemId: id,
        payload: null,
      });
    }
  }

  return true;
}

export async function markAsSold(
  id: string,
  saleDetails: {
    sold_price: number;
    sold_at?: string;
    customer_name?: string;
    customer_phone?: string;
    notes?: string;
    quantity_sold?: number;
  }
): Promise<EquipmentItem> {
  const existingItem = await getItemById(id);
  if (!existingItem) {
    throw new Error(`Item with id ${id} not found`);
  }

  const availableQty = Number(existingItem.quantity) || 1;
  const qtyToSell = Math.min(
    Math.max(Number(saleDetails.quantity_sold) || 1, 1),
    availableQty
  );

  // Partial sale: selling fewer units than available in stock
  if (qtyToSell < availableQty) {
    const remainingQty = availableQty - qtyToSell;
    await updateItem(id, {
      quantity: remainingQty,
    });

    const soldItemInput: EquipmentItemInput = {
      name: existingItem.name,
      category: existingItem.category,
      brand: existingItem.brand,
      model: existingItem.model,
      serial_number: existingItem.serial_number,
      condition: existingItem.condition,
      status: 'sold',
      purchase_price: existingItem.purchase_price,
      retail_price: existingItem.retail_price,
      sold_price: Number(saleDetails.sold_price) || 0,
      sold_at: saleDetails.sold_at || new Date().toISOString(),
      customer_name: saleDetails.customer_name || null,
      customer_phone: saleDetails.customer_phone || null,
      quantity: qtyToSell,
      min_stock_threshold: existingItem.min_stock_threshold,
      location: 'Sold / Delivered',
      notes: saleDetails.notes || `Partial sale of ${qtyToSell} unit(s) from batch of ${availableQty}`,
      warranty_period_months: existingItem.warranty_period_months,
      image_url: existingItem.image_url,
    };

    const soldRecord = await createItem(soldItemInput);

    await logAuditEvent({
      item_id: existingItem.id,
      item_name: existingItem.name,
      action: 'partial_sale',
      actor: 'Sales Counter',
      details: `Partial sale: Sold ${qtyToSell} of ${availableQty} units at ${formatBirr(saleDetails.sold_price)} each. Remaining stock: ${remainingQty} unit(s). Realized Net Profit: +${formatBirr((Number(saleDetails.sold_price) - existingItem.purchase_price) * qtyToSell)}.`,
      quantity_change: -qtyToSell,
      financial_impact: (Number(saleDetails.sold_price) - existingItem.purchase_price) * qtyToSell,
      new_state: {
        sold_price: Number(saleDetails.sold_price),
        sold_at: saleDetails.sold_at || new Date().toISOString(),
        customer_name: saleDetails.customer_name || undefined,
      },
    });

    return soldRecord;
  }

  // Full sale: all units sold
  const updates: EquipmentItemUpdate = {
    status: 'sold',
    sold_price: Number(saleDetails.sold_price) || 0,
    sold_at: saleDetails.sold_at || new Date().toISOString(),
    customer_name: saleDetails.customer_name || null,
    customer_phone: saleDetails.customer_phone || null,
    location: 'Sold / Delivered',
    notes: saleDetails.notes || existingItem.notes,
  };

  const updatedItem = await updateItem(id, updates);

  await logAuditEvent({
    item_id: existingItem.id,
    item_name: existingItem.name,
    action: 'item_sold',
    actor: 'Sales Counter',
    details: `Full sale: Sold all ${availableQty} unit(s) of "${existingItem.name}" at agreed price ${formatBirr(saleDetails.sold_price)} each. Realized Net Profit: +${formatBirr((Number(saleDetails.sold_price) - existingItem.purchase_price) * availableQty)}.`,
    quantity_change: -availableQty,
    financial_impact: (Number(saleDetails.sold_price) - existingItem.purchase_price) * availableQty,
    new_state: {
      status: 'sold',
      sold_price: Number(saleDetails.sold_price),
      sold_at: saleDetails.sold_at || new Date().toISOString(),
      customer_name: saleDetails.customer_name || undefined,
    },
  });

  return updatedItem;
}

export async function clearAllLocalData(): Promise<EquipmentItem[]> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LOCAL_AUDIT_STORAGE_KEY);
    localStorage.removeItem(LOCAL_EXPENSES_STORAGE_KEY);
    localStorage.removeItem(SYNC_QUEUE_KEY);
    localStorage.removeItem(LAST_SYNCED_KEY);
    window.dispatchEvent(new CustomEvent(DEMO_EVENT_CHANNEL, { detail: [] }));
    window.dispatchEvent(new CustomEvent(AUDIT_EVENT_CHANNEL, { detail: [] }));
    window.dispatchEvent(new CustomEvent(EXPENSES_EVENT_CHANNEL, { detail: [] }));
    notifySyncStatusChange();
  }
  return [];
}
export const resetToDemoData = clearAllLocalData;

export function subscribeToInventory(callback: () => void): () => void {
  const handler = () => callback();
  if (typeof window !== 'undefined') {
    window.addEventListener(DEMO_EVENT_CHANNEL, handler);
    window.addEventListener('storage', handler);
  }
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(DEMO_EVENT_CHANNEL, handler);
      window.removeEventListener('storage', handler);
    }
  };
}
