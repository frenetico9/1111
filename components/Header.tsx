import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NAVALHA_LOGO_URL } from '../constants';
import { useAuth } from '../hooks/useAuth';
import Button from './Button';

const NavLinkItem: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <Link to={to} className="text-sm font-medium text-text-dark hover:text-primary-blue transition-colors duration-200">
    {children}
  </Link>
);

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-2 group">
            <img src={NAVALHA_LOGO_URL} alt="Navalha Digital Logo" className="w-12 h-12" />
            <span className="text-2xl font-bold text-text-dark group-hover:text-primary-blue transition-colors">Navalha<span className="text-primary-blue">Digital</span></span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <NavLinkItem to="/">Início</NavLinkItem>
            <NavLinkItem to="/features">Funcionalidades</NavLinkItem>
            <NavLinkItem to="/plans">Planos</NavLinkItem>
            <NavLinkItem to="/contact">Contato</NavLinkItem>
          </nav>
          
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                {user.type === 'client' && <Button onClick={() => navigate('/client/appointments')} size="sm" variant="outline">Meus Agendamentos</Button>}
                {user.type === 'admin' && <Button onClick={() => navigate('/admin/overview')} size="sm" variant="primary">Painel Admin</Button>}
                <Button onClick={handleLogout} size="sm" variant="danger">Sair</Button>
              </>
            ) : (
              <>
                <Button onClick={() => navigate('/login')} variant="ghost" size="sm" className="hidden sm:inline-flex">Login</Button>
                <Button onClick={() => navigate('/signup/client')} variant="outline" size="sm" className="hidden lg:inline-flex">Cadastro Cliente</Button>
                <Button 
                  onClick={() => navigate('/signup/barbershop')} 
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-primary-blue text-white font-semibold hover:shadow-lg hover:from-blue-600 hover:to-primary-blue-dark"
                >
                  Sou Barbearia
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;