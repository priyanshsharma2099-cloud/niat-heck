import React from 'react';
import { useStore, ActiveNavTab } from '../../lib/storeContext';
import { useAuth } from '../../context/authContext';
import {
  LayoutDashboard,
  MessageSquare,
  CheckSquare,
  UploadCloud,
  Sliders,
  Sparkles,
  LogOut,
  User,
} from 'lucide-react';

interface SidebarProps {
  onOpenAuth?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenAuth }) => {
  const { activeTab, setActiveTab, metrics, reviews, activeStore } = useStore();
  const { user, logout } = useAuth();

  // Pending replies count
  const pendingRepliesCount = reviews.filter(
    (r) => r.store_id === activeStore.id && !r.is_noise && r.reply_status === 'pending'
  ).length;

  const navItems: { id: ActiveNavTab; label: string; icon: React.ElementType; counter?: number | null }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      counter: null,
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: MessageSquare,
      counter: pendingRepliesCount > 0 ? pendingRepliesCount : null,
    },
    {
      id: 'actions',
      label: 'Action Plan',
      icon: CheckSquare,
      counter: metrics.openTasksCount > 0 ? metrics.openTasksCount : null,
    },
    {
      id: 'import',
      label: 'Import CSV',
      icon: UploadCloud,
      counter: null,
    },
    {
      id: 'persona',
      label: 'Store Persona',
      icon: Sliders,
      counter: null,
    },
  ];

  return (
    <aside className="w-[184px] shrink-0 border-r border-[#18181B0F] bg-white h-full flex flex-col justify-between py-6 px-3 select-none">
      <div>
        {/* Brand Wordmark */}
        <div className="flex items-center gap-2 px-2 pb-6 border-b border-[#18181B0D]">
          <div className="w-8 h-8 rounded-[12px] bg-[#18181B] text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-[#3B5BDB]" />
          </div>
          <div>
            <div className="font-plus-jakarta font-bold text-sm tracking-tight text-[#18181B] leading-none">
              Cluey Cart
            </div>
            <div className="text-[10px] text-[#3B5BDB] font-semibold tracking-wider uppercase mt-1">
              Feedback Engine
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="mt-5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[12px] text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#18181B] text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-[#F8F8F5]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.counter !== null && item.counter !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.id === 'actions'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {item.counter}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Account / User Section */}
      <div className="pt-4 border-t border-[#18181B0D]">
        {user ? (
          <div className="flex items-center justify-between px-2 py-1.5 rounded-[12px] bg-[#F8F8F5]">
            <div className="flex items-center gap-2 min-w-0">
              {(user.avatar_url || user.avatar) ? (
                <img
                  src={user.avatar_url || user.avatar}
                  alt={user.name}
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center text-[10px] font-bold">
                  {user.name ? user.name[0].toUpperCase() : 'M'}
                </div>
              )}
              <div className="truncate text-left">
                <p className="text-[11px] font-semibold text-zinc-800 truncate">{user.name}</p>
                <p className="text-[9px] text-zinc-400 font-mono truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1 hover:text-rose-600 text-zinc-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-[12px] bg-[#F8F8F5] hover:bg-zinc-200/70 text-xs font-semibold text-zinc-700 transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </aside>
  );
};
