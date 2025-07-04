

import { createPool } from '@vercel/postgres';
import { User, UserType, Service, Barber, Appointment, Review, BarbershopProfile, BarbershopSubscription, SubscriptionPlanTier, BarbershopSearchResultItem, ChatConversation, ChatMessage, FinancialTransaction, ClientLoyaltyStatus } from '../types';
import { SUBSCRIPTION_PLANS, DEFAULT_BARBERSHOP_WORKING_HOURS, TIME_SLOTS_INTERVAL } from '../constants';
import { addMinutes, addWeeks } from 'date-fns';
import { format } from 'date-fns/format';
import { getDay } from 'date-fns/getDay';
import { isSameDay } from 'date-fns/isSameDay';
import { isBefore } from 'date-fns/isBefore';
import { isEqual } from 'date-fns/isEqual';
import { parse } from 'date-fns/parse';
import { set } from 'date-fns/set';
import { startOfDay } from 'date-fns/startOfDay';
import { parseISO } from 'date-fns/parseISO';


// --- DATABASE CONNECTION SETUP ---
const NEON_CONNECTION_STRING = 'postgresql://neondb_owner:npg_Hpz04ZiMuEea@ep-shy-river-acbjgnoi-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = createPool({
  connectionString: process.env.POSTGRES_URL || NEON_CONNECTION_STRING,
  // @ts-ignore - webSocketConstructor is a valid option for the underlying Neon driver but not exposed in Vercel's types.
  // This explicitly passes the browser's WebSocket implementation to the driver, fixing the connection issue in a browser environment.
  webSocketConstructor: typeof window !== 'undefined' ? WebSocket : undefined,
});


let isDbInitialized = false;

