import React, { useState, useEffect } from 'react';
import { useStore } from '../../lib/storeContext';
import { StorePersona, PriceTier } from '../../types';
import {
  X,
  Store,
  Sparkles,
  Save,
  Check,
} from 'lucide-react';

interface StorePersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCreatingNew?: boolean;
}

export const StorePersonaModal: React.FC<StorePersonaModalProps> = ({
  isOpen,
  onClose,
  isCreatingNew = false,
}) => {
  const { activeStore, updateStore, createStore } = useStore();

  const [name, setName] = useState(activeStore.name);
  const [category, setCategory] = useState(activeStore.category);
  const [demographic, setDemographic] = useState(activeStore.target_demographic);
  const [priceTier, setPriceTier] = useState<PriceTier>(activeStore.price_tier);
  const [brandTone, setBrandTone] = useState(activeStore.brand_tone);
  const [tolerances, setTolerances] = useState(activeStore.acceptable_variations);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isCreatingNew) {
        setName('');
        setCategory('Sustainable Fashion');
        setDemographic('Eco-conscious professionals 25-40');
        setPriceTier('mid_tier');
        setBrandTone('Artisanal, conscious, and resolution-driven');
        setTolerances('Organic cotton natural slubs and unbleached fiber flecks');
      } else {
        setName(activeStore.name);
        setCategory(activeStore.category);
        setDemographic(activeStore.target_demographic);
        setPriceTier(activeStore.price_tier);
        setBrandTone(activeStore.brand_tone);
        setTolerances(activeStore.acceptable_variations);
      }
      setIsSaved(false);
    }
  }, [isOpen, activeStore, isCreatingNew]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isCreatingNew) {
      createStore({
        name: name.trim(),
        category: category.trim(),
        target_demographic: demographic.trim(),
        price_tier: priceTier,
        brand_tone: brandTone.trim(),
        acceptable_variations: tolerances.trim(),
      });
    } else {
      updateStore({
        ...activeStore,
        name: name.trim(),
        category: category.trim(),
        target_demographic: demographic.trim(),
        price_tier: priceTier,
        brand_tone: brandTone.trim(),
        acceptable_variations: tolerances.trim(),
        updated_at: new Date().toISOString(),
      });
    }

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] border border-slate-200/90 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Store className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {isCreatingNew ? 'Create New Store Persona' : 'Calibrate Store Persona Profile'}
              </h3>
              <p className="text-xs text-slate-400">
                Customizes Gemini's noise-filtering rules and operational priorities
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Storefront Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aura Ethnic Wear"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Product Category / Niche
              </label>
              <input
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Ethnic Wear & Handloom"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Target Demographic
              </label>
              <input
                type="text"
                required
                value={demographic}
                onChange={(e) => setDemographic(e.target.value)}
                placeholder="e.g. Women 25-45, Festive Shoppers"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Price Tier
              </label>
              <select
                value={priceTier}
                onChange={(e) => setPriceTier(e.target.value as PriceTier)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
              >
                <option value="budget">Budget / Value</option>
                <option value="mid_tier">Mid-Tier Boutique</option>
                <option value="luxury">High-End Luxury</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Brand Tone (Voice for AI Replies)
            </label>
            <input
              type="text"
              required
              value={brandTone}
              onChange={(e) => setBrandTone(e.target.value)}
              placeholder="e.g. Humble, empathetic, warm, and resolution-oriented"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Acceptable Tolerances / Natural Artisanal Variations
            </label>
            <textarea
              rows={2}
              value={tolerances}
              onChange={(e) => setTolerances(e.target.value)}
              placeholder="e.g. Handloom weave slubs; natural vegetable indigo dye scent; slight block print misalignments"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs leading-relaxed"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Gemini will not flag these acceptable variations as manufacturing defects.
            </p>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-white transition-all shadow-sm ${
                isSaved ? 'bg-emerald-600' : 'bg-slate-900 hover:bg-slate-800 active:scale-95'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Persona Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isCreatingNew ? 'Create Store Profile' : 'Save Calibration'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
