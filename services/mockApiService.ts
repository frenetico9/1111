



import { User, UserType, Service, Barber, Appointment, Review, BarbershopProfile, BarbershopSubscription, SubscriptionPlanTier, BarbershopSearchResultItem } from '../types';
import { MOCK_API_DELAY, SUBSCRIPTION_PLANS, DEFAULT_BARBERSHOP_WORKING_HOURS, TIME_SLOTS_INTERVAL, DAYS_OF_WEEK } from '../constants';

import { 
    addMinutes,
    format,
    addDays,
    addMonths,
    getDay,
    isSameDay,
    endOfDay,
    eachMinuteOfInterval,
    isBefore,
    isEqual
} from 'date-fns';
import parse from 'date-fns/parse';
import set from 'date-fns/set';
import startOfDay from 'date-fns/startOfDay';
import parseISO from 'date-fns/parseISO';


// In-memory store
let mockUsers: User[] = [
  { id: 'client1', email: 'cliente@exemplo.com', type: UserType.CLIENT, name: 'João Cliente', phone: '(11) 98765-4321' },
  { id: 'admin1', email: 'admin@barbearia.com', type: UserType.ADMIN, name: 'Carlos Dono', barbershopName: 'Barbearia do Carlos', phone: '(21) 91234-5678', address: 'Rua das Tesouras, 123, Rio de Janeiro' },
  { id: 'admin2', email: 'vip@navalha.com', type: UserType.ADMIN, name: 'Ana Estilista', barbershopName: 'Navalha VIP Club', phone: '(31) 99999-8888', address: 'Avenida Principal, 789, Belo Horizonte' },
];
let mockBarbershopProfiles: BarbershopProfile[] = [
    { id: 'admin1', name: 'Barbearia do Carlos', responsibleName: 'Carlos Dono', email: 'admin@barbearia.com', phone: '(21) 91234-5678', address: 'Rua das Tesouras, 123, Rio de Janeiro', description: 'Cortes clássicos e modernos com a melhor navalha da cidade.', logoUrl: 'https://source.unsplash.com/200x200/?barbershop,logo', coverImageUrl: 'https://source.unsplash.com/1200x400/?barber,tools', workingHours: DEFAULT_BARBERSHOP_WORKING_HOURS },
    { id: 'admin2', name: 'Navalha VIP Club', responsibleName: 'Ana Estilista', email: 'vip@navalha.com', phone: '(31) 99999-8888', address: 'Avenida Principal, 789, Belo Horizonte', description: 'Experiência premium para o homem que se cuida.', logoUrl: 'https://source.unsplash.com/200x200/?salon,logo', coverImageUrl: 'https://source.unsplash.com/1200x400/?salon,style,hair', workingHours: DEFAULT_BARBERSHOP_WORKING_HOURS.map(wh => ({...wh, start: '10:00', end: '20:00'})) },
];
let mockServices: Service[] = [
  { id: 'service1', barbershopId: 'admin1', name: 'Corte Masculino', price: 50, duration: 45, isActive: true, description: "Corte clássico ou moderno, tesoura e máquina." },
  { id: 'service2', barbershopId: 'admin1', name: 'Barba Tradicional', price: 35, duration: 30, isActive: true, description: "Toalha quente, navalha e produtos premium." },
  { id: 'service3', barbershopId: 'admin1', name: 'Combo Corte + Barba', price: 75, duration: 75, isActive: true, description: "O pacote completo para um visual impecável." },
  { id: 'service4', barbershopId: 'admin1', name: 'Hidratação Capilar', price: 40, duration: 30, isActive: false, description: "Tratamento para fortalecer e dar brilho." },
  { id: 'service5', barbershopId: 'admin2', name: 'Corte VIP', price: 120, duration: 60, isActive: true, description: "Atendimento exclusivo com consultoria de imagem." },
  { id: 'service6', barbershopId: 'admin2', name: 'Barboterapia Premium', price: 90, duration: 45, isActive: true, description: "Ritual completo de cuidados para a barba." },
];
let mockBarbers: Barber[] = [
  { id: 'barber1_admin1', barbershopId: 'admin1', name: 'Zé da Navalha', availableHours: [{dayOfWeek:1, start:'09:00', end:'18:00'}, {dayOfWeek:2, start:'09:00', end:'18:00'}], assignedServices: ['service1', 'service3'] },
  { id: 'barber2_admin1', barbershopId: 'admin1', name: 'Roberto Tesoura', availableHours: [{dayOfWeek:3, start:'10:00', end:'19:00'}, {dayOfWeek:4, start:'10:00', end:'19:00'}], assignedServices: ['service1', 'service2'] },
  { id: 'barber1_admin2', barbershopId: 'admin2', name: 'Mestre Arthur', availableHours: [{dayOfWeek:1, start:'10:00', end:'20:00'}], assignedServices: ['service5', 'service6'] },
];
let mockAppointments: Appointment[] = [
  { id: 'appt1', clientId: 'client1', barbershopId: 'admin1', serviceId: 'service1', serviceName: 'Corte Masculino', barberId: 'barber1_admin1', barberName: 'Zé da Navalha', date: format(new Date(), 'yyyy-MM-dd'), time: '10:00', status: 'scheduled', createdAt: new Date().toISOString(), clientName: 'João Cliente' },
  { id: 'appt2', clientId: 'client1', barbershopId: 'admin1', serviceId: 'service2', serviceName: 'Barba Tradicional', date: format(addDays(new Date(), -2), 'yyyy-MM-dd'), time: '14:30', status: 'completed', createdAt: addDays(new Date(), -2).toISOString(), clientName: 'João Cliente' },
  { id: 'appt3', clientId: 'client1', barbershopId: 'admin2', serviceId: 'service5', serviceName: 'Corte VIP', date: format(addDays(new Date(), 5), 'yyyy-MM-dd'), time: '11:00', status: 'scheduled', createdAt: new Date().toISOString(), clientName: 'João Cliente' },
];
let mockReviews: Review[] = [
  { id: 'review1', appointmentId: 'appt2', clientId: 'client1', clientName: 'João Cliente', barbershopId: 'admin1', rating: 5, comment: 'Barba impecável, atendimento nota 10!', createdAt: addDays(new Date(), -1).toISOString() },
];
let mockBarbershopSubscriptions: BarbershopSubscription[] = [
    { barbershopId: 'admin1', planId: SubscriptionPlanTier.PRO, status: 'active', startDate: new Date().toISOString(), nextBillingDate: addMonths(new Date(), 1).toISOString() },
    { barbershopId: 'admin2', planId: SubscriptionPlanTier.FREE, status: 'active', startDate: new Date().toISOString() },
];


