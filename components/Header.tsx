import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { NAVALHA_LOGO_URL } from '../constants';
import { useAuth } from '../hooks/useAuth';
import Button from './Button';

const NavLinkItem: React.FC<{ to: string; children: React.ReactNode; onClick?: () => void }> = ({ to, children, onClick }) => (
  <ReactRouterDOM.Link 
    to={to} 
    onClick={onClick}
    className="block md:inline-block py-3 md:py-0 px-4 md:px-0 text-lg md:text-sm font-medium text-text-dark hover:text-primary-blue transition-colors duration-200"
  >
    {children}
  </ReactRouterDOM.Link>
);

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();
  const location = ReactRouterDOM.useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Close mobile menu on route change
    setIsMenuOpen(false);
  }, [location]);

  useEffect(() => {
    // Prevent body scroll when mobile menu is open
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeMenu = () => setIsMenuOpen(false);
  
  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <ReactRouterDOM.Link to="/" className="flex items-center space-x-2 group">
            <img src={NAVALHA_LOGO_URL} alt="Navalha Digital Logo" className="w-12 h-12" />
            <span className="text-xl sm:text-2xl font-bold text-text-dark group-hover:text-primary-blue transition-colors">Navalha<span className="text-primary-blue">Digital</span></span>
          </ReactRouterDOM.Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <NavLinkItem to="/">Início</NavLinkItem>
            <NavLinkItem to="/features">Funcionalidades</NavLinkItem>
            <NavLinkItem to="/plans">Planos</NavLinkItem>
            <NavLinkItem to="/contact">Contato</NavLinkItem>
          </nav>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              <>
                {user.type === 'client' && <Button onClick={() => navigate('/client/appointments')} size="sm" variant="outline">Meus Agendamentos</Button>}
                {user.type === 'admin' && <Button onClick={() => navigate('/admin/overview')} size="sm" variant="primary">Painel Admin</Button>}
                <Button onClick={handleLogout} size="sm" variant="danger">Sair</Button>
              </>
            ) : (
              <>
                <Button onClick={() => navigate('/login')} variant="ghost" size="sm">Login</Button>
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

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="p-2 rounded-md text-text-dark focus:outline-none focus:ring-2 focus:ring-primary-blue"
              aria-label="Abrir menu"
            >
              <span className="material-icons-outlined text-3xl">{isMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 bg-white transform transition-transform duration-300 ease-in-out md:hidden ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col items-center justify-center h-full pt-20">
            <nav className="flex flex-col items-center text-center space-y-6">
                <NavLinkItem to="/" onClick={closeMenu}>Início</NavLinkItem>
                <NavLinkItem to="/features" onClick={closeMenu}>Funcionalidades</NavLinkItem>
                <NavLinkItem to="/plans" onClick={closeMenu}>Planos</NavLinkItem>
                <NavLinkItem to="/contact" onClick={closeMenu}>Contato</NavLinkItem>
            </nav>
            <div className="mt-10 pt-8 border-t border-border-color w-full max-w-xs flex flex-col items-center space-y-4">
                 {user ? (
                  <>
                    {user.type === 'client' && <Button onClick={() => { navigate('/client/appointments'); closeMenu(); }} size="md" variant="primary" fullWidth>Meus Agendamentos</Button>}
                    {user.type === 'admin' && <Button onClick={() => { navigate('/admin/overview'); closeMenu(); }} size="md" variant="primary" fullWidth>Painel Admin</Button>}
                    <Button onClick={() => { handleLogout(); closeMenu(); }} size="md" variant="danger" fullWidth>Sair</Button>
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
    </header>
  );
};

export default Header;