// This function sets up the database schema and seeds it with initial data.
async function initializeDatabase() {
  if (isDbInitialized) return;
  console.log('Ensuring database schema is up-to-date...');

  try {
    // Enable UUID generation if not already enabled
    await pool.sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`;

    // Make schema creation idempotent using "IF NOT EXISTS"
    await pool.sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        name TEXT,
        phone TEXT,
        "barbershopName" TEXT,
        address TEXT,
        password_hash TEXT NOT NULL
      );
    `;

    await pool.sql`
      CREATE TABLE IF NOT EXISTS barbershop_profiles (
        id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        "responsibleName" TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        description TEXT,
        "logoUrl" TEXT,
        "coverImageUrl" TEXT,
        "workingHours" JSONB NOT NULL
      );
    `;

    await pool.sql`
      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        "barbershopId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        duration INTEGER NOT NULL,
        "isActive" BOOLEAN NOT NULL,
        description TEXT
      );
    `;
    
    await pool.sql`
      CREATE TABLE IF NOT EXISTS barbers (
        id TEXT PRIMARY KEY,
        "barbershopId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        "availableHours" JSONB,
        "assignedServices" TEXT[]
      );
    `;
    
    await pool.sql`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        "clientId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "barbershopId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "serviceId" TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        "barberId" TEXT REFERENCES barbers(id) ON DELETE SET NULL,
        date DATE NOT NULL,
        time TEXT NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "sourceAppointmentId" TEXT
      );
    `;

    await pool.sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        "appointmentId" TEXT NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
        "clientId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "barbershopId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL,
        comment TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        reply TEXT,
        "replyAt" TIMESTAMP WITH TIME ZONE
      );
    `;

    await pool.sql`
      CREATE TABLE IF NOT EXISTS barbershop_subscriptions (
        "barbershopId" TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        "planId" TEXT NOT NULL,
        status TEXT NOT NULL,
        "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "endDate" TIMESTAMP WITH TIME ZONE,
        "nextBillingDate" TIMESTAMP WITH TIME ZONE
      );
    `;

    await pool.sql`
      CREATE TABLE IF NOT EXISTS chats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "clientId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "barbershopId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "lastMessage" TEXT,
        "lastMessageAt" TIMESTAMP WITH TIME ZONE,
        "clientHasUnread" BOOLEAN DEFAULT FALSE,
        "adminHasUnread" BOOLEAN DEFAULT FALSE
      );
    `;

    // Explicitly add the UNIQUE constraint to handle cases where the table was created without the constraint.
    // This makes the initialization process more robust and ensures ON CONFLICT works as expected.
    try {
        await pool.sql`ALTER TABLE chats ADD CONSTRAINT chats_client_barbershop_unique UNIQUE ("clientId", "barbershopId");`;
        console.log('Ensured UNIQUE constraint on chats("clientId", "barbershopId") exists.');
    } catch (e: any) {
        if (e.code === '42710' || e.message.includes('already exists')) {
            // This is expected if the table and constraint were already created correctly. We can safely ignore this.
        } else {
            // Any other error should be re-thrown as it might indicate a more serious problem.
            console.error("An unexpected error occurred while adding UNIQUE constraint to chats table:", e);
            throw e;
        }
    }
    
    try {
        await pool.sql`ALTER TABLE chats ADD COLUMN IF NOT EXISTS "deletedByClient" BOOLEAN DEFAULT FALSE;`;
        await pool.sql`ALTER TABLE chats ADD COLUMN IF NOT EXISTS "deletedByAdmin" BOOLEAN DEFAULT FALSE;`;
        console.log('Ensured soft delete columns on chats table.');
    } catch (e: any) {
        console.error("An unexpected error occurred while adding soft delete columns to chats table:", e);
        throw e;
    }

    await pool.sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        "chatId" UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
        "senderId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "senderType" TEXT NOT NULL,
        content TEXT NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `;
    
    await pool.sql`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id TEXT PRIMARY KEY,
        "barbershopId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        description TEXT NOT NULL,
        "paymentMethod" TEXT,
        date DATE NOT NULL,
        "appointmentId" TEXT REFERENCES appointments(id) ON DELETE SET NULL
      );
    `;


    console.log('Schema verification complete.');

    // Check if data needs to be seeded by looking for a specific seed entry.
    const { rows: seedCheck } = await pool.sql`SELECT id FROM users WHERE email = 'cliente@exemplo.com'`;

    if (seedCheck.length === 0) {
      console.log('Database is empty. Seeding initial data...');
      
      await pool.sql`
        INSERT INTO users (id, email, type, name, phone, "barbershopName", address, password_hash) VALUES
        ('cliente@exemplo.com', 'cliente@exemplo.com', 'client', 'João Cliente', '(11) 98765-4321', null, null, 'password123'),
        ('admin@barbearia.com', 'admin@barbearia.com', 'admin', 'Carlos Dono', '(21) 91234-5678', 'Barbearia do Carlos', 'Rua das Tesouras, 123, Rio de Janeiro', 'password123'),
        ('vip@navalha.com', 'vip@navalha.com', 'admin', 'Ana Estilista', '(31) 99999-8888', 'Navalha VIP Club', 'Avenida Principal, 789, Belo Horizonte', 'password123');
      `;
      
      await pool.sql`
        INSERT INTO barbershop_profiles (id, name, "responsibleName", email, phone, address, description, "logoUrl", "coverImageUrl", "workingHours") VALUES
        ('admin@barbearia.com', 'Barbearia do Carlos', 'Carlos Dono', 'admin@barbearia.com', '(21) 91234-5678', 'Rua das Tesouras, 123, Rio de Janeiro', 'Cortes clássicos e modernos com a melhor navalha da cidade.', 'https://i.imgur.com/OViX73g.png', 'https://i.imgur.com/LSorq3R.png', ${JSON.stringify(DEFAULT_BARBERSHOP_WORKING_HOURS)}),
        ('vip@navalha.com', 'Navalha VIP Club', 'Ana Estilista', 'vip@navalha.com', '(31) 99999-8888', 'Avenida Principal, 789, Belo Horizonte', 'Experiência premium para o homem que se cuida.', 'https://i.imgur.com/OViX73g.png', 'https://i.imgur.com/ANaRyNn.png', ${JSON.stringify(DEFAULT_BARBERSHOP_WORKING_HOURS.map(wh => ({...wh, start: '10:00', end: '20:00'})))});
      `;
  
      await pool.sql`
        INSERT INTO services (id, "barbershopId", name, price, duration, "isActive", description) VALUES
        ('service1', 'admin@barbearia.com', 'Corte Masculino', 50, 45, true, 'Corte clássico ou moderno, tesoura e máquina.'),
        ('service2', 'admin@barbearia.com', 'Barba Tradicional', 35, 30, true, 'Toalha quente, navalha e produtos premium.'),
        ('service3', 'admin@barbearia.com', 'Combo Corte + Barba', 75, 75, true, 'O pacote completo para um visual impecável.'),
        ('service4', 'admin@barbearia.com', 'Hidratação Capilar', 40, 30, false, 'Tratamento para fortalecer e dar brilho.'),
        ('service5', 'vip@navalha.com', 'Corte VIP', 120, 60, true, 'Atendimento exclusivo com consultoria de imagem.'),
        ('service6', 'vip@navalha.com', 'Barboterapia Premium', 90, 45, true, 'Ritual completo de cuidados para a barba.');
      `;
  
      await pool.sql`
        INSERT INTO barbers (id, "barbershopId", name, "availableHours", "assignedServices") VALUES
        ('barber1_admin@barbearia.com', 'admin@barbearia.com', 'Zé da Navalha', ${JSON.stringify([{dayOfWeek:1, start:'09:00', end:'18:00'}, {dayOfWeek:2, start:'09:00', end:'18:00'}])}, '{"service1","service3"}'),
        ('barber2_admin@barbearia.com', 'admin@barbearia.com', 'Roberto Tesoura', ${JSON.stringify([{dayOfWeek:3, start:'10:00', end:'19:00'}, {dayOfWeek:4, start:'10:00', end:'19:00'}])}, '{"service1","service2"}'),
        ('barber1_vip@navalha.com', 'vip@navalha.com', 'Mestre Arthur', ${JSON.stringify([{dayOfWeek:1, start:'10:00', end:'20:00'}])}, '{"service5","service6"}');
      `;
      
      await pool.sql`
        INSERT INTO appointments (id, "clientId", "barbershopId", "serviceId", "barberId", date, time, status, "createdAt", "sourceAppointmentId") VALUES
        ('appt1', 'cliente@exemplo.com', 'admin@barbearia.com', 'service1', 'barber1_admin@barbearia.com', CURRENT_DATE, '10:00', 'scheduled', NOW(), NULL),
        ('appt2', 'cliente@exemplo.com', 'admin@barbearia.com', 'service2', null, CURRENT_DATE - 2, '14:30', 'completed', NOW() - INTERVAL '2 days', NULL),
        ('appt3', 'cliente@exemplo.com', 'vip@navalha.com', 'service5', null, CURRENT_DATE + 5, '11:00', 'scheduled', NOW(), NULL);
      `;
      
      await pool.sql`
        INSERT INTO reviews (id, "appointmentId", "clientId", "barbershopId", rating, comment, "createdAt") VALUES
        ('review1', 'appt2', 'cliente@exemplo.com', 'admin@barbearia.com', 5, 'Barba impecável, atendimento nota 10!', NOW() - INTERVAL '1 day');
      `;
      
      await pool.sql`
        INSERT INTO barbershop_subscriptions ( "barbershopId", "planId", status, "startDate", "nextBillingDate") VALUES
        ('admin@barbearia.com', 'free', 'active', NOW(), null),
        ('vip@navalha.com', 'pro', 'active', NOW() + INTERVAL '1 month');
      `;

      const { rows: chatRows } = await pool.sql`
        INSERT INTO chats ("clientId", "barbershopId", "lastMessage", "lastMessageAt", "clientHasUnread", "adminHasUnread") VALUES
        ('cliente@exemplo.com', 'admin@barbearia.com', 'Obrigado pelo atendimento!', NOW() - INTERVAL '1 day', false, true)
        RETURNING id;
      `;
      const seededChatId = chatRows[0].id;

      await pool.sql`
        INSERT INTO chat_messages ("chatId", "senderId", "senderType", content, "createdAt") VALUES
        (${seededChatId}, 'admin@barbearia.com', 'admin', 'Seu agendamento para as 14:30 foi concluído. Esperamos que tenha gostado!', NOW() - INTERVAL '2 days'),
        (${seededChatId}, 'cliente@exemplo.com', 'client', 'Obrigado pelo atendimento!', NOW() - INTERVAL '1 day');
      `;
      console.log('Data seeding complete.');
    } else {
      console.log('Database already seeded. Skipping seeding.');
    }

    isDbInitialized = true;
  } catch (e) {
    console.error('Database initialization failed.', e);
    throw e;
  }
}

async function ensureDbInitialized() {
  if (!isDbInitialized) {
    await initializeDatabase();
  }
}

// --- ROBUST DATE HELPERS ---

// A robust function to parse date-only strings or Date objects into 'yyyy-MM-dd' format.
const toYyyyMmDd = (dateInput: any): string => {
  try {
    if (!dateInput) {
      throw new Error("Input is null or undefined.");
    }
    // `parseISO` is robust and handles both 'yyyy-MM-dd' and full ISO strings.
    // If it's already a Date object, it's used directly.
    const date = dateInput instanceof Date ? dateInput : parseISO(String(dateInput));
    if (isNaN(date.getTime())) {
      throw new Error(`Input "${dateInput}" results in an invalid date.`);
    }
    // Formatting to yyyy-MM-dd correctly handles timezone offsets by only using the date parts.
    return format(date, 'yyyy-MM-dd');
  } catch (e) {
    console.error(`toYyyyMmDd failed for input:`, dateInput, `Error:`, (e as Error).message);
    return format(new Date(), 'yyyy-MM-dd'); // Safe fallback
  }
};

