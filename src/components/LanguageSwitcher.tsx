import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { Language } from '../i18n/types';

interface LanguageSwitcherProps {
  compact?: boolean;
  align?: 'left' | 'right';
  direction?: 'up' | 'down';
  side?: 'right';
  collapseInRail?: boolean;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  compact = false,
  align = 'left',
  direction = 'up',
  side,
  collapseInRail = false,
  className = '',
}) => {
  const { language, setLanguage, supportedLanguages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${collapseInRail ? 'w-full' : ''}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={
          collapseInRail
            ? `w-full flex items-center gap-3 px-2.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 transition-all text-xs font-medium shadow-xs cursor-pointer select-none overflow-hidden min-w-0 ${className}`
            : `flex items-center gap-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 transition-all text-xs font-medium shadow-xs cursor-pointer select-none ${
                compact ? 'p-1.5 justify-center' : 'px-2.5 py-1.5'
              } ${className}`
        }
        title="Switch Language / ቋንቋ ይቀይሩ / Afaan Jijjiiraa"
        aria-expanded={isOpen}
      >
        <span
          className={
            collapseInRail
              ? 'text-sm leading-none shrink-0 flex items-center justify-center w-5'
              : 'text-sm leading-none'
          }
        >
          {currentLang.flag}
        </span>
        {collapseInRail ? (
          <span className="font-semibold tracking-wide text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap truncate min-w-0">
            {currentLang.nativeName}
          </span>
        ) : (
          !compact && (
            <span className="font-semibold tracking-wide text-slate-800">
              {currentLang.nativeName}
            </span>
          )
        )}
        <ChevronDown
          className={`w-3 h-3 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } ${
            collapseInRail
              ? `ml-auto ${isOpen ? 'block' : 'hidden group-hover:block'} opacity-0 group-hover:opacity-100 transition-opacity duration-200`
              : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className={`absolute ${
          side === 'right'
            ? 'left-full bottom-0 ml-2 mb-0'
            : align === 'right'
            ? 'right-0'
            : 'left-0'
        } ${
          side === 'right'
            ? ''
            : direction === 'down'
            ? 'top-full mt-1.5'
            : 'bottom-full mb-1.5'
        } w-44 rounded-xl bg-white border border-slate-200 shadow-xl z-50 p-1 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150`}>
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-0.5 flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-slate-500" />
            <span>Language / ቋንቋ</span>
          </div>
          {supportedLanguages.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                  isSelected
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{lang.flag}</span>
                  <div>
                    <span className="block">{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{lang.name}</span>
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-slate-900 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
