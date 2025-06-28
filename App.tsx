import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Common Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/common/LoginPage';
import ClientSignupPage from './pages/common/ClientSignupPage';
import BarbershopSignupPage from './pages/common/BarbershopSignupPage';
import NotFoundPage from './pages/common/NotFoundPage';
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

// Components
import LgpdConsentModal from './components/LgpdConsentModal';
import NotificationContainer from './components/NotificationContainer';
import LoadingSpinner from './components/LoadingSpinner';
import Layout from './components/Layout'; // General public layout

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
    <HashRouter>
      {showLgpdModal && <LgpdConsentModal onAccept={handleLgpdAccept} />}
      <NotificationContainer />
      <Routes>
        {/* Public Routes with General Layout */}
        <Route element={<Layout><Outlet /></Layout>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup/client" element={<ClientSignupPage />} />
          <Route path="/signup/barbershop" element={<BarbershopSignupPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-use" element={<TermsOfUsePage />} />
          <Route path="/cookie-policy" element={<CookiePolicyPage />} />
          <Route path="/barbershop/:barbershopId" element={<BarbershopPublicPage />} />
          <Route path="/barbershop/:barbershopId/book/:serviceId" element={<BookingPage />} />
        </Route>

        {/* Client Routes */}
        <Route element={<ProtectedRoute allowedRoles={['client']} />}>
          <Route path="/client" element={<ClientDashboardLayout />}>
            <Route index element={<Navigate to="appointments" replace />} />
            <Route path="appointments" element={<ClientAppointmentsPage />} />
            <Route path="profile" element={<ClientProfilePage />} />
            <Route path="find-barbershops" element={<ClientFindBarbershopsPage />} /> {/* New Route */}
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboardLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<AdminOverviewPage />} />
            <Route path="appointments" element={<AdminAppointmentsPage />} />
            <Route path="services" element={<AdminServicesPage />} />
            <Route path="team" element={<AdminTeamPage />} />
            <Route path="clients" element={<AdminClientsPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
            <Route path="subscription" element={<AdminSubscriptionPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>
        
        {/* Fallback for unmatched routes within general layout */}
        <Route element={<Layout><Outlet /></Layout>}>
            <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;