import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { NAVALHA_LOGO_URL, SUBSCRIPTION_PLANS } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { BarbershopSearchResultItem, SubscriptionPlan, SubscriptionPlanTier } from '../types';
import { mockGetPublicBarbershops } from '../services/mockApiService';
import LoadingSpinner from '../components/LoadingSpinner';
import StarRating from '../components/StarRating';

// --- Sub-components for HomePage ---

const HeroSection = () => (
  <section className="relative bg-dark-bg text-white overflow-hidden">
    <div className="absolute inset-0">
      <img src="https://i.imgur.com/LSorq3R.png" alt="Barbeiro trabalhando" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/70"></div>
    </div>
    <div className="relative container mx-auto px-6 py-24 md:py-32 text-center z-10">
      <div className="flex justify-center mb-6 animate-fade-in-up">
        <img src={NAVALHA_LOGO_URL} alt="Navalha Digital Logo" className="w-48 h-48 filter drop-shadow-lg animate-subtle-float" />
      </div>
      <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight animate-fade-in-up [animation-delay:200ms]">
        Navalha <span className="text-primary-blue">Digital</span>
      </h1>
      <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-3xl mx-auto animate-fade-in-up [animation-delay:400ms]">
        A plataforma definitiva para agendamento em barbearias. Simples para o cliente, poderosa para o seu negócio.
      </p>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 animate-fade-in-up [animation-delay:600ms]">
        <Link to="/signup/client">
          <Button size="lg" variant="primary" leftIcon={<span className="material-icons-outlined">calendar_today</span>}>
            Quero Agendar
          </Button>
        </Link>
        <Link to="/signup/barbershop">
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-text-dark" leftIcon={<span className="material-icons-outlined">content_cut</span>}>
            Sou uma Barbearia
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

const FeaturesSection = () => (
  <section id="features" className="py-20 bg-surface">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-text-dark">Tudo que você precisa para <span className="text-primary-blue">decolar</span></h2>
        <p className="text-md text-text-light mt-2 max-w-3xl mx-auto">Funcionalidades inteligentes para gestão e crescimento.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg transition-transform hover:-translate-y-2">
          <span className="material-icons-outlined text-4xl text-primary-blue mb-4">event_available</span>
          <h3 className="font-bold text-xl mb-2">Agenda Online</h3>
          <p className="text-sm text-text-light">Permita que seus clientes agendem 24/7, diminuindo no-shows com lembretes automáticos.</p>
        </div>
        <div className="text-center p-6 bg-white rounded-lg shadow-lg transition-transform hover:-translate-y-2">
          <span className="material-icons-outlined text-4xl text-primary-blue mb-4">dashboard_customize</span>
          <h3 className="font-bold text-xl mb-2">Painel de Gestão</h3>
          <p className="text-sm text-text-light">Controle sua equipe, serviços e veja relatórios de faturamento em um só lugar.</p>
        </div>
        <div className="text-center p-6 bg-white rounded-lg shadow-lg transition-transform hover:-translate-y-2">
          <span className="material-icons-outlined text-4xl text-primary-blue mb-4">star</span>
          <h3 className="font-bold text-xl mb-2">Visibilidade PRO</h3>
          <p className="text-sm text-text-light">Destaque sua barbearia nas buscas, atraia mais clientes e aumente seu faturamento.</p>
        </div>
      </div>
      <div className="text-center mt-12">
        <Link to="/features">
          <Button size="lg" variant="outline">Conhecer Todas as Funcionalidades</Button>
        </Link>
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
        <div className="relative bg-white rounded-xl shadow-lg overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:scale-105">
            {isPro && <ProBadge />}
            <div className="h-40 bg-cover bg-center" style={{backgroundImage: `url(${barbershop.coverImageUrl || 'https://source.unsplash.com/400x300/?barbershop'})`}}></div>
            <div className="p-5">
                <div className="flex items-end -mt-12 mb-3">
                    <img src={barbershop.logoUrl || NAVALHA_LOGO_URL} alt={`${barbershop.name} logo`} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md bg-white flex-shrink-0"/>
                    <div className="ml-3 flex-1 pb-1">
                        <h3 className="text-lg font-bold text-text-dark truncate">{barbershop.name}</h3>
                         {barbershop.reviewCount > 0 && (
                            <div className="flex items-center">
                                <StarRating value={barbershop.averageRating} isEditable={false} size={16} />
                                <span className="text-xs text-text-light ml-1.5">({barbershop.averageRating.toFixed(1)})</span>
                            </div>
                         )}
                    </div>
                </div>
                <p className="text-xs text-text-light truncate mb-4 h-8" title={barbershop.address}>{barbershop.address}</p>
                <Link to={`/barbershop/${barbershop.id}`}>
                    <Button variant="primary" fullWidth size="sm">Ver e Agendar</Button>
                </Link>
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
        <section id="barbershops" className="py-20 bg-white">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-text-dark">Encontre Barbearias <span className="text-primary-blue">Incríveis</span></h2>
                    <p className="text-md text-text-light mt-2">Descubra os melhores profissionais perto de você.</p>
                </div>
                {loading ? <LoadingSpinner label="Carregando barbearias..." /> : (
                    publicBarbershops.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {publicBarbershops.map(shop => (
                                <BarbershopShowcaseCard key={shop.id} barbershop={shop} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-text-light">Nenhuma barbearia para exibir no momento.</p>
                    )
                )}
                 <div className="text-center mt-12">
                    <Link to="/client/find-barbershops">
                        <Button variant="outline" size="lg">Ver Todas as Barbearias</Button>
                    </Link>
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
                     ${isPro ? 'border-primary-blue bg-light-blue' : 'border-gray-200 bg-white hover:shadow-2xl hover:border-primary-blue/50'}`}>
          <div>
            <h3 className={`text-2xl font-bold mb-2 ${isPro ? 'text-primary-blue' : 'text-primary-blue'}`}>{plan.name}</h3>
            <p className={`text-3xl font-extrabold mb-1 ${isPro ? 'text-primary-blue' : 'text-text-dark'}`}>
              R$ {plan.price.toFixed(2).replace('.', ',')}
              {plan.price > 0 && <span className="text-sm font-normal text-gray-500">/mês</span>}
            </p>
            
            <ul className="space-y-2 my-6 text-sm text-gray-700">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckIcon className="text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <Link to="/signup/barbershop" className="block mt-auto">
             <Button 
                className="w-full"
                variant={isPro ? 'primary' : 'outline'}
                size="md"
              >
                {isPro ? 'Assinar PRO' : 'Começar Grátis'}
              </Button>
          </Link>
        </div>
    );
};

const PricingSection = () => (
    <section id="plans" className="py-20 bg-surface">
        <div className="container mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-text-dark">Comece a usar agora mesmo</h2>
                <p className="text-md text-text-light mt-2 max-w-2xl mx-auto">Um plano para cada etapa do seu negócio. Comece grátis, sem compromisso.</p>
            </div>
            <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {SUBSCRIPTION_PLANS.map(plan => <SimplePlanCard key={plan.id} plan={plan} />)}
            </div>
             <div className="text-center mt-12">
                <Link to="/plans">
                    <Button size="lg" variant="ghost" className="text-primary-blue hover:bg-light-blue">
                        Comparar todos os recursos
                        <span className="material-icons-outlined text-sm ml-2">arrow_forward</span>
                    </Button>
                </Link>
            </div>
        </div>
    </section>
);


const HowItWorksSection = () => (
    <section id="how-it-works" className="py-20 bg-white">
        <div className="container mx-auto px-6">
             <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-text-dark">Como Funciona em <span className="text-primary-blue">4 Passos</span></h2>
                <p className="text-md text-text-light mt-2">Agendar seu próximo corte nunca foi tão fácil.</p>
            </div>
            <div className="grid md:grid-cols-2 items-center gap-12">
                <div className="relative">
                    <img src="https://iili.io/FRKGVvs.png" alt="Celular mostrando o app Navalha Digital" className="max-w-xs mx-auto animate-subtle-float" />
                </div>
                <div className="space-y-8">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-light-blue text-primary-blue flex items-center justify-center font-bold text-xl ring-8 ring-white">1</div>
                        <div className="ml-4">
                            <h4 className="font-bold text-text-dark">Cadastre-se ou Faça Login</h4>
                            <p className="text-sm text-text-light">Crie sua conta em segundos para salvar suas preferências e agendamentos.</p>
                        </div>
                    </div>
                     <div className="flex items-start">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-light-blue text-primary-blue flex items-center justify-center font-bold text-xl ring-8 ring-white">2</div>
                        <div className="ml-4">
                            <h4 className="font-bold text-text-dark">Encontre Sua Barbearia</h4>
                            <p className="text-sm text-text-light">Busque por nome, localização ou veja nossas sugestões de barbearias PRO.</p>
                        </div>
                    </div>
                     <div className="flex items-start">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-light-blue text-primary-blue flex items-center justify-center font-bold text-xl ring-8 ring-white">3</div>
                        <div className="ml-4">
                            <h4 className="font-bold text-text-dark">Agende o Serviço</h4>
                            <p className="text-sm text-text-light">Escolha o serviço, o profissional, a data e o horário que preferir. Tudo online.</p>
                        </div>
                    </div>
                     <div className="flex items-start">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-light-blue text-primary-blue flex items-center justify-center font-bold text-xl ring-8 ring-white">4</div>
                        <div className="ml-4">
                            <h4 className="font-bold text-text-dark">Compareça e Avalie</h4>
                            <p className="text-sm text-text-light">Vá até a barbearia na hora marcada e, depois, deixe sua avaliação para ajudar a comunidade.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);


const CTASection = () => (
    <section className="py-20 bg-primary-blue text-white">
        <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto para modernizar seu negócio?</h2>
            <p className="text-lg text-blue-200 mb-8 max-w-2xl mx-auto">
                Junte-se a centenas de barbearias que já estão transformando sua gestão com o Navalha Digital.
            </p>
            <Link to="/signup/barbershop">
                <Button size="lg" className="bg-white text-primary-blue hover:bg-light-blue transform hover:scale-105">Cadastrar Minha Barbearia Agora</Button>
            </Link>
        </div>
    </section>
);

const HomePage: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="bg-white">
      <HeroSection />
      <FeaturesSection />
      <BarbershopShowcaseSection isLoggedIn={!!user} />
      <PricingSection />
      <HowItWorksSection />
      <CTASection />
    </div>
  );
};

export default HomePage;