import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  BarChart3, 
  Receipt, 
  ShieldCheck, 
  Settings, 
  Database,
  CloudUpload,
  WifiOff,
  Loader2
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { getSyncStatus, subscribeToSyncStatus, flushSyncQueue } from '../services/inventoryService';
import { SyncStatusInfo } from '../types/inventory';
import { LanguageSwitcher } from './LanguageSwitcher';

interface SidebarProps {
  activeWorkspace: 'counter' | 'reports';
  onChangeWorkspace: (workspace: 'counter' | 'reports') => void;
  onOpenExpenses: () => void;
  onOpenAudit: () => void;
  onOpenConfig: () => void;
  isConfigured?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeWorkspace,
  onChangeWorkspace,
  onOpenExpenses,
  onOpenAudit,
  onOpenConfig,
  isConfigured = false,
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

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-16 hover:w-56 group transition-all duration-200 ease-in-out bg-white border-r border-slate-200 flex flex-col justify-between py-3 px-2 shadow-xs select-none">
      {/* Top Header & Brand */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3 px-1.5 py-1">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 shadow-xs">
            <Boxes className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 overflow-hidden whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-sm">ShopFlow</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {t.common.currencyName}
            </p>
          </div>
        </div>

        {/* Primary Navigation Workspaces */}
        <nav className="flex flex-col gap-1">
          {/* Workspace 1: Counter & Inventory */}
          <button
            type="button"
            onClick={() => onChangeWorkspace('counter')}
            title={t.common.workspaceCounter}
            className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeWorkspace === 'counter'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Boxes className="w-5 h-5 shrink-0 stroke-[2.2]" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap truncate">
              {t.common.workspaceCounter}
            </span>
          </button>

          {/* Workspace 2: Financial Reports */}
          <button
            type="button"
            onClick={() => onChangeWorkspace('reports')}
            title={t.common.workspaceReports}
            className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeWorkspace === 'reports'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-5 h-5 shrink-0 stroke-[2.2]" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap truncate">
              {t.common.workspaceReports}
            </span>
          </button>

          <div className="my-2 border-t border-slate-100" />

          {/* Quick Tool: Operating Expenses */}
          <button
            type="button"
            onClick={onOpenExpenses}
            title={t.common.expenses}
            className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <Receipt className="w-5 h-5 shrink-0 stroke-[2]" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap truncate">
              {t.common.expenses}
            </span>
          </button>

          {/* Quick Tool: Audit & Stocktake */}
          <button
            type="button"
            onClick={onOpenAudit}
            title={t.common.auditStocktake}
            className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5 shrink-0 stroke-[2]" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap truncate">
              {t.common.auditStocktake}
            </span>
          </button>
        </nav>
      </div>

      {/* Bottom Status & Settings */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
        {/* Language Switcher */}
        <div className="w-full flex items-center">
          <LanguageSwitcher compact={false} />
        </div>

        {/* Sync Status Button */}
        <button
          type="button"
          onClick={handleManualSync}
          title={
            !isConfigured
              ? t.sync.demoStorage
              : !syncStatus.isOnline
              ? t.sync.offlineMode
              : syncStatus.pendingCount > 0
              ? `${syncStatus.pendingCount} ${t.sync.pendingCount}`
              : t.sync.synced
          }
          className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
        >
          <div className="relative shrink-0">
            {isManualSyncing ? (
              <Loader2 className="w-4 h-4 text-slate-700 animate-spin" />
            ) : !isConfigured ? (
              <Database className="w-4 h-4 text-slate-400" />
            ) : !syncStatus.isOnline ? (
              <WifiOff className="w-4 h-4 text-rose-500" />
            ) : syncStatus.pendingCount > 0 ? (
              <CloudUpload className="w-4 h-4 text-amber-500" />
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 my-1 mx-0.5" />
            )}
          </div>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap text-[11px] truncate">
            {isManualSyncing
              ? t.sync.syncing
              : !isConfigured
              ? t.sync.demoStorage
              : !syncStatus.isOnline
              ? t.sync.offlineMode
              : syncStatus.pendingCount > 0
              ? `${syncStatus.pendingCount} ${t.sync.syncNow}`
              : t.sync.synced}
          </span>
        </button>

        {/* System Settings */}
        <button
          type="button"
          onClick={onOpenConfig}
          title={t.common.database}
          className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
        >
          <Settings className="w-4 h-4 shrink-0 text-slate-500" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap text-[11px] truncate">
            {t.common.database}
          </span>
        </button>
      </div>
    </aside>
  );
};