// A robust function to convert date/timestamp inputs to a valid ISO string.
const toIsoString = (dateInput: any): string => {
  try {
    if (!dateInput) {
      throw new Error("Input is null or undefined.");
    }
    const date = dateInput instanceof Date ? dateInput : parseISO(String(dateInput));
    if (isNaN(date.getTime())) {
      throw new Error(`Input "${dateInput}" results in an invalid date.`);
    }
    return date.toISOString();
  } catch (e) {
    console.error(`toIsoString failed for input:`, dateInput, `Error:`, (e as Error).message);
    return new Date().toISOString(); // Safe fallback
  }
};

// A robust function to convert optional date/timestamp inputs to an ISO string or undefined.
const toOptionalIsoString = (dateInput: any): string | undefined => {
  if (!dateInput) {
    return undefined;
  }
  try {
    const date = dateInput instanceof Date ? dateInput : parseISO(String(dateInput));
    if (isNaN(date.getTime())) {
       throw new Error(`Input "${dateInput}" results in an invalid date.`);
    }
    return date.toISOString();
  } catch (e) {
     console.error(`toOptionalIsoString failed for input:`, dateInput, `Error:`, (e as Error).message);
     return undefined; // Safe fallback
  }
};


// --- Mappers ---
const mapToUser = (row: any): User => ({
    id: row.id,
    email: row.email,
    type: row.type,
    name: row.name,
    phone: row.phone,
    barbershopName: row.barbershopName,
    address: row.address
});

const mapToBarbershopProfile = (row: any): BarbershopProfile => ({
  id: row.id,
  name: row.name,
  responsibleName: row.responsibleName,
  email: row.email,
  phone: row.phone,
  address: row.address,
  description: row.description,
  logoUrl: row.logoUrl,
  coverImageUrl: row.coverImageUrl,
  workingHours: row.workingHours
});

const mapToService = (row: any): Service => ({
    id: row.id,
    barbershopId: row.barbershopId,
    name: row.name,
    price: Number(row.price),
    duration: row.duration,
    isActive: row.isActive,
    description: row.description
});

const mapToBarber = (row: any): Barber => ({
    id: row.id,
    barbershopId: row.barbershopId,
    name: row.name,
    availableHours: row.availableHours,
    assignedServices: row.assignedServices || []
});

const mapToAppointment = (row: any): Appointment => ({
    id: row.id,
    clientId: row.clientId,
    clientName: row.clientName,
    barbershopId: row.barbershopId,
    barbershopName: row.barbershopName,
    serviceId: row.serviceId,
    serviceName: row.serviceName,
    barberId: row.barberId,
    barberName: row.barberName,
    date: toYyyyMmDd(row.date),
    time: row.time,
    status: row.status,
    notes: row.notes,
    createdAt: toIsoString(row.createdAt),
    sourceAppointmentId: row.sourceAppointmentId,
});

const mapToReview = (row: any): Review => ({
    id: row.id,
    appointmentId: row.appointmentId,
    clientId: row.clientId,
    clientName: row.clientName,
    barbershopId: row.barbershopId,
    rating: row.rating,
    comment: row.comment,
    createdAt: toIsoString(row.createdAt),
    reply: row.reply,
    replyAt: toOptionalIsoString(row.replyAt)
});

const mapToBarbershopSubscription = (row: any): BarbershopSubscription => ({
    barbershopId: row.barbershopId,
    planId: row.planId,
    status: row.status,
    startDate: toIsoString(row.startDate),
    endDate: toOptionalIsoString(row.endDate),
    nextBillingDate: toOptionalIsoString(row.nextBillingDate)
});

const mapToBarbershopSearchResult = (row: any): BarbershopSearchResultItem => ({
    ...mapToBarbershopProfile(row),
    averageRating: Number(row.averageRating || 0),
    reviewCount: Number(row.reviewCount || 0),
    sampleServices: row.sampleServices || [],
    subscriptionTier: row.subscriptionTier || SubscriptionPlanTier.FREE
});

const mapToChatMessage = (row: any): ChatMessage => ({
  id: String(row.id),
  chatId: row.chatId,
  senderId: row.senderId,
  senderType: row.senderType,
  content: row.content,
  createdAt: toIsoString(row.createdAt),
});

const mapToFinancialTransaction = (row: any): FinancialTransaction => ({
  id: row.id,
  barbershopId: row.barbershopId,
  type: row.type,
  amount: Number(row.amount),
  description: row.description,
  paymentMethod: row.paymentMethod,
  date: toYyyyMmDd(row.date),
  appointmentId: row.appointmentId
});

// --- API Functions ---

// --- User & Auth ---
export const mockGetUserById = async (userId: string): Promise<User | null> => {
    await ensureDbInitialized();
    const { rows } = await pool.sql`SELECT * FROM users WHERE id = ${userId}`;
    if (rows.length > 0) {
        return mapToUser(rows[0]);
    }
    return null;
}

export const mockLogin = async (email: string, pass: string): Promise<User | null> => {
  await ensureDbInitialized();
  const lowercasedEmail = email.toLowerCase();
  const { rows } = await pool.sql`SELECT * FROM users WHERE email = ${lowercasedEmail} AND password_hash = ${pass}`;
  if (rows.length > 0) {
    return mapToUser(rows[0]);
  }
  return null;
};

export const mockLogout = () => {
  // In a real app, this would invalidate a token on the server.
  // For the mock, we just confirm it's "logged out".
  return Promise.resolve(true);
};

export const mockSignupClient = async (name: string, email: string, phone: string, pass: string): Promise<User> => {
  await ensureDbInitialized();
  const lowercasedEmail = email.toLowerCase();
  const { rows } = await pool.sql`
    INSERT INTO users (id, email, type, name, phone, password_hash)
    VALUES (${lowercasedEmail}, ${lowercasedEmail}, 'client', ${name}, ${phone}, ${pass})
    ON CONFLICT (email) DO NOTHING
    RETURNING *;
  `;
  if (rows.length === 0) {
    throw new Error('E-mail já cadastrado.');
  }
  return mapToUser(rows[0]);
};

export const mockSignupBarbershop = async (barbershopName: string, responsible: string, email: string, phone: string, address: string, pass: string): Promise<User> => {
  await ensureDbInitialized();
  const lowercasedEmail = email.toLowerCase();
  
  const client = await pool.connect();
  try {
    await client.sql`BEGIN`;
    
    // 1. Create the user
    const { rows: userRows } = await client.sql`
      INSERT INTO users (id, email, type, name, "barbershopName", phone, address, password_hash)
      VALUES (${lowercasedEmail}, ${lowercasedEmail}, 'admin', ${responsible}, ${barbershopName}, ${phone}, ${address}, ${pass})
      ON CONFLICT (email) DO NOTHING
      RETURNING *;
    `;
    if (userRows.length === 0) {
      throw new Error('E-mail já cadastrado.');
    }
    const newUser = mapToUser(userRows[0]);

    // 2. Create the barbershop profile
    await client.sql`
      INSERT INTO barbershop_profiles (id, name, "responsibleName", email, phone, address, description, "logoUrl", "coverImageUrl", "workingHours")
      VALUES (${newUser.id}, ${barbershopName}, ${responsible}, ${lowercasedEmail}, ${phone}, ${address}, '', null, null, ${JSON.stringify(DEFAULT_BARBERSHOP_WORKING_HOURS)});
    `;
    
    // 3. Create a free subscription for the new barbershop
    await client.sql`
      INSERT INTO barbershop_subscriptions ("barbershopId", "planId", status, "startDate")
      VALUES (${newUser.id}, 'free', 'active', NOW());
    `;

    await client.sql`COMMIT`;
    return newUser;
  } catch (e) {
    await client.sql`ROLLBACK`;
    throw e;
  } finally {
    client.release();
  }
};

