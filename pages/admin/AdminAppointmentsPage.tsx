import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Appointment, User, Service as ServiceType, Barber, UserType } from '../../types';
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
import AppointmentCalendar from '../../components/AppointmentCalendar';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { useNotification } from '../../contexts/NotificationContext';
import Input from '../../components/Input';
import { format } from 'date-fns/format';
import { startOfWeek } from 'date-fns/startOfWeek';
import { endOfWeek } from 'date-fns/endOfWeek';
import { addDays } from 'date-fns/addDays';
import { subDays } from 'date-fns/subDays';
import { ptBR } from 'date-fns/locale/pt-BR';

interface ClientOption extends Pick<User, 'id' | 'name'> {}
interface ServiceOption extends Pick<ServiceType, 'id' | 'name' | 'duration'> {}
interface BarberOption extends Pick<Barber, 'id' | 'name'> {}

type ViewType = 'calendar' | 'list';

const AdminAppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewType>('calendar');
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpsertModal, setShowUpsertModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // For calendar view
  const [currentDate, setCurrentDate] = useState(new Date());

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
    return appointments
      .filter(app => {
        const dateMatch = !filterDate || app.date === filterDate;
        const statusMatch = filterStatus === 'all' || app.status === filterStatus;
        return dateMatch && statusMatch;
      })
      .sort((a, b) => {
          if (a.status === 'scheduled' && b.status !== 'scheduled') return -1;
          if (a.status !== 'scheduled' && b.status === 'scheduled') return 1;
          return new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime();
        });
  }, [appointments, filterDate, filterStatus]);


  const handleAction = async (action: () => Promise<any>, successMessage: string, errorMessage: string, modalSetter?: React.Dispatch<React.SetStateAction<boolean>>) => {
    setIsSubmittingForm(true);
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
  
  const openUpsertModal = (appointmentToEdit?: Appointment, date?: string) => {
    if (appointmentToEdit) {
      setIsEditing(true);
      setSelectedAppointment(appointmentToEdit);
      setFormData({
        clientId: appointmentToEdit.clientId,
        serviceId: appointmentToEdit.serviceId,
        barberId: appointmentToEdit.barberId || '',
        date: appointmentToEdit.date,
        time: appointmentToEdit.time,
        notes: appointmentToEdit.notes || '',
      });
    } else {
      setIsEditing(false);
      setSelectedAppointment(null);
      const newDate = date || format(new Date(), 'yyyy-MM-dd');
      setFormData({...initialFormData, date: newDate});
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
      status: (isEditing && selectedAppointment) ? selectedAppointment.status : 'scheduled',
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

  const weekStart = startOfWeek(currentDate, { locale: ptBR });
  const weekEnd = endOfWeek(currentDate, { locale: ptBR });
  const weekLabel = `${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM/yyyy')}`;
  
  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-blue">Gerenciar Agendamentos</h1>
        <Button onClick={() => openUpsertModal()} variant="primary" leftIcon={<span className="material-icons-outlined">add</span>}>Novo Agendamento</Button>
      </div>

      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-wrap gap-4 items-center border border-light-blue dark:border-gray-700">
        <div className="flex-grow">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Visualização</label>
          <div className="flex items-center rounded-md shadow-sm mt-1">
            <Button size="sm" variant={view === 'calendar' ? 'primary' : 'outline'} onClick={() => setView('calendar')} className="rounded-r-none !px-3">Calendário</Button>
            <Button size="sm" variant={view === 'list' ? 'primary' : 'outline'} onClick={() => setView('list')} className="rounded-l-none !px-3">Lista</Button>
          </div>
        </div>
        
        {view === 'list' && <>
          <div>
            <label htmlFor="filterDate" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Filtrar por Data:</label>
            <Input type="date" id="filterDate" name="filterDate" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} containerClassName="mb-0" className="mt-1 text-sm py-2"/>
          </div>
          <div>
            <label htmlFor="filterStatus" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Filtrar por Status:</label>
            <select id="filterStatus" name="filterStatus" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="mt-1 block w-full p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue text-sm dark:text-white">
              <option value="all">Todos</option>
              <option value="scheduled">Agendado</option>
              <option value="completed">Concluído</option>
              <option value="cancelled_by_client">Cancelado (Cliente)</option>
              <option value="cancelled_by_admin">Cancelado (Barbearia)</option>
            </select>
          </div>
          <Button onClick={() => { setFilterDate(''); setFilterStatus('all'); }} variant="outline" size="sm" className="self-end">Limpar Filtros</Button>
        </>}

        {view === 'calendar' && (
            <div className="flex-grow flex items-end justify-center gap-2">
                 <Button onClick={() => setCurrentDate(subDays(currentDate, 7))} variant="outline" size="sm">&lt; Semana</Button>
                 <span className="text-center font-semibold text-gray-700 dark:text-gray-200">{weekLabel}</span>
                 <Button onClick={() => setCurrentDate(addDays(currentDate, 7))} variant="outline" size="sm">Semana &gt;</Button>
            </div>
        )}
      </div>
      
      {view === 'list' ? (
        filteredAppointments.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-gray-800 shadow-md rounded-lg">
            <span className="material-icons-outlined text-6xl text-primary-blue/50 mb-4">event_busy</span>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">Nenhum agendamento encontrado.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tente ajustar os filtros ou adicione um novo agendamento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAppointments.map(app => (
              <AppointmentCard 
                key={app.id} appointment={app} userType={UserType.ADMIN}
                onCancel={() => openCancelModal(app)}
                onReschedule={() => openUpsertModal(app)}
                onComplete={() => handleCompleteAppointment(app.id)}
              />
            ))}
          </div>
        )
      ) : (
        <AppointmentCalendar 
          appointments={appointments}
          currentDate={currentDate}
          onAppointmentClick={(app) => openUpsertModal(app)}
          onEmptySlotClick={(date, time) => openUpsertModal(undefined, date)}
        />
      )}

      {/* Modals */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Confirmar Cancelamento" footer={<><Button variant="secondary" onClick={() => setShowCancelModal(false)} disabled={isSubmittingForm}>Voltar</Button><Button variant="danger" onClick={handleCancelAppointment} isLoading={isSubmittingForm}>Confirmar</Button></>}>
        <p>Tem certeza que deseja cancelar este agendamento?</p>
        {selectedAppointment && <p className="text-sm mt-1 text-text-light dark:text-gray-400">Serviço: {selectedAppointment.serviceName} para {selectedAppointment.clientName}</p>}
      </Modal>

      <Modal isOpen={showUpsertModal} onClose={() => setShowUpsertModal(false)} title={isEditing ? "Editar Agendamento" : "Novo Agendamento"} size="lg">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input label="Cliente *" type="select" name="clientId" value={formData.clientId} onChange={handleFormChange} required>
              <option value="" disabled>Selecione um cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Input>
          <Input label="Serviço *" type="select" name="serviceId" value={formData.serviceId} onChange={handleFormChange} required>
            <option value="" disabled>Selecione um serviço</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>)}
          </Input>
          <Input label="Barbeiro (Opcional)" type="select" name="barberId" value={formData.barberId} onChange={handleFormChange}>
            <option value="">Qualquer um / Barbearia</option>
            {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Input>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Data *" name="date" type="date" value={formData.date} onChange={handleFormChange} required containerClassName="mb-0" className="text-sm py-2.5"/>
            <Input label="Hora *" name="time" type="time" value={formData.time} onChange={handleFormChange} required containerClassName="mb-0" className="text-sm py-2.5"/>
          </div>
          <Input label="Observações" type="textarea" name="notes" value={formData.notes} onChange={handleFormChange} rows={2} />
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