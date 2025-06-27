import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { NAVALHA_LOGO_URL } from '../constants';
import { useAuth } from '../hooks/useAuth'; // To display barbershop name

interface SidebarLinkProps {
  to: string;
  iconName: string; // Material Icons name
  children: React.ReactNode;
}

const SidebarNavLink: React.FC<SidebarLinkProps> = ({ to, iconName, children }) => {
  return (
    <NavLink
      to={to}
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
      <span>{children}</span>
    </NavLink>
  );
};

const AdminSidebar: React.FC = () => {
  const { barbershopProfile } = useAuth();

  return (
    <aside className="w-64 bg-white shadow-lg p-4 space-y-2 flex flex-col h-screen sticky top-0">
      <Link to="/admin/overview" className="flex items-center space-x-2 mb-6 p-2 border-b border-light-blue group">
        <div className="bg-primary-blue rounded-full p-2 w-16 h-16 flex items-center justify-center group-hover:opacity-80 transition-opacity flex-shrink-0">
            <img src={NAVALHA_LOGO_URL} alt="Navalha Digital Logo" className="w-full h-full" />
        </div>
        <div>
            <h2 className="text-lg font-bold text-primary-blue group-hover:opacity-80 transition-opacity leading-tight">Painel Admin</h2>
            {barbershopProfile && <p className="text-xs text-text-light truncate max-w-[150px]">{barbershopProfile.name}</p>}
        </div>
      </Link>
      <nav className="space-y-1.5 flex-grow overflow-y-auto">
        <SidebarNavLink to="/admin/overview" iconName="bar_chart">Visão Geral</SidebarNavLink>
        <SidebarNavLink to="/admin/appointments" iconName="event_available">Agendamentos</SidebarNavLink>
        <SidebarNavLink to="/admin/services" iconName="cut">Serviços</SidebarNavLink>
        <SidebarNavLink to="/admin/team" iconName="groups">Equipe</SidebarNavLink>
        <SidebarNavLink to="/admin/clients" iconName="people_alt">Clientes</SidebarNavLink>
        <SidebarNavLink to="/admin/reviews" iconName="reviews">Avaliações</SidebarNavLink>
        <SidebarNavLink to="/admin/subscription" iconName="credit_card">Assinatura</SidebarNavLink>
        <SidebarNavLink to="/admin/settings" iconName="settings">Configurações</SidebarNavLink>
      </nav>
      <div className="mt-auto pt-4 border-t border-light-blue">
        <SidebarNavLink to="/" iconName="storefront">Ver Página Pública</SidebarNavLink>
      </div>
    </aside>
  );
};

export default AdminSidebar;