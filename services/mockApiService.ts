import { createPool } from '@vercel/postgres';
import { User, UserType, Service, Barber, Appointment, Review, BarbershopProfile, BarbershopSubscription, SubscriptionPlanTier, BarbershopSearchResultItem } from '../types';
import { SUBSCRIPTION_PLANS, DEFAULT_BARBERSHOP_WORKING_HOURS, TIME_SLOTS_INTERVAL } from '../constants';
import {
    addMinutes,
    format,
    getDay,
    isSameDay,
    isBefore,
    isEqual,
    parse,
    set,
    startOfDay,
    parseISO,
} from 'date-fns';

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
    console.log('Checking database status...');
  
    try {
      await pool.sql`SELECT 1 FROM users LIMIT 1`;
      console.log('Database already initialized.');
      isDbInitialized = true;
      return;
    } catch (error: any) {
      if (error.message.includes('relation "users" does not exist')) {
        console.log('Database not initialized. Starting setup...');
      } else {
        console.error('Database check failed:', error);
        throw error;
      }
    }
  
    console.log('Initializing database schema and seeding data...');
  
    try {
      console.log('Creating tables...');
      await pool.sql`
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
  
      await pool.sql`
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
  
      await pool.sql`
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
      
      await pool.sql`
        CREATE TABLE barbers (
          id TEXT PRIMARY KEY,
          "barbershopId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          "availableHours" JSONB,
          "assignedServices" TEXT[]
        );
      `;
      
      await pool.sql`
        CREATE TABLE appointments (
          id TEXT PRIMARY KEY,
          "clientId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          "barbershopId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          "serviceIds" TEXT[] NOT NULL,
          "serviceNames" TEXT[] NOT NULL,
          "totalPrice" NUMERIC(10, 2) NOT NULL,
          "totalDuration" INTEGER NOT NULL,
          "barberId" TEXT REFERENCES barbers(id) ON DELETE SET NULL,
          date DATE NOT NULL,
          time TEXT NOT NULL,
          status TEXT NOT NULL,
          notes TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL
        );
      `;
  
      await pool.sql`
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
  
      await pool.sql`
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
  
      console.log('Seeding data...');
      await pool.sql`
        INSERT INTO users (id, email, type, name, phone, "barbershopName", address, password_hash) VALUES
        ('client1', 'cliente@exemplo.com', 'client', 'João Cliente', '(11) 98765-4321', null, null, 'password123'),
        ('admin1', 'admin@barbearia.com', 'admin', 'Carlos Dono', '(21) 91234-5678', 'Barbearia do Carlos', 'Rua das Tesouras, 123, Rio de Janeiro', 'password123'),
        ('admin2', 'vip@navalha.com', 'admin', 'Ana Estilista', '(31) 99999-8888', 'Navalha VIP Club', 'Avenida Principal, 789, Belo Horizonte', 'password123');
      `;
      
      await pool.sql`
        INSERT INTO barbershop_profiles (id, name, "responsibleName", email, phone, address, description, "logoUrl", "coverImageUrl", "workingHours") VALUES
        ('admin1', 'Barbearia do Carlos', 'Carlos Dono', 'admin@barbearia.com', '(21) 91234-5678', 'Rua das Tesouras, 123, Rio de Janeiro', 'Cortes clássicos e modernos com a melhor navalha da cidade.', 'https://i.imgur.com/OViX73g.png', 'https://i.imgur.com/LSorq3R.png', ${JSON.stringify(DEFAULT_BARBERSHOP_WORKING_HOURS)}),
        ('admin2', 'Navalha VIP Club', 'Ana Estilista', 'vip@navalha.com', '(31) 99999-8888', 'Avenida Principal, 789, Belo Horizonte', 'Experiência premium para o homem que se cuida.', 'https://i.imgur.com/OViX73g.png', 'https://i.imgur.com/ANaRyNn.png', ${JSON.stringify(DEFAULT_BARBERSHOP_WORKING_HOURS.map(wh => ({...wh, start: '10:00', end: '20:00'})))});
      `;
  
      await pool.sql`
        INSERT INTO services (id, "barbershopId", name, price, duration, "isActive", description) VALUES
        ('service1', 'admin1', 'Corte Masculino', 50, 45, true, 'Corte clássico ou moderno, tesoura e máquina.'),
        ('service2', 'admin1', 'Barba Tradicional', 35, 30, true, 'Toalha quente, navalha e produtos premium.'),
        ('service3', 'admin1', 'Combo Corte + Barba', 75, 75, true, 'O pacote completo para um visual impecável.'),
        ('service4', 'admin1', 'Hidratação Capilar', 40, 30, false, 'Tratamento para fortalecer e dar brilho.'),
        ('service5', 'admin2', 'Corte VIP', 120, 60, true, 'Atendimento exclusivo com consultoria de imagem.'),
        ('service6', 'admin2', 'Barboterapia Premium', 90, 45, true, 'Ritual completo de cuidados para a barba.');
      `;
  
      await pool.sql`
        INSERT INTO barbers (id, "barbershopId", name, "availableHours", "assignedServices") VALUES
        ('barber1_admin1', 'admin1', 'Zé da Navalha', ${JSON.stringify([{dayOfWeek:1, start:'09:00', end:'18:00'}, {dayOfWeek:2, start:'09:00', end:'18:00'}])}, '{service1,service3}'),
        ('barber2_admin1', 'admin1', 'Roberto Tesoura', ${JSON.stringify([{dayOfWeek:3, start:'10:00', end:'19:00'}, {dayOfWeek:4, start:'10:00', end:'19:00'}])}, '{service1,service2}'),
        ('barber1_admin2', 'admin2', 'Mestre Arthur', ${JSON.stringify([{dayOfWeek:1, start:'10:00', end:'20:00'}])}, '{service5,service6}');
      `;
      
      await pool.sql`
        INSERT INTO appointments (id, "clientId", "barbershopId", "serviceIds", "serviceNames", "totalPrice", "totalDuration", "barberId", date, time, status, "createdAt") VALUES
        ('appt1', 'client1', 'admin1', '{service1}', '{"Corte Masculino"}', 50, 45, 'barber1_admin1', CURRENT_DATE, '10:00', 'scheduled', NOW()),
        ('appt2', 'client1', 'admin1', '{service2}', '{"Barba Tradicional"}', 35, 30, null, CURRENT_DATE - 2, '14:30', 'completed', NOW() - INTERVAL '2 days'),
        ('appt3', 'client1', 'admin2', '{service5}', '{"Corte VIP"}', 120, 60, null, CURRENT_DATE + 5, '11:00', 'scheduled', NOW());
      `;
      
      await pool.sql`
        INSERT INTO reviews (id, "appointmentId", "clientId", "barbershopId", rating, comment, "createdAt") VALUES
        ('review1', 'appt2', 'client1', 'admin1', 5, 'Barba impecável, atendimento nota 10!', NOW() - INTERVAL '1 day');
      `;
      
      await pool.sql`
        INSERT INTO barbershop_subscriptions ( "barbershopId", "planId", status, "startDate", "nextBillingDate") VALUES
        ('admin1', 'free', 'active', NOW(), null),
        ('admin2', 'pro', 'active', NOW(), NOW() + INTERVAL '1 month');
      `;
  
      console.log('Database initialization complete.');
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
    serviceIds: row.serviceIds,
    serviceNames: row.serviceNames,
    totalPrice: Number(row.totalPrice),
    totalDuration: row.totalDuration,
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
  const { rows } = await pool.sql`SELECT * FROM users WHERE email = ${email} AND password_hash = ${pass}`;
  if (rows.length === 0) return null;
  return mapToUser(rows[0]);
};

const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const mockSignupClient = async (name: string, email: string, phone: string, pass: string): Promise<User | null> => {
    await ensureDbInitialized();
    const { rows: existing } = await pool.sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) throw new Error('E-mail já cadastrado.');
    
    const newUser: User = { id: generateId('client'), name, email, phone, type: UserType.CLIENT };
    await pool.sql`
        INSERT INTO users (id, name, email, phone, type, password_hash)
        VALUES (${newUser.id}, ${name}, ${email}, ${phone}, 'client', ${pass})
    `;
    return newUser;
};

export const mockSignupBarbershop = async (barbershopName: string, responsibleName: string, email: string, phone: string, address: string, pass: string): Promise<User | null> => {
    await ensureDbInitialized();
    const { rows: existing } = await pool.sql`SELECT id FROM users WHERE email = ${email}`;
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

    try {
        // Perform the inserts sequentially. If one fails, the next ones won't execute.
        await pool.sql`
             INSERT INTO users (id, name, email, phone, type, "barbershopName", address, password_hash)
             VALUES (${newAdminId}, ${responsibleName}, ${email}, ${phone}, 'admin', ${barbershopName}, ${address}, ${pass})`;

        await pool.sql`
             INSERT INTO barbershop_profiles (id, name, "responsibleName", email, phone, address, "workingHours", "logoUrl", "coverImageUrl")
             VALUES (${newAdminId}, ${barbershopName}, ${responsibleName}, ${email}, ${phone}, ${address}, ${JSON.stringify(DEFAULT_BARBERSHOP_WORKING_HOURS)}, ${`https://i.imgur.com/OViX73g.png`}, ${`https://i.imgur.com/gK7P6bQ.png`})`;
        
        await pool.sql`
             INSERT INTO barbershop_subscriptions ("barbershopId", "planId", status, "startDate")
             VALUES (${newAdminId}, 'free', 'active', NOW())`;
        
    } catch(e) {
        console.error("Signup transaction-less operation failed", e);
        // Attempt to clean up the user if it was created.
        await pool.sql`DELETE FROM users WHERE id = ${newAdminId}`; // This might also fail, but it's a best effort.
        throw new Error("Falha ao criar barbearia. A operação foi revertida.");
    }
    
    return newUser;
};

export const mockLogout = async (): Promise<void> => {
  return;
};


// --- Client Profile ---
export const mockUpdateClientProfile = async (clientId: string, data: Partial<User>): Promise<boolean> => {
    await ensureDbInitialized();
    const { rowCount } = await pool.sql`
        UPDATE users SET name = ${data.name}, phone = ${data.phone}, email = ${data.email}
        WHERE id = ${clientId} AND type = 'client'
    `;
    return rowCount > 0;
};


// --- Barbershop Profile & Subscription ---
export const mockGetPublicBarbershops = async (): Promise<BarbershopSearchResultItem[]> => {
    await ensureDbInitialized();
    const { rows } = await pool.sql`
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
        const { rows: servicesRows } = await pool.sql`
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
  const { rows } = await pool.sql`SELECT * FROM barbershop_profiles WHERE id = ${barbershopId}`;
  return rows.length > 0 ? mapToBarbershopProfile(rows[0]) : null;
};

export const mockUpdateBarbershopProfile = async (barbershopId: string, data: Partial<BarbershopProfile>): Promise<boolean> => {
    await ensureDbInitialized();
    
    try {
        // Non-transactional update. Less safe but avoids pool.connect().
        await pool.sql`
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
        
        await pool.sql`
            UPDATE users SET
                "barbershopName" = ${data.name},
                name = ${data.responsibleName},
                phone = ${data.phone},
                address = ${data.address}
            WHERE id = ${barbershopId};
        `;
        
        return true; // Both queries succeeded

    } catch(e) {
        console.error("Update barbershop profile failed", e);
        // Data might be inconsistent if the first query succeeded and the second failed.
        throw new Error("Falha ao atualizar o perfil da barbearia.");
    }
};

