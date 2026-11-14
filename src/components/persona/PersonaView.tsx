import React, { useState, useEffect } from 'react';
import { useStore } from '../../lib/storeContext';
import { StorePlatform, BrandTone } from '../../types';
import {
  Sliders,
  Save,
  Plus,
  X,
  Check,
  ShieldCheck,
  Target,
  Sparkles,
} from 'lucide-react';

export const PersonaView: React.FC = () => {
  const { activeStore, updateStore } = useStore();

  const [name, setName] = useState(activeStore.name);
  const [platform, setPlatform] = useState<StorePlatform>(activeStore.platform);
  const [category, setCategory] = useState(activeStore.category);
  const [targetDemographic, setTargetDemographic] = useState(activeStore.target_demographic);
  const [brandTone, setBrandTone] = useState<BrandTone>(activeStore.brand_tone);
  const [focusKeywords, setFocusKeywords] = useState<string[]>(activeStore.focus_keywords || []);
  const [ignoreKeywords, setIgnoreKeywords] = useState<string[]>(activeStore.ignore_keywords || []);

  const [newFocusTag, setNewFocusTag] = useState('');
  const [newIgnoreTag, setNewIgnoreTag] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(activeStore.name);
    setPlatform(activeStore.platform);
    setCategory(activeStore.category);
    setTargetDemographic(activeStore.target_demographic);
    setBrandTone(activeStore.brand_tone);
    setFocusKeywords(activeStore.focus_keywords || []);
    setIgnoreKeywords(activeStore.ignore_keywords || []);
  }, [activeStore]);

  const handleAddFocusTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    if (!newFocusTag.trim()) return;
    if (!focusKeywords.includes(newFocusTag.trim())) {
      setFocusKeywords([...focusKeywords, newFocusTag.trim()]);
    }
    setNewFocusTag('');
  };

  const handleRemoveFocusTag = (tag: string) => {
    setFocusKeywords(focusKeywords.filter((t) => t !== tag));
  };

  const handleAddIgnoreTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    if (!newIgnoreTag.trim()) return;
    if (!ignoreKeywords.includes(newIgnoreTag.trim())) {
      setIgnoreKeywords([...ignoreKeywords, newIgnoreTag.trim()]);
    }
    setNewIgnoreTag('');
  };

  const handleRemoveIgnoreTag = (tag: string) => {
    setIgnoreKeywords(ignoreKeywords.filter((t) => t !== tag));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateStore({
        name,
        platform,
        category,
        target_demographic: targetDemographic,
        brand_tone: brandTone,
        focus_keywords: focusKeywords,
        ignore_keywords: ignoreKeywords,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="bg-white rounded-[24px] p-6 border border-[#18181B12] shadow-2xs">
        <h2 className="font-plus-jakarta font-bold text-base text-zinc-900">
          Store Persona & Noise-Ignore Rules
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Configure how Gemini AI evaluates sentiment, filters courier logistics complaints, and
          drafts responses tailored to your brand voice.
        </p>

        <form onSubmit={handleSave} className="mt-6 space-y-6 text-xs">
          {/* Basic Store Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-zinc-800 mb-1">Store Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none focus:border-zinc-400 font-sans"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-800 mb-1">E-Commerce Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as StorePlatform)}
                className="w-full p-2.5 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none font-sans"
              >
                <option value="Shopify">Shopify</option>
                <option value="Meesho">Meesho</option>
                <option value="Amazon">Amazon</option>
                <option value="Custom">Custom Marketplace</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-zinc-800 mb-1">Niche Category *</label>
              <input
                type="text"
                required
                placeholder="e.g. Handloom & Linen Apparel"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none focus:border-zinc-400 font-sans"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-800 mb-1">Brand Voice Tone</label>
              <select
                value={brandTone}
                onChange={(e) => setBrandTone(e.target.value as BrandTone)}
                className="w-full p-2.5 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none font-sans"
              >
                <option value="Warm Boutique">Warm Boutique (Empathetic, artisanal)</option>
                <option value="Crisp Professional">Crisp Professional (Clean, resolution-first)</option>
                <option value="Friendly Casual">Friendly Casual (Upbeat, approachable)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-800 mb-1">Target Customer Demographic</label>
            <input
              type="text"
              placeholder="e.g. Discerning buyers 28-45 looking for breathable natural luxury"
              value={targetDemographic}
              onChange={(e) => setTargetDemographic(e.target.value)}
              className="w-full p-2.5 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none focus:border-zinc-400 font-sans"
            />
          </div>

          {/* Focus Keywords Tag Input */}
          <div className="pt-4 border-t border-zinc-100">
            <label className="block font-semibold text-zinc-800 mb-1">
              Focus Craftsmanship Keywords (High Niche Signal)
            </label>
            <p className="text-[11px] text-zinc-400 mb-2">
              Reviews mentioning these attributes receive elevated relevance scores in Gemini's
              evaluations.
            </p>
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-[14px] bg-[#F8F8F5] border border-zinc-200">
              {focusKeywords.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-[11px] font-medium bg-white text-zinc-800 px-2.5 py-1 rounded-full border border-zinc-200 shadow-2xs"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFocusTag(tag)}
                    className="text-zinc-400 hover:text-zinc-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Add keyword + Enter..."
                  value={newFocusTag}
                  onChange={(e) => setNewFocusTag(e.target.value)}
                  onKeyDown={handleAddFocusTag}
                  className="bg-transparent text-xs p-1 focus:outline-none text-zinc-800 font-sans"
                />
                <button
                  type="button"
                  onClick={handleAddFocusTag}
                  className="p-1 text-zinc-400 hover:text-zinc-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Ignore Noise Keywords Tag Input */}
          <div className="pt-4 border-t border-zinc-100">
            <label className="block font-semibold text-zinc-800 mb-1">
              Noise-Ignore Rules (Third-Party & Logistics Filter)
            </label>
            <p className="text-[11px] text-zinc-400 mb-2">
              Complaints containing these terms without product defects are automatically classified
              as noise.
            </p>
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-[14px] bg-[#F8F8F5] border border-zinc-200">
              {ignoreKeywords.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-[11px] font-medium bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full border border-rose-200 shadow-2xs"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIgnoreTag(tag)}
                    className="text-rose-400 hover:text-rose-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Add noise phrase + Enter..."
                  value={newIgnoreTag}
                  onChange={(e) => setNewIgnoreTag(e.target.value)}
                  onKeyDown={handleAddIgnoreTag}
                  className="bg-transparent text-xs p-1 focus:outline-none text-zinc-800 font-sans"
                />
                <button
                  type="button"
                  onClick={handleAddIgnoreTag}
                  className="p-1 text-zinc-400 hover:text-zinc-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
            {savedSuccess ? (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Persona settings saved successfully!
              </span>
            ) : (
              <span />
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-[14px] bg-[#18181B] hover:bg-black text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-zinc-300" />
              <span>{isSaving ? 'Saving...' : 'Save Persona Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
