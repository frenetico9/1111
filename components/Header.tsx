

import React, { useState, useEffect, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { NAVALHA_LOGO_URL } from '../constants';
import { useAuth } from '../hooks/useAuth';
import Button from './Button';
import BackButton from './BackButton';

const NavLinkItem = React.memo<{ to: string; children: React.ReactNode; onClick?: () => void }>(({ to, children, onClick }) => (
  <ReactRouterDOM.NavLink
    to={to}
    onClick={onClick}
    className="block md:inline-block py-3 md:py-0 px-4 md:px-0 text-lg md:text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200"
  >
    {children}
  </ReactRouterDOM.NavLink>
));
NavLinkItem.displayName = 'NavLinkItem';


const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();
  const location = ReactRouterDOM.useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
    closeMenu();
  }, [logout, navigate, closeMenu]);

  useEffect(() => {
    // Close mobile menu on route change
    closeMenu();
  }, [location, closeMenu]);

  useEffect(() => {
    // Prevent body scroll when mobile menu is open
    const originalOverflow = document.body.style.overflow;
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflow;
    }
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMenuOpen]);
  
  const showBackButton = location.pathname.startsWith('/barbershop/') || location.pathname.startsWith('/booking');

  const MainHeaderBar = (
    <header className="bg-dark-bg shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <ReactRouterDOM.Link to="/" className="flex items-center space-x-2 group">
              <img src={NAVALHA_LOGO_URL} alt="Navalha Digital Logo" className="w-12 h-12" />
              <span className="text-xl sm:text-2xl font-bold text-white group-hover:text-gray-200 transition-colors">Navalha<span className="text-primary-blue">Digital</span></span>
            </ReactRouterDOM.Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <NavLinkItem to="/">Início</NavLinkItem>
              <NavLinkItem to="/features">Funcionalidades</NavLinkItem>
              <NavLinkItem to="/plans">Planos</NavLinkItem>
              <NavLinkItem to="/contact">Contato</NavLinkItem>
            </nav>
            
            <div className="hidden md:flex items-center space-x-2">
              {showBackButton && <BackButton />}
              {user ? (
                <>
                  {user.type === 'client' && <Button onClick={() => navigate('/client/appointments')} size="sm" variant="outline">Meus Agendamentos</Button>}
                  {user.type === 'admin' && <Button onClick={() => navigate('/admin/overview')} size="sm" variant="primary">Painel Admin</Button>}
                  <Button onClick={handleLogout} size="sm" variant="danger">Sair</Button>
                </>
              ) : (
                <>
                  <Button onClick={() => navigate('/login')} size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800">Login</Button>
                  <Button onClick={() => navigate('/signup/client')} variant="outline" size="sm">Cadastro Cliente</Button>
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

            <div className="w-10 h-10 md:hidden" />
          </div>
        </div>
      </header>
  );
  
  const MobileMenuElements = (
      <div className="md:hidden">
        {showBackButton && (
          <button
            onClick={() => navigate(-1)}
            className="fixed top-5 left-4 z-[1001] p-2 rounded-md text-white bg-dark-bg/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
            aria-label="Voltar"
          >
            <span className="material-icons-outlined text-3xl">arrow_back_ios_new</span>
          </button>
        )}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className="fixed top-5 right-4 z-[1001] p-2 rounded-md text-white bg-dark-bg/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-controls="mobile-menu-panel"
          aria-expanded={isMenuOpen}
        >
          <span className="material-icons-outlined text-3xl">{isMenuOpen ? 'close' : 'menu'}</span>
        </button>

        <div 
            id="mobile-menu-panel"
            className={`fixed inset-0 z-[1000] bg-dark-bg transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex flex-col items-center justify-center h-full pt-20">
              <nav className="flex flex-col items-center text-center space-y-6">
                  <NavLinkItem to="/" onClick={closeMenu}>Início</NavLinkItem>
                  <NavLinkItem to="/features" onClick={closeMenu}>Funcionalidades</NavLinkItem>
                  <NavLinkItem to="/plans" onClick={closeMenu}>Planos</NavLinkItem>
                  <NavLinkItem to="/contact" onClick={closeMenu}>Contato</NavLinkItem>
              </nav>
              <div className="mt-10 pt-8 border-t border-gray-700 w-full max-w-xs flex flex-col items-center space-y-4">
                   {user ? (
                    <>
                      {user.type === 'client' && <Button onClick={() => { navigate('/client/appointments'); closeMenu(); }} size="md" variant="primary" fullWidth>Meus Agendamentos</Button>}
                      {user.type === 'admin' && <Button onClick={() => { navigate('/admin/overview'); closeMenu(); }} size="md" variant="primary" fullWidth>Painel Admin</Button>}
                      <Button onClick={handleLogout} size="md" variant="danger" fullWidth>Sair</Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => { navigate('/login'); closeMenu(); }} variant="primary" size="md" fullWidth>Login</Button>
                      <Button onClick={() => { navigate('/signup/barbershop'); closeMenu(); }} variant="outline" size="md" fullWidth>Sou Barbearia</Button>
                    </>
                  )}
              </div>
          </div>
        </div>
      </div>
  );

  return (
    <>
      {MainHeaderBar}
      {MobileMenuElements}
    </>
  );
};

export default Header;