export const mockGetBarbershopSubscription = async (barbershopId: string): Promise<BarbershopSubscription | null> => {
    await ensureDbInitialized();
    const { rows } = await pool.sql`SELECT * FROM barbershop_subscriptions WHERE "barbershopId" = ${barbershopId}`;
    return rows.length > 0 ? mapToSubscription(rows[0]) : null;
};

export const mockUpdateBarbershopSubscription = async (barbershopId: string, planId: SubscriptionPlanTier): Promise<boolean> => {
    await ensureDbInitialized();
    const planDetails = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!planDetails) return false;

    const nextBillingDate = planDetails.price > 0 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;

    const { rowCount } = await pool.sql`
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
  const { rows } = await pool.sql`SELECT * FROM services WHERE "barbershopId" = ${barbershopId}`;
  return rows.map(mapToService);
};
export const mockGetServiceById = async (serviceId: string): Promise<Service | null> => {
  await ensureDbInitialized();
  const { rows } = await pool.sql`SELECT * FROM services WHERE id = ${serviceId}`;
  return rows.length > 0 ? mapToService(rows[0]) : null;
}
export const mockAddService = async (serviceData: Omit<Service, 'id'>): Promise<Service> => {
  await ensureDbInitialized();
  const newService = { ...serviceData, id: generateId('service') };
  await pool.sql`
    INSERT INTO services (id, "barbershopId", name, price, duration, "isActive", description)
    VALUES (${newService.id}, ${newService.barbershopId}, ${newService.name}, ${newService.price}, ${newService.duration}, ${newService.isActive}, ${newService.description})
  `;
  return newService;
};
export const mockUpdateService = async (serviceId: string, data: Partial<Service>): Promise<Service | null> => {
  await ensureDbInitialized();
  const { rowCount } = await pool.sql`
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
  const { rowCount } = await pool.sql`UPDATE services SET "isActive" = ${isActive} WHERE id = ${serviceId}`;
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
    WHERE "barbershopId" = ${barbershopId} AND ${serviceId} = ANY("assignedServices")
  `;
  return rows.map(mapToBarber);
};
export const mockAddBarber = async (barberData: Omit<Barber, 'id'>): Promise<Barber> => {
    await ensureDbInitialized();
    const newBarber = { ...barberData, id: generateId('barber')};
    const assignedServicesArray = `{${barberData.assignedServices.join(',')}}`;
    await pool.sql`
        INSERT INTO barbers (id, "barbershopId", name, "availableHours", "assignedServices")
        VALUES (${newBarber.id}, ${newBarber.barbershopId}, ${newBarber.name}, ${JSON.stringify(newBarber.availableHours)}, ${assignedServicesArray})
    `;
    return newBarber;
};
export const mockUpdateBarber = async (barberId: string, data: Partial<Barber>): Promise<Barber | null> => {
    await ensureDbInitialized();
    const assignedServicesArray = data.assignedServices ? `{${data.assignedServices.join(',')}}` : null;
    const { rowCount } = await pool.sql`
        UPDATE barbers SET
            name = ${data.name},
            "availableHours" = ${JSON.stringify(data.availableHours)},
            "assignedServices" = ${assignedServicesArray}
        WHERE id = ${barberId}
    `;
    if (rowCount === 0) return null;
    const { rows } = await pool.sql`SELECT * from barbers where id = ${barberId}`;
    return rows.length > 0 ? mapToBarber(rows[0]) : null;
};
export const mockDeleteBarber = async (barberId: string): Promise<boolean> => {
    await ensureDbInitialized();
    const { rowCount } = await pool.sql`DELETE FROM barbers WHERE id = ${barberId}`;
    return rowCount > 0;
};

const getAppointmentQuery = (whereClause: string) => pool.sql`
    SELECT 
        a.id, a."clientId", a."barbershopId", a."serviceIds", a."serviceNames",
        a."totalPrice", a."totalDuration", a."barberId",
        a.date, a.time, a.status, a.notes, a."createdAt", 
        c.name AS "clientName",
        b.name AS "barberName",
        bs.name AS "barbershopName"
    FROM appointments a
    JOIN users c ON a."clientId" = c.id
    LEFT JOIN barbers b ON a."barberId" = b.id
    LEFT JOIN barbershop_profiles bs ON a."barbershopId" = bs.id
    ${whereClause}
