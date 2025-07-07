

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { SUBSCRIPTION_PLANS } from '../../constants';
import SubscriptionPlanCard from '../../components/SubscriptionPlanCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { SubscriptionPlanTier } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import Modal from '../../components/Modal';
import Button from '../../components/Button';

const AdminSubscriptionPage: React.FC = () => {
  const { barbershopSubscription, updateSubscription, loading: authLoading } = useAuth();
  const { addNotification } = useNotification();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanTier | null>(null);

  const handleSelectPlan = (planId: SubscriptionPlanTier) => {
    setSelectedPlanId(planId);
    setShowConfirmModal(true);
  };
  
  const confirmSubscriptionChange = async () => {
    if (!selectedPlanId) return;
    
    setIsProcessing(true);
    setShowConfirmModal(false);
    
    // Simulate payment details collection or redirect
    const planToSubscribe = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId);
    if(planToSubscribe && planToSubscribe.price > 0) {
        // In a real app, you'd redirect to Stripe/MercadoPago or show a payment form.
        // For this mock, we'll just simulate a delay and success.
        addNotification({ message: `Processando assinatura do plano ${planToSubscribe.name}... (Simulado)`, type: 'info' });
        await new Promise(resolve => setTimeout(resolve, 2000)); 
    }

    const success = await updateSubscription(selectedPlanId);
    if (success) {
      addNotification({ message: 'Plano de assinatura alterado com sucesso!', type: 'success' });
    } else {
      addNotification({ message: 'Falha ao alterar o plano de assinatura.', type: 'error' });
    }
    setIsProcessing(false);
    setSelectedPlanId(null);
  };

  if (authLoading && !barbershopSubscription) return <div className="flex justify-center items-center h-screen"><LoadingSpinner size="lg" /></div>;

  const currentPlanDetails = barbershopSubscription 
    ? SUBSCRIPTION_PLANS.find(p => p.id === barbershopSubscription.planId)
    : SUBSCRIPTION_PLANS.find(p => p.id === SubscriptionPlanTier.FREE); // Default to free if no sub found

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary-blue mb-8">Gerenciar Assinatura</h1>

      {barbershopSubscription && currentPlanDetails && (
        <div className="mb-10 p-6 bg-light-blue rounded-xl shadow-lg border-2 border-primary-blue">
          <h2 className="text-2xl font-semibold text-primary-blue mb-2">Seu Plano Atual: {currentPlanDetails.name}</h2>
          <p className="text-gray-700">Status: <span className={`font-medium ${barbershopSubscription.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{barbershopSubscription.status}</span></p>
          {barbershopSubscription.nextBillingDate && (
             <p className="text-gray-600 text-sm">Próxima cobrança em: {new Date(barbershopSubscription.nextBillingDate).toLocaleDateString('pt-BR')}</p>
          )}
           {barbershopSubscription.status !== 'active' && barbershopSubscription.status !== 'cancelled' && (
             <p className="text-red-600 text-sm mt-1">Seu plano requer atenção. Verifique seus pagamentos.</p>
           )}
        </div>
      )}
      
      <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {SUBSCRIPTION_PLANS.map(plan => (
          <SubscriptionPlanCard 
            key={plan.id} 
            plan={plan} 
            currentSubscription={barbershopSubscription}
            onSelectPlan={handleSelectPlan}
            isProcessing={isProcessing && selectedPlanId === plan.id}
          />
        ))}
      </div>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => {setShowConfirmModal(false); setSelectedPlanId(null);}}
        title="Confirmar Mudança de Plano"
        footer={
          <>
            <Button variant="secondary" onClick={() => {setShowConfirmModal(false); setSelectedPlanId(null);}}>Cancelar</Button>
            <Button variant="primary" onClick={confirmSubscriptionChange} isLoading={isProcessing}>
              Confirmar
            </Button>
          </>
        }
      >
        <p>Você selecionou o plano <span className="font-bold text-primary-blue">{SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId)?.name}</span>.</p>
        <p className="mt-2">Tem certeza que deseja prosseguir com a alteração?</p>
        {(SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId)?.price || 0) > 0 && 
            <p className="mt-2 text-sm text-gray-600">A cobrança será feita no seu método de pagamento cadastrado (simulado).</p>
        }
        {selectedPlanId === SubscriptionPlanTier.FREE &&
            <p className="mt-2 text-sm text-yellow-700">Ao mudar para o plano gratuito, você perderá os benefícios do plano PRO no final do seu ciclo de faturamento atual.</p>
        }
      </Modal>

      {/* Subscription Management (Cancel, etc.) - Placeholder for more actions */}
      {barbershopSubscription && barbershopSubscription.planId !== SubscriptionPlanTier.FREE && barbershopSubscription.status === 'active' && (
        <div className="mt-12 p-6 bg-white rounded-lg shadow max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold text-gray-700 mb-3">Gerenciar Plano Atual</h3>
          <Button variant="danger" onClick={() => handleSelectPlan(SubscriptionPlanTier.FREE)}>
            Cancelar Assinatura PRO (Mudar para Grátis)
          </Button>
          <p className="text-xs text-gray-500 mt-2">O cancelamento será efetivado ao final do período de cobrança atual. Você voltará para o plano Grátis.</p>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionPage;