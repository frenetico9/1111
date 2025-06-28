import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { BarbershopProfile, Service, Barber, Appointment } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { 
  mockGetBarbershopProfile, 
  mockGetServicesForBarbershop, 
  mockGetBarbersForService, 
  mockGetAvailableTimeSlots,
  mockCreateAppointment,
  mockGetBarbersForBarbershop
} from '../../services/mockApiService';
import LoadingSpinner from '../../components/LoadingSpinner';
import DatePicker from '../../components/DatePicker';
import TimeSlotPicker from '../../components/TimeSlotPicker';
import Button from '../../components/Button';
import { useNotification } from '../../contexts/NotificationContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BackButton from '../../components/BackButton';

const BookingPage: React.FC = () => {
  const { barbershopId, serviceId } = useParams<{ barbershopId: string, serviceId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // To redirect back after login
  const { addNotification } = useNotification();

  const [barbershop, setBarbershop] = useState<BarbershopProfile | null>(null);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Default to today
  const [selectedBarberId, setSelectedBarberId] = useState<string>(''); // Empty string for "any barber"
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const [loadingData, setLoadingData] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  
  const availableWeekdays = barbershop?.workingHours.filter(wh => wh.isOpen).map(wh => wh.dayOfWeek);

  const fetchData = useCallback(async () => {
    if (!barbershopId) {
      addNotification({ message: 'ID da barbearia inválido.', type: 'error' });
      navigate('/');
      return;
    }
    setLoadingData(true);
    try {
      const profileData = await mockGetBarbershopProfile(barbershopId);
      if (!profileData) {
        addNotification({ message: 'Barbearia não encontrada.', type: 'error' });
        navigate('/');
        return;
      }
      setBarbershop(profileData);

      const servicesData = await mockGetServicesForBarbershop(barbershopId);
      setAllServices(servicesData.filter(s => s.isActive));
      
      // Pre-select service from URL
      if (serviceId && servicesData.some(s => s.id === serviceId && s.isActive)) {
        setSelectedServiceIds([serviceId]);
      }

      // Barbers don't depend on a single service anymore in this view
      const barbersData = await mockGetBarbersForBarbershop(barbershopId);
      setBarbers(barbersData);
      
    } catch (error) {
      addNotification({ message: 'Erro ao carregar dados para agendamento.', type: 'error' });
      navigate(barbershopId ? `/barbershop/${barbershopId}` : '/');
    } finally {
      setLoadingData(false);
    }
  }, [barbershopId, serviceId, addNotification, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { totalDuration, totalPrice, selectedServices } = useMemo(() => {
    const selected = allServices.filter(s => selectedServiceIds.includes(s.id));
    const duration = selected.reduce((sum, s) => sum + s.duration, 0);
    const price = selected.reduce((sum, s) => sum + s.price, 0);
    return { totalDuration: duration, totalPrice: price, selectedServices: selected };
  }, [selectedServiceIds, allServices]);

  const fetchSlots = useCallback(async () => {
    if (!selectedDate || totalDuration === 0 || !barbershopId || !barbershop) return;
    setLoadingSlots(true);
    setSelectedTime(null);
    try {
      const slots = await mockGetAvailableTimeSlots(
        barbershopId,
        totalDuration,
        format(selectedDate, 'yyyy-MM-dd'),
        selectedBarberId || null
      );
      setAvailableSlots(slots);
    } catch (error) {
      addNotification({ message: 'Erro ao buscar horários disponíveis.', type: 'error' });
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate, totalDuration, barbershopId, selectedBarberId, addNotification, barbershop]);

  useEffect(() => {
    if (barbershop) {
      fetchSlots();
    }
  }, [selectedDate, totalDuration, selectedBarberId, barbershop, fetchSlots]);

  const handleServiceSelectionChange = (serviceId: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleBooking = async () => {
    if (!user) {
      addNotification({ message: 'Você precisa estar logado para agendar.', type: 'info' });
      navigate('/login', { state: { from: location } });
      return;
    }
    if (!selectedDate || !selectedTime || selectedServiceIds.length === 0 || !barbershop) {
      addNotification({ message: 'Por favor, complete todos os campos para agendar.', type: 'warning' });
      return;
    }

    setIsBooking(true);
    try {
      const newAppointmentData: Omit<Appointment, 'id' | 'createdAt' | 'clientName' | 'barbershopName' | 'serviceNames' | 'barberName' | 'totalPrice' | 'totalDuration' | 'status'> = {
        clientId: user.id,
        barbershopId: barbershop.id,
        serviceIds: selectedServiceIds,
        barberId: selectedBarberId || undefined, 
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        notes: notes.trim(),
      };
      await mockCreateAppointment(newAppointmentData);
      addNotification({ message: 'Agendamento realizado com sucesso!', type: 'success' });
      navigate('/client/appointments');
    } catch (error) {
      addNotification({ message: `Erro ao realizar agendamento: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsBooking(false);
    }
  };

  if (loadingData || authLoading) return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><LoadingSpinner size="lg" label="Carregando dados do agendamento..." /></div>;
  if (!barbershop) return <div className="text-center text-red-500 py-10 text-xl bg-white p-8 rounded-lg shadow-md">Não foi possível carregar os dados do agendamento. <Link to="/"><Button>Voltar</Button></Link></div>;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="bg-white p-5 sm:p-6 md:p-8 rounded-xl shadow-2xl border border-primary-blue/20">
        <div className="mb-4">
          <BackButton />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-blue mb-2">Agendar Serviço</h1>
        <p className="text-xs text-gray-600 mb-6">Barbearia: {barbershop.name}</p>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-text-dark mb-3">1. Selecione os Serviços</h2>
              <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {allServices.length > 0 ? allServices.map(service => (
                  <div key={service.id} className="flex items-center p-2 rounded-md hover:bg-light-blue transition-colors">
                    <input
                      type="checkbox"
                      id={`service-${service.id}`}
                      checked={selectedServiceIds.includes(service.id)}
                      onChange={() => handleServiceSelectionChange(service.id)}
                      className="h-5 w-5 rounded border-gray-300 text-primary-blue focus:ring-primary-blue"
                    />
                    <label htmlFor={`service-${service.id}`} className="ml-3 flex-grow cursor-pointer">
                      <span className="font-medium text-text-dark">{service.name}</span>
                      <span className="text-xs text-text-light block">
                        {service.duration} min - R$ {service.price.toFixed(2).replace('.', ',')}
                      </span>
                    </label>
                  </div>
                )) : <p className="text-sm text-gray-500">Nenhum serviço ativo encontrado.</p>}
              </div>
            </div>

            {barbers.length > 0 && (
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-text-dark mb-3">2. Escolha o Barbeiro <span className="text-gray-500 text-sm">(Opcional)</span></h2>
                <select
                  value={selectedBarberId}
                  onChange={(e) => setSelectedBarberId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary-blue focus:border-primary-blue shadow-sm text-sm"
                  aria-label="Selecionar barbeiro"
                >
                  <option value="">Qualquer Barbeiro Disponível</option>
                  {barbers.map(barber => (
                    <option key={barber.id} value={barber.id}>{barber.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-6">
             <div>
              <h2 className="text-lg sm:text-xl font-semibold text-text-dark mb-3">3. Escolha a Data</h2>
              <DatePicker
                selectedDate={selectedDate}
                onChange={setSelectedDate}
                availableWeekdays={availableWeekdays} 
                minDate={new Date()}
              />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-text-dark mb-3">4. Escolha o Horário</h2>
              <TimeSlotPicker
                availableSlots={availableSlots}
                selectedSlot={selectedTime}
                onSelectSlot={setSelectedTime}
                loading={loadingSlots}
                slotsPerRow={3}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-8">
            <h2 className="text-lg sm:text-xl font-semibold text-text-dark mb-3">5. Observações <span className="text-gray-500 text-sm">(Opcional)</span></h2>
            <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alguma preferência ou informação adicional para o barbeiro?"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary-blue focus:border-primary-blue shadow-sm text-sm"
                aria-label="Observações para o agendamento"
            />
        </div>

        {selectedServiceIds.length > 0 && (
            <div className="mt-8 p-4 sm:p-6 bg-light-blue rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-primary-blue mb-3">Resumo do Agendamento</h2>
                <div className="space-y-2 text-sm text-text-dark mb-4">
                  <div><strong>Serviços:</strong>
                    <ul className="list-disc list-inside ml-4">
                      {selectedServices.map(s => <li key={s.id}>{s.name}</li>)}
                    </ul>
                  </div>
                  <p><strong>Duração Total:</strong> {totalDuration} minutos</p>
                  <p><strong>Preço Total:</strong> R$ {totalPrice.toFixed(2).replace('.', ',')}</p>
                  {selectedDate && <p><strong>Data:</strong> {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>}
                  {selectedTime && <p><strong>Horário:</strong> {selectedTime}</p>}
                </div>
                <Button 
                    onClick={handleBooking} 
                    isLoading={isBooking} 
                    disabled={!selectedDate || !selectedTime || isBooking || selectedServiceIds.length === 0}
                    fullWidth
                    className="mt-6"
                    size="lg"
                >
                    {user ? 'Confirmar Agendamento' : 'Faça login para Agendar'}
                </Button>
                {!user && <p className="text-xs text-center text-red-600 mt-2">Você precisa estar logado para confirmar.</p>}
            </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;