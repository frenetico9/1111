import React, { useEffect, useState, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Button from '../components/Button';
import { NAVALHA_LOGO_URL, SUBSCRIPTION_PLANS } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { BarbershopSearchResultItem, SubscriptionPlan, SubscriptionPlanTier } from '../types';
import { mockGetPublicBarbershops } from '../services/mockApiService';
import LoadingSpinner from '../components/LoadingSpinner';
import StarRating from '../components/StarRating';

// --- Sub-components for HomePage ---

interface HeroSectionProps {
  onInstallClick: () => void;
  showInstallButton: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onInstallClick, showInstallButton }) => (
  <section className="relative bg-dark-bg text-white overflow-hidden">
    <div className="absolute inset-0">
      <img src="https://i.imgur.com/LSorq3R.png" alt="Barbeiro trabalhando" className="w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-black/70"></div>
    </div>
    <div className="relative container mx-auto px-6 py-20 md:py-32 text-center z-10">
      <div className="flex justify-center mb-6 animate-fade-in-up">
        <img src={NAVALHA_LOGO_URL} alt="Navalha Digital Logo" className="w-32 h-32 md:w-48 md:h-48 filter drop-shadow-lg animate-subtle-float" />
      </div>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 tracking-tight animate-fade-in-up [animation-delay:200ms]">
        Navalha <span className="text-primary-blue">Digital</span>
      </h1>
      <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-10 max-w-3xl mx-auto animate-fade-in-up [animation-delay:400ms]">
        A plataforma definitiva para agendamento em barbearias. Simples para o cliente, poderosa para o seu negócio.
      </p>
      <div className="flex flex-col md:flex-row justify-center items-center gap-3 w-full animate-fade-in-up [animation-delay:600ms]">
        <ReactRouterDOM.Link to="/client/find-barbershops" className="w-full max-w-[90%] md:w-auto">
          <Button size="lg" variant="primary" leftIcon={<span className="material-icons-outlined">calendar_today</span>} fullWidth>
            Quero Agendar
          </Button>
        </ReactRouterDOM.Link>
        <ReactRouterDOM.Link to="/signup/barbershop" className="w-full max-w-[90%] md:w-auto">
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-text-dark" leftIcon={<span className="material-icons-outlined">content_cut</span>} fullWidth>
            Sou uma Barbearia
          </Button>
        </ReactRouterDOM.Link>
      </div>
       {showInstallButton && (
            <div className="mt-6 animate-fade-in-up [animation-delay:800ms]">
                <Button
                    size="md"
                    variant="ghost"
                    className="text-white hover:bg-white/20 backdrop-blur-sm"
                    leftIcon={<span className="material-icons-outlined">download</span>}
                    onClick={onInstallClick}
                >
                    Instalar Aplicativo
                </Button>
            </div>
        )}
    </div>
  </section>
);

const FeaturesSection = () => (
  <section id="features" className="py-16 md:py-20 bg-surface dark:bg-gray-900">
    <div className="container mx-auto px-6">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-text-dark dark:text-gray-100">Tudo que você precisa para <span className="text-primary-blue">decolar</span></h2>
        <p className="text-md text-text-light dark:text-gray-400 mt-2 max-w-3xl mx-auto">Funcionalidades inteligentes para gestão e crescimento.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-transform hover:-translate-y-2">
          <span className="material-icons-outlined text-4xl text-primary-blue mb-4">event_available</span>
          <h3 className="font-bold text-xl mb-2 text-text-dark dark:text-gray-100">Agenda Online</h3>
          <p className="text-sm text-text-light dark:text-gray-400">Permita que seus clientes agendem 24/7, diminuindo no-shows com lembretes automáticos.</p>
        </div>
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-transform hover:-translate-y-2">
          <span className="material-icons-outlined text-4xl text-primary-blue mb-4">dashboard_customize</span>
          <h3 className="font-bold text-xl mb-2 text-text-dark dark:text-gray-100">Painel de Gestão</h3>
          <p className="text-sm text-text-light dark:text-gray-400">Controle sua equipe, serviços e veja relatórios de faturamento em um só lugar.</p>
        </div>
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-transform hover:-translate-y-2">
          <span className="material-icons-outlined text-4xl text-primary-blue mb-4">star</span>
          <h3 className="font-bold text-xl mb-2 text-text-dark dark:text-gray-100">Visibilidade PRO</h3>
          <p className="text-sm text-text-light dark:text-gray-400">Destaque sua barbearia nas buscas, atraia mais clientes e aumente seu faturamento.</p>
        </div>
      </div>
      <div className="text-center mt-12">
        <ReactRouterDOM.Link to="/features">
          <Button size="lg" variant="outline">Conhecer Todas as Funcionalidades</Button>
        </ReactRouterDOM.Link>
      </div>
    </div>
  </section>
);

const ProBadge: React.FC<{className?: string}> = ({className}) => (
    <div className={`absolute top-0 right-4 bg-gradient-to-br from-amber-400 to-yellow-500 text-white px-3 py-1 rounded-b-lg shadow-lg flex items-center text-xs font-bold z-10 ${className}`}>
        <span className="material-icons-outlined text-sm mr-1">star</span>
        PRO
    </div>
);