`;

// --- Appointments ---
export const mockGetClientAppointments = async (clientId: string): Promise<Appointment[]> => {
  await ensureDbInitialized();
  const { rows } = await pool.sql`
    SELECT 
        a.id, a."clientId", a."barbershopId", a."serviceIds", a."serviceNames",
        a."totalPrice", a."totalDuration", a."barberId",
        a.date, a.time, a.status, a.notes, a."createdAt", 
        c.name AS "clientName",
        b.name AS "barberName",
        bs.name AS "barbershopName"
    FROM appointments a
    JOIN users c ON a."clientId" = c.id
    LEFT JOIN barbers b ON a."barberId" = b.id
    LEFT JOIN barbershop_profiles bs ON a."barbershopId" = bs.id
    WHERE a."clientId" = ${clientId}
  `;
  return rows.map(mapToAppointment);
};
export const mockGetAdminAppointments = async (barbershopId: string): Promise<Appointment[]> => {
  await ensureDbInitialized();
  const { rows } = await pool.sql`
    SELECT 
        a.id, a."clientId", a."barbershopId", a."serviceIds", a."serviceNames",
        a."totalPrice", a."totalDuration", a."barberId",
        a.date, a.time, a.status, a.notes, a."createdAt", 
        c.name AS "clientName",
        b.name AS "barberName",
        bs.name AS "barbershopName"
    FROM appointments a
    JOIN users c ON a."clientId" = c.id
    LEFT JOIN barbers b ON a."barberId" = b.id
    LEFT JOIN barbershop_profiles bs ON a."barbershopId" = bs.id
    WHERE a."barbershopId" = ${barbershopId}
  `;
  return rows.map(mapToAppointment);
};

export const mockCreateAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'clientName' | 'barbershopName' | 'serviceNames' | 'barberName' | 'totalPrice' | 'totalDuration' | 'status'>): Promise<Appointment> => {
  await ensureDbInitialized();
  
  // Fetch services to calculate totals and get names
  const serviceIdsParam = `{${appointmentData.serviceIds.join(',')}}`;
  const { rows: services } = await pool.sql`SELECT * FROM services WHERE id = ANY(${serviceIdsParam})`;
  if(services.length !== appointmentData.serviceIds.length) throw new Error("Um ou mais serviços não foram encontrados.");
  
  const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = services.reduce((sum, s) => sum + Number(s.price), 0);
  const serviceNames = services.map(s => s.name);
  
  const newAppointment = { 
    ...appointmentData,
    id: generateId('appt'),
    createdAt: new Date().toISOString(),
    status: 'scheduled',
    totalDuration,
    totalPrice,
    serviceNames
  };

  await pool.sql`
    INSERT INTO appointments (
      id, "clientId", "barbershopId", "serviceIds", "serviceNames",
      "totalPrice", "totalDuration", "barberId", date, time, status, notes, "createdAt"
    )
    VALUES (
        ${newAppointment.id}, ${newAppointment.clientId}, ${newAppointment.barbershopId},
        ${`{${newAppointment.serviceIds.join(',')}}`}, ${`{${newAppointment.serviceNames.map(n => `"${n}"`).join(',')}}`},
        ${newAppointment.totalPrice}, ${newAppointment.totalDuration},
        ${newAppointment.barberId || null}, ${newAppointment.date}, ${newAppointment.time}, 
        ${newAppointment.status}, ${newAppointment.notes}, ${newAppointment.createdAt}
    )
  `;

  const { rows: resultRows } = await pool.sql`
    SELECT 
        a.id, a."clientId", a."barbershopId", a."serviceIds", a."serviceNames",
        a."totalPrice", a."totalDuration", a."barberId",
        a.date, a.time, a.status, a.notes, a."createdAt", 
        c.name AS "clientName",
        b.name AS "barberName",
        bs.name AS "barbershopName"
    FROM appointments a
    JOIN users c ON a."clientId" = c.id
    LEFT JOIN barbers b ON a."barberId" = b.id
    LEFT JOIN barbershop_profiles bs ON a."barbershopId" = bs.id
    WHERE a.id = ${newAppointment.id}
  `;
  return mapToAppointment(resultRows[0]);
};

export const mockUpdateAppointment = async (appointmentId: string, data: Partial<Appointment>): Promise<Appointment | null> => {
  await ensureDbInitialized();
  // Simplified update: does not allow changing services, only other details.
  const { rowCount } = await pool.sql`
    UPDATE appointments SET
        "clientId" = ${data.clientId},
        "barberId" = ${data.barberId || null},
        date = ${data.date},
        time = ${data.time},
        notes = ${data.notes}
    WHERE id = ${appointmentId}
  `;
  if (rowCount === 0) return null;
  const { rows } = await pool.sql`
    SELECT 
        a.id, a."clientId", a."barbershopId", a."serviceIds", a."serviceNames",
        a."totalPrice", a."totalDuration", a."barberId",
        a.date, a.time, a.status, a.notes, a."createdAt", 
        c.name AS "clientName",
        b.name AS "barberName",
        bs.name AS "barbershopName"
    FROM appointments a
    JOIN users c ON a."clientId" = c.id
    LEFT JOIN barbers b ON a."barberId" = b.id
    LEFT JOIN barbershop_profiles bs ON a."barbershopId" = bs.id
    WHERE a.id = ${appointmentId}
  `;
  return rows.length > 0 ? mapToAppointment(rows[0]) : null;
};

export const mockCancelAppointment = async (appointmentId: string, userId: string, cancelledBy: 'client' | 'admin'): Promise<boolean> => {
  await ensureDbInitialized();
  const newStatus = cancelledBy === 'client' ? 'cancelled_by_client' : 'cancelled_by_admin';
  const { rowCount } = await pool.sql`
    UPDATE appointments SET status = ${newStatus} WHERE id = ${appointmentId}
  `;
  return rowCount > 0;
};
export const mockCompleteAppointment = async (appointmentId: string): Promise<boolean> => {
    await ensureDbInitialized();
    const { rowCount } = await pool.sql`UPDATE appointments SET status = 'completed' WHERE id = ${appointmentId}`;
    return rowCount > 0;
};


// --- Reviews ---
export const mockGetReviewsForBarbershop = async (barbershopId: string): Promise<Review[]> => {
  await ensureDbInitialized();
  const { rows } = await pool.sql`
    SELECT r.*, u.name as "clientName"
    FROM reviews r
    JOIN users u ON r."clientId" = u.id
    WHERE r."barbershopId" = ${barbershopId}
  `;
  return rows.map(mapToReview);
};
export const mockGetReviewForAppointment = async (appointmentId: string): Promise<Review | null> => {
  await ensureDbInitialized();
  const { rows } = await pool.sql`
    SELECT r.*, u.name as "clientName"
    FROM reviews r
    JOIN users u ON r."clientId" = u.id
    WHERE r."appointmentId" = ${appointmentId}
  `;
  return rows.length > 0 ? mapToReview(rows[0]) : null;
}
export const mockAddReview = async (reviewData: Omit<Review, 'id' | 'createdAt' | 'reply' | 'replyAt'>): Promise<Review> => {
  await ensureDbInitialized();
  const { rows: existing } = await pool.sql`SELECT id FROM reviews WHERE "appointmentId" = ${reviewData.appointmentId}`;
  if (existing.length > 0) throw new Error("Avaliação para este agendamento já existe.");

  const newReview = { ...reviewData, id: generateId('review'), createdAt: new Date().toISOString() };
  await pool.sql`
    INSERT INTO reviews (id, "appointmentId", "clientId", "barbershopId", rating, comment, "createdAt")
    VALUES (${newReview.id}, ${newReview.appointmentId}, ${newReview.clientId}, ${newReview.barbershopId}, ${newReview.rating}, ${reviewData.comment}, ${newReview.createdAt})
  `;
  
  const { rows } = await pool.sql`
    SELECT r.*, u.name as "clientName"
    FROM reviews r
    JOIN users u ON r."clientId" = u.id
    WHERE r.id = ${newReview.id}
  `;
  return mapToReview(rows[0]);
};
export const mockReplyToReview = async (reviewId: string, replyText: string, adminId: string): Promise<Review | null> => {
    await ensureDbInitialized();
    const { rowCount } = await pool.sql`
        UPDATE reviews SET reply = ${replyText}, "replyAt" = NOW()
        WHERE id = ${reviewId} AND "barbershopId" = ${adminId}
    `;
    if (rowCount === 0) return null;
    const { rows } = await pool.sql`
        SELECT r.*, u.name as "clientName"
        FROM reviews r
        JOIN users u ON r."clientId" = u.id
        WHERE r.id = ${reviewId}
    `;
    return rows.length > 0 ? mapToReview(rows[0]) : null;
};


// --- Client Data for Admin ---
export const mockGetClientsForBarbershop = async (barbershopId: string): Promise<Partial<User>[]> => {
    await ensureDbInitialized();
    const { rows } = await pool.sql`
        SELECT DISTINCT c.id, c.name, c.email, c.phone 
        FROM users c
        JOIN appointments a ON c.id = a."clientId"
        WHERE a."barbershopId" = ${barbershopId} AND c.type = 'client'
    `;
    return rows.map(row => ({ id: row.id, name: row.name, email: row.email, phone: row.phone }));
};

export const mockGetAppointmentsForClientByBarbershop = async (clientId: string, barbershopId: string): Promise<Appointment[]> => {
    await ensureDbInitialized();
    const { rows } = await pool.sql`
        SELECT 
            a.id, a."clientId", a."barbershopId", a."serviceIds", a."serviceNames",
            a."totalPrice", a."totalDuration", a."barberId",
            a.date, a.time, a.status, a.notes, a."createdAt", 
            c.name AS "clientName",
            b.name AS "barberName",
            bs.name AS "barbershopName"
        FROM appointments a
        JOIN users c ON a."clientId" = c.id
        LEFT JOIN barbers b ON a."barberId" = b.id
        LEFT JOIN barbershop_profiles bs ON a."barbershopId" = bs.id
        WHERE a."clientId" = ${clientId} AND a."barbershopId" = ${barbershopId}
    `;
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

  const selectedDate = parseISO(dateString + 'T00:00:00Z');
  const dayOfWeek = getDay(selectedDate);

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

  const { rows: appointmentsOnDate } = await pool.sql`
      SELECT a.time, a."barberId", a."totalDuration" as duration
      FROM appointments a
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
  
  potentialSlots = [...new Set(potentialSlots)].sort();

  const availableSlots = potentialSlots.filter(slot => {
    const slotStart = parse(slot, 'HH:mm', selectedDate);
    const slotEnd = addMinutes(slotStart, serviceDuration);

    const relevantAppointments = barberId 
        ? appointmentsOnDate.filter(app => app.barberId === barberId)
        : appointmentsOnDate;

    const isConflict = relevantAppointments.some(app => {
      const appStart = parse(app.time, 'HH:mm', selectedDate);
      const appEnd = addMinutes(appStart, app.duration);
      return isBefore(slotStart, appEnd) && isBefore(appStart, slotEnd);
    });

    if(isConflict) return false;

    if (!barberId) {
        const barbersBookedCount = appointmentsOnDate.filter(app => {
            const appStart = parse(app.time, 'HH:mm', selectedDate);
            const appEnd = addMinutes(appStart, app.duration);
            return isBefore(slotStart, appEnd) && isBefore(appStart, slotEnd);
        }).length;
        return allBarbersInShop.length > barbersBookedCount;
    }

    return true;
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