export const mockUpdateClientProfile = async (clientId: string, profileData: Partial<Pick<User, 'name' | 'phone'>>): Promise<boolean> => {
  await ensureDbInitialized();
  // Email is the user identifier and CANNOT be changed here.
  const { rowCount } = await pool.sql`
    UPDATE users 
    SET name = ${profileData.name}, phone = ${profileData.phone}
    WHERE id = ${clientId} AND type = 'client';
  `;
  return rowCount > 0;
};


export const mockVerifyForgotPassword = async (name: string, email: string, phone: string): Promise<boolean> => {
    await ensureDbInitialized();
    const { rows } = await pool.sql`SELECT id FROM users WHERE name=${name} AND email=${email.toLowerCase()} AND phone=${phone};`;
    return rows.length > 0;
}

export const mockResetPassword = async (email: string, newPass: string): Promise<boolean> => {
    await ensureDbInitialized();
    const lowercasedEmail = email.toLowerCase();
    // Prevent password change for test accounts for demo stability
    if (lowercasedEmail === 'cliente@exemplo.com' || lowercasedEmail === 'admin@barbearia.com' || lowercasedEmail === 'vip@navalha.com') {
        throw new Error('Não é possível alterar a senha de contas de teste.');
    }
    const { rowCount } = await pool.sql`UPDATE users SET password_hash = ${newPass} WHERE email = ${lowercasedEmail}`;
    return rowCount > 0;
}


// --- Barbershop Profile & Settings ---
export const mockGetBarbershopProfile = async (barbershopId: string): Promise<BarbershopProfile | null> => {
  await ensureDbInitialized();
  const { rows } = await pool.sql`SELECT * FROM barbershop_profiles WHERE id = ${barbershopId}`;
  return rows.length > 0 ? mapToBarbershopProfile(rows[0]) : null;
};

export const mockUpdateBarbershopProfile = async (barbershopId: string, profileData: Partial<BarbershopProfile>): Promise<boolean> => {
  await ensureDbInitialized();
  // IMPORTANT: The email is the primary identifier (ID) and should not be changed here.
  // This function is only for updating profile information.
  const { name, responsibleName, phone, address, description, logoUrl, coverImageUrl, workingHours } = profileData;

  const client = await pool.connect();
  try {
    await client.sql`BEGIN`;

    // Update barbershop_profiles table
    const { rowCount } = await client.sql`
      UPDATE barbershop_profiles
      SET 
        name = ${name}, 
        "responsibleName" = ${responsibleName},
        phone = ${phone},
        address = ${address},
        description = ${description},
        "logoUrl" = ${logoUrl},
        "coverImageUrl" = ${coverImageUrl},
        "workingHours" = ${JSON.stringify(workingHours)}
      WHERE id = ${barbershopId};
    `;

    // Also update denormalized data in the users table
    await client.sql`
      UPDATE users
      SET 
        name = ${responsibleName},
        "barbershopName" = ${name},
        phone = ${phone},
        address = ${address}
      WHERE id = ${barbershopId} AND type = 'admin';
    `;

    await client.sql`COMMIT`;
    return rowCount > 0;
  } catch (e) {
    await client.sql`ROLLBACK`;
    console.error("Failed to update barbershop profile:", e);
    throw e; // re-throw the error
  } finally {
    client.release();
  }
};

// --- Services ---
export const mockGetServicesForBarbershop = async (barbershopId: string): Promise<Service[]> => {
  await ensureDbInitialized();
  const { rows } = await pool.sql`SELECT * FROM services WHERE "barbershopId" = ${barbershopId}`;
  return rows.map(mapToService);
};

export const mockGetServiceById = async (serviceId: string): Promise<Service | null> => {
  await ensureDbInitialized();
  const { rows } = await pool.sql`SELECT * FROM services WHERE id = ${serviceId}`;
  return rows.length > 0 ? mapToService(rows[0]) : null;
};

export const mockAddService = async (service: Omit<Service, 'id'>): Promise<Service> => {
  await ensureDbInitialized();
  const newId = `service_${Date.now()}`;
  const { name, price, duration, isActive, description, barbershopId } = service;
  const { rows } = await pool.sql`
    INSERT INTO services (id, "barbershopId", name, price, duration, "isActive", description)
    VALUES (${newId}, ${barbershopId}, ${name}, ${price}, ${duration}, ${isActive}, ${description})
    RETURNING *;
  `;
  return mapToService(rows[0]);
};

export const mockUpdateService = async (serviceId: string, service: Partial<Omit<Service, 'id'>>): Promise<Service> => {
  await ensureDbInitialized();
  const { name, price, duration, isActive, description } = service;
  const { rows } = await pool.sql`
    UPDATE services
    SET name = ${name}, price = ${price}, duration = ${duration}, "isActive" = ${isActive}, description = ${description}
    WHERE id = ${serviceId}
    RETURNING *;
  `;
  return mapToService(rows[0]);
};

export const mockToggleServiceActive = async (serviceId: string, isActive: boolean): Promise<boolean> => {
  await ensureDbInitialized();
  const { rowCount } = await pool.sql`
    UPDATE services SET "isActive" = ${isActive} WHERE id = ${serviceId};
  `;
  return rowCount > 0;
};


// --- Barbers ---
export const mockGetBarbersForBarbershop = async (barbershopId: string): Promise<Barber[]> => {
    await ensureDbInitialized();
    const { rows } = await pool.sql`SELECT * FROM barbers WHERE "barbershopId" = ${barbershopId}`;
    return rows.map(mapToBarber);
};

export const mockGetBarbersForService = async (barbershopId: string, serviceId: string): Promise<Barber[]> => {
    await ensureDbInitialized();
    const { rows } = await pool.sql`
        SELECT * FROM barbers 
        WHERE "barbershopId" = ${barbershopId} AND "assignedServices" @> ARRAY[${serviceId}]
    `;
    return rows.map(mapToBarber);
}