const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Auth ---
export const mockLogin = async (email: string, pass: string): Promise<User | null> => {
  await delay(MOCK_API_DELAY);
  const user = mockUsers.find(u => u.email === email);
  // In a real app, you'd verify the password hash
  if (user) return { ...user }; 
  return null;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export const mockSignupClient = async (name: string, email: string, phone: string, pass: string): Promise<User | null> => {
  await delay(MOCK_API_DELAY);
  if (mockUsers.some(u => u.email === email)) throw new Error('E-mail já cadastrado.');
  const newUser: User = { id: `client_${generateId()}`, name, email, phone, type: UserType.CLIENT };
  mockUsers.push(newUser);
  return newUser;
};

export const mockSignupBarbershop = async (barbershopName: string, responsibleName: string, email: string, phone: string, address: string, pass: string): Promise<User | null> => {
  await delay(MOCK_API_DELAY);
  if (mockUsers.some(u => u.email === email)) throw new Error('E-mail já cadastrado.');
  const newAdminId = `admin_${generateId()}`;
  const newUser: User = { 
    id: newAdminId, 
    name: responsibleName, 
    email, 
    phone, 
    type: UserType.ADMIN, 
    barbershopName,
    address
  };
  mockUsers.push(newUser);
  // Create default profile and free subscription
  mockBarbershopProfiles.push({
    id: newAdminId, 
    name: barbershopName, 
    responsibleName, 
    email, 
    phone, 
    address, 
    workingHours: DEFAULT_BARBERSHOP_WORKING_HOURS,
    logoUrl: `https://source.unsplash.com/200x200/?barbershop,sign,${newAdminId}`,
    coverImageUrl: `https://source.unsplash.com/1200x400/?barbershop,work,${newAdminId}`,
  });
  mockBarbershopSubscriptions.push({
    barbershopId: newAdminId, planId: SubscriptionPlanTier.FREE, status: 'active', startDate: new Date().toISOString()
  });
  return newUser;
};

export const mockLogout = async (): Promise<void> => {
  await delay(MOCK_API_DELAY / 2);
  // Server-side, you might invalidate a token
  return;
};

// --- Client Profile ---
export const mockUpdateClientProfile = async (clientId: string, data: Partial<User>): Promise<boolean> => {
    await delay(MOCK_API_DELAY);
    const userIndex = mockUsers.findIndex(u => u.id === clientId && u.type === UserType.CLIENT);
    if (userIndex === -1) throw new Error("Cliente não encontrado.");
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...data };
    return true;
};


