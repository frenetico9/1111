import React, { useEffect, useState, useCallback } from 'react';
import { ClientLoyaltyStatus } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { mockGetClientLoyaltyStatus } from '../../services/mockApiService';
import LoadingSpinner from '../../components/LoadingSpinner';
import * as ReactRouterDOM from 'react-router-dom';
import Button from '../../components/Button';

const LOYALTY_GOAL = 10;

const LoyaltyCard: React.FC<{ status: ClientLoyaltyStatus }> = ({ status }) => {
  const progressPercentage = (status.completedCount % LOYALTY_GOAL) / LOYALTY_GOAL * 100;
  const isComplete = status.completedCount > 0 && status.completedCount % LOYALTY_GOAL === 0;
  const currentCount = isComplete ? LOYALTY_GOAL : status.completedCount % LOYALTY_GOAL;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-light-blue p-5 transition-all hover:shadow-xl hover:border-primary-blue">
      <div className="flex items-center mb-4">
        <img 
          src={status.barbershopLogoUrl || 'https://i.imgur.com/OViX73g.png'} 
          alt={`${status.barbershopName} logo`}
          className="w-12 h-12 rounded-full mr-4 object-cover"
        />
        <div>
          <h3 className="font-bold text-primary-blue text-lg">{status.barbershopName}</h3>
          <p className="text-sm text-text-light">{currentCount} de {LOYALTY_GOAL} agendamentos concluídos</p>
        </div>
      </div>
      
      <div className="grid grid-cols-5 gap-2 mb-4">
        {Array.from({ length: LOYALTY_GOAL }).map((_, index) => (
          <div key={index} className={`w-full aspect-square rounded-full flex items-center justify-center transition-all duration-500
            ${index < currentCount ? 'bg-primary-blue transform scale-110' : 'bg-gray-200'}
          `}>
            <span className="material-icons-outlined text-white">
              {index < currentCount ? 'check' : ''}
            </span>
          </div>
        ))}
      </div>

      {isComplete && (
        <div className="bg-accent-gold/20 text-yellow-800 p-3 rounded-lg text-center font-semibold text-sm animate-fade-in-up">
          <span className="material-icons-outlined mr-1 align-bottom">emoji_events</span>
          Parabéns! Você ganhou um prêmio. Mostre esta tela na barbearia.
        </div>
      )}
    </div>
  );
};

const ClientLoyaltyPage: React.FC = () => {
  const { user } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState<ClientLoyaltyStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLoyaltyData = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const data = await mockGetClientLoyaltyStatus(user.id);
        setLoyaltyData(data);
      } catch (error) {
        console.error("Erro ao buscar dados de fidelidade:", error);
        // Optionally add a notification
      } finally {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchLoyaltyData();
  }, [fetchLoyaltyData]);

  if (loading) {
    return <LoadingSpinner size="lg" label="Carregando seus cartões fidelidade..." />;
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-primary-blue mb-8">Programa de Fidelidade</h1>
      
      {loyaltyData.length === 0 ? (
        <div className="text-center py-10 bg-white shadow-xl rounded-lg border border-light-blue">
          <span className="material-icons-outlined text-6xl text-primary-blue/50 mb-4">card_giftcard</span>
          <p className="text-xl text-gray-600 mb-4">Você ainda não tem cartões de fidelidade.</p>
          <p className="text-sm text-gray-500 mb-6">Seus cartões aparecerão aqui conforme você completa agendamentos nas barbearias.</p>
          <ReactRouterDOM.Link to="/client/find-barbershops">
            <Button variant="primary" size="lg">Encontrar uma Barbearia</Button>
          </ReactRouterDOM.Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loyaltyData.map(status => (
            <LoyaltyCard key={status.barbershopId} status={status} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientLoyaltyPage;
