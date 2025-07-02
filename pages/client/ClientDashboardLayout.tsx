import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { NAVALHA_LOGO_URL } from '../../constants';
import Button from '../../components/Button';

interface ClientSidebarLinkProps {
  to: string;
  children: React.ReactNode;
  iconName: string;
  onClick: () => void;
}

const ClientSidebarLink: React.FC<ClientSidebarLinkProps> = ({ to, children, iconName, onClick }) => (
  <ReactRouterDOM.NavLink
    to={to}
    onClick={onClick}
    end
    className={({ isActive }) =>
      `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors duration-150 ease-in-out text-sm font-medium group
       ${isActive 
          ? 'bg-primary-blue text-white shadow-md' 
          : 'text-text-dark hover:bg-light-blue hover:text-primary-blue'
       }`
    }
  >
    <span className="material-icons-outlined text-xl group-hover:text-primary-blue transition-colors">
      {iconName}
    </span>
    <div className="flex-grow flex justify-between items-center">{children}</div>
  </ReactRouterDOM.NavLink>
);

const ClientDashboardLayout: React.FC = () => {
  const { user, logout, unreadChatCount } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const closeSidebar = () => setSidebarOpen(false);

  const SidebarContent = () => (
    <aside className="w-60 bg-white shadow-lg p-4 space-y-2 flex flex-col h-screen">
      <ReactRouterDOM.Link to="/" className="flex items-center space-x-2 mb-6 p-2 border-b border-light-blue group">
        <div className="bg-primary-blue rounded-full p-2 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center group-hover:opacity-80 transition-opacity flex-shrink-0">
          <img src={NAVALHA_LOGO_URL} alt="Navalha Digital Logo" className="w-full h-full" />
        </div>
        <div>
          <h2 className="text-base md:text-lg font-bold text-primary-blue group-hover:opacity-80 transition-opacity leading-tight">Cliente</h2>
          {user && <p className="text-xs text-text-light truncate max-w-[120px]">{user.name || user.email}</p>}
        </div>
      </ReactRouterDOM.Link>
      <nav className="space-y-1.5 flex-grow">
        <ClientSidebarLink to="/client/appointments" iconName="event_note" onClick={closeSidebar}><span>Meus Agendamentos</span></ClientSidebarLink>
        <ClientSidebarLink to="/client/profile" iconName="person" onClick={closeSidebar}><span>Meu Perfil</span></ClientSidebarLink>
        <ClientSidebarLink to="/client/find-barbershops" iconName="search" onClick={closeSidebar}><span>Encontrar Barbearias</span></ClientSidebarLink>
        <ClientSidebarLink to="/client/chat" iconName="chat" onClick={closeSidebar}>
          <span>Chat</span>
          {unreadChatCount > 0 && (
            <span className="bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {unreadChatCount > 9 ? '9+' : unreadChatCount}
            </span>
          )}
        </ClientSidebarLink>
      </nav>
      <div className="mt-auto pt-4 border-t border-light-blue">
         <Button onClick={handleLogout} variant="outline" fullWidth size="sm">
          <span className="material-icons-outlined text-sm mr-1">logout</span>Sair
         </Button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={closeSidebar}></div>}

      {/* Sidebar for mobile (fixed) and desktop (relative) */}
      <div className={`fixed inset-y-0 left-0 z-40 w-60 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </div>

      <div className="flex-1 flex flex-col">
        <header className="md:hidden bg-white shadow-sm p-2 sticky top-0 z-20 border-b border-light-blue flex justify-between items-center">
            <button className="p-2 text-gray-500 rounded-md" onClick={() => setSidebarOpen(true)}>
                <span className="material-icons-outlined">menu</span>
            </button>
            <span className="text-sm font-semibold text-primary-blue">Painel do Cliente</span>
        </header>
        <main className="flex-grow p-4 sm:p-6 md:p-8 overflow-y-auto">
          <ReactRouterDOM.Outlet />
        </main>
      </div>
    </div>
  );
};

export default ClientDashboardLayout;
