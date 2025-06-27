import React from 'react';
import { SubscriptionPlan, BarbershopSubscription } from '../types';
import Button from './Button';
import { SUBSCRIPTION_PLANS } from '../constants';

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  currentSubscription?: BarbershopSubscription | null;
  onSelectPlan: (planId: SubscriptionPlan['id']) => void;
  isProcessing?: boolean; // True if this specific plan is being processed
}

const CheckIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
  </svg>
);


const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({ plan, currentSubscription, onSelectPlan, isProcessing }) => {
  const isCurrentActivePlan = currentSubscription?.planId === plan.id && currentSubscription?.status === 'active';
  const currentPlanDetails = currentSubscription 
    ? SUBSCRIPTION_PLANS.find(p => p.id === currentSubscription.planId)
    : null; // Can be null if no subscription yet, or free tier assumed

  let buttonText = 'Selecionar Plano';
  if (currentPlanDetails) {
    if (currentPlanDetails.price > plan.price && plan.price !== 0) {
      buttonText = 'Fazer Downgrade';
    } else if (currentPlanDetails.price < plan.price) {
      buttonText = 'Fazer Upgrade';
    }
  }
   if (plan.price === 0 && currentPlanDetails && currentPlanDetails.price > 0) {
     buttonText = 'Mudar para Grátis';
   }


  return (
    <div className={`p-6 rounded-xl shadow-xl border-2 flex flex-col justify-between transition-all duration-300
                     ${isCurrentActivePlan ? 'border-primary-blue bg-light-blue scale-105 ring-2 ring-primary-blue ring-offset-2' 
                                       : 'border-gray-200 bg-white hover:shadow-2xl hover:border-primary-blue/50'}`}>
      <div>
        <h3 className={`text-2xl font-bold mb-2 ${isCurrentActivePlan ? 'text-primary-blue' : 'text-primary-blue'}`}>{plan.name}</h3>
        <p className={`text-3xl font-extrabold mb-1 ${isCurrentActivePlan ? 'text-primary-blue' : 'text-text-dark'}`}>
          R$ {plan.price.toFixed(2).replace('.', ',')}
          {plan.price > 0 && <span className="text-sm font-normal text-gray-500">/mês</span>}
        </p>
        {plan.price === 0 && <p className="text-sm text-gray-500 mb-4">&nbsp;</p>} 
        {plan.price > 0 && <p className="text-sm text-gray-500 mb-4">Cobrado mensalmente</p>}
        
        <ul className="space-y-2 mb-6 text-sm text-gray-700">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckIcon className="text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto">
        {isCurrentActivePlan ? (
          <div className="text-center py-2.5 px-4 bg-primary-blue text-white rounded-md font-semibold text-base">Plano Atual</div>
        ) : (
          <Button 
            onClick={() => onSelectPlan(plan.id)}
            className="w-full"
            variant={ (currentPlanDetails && currentPlanDetails.price < plan.price) || !currentPlanDetails ? 'primary' : 'outline'}
            size="md"
            isLoading={isProcessing}
            disabled={isProcessing || (currentSubscription?.status === 'past_due' && plan.id === currentSubscription.planId)} // Disable if trying to select current past_due plan
          >
            {buttonText}
          </Button>
        )}
        {currentSubscription && currentSubscription.planId === plan.id && currentSubscription.status !== 'active' && (
          <p className={`text-center mt-2 text-xs font-medium ${
            currentSubscription.status === 'past_due' ? 'text-red-600' :
            currentSubscription.status === 'cancelled' ? 'text-yellow-600' :
            'text-gray-500'
          }`}>
            Status: {currentSubscription.status === 'past_due' ? 'Pagamento Pendente' : 
                     currentSubscription.status === 'cancelled' ? 'Cancelado' : currentSubscription.status}
          </p>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPlanCard;