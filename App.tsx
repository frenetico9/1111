import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Common Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/common/LoginPage';
import ClientSignupPage from './pages/common/ClientSignupPage';
import BarbershopSignupPage from './pages/common/BarbershopSignupPage';
import NotFoundPage from './pages/common/NotFoundPage';
import ForgotPasswordPage from './pages/common/ForgotPasswordPage';
import ClientBookingPage from './pages/client/BookingPage';
import ContactPage from './pages/common/ContactPage';
import PrivacyPolicyPage from './pages/common/PrivacyPolicyPage';
import TermsOfUsePage from './pages/common/TermsOfUsePage';
import CookiePolicyPage from './pages/common/CookiePolicyPage';
import BarbershopPublicPage from './pages/client/BarbershopPublicPage';
import ClientFindBarbershopsPage from './pages/client/ClientFindBarbershopsPage';
import PlansPage from './pages/common/PlansPage';
import FeaturesPage from './pages/common/FeaturesPage';


// Client Pages & Layout
import ClientDashboardLayout from './pages/client/ClientDashboardLayout';
import ClientAppointmentsPage from './pages/client/ClientAppointmentsPage';
import ClientProfilePage from './pages/client/ClientProfilePage';
import ClientLoyaltyPage from './pages/client/ClientLoyaltyPage';

// Admin Pages & Layout
import AdminDashboardLayout from './pages/admin/AdminDashboardLayout';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminAppointmentsPage from './pages/admin/AdminAppointmentsPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminTeamPage from './pages/admin/AdminTeamPage';
import AdminClientsPage from './pages/admin/AdminClientsPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminChatPage from './pages/admin/AdminChatPage'; // Kept for client-admin communication
import AdminFinancialPage from './pages/admin/AdminFinancialPage';
import AdminSubscriptionPage from './pages/admin/AdminSubscriptionPage';

// Components
import LgpdConsentModal from './components/LgpdConsentModal';
import NotificationContainer from './components/NotificationContainer';
import LoadingSpinner from './components/LoadingSpinner';
import Layout from './components/Layout'; // General public layout
import ScrollToTop from './components/ScrollToTop';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner size="lg" /></div>;
  }

  if (!user || !allowedRoles.includes(user.type)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />; // Render child routes
};

const App: React.FC = () => {
  const [showLgpdModal, setShowLgpdModal] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('lgpdConsent_CorteCerto');
    if (!consent) {
      setShowLgpdModal(true);
    }
  }, []);

  const handleLgpdAccept = () => {
    localStorage.setItem('lgpdConsent_CorteCerto', 'true');
    setShowLgpdModal(false);
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      {showLgpdModal && <LgpdConsentModal onAccept={handleLgpdAccept} />}
      <NotificationContainer />
      <Routes>
        {/* Public Routes with General Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="signup" element={<ClientSignupPage />} />
          <Route path="signup/barbershop" element={<BarbershopSignupPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="terms-of-use" element={<TermsOfUsePage />} />
          <Route path="cookie-policy" element={<CookiePolicyPage />} />
          <Route path="features" element={<FeaturesPage />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="find" element={<ClientFindBarbershopsPage />} />
          <Route path="barbershop/:barbershopId" element={<BarbershopPublicPage />} />
          <Route path="book/:barbershopId/:serviceId" element={<ClientBookingPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Client Routes - Dashboard has its own layout */}
        <Route element={<ProtectedRoute allowedRoles={['client']} />}>
          <Route path="/client" element={<ClientDashboardLayout />}>
            <Route index element={<Navigate to="appointments" replace />} />
            <Route path="appointments" element={<ClientAppointmentsPage />} />
            <Route path="profile" element={<ClientProfilePage />} />
            <Route path="loyalty" element={<ClientLoyaltyPage />} />
          </Route>
        </Route>

        {/* Admin Routes - Dashboard has its own layout */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboardLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<AdminOverviewPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="appointments" element={<AdminAppointmentsPage />} />
            <Route path="financial" element={<AdminFinancialPage />} />
            <Route path="services" element={<AdminServicesPage />} />
            <Route path="team" element={<AdminTeamPage />} />
            <Route path="clients" element={<AdminClientsPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="subscription" element={<AdminSubscriptionPage />} />
            <Route path="chat" element={<AdminChatPage />} />
            <Route path="chat/:clientId" element={<AdminChatPage />} />
          </Route>
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
};

export default App;
