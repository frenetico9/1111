import { createPool } from '@vercel/postgres';
import { User, UserType, Service, Barber, Appointment, Review, BarbershopProfile, FinancialTransaction, ClientLoyaltyStatus, BarbershopSubscription, SubscriptionPlanTier, BarbershopSearchResultItem } from '../types';
import { DEFAULT_BARBERSHOP_WORKING_HOURS, TIME_SLOTS_INTERVAL, CORTE_CERTO_ID } from '../constants';
import { addMinutes, addWeeks } from 'date-fns';
import { format } from 'date-fns/format';
import { getDay } from 'date-fns/getDay';
import { isSameDay } from 'date-fns/isSameDay';
import { isBefore } from 'date-fns/isBefore';
import { isEqual } from 'date-fns/isEqual';
import { parse } from 'date-fns/parse';
import { startOfDay } from 'date-fns/startOfDay';
import { parseISO } from 'date-fns/parseISO';


// --- DATABASE CONNECTION SETUP ---
const NEON_CONNECTION_STRING = 'postgresql://neondb_owner:npg_Hpz04ZiMuEea@ep-shy-river-acbjgnoi-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = createPool({
  connectionString: process.env.POSTGRES_URL || NEON_CONNECTION_STRING,
});


let isDbInitialized = false;

// This function sets up the database schema and seeds it with initial data.
async function initializeDatabase() {
  if (isDbInitialized) return;
  console.log('Ensuring database schema is up-to-date...');

  try {
    // Enable UUID generation if not already enabled
    await pool.sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`;
    
    // Drop existing tables for a clean slate, in correct order
    await pool.sql`DROP TABLE IF EXISTS financial_transactions CASCADE;`;
    await pool.sql`DROP TABLE IF EXISTS reviews CASCADE;`;
    await pool.sql`DROP TABLE IF EXISTS appointments CASCADE;`;
    await pool.sql`DROP TABLE IF EXISTS subscriptions CASCADE;`;
    await pool.sql`DROP TABLE IF EXISTS barbers CASCADE;`;
    await pool.sql`DROP TABLE IF EXISTS services CASCADE;`;
    await pool.sql`DROP TABLE IF EXISTS barbershop_profiles CASCADE;`;
    await pool.sql`DROP TABLE IF EXISTS users CASCADE;`;
    
    console.log('Old tables dropped.');


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
    
     await pool.sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        "barbershopId" TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        "planId" TEXT NOT NULL,
        status TEXT NOT NULL,
        "currentPeriodStart" TIMESTAMP WITH TIME ZONE NOT NULL,
        "nextBillingDate" TIMESTAMP WITH TIME ZONE
      );
    `;


    console.log('Schema verification complete.');

    // Seed data for Corte Certo
    console.log('Seeding initial data for Corte Certo Barbearia...');
    
    const adminId = CORTE_CERTO_ID;
    const adminName = 'Sérgio Cabelereiro';
    const barbershopName = 'Corte Certo Barbearia';
    const barbershopAddress = 'Rua da Navalha, 456, Brasília';

    await pool.sql`
        INSERT INTO users (id, email, type, name, phone, "barbershopName", address, password_hash) VALUES
        ('cliente@exemplo.com', 'cliente@exemplo.com', 'client', 'João Cliente', '(11) 98765-4321', null, null, 'password123'),
        (${adminId}, ${adminId}, 'admin', ${adminName}, '(61) 91234-5678', ${barbershopName}, ${barbershopAddress}, 'password123');
    `;
    
    await pool.sql`
        INSERT INTO barbershop_profiles (id, name, "responsibleName", email, phone, address, description, "logoUrl", "coverImageUrl", "workingHours") VALUES
        (${adminId}, ${barbershopName}, ${adminName}, ${adminId}, '(61) 91234-5678', ${barbershopAddress}, 'Onde o estilo encontra a precisão. Cortes modernos e clássicos com a melhor navalha da cidade.', 'https://i.imgur.com/kYq8nDb.png', 'https://i.imgur.com/LSorq3R.png', ${JSON.stringify(DEFAULT_BARBERSHOP_WORKING_HOURS)});
    `;
    
    await pool.sql`
        INSERT INTO services (id, "barbershopId", name, price, duration, "isActive", description) VALUES
        ('service1', ${adminId}, 'Corte Masculino', 50, 45, true, 'Corte clássico ou moderno, tesoura e máquina.'),
        ('service2', ${adminId}, 'Barba Tradicional', 35, 30, true, 'Toalha quente, navalha e produtos premium.'),
        ('service3', ${adminId}, 'Combo Corte + Barba', 75, 75, true, 'O pacote completo para um visual impecável.'),
        ('service4', ${adminId}, 'Hidratação Capilar', 40, 30, false, 'Tratamento para fortalecer e dar brilho.');
    `;

    await pool.sql`
        INSERT INTO barbers (id, "barbershopId", name, "availableHours", "assignedServices") VALUES
        ('barber1', ${adminId}, 'Zé da Navalha', ${JSON.stringify([{dayOfWeek:1, start:'09:00', end:'18:00'}, {dayOfWeek:2, start:'09:00', end:'18:00'}])}, '{"service1","service3"}'),
        ('barber2', ${adminId}, 'Roberto Tesoura', ${JSON.stringify([{dayOfWeek:3, start:'10:00', end:'19:00'}, {dayOfWeek:4, start:'10:00', end:'19:00'}])}, '{"service1","service2"}');
    `;
    
    await pool.sql`
        INSERT INTO appointments (id, "clientId", "barbershopId", "serviceId", "barberId", date, time, status, "createdAt", "sourceAppointmentId") VALUES
        ('appt1', 'cliente@exemplo.com', ${adminId}, 'service1', 'barber1', CURRENT_DATE, '10:00', 'scheduled', NOW(), NULL),
        ('appt2', 'cliente@exemplo.com', ${adminId}, 'service2', null, CURRENT_DATE - 2, '14:30', 'completed', NOW() - INTERVAL '2 days', NULL);
    `;
    
    await pool.sql`
        INSERT INTO reviews (id, "appointmentId", "clientId", "barbershopId", rating, comment, "createdAt") VALUES
        ('review1', 'appt2', 'cliente@exemplo.com', ${adminId}, 5, 'Barba impecável, atendimento nota 10!', NOW() - INTERVAL '1 day');
    `;
    
    await pool.sql`
      INSERT INTO subscriptions ("barbershopId", "planId", status, "currentPeriodStart", "nextBillingDate") VALUES
      (${adminId}, 'pro', 'active', NOW(), NOW() + INTERVAL '1 month');
    `;


    console.log('Data seeding complete.');

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
    const date = dateInput instanceof Date ? dateInput : parseISO(String(dateInput));
    if (isNaN(date.getTime())) {
      throw new Error(`Input "${dateInput}" results in an invalid date.`);
    }
    return format(date, 'yyyy-MM-dd');
  } catch (e) {
    console.error(`toYyyyMmDd failed for input:`, dateInput, `Error:`, (e as Error).message);
    return format(new Date(), 'yyyy-MM-dd'); // Safe fallback
  }
};

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

