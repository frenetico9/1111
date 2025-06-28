import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { NAVALHA_LOGO_URL } from '../constants';
import Button from './Button';
import Input from './Input';
import { useNotification } from '../contexts/NotificationContext';

const SocialIcon: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
        {children}
    </a>
);

const FooterLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
    <Link to={to} className="text-gray-400 hover:text-white transition-colors text-sm">{children}</Link>
);


const Footer: React.FC = () => {
    const { addNotification } = useNotification();
    const [email, setEmail] = useState('');

    const handleNewsletterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(email && /\S+@\S+\.\S+/.test(email)) {
            addNotification({ message: 'Obrigado por se inscrever na nossa newsletter!', type: 'success' });
            setEmail('');
        } else {
            addNotification({ message: 'Por favor, insira um e-mail válido.', type: 'warning' });
        }
    }

  return (
    <footer id="page-footer" className="bg-dark-bg text-white pt-16 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                {/* About & Newsletter */}
                <div className="lg:col-span-2">
                    <div className="flex items-center space-x-2 mb-4">
                        <img src={NAVALHA_LOGO_URL} alt="Navalha Digital Logo" className="w-12 h-12" />
                        <span className="text-2xl font-bold">Navalha<span className="text-primary-blue">Digital</span></span>
                    </div>
                    <p className="text-sm text-gray-400 max-w-sm mb-6">
                        A plataforma definitiva para agendamento em barbearias. Simples para o cliente, poderosa para o seu negócio.
                    </p>
                    <h4 className="font-semibold mb-2">Fique por dentro das novidades</h4>
                     <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2 max-w-sm">
                        <Input
                            type="email"
                            name="newsletter_email"
                            placeholder="Seu melhor e-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            containerClassName="flex-grow mb-0"
                            className="bg-gray-800 border-gray-600 text-white !py-2"
                        />
                        <Button type="submit" variant="primary" size="sm" className="!py-2.5">Inscrever</Button>
                    </form>
                </div>

                {/* Links */}
                <div>
                    <h4 className="font-semibold mb-4">Plataforma</h4>
                    <ul className="space-y-3">
                        <li><FooterLink to="/features">Funcionalidades</FooterLink></li>
                        <li><FooterLink to="/plans">Planos</FooterLink></li>
                        <li><FooterLink to="/contact">Contato</FooterLink></li>
                        <li><FooterLink to="/signup/barbershop">Para Barbearias</FooterLink></li>
                        <li><FooterLink to="/signup/client">Para Clientes</FooterLink></li>
                    </ul>
                </div>

                {/* Policies */}
                 <div>
                    <h4 className="font-semibold mb-4">Legal</h4>
                    <ul className="space-y-3">
                        <li><FooterLink to="/privacy-policy">Política de Privacidade</FooterLink></li>
                        <li><FooterLink to="/terms-of-use">Termos de Uso</FooterLink></li>
                        <li><FooterLink to="/cookie-policy">Política de Cookies</FooterLink></li>
                    </ul>
                </div>

                 {/* Contact & Social */}
                <div>
                    <h4 className="font-semibold mb-4">Contato</h4>
                    <ul className="space-y-3 text-sm text-gray-400">
                        <li className="flex items-center gap-2">
                            <span className="material-icons-outlined text-lg">email</span>
                            <span>contato@navalhadigital.com</span>
                        </li>
                         <li className="flex items-center gap-2">
                            <span className="material-icons-outlined text-lg">support_agent</span>
                            <span>(11) 4002-8922</span>
                        </li>
                    </ul>
                    <div className="flex space-x-4 mt-6">
                        <SocialIcon href="https://instagram.com">
                             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.024.06 1.378.06 3.808s-.012 2.784-.06 3.808c-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.024.048-1.378.06-3.808.06s-2.784-.012-3.808-.06c-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.048-1.024-.06-1.378-.06-3.808s.012-2.784.06-3.808c.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 016.08 2.525c.636-.247 1.363-.416 2.427-.465C9.53 2.013 9.884 2 12.315 2zm-1.161 10.563a3.062 3.062 0 11-4.386 4.386 3.062 3.062 0 014.386-4.386zM12 15.117a3.117 3.117 0 100-6.234 3.117 3.117 0 000 6.234zm6.096-7.627a1.222 1.222 0 100-2.443 1.222 1.222 0 000 2.443z" clipRule="evenodd" /></svg>
                        </SocialIcon>
                        <SocialIcon href="https://facebook.com">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                        </SocialIcon>
                         <SocialIcon href="https://tiktok.com">
                           <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.525.02c1.31-.02 2.61-.01 3.91.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-2.43.05-4.84-.95-6.6-2.9-1.99-2.19-2.65-5.18-1.7-7.85.99-2.8 3.45-4.73 6.3-5.56.24-.07.48-.12.72-.18.01-3.2.01-6.4.01-9.6.04-1.48.68-2.95 1.81-3.96 1.02-.91 2.37-1.36 3.82-1.32z"/></svg>
                        </SocialIcon>
                    </div>
                </div>

            </div>
            <div className="mt-12 border-t border-gray-700 pt-8 text-center text-sm text-gray-500">
                <p>&copy; {new Date().getFullYear()} Navalha Digital. Todos os direitos reservados.</p>
                 <p className="mt-1">Uma plataforma criada para afiar o seu negócio.</p>
            </div>
        </div>
    </footer>
  );
};

export default Footer;