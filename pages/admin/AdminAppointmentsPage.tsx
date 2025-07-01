import React, { useEffect, useState, useCallback, useMemo, ChangeEvent } from 'react';
import { Appointment, UserType, User, Service as ServiceType, Barber } from '../../types'; // Renamed Service to ServiceType
import { useAuth } from '../../hooks/useAuth';
import { 
  mockGetAdminAppointments, 
  mockCancelAppointment, 
  mockCompleteAppointment, 
  mockGetClientsForBarbershop, 
  mockGetServicesForBarbershop, 
  mockGetBarbersForBarbershop, 
  mockCreateAppointment, 
  mockUpdateAppointment 
} from '../../services/mockApiService';
import AppointmentCard from '../../components/AppointmentCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { useNotification } from '../../contexts/NotificationContext';
import Input from '../../components/Input';
import { format } from 'date-fns';

interface ClientOption extends Pick<User, 'id' | 'name'> {}
interface ServiceOption extends Pick<ServiceType, 'id' | 'name' | 'duration'> {}
interface BarberOption extends Pick<Barber, 'id' | 'name'> {}

const AdminAppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpsertModal, setShowUpsertModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Form state for new/edit appointment
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [barbers, setBarbers] = useState<BarberOption[]>([]);
  
  const initialFormData = {
    clientId: '',
    serviceId: '',
    barberId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    notes: '',
  };
  const [formData, setFormData] = useState(initialFormData);

  const fetchAppointments = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const fetchedAppointments = await mockGetAdminAppointments(user.id);
        // Sort: scheduled first, then by date descending
        fetchedAppointments.sort((a, b) => {
          if (a.status === 'scheduled' && b.status !== 'scheduled') return -1;
          if (a.status !== 'scheduled' && b.status === 'scheduled') return 1;
          return new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime();
        });
        setAppointments(fetchedAppointments);
      } catch (error) {
        addNotification({ message: 'Erro ao buscar agendamentos.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  }, [user, addNotification]);
  
  const fetchFormDataDeps = useCallback(async () => {
    if (user) {
      try {
        const [cls, srvs, brbs] = await Promise.all([
          mockGetClientsForBarbershop(user.id).then(res => res.map(c => ({id: c.id!, name: c.name! }))),
          mockGetServicesForBarbershop(user.id).then(res => res.filter(s => s.isActive).map(s => ({id: s.id, name: s.name, duration: s.duration}))),
          mockGetBarbersForBarbershop(user.id).then(res => res.map(b => ({id: b.id, name: b.name})))
        ]);
        setClients(cls);
        setServices(srvs);
        setBarbers(brbs);
      } catch (error) {
        addNotification({message: 'Erro ao carregar dados para formulário.', type: 'error'});
      }
    }
  }, [user, addNotification]);

  useEffect(() => {
    fetchAppointments();
    fetchFormDataDeps();
  }, [fetchAppointments, fetchFormDataDeps]);

  const [filterDate, setFilterDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<Appointment['status'] | 'all'>('all');

  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      const dateMatch = !filterDate || app.date === filterDate;
      const statusMatch = filterStatus === 'all' || app.status === filterStatus;
      return dateMatch && statusMatch;
    });
  }, [appointments, filterDate, filterStatus]);


  const handleAction = async (action: () => Promise<any>, successMessage: string, errorMessage: string, modalSetter?: React.Dispatch<React.SetStateAction<boolean>>) => {
    setIsSubmittingForm(true); // General loading state for actions
    try {
      await action();
      addNotification({ message: successMessage, type: 'success' });
      fetchAppointments();
      if(modalSetter) modalSetter(false);
      setSelectedAppointment(null);
    } catch (error) {
      addNotification({ message: `${errorMessage}: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleCancelAppointment = () => {
    if (selectedAppointment && user) {
      handleAction(
        () => mockCancelAppointment(selectedAppointment.id, user.id, 'admin'),
        'Agendamento cancelado com sucesso.',
        'Erro ao cancelar agendamento.',
        setShowCancelModal
      );
    }
  };

  const handleCompleteAppointment = (appointmentId: string) => {
    if (user) {
      handleAction(
        () => mockCompleteAppointment(appointmentId),
        'Agendamento marcado como concluído.',
        'Erro ao concluir agendamento.'
      );
    }
  };
  
  const openCancelModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };
  
  const openUpsertModal = (appointmentToEdit?: Appointment) => {
    if (appointmentToEdit) {
      setIsEditing(true);
      setSelectedAppointment(appointmentToEdit);
      setFormData({
        clientId: appointmentToEdit.clientId,
        serviceId: appointmentToEdit.serviceId,
        barberId: appointmentToEdit.barberId || '',
        date: appointmentToEdit.date, // Already YYYY-MM-DD
        time: appointmentToEdit.time, // Already HH:MM
        notes: appointmentToEdit.notes || '',
      });
    } else {
      setIsEditing(false);
      setSelectedAppointment(null);
      setFormData(initialFormData); // Reset form for new appointment
    }
    setShowUpsertModal(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const appointmentData = {
      ...formData,
      barbershopId: user.id,
      status: (isEditing && selectedAppointment) ? selectedAppointment.status : 'scheduled', // Keep status if editing, else scheduled
    };
    
    if (!appointmentData.clientId || !appointmentData.serviceId || !appointmentData.date || !appointmentData.time) {
        addNotification({ message: "Cliente, serviço, data e hora são obrigatórios.", type: "error"});
        return;
    }
    
    const actionPromise = isEditing && selectedAppointment 
      ? mockUpdateAppointment(selectedAppointment.id, appointmentData)
      : mockCreateAppointment(appointmentData as Omit<Appointment, 'id' | 'createdAt'>);
      
    handleAction(
      () => actionPromise,
      isEditing ? 'Agendamento atualizado!' : 'Agendamento criado!',
      isEditing ? 'Erro ao atualizar.' : 'Erro ao criar.',
      setShowUpsertModal
    );
  };

  if (loading && appointments.length === 0) return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-blue">Gerenciar Agendamentos</h1>
        <Button onClick={() => openUpsertModal()} variant="primary" leftIcon={<span className="material-icons-outlined">add</span>}>Novo Agendamento</Button>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-md flex flex-wrap gap-4 items-end border border-light-blue">
        <div>
          <label htmlFor="filterDate" className="block text-xs font-medium text-gray-700">Filtrar por Data:</label>
          <Input 
            type="date" 
            id="filterDate" 
            name="filterDate"
            value={filterDate} 
            onChange={(e) => setFilterDate(e.target.value)}
            containerClassName="mb-0"
            className="mt-1 text-sm py-2"
          />
        </div>
        <div>
          <label htmlFor="filterStatus" className="block text-xs font-medium text-gray-700">Filtrar por Status:</label>
          <select 
            id="filterStatus"
            name="filterStatus"
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value as Appointment['status'] | 'all')}
            className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue text-sm"
          >
            <option value="all">Todos</option>
            <option value="scheduled">Agendado</option>
            <option value="completed">Concluído</option>
            <option value="cancelled_by_client">Cancelado (Cliente)</option>
            <option value="cancelled_by_admin">Cancelado (Barbearia)</option>
          </select>
        </div>
         <Button onClick={() => { setFilterDate(''); setFilterStatus('all'); }} variant="outline" size="sm">Limpar Filtros</Button>
      </div>
      
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
          <span className="material-icons-outlined text-6xl text-primary-blue/50 mb-4">event_busy</span>
          <p className="text-xl text-gray-600 mb-4">Nenhum agendamento encontrado.</p>
          <p className="text-sm text-gray-500">Tente ajustar os filtros ou adicione um novo agendamento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAppointments.map(app => (
            <AppointmentCard 
              key={app.id} 
              appointment={app} 
              userType={UserType.ADMIN}
              onCancel={() => openCancelModal(app)}
              onReschedule={() => openUpsertModal(app)} // Use upsert modal for rescheduling
              onComplete={() => handleCompleteAppointment(app.id)}
            />
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal 
        isOpen={showCancelModal} 
        onClose={() => setShowCancelModal(false)} 
        title="Confirmar Cancelamento"
        footer={<><Button variant="secondary" onClick={() => setShowCancelModal(false)} disabled={isSubmittingForm}>Voltar</Button><Button variant="danger" onClick={handleCancelAppointment} isLoading={isSubmittingForm}>Confirmar</Button></>}>
        <p>Tem certeza que deseja cancelar este agendamento?</p>
        {selectedAppointment && <p className="text-sm mt-1">Serviço: {selectedAppointment.serviceName} para {selectedAppointment.clientName}</p>}
      </Modal>

      {/* Upsert Appointment Modal */}
      <Modal isOpen={showUpsertModal} onClose={() => setShowUpsertModal(false)} title={isEditing ? "Editar Agendamento" : "Novo Agendamento"} size="lg">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">Cliente *</label>
            <select name="clientId" id="clientId" value={formData.clientId} onChange={handleFormChange} required className="mt-1 block w-full p-2.5 border-gray-300 rounded-md shadow-sm focus:ring-primary-blue focus:border-primary-blue text-sm">
              <option value="" disabled>Selecione um cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700">Serviço *</label>
            <select name="serviceId" id="serviceId" value={formData.serviceId} onChange={handleFormChange} required className="mt-1 block w-full p-2.5 border-gray-300 rounded-md shadow-sm focus:ring-primary-blue focus:border-primary-blue text-sm">
              <option value="" disabled>Selecione um serviço</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="barberId" className="block text-sm font-medium text-gray-700">Barbeiro (Opcional)</label>
            <select name="barberId" id="barberId" value={formData.barberId} onChange={handleFormChange} className="mt-1 block w-full p-2.5 border-gray-300 rounded-md shadow-sm focus:ring-primary-blue focus:border-primary-blue text-sm">
              <option value="">Qualquer um / Barbearia</option>
              {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Data *" name="date" type="date" value={formData.date} onChange={handleFormChange} required containerClassName="mb-0" className="text-sm py-2.5"/>
            <Input label="Hora *" name="time" type="time" value={formData.time} onChange={handleFormChange} required containerClassName="mb-0" className="text-sm py-2.5"/>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea name="notes" id="notes" value={formData.notes} onChange={handleFormChange} rows={2} className="mt-1 block w-full p-2.5 border-gray-300 rounded-md shadow-sm focus:ring-primary-blue focus:border-primary-blue text-sm"></textarea>
          </div>
          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={() => setShowUpsertModal(false)} disabled={isSubmittingForm}>Cancelar</Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingForm}>{isEditing ? "Salvar Alterações" : "Criar Agendamento"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminAppointmentsPage;