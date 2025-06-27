import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/Button';

const AdminDashboardLayout: React.FC = () => {
  const { user, barbershopProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); // Redirect to homepage after logout
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-x-hidden"> {/* Prevent horizontal scroll from main content */}
        <header className="bg-white shadow-sm p-4 sticky top-0 z-30 border-b border-light-blue">
          <div className="container mx-auto flex justify-between items-center max-w-full px-4 sm:px-6 lg:px-8"> {/* Ensure header content is constrained */}
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-primary-blue truncate max-w-xs sm:max-w-sm md:max-w-md" title={barbershopProfile?.name}>
                {barbershopProfile?.name || 'Painel da Barbearia'}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs sm:text-sm text-gray-600 hidden md:inline">Olá, {user?.name || user?.email}</span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <span className="material-icons-outlined text-sm mr-1">logout</span>Sair
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-grow p-4 sm:p-6 md:p-8 overflow-y-auto">
          <Outlet /> {/* Content of admin pages will be rendered here */}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;