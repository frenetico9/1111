
import { sql } from '@vercel/postgres';
import { User, UserType, Service, Barber, Appointment, Review, BarbershopProfile, BarbershopSubscription, SubscriptionPlanTier, BarbershopSearchResultItem } from '../types';
import { SUBSCRIPTION_PLANS, DEFAULT_BARBERSHOP_WORKING_HOURS, TIME_SLOTS_INTERVAL } from '../constants';

import { 
    addMinutes,
    format,
    getDay,
    isSameDay,
    isBefore,
    isEqual
} from 'date-fns';
import parse from 'date-fns/parse';
import set from 'date-fns/set';
import startOfDay from 'date-fns/startOfDay';
import parseISO from 'date-fns/parseISO';

let isDbInitialized = false;

// This function sets up the database schema and seeds it with initial data.
// It's designed to run only once per instance.
async function initializeDatabase() {
    if (isDbInitialized) return;
    console.log('Checking database status...');
  
    try {
      // Check if the users table exists. If not, we assume a fresh DB.
      await sql`SELECT 1 FROM users LIMIT 1`;
      console.log('Database already initialized.');
      isDbInitialized = true;
      return;
    } catch (error: any) {
      if (error.message.includes('relation "users" does not exist')) {
        console.log('Database not initialized. Starting setup...');
      } else {
        console.error('Database check failed:', error);
        throw error; // Propagate other errors
      }
    }
  
    console.log('Initializing database schema and seeding data...');
  
    // Using a transaction to ensure all or nothing. Vercel Postgres SDK doesn't have a direct transaction block,
    // so we'll run commands sequentially. For complex setups, a full-featured ORM or driver would be better.
    try {
      console.log('Creating tables...');
      // Create Tables
      await sql`
        CREATE TABLE users (
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
  
      await sql`
        CREATE TABLE barbershop_profiles (
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
  
      await sql`
        CREATE TABLE services (
          id TEXT PRIMARY KEY,
          "barbershopId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          price NUMERIC(10, 2) NOT NULL,
          duration INTEGER NOT NULL,
          "isActive" BOOLEAN NOT NULL,
          description TEXT
        );
      `;
      
      await sql`
        CREATE TABLE barbers (
          id TEXT PRIMARY KEY,
          "barbershopId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          "availableHours" JSONB,
          "assignedServices" TEXT[]
        );
      `;
      
      await sql`
        CREATE TABLE appointments (
          id TEXT PRIMARY KEY,
          "clientId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          "barbershopId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          "serviceId" TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
          "barberId" TEXT REFERENCES barbers(id) ON DELETE SET NULL,
          date DATE NOT NULL,
          time TEXT NOT NULL,
          status TEXT NOT NULL,
          notes TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL
        );
      `;
  
      await sql`
        CREATE TABLE reviews (
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
  
      await sql`
        CREATE TABLE barbershop_subscriptions (
          "barbershopId" TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          "planId" TEXT NOT NULL,
          status TEXT NOT NULL,
          "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
          "endDate" TIMESTAMP WITH TIME ZONE,
          "nextBillingDate" TIMESTAMP WITH TIME ZONE
        );
      `;
      console.log('Tables created.');
  
      // Seed Data
      console.log('Seeding data...');
      await sql`
        INSERT INTO users (id, email, type, name, phone, "barbershopName", address, password_hash) VALUES
        ('client1', 'cliente@exemplo.com', 'client', 'João Cliente', '(11) 98765-4321', null, null, 'password123'),
        ('admin1', 'admin@barbearia.com', 'admin', 'Carlos Dono', '(21) 91234-5678', 'Barbearia do Carlos', 'Rua das Tesouras, 123, Rio de Janeiro', 'password123'),
        ('admin2', 'vip@navalha.com', 'admin', 'Ana Estilista', '(31) 99999-8888', 'Navalha VIP Club', 'Avenida Principal, 789, Belo Horizonte', 'password123');
      `;
      
      await sql`
        INSERT INTO barbershop_profiles (id, name, "responsibleName", email, phone, address, description, "logoUrl", "coverImageUrl", "workingHours") VALUES
        ('admin1', 'Barbearia do Carlos', 'Carlos Dono', 'admin@barbearia.com', '(21) 91234-5678', 'Rua das Tesouras, 123, Rio de Janeiro', 'Cortes clássicos e modernos com a melhor navalha da cidade.', 'https://i.imgur.com/OViX73g.png', 'https://i.imgur.com/LSorq3R.png', ${JSON.stringify(DEFAULT_BARBERSHOP_WORKING_HOURS)}),
        ('admin2', 'Navalha VIP Club', 'Ana Estilista', 'vip@navalha.com', '(31) 99999-8888', 'Avenida Principal, 789, Belo Horizonte', 'Experiência premium para o homem que se cuida.', 'https://i.imgur.com/OViX73g.png', 'https://i.imgur.com/ANaRyNn.png', ${JSON.stringify(DEFAULT_BARBERSHOP_WORKING_HOURS.map(wh => ({...wh, start: '10:00', end: '20:00'})))});
      `;
  
      await sql`
        INSERT INTO services (id, "barbershopId", name, price, duration, "isActive", description) VALUES
        ('service1', 'admin1', 'Corte Masculino', 50, 45, true, 'Corte clássico ou moderno, tesoura e máquina.'),
        ('service2', 'admin1', 'Barba Tradicional', 35, 30, true, 'Toalha quente, navalha e produtos premium.'),
        ('service3', 'admin1', 'Combo Corte + Barba', 75, 75, true, 'O pacote completo para um visual impecável.'),
        ('service4', 'admin1', 'Hidratação Capilar', 40, 30, false, 'Tratamento para fortalecer e dar brilho.'),
        ('service5', 'admin2', 'Corte VIP', 120, 60, true, 'Atendimento exclusivo com consultoria de imagem.'),
        ('service6', 'admin2', 'Barboterapia Premium', 90, 45, true, 'Ritual completo de cuidados para a barba.');
      `;
  
      await sql`
        INSERT INTO barbers (id, "barbershopId", name, "availableHours", "assignedServices") VALUES
        ('barber1_admin1', 'admin1', 'Zé da Navalha', ${JSON.stringify([{dayOfWeek:1, start:'09:00', end:'18:00'}, {dayOfWeek:2, start:'09:00', end:'18:00'}])}, '{service1,service3}'),
        ('barber2_admin1', 'admin1', 'Roberto Tesoura', ${JSON.stringify([{dayOfWeek:3, start:'10:00', end:'19:00'}, {dayOfWeek:4, start:'10:00', end:'19:00'}])}, '{service1,service2}'),
        ('barber1_admin2', 'admin2', 'Mestre Arthur', ${JSON.stringify([{dayOfWeek:1, start:'10:00', end:'20:00'}])}, '{service5,service6}');
      `;
      
      await sql`
        INSERT INTO appointments (id, "clientId", "barbershopId", "serviceId", "barberId", date, time, status, "createdAt") VALUES
        ('appt1', 'client1', 'admin1', 'service1', 'barber1_admin1', CURRENT_DATE, '10:00', 'scheduled', NOW()),
        ('appt2', 'client1', 'admin1', 'service2', null, CURRENT_DATE - 2, '14:30', 'completed', NOW() - INTERVAL '2 days'),
        ('appt3', 'client1', 'admin2', 'service5', null, CURRENT_DATE + 5, '11:00', 'scheduled', NOW());
      `;
      
      await sql`
        INSERT INTO reviews (id, "appointmentId", "clientId", "barbershopId", rating, comment, "createdAt") VALUES
        ('review1', 'appt2', 'client1', 'admin1', 5, 'Barba impecável, atendimento nota 10!', NOW() - INTERVAL '1 day');
      `;
      
      await sql`
        INSERT INTO barbershop_subscriptions ( "barbershopId", "planId", status, "startDate", "nextBillingDate") VALUES
        ('admin1', 'free', 'active', NOW(), null),
        ('admin2', 'pro', 'active', NOW(), NOW() + INTERVAL '1 month');
      `;
  
      console.log('Database initialization complete.');
      isDbInitialized = true;
    } catch (e) {
      console.error('Database initialization failed.', e);
      // Attempt to clean up if something went wrong
      // await sql`DROP TABLE IF EXISTS barbershop_subscriptions, reviews, appointments, barbers, services, barbershop_profiles, users;`;
      throw e;
    }
  }

// Helper to ensure DB is ready before any operation
async function ensureDbInitialized() {
  if (!isDbInitialized) {
    await initializeDatabase();
  }
}

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
    date: format(new Date(row.date), 'yyyy-MM-dd'),
    time: row.time,
    status: row.status,
    notes: row.notes,
    createdAt: new Date(row.createdAt).toISOString()
});

const mapToReview = (row: any): Review => ({
    id: row.id,
    appointmentId: row.appointmentId,
    clientId: row.clientId,
    clientName: row.clientName,
    barbershopId: row.barbershopId,
    rating: row.rating,
    comment: row.comment,
    createdAt: new Date(row.createdAt).toISOString(),
    reply: row.reply,
    replyAt: row.replyAt ? new Date(row.replyAt).toISOString() : undefined
});

const mapToSubscription = (row: any): BarbershopSubscription => ({
    barbershopId: row.barbershopId,
    planId: row.planId,
    status: row.status,
    startDate: new Date(row.startDate).toISOString(),
    endDate: row.endDate ? new Date(row.endDate).toISOString() : undefined,
    nextBillingDate: row.nextBillingDate ? new Date(row.nextBillingDate).toISOString() : undefined
});


// --- Auth ---
export const mockLogin = async (email: string, pass: string): Promise<User | null> => {
  await ensureDbInitialized();
  const { rows } = await sql`SELECT * FROM users WHERE email = ${email} AND password_hash = ${pass}`;
  if (rows.length === 0) return null;
  return mapToUser(rows[0]);
};

const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const mockSignupClient = async (name: string, email: string, phone: string, pass: string): Promise<User | null> => {
    await ensureDbInitialized();
    const { rows: existing } = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) throw new Error('E-mail já cadastrado.');
    
    const newUser: User = { id: generateId('client'), name, email, phone, type: UserType.CLIENT };
    await sql`
        INSERT INTO users (id, name, email, phone, type, password_hash)
        VALUES (${newUser.id}, ${name}, ${email}, ${phone}, 'client', ${pass})
    `;
    return newUser;
};

export const mockSignupBarbershop = async (barbershopName: string, responsibleName: string, email: string, phone: string, address: string, pass: string): Promise<User | null> => {
    await ensureDbInitialized();
    const { rows: existing } = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) throw new Error('E-mail já cadastrado.');
    
    const newAdminId = generateId('admin');
    const newUser: User = { 
        id: newAdminId, 
        name: responsibleName, 
        email, 
        phone, 
        type: UserType.ADMIN, 
        barbershopName,
        address
    };

    // Use transaction for multi-table inserts
    try {
        await sql.query('BEGIN');
        await sql`
             INSERT INTO users (id, name, email, phone, type, "barbershopName", address, password_hash)
             VALUES (${newAdminId}, ${responsibleName}, ${email}, ${phone}, 'admin', ${barbershopName}, ${address}, ${pass})`;
        await sql`
             INSERT INTO barbershop_profiles (id, name, "responsibleName", email, phone, address, "workingHours", "logoUrl", "coverImageUrl")
             VALUES (${newAdminId}, ${barbershopName}, ${responsibleName}, ${email}, ${phone}, ${address}, ${JSON.stringify(DEFAULT_BARBERSHOP_WORKING_HOURS)}, ${`https://i.imgur.com/OViX73g.png`}, ${`https://i.imgur.com/gK7P6bQ.png`})`;
        await sql`
             INSERT INTO barbershop_subscriptions ("barbershopId", "planId", status, "startDate")
             VALUES (${newAdminId}, 'free', 'active', NOW())`;
        await sql.query('COMMIT');
    } catch(e) {
        await sql.query('ROLLBACK');
        console.error("Signup transaction failed", e);
        throw new Error("Falha ao criar barbearia. Tente novamente.");
    }
    
    return newUser;
};

export const mockLogout = async (): Promise<void> => {
  return;
};


// --- Client Profile ---
export const mockUpdateClientProfile = async (clientId: string, data: Partial<User>): Promise<boolean> => {
    await ensureDbInitialized();
    const { rowCount } = await sql`
        UPDATE users SET name = ${data.name}, phone = ${data.phone}, email = ${data.email}
        WHERE id = ${clientId} AND type = 'client'
    `;
    return rowCount > 0;
};


// --- Barbershop Profile & Subscription ---
export const mockGetPublicBarbershops = async (): Promise<BarbershopSearchResultItem[]> => {
    await ensureDbInitialized();
    const { rows } = await sql`
      SELECT
        p.*,
        COALESCE(r.avg_rating, 0) AS "averageRating",
        COALESCE(r.review_count, 0) AS "reviewCount",
        s."planId" AS "subscriptionTier"
      FROM barbershop_profiles p
      LEFT JOIN (
        SELECT
          "barbershopId",
          AVG(rating) as avg_rating,
          COUNT(id) as review_count
        FROM reviews
        GROUP BY "barbershopId"
      ) r ON p.id = r."barbershopId"
      LEFT JOIN barbershop_subscriptions s ON p.id = s."barbershopId"
    `;

    const results: BarbershopSearchResultItem[] = [];
    for(const row of rows) {
        const { rows: servicesRows } = await sql`
            SELECT id, name, price FROM services 
            WHERE "barbershopId" = ${row.id} AND "isActive" = true 
            LIMIT 3
        `;
        results.push({
            ...mapToBarbershopProfile(row),
            averageRating: Number(row.averageRating),
            reviewCount: Number(row.reviewCount),
            sampleServices: servicesRows.map(s => ({id: s.id, name: s.name, price: Number(s.price)})),
            subscriptionTier: row.subscriptionTier
        });
    }

    results.sort((a, b) => {
        if (a.subscriptionTier === 'pro' && b.subscriptionTier !== 'pro') return -1;
        if (a.subscriptionTier !== 'pro' && b.subscriptionTier === 'pro') return 1;
        return b.averageRating - a.averageRating;
    });

    return results;
};

export const mockGetBarbershopProfile = async (barbershopId: string): Promise<BarbershopProfile | null> => {
  await ensureDbInitialized();
  const { rows } = await sql`SELECT * FROM barbershop_profiles WHERE id = ${barbershopId}`;
  return rows.length > 0 ? mapToBarbershopProfile(rows[0]) : null;
};

export const mockUpdateBarbershopProfile = async (barbershopId: string, data: Partial<BarbershopProfile>): Promise<boolean> => {
    await ensureDbInitialized();
    
    try {
        await sql.query('BEGIN');
        await sql`
            UPDATE barbershop_profiles SET
                name = ${data.name},
                "responsibleName" = ${data.responsibleName},
                phone = ${data.phone},
                address = ${data.address},
                description = ${data.description},
                "logoUrl" = ${data.logoUrl},
                "coverImageUrl" = ${data.coverImageUrl},
                "workingHours" = ${JSON.stringify(data.workingHours)}
            WHERE id = ${barbershopId};
        `;
        await sql`
            UPDATE users SET
                "barbershopName" = ${data.name},
                name = ${data.responsibleName},
                phone = ${data.phone},
                address = ${data.address}
            WHERE id = ${barbershopId};
        `;
        await sql.query('COMMIT');
        return true;
    } catch(e) {
        await sql.query('ROLLBACK');
        console.error("Update barbershop profile transaction failed", e);
        throw e;
    }
};

export const mockGetBarbershopSubscription = async (barbershopId: string): Promise<BarbershopSubscription | null> => {
    await ensureDbInitialized();
    const { rows } = await sql`SELECT * FROM barbershop_subscriptions WHERE "barbershopId" = ${barbershopId}`;
    return rows.length > 0 ? mapToSubscription(rows[0]) : null;
};

export const mockUpdateBarbershopSubscription = async (barbershopId: string, planId: SubscriptionPlanTier): Promise<boolean> => {
    await ensureDbInitialized();
    const planDetails = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!planDetails) return false;

    const nextBillingDate = planDetails.price > 0 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;

    const { rowCount } = await sql`
        INSERT INTO barbershop_subscriptions ("barbershopId", "planId", status, "startDate", "nextBillingDate")
        VALUES (${barbershopId}, ${planId}, 'active', NOW(), ${nextBillingDate ? nextBillingDate.toISOString() : null})
        ON CONFLICT ("barbershopId") DO UPDATE SET
            "planId" = EXCLUDED."planId",
            status = EXCLUDED.status,
            "startDate" = CASE WHEN barbershop_subscriptions."planId" != EXCLUDED."planId" THEN EXCLUDED."startDate" ELSE barbershop_subscriptions."startDate" END,
            "nextBillingDate" = EXCLUDED."nextBillingDate";
    `;
    return rowCount > 0;
};

// --- Services ---
export const mockGetServicesForBarbershop = async (barbershopId: string): Promise<Service[]> => {
  await ensureDbInitialized();
  const { rows } = await sql`SELECT * FROM services WHERE "barbershopId" = ${barbershopId}`;
  return rows.map(mapToService);
};
export const mockGetServiceById = async (serviceId: string): Promise<Service | null> => {
  await ensureDbInitialized();
  const { rows } = await sql`SELECT * FROM services WHERE id = ${serviceId}`;
  return rows.length > 0 ? mapToService(rows[0]) : null;
}
export const mockAddService = async (serviceData: Omit<Service, 'id'>): Promise<Service> => {
  await ensureDbInitialized();
  const newService = { ...serviceData, id: generateId('service') };
  await sql`
    INSERT INTO services (id, "barbershopId", name, price, duration, "isActive", description)
    VALUES (${newService.id}, ${newService.barbershopId}, ${newService.name}, ${newService.price}, ${newService.duration}, ${newService.isActive}, ${newService.description})
  `;
  return newService;
};
export const mockUpdateService = async (serviceId: string, data: Partial<Service>): Promise<Service | null> => {
  await ensureDbInitialized();
  const { rowCount } = await sql`
    UPDATE services SET
        name = ${data.name},
        price = ${data.price},
        duration = ${data.duration},
        "isActive" = ${data.isActive},
        description = ${data.description}
    WHERE id = ${serviceId}
  `;
  if (rowCount === 0) return null;
  return mockGetServiceById(serviceId);
};
export const mockToggleServiceActive = async (serviceId: string, isActive: boolean): Promise<boolean> => {
  await ensureDbInitialized();
  const { rowCount } = await sql`UPDATE services SET "isActive" = ${isActive} WHERE id = ${serviceId}`;
  return rowCount > 0;
};

// --- Barbers ---
export const mockGetBarbersForBarbershop = async (barbershopId: string): Promise<Barber[]> => {
  await ensureDbInitialized();
  const { rows } = await sql`SELECT * FROM barbers WHERE "barbershopId" = ${barbershopId}`;
  return rows.map(mapToBarber);
};
export const mockGetBarbersForService = async (barbershopId: string, serviceId: string): Promise<Barber[]> => {
  await ensureDbInitialized();
  const { rows } = await sql`
    SELECT * FROM barbers 
    WHERE "barbershopId" = ${barbershopId} AND ${serviceId} = ANY("assignedServices")
  `;
  return rows.map(mapToBarber);
};
export const mockAddBarber = async (barberData: Omit<Barber, 'id'>): Promise<Barber> => {
    await ensureDbInitialized();
    const newBarber = { ...barberData, id: generateId('barber')};
    const assignedServicesArray = `{${barberData.assignedServices.join(',')}}`;
    await sql`
        INSERT INTO barbers (id, "barbershopId", name, "availableHours", "assignedServices")
        VALUES (${newBarber.id}, ${newBarber.barbershopId}, ${newBarber.name}, ${JSON.stringify(newBarber.availableHours)}, ${assignedServicesArray})
    `;
    return newBarber;
};
export const mockUpdateBarber = async (barberId: string, data: Partial<Barber>): Promise<Barber | null> => {
    await ensureDbInitialized();
    const assignedServicesArray = data.assignedServices ? `{${data.assignedServices.join(',')}}` : null;
    const { rowCount } = await sql`
        UPDATE barbers SET
            name = ${data.name},
            "availableHours" = ${JSON.stringify(data.availableHours)},
            "assignedServices" = ${assignedServicesArray}
        WHERE id = ${barberId}
    `;
    if (rowCount === 0) return null;
    const { rows } = await sql`SELECT * from barbers where id = ${barberId}`;
    return rows.length > 0 ? mapToBarber(rows[0]) : null;
};
export const mockDeleteBarber = async (barberId: string): Promise<boolean> => {
    await ensureDbInitialized();
    const { rowCount } = await sql`DELETE FROM barbers WHERE id = ${barberId}`;
    return rowCount > 0;
};


// --- Appointments ---
const appointmentBaseQuery = `
    SELECT 
        a.id, a."clientId", a."barbershopId", a."serviceId", a."barberId",
        a.date, a.time, a.status, a.notes, a."createdAt", 
        c.name AS "clientName",
        s.name AS "serviceName",
        b.name AS "barberName",
        bs.name AS "barbershopName"
    FROM appointments a
    JOIN users c ON a."clientId" = c.id
    JOIN services s ON a."serviceId" = s.id
    LEFT JOIN barbers b ON a."barberId" = b.id
    LEFT JOIN barbershop_profiles bs ON a."barbershopId" = bs.id
`;

export const mockGetClientAppointments = async (clientId: string): Promise<Appointment[]> => {
  await ensureDbInitialized();
  const { rows } = await sql.query(`${appointmentBaseQuery} WHERE a."clientId" = $1`, [clientId]);
  return rows.map(mapToAppointment);
};
export const mockGetAdminAppointments = async (barbershopId: string): Promise<Appointment[]> => {
  await ensureDbInitialized();
  const { rows } = await sql.query(`${appointmentBaseQuery} WHERE a."barbershopId" = $1`, [barbershopId]);
  return rows.map(mapToAppointment);
};
export const mockCreateAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'clientName' | 'barbershopName' | 'serviceName' | 'barberName'>): Promise<Appointment> => {
  await ensureDbInitialized();
  const newAppointment = { 
    ...appointmentData, 
    id: generateId('appt'), 
    createdAt: new Date().toISOString()
  };
  await sql`
    INSERT INTO appointments (id, "clientId", "barbershopId", "serviceId", "barberId", date, time, status, notes, "createdAt")
    VALUES (
        ${newAppointment.id}, 
        ${newAppointment.clientId}, 
        ${newAppointment.barbershopId}, 
        ${newAppointment.serviceId}, 
        ${newAppointment.barberId || null}, 
        ${newAppointment.date}, 
        ${newAppointment.time}, 
        ${newAppointment.status}, 
        ${newAppointment.notes}, 
        ${newAppointment.createdAt}
    )
  `;
  const { rows } = await sql.query(`${appointmentBaseQuery} WHERE a.id = $1`, [newAppointment.id]);
  return mapToAppointment(rows[0]);
};

export const mockUpdateAppointment = async (appointmentId: string, data: Partial<Appointment>): Promise<Appointment | null> => {
  await ensureDbInitialized();
  const { rowCount } = await sql`
    UPDATE appointments SET
        "clientId" = ${data.clientId},
        "serviceId" = ${data.serviceId},
        "barberId" = ${data.barberId || null},
        date = ${data.date},
        time = ${data.time},
        notes = ${data.notes}
    WHERE id = ${appointmentId}
  `;
  if (rowCount === 0) return null;
  const { rows } = await sql.query(`${appointmentBaseQuery} WHERE a.id = $1`, [appointmentId]);
  return rows.length > 0 ? mapToAppointment(rows[0]) : null;
};

export const mockCancelAppointment = async (appointmentId: string, userId: string, cancelledBy: 'client' | 'admin'): Promise<boolean> => {
  await ensureDbInitialized();
  const newStatus = cancelledBy === 'client' ? 'cancelled_by_client' : 'cancelled_by_admin';
  const { rowCount } = await sql`
    UPDATE appointments SET status = ${newStatus} WHERE id = ${appointmentId}
  `;
  return rowCount > 0;
};
export const mockCompleteAppointment = async (appointmentId: string): Promise<boolean> => {
    await ensureDbInitialized();
    const { rowCount } = await sql`UPDATE appointments SET status = 'completed' WHERE id = ${appointmentId}`;
    return rowCount > 0;
};


// --- Reviews ---
const reviewBaseQuery = `
    SELECT r.*, u.name as "clientName"
    FROM reviews r
    JOIN users u ON r."clientId" = u.id
`;

export const mockGetReviewsForBarbershop = async (barbershopId: string): Promise<Review[]> => {
  await ensureDbInitialized();
  const { rows } = await sql.query(`${reviewBaseQuery} WHERE r."barbershopId" = $1`, [barbershopId]);
  return rows.map(mapToReview);
};
export const mockGetReviewForAppointment = async (appointmentId: string): Promise<Review | null> => {
  await ensureDbInitialized();
  const { rows } = await sql.query(`${reviewBaseQuery} WHERE r."appointmentId" = $1`, [appointmentId]);
  return rows.length > 0 ? mapToReview(rows[0]) : null;
}
export const mockAddReview = async (reviewData: Omit<Review, 'id' | 'createdAt' | 'reply' | 'replyAt'>): Promise<Review> => {
  await ensureDbInitialized();
  const { rows: existing } = await sql`SELECT id FROM reviews WHERE "appointmentId" = ${reviewData.appointmentId}`;
  if (existing.length > 0) throw new Error("Avaliação para este agendamento já existe.");

  const newReview = { ...reviewData, id: generateId('review'), createdAt: new Date().toISOString() };
  await sql`
    INSERT INTO reviews (id, "appointmentId", "clientId", "barbershopId", rating, comment, "createdAt")
    VALUES (${newReview.id}, ${newReview.appointmentId}, ${newReview.clientId}, ${newReview.barbershopId}, ${newReview.rating}, ${reviewData.comment}, ${newReview.createdAt})
  `;
  
  const { rows } = await sql.query(`${reviewBaseQuery} WHERE r.id = $1`, [newReview.id]);
  return mapToReview(rows[0]);
};
export const mockReplyToReview = async (reviewId: string, replyText: string, adminId: string): Promise<Review | null> => {
    await ensureDbInitialized();
    const { rowCount } = await sql`
        UPDATE reviews SET reply = ${replyText}, "replyAt" = NOW()
        WHERE id = ${reviewId} AND "barbershopId" = ${adminId}
    `;
    if (rowCount === 0) return null;
    const { rows } = await sql.query(`${reviewBaseQuery} WHERE r.id = $1`, [reviewId]);
    return rows.length > 0 ? mapToReview(rows[0]) : null;
};


// --- Client Data for Admin ---
export const mockGetClientsForBarbershop = async (barbershopId: string): Promise<Partial<User>[]> => {
    await ensureDbInitialized();
    const { rows } = await sql`
        SELECT DISTINCT c.id, c.name, c.email, c.phone 
        FROM users c
        JOIN appointments a ON c.id = a."clientId"
        WHERE a."barbershopId" = ${barbershopId} AND c.type = 'client'
    `;
    return rows.map(row => ({ id: row.id, name: row.name, email: row.email, phone: row.phone }));
};

export const mockGetAppointmentsForClientByBarbershop = async (clientId: string, barbershopId: string): Promise<Appointment[]> => {
    await ensureDbInitialized();
    const { rows } = await sql.query(`${appointmentBaseQuery} WHERE a."clientId" = $1 AND a."barbershopId" = $2`, [clientId, barbershopId]);
    return rows.map(mapToAppointment);
};

// --- Time Slot Generation ---
export const mockGetAvailableTimeSlots = async (
  barbershopId: string,
  serviceDuration: number,
  dateString: string,
  barberId?: string | null
): Promise<string[]> => {
  await ensureDbInitialized();

  const selectedDate = parseISO(dateString + 'T00:00:00Z'); // Use Z for UTC to avoid timezone issues with date part
  const dayOfWeek = getDay(selectedDate); // 0 for Sunday, 1 for Monday...

  const barbershopProfile = await mockGetBarbershopProfile(barbershopId);
  if (!barbershopProfile) return [];
  
  const allBarbersInShop = await mockGetBarbersForBarbershop(barbershopId);
  
  let relevantBarbers: Barber[] = [];
  if (barberId) {
    const specificBarber = allBarbersInShop.find(b => b.id === barberId);
    if (specificBarber) relevantBarbers.push(specificBarber);
  } else {
    relevantBarbers = allBarbersInShop;
  }
  
  const shopWorkingHoursToday = barbershopProfile.workingHours.find(wh => wh.dayOfWeek === dayOfWeek);

  const { rows: appointmentsOnDate } = await sql`
      SELECT a.time, a."barberId", s.duration
      FROM appointments a
      JOIN services s ON a."serviceId" = s.id
      WHERE a."barbershopId" = ${barbershopId} AND a.date = ${dateString} AND a.status = 'scheduled'
  `;

  let potentialSlots: string[] = [];
  const addSlotsFromSchedule = (schedule: {start: string, end: string} | undefined) => {
    if (!schedule) return;
    const [startHour, startMinute] = schedule.start.split(':').map(Number);
    const [endHour, endMinute] = schedule.end.split(':').map(Number);
    let slotStart = set(selectedDate, { hours: startHour, minutes: startMinute, seconds: 0, milliseconds: 0 });
    const dayEnd = set(selectedDate, { hours: endHour, minutes: endMinute, seconds: 0, milliseconds: 0 });

    while (isBefore(slotStart, dayEnd)) {
      const slotEnd = addMinutes(slotStart, serviceDuration);
      if (isBefore(slotEnd, dayEnd) || isEqual(slotEnd, dayEnd)) {
        potentialSlots.push(format(slotStart, 'HH:mm'));
      }
      slotStart = addMinutes(slotStart, TIME_SLOTS_INTERVAL);
    }
  };
  
  const barberSchedules = relevantBarbers.map(b => b.availableHours.find(h => h.dayOfWeek === dayOfWeek)).filter(Boolean);
  
  if (barberSchedules.length > 0) {
    barberSchedules.forEach(schedule => addSlotsFromSchedule(schedule as {start: string, end: string}));
  } else if (shopWorkingHoursToday?.isOpen) {
    addSlotsFromSchedule(shopWorkingHoursToday);
  }
  
  potentialSlots = [...new Set(potentialSlots)].sort(); // Unique and sorted slots

  const availableSlots = potentialSlots.filter(slot => {
    const slotStart = parse(slot, 'HH:mm', selectedDate);
    const slotEnd = addMinutes(slotStart, serviceDuration);

    // Filter appointments for the barber if one is selected
    const relevantAppointments = barberId 
        ? appointmentsOnDate.filter(app => app.barberId === barberId)
        : appointmentsOnDate;

    // Check for conflicts
    const isConflict = relevantAppointments.some(app => {
      const appStart = parse(app.time, 'HH:mm', selectedDate);
      const appEnd = addMinutes(appStart, app.duration);
      return isBefore(slotStart, appEnd) && isBefore(appStart, slotEnd);
    });

    if(isConflict) return false;

    // If no specific barber is chosen, we need to ensure at least one barber is free.
    if (!barberId) {
        // Count how many barbers are booked at this specific time slot
        const barbersBookedCount = appointmentsOnDate.filter(app => {
            const appStart = parse(app.time, 'HH:mm', selectedDate);
            const appEnd = addMinutes(appStart, app.duration);
            return isBefore(slotStart, appEnd) && isBefore(appStart, slotEnd);
        }).length;
        // The slot is available if the number of available barbers is greater than the number of booked barbers
        return allBarbersInShop.length > barbersBookedCount;
    }

    return true; // No conflict for the specific barber
  });
  
  const now = new Date();
  return availableSlots
    .filter(slot => {
      if (isSameDay(selectedDate, startOfDay(now))) {
        const slotTime = parse(slot, 'HH:mm', new Date());
        return isBefore(now, slotTime);
      }
      return true;
    });
};
