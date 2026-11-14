import React, { useState } from 'react';
import { useStore } from '../../lib/storeContext';
import {
  CheckSquare,
  Check,
  Plus,
  Flame,
  AlertCircle,
  Tag,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import { PriorityLevel, ActionCategory } from '../../types';

export const ActionChecklistCard: React.FC = () => {
  const { actionItems, toggleActionCompleted, addActionItem } = useStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState<ActionCategory>('Sizing / Catalog');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('medium');
  const [newImpact, setNewImpact] = useState('Reduces return rate by ~10%');

  const filteredItems = actionItems.filter((item) => {
    if (filter === 'pending') return !item.is_completed;
    if (filter === 'completed') return item.is_completed;
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addActionItem({
      title: newTitle.trim(),
      description: newDesc.trim() || 'Custom operational task.',
      category: newCat,
      priority: newPriority,
      estimated_impact: newImpact.trim(),
      is_completed: false,
      completed_at: null,
    });
    setNewTitle('');
    setNewDesc('');
    setIsAdding(false);
  };

  const getPriorityBadge = (p: PriorityLevel) => {
    switch (p) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
            <Flame className="w-3 h-3 text-rose-600" /> Critical
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Low
          </span>
        );
    }
  };

  return (
    <div className="p-6 rounded-[28px] bg-white border border-slate-200/80 shadow-soft space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              <span>Prioritized Operational Action Checklist</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              AI Synthesized
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Weekly operational tasks automatically generated from high-frequency review flaws
          </p>
        </div>

        {/* Filter controls & Add button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({actionItems.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filter === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pending ({actionItems.filter((a) => !a.is_completed).length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filter === 'completed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Done ({actionItems.filter((a) => a.is_completed).length})
            </button>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="p-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all"
            title="Add Custom Action Task"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Manual Task Creator Drawer */}
      {isAdding && (
        <form
          onSubmit={handleAddSubmit}
          className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Add Operational Checklist Item
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>
          <input
            type="text"
            required
            placeholder="e.g. Update Kurti Sizing Chart: Increase XXL bust margin by 1.5 inches"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            placeholder="Detailed notes or specific instructions for suppliers/catalog team..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Department</label>
              <select
                value={newCat}
                onChange={(e) => setNewCat(e.target.value as ActionCategory)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
              >
                <option value="Sizing / Catalog">Sizing / Catalog</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Packaging">Packaging</option>
                <option value="Photography">Photography</option>
                <option value="Customer Support">Customer Support</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
              >
                <option value="critical">Critical</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Estimated Impact</label>
              <input
                type="text"
                value={newImpact}
                onChange={(e) => setNewImpact(e.target.value)}
                placeholder="e.g. Reduces returns by 18%"
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Save Action Task
          </button>
        </form>
      )}

      {/* Task Rows */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No action items matching this filter.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 group ${
                item.is_completed
                  ? 'bg-slate-50/70 border-slate-200/50 opacity-70'
                  : 'bg-white hover:bg-slate-50/50 border-slate-200/90 shadow-sm'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleActionCompleted(item.id)}
                className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                  item.is_completed
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : 'border-slate-300 hover:border-indigo-600 bg-white'
                }`}
                title={item.is_completed ? 'Mark pending' : 'Mark completed'}
              >
                {item.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>

              {/* Task Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {getPriorityBadge(item.priority)}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                    {item.category}
                  </span>
                  {item.estimated_impact && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <TrendingDown className="w-3 h-3" />
                      {item.estimated_impact}
                    </span>
                  )}
                </div>

                <h4
                  className={`text-xs font-bold leading-snug transition-all ${
                    item.is_completed ? 'line-through text-slate-400' : 'text-slate-900'
                  }`}
                >
                  {item.title}
                </h4>

                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
