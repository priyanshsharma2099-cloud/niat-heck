import React, { useState, useMemo } from 'react';
import { useStore } from '../../lib/storeContext';
import { ActionTask, TaskPriority } from '../../types';
import {
  CheckSquare,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Quote,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const ActionPlanView: React.FC = () => {
  const {
    activeStore,
    tasks,
    toggleTask,
    createTask,
    deleteTask,
  } = useStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'high' | 'completed'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('high');
  const [newCategory, setNewCategory] = useState('Pattern / Sizing');
  const [newImpact, setNewImpact] = useState('');

  const storeTasks = useMemo(() => {
    return tasks.filter((t) => t.store_id === activeStore.id);
  }, [tasks, activeStore.id]);

  const totalTasks = storeTasks.length;
  const completedTasks = storeTasks.filter((t) => t.completed).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const filteredTasks = useMemo(() => {
    return storeTasks.filter((t) => {
      if (activeFilter === 'open') return !t.completed;
      if (activeFilter === 'completed') return t.completed;
      if (activeFilter === 'high') return t.priority === 'high';
      return true;
    });
  }, [storeTasks, activeFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await createTask({
      title: newTitle.trim(),
      description: newDesc.trim(),
      priority: newPriority,
      category: newCategory.trim() || 'Store Operations',
      impact_estimate: newImpact.trim() || 'Enhances customer satisfaction',
    });

    setNewTitle('');
    setNewDesc('');
    setNewImpact('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Progress Strip */}
      <div className="bg-white rounded-[24px] p-6 border border-[#18181B12] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-plus-jakarta font-bold text-base text-zinc-900">
              Weekly Action Checklist
            </h2>
            <p className="text-xs text-zinc-400">
              Prioritized merchant fixes synthesized by Gemini from customer feedback patterns
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#18181B] hover:bg-black text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-300" />
            <span>Add Custom Task</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-zinc-600">
              Completion Progress ({completedTasks} of {totalTasks} resolved)
            </span>
            <span className="font-mono font-bold text-zinc-900">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#F8F8F5] overflow-hidden">
            <div
              className="h-full bg-[#15803D] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100">
          {[
            { id: 'all', label: 'All Tasks', count: totalTasks },
            { id: 'open', label: 'Open', count: totalTasks - completedTasks },
            { id: 'high', label: 'High Priority', count: storeTasks.filter((t) => t.priority === 'high').length },
            { id: 'completed', label: 'Completed', count: completedTasks },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeFilter === tab.id
                  ? 'bg-[#18181B] text-white shadow-xs'
                  : 'bg-[#F8F8F5] text-zinc-600 hover:bg-zinc-200/60'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1 rounded-full ${
                  activeFilter === tab.id ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Add Custom Task Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-[24px] p-6 border border-[#3B5BDB] shadow-sm space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-900">Create New Action Task</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-zinc-400 hover:text-zinc-700"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-zinc-700 mb-1">Task Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Recalibrate armhole sleeve ease on Size M patterns"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full p-2.5 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none focus:border-zinc-400 font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                  className="w-full p-2.5 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none font-sans"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Sizing / Catalog"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-2.5 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Impact Estimate</label>
                <input
                  type="text"
                  placeholder="e.g. Mitigates ~20% return rate"
                  value={newImpact}
                  onChange={(e) => setNewImpact(e.target.value)}
                  className="w-full p-2.5 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1">Action Description</label>
              <textarea
                rows={2}
                placeholder="Explain the technical remedy or operational adjustment..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full p-2.5 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none font-sans"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-[12px] bg-[#18181B] text-white text-xs font-semibold hover:bg-black transition-colors"
            >
              Add Task to Weekly Plan
            </button>
          </div>
        </form>
      )}

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-[24px] p-12 text-center border border-[#18181B12]">
            <p className="text-zinc-500 text-sm">No tasks found matching active filter.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-[24px] p-5 border transition-all ${
                task.completed
                  ? 'border-zinc-200 bg-zinc-50/60 opacity-80'
                  : 'border-[#18181B12] shadow-2xs hover:border-zinc-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="w-5 h-5 rounded-md mt-0.5 text-[#18181B] focus:ring-0 cursor-pointer accent-[#18181B]"
                  />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                          task.priority === 'high'
                            ? 'bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]'
                            : task.priority === 'medium'
                            ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {task.priority} Priority
                      </span>

                      <span className="text-[10px] text-zinc-500 font-medium px-2 py-0.5 rounded-full bg-[#F8F8F5]">
                        {task.category}
                      </span>

                      {task.impact_estimate && (
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                          {task.impact_estimate}
                        </span>
                      )}
                    </div>

                    <h3
                      className={`text-sm font-bold text-zinc-900 ${
                        task.completed ? 'line-through text-zinc-400' : ''
                      }`}
                    >
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed font-sans">
                        {task.description}
                      </p>
                    )}

                    {/* Verbatim Customer Evidence Quote */}
                    {task.evidence_quote && (
                      <div className="mt-3 p-3 rounded-[14px] bg-[#F8F8F5] border border-[#18181B0A] text-xs text-zinc-700 italic flex items-start gap-2">
                        <Quote className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                        <span>"{task.evidence_quote}"</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  title="Delete Task"
                  className="text-zinc-300 hover:text-rose-600 p-1 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
