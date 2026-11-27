import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard,
  PackagePlus,
  Boxes,
  Receipt, 
  ShieldCheck, 
  Settings, 
  Database,
  CloudUpload,
  WifiOff,
  Loader2,
  Menu,
  X
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { getSyncStatus, subscribeToSyncStatus, flushSyncQueue } from '../services/inventoryService';
import { SyncStatusInfo } from '../types/inventory';
import { LanguageSwitcher } from './LanguageSwitcher';

export type WorkspaceTab = 'dashboard' | 'items';

interface SidebarProps {
  activeWorkspace: WorkspaceTab;
  onChangeWorkspace: (workspace: WorkspaceTab) => void;
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setSyncStatus(getSyncStatus());
    const unsubscribe = subscribeToSyncStatus((status) => {
      setSyncStatus(status);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleManualSync = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (syncStatus.pendingCount === 0 || isManualSyncing) return;
    setIsManualSyncing(true);
    try {
      await flushSyncQueue();
    } finally {
      setIsManualSyncing(false);
    }
  };

  return (
    <>
      {/* Desktop / Tablet Slim Left Sidebar (Hidden on mobile, Icon rail on >=md, expands on hover) */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-16 hover:w-56 group transition-all duration-200 ease-in-out bg-white border-r border-slate-200 flex-col justify-between py-3 px-2 shadow-xs select-none">
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

          {/* Primary Navigation Workspaces: Dashboard & Items */}
          <nav className="flex flex-col gap-1" aria-label="Workspace Navigation">
            {/* Workspace 1: Dashboard Home */}
            <button
              type="button"
              onClick={() => onChangeWorkspace('dashboard')}
              title={t.common.workspaceDashboard}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeWorkspace === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0 stroke-[2.2]" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap truncate">
                {t.common.workspaceDashboard}
              </span>
            </button>

            {/* Workspace 2: Items (Add Items Only) */}
            <button
              type="button"
              onClick={() => onChangeWorkspace('items')}
              title={t.common.workspaceItems}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeWorkspace === 'items'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PackagePlus className="w-5 h-5 shrink-0 stroke-[2.2]" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap truncate">
                {t.common.workspaceItems}
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
            <LanguageSwitcher compact={false} side="right" collapseInRail />
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

      {/* Mobile Dedicated Bottom Navigation Bar (4 clean tabs) */}
      <nav 
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around px-1 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] shadow-lg select-none"
      >
        {/* Tab 1: Dashboard Home */}
        <button
          type="button"
          onClick={() => onChangeWorkspace('dashboard')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl text-[10px] font-semibold transition-all cursor-pointer min-w-0 flex-1 ${
            activeWorkspace === 'dashboard'
              ? 'text-slate-900 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 stroke-[2.2] ${activeWorkspace === 'dashboard' ? 'text-slate-900' : 'text-slate-400'}`} />
          <span className="truncate max-w-full px-0.5 text-center">{t.common.navDashboard}</span>
        </button>

        {/* Tab 2: Items (Add Items Only) */}
        <button
          type="button"
          onClick={() => onChangeWorkspace('items')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl text-[10px] font-semibold transition-all cursor-pointer min-w-0 flex-1 ${
            activeWorkspace === 'items'
              ? 'text-slate-900 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <PackagePlus className={`w-5 h-5 stroke-[2.2] ${activeWorkspace === 'items' ? 'text-slate-900' : 'text-slate-400'}`} />
          <span className="truncate max-w-full px-0.5 text-center">{t.common.navItems}</span>
        </button>

        {/* Tab 3: Operating Expenses */}
        <button
          type="button"
          onClick={onOpenExpenses}
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl text-[10px] font-semibold text-slate-500 hover:text-slate-800 transition-all cursor-pointer min-w-0 flex-1"
        >
          <Receipt className="w-5 h-5 text-slate-400 stroke-[2]" />
          <span className="truncate max-w-full px-0.5 text-center">{t.common.expenses}</span>
        </button>

        {/* Tab 4: More Menu */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl text-[10px] font-semibold text-slate-500 hover:text-slate-800 transition-all cursor-pointer min-w-0 flex-1"
        >
          <Menu className="w-5 h-5 text-slate-400 stroke-[2]" />
          <span className="truncate max-w-full px-0.5 text-center">{t.common.navMenu}</span>
        </button>
      </nav>

      {/* Mobile "More" Drawer / Slide-Up Sheet */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-t-2xl border-t border-slate-200 shadow-2xl p-4 space-y-3.5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] animate-in slide-in-from-bottom-5 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.common.appTitle}</h3>
                  <p className="text-[10px] text-slate-400">{t.common.appSubtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Options Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Audit & Physical Stocktake */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAudit();
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5 text-slate-700 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{t.common.auditStocktake}</div>
                  <div className="text-[10px] text-slate-500 truncate">{t.common.auditSubtitle}</div>
                </div>
              </button>

              {/* System Settings */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenConfig();
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
              >
                <Settings className="w-5 h-5 text-slate-700 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{t.common.database}</div>
                  <div className="text-[10px] text-slate-500 truncate">{t.common.settingsSubtitle}</div>
                </div>
              </button>
            </div>

            {/* Cloud Sync Status Row */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={(e) => handleManualSync(e)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 cursor-pointer"
              >
                {isManualSyncing ? (
                  <Loader2 className="w-3.5 h-3.5 text-slate-700 animate-spin" />
                ) : !isConfigured ? (
                  <Database className="w-3.5 h-3.5 text-slate-400" />
                ) : !syncStatus.isOnline ? (
                  <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                ) : syncStatus.pendingCount > 0 ? (
                  <CloudUpload className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
                <span className="text-[11px]">
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
            </div>
          </div>
        </div>
      )}
    </>
  );
};
