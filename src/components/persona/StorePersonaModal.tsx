import React, { useState } from 'react';
import { useStore } from '../../lib/storeContext';
import { StorePlatform, BrandTone } from '../../types';
import { X, Store as StoreIcon, Sparkles } from 'lucide-react';

interface StorePersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorePersonaModal: React.FC<StorePersonaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createStore } = useStore();

  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<StorePlatform>('Shopify');
  const [category, setCategory] = useState('');
  const [targetDemographic, setTargetDemographic] = useState('');
  const [brandTone, setBrandTone] = useState<BrandTone>('Warm Boutique');
  const [focusTagString, setFocusTagString] = useState('handloom, pure linen, breathable, drape');
  const [ignoreTagString, setIgnoreTagString] = useState('courier delayed, delivery boy, parcel thrown');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category.trim()) return;

    setIsCreating(true);
    try {
      const focus_keywords = focusTagString
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const ignore_keywords = ignoreTagString
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await createStore({
        name: name.trim(),
        platform,
        category: category.trim(),
        target_demographic: targetDemographic.trim() || 'Discerning online shoppers',
        brand_tone: brandTone,
        focus_keywords,
        ignore_keywords,
      });

      setName('');
      setCategory('');
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] border border-[#18181B14] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[12px] bg-[#18181B] text-white flex items-center justify-center">
              <StoreIcon className="w-4 h-4 text-[#3B5BDB]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 font-plus-jakarta">
                Add New Store Persona
              </h3>
              <p className="text-[10px] text-zinc-400">
                Setup custom noise filtering and brand tone for this storefront
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-800 mb-1">Store Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Aura Linen Atelier"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none focus:border-zinc-400 font-sans"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-800 mb-1">Platform</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-800 mb-1">Product Category *</label>
              <input
                type="text"
                required
                placeholder="e.g. Handloom Apparel"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none focus:border-zinc-400 font-sans"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-800 mb-1">Brand Voice</label>
              <select
                value={brandTone}
                onChange={(e) => setBrandTone(e.target.value as BrandTone)}
                className="w-full p-2.5 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none font-sans"
              >
                <option value="Warm Boutique">Warm Boutique</option>
                <option value="Crisp Professional">Crisp Professional</option>
                <option value="Friendly Casual">Friendly Casual</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-800 mb-1">Target Demographic</label>
            <input
              type="text"
              placeholder="e.g. Discerning women 28-45 looking for comfortable summer pieces"
              value={targetDemographic}
              onChange={(e) => setTargetDemographic(e.target.value)}
              className="w-full p-2.5 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none focus:border-zinc-400 font-sans"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-800 mb-1">
              Focus Craftsmanship Keywords (comma separated)
            </label>
            <input
              type="text"
              value={focusTagString}
              onChange={(e) => setFocusTagString(e.target.value)}
              className="w-full p-2.5 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none font-sans"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-800 mb-1">
              Noise Ignore Keywords (comma separated)
            </label>
            <input
              type="text"
              value={ignoreTagString}
              onChange={(e) => setIgnoreTagString(e.target.value)}
              className="w-full p-2.5 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none font-sans"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[12px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 rounded-[12px] bg-[#18181B] hover:bg-black text-white font-semibold transition-colors disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create & Switch Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
