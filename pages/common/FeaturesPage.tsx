import React from 'react';
import Button from '../../components/Button';
import { Link } from 'react-router-dom';

const FeatureListItem: React.FC<{ title: string; description: string; iconName: string; }> = ({ title, description, iconName }) => (
    <div className="flex items-start p-4 transition-all duration-300 hover:bg-light-blue/50 rounded-lg">
        <div className="flex-shrink-0 w-12 h-12 bg-light-blue text-primary-blue rounded-full flex items-center justify-center ring-8 ring-white">
            <span className="material-icons-outlined text-2xl">{iconName}</span>
        </div>
        <div className="ml-4">
            <h4 className="text-lg font-bold text-text-dark">{title}</h4>
            <p className="mt-1 text-sm text-text-light">{description}</p>
        </div>
    </div>
);

const FeaturesPage: React.FC = () => {
  return (
    <div className="py-12 md:py-20 bg-white animate-fade-in-up">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-text-dark">Funcionalidades do <span className="text-primary-blue">Navalha Digital</span></h1>
          <p className="text-lg text-text-light mt-4 max-w-3xl mx-auto">
            Explore as ferramentas poderosas que projetamos para simplificar a gestão da sua barbearia e encantar seus clientes.
          </p>
        </div>
        <div className="flex flex-col items-center gap-16">
            <div className="w-full max-w-5xl">
                <img 
                    src="https://iili.io/FRK4loB.png" 
                    alt="Ecossistema Navalha Digital em diversos dispositivos" 
                    className="w-full h-auto rounded-xl shadow-2xl" 
                />
            </div>
            <div className="w-full grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                <FeatureListItem iconName="event_available" title="Agendamento Fácil 24/7" description="Seus clientes agendam online a qualquer hora, de qualquer lugar, escolhendo serviço, profissional e horário com conveniência total." />
                <FeatureListItem iconName="dashboard_customize" title="Painel de Gestão Completo" description="Administre sua agenda, equipe, serviços e finanças em um só lugar. Tenha o controle total do seu negócio na palma da sua mão." />
                <FeatureListItem iconName="notifications_active" title="Notificações Inteligentes" description="Reduza faltas com lembretes automáticos de agendamento via e-mail para seus clientes. Mantenha todos sincronizados." />
                <FeatureListItem iconName="storefront" title="Página Online Personalizável" description="Crie uma vitrine digital para sua barbearia, mostrando seus serviços, equipe e avaliações. Atraia novos clientes com uma presença online profissional." />
                <FeatureListItem iconName="insights" title="Relatórios e Análises" description="Acesse dados sobre faturamento, serviços mais populares e desempenho dos funcionários para tomar decisões estratégicas. (Plano PRO)" />
                <FeatureListItem iconName="groups" title="Gestão de Clientes (CRM)" description="Mantenha um histórico completo de seus clientes, incluindo agendamentos passados, preferências e observações importantes." />
                <FeatureListItem iconName="reviews" title="Gestão de Avaliações" description="Receba e responda às avaliações dos seus clientes, construindo confiança e melhorando seus serviços continuamente." />
            </div>
        </div>
        <div className="text-center mt-20">
            <h2 className="text-2xl font-bold text-text-dark">Pronto para começar?</h2>
            <p className="text-md text-text-light mt-2 mb-6">Junte-se a nós e transforme a gestão da sua barbearia.</p>
            <Link to="/plans">
                <Button size="lg" variant="primary">Ver Planos e Preços</Button>
            </Link>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;