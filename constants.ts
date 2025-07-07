import { BarbershopProfile, SubscriptionPlan, SubscriptionPlanTier } from './types';

// Colors (already in tailwind.config, but good for JS reference if needed elsewhere)
export const PRIMARY_BLUE = '#0052FF';
export const LIGHT_BLUE = '#E9F0FF';
export const PRIMARY_BLUE_DARK = '#0040CC';
export const WHITE = '#FFFFFF';
export const TEXT_DARK = '#111827';
export const TEXT_LIGHT = '#6B7280';
export const BORDER_COLOR = '#E5E7EB';

export const CORTE_CERTO_ID = 'admin@cortecerto.com';
export const CORTE_CERTO_LOGO_URL = 'https://i.imgur.com/kYq8nDb.png';
export const NAVALHA_LOGO_URL = 'https://i.imgur.com/OViX73g.png';

export const MOCK_API_DELAY = 500; // ms, adjust for testing

export const DAYS_OF_WEEK = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
export const TIME_SLOTS_INTERVAL = 30; // minutes, for generating available slots

export const DEFAULT_BARBERSHOP_WORKING_HOURS: BarbershopProfile['workingHours'] = [
  { dayOfWeek: 0, start: '09:00', end: '18:00', isOpen: false }, // Sunday
  { dayOfWeek: 1, start: '09:00', end: '18:00', isOpen: true },  // Monday
  { dayOfWeek: 2, start: '09:00', end: '18:00', isOpen: true },  // Tuesday
  { dayOfWeek: 3, start: '09:00', end: '18:00', isOpen: true },  // Wednesday
  { dayOfWeek: 4, start: '09:00', end: '18:00', isOpen: true },  // Thursday
  { dayOfWeek: 5, start: '09:00', end: '18:00', isOpen: true },  // Friday
  { dayOfWeek: 6, start: '10:00', end: '16:00', isOpen: true }, // Saturday
];

export const MIN_PASSWORD_LENGTH = 6;

export const DF_CITIES: string[] = [
  // Cidades/RAs
  'Águas Claras',
  'Arapoanga',
  'Arniqueira',
  'Brazlândia',
  'Candangolândia',
  'Ceilândia',
  'Cruzeiro',
  'Fercal',
  'Gama',
  'Guará',
  'Itapoã',
  'Jardim Botânico',
  'Lago Norte',
  'Lago Sul',
  'Núcleo Bandeirante',
  'Paranoá',
  'Park Way',
  'Planaltina',
  'Plano Piloto',
  'Recanto das Emas',
  'Riacho Fundo',
  'Riacho Fundo II',
  'Samambaia',
  'Santa Maria',
  'São Sebastião',
  'SCIA (Estrutural)',
  'SIA',
  'Sobradinho',
  'Sobradinho II',
  'Sol Nascente/Pôr do Sol',
  'Sudoeste/Octogonal',
  'Taguatinga',
  'Varjão',
  'Vicente Pires',
  // Bairros/Setores Habitacionais
  'Itapoã Parque',
  'Jardins Mangueiral',
  'Noroeste',
  'Setor O',
  'Setor Habitacional Taquari',
  'Setor Habitacional Tororó',
  'Vila Planalto',
  // Cidades do Entorno
  'Águas Lindas de Goiás',
  'Cidade Ocidental',
  'Formosa',
  'Luziânia',
  'Novo Gama',
  'Planaltina de Goiás',
  'Santo Antônio do Descoberto',
  'Valparaíso de Goiás',
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: SubscriptionPlanTier.FREE,
    name: 'Grátis',
    price: 0,
    appointmentLimit: 20,
    features: [
      'Até 20 agendamentos por mês',
      'Página online da barbearia',
      'Gestão de agenda e serviços',
      'Cadastro de clientes',
    ],
  },
  {
    id: SubscriptionPlanTier.PRO,
    name: 'PRO',
    price: 49.90,
    features: [
      'Agendamentos ilimitados',
      'Todas as funcionalidades do plano Grátis',
      'Relatórios e análises de desempenho',
      'Destaque nos resultados de busca',
      'Suporte prioritário',
    ],
  },
];

export const DETAILED_FEATURES_COMPARISON: {category: string, feature: string, free: string | boolean, pro: string | boolean}[] = [
    { category: 'Agendamentos', feature: 'Limite de Agendamentos Mensais', free: '20', pro: 'Ilimitado' },
    { category: 'Agendamentos', feature: 'Agenda Online 24/7', free: true, pro: true },
    { category: 'Agendamentos', feature: 'Notificações de Lembrete', free: true, pro: true },
    
    { category: 'Gestão', feature: 'Gestão de Serviços e Preços', free: true, pro: true },
    { category: 'Gestão', feature: 'Gestão de Equipe (Barbeiros)', free: true, pro: true },
    { category: 'Gestão', feature: 'Gestão de Clientes (CRM)', free: true, pro: true },
    { category: 'Gestão', feature: 'Controle de Caixa (Financeiro)', free: false, pro: true },

    { category: 'Marketing & Visibilidade', feature: 'Página Pública da Barbearia', free: true, pro: true },
    { category: 'Marketing & Visibilidade', feature: 'Receber Avaliações de Clientes', free: true, pro: true },
    { category: 'Marketing & Visibilidade', feature: 'Destaque na Busca da Plataforma', free: false, pro: true },

    { category: 'Análise', feature: 'Relatórios de Faturamento', free: false, pro: true },
    { category: 'Análise', feature: 'Relatórios de Desempenho de Serviços', free: false, pro: true },

    { category: 'Suporte', feature: 'Suporte por E-mail', free: true, pro: true },
    { category: 'Suporte', feature: 'Suporte Prioritário', free: false, pro: true },
];