export const mockAddBarber = async (barber: Omit<Barber, 'id'>): Promise<Barber> => {
    await ensureDbInitialized();
    const newId = `barber_${Date.now()}`;
    const { name, availableHours, assignedServices, barbershopId } = barber;
    const { rows } = await pool.sql`
        INSERT INTO barbers (id, "barbershopId", name, "availableHours", "assignedServices")
        VALUES (${newId}, ${barbershopId}, ${name}, ${JSON.stringify(availableHours)}, ${assignedServices as any || null})
        RETURNING *;
    `;
    return mapToBarber(rows[0]);
};

export const mockUpdateBarber = async (barberId: string, barber: Partial<Omit<Barber, 'id'>>): Promise<Barber> => {
    await ensureDbInitialized();
    const { name, availableHours, assignedServices } = barber;
    const { rows } = await pool.sql`
        UPDATE barbers
        SET name = ${name}, "availableHours" = ${JSON.stringify(availableHours)}, "assignedServices" = ${assignedServices as any || null}
        WHERE id = ${barberId}
        RETURNING *;
    `;
    return mapToBarber(rows[0]);
};

export const mockDeleteBarber = async (barberId: string): Promise<boolean> => {
    await ensureDbInitialized();
    const { rowCount } = await pool.sql`DELETE FROM barbers WHERE id = ${barberId}`;
    return rowCount > 0;
};

// --- Clients (from Admin perspective) ---
export const mockGetClientsForBarbershop = async (barbershopId: string): Promise<Partial<User>[]> => {
  await ensureDbInitialized();
  const { rows } = await pool.sql`
    SELECT DISTINCT u.id, u.name, u.email, u.phone FROM users u
    JOIN appointments a ON u.id = a."clientId"
    WHERE a."barbershopId" = ${barbershopId}
    ORDER BY u.name;
  `;
  return rows.map(row => ({ id: row.id, name: row.name, email: row.email, phone: row.phone }));
};

// --- Appointments ---
export const mockGetClientAppointments = async (clientId: string): Promise<Appointment[]> => {
  await ensureDbInitialized();
  const { rows } = await pool.sql`
    SELECT 
        a.*,
        u_client.name as "clientName",
        bp.name as "barbershopName",
        s.name as "serviceName",
        b.name as "barberName"
    FROM appointments a
    JOIN users u_client ON a."clientId" = u_client.id
    JOIN barbershop_profiles bp ON a."barbershopId" = bp.id
    JOIN services s ON a."serviceId" = s.id
    LEFT JOIN barbers b ON a."barberId" = b.id
    WHERE a."clientId" = ${clientId}
    ORDER BY a.date DESC, a.time DESC;
  `;
  return rows.map(mapToAppointment);
};

export const mockGetAdminAppointments = async (barbershopId: string): Promise<Appointment[]> => {
  await ensureDbInitialized();
  const { rows } = await pool.sql`
    SELECT 
        a.*,
        u_client.name as "clientName",
        bp.name as "barbershopName",
        s.name as "serviceName",
        b.name as "barberName"
    FROM appointments a
    JOIN users u_client ON a."clientId" = u_client.id
    JOIN barbershop_profiles bp ON a."barbershopId" = bp.id
    JOIN services s ON a."serviceId" = s.id
    LEFT JOIN barbers b ON a."barberId" = b.id
    WHERE a."barbershopId" = ${barbershopId}
    ORDER BY a.date DESC, a.time DESC;
  `;
  return rows.map(mapToAppointment);
};

export const mockGetAppointmentsForClientByBarbershop = async (clientId: string, barbershopId: string): Promise<Appointment[]> => {
    await ensureDbInitialized();
    const { rows } = await pool.sql`
        SELECT a.*, s.name as "serviceName", b.name as "barberName" FROM appointments a
        JOIN services s ON a."serviceId" = s.id
        LEFT JOIN barbers b ON a."barberId" = b.id
        WHERE a."clientId" = ${clientId} AND a."barbershopId" = ${barbershopId}
        ORDER BY a.date DESC, a.time DESC;
    `;
    return rows.map(mapToAppointment);
}

export const mockCancelAppointment = async (appointmentId: string, userId: string, cancelledBy: 'client' | 'admin'): Promise<boolean> => {
  await ensureDbInitialized();
  const status = cancelledBy === 'client' ? 'cancelled_by_client' : 'cancelled_by_admin';
  // Security check: ensure the user cancelling is part of the appointment
  const { rowCount } = await pool.sql`
    UPDATE appointments SET status = ${status}
    WHERE id = ${appointmentId} AND ("clientId" = ${userId} OR "barbershopId" = ${userId});
  `;
  return rowCount > 0;
};

export const mockCompleteAppointment = async (appointmentId: string): Promise<boolean> => {
  await ensureDbInitialized();
  const client = await pool.connect();
  try {
    await client.sql`BEGIN`;
    const { rowCount } = await client.sql`
      UPDATE appointments SET status = 'completed'
      WHERE id = ${appointmentId} AND status = 'scheduled';
    `;

    if (rowCount > 0) {
        // Automatically add an income transaction
        const { rows: apptRows } = await client.sql`
            SELECT a."barbershopId", a.date, s.price, s.name as "serviceName" 
            FROM appointments a 
            JOIN services s ON a."serviceId" = s.id 
            WHERE a.id = ${appointmentId};
        `;
        if (apptRows.length > 0) {
            const appt = apptRows[0];
            const newTxId = `tx_auto_${Date.now()}`;
            await client.sql`
                INSERT INTO financial_transactions (id, "barbershopId", type, amount, description, "paymentMethod", date, "appointmentId")
                VALUES (${newTxId}, ${appt.barbershopId}, 'income', ${appt.price}, ${`Serviço: ${appt.serviceName}`}, 'other', ${toYyyyMmDd(appt.date)}, ${appointmentId});
            `;
        }
    }

    await client.sql`COMMIT`;
    return rowCount > 0;
  } catch(e) {
      await client.sql`ROLLBACK`;
      throw e;
  } finally {
      client.release();
  }
};

export const mockCreateAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'clientName' | 'serviceName' | 'barberName' | 'barbershopName'>): Promise<Appointment> => {
  await ensureDbInitialized();
  const newId = `appt_${Date.now()}`;
  const { clientId, barbershopId, serviceId, barberId, date, time, status, notes, sourceAppointmentId } = appointmentData;
  const createdAt = new Date().toISOString();

  // Basic validation: Check if time slot is still available
  const existingAppt = await pool.sql`
    SELECT id FROM appointments 
    WHERE "barbershopId" = ${barbershopId} AND date = ${date} AND time = ${time} AND status = 'scheduled'
  `;
  if (existingAppt.rows.length > 0) {
    throw new Error('Este horário não está mais disponível.');
  }

  const { rows } = await pool.sql`
    INSERT INTO appointments (id, "clientId", "barbershopId", "serviceId", "barberId", date, time, status, notes, "createdAt", "sourceAppointmentId")
    VALUES (${newId}, ${clientId}, ${barbershopId}, ${serviceId}, ${barberId || null}, ${date}, ${time}, ${status}, ${notes || null}, ${sourceAppointmentId || null})
    RETURNING id;
  `;
  
  // Refetch to get denormalized names
  const { rows: fullAppt } = await pool.sql`
    SELECT 
        a.*,
        u_client.name as "clientName",
        bp.name as "barbershopName",
        s.name as "serviceName",
        b.name as "barberName"
    FROM appointments a
    JOIN users u_client ON a."clientId" = u_client.id
    JOIN barbershop_profiles bp ON a."barbershopId" = bp.id
    JOIN services s ON a."serviceId" = s.id
    LEFT JOIN barbers b ON a."barberId" = b.id
    WHERE a.id = ${rows[0].id};
  `;
  return mapToAppointment(fullAppt[0]);
};

