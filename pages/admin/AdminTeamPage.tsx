import React, { useEffect, useState, useCallback, ChangeEvent } from 'react';
import { Barber, Service } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { mockGetBarbersForBarbershop, mockAddBarber, mockUpdateBarber, mockDeleteBarber, mockGetServicesForBarbershop } from '../../services/mockApiService';
import BarberCard from '../../components/BarberCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useForm } from '../../hooks/useForm';
import { useNotification } from '../../contexts/NotificationContext';
import { DAYS_OF_WEEK, DEFAULT_BARBERSHOP_WORKING_HOURS } from '../../constants';

type BarberFormData = Omit<Barber, 'id' | 'barbershopId'>;

const AdminTeamPage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBarberId, setCurrentBarberId] = useState<string | null>(null);

  const initialFormValues: BarberFormData = {
    name: '',
    availableHours: DEFAULT_BARBERSHOP_WORKING_HOURS.map(wh => ({ dayOfWeek: wh.dayOfWeek, start: wh.start, end: wh.end })), // Populate from default shop hours
    assignedServices: [],
  };

  const { values, errors, handleChange: handleFormValueChange, handleSubmit, setValues, resetForm, isSubmitting, updateSingleValue } = useForm<BarberFormData>({
    initialValues: initialFormValues,
    onSubmit: async (formValues) => {
      if (!user) return;
      try {
        const barberDataToSubmit: Omit<Barber, 'id'> = { ...formValues, barbershopId: user.id };
        if (isEditing && currentBarberId) {
          await mockUpdateBarber(currentBarberId, barberDataToSubmit);
          addNotification({ message: 'Barbeiro atualizado com sucesso!', type: 'success' });
        } else {
          await mockAddBarber(barberDataToSubmit);
          addNotification({ message: 'Barbeiro adicionado com sucesso!', type: 'success' });
        }
        fetchBarbersAndServices(); // Re-fetch all barbers
        setShowModal(false);
      } catch (error) {
        addNotification({ message: `Erro ao salvar barbeiro: ${(error as Error).message}`, type: 'error' });
      }
    },
    validate: (formValues) => {
      const newErrors: Partial<Record<keyof BarberFormData, string>> = {};
      if (!formValues.name.trim()) newErrors.name = 'Nome do barbeiro é obrigatório.';
      // Basic validation for hours: ensure start is before end for each day
      formValues.availableHours.forEach(h => {
        if (h.start >= h.end) {
          if (!newErrors.availableHours) newErrors.availableHours = `Horário de ${DAYS_OF_WEEK[h.dayOfWeek]} inválido (início deve ser antes do fim).`;
        }
      });
      return newErrors;
    },
  });

  const fetchBarbersAndServices = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const [fetchedBarbers, fetchedShopServices] = await Promise.all([
          mockGetBarbersForBarbershop(user.id),
          mockGetServicesForBarbershop(user.id)
        ]);
        setBarbers(fetchedBarbers);
        setAllServices(fetchedShopServices.filter(s => s.isActive)); // Only assign active services
      } catch (error) {
        addNotification({ message: 'Erro ao buscar dados da equipe e serviços.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  }, [user, addNotification]);

  useEffect(() => {
    fetchBarbersAndServices();
  }, [fetchBarbersAndServices]);

  const handleOpenModal = (barber?: Barber) => {
    if (barber) {
      setIsEditing(true);
      setCurrentBarberId(barber.id);
      setValues({
        name: barber.name,
        // Ensure availableHours is a full 7-day array, defaulting if needed
        availableHours: DAYS_OF_WEEK.map((_, index) => {
            const existingDay = barber.availableHours.find(bh => bh.dayOfWeek === index);
            return existingDay || { dayOfWeek: index, start: initialFormValues.availableHours[index].start, end: initialFormValues.availableHours[index].end };
        }),
        assignedServices: barber.assignedServices,
      });
    } else {
      setIsEditing(false);
      setCurrentBarberId(null);
      resetForm(); // Resets to initialFormValues
    }
    setShowModal(true);
  };

  const handleDeleteBarber = async (barberId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este barbeiro? Agendamentos associados a ele podem ser afetados.')) {
      try {
        await mockDeleteBarber(barberId);
        addNotification({ message: 'Barbeiro excluído com sucesso.', type: 'success' });
        fetchBarbersAndServices(); // Re-fetch
      } catch (error) {
        addNotification({ message: `Erro ao excluir barbeiro: ${(error as Error).message}`, type: 'error' });
      }
    }
  };
  
  const handleServiceAssignmentChange = (serviceId: string) => {
    const newAssignedServices = values.assignedServices.includes(serviceId)
      ? values.assignedServices.filter(id => id !== serviceId)
      : [...values.assignedServices, serviceId];
    updateSingleValue('assignedServices', newAssignedServices);
  };

  const handleHourChange = (dayIndex: number, field: 'start' | 'end', value: string) => {
    const newAvailableHours = [...values.availableHours];
    newAvailableHours[dayIndex] = { ...newAvailableHours[dayIndex], dayOfWeek: dayIndex, [field]: value };
    updateSingleValue('availableHours', newAvailableHours);
  };

  if (loading && barbers.length === 0) return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-blue">Gerenciar Equipe</h1>
        <Button onClick={() => handleOpenModal()} variant="primary" leftIcon={<span className="material-icons-outlined">person_add</span>}>
          Adicionar Barbeiro
        </Button>
      </div>
      
      {barbers.length === 0 && !loading ? (
         <div className="text-center py-10 bg-white shadow-md rounded-lg">
          <span className="material-icons-outlined text-6xl text-primary-blue/50 mb-4">group</span>
          <p className="text-xl text-gray-600 mb-4">Nenhum barbeiro cadastrado ainda.</p>
          <p className="text-sm text-gray-500">Adicione membros à sua equipe para gerenciar seus horários e serviços.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barbers.map(barber => (
            <BarberCard 
              key={barber.id} 
              barber={barber} 
              services={allServices}
              onEdit={() => handleOpenModal(barber)}
              onDelete={() => handleDeleteBarber(barber.id)}
            />
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? 'Editar Barbeiro' : 'Adicionar Novo Barbeiro'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Nome do Barbeiro *" name="name" value={values.name} onChange={(e) => handleFormValueChange(e as ChangeEvent<HTMLInputElement>)} error={errors.name} required disabled={isSubmitting} />
          
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Horários Disponíveis Específicos</h3>
            <p className="text-xs text-gray-500 mb-2">Se não especificado, usará os horários da barbearia. Formato 24h (ex: 09:00 - 18:00).</p>
            {errors.availableHours && <p className="text-red-500 text-xs mb-2">{errors.availableHours}</p>}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {DAYS_OF_WEEK.map((dayName, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-1 items-center p-2 border rounded-md border-light-blue">
                  <label className="text-sm font-medium text-gray-700 col-span-3 sm:col-span-1 py-1">{dayName}</label>
                  <Input type="time" name={`start-${index}`} value={values.availableHours[index]?.start || '09:00'} onChange={(e) => handleHourChange(index, 'start', e.target.value)} containerClassName="mb-0" className="text-sm py-1.5" disabled={isSubmitting} />
                  <Input type="time" name={`end-${index}`} value={values.availableHours[index]?.end || '18:00'} onChange={(e) => handleHourChange(index, 'end', e.target.value)} containerClassName="mb-0" className="text-sm py-1.5" disabled={isSubmitting}/>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Serviços Atribuídos</h3>
            {allServices.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 max-h-40 overflow-y-auto p-2 border rounded-md border-light-blue">
                {allServices.map(service => (
                    <div key={service.id} className="flex items-center">
                    <input 
                        type="checkbox" 
                        id={`service-assign-${service.id}`} 
                        checked={values.assignedServices.includes(service.id)}
                        onChange={() => handleServiceAssignmentChange(service.id)}
                        className="h-4 w-4 text-primary-blue border-gray-300 rounded focus:ring-primary-blue"
                        disabled={isSubmitting}
                    />
                    <label htmlFor={`service-assign-${service.id}`} className="ml-2 text-sm text-gray-700 truncate" title={service.name}>{service.name}</label>
                    </div>
                ))}
                </div>
            ) : <p className="text-sm text-gray-500 bg-light-blue p-3 rounded-md">Nenhum serviço ativo cadastrado na barbearia. <br/> <span className="font-semibold">Adicione e ative serviços</span> na seção "Serviços" para poder atribuí-los aqui.</p>}
          </div>

          <div className="pt-5 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>{isEditing ? 'Salvar Alterações' : 'Adicionar Barbeiro'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminTeamPage;