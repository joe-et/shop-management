import React from 'react';
import { 
  Download, 
  Plus,
  Boxes,
  LayoutDashboard,
  PackagePlus
} from 'lucide-react';
import { EquipmentItem } from '../types/inventory';
import { exportInventoryToCsv } from '../utils/csvExport';
import { useTranslation } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { WorkspaceTab } from './Sidebar';

interface HeaderProps {
  items: EquipmentItem[];
  activeWorkspace: WorkspaceTab;
  onChangeWorkspace: (workspace: WorkspaceTab) => void;
  onOpenAddItem: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  items,
  activeWorkspace,
  onChangeWorkspace,
  onOpenAddItem,
}) => {
  const { t } = useTranslation();

  const handleExportCsv = () => {
    exportInventoryToCsv(items);
  };

  const inStockCount = items.filter((i) => i.status === 'in_stock' && i.quantity > 0).length;

  const activeTitle =
    activeWorkspace === 'dashboard'
      ? t.common.workspaceDashboard
      : t.common.workspaceItems;

  const activeSubtitle =
    activeWorkspace === 'dashboard'
      ? t.dashboard.welcomeSubtitle
      : t.common.itemsSubtitle;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Brand/Workspace Title & Stock Badge */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile brand icon */}
          <div className="md:hidden w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Boxes className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <h1 className="text-xs sm:text-sm lg:text-base font-bold text-slate-900 tracking-tight truncate min-w-0">
                {activeTitle}
              </h1>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 sm:px-2 py-0.5 rounded-md shrink-0">
                {inStockCount} <span className="hidden xs:inline">{t.filters.tabInStock}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden lg:block truncate">
              {activeSubtitle}
            </p>
          </div>
        </div>

        {/* Center: Top Navbar Workspace Tabs (Dashboard & Items only; Reports lives under Dashboard) */}
        <nav
          aria-label="Primary Navbar"
          className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0"
        >
          <button
            type="button"
            onClick={() => onChangeWorkspace('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeWorkspace === 'dashboard'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
            <span>{t.common.navDashboard}</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeWorkspace('items')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeWorkspace === 'items'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <PackagePlus className="w-3.5 h-3.5 shrink-0" />
            <span>{t.common.navItems}</span>
          </button>
        </nav>

        {/* Right: Action Buttons (Single Primary CTA + Utility Controls) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile Quick Language Switcher */}
          <div className="md:hidden">
            <LanguageSwitcher compact align="right" direction="down" />
          </div>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer shadow-2xs shrink-0"
            title={t.common.exportCsv}
            aria-label={t.common.exportCsv}
          >
            <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="hidden xs:inline md:hidden lg:inline">{t.common.exportCsv}</span>
          </button>

          {/* Single Primary CTA: Detailed Add Item Modal */}
          <button
            type="button"
            onClick={onOpenAddItem}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer select-none shrink-0"
            title={t.common.newArrival}
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">{t.common.newArrival}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