// --- Barbershop Profile & Subscription ---
export const mockGetPublicBarbershops = async (): Promise<BarbershopSearchResultItem[]> => {
  await delay(MOCK_API_DELAY);
  
  const results: BarbershopSearchResultItem[] = mockBarbershopProfiles.map(profile => {
    const barbershopReviews = mockReviews.filter(r => r.barbershopId === profile.id);
    const reviewCount = barbershopReviews.length;
    const averageRating = reviewCount > 0 
        ? barbershopReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount 
        : 0;
    
    const sampleServices = mockServices
        .filter(s => s.barbershopId === profile.id && s.isActive)
        .slice(0, 3)
        .map(({ id, name, price }) => ({ id, name, price }));
        
    const subscription = mockBarbershopSubscriptions.find(s => s.barbershopId === profile.id);
    const subscriptionTier = subscription ? subscription.planId : SubscriptionPlanTier.FREE;

    return {
        ...profile,
        averageRating,
        reviewCount,
        sampleServices,
        subscriptionTier,
    };
  });
  
  // Sort PRO first, then by rating
  results.sort((a, b) => {
      if (a.subscriptionTier === 'pro' && b.subscriptionTier !== 'pro') return -1;
      if (a.subscriptionTier !== 'pro' && b.subscriptionTier === 'pro') return 1;
      return b.averageRating - a.averageRating;
  });

  return results;
};

export const mockGetBarbershopProfile = async (barbershopId: string): Promise<BarbershopProfile | null> => {
  await delay(MOCK_API_DELAY);
  return mockBarbershopProfiles.find(p => p.id === barbershopId) || null;
};

export const mockUpdateBarbershopProfile = async (barbershopId: string, data: Partial<BarbershopProfile>): Promise<boolean> => {
  await delay(MOCK_API_DELAY);
  const profileIndex = mockBarbershopProfiles.findIndex(p => p.id === barbershopId);
  if (profileIndex === -1) return false;
  mockBarbershopProfiles[profileIndex] = { ...mockBarbershopProfiles[profileIndex], ...data };
  
  // Update corresponding user details if name/responsibleName/email/phone/address changed
  const userIndex = mockUsers.findIndex(u => u.id === barbershopId);
  if (userIndex !== -1) {
    const updatedUserData: Partial<User> = {};
    if (data.name) updatedUserData.barbershopName = data.name;
    if (data.responsibleName) updatedUserData.name = data.responsibleName;
    if (data.email) updatedUserData.email = data.email;
    if (data.phone) updatedUserData.phone = data.phone;
    if (data.address) updatedUserData.address = data.address;
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...updatedUserData };
  }
  return true;
};

