export enum UserType {
  CLIENT = 'client',
  ADMIN = 'admin', // Represents a Barbershop owner/manager
}

export interface User {
  id: string;
  email: string;
  type: UserType;
  name?: string; // Client name or Barbershop responsible name
  phone?: string;
  barbershopName?: string; // Only for admin users (name of their barbershop)
  address?: string; // Only for admin users (address of their barbershop for initial setup)
  // Password is not stored here, token is handled by mock API
}

export interface Service {
  id: string;
  barbershopId: string;
  name: string;
  price: number;
  duration: number; // in minutes
  isActive: boolean;
  description?: string;
}

export interface Barber {
  id: string;
  barbershopId: string;
  name: string;
  availableHours: { dayOfWeek: number; start: string; end: string }[]; // 0 for Sunday, 6 for Saturday
  assignedServices: string[]; // array of service IDs
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName?: string; // Denormalized for easier display
  barbershopId: string;
  barbershopName?: string; // Denormalized
  serviceId: string;
  serviceName?: string; // Denormalized
  barberId?: string; // Optional: if specific barber chosen
  barberName?: string; // Denormalized
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'scheduled' | 'completed' | 'cancelled_by_client' | 'cancelled_by_admin';
  notes?: string;
  createdAt: string; // ISO date string
}

export interface Review {
  id: string;
  appointmentId: string;
  clientId: string;
  clientName?: string; // Denormalized
  barbershopId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string; // ISO date string
  reply?: string; // Admin's reply
  replyAt?: string; // ISO date string
}

export enum SubscriptionPlanTier {
  FREE = 'free',
  PRO = 'pro',
}

export interface SubscriptionPlan {
  id: SubscriptionPlanTier;
  name: string;
  price: number; // per month
  appointmentLimit: number | 'unlimited';
  employeeLimit: number | 'unlimited';
  features: string[];
}

export interface BarbershopSubscription {
  barbershopId: string;
  planId: SubscriptionPlanTier;
  status: 'active' | 'inactive' | 'past_due' | 'cancelled'; // inactive could mean payment failed
  startDate: string; // ISO date string
  endDate?: string; // ISO date string for fixed term or cancellation
  nextBillingDate?: string; // ISO date string
}

export interface BarbershopProfile {
  id: string; // same as user.id for admin type user
  name: string; // Barbershop name
  responsibleName: string;
  email: string; // Contact email for the barbershop
  phone: string;
  address: string;
  description?: string;
  logoUrl?: string; // URL to logo image
  coverImageUrl?: string; // URL to cover image
  workingHours: { dayOfWeek: number; start: string; end: string; isOpen: boolean }[];
  // Other settings like cover images, specific theme colors could be added later
}

export interface NotificationMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// New type for the find barbershops page
export interface BarbershopSearchResultItem extends BarbershopProfile {
  averageRating: number;
  reviewCount: number;
  sampleServices: Pick<Service, 'id' | 'name' | 'price'>[]; 
  subscriptionTier: SubscriptionPlanTier;
}