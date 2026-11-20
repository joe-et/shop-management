import React from 'react';
import { 
  Download, 
  Plus,
  Boxes,
  BarChart3,
  Receipt,
  ShieldCheck
} from 'lucide-react';
import { EquipmentItem } from '../types/inventory';
import { exportInventoryToCsv } from '../utils/csvExport';
import { useTranslation } from '../context/LanguageContext';

interface HeaderProps {
  items: EquipmentItem[];
  activeWorkspace: 'counter' | 'reports';
  onChangeWorkspace: (workspace: 'counter' | 'reports') => void;
  onOpenAddItem: () => void;
  onOpenAudit: () => void;
  onOpenExpenses?: () => void;
  onOpenConfig?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  items,
  activeWorkspace,
  onChangeWorkspace,
  onOpenAddItem,
  onOpenAudit,
  onOpenExpenses,
}) => {
  const { t } = useTranslation();

  const handleExportCsv = () => {
    exportInventoryToCsv(items);
  };

  const inStockCount = items.filter((i) => i.status === 'in_stock' && i.quantity > 0).length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Active Workspace Title & Mobile Nav Switcher */}
        <div className="flex items-center gap-3">
          {/* Mobile Workspace Toggle Tabs (shown on small screens where sidebar is hidden) */}
          <div className="flex sm:hidden items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => onChangeWorkspace('counter')}
              className={`p-1.5 rounded-md text-xs font-semibold ${
                activeWorkspace === 'counter'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
              title={t.common.workspaceCounter}
            >
              <Boxes className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onChangeWorkspace('reports')}
              className={`p-1.5 rounded-md text-xs font-semibold ${
                activeWorkspace === 'reports'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
              title={t.common.workspaceReports}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {activeWorkspace === 'counter'
                  ? t.common.workspaceCounter
                  : t.common.workspaceReports}
              </h1>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                {inStockCount} {t.filters.tabInStock}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              {t.common.appSubtitle}
            </p>
          </div>
        </div>

        {/* Right: Action Buttons (Reserved Black CTA + Neutral Utilities) */}
        <div className="flex items-center gap-2">
          {/* Mobile Tools (Expenses & Audit on small screens) */}
          {onOpenExpenses && (
            <button
              type="button"
              onClick={onOpenExpenses}
              className="sm:hidden p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              title={t.common.expenses}
            >
              <Receipt className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAudit}
            className="sm:hidden p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            title={t.common.auditStocktake}
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* Export CSV (Neutral secondary tool) */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
            title={t.common.exportCsv}
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.common.exportCsv}</span>
          </button>

          {/* Reserved Primary CTA: High-Contrast Black Button */}
          <button
            type="button"
            onClick={onOpenAddItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer select-none"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t.common.newArrival}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
