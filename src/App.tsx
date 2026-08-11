import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { SearchFilters } from './components/SearchFilters';
import { StudentDashboard } from './components/StudentDashboard';
import { AgentDashboard } from './components/AgentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { OnboardingRoleSelect } from './components/OnboardingRoleSelect';
import { ListingDetailModal } from './components/ListingDetailModal';
import { InspectionModal } from './components/InspectionModal';
import { ReportModal } from './components/ReportModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { UserProfilePage } from './components/UserProfilePage';
import { BusinessVerificationPage } from './components/BusinessVerificationPage';
import { InfoHub } from './components/InfoHub';
import { AiChatbot } from './components/AiChatbot';
import { RealtimeChatModal } from './components/RealtimeChatModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { VerificationCodeModal } from './components/VerificationCodeModal';
import { ToastContainer } from './components/ToastContainer';
import { MobileBottomNav } from './components/MobileBottomNav';

const MainContent: React.FC = () => {
  const { user, activeView, setActiveView, selectedInfoDocId, setAuthModalOpen, setAuthModalTab } = useAuth();

  React.useEffect(() => {
    if (!user && activeView !== 'home' && activeView !== 'role_select' && activeView !== 'onboarding' && activeView !== 'info_hub') {
      setAuthModalTab('student_signup');
      setAuthModalOpen(true);
      setActiveView('home');
    }
  }, [user, activeView, setActiveView, setAuthModalOpen, setAuthModalTab]);

  return (
    <main className="flex-1 min-h-[80vh] pb-16 md:pb-0">
      {activeView === 'home' && <LandingPage />}
      {activeView === 'info_hub' && <InfoHub initialDocId={selectedInfoDocId} />}
      {activeView === 'search' && user && <SearchFilters />}
      {activeView === 'saved' && user && <SearchFilters />}
      {activeView === 'profile' && user && <UserProfilePage />}
      {activeView === 'student_dashboard' && user && <StudentDashboard />}
      {activeView === 'agent_dashboard' && user && <AgentDashboard />}
      {activeView === 'agent_verification' && user && <BusinessVerificationPage />}
      {activeView === 'admin_dashboard' && user?.role === 'admin' && <AdminDashboard />}
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
          <AiChatbot />
          <ToastContainer />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
