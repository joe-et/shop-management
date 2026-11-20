import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  Key, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  Trash2,
  Copy,
  Check,
  ShieldAlert
} from 'lucide-react';
import { 
  getSupabaseUrl, 
  getSupabaseAnonKey, 
  saveSupabaseConfig, 
  clearSupabaseConfig,
  isSupabaseConfigured 
} from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { useTranslation } from '../context/LanguageContext';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrl(getSupabaseUrl() || '');
      setAnonKey(getSupabaseAnonKey() || '');
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setTestResult({
        success: false,
        message: 'Please provide both Supabase URL and Anon Key.',
      });
      return;
    }

    try {
      setIsTesting(true);
      setTestResult(null);

      const client = createClient(cleanUrl, cleanKey);
      const { error } = await client
        .from('equipment_items')
        .select('id')
        .limit(1);

      if (error) {
        // Check if error is due to missing table or bad auth
        if (error.code === '42P01') {
          setTestResult({
            success: false,
            message: 'Connected to Supabase, but the "equipment_items" table was not found. Please execute the script in `supabase/schema.sql`.',
          });
        } else {
          setTestResult({
            success: false,
            message: `Connection failed: ${error.message} (Code: ${error.code})`,
          });
        }
      } else {
        setTestResult({
          success: true,
          message: 'Connection successful! Verified access to "equipment_items" table.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error testing Supabase';
      setTestResult({
        success: false,
        message: msg,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setTestResult({
        success: false,
        message: 'Both URL and Key are required to save configuration.',
      });
      return;
    }

    saveSupabaseConfig(cleanUrl, cleanKey);
    onConfigSaved();
    onClose();
  };

  const handleClear = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setTestResult({
      success: true,
      message: 'Supabase credentials cleared. Switched back to local demo storage.',
    });
    onConfigSaved();
  };

  const copySchemaHint = () => {
    setCopiedSql(true);
    navigator.clipboard.writeText(
      'Open your Supabase Project -> SQL Editor -> New Query -> Paste contents of supabase/schema.sql -> Run'
    );
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const currentlyConfigured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Database className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">{t.dbModal.title}</h3>
              <p className="text-xs text-slate-500">{t.dbModal.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
              currentlyConfigured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            {currentlyConfigured ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-0.5">
              <p className="font-semibold text-xs sm:text-sm">
                {currentlyConfigured ? t.dbModal.cloudConnected : t.dbModal.localDemoMode}
              </p>
              <p className="text-slate-600 text-[11px]">
                {currentlyConfigured
                  ? 'Your application communicates live with Supabase cloud. Changes sync in real-time across tabs.'
                  : 'Currently operating with in-memory & local browser storage with realistic demo items. Connect Supabase below to persist across devices.'}
              </p>
            </div>
          </div>

          {/* Quick Setup Instructions */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">How to connect:</span>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-slate-900 hover:underline flex items-center gap-1 text-[11px] font-medium"
              >
                <span>Supabase Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ol className="list-decimal list-inside space-y-0.5 text-slate-500 text-[11px]">
              <li>Create a new project on Supabase.</li>
              <li>
                Run the included schema file{' '}
                <code className="text-slate-900 font-mono bg-white border border-slate-200 px-1 py-0.2 rounded">
                  supabase/schema.sql
                </code>{' '}
                in the SQL Editor.
              </li>
              <li>Go to Project Settings &gt; API, and copy Project URL and Anon Public Key.</li>
            </ol>
            <button
              type="button"
              onClick={copySchemaHint}
              className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              {copiedSql ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSql ? 'Copied instructions' : 'Copy schema setup instructions'}</span>
            </button>
          </div>

          {/* Credentials Inputs */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.dbModal.projectUrl}
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.dbModal.anonKey}
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Test Feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Buttons Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-200">
            <div>
              {currentlyConfigured && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.dbModal.switchToLocal}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-slate-900' : 'text-slate-500'}`} />
                <span>{isTesting ? t.common.loading : 'Test Connection'}</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-xs transition-colors cursor-pointer"
              >
                {t.dbModal.connectCloud}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
