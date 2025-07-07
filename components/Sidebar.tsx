import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { CORTE_CERTO_LOGO_URL } from '../constants';
import { useAuth } from '../hooks/useAuth';

interface SidebarLinkProps {
  to: string;
  iconName: string; // Material Icons name
  children: React.ReactNode;
  onClick?: () => void;
}

const SidebarNavLink: React.FC<SidebarLinkProps> = ({ to, iconName, children, onClick }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors duration-150 ease-in-out text-sm font-medium group
         ${isActive 
            ? 'bg-primary-blue text-white shadow-md' 
            : 'text-text-dark dark:text-gray-200 hover:bg-light-blue dark:hover:bg-gray-700 hover:text-primary-blue'
         }`
      }
    >
      <span className="material-icons-outlined text-xl group-hover:text-primary-blue transition-colors">
        {iconName}
      </span>
      <div className="flex-grow flex justify-between items-center">{children}</div>
    </NavLink>
  );
};

interface AdminSidebarProps {
  onLinkClick: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onLinkClick }) => {
  const { user, barbershopProfile } = useAuth();

  const publicPageUrl = '/';

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg p-4 space-y-2 flex flex-col h-screen sticky top-0">
      <Link to="/admin/overview" onClick={onLinkClick} className="flex items-center space-x-2 mb-6 p-2 border-b border-light-blue dark:border-gray-700 group">
        <div className="bg-primary-blue rounded-full p-2 w-16 h-16 flex items-center justify-center group-hover:opacity-80 transition-opacity flex-shrink-0">
            <img src={CORTE_CERTO_LOGO_URL} alt="Corte Certo Logo" className="w-full h-full" />
        </div>
        <div>
            <h2 className="text-lg font-bold text-primary-blue group-hover:opacity-80 transition-opacity leading-tight">Painel Admin</h2>
            {barbershopProfile && <p className="text-xs text-text-light dark:text-gray-400 truncate max-w-[150px]">{barbershopProfile.name}</p>}
        </div>
      </Link>
      <nav className="space-y-1.5 flex-grow overflow-y-auto">
        <SidebarNavLink to="/admin/overview" iconName="bar_chart" onClick={onLinkClick}><span>Visão Geral</span></SidebarNavLink>
        <SidebarNavLink to="/admin/reports" iconName="analytics" onClick={onLinkClick}><span>Relatórios</span></SidebarNavLink>
        <SidebarNavLink to="/admin/appointments" iconName="event_available" onClick={onLinkClick}><span>Agendamentos</span></SidebarNavLink>
        <SidebarNavLink to="/admin/financial" iconName="account_balance_wallet" onClick={onLinkClick}><span>Financeiro</span></SidebarNavLink>
        <SidebarNavLink to="/admin/services" iconName="cut" onClick={onLinkClick}><span>Serviços</span></SidebarNavLink>
        <SidebarNavLink to="/admin/team" iconName="groups" onClick={onLinkClick}><span>Equipe</span></SidebarNavLink>
        <SidebarNavLink to="/admin/clients" iconName="people_alt" onClick={onLinkClick}><span>Clientes</span></SidebarNavLink>
        <SidebarNavLink to="/admin/reviews" iconName="reviews" onClick={onLinkClick}><span>Avaliações</span></SidebarNavLink>
        <SidebarNavLink to="/admin/settings" iconName="settings" onClick={onLinkClick}><span>Configurações</span></SidebarNavLink>
      </nav>
      <div className="mt-auto pt-4 border-t border-light-blue dark:border-gray-700">
        <SidebarNavLink to={publicPageUrl} iconName="storefront" onClick={onLinkClick}><span>Ver Página Pública</span></SidebarNavLink>
      </div>
    </aside>
  );
};

export default AdminSidebar;