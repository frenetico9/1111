import React, { useEffect, useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Common Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/common/LoginPage';
import ClientSignupPage from './pages/common/ClientSignupPage';
import BarbershopSignupPage from './pages/common/BarbershopSignupPage';
import NotFoundPage from './pages/common/NotFoundPage';
import ForgotPasswordPage from './pages/common/ForgotPasswordPage'; // New Import
import BarbershopPublicPage from './pages/client/BarbershopPublicPage'; 
import FeaturesPage from './pages/common/FeaturesPage';
import PlansPage from './pages/common/PlansPage';
import BookingPage from './pages/client/BookingPage';
import ContactPage from './pages/common/ContactPage'; // New Import
import PrivacyPolicyPage from './pages/common/PrivacyPolicyPage'; // New Import
import TermsOfUsePage from './pages/common/TermsOfUsePage'; // New Import
import CookiePolicyPage from './pages/common/CookiePolicyPage'; // New Import


// Client Pages & Layout
import ClientDashboardLayout from './pages/client/ClientDashboardLayout';
import ClientAppointmentsPage from './pages/client/ClientAppointmentsPage';
import ClientProfilePage from './pages/client/ClientProfilePage';
import ClientFindBarbershopsPage from './pages/client/ClientFindBarbershopsPage';
import ClientChatPage from './pages/client/ClientChatPage'; // New Import
import ClientLoyaltyPage from './pages/client/ClientLoyaltyPage'; // New Import

// Admin Pages & Layout
import AdminDashboardLayout from './pages/admin/AdminDashboardLayout';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminAppointmentsPage from './pages/admin/AdminAppointmentsPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminTeamPage from './pages/admin/AdminTeamPage';
import AdminClientsPage from './pages/admin/AdminClientsPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminSubscriptionPage from './pages/admin/AdminSubscriptionPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage'; // New Import
import AdminChatPage from './pages/admin/AdminChatPage'; // New Import
import AdminFinancialPage from './pages/admin/AdminFinancialPage'; // New Import

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
    return <ReactRouterDOM.Navigate to="/login" replace />;
  }

  return <ReactRouterDOM.Outlet />; // Render child routes
};

const App: React.FC = () => {
  const [showLgpdModal, setShowLgpdModal] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('lgpdConsent_NavalhaDigital');
    if (!consent) {
      setShowLgpdModal(true);
    }
  }, []);

  const handleLgpdAccept = () => {
    localStorage.setItem('lgpdConsent_NavalhaDigital', 'true');
    setShowLgpdModal(false);
  };

  return (
    <ReactRouterDOM.BrowserRouter>
      <ScrollToTop />
      {showLgpdModal && <LgpdConsentModal onAccept={handleLgpdAccept} />}
      <NotificationContainer />
      <ReactRouterDOM.Routes>
        {/* Public Routes with General Layout */}
        <ReactRouterDOM.Route element={<Layout><ReactRouterDOM.Outlet /></Layout>}>
          <ReactRouterDOM.Route path="/" element={<HomePage />} />
          <ReactRouterDOM.Route path="/login" element={<LoginPage />} />
          <ReactRouterDOM.Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <ReactRouterDOM.Route path="/signup/client" element={<ClientSignupPage />} />
          <ReactRouterDOM.Route path="/signup/barbershop" element={<BarbershopSignupPage />} />
          <ReactRouterDOM.Route path="/features" element={<FeaturesPage />} />
          <ReactRouterDOM.Route path="/plans" element={<PlansPage />} />
          <ReactRouterDOM.Route path="/contact" element={<ContactPage />} />
          <ReactRouterDOM.Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <ReactRouterDOM.Route path="/terms-of-use" element={<TermsOfUsePage />} />
          <ReactRouterDOM.Route path="/cookie-policy" element={<CookiePolicyPage />} />
          <ReactRouterDOM.Route path="/barbershop/:barbershopId" element={<BarbershopPublicPage />} />
        </ReactRouterDOM.Route>
        
        {/* Booking page needs the public layout but is behind the /barbershop/:id route */}
        <ReactRouterDOM.Route element={<Layout><ReactRouterDOM.Outlet /></Layout>}>
             <ReactRouterDOM.Route path="/barbershop/:barbershopId/book/:serviceId" element={<BookingPage />} />
        </ReactRouterDOM.Route>


        {/* Client Routes - Dashboard has its own layout */}
        <ReactRouterDOM.Route element={<ProtectedRoute allowedRoles={['client']} />}>
          <ReactRouterDOM.Route path="/client" element={<ClientDashboardLayout />}>
            <ReactRouterDOM.Route index element={<ReactRouterDOM.Navigate to="appointments" replace />} />
            <ReactRouterDOM.Route path="appointments" element={<ClientAppointmentsPage />} />
            <ReactRouterDOM.Route path="profile" element={<ClientProfilePage />} />
            <ReactRouterDOM.Route path="find-barbershops" element={<ClientFindBarbershopsPage />} />
            <ReactRouterDOM.Route path="loyalty" element={<ClientLoyaltyPage />} />
            <ReactRouterDOM.Route path="chat" element={<ClientChatPage />} />
            <ReactRouterDOM.Route path="chat/:barbershopId" element={<ClientChatPage />} />
          </ReactRouterDOM.Route>
        </ReactRouterDOM.Route>

        {/* Admin Routes - Dashboard has its own layout */}
        <ReactRouterDOM.Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <ReactRouterDOM.Route path="/admin" element={<AdminDashboardLayout />}>
            <ReactRouterDOM.Route index element={<ReactRouterDOM.Navigate to="overview" replace />} />
            <ReactRouterDOM.Route path="overview" element={<AdminOverviewPage />} />
            <ReactRouterDOM.Route path="reports" element={<AdminReportsPage />} />
            <ReactRouterDOM.Route path="appointments" element={<AdminAppointmentsPage />} />
            <ReactRouterDOM.Route path="financial" element={<AdminFinancialPage />} />
            <ReactRouterDOM.Route path="services" element={<AdminServicesPage />} />
            <ReactRouterDOM.Route path="team" element={<AdminTeamPage />} />
            <ReactRouterDOM.Route path="clients" element={<AdminClientsPage />} />
            <ReactRouterDOM.Route path="reviews" element={<AdminReviewsPage />} />
            <ReactRouterDOM.Route path="subscription" element={<AdminSubscriptionPage />} />
            <ReactRouterDOM.Route path="settings" element={<AdminSettingsPage />} />
            <ReactRouterDOM.Route path="chat" element={<AdminChatPage />} />
            <ReactRouterDOM.Route path="chat/:clientId" element={<AdminChatPage />} />
          </ReactRouterDOM.Route>
        </ReactRouterDOM.Route>
        
        {/* Fallback for unmatched routes within general layout */}
        <ReactRouterDOM.Route element={<Layout><ReactRouterDOM.Outlet /></Layout>}>
            <ReactRouterDOM.Route path="*" element={<NotFoundPage />} />
        </ReactRouterDOM.Route>
      </ReactRouterDOM.Routes>
    </ReactRouterDOM.BrowserRouter>
  );
};

export default App;
