import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/Button';

const AdminDashboardLayout: React.FC = () => {
  const { user, barbershopProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/'); // Redirect to homepage after logout
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-dark-bg">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setSidebarOpen(false)}></div>}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <AdminSidebar onLinkClick={() => setSidebarOpen(false)} />
      </div>
      
      <div className="flex-1 flex flex-col overflow-x-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm p-2 md:p-4 sticky top-0 z-20 border-b border-light-blue dark:border-gray-700">
          <div className="flex justify-between items-center max-w-full px-2 sm:px-6 lg:px-8">
            <button className="p-2 text-gray-500 dark:text-gray-300 rounded-md md:hidden" onClick={() => setSidebarOpen(true)}>
                <span className="material-icons-outlined">menu</span>
            </button>
            <div className="flex-1 md:flex-none">
              <h1 className="text-base sm:text-lg font-semibold text-primary-blue truncate max-w-[150px] sm:max-w-xs md:max-w-md" title={barbershopProfile?.name}>
                {barbershopProfile?.name || 'Painel da Barbearia'}
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden md:inline">Olá, {user?.name || user?.email}</span>
              <Button onClick={handleLogout} variant="outline" size="sm" className="!px-2 sm:!px-4">
                <span className="material-icons-outlined text-sm md:mr-1">logout</span>
                <span className="hidden md:inline">Sair</span>
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-grow p-4 sm:p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;