export const mockUpdateAppointment = async (appointmentId: string, appointmentData: Partial<Appointment>): Promise<Appointment> => {
    await ensureDbInitialized();
    const { clientId, serviceId, barberId, date, time, notes } = appointmentData;
     const { rows } = await pool.sql`
        UPDATE appointments
        SET "clientId"=${clientId}, "serviceId"=${serviceId}, "barberId"=${barberId || null}, date=${date}, time=${time}, notes=${notes}
        WHERE id = ${appointmentId}
        RETURNING id;
     `;
     // Refetch to get denormalized names
    const { rows: fullAppt } = await pool.sql`
        SELECT a.*, u_client.name as "clientName", bp.name as "barbershopName", s.name as "serviceName", b.name as "barberName"
        FROM appointments a
        JOIN users u_client ON a."clientId" = u_client.id
        JOIN barbershop_profiles bp ON a."barbershopId" = bp.id
        JOIN services s ON a."serviceId" = s.id
        LEFT JOIN barbers b ON a."barberId" = b.id
        WHERE a.id = ${rows[0].id};
    `;
    return mapToAppointment(fullAppt[0]);
};


export const mockGetAvailableTimeSlots = async (barbershopId: string, serviceDuration: number, dateStr: string, barberId: string | null): Promise<string[]> => {
    await ensureDbInitialized();
    const date = parse(dateStr, 'yyyy-MM-dd', new Date());
    const dayOfWeek = getDay(date);

    // 1. Get barbershop's working hours for the given day
    const profile = await mockGetBarbershopProfile(barbershopId);
    const dayHours = profile?.workingHours.find(wh => wh.dayOfWeek === dayOfWeek);

    if (!dayHours || !dayHours.isOpen) {
        return [];
    }

    // 2. Determine the working hours to use (barber-specific or barbershop default)
    let startWorkTimeStr = dayHours.start;
    let endWorkTimeStr = dayHours.end;

    if (barberId) {
        const { rows: barberRows } = await pool.sql`SELECT "availableHours" FROM barbers WHERE id = ${barberId}`;
        const barber = barberRows.length > 0 ? { availableHours: barberRows[0].availableHours } : null;
        const barberDayHours = barber?.availableHours?.find((bh: any) => bh.dayOfWeek === dayOfWeek);
        if (barberDayHours) {
            startWorkTimeStr = barberDayHours.start;
            endWorkTimeStr = barberDayHours.end;
        }
    }
    
    // 3. Generate all possible slots
    const allSlots: string[] = [];
    let currentTime = parse(startWorkTimeStr, 'HH:mm', date);
    const endTime = parse(endWorkTimeStr, 'HH:mm', date);
    const now = new Date();

    while (isBefore(currentTime, endTime)) {
        const slotEndTime = addMinutes(currentTime, serviceDuration);
        if (!isBefore(slotEndTime, endTime) && !isEqual(slotEndTime, endTime)) break; // Slot must finish within working hours

        // Don't show slots in the past
        if (!isSameDay(date, now) || isBefore(now, currentTime)) {
             allSlots.push(format(currentTime, 'HH:mm'));
        }
        currentTime = addMinutes(currentTime, TIME_SLOTS_INTERVAL); // Next slot starts after interval
    }

    // 4. Get all booked appointments for that day and barber (if specified)
    let query;

    if (barberId) {
        query = pool.sql`SELECT time FROM appointments WHERE "barbershopId" = ${barbershopId} AND date = ${dateStr} AND status = 'scheduled' AND "barberId" = ${barberId}`;
    } else {
        query = pool.sql`SELECT time FROM appointments WHERE "barbershopId" = ${barbershopId} AND date = ${dateStr} AND status = 'scheduled'`;
    }
    const { rows: bookedAppointments } = await query;
    const bookedSlots = bookedAppointments.map(a => a.time);

    // 5. Filter out booked slots
    return allSlots.filter(slot => !bookedSlots.includes(slot));
};


// --- Reviews ---
export const mockGetReviewsForBarbershop = async (barbershopId: string): Promise<Review[]> => {
    await ensureDbInitialized();
    const { rows } = await pool.sql`
        SELECT r.*, u.name as "clientName" FROM reviews r
        JOIN users u ON r."clientId" = u.id
        WHERE r."barbershopId" = ${barbershopId}
        ORDER BY r."createdAt" DESC;
    `;
    return rows.map(mapToReview);
};

export const mockGetReviewForAppointment = async (appointmentId: string): Promise<Review | null> => {
    await ensureDbInitialized();
    const { rows } = await pool.sql`SELECT * FROM reviews WHERE "appointmentId" = ${appointmentId}`;
    return rows.length > 0 ? mapToReview(rows[0]) : null;
}

export const mockAddReview = async (reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<Review> => {
    await ensureDbInitialized();
    const newId = `review_${Date.now()}`;
    const createdAt = new Date().toISOString();
    const { appointmentId, clientId, clientName, barbershopId, rating, comment } = reviewData;

    // Use ON CONFLICT to update an existing review for the same appointment
    const { rows } = await pool.sql`
        INSERT INTO reviews (id, "appointmentId", "clientId", "barbershopId", rating, comment, "createdAt")
        VALUES (${newId}, ${appointmentId}, ${clientId}, ${barbershopId}, ${rating}, ${comment}, ${createdAt})
        ON CONFLICT ("appointmentId") DO UPDATE 
        SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, "createdAt" = EXCLUDED."createdAt"
        RETURNING *;
    `;
    return mapToReview({ ...rows[0], clientName });
};

export const mockReplyToReview = async (reviewId: string, replyText: string, adminId: string): Promise<boolean> => {
    await ensureDbInitialized();
    // Extra check to ensure the replier is the owner of the barbershop
    const { rowCount } = await pool.sql`
        UPDATE reviews r
        SET reply = ${replyText}, "replyAt" = NOW()
        FROM appointments a
        WHERE r.id = ${reviewId} AND r."appointmentId" = a.id AND a."barbershopId" = ${adminId};
    `;
    if (rowCount === 0) {
        throw new Error('Permissão negada ou avaliação não encontrada.');
    }
    return true;
};


// --- Subscriptions ---
export const mockGetBarbershopSubscription = async (barbershopId: string): Promise<BarbershopSubscription | null> => {
    await ensureDbInitialized();
    const { rows } = await pool.sql`SELECT * FROM barbershop_subscriptions WHERE "barbershopId" = ${barbershopId}`;
    return rows.length > 0 ? mapToBarbershopSubscription(rows[0]) : null;
};

export const mockUpdateBarbershopSubscription = async (barbershopId: string, planId: SubscriptionPlanTier): Promise<boolean> => {
    await ensureDbInitialized();
    const newSub = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!newSub) return false;

    const status = 'active';
    const startDate = new Date().toISOString();
    const nextBillingDate = planId === 'free' ? null : addWeeks(new Date(), 4).toISOString();

    const { rowCount } = await pool.sql`
        INSERT INTO barbershop_subscriptions ("barbershopId", "planId", status, "startDate", "nextBillingDate")
        VALUES (${barbershopId}, ${planId}, ${status}, ${startDate}, ${nextBillingDate})
        ON CONFLICT ("barbershopId") DO UPDATE 
        SET "planId" = EXCLUDED."planId",
            status = EXCLUDED.status,
            "startDate" = EXCLUDED."startDate",
            "nextBillingDate" = EXCLUDED."nextBillingDate";
    `;

    return rowCount > 0;
};