export const mockGetBarbershopSubscription = async (barbershopId: string): Promise<BarbershopSubscription | null> => {
    await delay(MOCK_API_DELAY);
    return mockBarbershopSubscriptions.find(s => s.barbershopId === barbershopId) || null;
};

export const mockUpdateBarbershopSubscription = async (barbershopId: string, planId: SubscriptionPlanTier): Promise<boolean> => {
    await delay(MOCK_API_DELAY);
    const subIndex = mockBarbershopSubscriptions.findIndex(s => s.barbershopId === barbershopId);
    const planDetails = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!planDetails) return false;

    const newSubData = {
        barbershopId,
        planId,
        status: 'active' as const, // Assume payment successful for mock
        startDate: new Date().toISOString(),
        nextBillingDate: planDetails.price > 0 ? addMonths(new Date(), 1).toISOString() : undefined,
    };

    if (subIndex !== -1) {
        mockBarbershopSubscriptions[subIndex] = newSubData;
    } else {
        mockBarbershopSubscriptions.push(newSubData);
    }
    return true;
};

// --- Services ---
export const mockGetServicesForBarbershop = async (barbershopId: string): Promise<Service[]> => {
  await delay(MOCK_API_DELAY);
  return mockServices.filter(s => s.barbershopId === barbershopId);
};
export const mockGetServiceById = async (serviceId: string): Promise<Service | null> => {
  await delay(MOCK_API_DELAY);
  return mockServices.find(s => s.id === serviceId) || null;
}
export const mockAddService = async (serviceData: Omit<Service, 'id'>): Promise<Service> => {
  await delay(MOCK_API_DELAY);
  const newService = { ...serviceData, id: `service_${generateId()}` };
  mockServices.push(newService);
  return newService;
};
export const mockUpdateService = async (serviceId: string, data: Partial<Service>): Promise<Service | null> => {
  await delay(MOCK_API_DELAY);
  const index = mockServices.findIndex(s => s.id === serviceId);
  if (index === -1) return null;
  mockServices[index] = { ...mockServices[index], ...data };
  return mockServices[index];
};
export const mockToggleServiceActive = async (serviceId: string, isActive: boolean): Promise<boolean> => {
  await delay(MOCK_API_DELAY);
  const index = mockServices.findIndex(s => s.id === serviceId);
  if (index === -1) return false;
  mockServices[index].isActive = isActive;
  return true;
};

// --- Barbers ---
export const mockGetBarbersForBarbershop = async (barbershopId: string): Promise<Barber[]> => {
  await delay(MOCK_API_DELAY);
  return mockBarbers.filter(b => b.barbershopId === barbershopId);
};
export const mockGetBarbersForService = async (barbershopId: string, serviceId: string): Promise<Barber[]> => {
  await delay(MOCK_API_DELAY);
  return mockBarbers.filter(b => b.barbershopId === barbershopId && b.assignedServices.includes(serviceId));
};
export const mockAddBarber = async (barberData: Omit<Barber, 'id'>): Promise<Barber> => {
    await delay(MOCK_API_DELAY);
    const newBarber = { ...barberData, id: `barber_${generateId()}`};
    mockBarbers.push(newBarber);
    return newBarber;
};
export const mockUpdateBarber = async (barberId: string, data: Partial<Barber>): Promise<Barber | null> => {
    await delay(MOCK_API_DELAY);
    const index = mockBarbers.findIndex(b => b.id === barberId);
    if (index === -1) return null;
    mockBarbers[index] = { ...mockBarbers[index], ...data };
    return mockBarbers[index];
};
export const mockDeleteBarber = async (barberId: string): Promise<boolean> => {
    await delay(MOCK_API_DELAY);
    const initialLength = mockBarbers.length;
    mockBarbers = mockBarbers.filter(b => b.id !== barberId);
    // Also remove barber from appointments (or reassign)
    mockAppointments = mockAppointments.map(app => app.barberId === barberId ? {...app, barberId: undefined, barberName: undefined} : app);
    return mockBarbers.length < initialLength;
};


// --- Appointments ---
export const mockGetClientAppointments = async (clientId: string): Promise<Appointment[]> => {
  await delay(MOCK_API_DELAY);
  return mockAppointments.filter(a => a.clientId === clientId).map(a => ({
      ...a,
      serviceName: mockServices.find(s => s.id === a.serviceId)?.name || 'Serviço Desconhecido',
      barberName: mockBarbers.find(b => b.id === a.barberId)?.name
  }));
};
export const mockGetAdminAppointments = async (barbershopId: string): Promise<Appointment[]> => {
  await delay(MOCK_API_DELAY);
  return mockAppointments.filter(a => a.barbershopId === barbershopId).map(a => ({
      ...a,
      clientName: mockUsers.find(u => u.id === a.clientId)?.name || 'Cliente Desconhecido',
      serviceName: mockServices.find(s => s.id === a.serviceId)?.name || 'Serviço Desconhecido',
      barberName: mockBarbers.find(b => b.id === a.barberId)?.name
  }));
};
export const mockCreateAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> => {
  await delay(MOCK_API_DELAY);
  const client = mockUsers.find(u => u.id === appointmentData.clientId);
  const service = mockServices.find(s => s.id === appointmentData.serviceId);
  const barber = appointmentData.barberId ? mockBarbers.find(b => b.id === appointmentData.barberId) : null;

  const newAppointment: Appointment = { 
    ...appointmentData, 
    id: `appt_${generateId()}`, 
    createdAt: new Date().toISOString(),
    clientName: client?.name,
    serviceName: service?.name,
    barberName: barber?.name
  };
  mockAppointments.push(newAppointment);
  return newAppointment;
};

export const mockUpdateAppointment = async (appointmentId: string, data: Partial<Appointment>): Promise<Appointment | null> => {
  await delay(MOCK_API_DELAY);
  const index = mockAppointments.findIndex(a => a.id === appointmentId);
  if (index === -1) return null;
  
  const client = data.clientId ? mockUsers.find(u => u.id === data.clientId) : mockUsers.find(u => u.id === mockAppointments[index].clientId);
  const service = data.serviceId ? mockServices.find(s => s.id === data.serviceId) : mockServices.find(s => s.id === mockAppointments[index].serviceId);
  const barber = data.barberId ? mockBarbers.find(b => b.id === data.barberId) : (mockAppointments[index].barberId ? mockBarbers.find(b => b.id === mockAppointments[index].barberId) : null);

  mockAppointments[index] = { 
      ...mockAppointments[index], 
      ...data,
      clientName: client?.name,
      serviceName: service?.name,
      barberName: barber?.name
  };
  return mockAppointments[index];
};

export const mockCancelAppointment = async (appointmentId: string, userId: string, cancelledBy: 'client' | 'admin'): Promise<boolean> => {
  await delay(MOCK_API_DELAY);
  const index = mockAppointments.findIndex(a => a.id === appointmentId);
  if (index === -1) return false;
  if (mockAppointments[index].clientId !== userId && mockAppointments[index].barbershopId !== userId) return false; // Basic auth check
  
  mockAppointments[index].status = cancelledBy === 'client' ? 'cancelled_by_client' : 'cancelled_by_admin';
  return true;
};
export const mockCompleteAppointment = async (appointmentId: string): Promise<boolean> => {
    await delay(MOCK_API_DELAY);
    const index = mockAppointments.findIndex(a => a.id === appointmentId);
    if (index === -1) return false;
    mockAppointments[index].status = 'completed';
    return true;
};


// --- Reviews ---
export const mockGetReviewsForBarbershop = async (barbershopId: string): Promise<Review[]> => {
  await delay(MOCK_API_DELAY);
  return mockReviews.filter(r => r.barbershopId === barbershopId).map(r => ({
      ...r,
      clientName: mockUsers.find(u => u.id === r.clientId)?.name || 'Cliente Anônimo'
  }));
};
export const mockGetReviewForAppointment = async (appointmentId: string): Promise<Review | null> => {
  await delay(MOCK_API_DELAY);
  const review = mockReviews.find(r => r.appointmentId === appointmentId);
  if (review) {
    return { ...review, clientName: mockUsers.find(u => u.id === review.clientId)?.name || 'Cliente Anônimo' };
  }
  return null;
}
export const mockAddReview = async (reviewData: Omit<Review, 'id' | 'createdAt' | 'reply' | 'replyAt'>): Promise<Review> => {
  await delay(MOCK_API_DELAY);
  // Prevent duplicate reviews for same appointment
  if (mockReviews.some(r => r.appointmentId === reviewData.appointmentId)) {
      throw new Error("Avaliação para este agendamento já existe.");
  }
  const newReview = { ...reviewData, id: `review_${generateId()}`, createdAt: new Date().toISOString() };
  mockReviews.push(newReview);
  return newReview;
};
export const mockReplyToReview = async (reviewId: string, replyText: string, adminId: string): Promise<Review | null> => {
    await delay(MOCK_API_DELAY);
    const index = mockReviews.findIndex(r => r.id === reviewId);
    if (index === -1) return null;
    if (mockReviews[index].barbershopId !== adminId && !mockUsers.find(u => u.id === adminId && u.type === UserType.ADMIN && u.id === mockReviews[index].barbershopId)) {
        // Basic check if admin owns the barbershop of the review
        throw new Error("Não autorizado a responder esta avaliação.");
    }
    mockReviews[index].reply = replyText;
    mockReviews[index].replyAt = new Date().toISOString();
    return mockReviews[index];
};


// --- Client Data for Admin ---
export const mockGetClientsForBarbershop = async (barbershopId: string): Promise<Partial<User>[]> => {
    await delay(MOCK_API_DELAY);
    const clientIds = new Set(mockAppointments.filter(a => a.barbershopId === barbershopId).map(a => a.clientId));
    return mockUsers.filter(u => u.type === UserType.CLIENT && clientIds.has(u.id))
                    .map(({ id, name, email, phone }) => ({ id, name, email, phone }));
};

export const mockGetAppointmentsForClientByBarbershop = async (clientId: string, barbershopId: string): Promise<Appointment[]> => {
    await delay(MOCK_API_DELAY);
    return mockAppointments.filter(a => a.clientId === clientId && a.barbershopId === barbershopId).map(a => ({
        ...a,
        serviceName: mockServices.find(s => s.id === a.serviceId)?.name || 'Serviço Desconhecido',
        barberName: mockBarbers.find(b => b.id === a.barberId)?.name
    }));
};

// --- Time Slot Generation ---
type BarberHourEntry = { dayOfWeek: number; start: string; end: string; };
type ShopHourEntry = { dayOfWeek: number; start: string; end: string; isOpen: boolean; };
type CombinedHourEntry = BarberHourEntry | ShopHourEntry;


export const mockGetAvailableTimeSlots = async (
  barbershopId: string,
  serviceDuration: number, // in minutes
  dateString: string, // YYYY-MM-DD
  barberId?: string | null
): Promise<string[]> => {
  await delay(MOCK_API_DELAY / 2); // Faster for better UX

  const selectedDate = parseISO(dateString + 'T00:00:00'); // Ensure it's parsed as local midnight
  const dayOfWeek = getDay(selectedDate); // 0 for Sunday, 6 for Saturday

  const barbershopProfile = mockBarbershopProfiles.find(p => p.id === barbershopId);
  if (!barbershopProfile) return [];

  let relevantBarbers: Barber[] = [];
  if (barberId) {
    const specificBarber = mockBarbers.find(b => b.id === barberId && b.barbershopId === barbershopId);
    if (specificBarber) relevantBarbers.push(specificBarber);
  } else {
    relevantBarbers = mockBarbers.filter(b => b.barbershopId === barbershopId);
  }
  
  const shopWorkingHoursToday = barbershopProfile.workingHours.find(wh => wh.dayOfWeek === dayOfWeek);

  let availableSlotsMap = new Map<string, number>(); // Slot -> count of available barbers

  const processBarberAvailability = (barber: Barber | null, hoursEntry: CombinedHourEntry | undefined) => {
    if (!hoursEntry) return;

    const isOpen = ('isOpen' in hoursEntry) ? hoursEntry.isOpen : true; // Assume barber specific hours are 'open' if present
    if (!isOpen) return;


    const [startHour, startMinute] = (hoursEntry.start).split(':').map(Number);
    const [endHour, endMinute] = (hoursEntry.end).split(':').map(Number);

    let slotStart = set(selectedDate, { hours: startHour, minutes: startMinute, seconds: 0, milliseconds: 0 });
    const dayEnd = set(selectedDate, { hours: endHour, minutes: endMinute, seconds: 0, milliseconds: 0 });

    while (isBefore(slotStart, dayEnd)) {
      const slotEnd = addMinutes(slotStart, serviceDuration);
      if (isBefore(slotEnd, dayEnd) || isEqual(slotEnd, dayEnd)) { // Slot must end within working hours
        // Check for conflicts with existing appointments for THIS barber (if specific) or ANY barber (if barberId is null)
        const conflict = mockAppointments.some(app => {
          if (!isSameDay(parseISO(app.date + 'T00:00:00'), selectedDate)) return false;
          // If a specific barber is being checked for availability (barber is not null),
          // an appointment conflicts if it's for THAT barber.
          if (barber && app.barberId && app.barberId !== barber.id) return false;

          // If we are checking "any barber" (barber is null), an appointment made with a specific barber
          // should still count as a conflict for the general pool if that barber is part of `relevantBarbers`.
          // If no relevant barbers (e.g. shop has no barbers defined), then any appointment at the shop is a conflict.
          if (!barber && app.barberId && relevantBarbers.length > 0 && !relevantBarbers.find(b => b.id === app.barberId)) return false;


          const appService = mockServices.find(s => s.id === app.serviceId);
          if (!appService) return false;

          const appStart = parse(app.time, 'HH:mm', new Date(selectedDate)); // Provide a base date for parse
          const appEnd = addMinutes(appStart, appService.duration);
          
          // Check for overlap: (SlotStart < AppEnd) and (SlotEnd > AppStart)
          return isBefore(slotStart, appEnd) && isBefore(appStart, slotEnd);
        });

        if (!conflict) {
          const slotString = format(slotStart, 'HH:mm');
          availableSlotsMap.set(slotString, (availableSlotsMap.get(slotString) || 0) + 1);
        }
      }
      slotStart = addMinutes(slotStart, TIME_SLOTS_INTERVAL); // Move to the next potential slot start
    }
  };


  if (relevantBarbers.length > 0) {
    relevantBarbers.forEach(currentBarber => {
        const barberDayHours = currentBarber.availableHours.find(ah => ah.dayOfWeek === dayOfWeek);
        if (barberDayHours) { 
            processBarberAvailability(currentBarber, barberDayHours);
        } else if (shopWorkingHoursToday && shopWorkingHoursToday.isOpen) { 
            processBarberAvailability(currentBarber, shopWorkingHoursToday);
        }
    });
  } else if (shopWorkingHoursToday && shopWorkingHoursToday.isOpen) { 
     processBarberAvailability(null, shopWorkingHoursToday);
  }


  // Filter slots ensuring they are not in the past for today
  const now = new Date();
  const finalSlots = Array.from(availableSlotsMap.keys())
    .filter(slot => {
      if (isSameDay(selectedDate, startOfDay(now))) {
        const [slotHour, slotMinute] = slot.split(':').map(Number);
        const slotDateTime = set(selectedDate, { hours: slotHour, minutes: slotMinute });
        return isBefore(now, slotDateTime);
      }
      return true;
    })
    .sort(); // Sort chronologically

  return finalSlots;
};