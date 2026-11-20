import React, { useState, useMemo } from 'react';
import { 
  X, 
  Receipt, 
  Plus, 
  Trash2, 
  Download, 
  Search, 
  Calendar, 
  TrendingDown,
  Building,
  Zap,
  Truck,
  Users,
  Package,
  Wrench,
  HelpCircle
} from 'lucide-react';
import { ShopExpense, ShopExpenseInput, ExpenseCategory, EXPENSE_CATEGORIES } from '../types/inventory';
import { formatBirr, formatDate } from '../utils/formatters';
import { useTranslation } from '../context/LanguageContext';

interface ExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ShopExpense[];
  onAddExpense: (expense: ShopExpenseInput) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
}

const CATEGORY_ICONS: Record<ExpenseCategory, React.ReactNode> = {
  Rent: <Building className="w-3.5 h-3.5 text-rose-400" />,
  Utilities: <Zap className="w-3.5 h-3.5 text-amber-400" />,
  'Transport & Freight': <Truck className="w-3.5 h-3.5 text-blue-400" />,
  'Staff Wages': <Users className="w-3.5 h-3.5 text-purple-400" />,
  'Supplies & Packaging': <Package className="w-3.5 h-3.5 text-teal-400" />,
  Maintenance: <Wrench className="w-3.5 h-3.5 text-orange-400" />,
  Other: <HelpCircle className="w-3.5 h-3.5 text-slate-400" />,
};

export const ExpensesModal: React.FC<ExpensesModalProps> = ({
  isOpen,
  onClose,
  expenses,
  onAddExpense,
  onDeleteExpense,
}) => {
  const { t, getExpenseCategoryLabel, getPaymentMethodLabel } = useTranslation();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Rent');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Telebirr' | 'Bank Transfer / CBE' | 'Other'>('Cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const totalExpenseAmount = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (selectedCategoryFilter !== 'all' && exp.category !== selectedCategoryFilter) {
        return false;
      }
      if (search.trim() !== '') {
        const query = search.toLowerCase();
        const matchesTitle = exp.title.toLowerCase().includes(query);
        const matchesCategory = exp.category.toLowerCase().includes(query);
        const matchesNotes = exp.notes?.toLowerCase().includes(query) ?? false;
        if (!matchesTitle && !matchesCategory && !matchesNotes) return false;
      }
      return true;
    });
  }, [expenses, selectedCategoryFilter, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) return;

    try {
      setIsSubmitting(true);
      await onAddExpense({
        title: title.trim(),
        category,
        amount: Number(amount),
        date: new Date(date).toISOString(),
        payment_method: paymentMethod,
        notes: notes.trim() || null,
      });

      setTitle('');
      setAmount('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    if (expenses.length === 0) return;
    const headers = ['ID', 'Title', 'Category', 'Amount (Br)', 'Date', 'Payment Method', 'Notes'];
    const rows = expenses.map((e) => [
      `"${e.id}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      e.amount.toFixed(2),
      `"${e.date}"`,
      `"${e.payment_method}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shop_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500/20 to-orange-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-inner">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {t.expensesModal.modalTitle}
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-rose-400" />
                  {t.expensesModal.totalOverhead}: {formatBirr(totalExpenseAmount)}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {t.expensesModal.modalSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Quick Expense Form */}
          <form 
            onSubmit={handleSubmit}
            className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3.5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-400" />
                {t.expensesModal.logNewExpense}
              </span>
              <span className="text-[11px] text-slate-500">{t.metrics.overhead}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Title (Span 5) */}
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  {t.expensesModal.expenseTitle} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.expensesModal.expenseTitlePlaceholder}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Category (Span 3) */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  {t.expensesModal.category} *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {getExpenseCategoryLabel(cat)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount (Span 4) */}
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  {t.expensesModal.amount} ({t.common.currencyName}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 font-bold text-xs">
                    {t.common.currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm font-bold text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* Date (Span 3) */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  {t.expensesModal.expenseDate}
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Payment Method (Span 3) */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  {t.expensesModal.paymentMethod}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="Cash">{getPaymentMethodLabel('Cash')}</option>
                  <option value="Telebirr">{getPaymentMethodLabel('Telebirr')}</option>
                  <option value="Bank Transfer / CBE">{getPaymentMethodLabel('Bank Transfer / CBE')}</option>
                  <option value="Other">{getPaymentMethodLabel('Other')}</option>
                </select>
              </div>

              {/* Optional Notes (Span 4) */}
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  {t.expensesModal.notes}
                </label>
                <input
                  type="text"
                  placeholder={t.expensesModal.notesPlaceholder}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Submit Button (Span 2) */}
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !title || !amount}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-bold text-xs shadow-md shadow-rose-950/40 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? t.common.loading : t.expensesModal.recordExpenseButton}
                </button>
              </div>
            </div>
          </form>

          {/* Filter Bar & Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t.expensesModal.searchExpensesPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="all">{t.expensesModal.allCategories}</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{getExpenseCategoryLabel(c)}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportCsv}
              disabled={expenses.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 text-rose-400" />
              <span>{t.common.exportCsv}</span>
            </button>
          </div>

          {/* Expense History Table */}
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3.5">{t.expensesModal.expenseTitle}</th>
                    <th className="py-3 px-3">{t.expensesModal.category}</th>
                    <th className="py-3 px-3">{t.common.date}</th>
                    <th className="py-3 px-3">{t.expensesModal.paymentMethod}</th>
                    <th className="py-3 px-3 text-right">{t.expensesModal.amount}</th>
                    <th className="py-3 px-3 text-center">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        {t.expensesModal.noExpensesFound}
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-white">{exp.title}</div>
                          {exp.notes && (
                            <div className="text-[11px] text-slate-400 mt-0.5">{exp.notes}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                            {CATEGORY_ICONS[exp.category]}
                            <span>{getExpenseCategoryLabel(exp.category)}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                          {formatDate(exp.date)}
                        </td>
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px]">
                            {getPaymentMethodLabel(exp.payment_method)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-rose-400">
                          -{formatBirr(exp.amount)}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => onDeleteExpense(exp.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title={t.expensesModal.deleteExpenseConfirm}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{filteredExpenses.length}</span> of{' '}
            <span className="font-semibold text-slate-200">{expenses.length}</span> recorded expenses
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
