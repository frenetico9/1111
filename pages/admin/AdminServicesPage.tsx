import React, { useEffect, useState, useCallback } from 'react';
import { Service } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { mockGetServicesForBarbershop, mockAddService, mockUpdateService, mockToggleServiceActive } from '../../services/mockApiService';
import ServiceCard from '../../components/ServiceCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useForm } from '../../hooks/useForm';
import { useNotification } from '../../contexts/NotificationContext';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

// Define a type for the form values, excluding properties managed by the backend
type ServiceFormData = Omit<Service, 'id' | 'barbershopId'>;

interface AIServiceSuggestion {
  name: string;
  description: string;
  price: number;
  duration: number;
}


const AdminServicesPage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentServiceId, setCurrentServiceId] = useState<string | null>(null); // Store only ID

  // State for AI Assistant
  const [showAIModal, setShowAIModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<AIServiceSuggestion[]>([]);

  const initialServiceValues: ServiceFormData = {
    name: '',
    price: 0,
    duration: 30, // Default duration
    isActive: true,
    description: '',
  };

  const { values, errors, handleChange, handleSubmit, setValues, resetForm, isSubmitting } = useForm<ServiceFormData>({
    initialValues: initialServiceValues,
    onSubmit: async (formValues) => {
      if (!user) return;
      try {
        if (isEditing && currentServiceId) {
          await mockUpdateService(currentServiceId, { ...formValues, barbershopId: user.id }); // Pass barbershopId
          addNotification({ message: 'Serviço atualizado com sucesso!', type: 'success' });
        } else {
          await mockAddService({ ...formValues, barbershopId: user.id }); // Pass barbershopId
          addNotification({ message: 'Serviço adicionado com sucesso!', type: 'success' });
        }
        fetchServices();
        setShowModal(false);
      } catch (error) {
        addNotification({ message: `Erro ao salvar serviço: ${(error as Error).message}`, type: 'error' });
      }
    },
    validate: (formValues) => {
      const newErrors: Partial<Record<keyof ServiceFormData, string>> = {};
      if (!formValues.name.trim()) newErrors.name = 'Nome do serviço é obrigatório.';
      if (formValues.price <= 0) newErrors.price = 'Preço deve ser um valor positivo.';
      if (formValues.duration <= 0) newErrors.duration = 'Duração deve ser um valor positivo.';
      return newErrors;
    },
  });

  const fetchServices = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const fetchedServices = await mockGetServicesForBarbershop(user.id);
        // Sort services: active first, then by name
        fetchedServices.sort((a, b) => {
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return a.name.localeCompare(b.name);
        });
        setServices(fetchedServices);
      } catch (error) {
        addNotification({ message: 'Erro ao buscar serviços.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  }, [user, addNotification]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setIsEditing(true);
      setCurrentServiceId(service.id); // Store ID
      setValues({ // Set form values from the service
        name: service.name,
        price: service.price,
        duration: service.duration,
        isActive: service.isActive,
        description: service.description || '',
      });
    } else {
      setIsEditing(false);
      setCurrentServiceId(null);
      resetForm(); // Resets to initialServiceValues
    }
    setShowModal(true);
  };

  const handleToggleActive = async (serviceId: string, currentIsActive: boolean) => {
    try {
      await mockToggleServiceActive(serviceId, !currentIsActive); // Send the new state
      addNotification({ message: `Serviço ${!currentIsActive ? 'ativado' : 'desativado'} com sucesso.`, type: 'success' });
      fetchServices(); // Re-fetch to confirm and re-sort
    } catch (error) {
      addNotification({ message: 'Erro ao alterar status do serviço.', type: 'error' });
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!aiPrompt.trim()) {
      addNotification({ message: 'Por favor, descreva o tipo de serviço que você busca.', type: 'warning' });
      return;
    }
    setIsGenerating(true);
    setAiSuggestions([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const prompt = `Com base na seguinte descrição: '${aiPrompt}', gere uma lista de 3 a 5 sugestões de serviços para uma barbearia. As sugestões devem ser criativas e adequadas ao público descrito. Para cada sugestão, inclua um nome, uma breve descrição, um preço sugerido (como um número) e uma duração em minutos (múltiplo de 15). Retorne a resposta como um array de objetos JSON válidos. O JSON deve ter o seguinte formato: [{"name": "string", "description": "string", "price": number, "duration": number}, ...]`;
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      let jsonStr = response.text.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }

      try {
        const parsedSuggestions: AIServiceSuggestion[] = JSON.parse(jsonStr);
        setAiSuggestions(parsedSuggestions);
      } catch (e) {
        console.error("Failed to parse JSON response:", e, "\nRaw response:", jsonStr);
        addNotification({ message: 'A IA retornou uma resposta em um formato inesperado. Tente novamente.', type: 'error' });
      }

    } catch (error) {
      console.error("Gemini API error:", error);
      addNotification({ message: `Erro ao gerar sugestões: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSuggestedService = (suggestion: AIServiceSuggestion) => {
    setValues({
      name: suggestion.name,
      price: suggestion.price,
      duration: suggestion.duration,
      description: suggestion.description,
      isActive: true, // Default to active
    });
    setIsEditing(false);
    setCurrentServiceId(null);
    setShowAIModal(false);
    setShowModal(true);
  };

  if (loading && services.length === 0) return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-blue">Gerenciar Serviços</h1>
        <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowAIModal(true)} variant="outline" leftIcon={<span className="material-icons-outlined">auto_awesome</span>}>
              Sugerir com IA
            </Button>
            <Button onClick={() => handleOpenModal()} variant="primary" leftIcon={<span className="material-icons-outlined">add</span>}>
              Adicionar Serviço
            </Button>
        </div>
      </div>
      
      {services.length === 0 && !loading ? (
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
          <span className="material-icons-outlined text-6xl text-primary-blue/50 mb-4">cut</span>
          <p className="text-xl text-gray-600 mb-4">Nenhum serviço cadastrado ainda.</p>
          <p className="text-sm text-gray-500">Clique em "Adicionar Serviço" para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              barbershopId={user!.id} // user is guaranteed by ProtectedRoute
              isAdminView={true}
              onEdit={() => handleOpenModal(service)}
              onToggleActive={() => handleToggleActive(service.id, service.isActive)}
            />
          ))}
        </div>
      )}

      {/* AI Assistant Modal */}
      <Modal isOpen={showAIModal} onClose={() => setShowAIModal(false)} title="Assistente de IA para Serviços" size="2xl">
        <div className="space-y-4">
          <div>
            <label htmlFor="ai-prompt" className="block text-sm font-medium text-text-dark mb-1">Descreva o tipo de serviço que você busca:</label>
            <textarea
              id="ai-prompt"
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-blue focus:border-primary-blue text-sm shadow-sm"
              placeholder="Ex: 'serviços de luxo para barba', 'cortes modernos para jovens', 'tratamentos capilares relaxantes'"
              disabled={isGenerating}
            />
          </div>
          <Button onClick={handleGenerateSuggestions} isLoading={isGenerating}>Gerar Sugestões</Button>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            {isGenerating && <LoadingSpinner label="Gerando ideias..." />}
            {!isGenerating && aiSuggestions.length > 0 && (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="p-4 bg-light-blue rounded-lg shadow-sm">
                    <h4 className="font-bold text-primary-blue">{suggestion.name}</h4>
                    <p className="text-sm text-text-dark my-1">{suggestion.description}</p>
                    <div className="flex items-center text-xs text-text-light space-x-4">
                      <span>Preço Sugerido: <span className="font-semibold">R$ {suggestion.price.toFixed(2).replace('.', ',')}</span></span>
                      <span>Duração: <span className="font-semibold">{suggestion.duration} min</span></span>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      className="mt-2"
                      onClick={() => handleAddSuggestedService(suggestion)}
                    >
                      Adicionar este serviço
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {!isGenerating && aiSuggestions.length === 0 && aiPrompt && (
              <p className="text-center text-gray-500">Nenhuma sugestão gerada. Tente refinar sua descrição.</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Add/Edit Service Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? 'Editar Serviço' : 'Adicionar Novo Serviço'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nome do Serviço *" name="name" value={values.name} onChange={handleChange} error={errors.name} required disabled={isSubmitting} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Preço (R$) *" name="price" type="number" step="0.01" min="0.01" value={values.price.toString()} onChange={handleChange} error={errors.price} required disabled={isSubmitting} />
            <Input label="Duração (minutos) *" name="duration" type="number" min="1" value={values.duration.toString()} onChange={handleChange} error={errors.duration} required disabled={isSubmitting} />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrição (Opcional)</label>
            <textarea 
              name="description" 
              id="description"
              rows={3}
              value={values.description} 
              onChange={handleChange} 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-blue focus:border-primary-blue text-sm shadow-sm"
              disabled={isSubmitting}
            />
          </div>
           <div className="flex items-center mt-2">
            <input 
              type="checkbox" 
              name="isActive" 
              id="isActiveService" // Unique ID for label association
              checked={values.isActive} 
              onChange={handleChange} 
              className="h-4 w-4 text-primary-blue border-gray-300 rounded focus:ring-primary-blue"
              disabled={isSubmitting}
            />
            <label htmlFor="isActiveService" className="ml-2 block text-sm text-gray-900">Serviço Ativo (visível para clientes)</label>
          </div>
          <div className="pt-5 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>{isEditing ? 'Salvar Alterações' : 'Adicionar Serviço'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminServicesPage;