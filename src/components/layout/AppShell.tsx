import React, { useState } from 'react';
import { useStore } from '../../lib/storeContext';
import { useAuth } from '../../context/authContext';
import { Sidebar } from './Sidebar';
import { TopToolbar } from './TopToolbar';
import { OverviewView } from '../dashboard/OverviewView';
import { ReviewsView } from '../reviews/ReviewsView';
import { ActionPlanView } from '../dashboard/ActionPlanView';
import { ImportSimulateView } from '../reviews/ImportSimulateView';
import { PersonaView } from '../persona/PersonaView';
import { StorePersonaModal } from '../persona/StorePersonaModal';
import { AuthModal } from '../auth/AuthModal';

export const AppShell: React.FC = () => {
  const { activeTab } = useStore();
  const { openAuthModal } = useAuth();
  const [newStoreModalOpen, setNewStoreModalOpen] = useState(false);

  return (
    <div className="luminous-viewport min-h-screen bg-[#F3F3EE] p-3 sm:p-6 flex items-center justify-center font-sans antialiased text-[#18181B]">
      {/* 1440px Rounded 40px Container */}
      <div className="luminous-container w-full max-w-[1440px] h-[94vh] min-h-[720px] bg-white rounded-[40px] border border-[#18181B0F] shadow-xl flex overflow-hidden">
        {/* Left Sidebar (184px fixed) */}
        <Sidebar onOpenAuth={() => openAuthModal('login')} />

        {/* Main Stage */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#FBFBFA] overflow-hidden">
          {/* Top Toolbar */}
          <TopToolbar onOpenNewStoreModal={() => setNewStoreModalOpen(true)} />

          {/* Active View Container with Custom Smooth Scroll */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
              {activeTab === 'overview' && <OverviewView />}
              {activeTab === 'reviews' && <ReviewsView />}
              {activeTab === 'actions' && <ActionPlanView />}
              {activeTab === 'import' && <ImportSimulateView />}
              {activeTab === 'persona' && <PersonaView />}
            </div>
          </main>
        </div>
      </div>

      {/* Modals */}
      <StorePersonaModal
        isOpen={newStoreModalOpen}
        onClose={() => setNewStoreModalOpen(false)}
      />
      <AuthModal />
    </div>
  );
};
