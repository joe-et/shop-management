import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Store, 
  Phone, 
  Sun, 
  Moon, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  Coins,
  Cloud,
  Database,
  Globe,
  Check
} from 'lucide-react';
import { 
  getSystemSettings, 
  saveSystemSettings, 
  applyTheme,
  SystemSettings 
} from '../services/settingsService';
import { isSupabaseConfigured } from '../lib/supabase';
import { useTranslation } from '../context/LanguageContext';
import { Language } from '../i18n/types';

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: (newSettings: SystemSettings) => void;
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved,
}) => {
  const { t, language, setLanguage, supportedLanguages } = useTranslation();
  
  // Form fields
  const [shopName, setShopName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [phone, setPhone] = useState('');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  
  // Optional PIN update fields
  const [newPin, setNewPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Status feedback
  const [feedback, setFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getSystemSettings();
      setShopName(current.shopName || '');
      setManagerName(current.managerName || '');
      setPhone(current.phone || '');
      setThemeMode(current.themeMode || 'light');
      setNewPin('');
      setShowPin(false);
      setFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isCloudActive = isSupabaseConfigured();

  const handleThemeChange = (mode: 'light' | 'dark') => {
    setThemeMode(mode);
    applyTheme(mode);
  };

  const handleSave = () => {
    setFeedback(null);
    const existing = getSystemSettings();

    const updated = saveSystemSettings({
      shopName: shopName.trim() || existing.shopName,
      managerName: managerName.trim() || existing.managerName,
      phone: phone.trim() || existing.phone,
      currency: 'ETB (Br)',
      themeMode: themeMode,
      managerPin: newPin.trim() ? newPin.trim() : existing.managerPin,
    });

    setFeedback({
      success: true,
      message: t.settingsModal.saveSuccess,
    });

    if (onSettingsSaved) {
      onSettingsSaved(updated);
    }

    setTimeout(() => {
      onClose();
    }, 700);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Settings className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {t.settingsModal.title}
              </h3>
              <p className="text-xs text-slate-500">
                {t.settingsModal.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            title={t.settingsModal.closeButton}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content - Single Page */}
        <div className="p-5 overflow-y-auto space-y-4">

          {/* Section 1: Cloud Sync Status (Safe, No raw keys, No URLs) */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
            isCloudActive 
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isCloudActive ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
              }`}>
                {isCloudActive ? (
                  <Cloud className="w-5 h-5 stroke-[2.2]" />
                ) : (
                  <Database className="w-5 h-5 stroke-[2.2]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold">
                    {isCloudActive ? t.dbModal.cloudConnected : t.dbModal.localDemoMode}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isCloudActive 
                      ? 'bg-emerald-200 text-emerald-800' 
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isCloudActive ? 'bg-emerald-600 animate-pulse' : 'bg-slate-500'}`} />
                    {isCloudActive ? 'Active' : 'Offline'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isCloudActive ? t.settingsModal.cloudConnectedDesc : t.settingsModal.cloudLocalDesc}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Shop Details & Currency */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3.5">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Store className="w-3.5 h-3.5 text-slate-500" />
              {t.settingsModal.tabProfile}
            </h4>

            {/* Shop Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.settingsModal.shopName}
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder={t.settingsModal.shopNamePlaceholder}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors"
                />
              </div>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.settingsModal.phoneNumber}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.settingsModal.phoneNumberPlaceholder}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors"
                />
              </div>
            </div>

            {/* Currency (Fixed Ethiopian Birr) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.settingsModal.currency}
              </label>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {t.settingsModal.currencyValue}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {t.settingsModal.currencyHint}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                  Default
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Display & Language */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3.5">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              {t.settingsModal.appearanceMode} &amp; {t.settingsModal.language}
            </h4>

            {/* Language Switcher */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.settingsModal.language}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {supportedLanguages.map((lang) => {
                  const isActive = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setLanguage(lang.code as Language)}
                      className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isActive
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-sm leading-none">{lang.flag}</span>
                      <span className="truncate">{lang.nativeName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.settingsModal.appearanceMode}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {/* Light */}
                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-all cursor-pointer ${
                    themeMode === 'light'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Sun className="w-4 h-4 shrink-0" />
                  <div className="text-left">
                    <span className="text-xs font-bold block">{t.settingsModal.lightMode}</span>
                  </div>
                </button>

                {/* Dark */}
                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-all cursor-pointer ${
                    themeMode === 'dark'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Moon className="w-4 h-4 shrink-0" />
                  <div className="text-left">
                    <span className="text-xs font-bold block">{t.settingsModal.darkMode}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Security (Manager PIN - Simple & Optional) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              {t.settingsModal.securityTitle}
            </h4>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPin ? 'text' : 'password'}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder={t.settingsModal.newPassword}
                className="w-full pl-8 pr-8 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              {t.settingsModal.passwordHint}
            </p>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
                feedback.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {feedback.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {t.settingsModal.closeButton}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{t.settingsModal.saveButton}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
