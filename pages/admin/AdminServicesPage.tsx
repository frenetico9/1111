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

// Define a type for the form values, excluding properties managed by the backend
type ServiceFormData = Omit<Service, 'id' | 'barbershopId'>;

const AdminServicesPage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentServiceId, setCurrentServiceId] = useState<string | null>(null); // Store only ID

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

  if (loading && services.length === 0) return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-blue">Gerenciar Serviços</h1>
        <div className="flex flex-wrap gap-2">
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
              isAdminView={true}
              onEdit={() => handleOpenModal(service)}
              onToggleActive={() => handleToggleActive(service.id, service.isActive)}
            />
          ))}
        </div>
      )}

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