const BarbershopShowcaseCard: React.FC<{ barbershop: BarbershopSearchResultItem }> = ({ barbershop }) => {
    const isPro = barbershop.subscriptionTier === SubscriptionPlanTier.PRO;
    return (
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:scale-105">
            {isPro && <ProBadge />}
            <div className="h-40 bg-cover bg-center">
                <img src={barbershop.coverImageUrl || 'https://source.unsplash.com/400x300/?barbershop'} alt={`${barbershop.name} cover`} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="p-5">
                <div className="flex items-end -mt-12 mb-3">
                    <img src={barbershop.logoUrl || NAVALHA_LOGO_URL} alt={`${barbershop.name} logo`} className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-md bg-white flex-shrink-0" loading="lazy"/>
                    <div className="ml-3 flex-1 pb-1">
                        <h3 className="text-lg font-bold text-text-dark dark:text-gray-100 truncate">{barbershop.name}</h3>
                         {barbershop.reviewCount > 0 && (
                            <div className="flex items-center">
                                <StarRating value={barbershop.averageRating} isEditable={false} size={16} />
                                <span className="text-xs text-text-light dark:text-gray-400 ml-1.5">({barbershop.averageRating.toFixed(1)})</span>
                            </div>
                         )}
                    </div>
                </div>
                <p className="text-xs text-text-light dark:text-gray-400 truncate mb-4 h-8" title={barbershop.address}>{barbershop.address}</p>
                <ReactRouterDOM.Link to={`/barbershop/${barbershop.id}`}>
                    <Button variant="primary" fullWidth size="sm">Ver e Agendar</Button>
                </ReactRouterDOM.Link>
            </div>
        </div>
    );
};