// --- Public / Search ---
export const mockGetPublicBarbershops = async (): Promise<BarbershopSearchResultItem[]> => {
    await ensureDbInitialized();
    const { rows } = await pool.sql`
        SELECT 
            bp.*, 
            sub."planId" as "subscriptionTier",
            COALESCE(rev_stats.avg_rating, 0) as "averageRating",
            COALESCE(rev_stats.review_count, 0) as "reviewCount",
            (SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'price', s.price))
             FROM (
                SELECT id, name, price 
                FROM services 
                WHERE "barbershopId" = bp.id AND "isActive" = true 
                ORDER BY price
                LIMIT 3
             ) s
            ) as "sampleServices"
        FROM barbershop_profiles bp
        LEFT JOIN barbershop_subscriptions sub ON bp.id = sub."barbershopId"
        LEFT JOIN (
            SELECT 
                "barbershopId", 
                AVG(rating) as avg_rating, 
                COUNT(id) as review_count 
            FROM reviews 
            GROUP BY "barbershopId"
        ) as rev_stats ON bp.id = rev_stats."barbershopId"
        ORDER BY sub."planId" DESC, "averageRating" DESC;
    `;
    return rows.map(mapToBarbershopSearchResult);
};

// --- Chat ---
export const mockGetAdminConversations = async (barbershopId: string): Promise<ChatConversation[]> => {
  await ensureDbInitialized();
  const { rows } = await pool.sql`
    SELECT 
        c.id, c."clientId", u.name as "clientName", u.phone as "clientPhone", 
        c."barbershopId", bp.name as "barbershopName", bp."logoUrl" as "barbershopLogoUrl",
        c."lastMessage", c."lastMessageAt", c."adminHasUnread" as "hasUnread"
    FROM chats c
    JOIN users u ON c."clientId" = u.id
    JOIN barbershop_profiles bp ON c."barbershopId" = bp.id
    WHERE c."barbershopId" = ${barbershopId} AND c."deletedByAdmin" = FALSE
    ORDER BY c."lastMessageAt" DESC;
  `;
  return rows.map(row => ({
    id: row.id,
    clientId: row.clientId,
    clientName: row.clientName,
    clientPhone: row.clientPhone,
    barbershopId: row.barbershopId,
    barbershopName: row.barbershopName,
    barbershopLogoUrl: row.barbershopLogoUrl,
    lastMessage: row.lastMessage,
    lastMessageAt: toOptionalIsoString(row.lastMessageAt),
    hasUnread: row.hasUnread,
  }));
};

export const mockGetClientConversations = async (clientId: string): Promise<ChatConversation[]> => {
  await ensureDbInitialized();
  const { rows } = await pool.sql`
    SELECT 
        c.id, c."clientId", u.name as "clientName",
        c."barbershopId", bp.name as "barbershopName", bp."logoUrl" as "barbershopLogoUrl", bp.phone as "barbershopPhone",
        c."lastMessage", c."lastMessageAt", c."clientHasUnread" as "hasUnread"
    FROM chats c
    JOIN users u ON c."clientId" = u.id
    JOIN barbershop_profiles bp ON c."barbershopId" = bp.id
    WHERE c."clientId" = ${clientId} AND c."deletedByClient" = FALSE
    ORDER BY c."lastMessageAt" DESC;
  `;
  return rows.map(row => ({
    id: row.id,
    clientId: row.clientId,
    clientName: row.clientName,
    barbershopId: row.barbershopId,
    barbershopName: row.barbershopName,
    barbershopLogoUrl: row.barbershopLogoUrl,
    barbershopPhone: row.barbershopPhone,
    lastMessage: row.lastMessage,
    lastMessageAt: toOptionalIsoString(row.lastMessageAt),
    hasUnread: row.hasUnread,
  }));
};

export const mockGetMessagesForChat = async (chatId: string, userId: string, userType: UserType): Promise<ChatMessage[]> => {
  await ensureDbInitialized();
  const client = await pool.connect();
  try {
    // Mark messages as read for the current user
    if (userType === UserType.ADMIN) {
      await client.sql`UPDATE chats SET "adminHasUnread" = FALSE WHERE id = ${chatId}::uuid AND "barbershopId" = ${userId};`;
    } else {
      await client.sql`UPDATE chats SET "clientHasUnread" = FALSE WHERE id = ${chatId}::uuid AND "clientId" = ${userId};`;
    }

    // Fetch messages
    const { rows } = await client.sql`
      SELECT * FROM chat_messages 
      WHERE "chatId" = ${chatId}::uuid
      ORDER BY "createdAt" ASC;
    `;
    return rows.map(mapToChatMessage);
  } finally {
    client.release();
  }
};

export const mockSendMessage = async (chatId: string, senderId: string, senderType: UserType, content: string): Promise<ChatMessage> => {
  await ensureDbInitialized();
  const client = await pool.connect();
  try {
    await client.sql`BEGIN`;
    
    // Insert message
    const { rows: messageRows } = await client.sql`
      INSERT INTO chat_messages ("chatId", "senderId", "senderType", content, "createdAt")
      VALUES (${chatId}::uuid, ${senderId}, ${senderType}, ${content}, NOW())
      RETURNING *;
    `;

    // Update chat metadata
    const clientHasUnread = senderType === UserType.ADMIN;
    const adminHasUnread = senderType === UserType.CLIENT;

    await client.sql`
      UPDATE chats
      SET "lastMessage" = ${content},
          "lastMessageAt" = NOW(),
          "clientHasUnread" = "clientHasUnread" OR ${clientHasUnread},
          "adminHasUnread" = "adminHasUnread" OR ${adminHasUnread},
          "deletedByClient" = FALSE, -- Undelete if user sends a new message
          "deletedByAdmin" = FALSE
      WHERE id = ${chatId}::uuid;
    `;

    await client.sql`COMMIT`;
    return mapToChatMessage(messageRows[0]);
  } catch (e) {
    await client.sql`ROLLBACK`;
    throw e;
  } finally {
    client.release();
  }
};

