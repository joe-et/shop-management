import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Language, SUPPORTED_LANGUAGES, TranslationDictionary } from '../i18n/types';
import { enTranslations } from '../i18n/translations/en';
import { amTranslations } from '../i18n/translations/am';
import { omTranslations } from '../i18n/translations/om';

const LANGUAGE_STORAGE_KEY = 'shopflow_language';

const translationsMap: Record<Language, TranslationDictionary> = {
  en: enTranslations,
  am: amTranslations,
  om: omTranslations,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationDictionary;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  getCategoryLabel: (category: string) => string;
  getStatusLabel: (status: string) => string;
  getConditionLabel: (condition: string) => string;
  getUnitDisplay: (unit?: string | null) => { singular: string; plural: string; label: string };
  formatQtyWithUnit: (quantity: number | null | undefined, unit?: string | null) => string;
  getExpenseCategoryLabel: (category: string) => string;
  getPaymentMethodLabel: (method: string) => string;
  getAuditActionLabel: (action: string) => string;
  getTimeframeLabel: (timeframe: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
      if (stored && (stored === 'en' || stored === 'am' || stored === 'om')) {
        return stored;
      }
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = useMemo(() => translationsMap[language] || enTranslations, [language]);

  // Helper label getters
  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'Household Goods':
        return t.categories.householdGoods;
      case 'Housewares':
        return t.categories.housewares;
      case 'Domestic Equipment':
        return t.categories.domesticEquipment;
      default:
        return category;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'in_stock':
        return t.statuses.in_stock;
      case 'sold':
        return t.statuses.sold;
      case 'reserved':
        return t.statuses.reserved;
      case 'damaged':
        return t.statuses.damaged;
      case 'returned':
        return t.statuses.returned;
      default:
        return status;
    }
  };

  const getConditionLabel = (condition: string): string => {
    switch (condition) {
      case 'new':
        return t.conditions.new;
      case 'open_box':
        return t.conditions.open_box;
      case 'refurbished':
        return t.conditions.refurbished;
      case 'used_like_new':
        return t.conditions.used_like_new;
      case 'used_good':
        return t.conditions.used_good;
      case 'used_fair':
        return t.conditions.used_fair;
      case 'for_parts':
        return t.conditions.for_parts;
      default:
        return condition;
    }
  };

  const getUnitDisplay = (unit?: string | null): { singular: string; plural: string; label: string } => {
    const raw = (unit || 'pcs').trim().toLowerCase();
    switch (raw) {
      case 'set':
      case 'sets':
        return t.units.set;
      case 'box':
      case 'boxes':
        return t.units.box;
      case 'pack':
      case 'packs':
        return t.units.pack;
      case 'pair':
      case 'pairs':
        return t.units.pair;
      case 'ctn':
      case 'carton':
      case 'cartons':
        return t.units.ctn;
      case 'dz':
      case 'dozen':
      case 'dozens':
        return t.units.dz;
      case 'roll':
      case 'rolls':
        return t.units.roll;
      case 'kg':
        return t.units.kg;
      case 'm':
        return t.units.m;
      case 'pcs':
      case 'pc':
      case 'piece':
      case 'pieces':
      default:
        return t.units.pcs;
    }
  };

  const formatQtyWithUnit = (quantity: number | null | undefined, unit?: string | null): string => {
    const qty = Number(quantity) || 0;
    const u = getUnitDisplay(unit);
    const unitText = qty === 1 ? u.singular : u.plural;
    return `${qty} ${unitText}`;
  };

  const getExpenseCategoryLabel = (category: string): string => {
    switch (category) {
      case 'rent':
        return t.expenseCategories.rent;
      case 'utilities':
        return t.expenseCategories.utilities;
      case 'transport':
        return t.expenseCategories.transport;
      case 'wages':
        return t.expenseCategories.wages;
      case 'supplies':
        return t.expenseCategories.supplies;
      case 'maintenance':
        return t.expenseCategories.maintenance;
      case 'other':
      default:
        return t.expenseCategories.other;
    }
  };

  const getPaymentMethodLabel = (method: string): string => {
    switch (method) {
      case 'cash':
        return t.paymentMethods.cash;
      case 'telebirr':
        return t.paymentMethods.telebirr;
      case 'cbe_birr':
        return t.paymentMethods.cbe_birr;
      case 'bank_transfer':
      default:
        return t.paymentMethods.bank_transfer;
    }
  };

  const getAuditActionLabel = (action: string): string => {
    switch (action) {
      case 'item_created':
        return t.auditActions.item_created;
      case 'item_updated':
        return t.auditActions.item_updated;
      case 'price_changed':
        return t.auditActions.price_changed;
      case 'item_sold':
        return t.auditActions.item_sold;
      case 'partial_sale':
        return t.auditActions.partial_sale;
      case 'reverted_to_stock':
        return t.auditActions.reverted_to_stock;
      case 'item_deleted':
        return t.auditActions.item_deleted;
      case 'stocktake_adjustment':
        return t.auditActions.stocktake_adjustment;
      case 'expense_created':
        return t.auditActions.expense_created;
      default:
        return action;
    }
  };

  const getTimeframeLabel = (timeframe: string): string => {
    switch (timeframe) {
      case 'today':
        return t.metrics.timeframeToday;
      case 'this_week':
        return t.metrics.timeframeThisWeek;
      case 'this_month':
        return t.metrics.timeframeThisMonth;
      case 'all_time':
      default:
        return t.metrics.timeframeAllTime;
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
        getCategoryLabel,
        getStatusLabel,
        getConditionLabel,
        getUnitDisplay,
        formatQtyWithUnit,
        getExpenseCategoryLabel,
        getPaymentMethodLabel,
        getAuditActionLabel,
        getTimeframeLabel,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
