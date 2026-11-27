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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="expenses-modal-title"
        className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[82dvh] sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="expenses-modal-title" className="text-sm sm:text-base font-bold text-slate-900">
                  {t.expensesModal.modalTitle}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-rose-600" />
                  {t.expensesModal.totalOverhead}: {formatBirr(totalExpenseAmount)}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {t.expensesModal.modalSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 overscroll-contain">
          {/* Quick Expense Form */}
          <form 
            onSubmit={handleSubmit}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-slate-800" />
                {t.expensesModal.logNewExpense}
              </span>
              <span className="text-[11px] text-slate-400">{t.metrics.overhead}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* Title (Span 5) */}
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  {t.expensesModal.expenseTitle} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.expensesModal.expenseTitlePlaceholder}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Category (Span 3) */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  {t.expensesModal.category} *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
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
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  {t.expensesModal.amount} ({t.common.currencyName}) *
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
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
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-rose-600 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              {/* Date */}
              <div className="sm:col-span-4 md:col-span-3">
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  {t.expensesModal.expenseDate}
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="sm:col-span-4 md:col-span-3">
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  {t.expensesModal.paymentMethod}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="Cash">{getPaymentMethodLabel('Cash')}</option>
                  <option value="Telebirr">{getPaymentMethodLabel('Telebirr')}</option>
                  <option value="Bank Transfer / CBE">{getPaymentMethodLabel('Bank Transfer / CBE')}</option>
                  <option value="Other">{getPaymentMethodLabel('Other')}</option>
                </select>
              </div>

              {/* Optional Notes */}
              <div className="sm:col-span-4 md:col-span-4">
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  {t.expensesModal.notes}
                </label>
                <input
                  type="text"
                  placeholder={t.expensesModal.notesPlaceholder}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Submit Button */}
              <div className="sm:col-span-12 md:col-span-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !title || !amount}
                  className="w-full py-2 md:py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-40 cursor-pointer text-center"
                >
                  {isSubmitting ? t.common.loading : t.expensesModal.recordExpenseButton}
                </button>
              </div>
            </div>
          </form>

          {/* Filter Bar & Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <div className="flex flex-col xs:flex-row sm:flex-row items-stretch xs:items-center sm:items-center gap-2 flex-1 max-w-md w-full">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t.expensesModal.searchExpensesPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none cursor-pointer"
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
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors disabled:opacity-40 cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.common.exportCsv}</span>
            </button>
          </div>

          {/* Expense History Table */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[550px]">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3.5">{t.expensesModal.expenseTitle}</th>
                    <th className="py-2.5 px-3">{t.expensesModal.category}</th>
                    <th className="py-2.5 px-3">{t.common.date}</th>
                    <th className="py-2.5 px-3">{t.expensesModal.paymentMethod}</th>
                    <th className="py-2.5 px-3 text-right">{t.expensesModal.amount}</th>
                    <th className="py-2.5 px-3 text-center">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        {t.expensesModal.noExpensesFound}
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3.5">
                          <div className="font-semibold text-slate-900">{exp.title}</div>
                          {exp.notes && (
                            <div className="text-[11px] text-slate-400 mt-0.5">{exp.notes}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                            {CATEGORY_ICONS[exp.category]}
                            <span>{getExpenseCategoryLabel(exp.category)}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                          {formatDate(exp.date)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                            {getPaymentMethodLabel(exp.payment_method)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-rose-600">
                          -{formatBirr(exp.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => onDeleteExpense(exp.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
        <div className="flex flex-col xs:flex-row sm:flex-row items-center justify-between gap-2 px-4 sm:px-5 py-2.5 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
          <div className="text-center xs:text-left sm:text-left">
            Showing <span className="font-semibold text-slate-800">{filteredExpenses.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{expenses.length}</span> recorded expenses
          </div>
          <button
            onClick={onClose}
            className="w-full xs:w-auto sm:w-auto px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition-colors cursor-pointer text-center"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