const mapToBarbershopSubscription = (row: any): BarbershopSubscription => ({
    barbershopId: row.barbershopId,
    planId: row.planId,
    status: row.status,
    currentPeriodStart: toIsoString(row.currentPeriodStart),
    nextBillingDate: toOptionalIsoString(row.nextBillingDate)
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

export const mockSignupBarbershop = async (barbershopName: string, responsibleName: string, email: string, phone: string, address: string, pass: string): Promise<User> => {
    await ensureDbInitialized();
    const lowercasedEmail = email.toLowerCase();
    
    const client = await pool.connect();
    try {
        await client.sql`BEGIN`;

        // Create user
        const { rows: userRows } = await client.sql`
            INSERT INTO users (id, email, type, name, phone, "barbershopName", address, password_hash)
            VALUES (${lowercasedEmail}, ${lowercasedEmail}, 'admin', ${responsibleName}, ${phone}, ${barbershopName}, ${address}, ${pass})
            ON CONFLICT (email) DO NOTHING
            RETURNING *;
        `;
        if (userRows.length === 0) {
            throw new Error('E-mail já cadastrado.');
        }
        const newUser = mapToUser(userRows[0]);

        // Create barbershop profile
        await client.sql`
            INSERT INTO barbershop_profiles (id, name, "responsibleName", email, phone, address, "workingHours")
            VALUES (${newUser.id}, ${barbershopName}, ${responsibleName}, ${lowercasedEmail}, ${phone}, ${address}, ${JSON.stringify(DEFAULT_BARBERSHOP_WORKING_HOURS)});
        `;
        
        // Create free subscription
        await client.sql`
            INSERT INTO subscriptions ("barbershopId", "planId", status, "currentPeriodStart")
            VALUES (${newUser.id}, ${SubscriptionPlanTier.FREE}, 'active', NOW());
        `;

        await client.sql`COMMIT`;
        return newUser;

    } catch (e) {
        await client.sql`ROLLBACK`;
        console.error("Failed to signup barbershop:", e);
        throw e;
    } finally {
        client.release();
    }
}


export const mockUpdateClientProfile = async (clientId: string, profileData: Partial<Pick<User, 'name' | 'phone'>>): Promise<boolean> => {
  await ensureDbInitialized();
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
    if (lowercasedEmail === 'cliente@exemplo.com' || lowercasedEmail === CORTE_CERTO_ID) {
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
  const { name, responsibleName, phone, address, description, logoUrl, coverImageUrl, workingHours } = profileData;

  const client = await pool.connect();
  try {
    await client.sql`BEGIN`;

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
    throw e;
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

    const profile = await mockGetBarbershopProfile(barbershopId);
    const dayHours = profile?.workingHours.find(wh => wh.dayOfWeek === dayOfWeek);

    if (!dayHours || !dayHours.isOpen) {
        return [];
    }

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
    
    const allSlots: string[] = [];
    let currentTime = parse(startWorkTimeStr, 'HH:mm', date);
    const endTime = parse(endWorkTimeStr, 'HH:mm', date);
    const now = new Date();

    while (isBefore(currentTime, endTime)) {
        const slotEndTime = addMinutes(currentTime, serviceDuration);
        if (!isBefore(slotEndTime, endTime) && !isEqual(slotEndTime, endTime)) break;

        if (!isSameDay(date, now) || isBefore(now, currentTime)) {
             allSlots.push(format(currentTime, 'HH:mm'));
        }
        currentTime = addMinutes(currentTime, TIME_SLOTS_INTERVAL);
    }

    let query;

    if (barberId) {
        query = pool.sql`SELECT time FROM appointments WHERE "barbershopId" = ${barbershopId} AND date = ${dateStr} AND status = 'scheduled' AND "barberId" = ${barberId}`;
    } else {
        query = pool.sql`SELECT time FROM appointments WHERE "barbershopId" = ${barbershopId} AND date = ${dateStr} AND status = 'scheduled'`;
    }
    const { rows: bookedAppointments } = await query;
    const bookedSlots = bookedAppointments.map(a => a.time);

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


// --- Chat ---
// Mock data structure for chat
interface ChatConversationInDB {
    id: string; // e.g., "chat_adminId_clientId"
    adminId: string;
    clientId: string;
    lastMessage: string;
    lastMessageAt: string;
    adminUnread: boolean;
    clientUnread: boolean;
}
interface ChatMessageInDB {
    id: string;
    chatId: string;
    senderId: string;
    senderType: UserType;
    content: string;
    createdAt: string;
}

// In-memory store for chat to avoid DB complexity for this feature
let mockChatConversations: ChatConversationInDB[] = [];
let mockChatMessages: ChatMessageInDB[] = [];

// Function to get or create a chat
async function getOrCreateChat(adminId: string, clientId: string): Promise<ChatConversationInDB> {
    const chatId = `chat_${adminId}_${clientId}`;
    let chat = mockChatConversations.find(c => c.id === chatId);
    if (!chat) {
        chat = {
            id: chatId,
            adminId,
            clientId,
            lastMessage: '',
            lastMessageAt: new Date().toISOString(),
            adminUnread: false,
            clientUnread: false,
        };
        mockChatConversations.push(chat);
    }
    return chat;
}

export const mockGetAdminConversations = async (adminId: string): Promise<any[]> => {
    // This would be a DB query in a real app
    const convos = mockChatConversations.filter(c => c.adminId === adminId);
    const results = await Promise.all(convos.map(async c => {
        const client = await mockGetUserById(c.clientId);
        return {
            id: c.id,
            clientId: c.clientId,
            clientName: client?.name || 'Cliente Desconhecido',
            lastMessage: c.lastMessage,
            lastMessageAt: c.lastMessageAt,
            hasUnread: c.adminUnread,
        };
    }));
    return results.sort((a,b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

export const mockGetMessagesForChat = async (chatId: string, userId: string, userType: UserType): Promise<any[]> => {
    // In a real app, you'd check if the user has permission to view this chat
    const chat = mockChatConversations.find(c => c.id === chatId);
    if (!chat) throw new Error("Chat não encontrado");
    
    // Mark as read
    if (userType === 'admin') {
        chat.adminUnread = false;
    } else {
        chat.clientUnread = false;
    }
    
    return mockChatMessages.filter(m => m.chatId === chatId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export const mockSendMessage = async (chatId: string, senderId: string, senderType: UserType, content: string): Promise<any> => {
    const chat = mockChatConversations.find(c => c.id === chatId);
    if (!chat) throw new Error("Chat não encontrado");

    const newMessage: ChatMessageInDB = {
        id: `msg_${Date.now()}`,
        chatId,
        senderId,
        senderType,
        content,
        createdAt: new Date().toISOString(),
    };
    mockChatMessages.push(newMessage);

    // Update conversation metadata
    chat.lastMessage = content;
    chat.lastMessageAt = newMessage.createdAt;
    if (senderType === 'admin') {
        chat.clientUnread = true;
    } else {
        chat.adminUnread = true;
    }

    return newMessage;
};

export const mockDeleteChatForUser = async (chatId: string, userType: UserType): Promise<boolean> => {
    // This is a "soft delete" for one user. The other user can still see the chat.
    // In a real app, you might add a `deletedForAdmin` and `deletedForClient` flag.
    // For this mock, we'll just remove it from the array, which affects both users.
    const initialLength = mockChatConversations.length;
    mockChatConversations = mockChatConversations.filter(c => c.id !== chatId);
    mockChatMessages = mockChatMessages.filter(m => m.chatId !== chatId);
    return mockChatConversations.length < initialLength;
};

// --- Subscriptions ---
export const mockGetBarbershopSubscription = async (barbershopId: string): Promise<BarbershopSubscription | null> => {
    await ensureDbInitialized();
    const { rows } = await pool.sql`SELECT * FROM subscriptions WHERE "barbershopId" = ${barbershopId}`;
    return rows.length > 0 ? mapToBarbershopSubscription(rows[0]) : null;
};

export const mockUpdateSubscription = async (barbershopId: string, planId: SubscriptionPlanTier): Promise<boolean> => {
    await ensureDbInitialized();
    const nextBilling = planId === SubscriptionPlanTier.PRO ? `NOW() + INTERVAL '1 month'` : 'NULL';
    const { rowCount } = await pool.sql`
        UPDATE subscriptions 
        SET 
            "planId" = ${planId}, 
            status = 'active', 
            "currentPeriodStart" = NOW(), 
            "nextBillingDate" = ${nextBilling}
        WHERE "barbershopId" = ${barbershopId};
    `;
    return rowCount > 0;
};

export const mockGetPublicBarbershops = async (): Promise<BarbershopSearchResultItem[]> => {
    await ensureDbInitialized();

    const { rows } = await pool.sql`
        SELECT
            p.id,
            p.name,
            p.address,
            p."logoUrl",
            COALESCE(sub."planId", 'free') as "subscriptionTier",
            (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r."barbershopId" = p.id) as "averageRating",
            (SELECT COUNT(r.id) FROM reviews r WHERE r."barbershopId" = p.id) as "reviewCount",
            (
                SELECT json_agg(s.*)
                FROM (
                    SELECT s.id, s.name, s.price FROM services s
                    WHERE s."barbershopId" = p.id AND s."isActive" = true
                    ORDER BY s.price ASC
                    LIMIT 3
                ) s
            ) as "sampleServices"
        FROM barbershop_profiles p
        LEFT JOIN subscriptions sub ON p.id = sub."barbershopId";
    `;

    return rows.map(row => ({
        id: row.id,
        name: row.name,
        address: row.address,
        logoUrl: row.logoUrl,
        subscriptionTier: row.subscriptiontier,
        averageRating: parseFloat(row.averagerating),
        reviewCount: parseInt(row.reviewcount, 10),
        sampleServices: row.sampleservices || []
    }));
};