export const mockCreateOrGetConversation = async (clientId: string, barbershopId: string): Promise<ChatConversation> => {
  await ensureDbInitialized();
  
  // Use a transaction to ensure atomicity
  const dbClient = await pool.connect();
  try {
    await dbClient.sql`BEGIN`;

    // Insert or update the chat. If it exists, undelete it for the client who is initiating.
    await dbClient.sql`
      INSERT INTO chats ("clientId", "barbershopId", "deletedByClient")
      VALUES (${clientId}, ${barbershopId}, FALSE)
      ON CONFLICT ("clientId", "barbershopId") 
      DO UPDATE SET "deletedByClient" = FALSE;
    `;

    // Now that we're sure the chat exists and is visible to the client, fetch its full details.
    const { rows: convoRows } = await dbClient.sql`
      SELECT 
          c.id, c."clientId", u_client.name as "clientName",
          c."barbershopId", bp.name as "barbershopName", bp."logoUrl" as "barbershopLogoUrl", bp.phone as "barbershopPhone",
          c."lastMessage", c."lastMessageAt", c."clientHasUnread" as "hasUnread"
      FROM chats c
      JOIN users u_client ON c."clientId" = u_client.id
      JOIN barbershop_profiles bp ON c."barbershopId" = bp.id
      WHERE c."clientId" = ${clientId} AND c."barbershopId" = ${barbershopId};
    `;
    
    await dbClient.sql`COMMIT`;

    if (convoRows.length === 0) {
      // This should ideally not happen due to the logic above.
      throw new Error(`Integrity error: Could not find conversation for client ${clientId} and barbershop ${barbershopId}.`);
    }

    const row = convoRows[0];
    return {
      id: row.id,
      clientId: row.clientId,
      clientName: row.clientName,
      barbershopId: row.barbershopId,
      barbershopName: row.barbershopName,
      barbershopLogoUrl: row.barbershopLogoUrl,
      barbershopPhone: row.barbershopPhone,
      lastMessage: row.lastMessage,
      lastMessageAt: toOptionalIsoString(row.lastMessageAt),
      hasUnread: row.hasUnread,
    };

  } catch (error) {
    await dbClient.sql`ROLLBACK`;
    console.error("Error in mockCreateOrGetConversation:", error);
    throw error;
  } finally {
    dbClient.release();
  }
};

export const mockDeleteChatForUser = async (chatId: string, userType: UserType): Promise<boolean> => {
  await ensureDbInitialized();
  let updateQuery;
  if (userType === 'admin') {
    updateQuery = pool.sql`UPDATE chats SET "deletedByAdmin" = TRUE WHERE id = ${chatId}::uuid;`;
  } else {
    updateQuery = pool.sql`UPDATE chats SET "deletedByClient" = TRUE WHERE id = ${chatId}::uuid;`;
  }
  const { rowCount } = await updateQuery;
  return rowCount > 0;
};

// --- Financials ---
export const mockGetFinancialTransactions = async (barbershopId: string, date: string): Promise<FinancialTransaction[]> => {
    await ensureDbInitialized();
    const { rows } = await pool.sql`
        SELECT * FROM financial_transactions 
        WHERE "barbershopId" = ${barbershopId} AND date = ${date}
        ORDER BY type, "id" DESC;
    `;
    return rows.map(mapToFinancialTransaction);
};

export const mockAddFinancialTransaction = async (barbershopId: string, date: string, transactionData: Omit<FinancialTransaction, 'id' | 'barbershopId' | 'date'>): Promise<FinancialTransaction> => {
    await ensureDbInitialized();
    const newId = `tx_${Date.now()}`;
    const { type, amount, description, paymentMethod, appointmentId } = transactionData;
    
    const { rows } = await pool.sql`
        INSERT INTO financial_transactions (id, "barbershopId", type, amount, description, "paymentMethod", date, "appointmentId")
        VALUES (${newId}, ${barbershopId}, ${type}, ${amount}, ${description}, ${paymentMethod}, ${date}, ${appointmentId || null})
        RETURNING *;
    `;
    return mapToFinancialTransaction(rows[0]);
};

// --- Loyalty ---
export const mockGetClientLoyaltyStatus = async (clientId: string): Promise<ClientLoyaltyStatus[]> => {
    await ensureDbInitialized();
    const { rows } = await pool.sql`
        SELECT 
            a."barbershopId",
            bp.name as "barbershopName",
            bp."logoUrl" as "barbershopLogoUrl",
            COUNT(a.id) as "completedCount"
        FROM appointments a
        JOIN barbershop_profiles bp ON a."barbershopId" = bp.id
        WHERE a."clientId" = ${clientId} AND a.status = 'completed'
        GROUP BY a."barbershopId", bp.name, bp."logoUrl"
        HAVING COUNT(a.id) > 0;
    `;
    return rows.map(row => ({
        barbershopId: row.barbershopId,
        barbershopName: row.barbershopName,
        barbershopLogoUrl: row.barbershopLogoUrl,
        completedCount: Number(row.completedCount)
    }));
};

// --- Recurrence ---
export const mockCreateFutureAppointment = async (sourceAppointment: Appointment, weeksInFuture: number): Promise<Appointment> => {
    await ensureDbInitialized();
    
    const sourceDate = parseISO(sourceAppointment.date);
    const futureDate = addWeeks(sourceDate, weeksInFuture);
    const futureDateStr = format(futureDate, 'yyyy-MM-dd');
    
    // Check if the future slot is available
    const service = await mockGetServiceById(sourceAppointment.serviceId);
    if (!service) throw new Error('Serviço do agendamento original não encontrado.');

    const availableSlots = await mockGetAvailableTimeSlots(
        sourceAppointment.barbershopId,
        service.duration,
        futureDateStr,
        sourceAppointment.barberId || null
    );

    if (!availableSlots.includes(sourceAppointment.time)) {
        throw new Error(`O horário ${sourceAppointment.time} não está disponível em ${format(futureDate, 'dd/MM/yyyy')}.`);
    }

    const newAppointmentData: Omit<Appointment, 'id' | 'createdAt' | 'clientName' | 'serviceName' | 'barberName' | 'barbershopName'> = {
        clientId: sourceAppointment.clientId,
        barbershopId: sourceAppointment.barbershopId,
        serviceId: sourceAppointment.serviceId,
        barberId: sourceAppointment.barberId,
        date: futureDateStr,
        time: sourceAppointment.time,
        status: 'scheduled',
        notes: sourceAppointment.notes,
        sourceAppointmentId: sourceAppointment.id,
    };

    return mockCreateAppointment(newAppointmentData);
};
