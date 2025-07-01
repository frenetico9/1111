import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Appointment, Service, Review, User, UserType } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { mockGetAdminAppointments, mockGetServicesForBarbershop, mockGetReviewsForBarbershop, mockGetClientsForBarbershop } from '../../services/mockApiService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { format, endOfWeek, isWithinInterval, parseISO, subDays, startOfWeek } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import { PRIMARY_BLUE } from '../../constants';

const StatCard: React.FC<{ title: string; value: string | number; iconName?: string, description?: string, to?: string }> = 
({ title, value, iconName, description, to }) => {
  const content = (
    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-lg border border-light-blue hover:shadow-xl transition-shadow h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base sm:text-lg font-semibold text-primary-blue">{title}</h3>
          {iconName && <span className="material-icons-outlined text-2xl text-primary-blue opacity-70">{iconName}</span>}
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-gray-800">{value}</p>
      </div>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  );
  return to ? <Link to={to} className="block h-full">{content}</Link> : <div className="h-full">{content}</div>;
};

const AdminOverviewPage: React.FC = () => {
  const { user, barbershopProfile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [clients, setClients] = useState<Partial<User>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || user.type !== UserType.ADMIN || !barbershopProfile) {
         setLoading(false); // Stop loading if prerequisites not met
         return;
      }
      setLoading(true);
      try {
        const [apps, servs, revs, clis] = await Promise.all([
          mockGetAdminAppointments(user.id),
          mockGetServicesForBarbershop(user.id),
          mockGetReviewsForBarbershop(user.id),
          mockGetClientsForBarbershop(user.id)
        ]);
        setAppointments(apps);
        setServices(servs);
        setReviews(revs);
        setClients(clis);
      } catch (error) {
        console.error("Error fetching admin overview data:", error);
        // Add notification if available
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, barbershopProfile]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const startOfCurrentWeek = startOfWeek(now, { locale: ptBR });
    const endOfCurrentWeek = endOfWeek(now, { locale: ptBR });

    const totalRevenue = appointments
      .filter(a => a.status === 'completed')
      .reduce((sum, app) => {
          const service = services.find(s => s.id === app.serviceId);
          return sum + (service?.price || 0);
      }, 0);
    
    const appointmentsToday = appointments.filter(a => a.date === todayStr).length;
    const appointmentsThisWeek = appointments.filter(a => isWithinInterval(parseISO(a.date), {start: startOfCurrentWeek, end: endOfCurrentWeek })).length;

    return {
      totalAppointments: appointments.length,
      completedAppointments: appointments.filter(a => a.status === 'completed').length,
      totalRevenue,
      averageRating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 'N/A',
      totalClients: clients.length,
      activeServices: services.filter(s => s.isActive).length,
      totalServices: services.length,
      appointmentsToday,
      appointmentsThisWeek,
    };
  }, [appointments, services, reviews, clients]);
  
  const appointmentsLast7DaysChartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const day = subDays(new Date(), i);
        const dayStr = format(day, 'yyyy-MM-dd');
        const count = appointments.filter(a => a.date === dayStr && a.status === 'completed').length;
        data.push({ name: format(day, 'dd/MM', { locale: ptBR }), Agendamentos: count });
    }
    return data;
  }, [appointments]);

  const appointmentStatusDistribution = useMemo(() => {
    const statusCounts = appointments.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {} as Record<Appointment['status'], number>);
    return Object.entries(statusCounts).map(([name, value]) => ({name, value}));
  }, [appointments]);

  const PIE_COLORS = ['#007BFF', '#28a745', '#dc3545', '#ffc107', '#6c757d'];


  if (loading) return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><LoadingSpinner size="lg" label="Carregando painel..." /></div>;
  if (!user || !barbershopProfile) return <p className="text-center p-8">Não foi possível carregar os dados da barbearia.</p>;

  return (
    <div className="space-y-6 sm:space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-primary-blue">Visão Geral</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title="Agend. Hoje" value={stats.appointmentsToday} iconName="today" description={`Total: ${stats.totalAppointments}`} to="/admin/appointments" />
        <StatCard title="Agend. Semana" value={stats.appointmentsThisWeek} iconName="date_range" description="Esta semana" to="/admin/appointments" />
        <StatCard title="Faturamento Total" value={`R$ ${stats.totalRevenue.toFixed(2).replace('.',',')}`} iconName="attach_money" description="Serviços concluídos" />
        <StatCard title="Avaliação Média" value={stats.averageRating} iconName="star_half" description={`${reviews.length} avaliações`} to="/admin/reviews" />
        <StatCard title="Clientes" value={stats.totalClients} iconName="people_alt" description="Total cadastrados" to="/admin/clients"/>
        <StatCard title="Serviços Ativos" value={stats.activeServices} iconName="cut" description={`De ${stats.totalServices} serviços`} to="/admin/services"/>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-light-blue">
          <h2 className="text-lg sm:text-xl font-semibold text-primary-blue mb-4">Agendamentos Concluídos (Últimos 7 Dias)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={appointmentsLast7DaysChartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip formatter={(value: number) => [`${value} agendamentos`, "Agendamentos"]}/>
              <Legend wrapperStyle={{fontSize: "12px"}}/>
              <Bar dataKey="Agendamentos" fill={PRIMARY_BLUE} name="Concluídos" barSize={20} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-light-blue">
          <h2 className="text-lg sm:text-xl font-semibold text-primary-blue mb-4">Distribuição de Status dos Agendamentos</h2>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={appointmentStatusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false}
                         label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                            return (percent * 100) > 5 ? ( // Only show label if percent is > 5%
                                <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                                {`${(percent * 100).toFixed(0)}%`}
                                </text>
                            ) : null;
                          }}
                    >
                        {appointmentStatusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{fontSize: "12px"}}/>
                </PieChart>
            </ResponsiveContainer>
        </div>
      </div>

       {/* Quick Actions */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-light-blue">
        <h2 className="text-lg sm:text-xl font-semibold text-primary-blue mb-4">Ações Rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/appointments"><Button variant="primary" leftIcon={<span className="material-icons-outlined">event</span>}>Ver Agendamentos</Button></Link>
          <Link to="/admin/services"><Button variant="outline" leftIcon={<span className="material-icons-outlined">add_circle_outline</span>}>Novo Serviço</Button></Link>
          <Link to="/admin/team"><Button variant="outline" leftIcon={<span className="material-icons-outlined">person_add</span>}>Novo Barbeiro</Button></Link>
          <Link to="/admin/settings"><Button variant="ghost" leftIcon={<span className="material-icons-outlined">settings</span>}>Configurações</Button></Link>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;