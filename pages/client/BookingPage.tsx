import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { BarbershopProfile, Service, Barber, Appointment } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { 
  mockGetBarbershopProfile, 
  mockGetServiceById, 
  mockGetBarbersForService, 
  mockGetAvailableTimeSlots,
  mockCreateAppointment
} from '../../services/mockApiService';
import LoadingSpinner from '../../components/LoadingSpinner';
import DatePicker from '../../components/DatePicker';
import TimeSlotPicker from '../../components/TimeSlotPicker';
import Button from '../../components/Button';
import { useNotification } from '../../contexts/NotificationContext';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import BackButton from '../../components/BackButton';

const BookingPage: React.FC = () => {
  const { barbershopId, serviceId } = useParams<{ barbershopId: string, serviceId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // To redirect back after login
  const { addNotification } = useNotification();

  const [barbershop, setBarbershop] = useState<BarbershopProfile | null>(null);
  const [service, setService] = useState<Service | null>(null);
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
    if (!barbershopId || !serviceId) {
      addNotification({ message: 'IDs da barbearia ou serviço inválidos.', type: 'error' });
      navigate('/'); // Fallback to home
      return;
    }
    setLoadingData(true);
    try {
      const [profileData, serviceData] = await Promise.all([
        mockGetBarbershopProfile(barbershopId),
        mockGetServiceById(serviceId)
      ]);

      if (!profileData || !serviceData) {
        addNotification({ message: 'Barbearia ou serviço não encontrado.', type: 'error' });
        navigate(profileData ? `/barbershop/${barbershopId}` : '/');
        return;
      }
      if (!serviceData.isActive) {
        addNotification({ message: 'Este serviço não está disponível no momento.', type: 'warning' });
        navigate(`/barbershop/${barbershopId}`);
        return;
      }

      setBarbershop(profileData);
      setService(serviceData);

      const barbersData = await mockGetBarbersForService(barbershopId, serviceId);
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

  // Fetch slots whenever date, service, or barberId changes
  const fetchSlots = useCallback(async () => {
    if (!selectedDate || !service || !barbershopId || !barbershop) return; // Ensure barbershop is loaded for availableWeekdays
    setLoadingSlots(true);
    setSelectedTime(null); // Reset time when date or barber changes
    try {
      const slots = await mockGetAvailableTimeSlots(
        barbershopId,
        service.duration,
        format(selectedDate, 'yyyy-MM-dd'),
        selectedBarberId || null // Pass null if "any" is selected (empty string)
      );
      setAvailableSlots(slots);
    } catch (error) {
      addNotification({ message: 'Erro ao buscar horários disponíveis.', type: 'error' });
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate, service, barbershopId, selectedBarberId, addNotification, barbershop]);

  useEffect(() => {
    if (service && barbershop) { // Ensure service and barbershop data is loaded
        fetchSlots();
    }
  }, [selectedDate, service, selectedBarberId, barbershop, fetchSlots]);


  const handleBooking = async () => {
    if (!user) {
      addNotification({ message: 'Você precisa estar logado para agendar.', type: 'info' });
      navigate('/login', { state: { from: location } }); // Redirect to login, then back
      return;
    }
    if (!selectedDate || !selectedTime || !service || !barbershop) {
      addNotification({ message: 'Por favor, complete todos os campos para agendar.', type: 'warning' });
      return;
    }

    setIsBooking(true);
    try {
      const newAppointmentData: Omit<Appointment, 'id' | 'createdAt' | 'clientName' | 'serviceName' | 'barberName' | 'barbershopName'> = {
        clientId: user.id,
        barbershopId: barbershop.id,
        serviceId: service.id,
        barberId: selectedBarberId || undefined, 
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        status: 'scheduled',
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
  if (!barbershop || !service) return <div className="text-center text-red-500 py-10 text-xl bg-white p-8 rounded-lg shadow-md">Não foi possível carregar os dados do agendamento. <Link to="/"><Button>Voltar</Button></Link></div>;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="bg-white p-5 sm:p-6 md:p-8 rounded-xl shadow-2xl border border-primary-blue/20">
        <div className="mb-4">
          <BackButton />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-blue mb-2">Agendar Serviço</h1>
        <div className="bg-light-blue p-4 rounded-lg mb-6 shadow-sm">
            <p className="text-xl font-semibold text-primary-blue">{service.name}</p>
            <p className="text-gray-700 text-sm">Duração: {service.duration} min | Preço: R$ {service.price.toFixed(2).replace('.',',')}</p>
            <p className="text-xs text-gray-600 mt-1">Barbearia: {barbershop.name}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Left Column: Date & Barber Selection */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-text-dark mb-3">1. Escolha a Data</h2>
              <DatePicker
                selectedDate={selectedDate}
                onChange={setSelectedDate}
                availableWeekdays={availableWeekdays} 
                minDate={new Date()} // Can't book in the past
              />
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

          {/* Right Column: Time Slot & Notes */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-text-dark mb-3">
                {barbers.length > 0 ? '3. Escolha o Horário' : '2. Escolha o Horário'}
              </h2>
              <TimeSlotPicker
                availableSlots={availableSlots}
                selectedSlot={selectedTime}
                onSelectSlot={setSelectedTime}
                loading={loadingSlots}
                slotsPerRow={3}
              />
            </div>
            
            <div>
               <h2 className="text-lg sm:text-xl font-semibold text-text-dark mb-3">
                {barbers.length > 0 ? '4. Observações' : '3. Observações'} <span className="text-gray-500 text-sm">(Opcional)</span>
              </h2>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alguma preferência ou informação adicional para o barbeiro?"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary-blue focus:border-primary-blue shadow-sm text-sm"
                aria-label="Observações para o agendamento"
              />
            </div>
          </div>
        </div>
        
        {/* Confirmation & Booking Button */}
        {selectedDate && selectedTime && (
            <div className="mt-8 p-4 sm:p-6 bg-light-blue rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-primary-blue mb-3">Resumo do Agendamento</h2>
                <div className="space-y-1 text-sm text-text-dark">
                    <p><strong>Serviço:</strong> {service.name}</p>
                    <p><strong>Data:</strong> {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                    <p><strong>Horário:</strong> {selectedTime}</p>
                    {selectedBarberId && barbers.find(b => b.id === selectedBarberId) && (
                        <p><strong>Barbeiro:</strong> {barbers.find(b => b.id === selectedBarberId)?.name}</p>
                    )}
                </div>
                <Button 
                    onClick={handleBooking} 
                    isLoading={isBooking} 
                    disabled={!selectedDate || !selectedTime || isBooking}
                    fullWidth
                    className="mt-6"
                    size="lg"
                >
                    {user ? 'Confirmar Agendamento' : 'Faça login para Agendar'}
                </Button>
                {!user && <p className="text-xs text-center text-red-600 mt-2">Você precisa estar logado para confirmar.</p>}
            </div>
        )}
         {!selectedTime && !loadingSlots && <p className="text-sm text-center text-gray-500 mt-6">Por favor, selecione uma data{barbers.length > 0 ? " e barbeiro": ""} para ver os horários.</p>}
      </div>
    </div>
  );
};

export default BookingPage;