import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Database, 
  Download, 
  Settings, 
  RefreshCw, 
  CheckCircle2, 
  PackagePlus,
  ShieldCheck,
  Receipt,
  WifiOff,
  CloudUpload,
  Loader2
} from 'lucide-react';
import { EquipmentItem, SyncStatusInfo } from '../types/inventory';
import { exportInventoryToCsv } from '../utils/csvExport';
import { getSyncStatus, subscribeToSyncStatus, flushSyncQueue } from '../services/inventoryService';
import { useTranslation } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HeaderProps {
  items: EquipmentItem[];
  isConfigured?: boolean;
  onOpenConfig: () => void;
  onResetDemo: () => void;
  onOpenAddItem: () => void;
  onOpenAudit: () => void;
  onOpenExpenses?: () => void;
  isResetting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  items,
  onOpenConfig,
  onResetDemo,
  onOpenAddItem,
  onOpenAudit,
  onOpenExpenses,
  isResetting = false,
}) => {
  const { t } = useTranslation();
  const [syncStatus, setSyncStatus] = useState<SyncStatusInfo>(getSyncStatus());
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    setSyncStatus(getSyncStatus());
    const unsubscribe = subscribeToSyncStatus((status) => {
      setSyncStatus(status);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleManualSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (syncStatus.pendingCount === 0 || isManualSyncing) return;
    setIsManualSyncing(true);
    try {
      await flushSyncQueue();
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleExportCsv = () => {
    exportInventoryToCsv(items);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
            <Boxes className="w-6 h-6 text-slate-950 font-black stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                {t.common.appTitle} <span className="text-emerald-400 font-semibold">Pro</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {t.common.currencySymbol}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {t.common.appSubtitle}
            </p>
          </div>
        </div>

        {/* Actions & Connection Status */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Language Selector */}
          <LanguageSwitcher />

          {/* New Equipment Arrival Primary Button */}
          <button
            onClick={onOpenAddItem}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
            title="Register new incoming equipment (Alt+N)"
          >
            <PackagePlus className="w-4 h-4 stroke-[2.5]" />
            <span>+ {t.common.newArrival}</span>
          </button>

          {/* Audit Trail & Stocktake Button */}
          <button
            onClick={onOpenAudit}
            title="Open Activity Audit Trail & Physical Stocktake Reconciliation"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-600/50 hover:border-amber-500 shadow-sm transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.common.auditStocktake}</span>
          </button>

          {/* Shop Operating Expenses Button */}
          <button
            onClick={onOpenExpenses}
            title="Track Shop Operating Expenses (Rent, Utilities, Transport, Wages)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-600/50 hover:border-rose-500 shadow-sm transition-all cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-rose-400" />
            <span>{t.common.expenses}</span>
          </button>

          {/* Supabase & Offline-First Sync Status Pill */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenConfig}
              title={
                !syncStatus.isConfigured
                  ? 'Running in local storage demo mode. Click to connect Supabase.'
                  : !syncStatus.isOnline
                  ? 'Offline mode: all changes saved locally and will auto-sync when online.'
                  : syncStatus.pendingCount > 0
                  ? `${syncStatus.pendingCount} offline changes pending upload. Click Sync to upload.`
                  : 'Supabase cloud synced. Click to edit connection settings.'
              }
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                !syncStatus.isConfigured
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  : !syncStatus.isOnline
                  ? 'bg-rose-950/40 text-rose-300 border-rose-700/50 hover:bg-rose-900/50'
                  : syncStatus.state === 'syncing' || isManualSyncing
                  ? 'bg-blue-950/40 text-blue-300 border-blue-700/50 animate-pulse'
                  : syncStatus.pendingCount > 0
                  ? 'bg-amber-950/40 text-amber-300 border-amber-700/50 hover:bg-amber-900/50'
                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/50'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    !syncStatus.isConfigured
                      ? 'bg-slate-400'
                      : !syncStatus.isOnline
                      ? 'bg-rose-400'
                      : syncStatus.pendingCount > 0
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    !syncStatus.isConfigured
                      ? 'bg-slate-500'
                      : !syncStatus.isOnline
                      ? 'bg-rose-500'
                      : syncStatus.pendingCount > 0
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
              </span>

              {syncStatus.state === 'syncing' || isManualSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
              ) : !syncStatus.isOnline ? (
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Database className="w-3.5 h-3.5 opacity-80" />
              )}

              <span>
                {!syncStatus.isConfigured
                  ? t.sync.demoStorage
                  : !syncStatus.isOnline
                  ? t.sync.offlineMode
                  : syncStatus.state === 'syncing' || isManualSyncing
                  ? t.sync.syncing
                  : syncStatus.pendingCount > 0
                  ? `${syncStatus.pendingCount} ${t.sync.pendingCount}`
                  : t.sync.synced}
              </span>

              {syncStatus.isConfigured && syncStatus.pendingCount === 0 && syncStatus.isOnline && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
              )}
            </button>

            {/* Quick Manual Sync Button when offline items are pending */}
            {syncStatus.pendingCount > 0 && syncStatus.isOnline && (
              <button
                onClick={handleManualSync}
                disabled={isManualSyncing}
                title="Upload all pending changes to Supabase now"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-sm"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>{t.sync.syncNow}</span>
              </button>
            )}
          </div>

          {/* Reset Demo Data Button */}
          <button
            onClick={onResetDemo}
            disabled={isResetting}
            title="Reload initial demo equipment dataset"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">{t.common.resetDemo}</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            title="Export all inventory items to CSV spreadsheet"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{t.common.exportCsv}</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
              {items.length}
            </span>
          </button>

          {/* Settings / Config Button */}
          <button
            onClick={onOpenConfig}
            title="Configure Supabase Database"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-colors shadow-sm"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{t.common.database}</span>
          </button>
        </div>
      </div>
    </header>
  );
};