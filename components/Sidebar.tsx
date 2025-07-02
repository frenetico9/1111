import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { NAVALHA_LOGO_URL } from '../constants';
import { useAuth } from '../hooks/useAuth'; // To display barbershop name
import { SubscriptionPlanTier } from '../types';

interface SidebarLinkProps {
  to: string;
  iconName: string; // Material Icons name
  children: React.ReactNode;
  onClick?: () => void;
  unreadCount?: number;
}

const SidebarNavLink: React.FC<SidebarLinkProps> = ({ to, iconName, children, onClick, unreadCount }) => {
  return (
    <ReactRouterDOM.NavLink
      to={to}
      onClick={onClick}
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
      <span className="flex-grow">{children}</span>
       {unreadCount && unreadCount > 0 && (
        <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </ReactRouterDOM.NavLink>
  );
};

interface AdminSidebarProps {
  onLinkClick: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onLinkClick }) => {
  const { user, barbershopProfile, barbershopSubscription, unreadChatCount } = useAuth();
  const isPro = barbershopSubscription?.planId === SubscriptionPlanTier.PRO;

  // Construct the correct URL for the public page. The user's ID is the barbershop's ID for an admin.
  // Provides a fallback to the homepage if the user is not available for any reason.
  const publicPageUrl = user ? `/barbershop/${user.id}` : '/';

  return (
    <aside className="w-64 bg-white shadow-lg p-4 space-y-2 flex flex-col h-screen sticky top-0">
      <ReactRouterDOM.Link to="/admin/overview" onClick={onLinkClick} className="flex items-center space-x-2 mb-6 p-2 border-b border-light-blue group">
        <div className="bg-primary-blue rounded-full p-2 w-16 h-16 flex items-center justify-center group-hover:opacity-80 transition-opacity flex-shrink-0">
            <img src={NAVALHA_LOGO_URL} alt="Navalha Digital Logo" className="w-full h-full" />
        </div>
        <div>
            <h2 className="text-lg font-bold text-primary-blue group-hover:opacity-80 transition-opacity leading-tight">Painel Admin</h2>
            {barbershopProfile && <p className="text-xs text-text-light truncate max-w-[150px]">{barbershopProfile.name}</p>}
        </div>
      </ReactRouterDOM.Link>
      <nav className="space-y-1.5 flex-grow overflow-y-auto">
        <SidebarNavLink to="/admin/overview" iconName="bar_chart" onClick={onLinkClick}>Visão Geral</SidebarNavLink>
        
        {isPro ? (
            <SidebarNavLink to="/admin/reports" iconName="analytics" onClick={onLinkClick}>Relatórios</SidebarNavLink>
        ) : (
            <ReactRouterDOM.Link 
                to="/admin/subscription" 
                className="block" 
                title="Faça upgrade para o PRO para acessar os Relatórios"
                onClick={onLinkClick}
            >
                <div className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-light-blue/50 transition-colors duration-150 ease-in-out group">
                    <span className="material-icons-outlined text-xl">analytics</span>
                    <span className="group-hover:text-primary-blue">Relatórios</span>
                    <span className="ml-auto text-xs font-bold bg-accent-gold text-white px-1.5 py-0.5 rounded-full">PRO</span>
                    <span className="material-icons-outlined text-base text-gray-400 ml-1">lock</span>
                </div>
            </ReactRouterDOM.Link>
        )}

        <SidebarNavLink to="/admin/appointments" iconName="event_available" onClick={onLinkClick}>Agendamentos</SidebarNavLink>
        <SidebarNavLink to="/admin/chat" iconName="chat" onClick={onLinkClick} unreadCount={unreadChatCount}>Chat</SidebarNavLink>
        <SidebarNavLink to="/admin/services" iconName="cut" onClick={onLinkClick}>Serviços</SidebarNavLink>
        <SidebarNavLink to="/admin/team" iconName="groups" onClick={onLinkClick}>Equipe</SidebarNavLink>
        <SidebarNavLink to="/admin/clients" iconName="people_alt" onClick={onLinkClick}>Clientes</SidebarNavLink>
        <SidebarNavLink to="/admin/reviews" iconName="reviews" onClick={onLinkClick}>Avaliações</SidebarNavLink>
        <SidebarNavLink to="/admin/subscription" iconName="credit_card" onClick={onLinkClick}>Assinatura</SidebarNavLink>
        <SidebarNavLink to="/admin/settings" iconName="settings" onClick={onLinkClick}>Configurações</SidebarNavLink>
      </nav>
      <div className="mt-auto pt-4 border-t border-light-blue">
        <SidebarNavLink to={publicPageUrl} iconName="storefront" onClick={onLinkClick}>Ver Página Pública</SidebarNavLink>
      </div>
    </aside>
  );
};

export default AdminSidebar;
