export interface SystemSettings {
  shopName: string;
  managerName: string;
  phone: string;
  currency: string;
  themeMode: 'light' | 'dark';
  managerPin: string;
}

const SETTINGS_STORAGE_KEY = 'shopflow_system_settings';

export const DEFAULT_SETTINGS: SystemSettings = {
  shopName: 'ShopFlow Retail',
  managerName: 'Shop Manager',
  phone: '+251 91 123 4567',
  currency: 'ETB (Br)',
  themeMode: 'light',
  managerPin: '1234',
};

export function getSystemSettings(): SystemSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSystemSettings(settings: Partial<SystemSettings>): SystemSettings {
  const current = getSystemSettings();
  const updated = { ...current, ...settings };
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    applyTheme(updated.themeMode);
  }
  return updated;
}

export function applyTheme(mode: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
