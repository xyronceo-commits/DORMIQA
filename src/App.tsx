import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AmbassadorDashboard } from './components/AmbassadorDashboard';
import { ReferralTracker } from './components/ReferralTracker';
import { EarningsPayouts } from './components/EarningsPayouts';
import { MarketingResources } from './components/MarketingResources';
import { AmbassadorProfile } from './components/AmbassadorProfile';
import { AdminPortal } from './components/AdminPortal';
import { LandingPage } from './components/LandingPage';
import { SearchFilters } from './components/SearchFilters';
import { StudentDashboard } from './components/StudentDashboard';
import { AgentDashboard } from './components/AgentDashboard';
import { OnboardingRoleSelect } from './components/OnboardingRoleSelect';
import { ListingDetailModal } from './components/ListingDetailModal';
import { InspectionModal } from './components/InspectionModal';
import { ReportModal } from './components/ReportModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { InfoHub } from './components/InfoHub';
import { RealtimeChatModal } from './components/RealtimeChatModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { VerificationCodeModal } from './components/VerificationCodeModal';
import { ToastContainer } from './components/ToastContainer';
import { MobileBottomNav } from './components/MobileBottomNav';

const MainContent: React.FC = () => {
  const { user, activeView, selectedInfoDocId } = useAuth();

  React.useEffect(() => {
    const titles: Record<string, string> = {
      home: 'DORMIQA Ambassador Portal — Campus Student Acquisition',
      ambassador_dashboard: 'DORMIQA Ambassador Portal — Performance Dashboard',
      referrals: 'DORMIQA Ambassador Portal — Referral Tracking & Leads',
      earnings: 'DORMIQA Ambassador Portal — Earnings & Commissions',
      payouts: 'DORMIQA Ambassador Portal — Bank Payouts',
      resources: 'DORMIQA Ambassador Portal — Marketing Assets & Collateral',
      profile: 'DORMIQA Ambassador Portal — Ambassador Profile & Bank Setup',
      admin_dashboard: 'DORMIQA Ambassador Portal — Internal Admin Control Center',
      info_hub: 'DORMIQA — Knowledge Base & Legal Docs',
    };
    document.title = titles[activeView] || 'DORMIQA Ambassador Portal — Campus Referral Platform';
  }, [activeView]);

  return (
    <main className="flex-1 min-h-[80vh] pb-16 md:pb-0">
      {(activeView === 'home' || activeView === 'ambassador_dashboard') && <AmbassadorDashboard />}
      {activeView === 'referrals' && <ReferralTracker />}
      {(activeView === 'earnings' || activeView === 'payouts') && <EarningsPayouts />}
      {activeView === 'resources' && <MarketingResources />}
      {activeView === 'profile' && <AmbassadorProfile />}
      {activeView === 'admin_dashboard' && <AdminPortal />}
      
      {/* Legacy / Student App Views (Preserved) */}
      {activeView === 'search' && <SearchFilters />}
      {activeView === 'saved' && <SearchFilters />}
      {activeView === 'student_dashboard' && <StudentDashboard />}
      {activeView === 'agent_dashboard' && <AgentDashboard />}
      {activeView === 'info_hub' && <InfoHub initialDocId={selectedInfoDocId} />}
      {(activeView === 'role_select' || activeView === 'onboarding') && <OnboardingRoleSelect />}
    </main>
  );
};

const GlobalChatModalContainer: React.FC = () => {
  const { isChatModalOpen, setChatModalOpen, chatTargetListing, chatTargetThreadId } = useAuth();
  return (
    <RealtimeChatModal
      isOpen={isChatModalOpen}
      onClose={() => setChatModalOpen(false)}
      initialListing={chatTargetListing || undefined}
      targetThreadId={chatTargetThreadId || undefined}
    />
  );
};

const GlobalAdminModalContainer: React.FC = () => {
  const { isAdminModalOpen, setIsAdminModalOpen } = useAuth();
  return (
    <AdminLoginModal
      isOpen={isAdminModalOpen}
      onClose={() => setIsAdminModalOpen(false)}
    />
  );
};

const GlobalVerificationModalContainer: React.FC = () => {
  const { verificationModalOpen, closeVerificationModal, verificationEmail } = useAuth();
  return (
    <VerificationCodeModal
      isOpen={verificationModalOpen}
      onClose={closeVerificationModal}
      email={verificationEmail}
    />
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
          <Header />
          <MainContent />
          <Footer />

          {/* Mobile Bottom Docked Navigation */}
          <MobileBottomNav />

          {/* Global Modals & Utilities */}
          <ListingDetailModal />
          <InspectionModal />
          <ReportModal />
          <AuthModal />
          <UserProfileModal />
          <GlobalChatModalContainer />
          <GlobalAdminModalContainer />
          <GlobalVerificationModalContainer />
          <ToastContainer />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