const BarbershopShowcaseSection: React.FC<{isLoggedIn: boolean}> = ({ isLoggedIn }) => {
    const [publicBarbershops, setPublicBarbershops] = useState<BarbershopSearchResultItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if(isLoggedIn) return; // Don't show this section if user is logged in
        const fetchData = async () => {
            setLoading(true);
            try {
                // Use the mock apiService to fetch data
                const shops = await mockGetPublicBarbershops();
                // The mock API already sorts PRO first, so we just take the top 3 for the showcase
                setPublicBarbershops(shops.slice(0, 3));
            } catch (error) {
                console.error("Error fetching public barbershops:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isLoggedIn]);

    if (isLoggedIn) return null;
  
    return (
        <section id="barbershops" className="py-16 md:py-20 bg-white dark:bg-gray-900">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-text-dark dark:text-gray-100">Encontre Barbearias <span className="text-primary-blue">Incríveis</span></h2>
                    <p className="text-md text-text-light dark:text-gray-400 mt-2">Descubra os melhores profissionais perto de você.</p>
                </div>
                {loading ? <LoadingSpinner label="Carregando barbearias..." /> : (
                    publicBarbershops.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {publicBarbershops.map(shop => (
                                <BarbershopShowcaseCard key={shop.id} barbershop={shop} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-text-light dark:text-gray-400">Nenhuma barbearia para exibir no momento.</p>
                    )
                )}
                 <div className="text-center mt-12">
                    <ReactRouterDOM.Link to="/client/find-barbershops">
                        <Button variant="outline" size="lg">Ver Todas as Barbearias</Button>
                    </ReactRouterDOM.Link>
                </div>
            </div>
        </section>
    );
}

const CheckIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
  </svg>
);

const SimplePlanCard: React.FC<{plan: SubscriptionPlan}> = ({plan}) => {
    const isPro = plan.id === 'pro';
    return (
        <div className={`p-6 rounded-xl shadow-xl border-2 flex flex-col justify-between transition-all duration-300
                     ${isPro ? 'border-primary-blue bg-light-blue dark:bg-primary-blue/20' : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 hover:shadow-2xl hover:border-primary-blue/50'}`}>
          <div>
            <h3 className={`text-2xl font-bold mb-2 ${isPro ? 'text-primary-blue' : 'text-primary-blue'}`}>{plan.name}</h3>
            <p className={`text-3xl font-extrabold mb-1 ${isPro ? 'text-primary-blue' : 'text-text-dark dark:text-gray-100'}`}>
              R$ {plan.price.toFixed(2).replace('.', ',')}
              {plan.price > 0 && <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/mês</span>}
            </p>
            
            <ul className="space-y-2 my-6 text-sm text-gray-700 dark:text-gray-300">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckIcon className="text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <ReactRouterDOM.Link to="/signup/barbershop" className="block mt-auto">
             <Button 
                className="w-full"
                variant={isPro ? 'primary' : 'outline'}
                size="md"
              >
                {isPro ? 'Assinar PRO' : 'Começar Grátis'}
              </Button>
          </ReactRouterDOM.Link>
        </div>
    );
};

const PricingSection = () => (
    <section id="plans" className="py-16 md:py-20 bg-surface dark:bg-gray-900">
        <div className="container mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-text-dark dark:text-gray-100">Comece a usar agora mesmo</h2>
                <p className="text-md text-text-light dark:text-gray-400 mt-2 max-w-2xl mx-auto">Um plano para cada etapa do seu negócio. Comece grátis, sem compromisso.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {SUBSCRIPTION_PLANS.map(plan => <SimplePlanCard key={plan.id} plan={plan} />)}
            </div>
             <div className="text-center mt-12">
                <ReactRouterDOM.Link to="/plans">
                    <Button size="lg" variant="ghost" className="text-primary-blue hover:bg-light-blue dark:hover:bg-primary-blue/20">
                        Comparar todos os recursos
                        <span className="material-icons-outlined text-sm ml-2">arrow_forward</span>
                    </Button>
                </ReactRouterDOM.Link>
            </div>
        </div>
    </section>
);


const HowItWorksSection = () => (
    <section id="how-it-works" className="py-16 md:py-20 bg-white dark:bg-dark-bg">
        <div className="container mx-auto px-6">
             <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-text-dark dark:text-gray-100">Como Funciona em <span className="text-primary-blue">4 Passos</span></h2>
                <p className="text-md text-text-light dark:text-gray-400 mt-2">Agendar seu próximo corte nunca foi tão fácil.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-12">
                <div className="relative order-2 md:order-1">
                    <img src="https://iili.io/FRKGVvs.png" alt="Celular mostrando o app Navalha Digital" className="max-w-xs mx-auto md:animate-subtle-float" loading="lazy" />
                </div>
                <div className="space-y-8 order-1 md:order-2">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-light-blue dark:bg-primary-blue/20 text-primary-blue dark:text-blue-300 flex items-center justify-center font-bold text-xl ring-8 ring-white dark:ring-dark-bg">1</div>
                        <div className="ml-4">
                            <h4 className="font-bold text-text-dark dark:text-gray-100">Cadastre-se ou Faça Login</h4>
                            <p className="text-sm text-text-light dark:text-gray-400">Crie sua conta em segundos para salvar suas preferências e agendamentos.</p>
                        </div>
                    </div>
                     <div className="flex items-start">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-light-blue dark:bg-primary-blue/20 text-primary-blue dark:text-blue-300 flex items-center justify-center font-bold text-xl ring-8 ring-white dark:ring-dark-bg">2</div>
                        <div className="ml-4">
                            <h4 className="font-bold text-text-dark dark:text-gray-100">Encontre Sua Barbearia</h4>
                            <p className="text-sm text-text-light dark:text-gray-400">Busque por nome, localização ou veja nossas sugestões de barbearias PRO.</p>
                        </div>
                    </div>
                     <div className="flex items-start">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-light-blue dark:bg-primary-blue/20 text-primary-blue dark:text-blue-300 flex items-center justify-center font-bold text-xl ring-8 ring-white dark:ring-dark-bg">3</div>
                        <div className="ml-4">
                            <h4 className="font-bold text-text-dark dark:text-gray-100">Agende o Serviço</h4>
                            <p className="text-sm text-text-light dark:text-gray-400">Escolha o serviço, o profissional, a data e o horário que preferir. Tudo online.</p>
                        </div>
                    </div>
                     <div className="flex items-start">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-light-blue dark:bg-primary-blue/20 text-primary-blue dark:text-blue-300 flex items-center justify-center font-bold text-xl ring-8 ring-white dark:ring-dark-bg">4</div>
                        <div className="ml-4">
                            <h4 className="font-bold text-text-dark dark:text-gray-100">Compareça e Avalie</h4>
                            <p className="text-sm text-text-light dark:text-gray-400">Vá até a barbearia na hora marcada e, depois, deixe sua avaliação para ajudar a comunidade.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);


const CTASection = () => (
    <section className="py-16 md:py-20 bg-primary-blue text-white">
        <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto para modernizar seu negócio?</h2>
            <p className="text-lg text-blue-200 mb-8 max-w-2xl mx-auto">
                Junte-se a centenas de barbearias que já estão transformando sua gestão com o Navalha Digital.
            </p>
            <ReactRouterDOM.Link to="/signup/barbershop">
                <Button size="lg" className="bg-white text-primary-blue hover:bg-light-blue transform hover:scale-105">Cadastrar Minha Barbearia Agora</Button>
            </ReactRouterDOM.Link>
        </div>
    </section>
);

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = useCallback(() => {
    if (!installPrompt) {
        return;
    }
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: { outcome: 'accepted' | 'dismissed' }) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        setInstallPrompt(null);
    });
  }, [installPrompt]);
  
  return (
    <div className="bg-white dark:bg-dark-bg">
      <HeroSection onInstallClick={handleInstallClick} showInstallButton={!!installPrompt} />
      <FeaturesSection />
      <BarbershopShowcaseSection isLoggedIn={!!user} />
      <PricingSection />
      <HowItWorksSection />
      <CTASection />
    </div>
  );
};

export default HomePage;