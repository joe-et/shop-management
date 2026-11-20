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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{t.dbModal.title}</h3>
              <p className="text-xs text-slate-400">{t.dbModal.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              currentlyConfigured
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
            }`}
          >
            {currentlyConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <p className="font-semibold text-sm">
                {currentlyConfigured ? t.dbModal.cloudConnected : t.dbModal.localDemoMode}
              </p>
              <p className="text-slate-300">
                {currentlyConfigured
                  ? 'Your application communicates live with Supabase cloud. Changes sync in real-time across tabs.'
                  : 'Currently operating with in-memory & local browser storage with realistic demo items. Connect Supabase below to persist across devices.'}
              </p>
            </div>
          </div>

          {/* Quick Setup Instructions */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">How to connect:</span>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>Supabase Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Create a new project on Supabase.</li>
              <li>
                Run the included schema file{' '}
                <code className="text-emerald-400 font-mono bg-slate-900 px-1 py-0.5 rounded">
                  supabase/schema.sql
                </code>{' '}
                in the SQL Editor.
              </li>
              <li>Go to Project Settings &gt; API, and copy Project URL and Anon Public Key.</li>
            </ol>
            <button
              type="button"
              onClick={copySchemaHint}
              className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied instructions' : 'Copy schema setup instructions'}</span>
            </button>
          </div>

          {/* Credentials Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.dbModal.projectUrl}
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.dbModal.anonKey}
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Test Feedback */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Buttons Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div>
              {currentlyConfigured && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/30 border border-rose-900/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.dbModal.switchToLocal}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-emerald-400' : ''}`} />
                <span>{isTesting ? t.common.loading : 'Test Connection'}</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
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
