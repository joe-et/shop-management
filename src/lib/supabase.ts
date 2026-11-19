import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'shopflow_supabase_url';
const STORAGE_KEY_ANON = 'shopflow_supabase_anon_key';

/**
 * Retrieves the Supabase URL from environment or localStorage
 */
export function getSupabaseUrl(): string {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(STORAGE_KEY_URL);
    if (local && local.trim().length > 0) return local.trim();
  }
  return (import.meta.env.VITE_SUPABASE_URL || '').trim();
}

/**
 * Retrieves the Supabase Anon Key from environment or localStorage
 */
export function getSupabaseAnonKey(): string {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(STORAGE_KEY_ANON);
    if (local && local.trim().length > 0) return local.trim();
  }
  return (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
}

/**
 * Determines whether Supabase has valid credentials configured
 */
export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(
    url && 
    key && 
    url.startsWith('http') && 
    !url.includes('your-project-id') &&
    key.length > 10
  );
}

/**
 * Save custom Supabase credentials to localStorage
 */
export function saveSupabaseConfig(url: string, key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_ANON, key.trim());
  }
}

/**
 * Clear custom Supabase credentials from localStorage
 */
export function clearSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
  }
}

let clientInstance: SupabaseClient | null = null;

/**
 * Returns the Supabase client instance or creates one if configured
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return clientInstance;
}

/**
 * Default Supabase client instance export (fallback dummy client if not configured yet)
 */
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder-key';

export const supabase: SupabaseClient = isSupabaseConfigured()
  ? getSupabase()!
  : createClient(getSupabaseUrl() || fallbackUrl, getSupabaseAnonKey() || fallbackKey);
