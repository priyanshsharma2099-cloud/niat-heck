import React, { useState } from 'react';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { getActiveGeminiKey } from '../../lib/geminiService';
import {
  X,
  SlidersHorizontal,
  Database,
  Sparkles,
  Key,
  Check,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({ isOpen, onClose }) => {
  const hasSupabase = isSupabaseConfigured();
  const currentKey = getActiveGeminiKey();
  const [apiKeyInput, setApiKeyInput] = useState(currentKey);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleSaveGeminiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeyInput.trim()) {
      localStorage.setItem('cluey_gemini_api_key', apiKeyInput.trim());
    } else {
      localStorage.removeItem('cluey_gemini_api_key');
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const copySqlNotice = () => {
    navigator.clipboard.writeText('supabase/schema.sql');
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[22px] border border-slate-200/90 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Backend Services &amp; AI Status
              </h3>
              <p className="text-[11px] text-slate-400">
                Supabase Database, Auth &amp; Google Gemini API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Supabase Status Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Supabase PostgreSQL & Auth</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  hasSupabase
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {hasSupabase ? 'Active Connected' : 'Local/Demo State'}
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              {hasSupabase
                ? 'Connected to live Supabase project. Queries use Row Level Security (RLS).'
                : 'Running with high-fidelity local state persistence. To connect your live Supabase database, copy schema from supabase/schema.sql and set VITE_SUPABASE_URL in .env.'}
            </p>
            <button
              onClick={copySqlNotice}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-1"
            >
              {copiedSql ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSql ? 'Schema path copied!' : 'SQL Schema: supabase/schema.sql'}</span>
            </button>
          </div>

          {/* Gemini API Key Form */}
          <form onSubmit={handleSaveGeminiKey} className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Google Gemini API Key</span>
              </label>
              <span className="text-[10px] text-slate-400">
                gemini-1.5-flash
              </span>
            </div>

            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              When set, live analysis and customer reply drafting use Gemini 1.5 Flash. If left blank, CLUEY CART automatically runs on its built-in persona intelligence engine.
            </p>

            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-white transition-all shadow-sm ${
                savedSuccess ? 'bg-emerald-600' : 'bg-slate-900 hover:bg-slate-800 active:scale-95'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Key Saved for Session!</span>
                </>
              ) : (
                <span>Save Key Settings</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
