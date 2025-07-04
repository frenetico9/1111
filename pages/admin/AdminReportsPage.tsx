import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Appointment, Service, Barber, SubscriptionPlanTier, Review } from '../../types';
import { mockGetAdminAppointments, mockGetServicesForBarbershop, mockGetBarbersForBarbershop, mockGetReviewsForBarbershop } from '../../services/mockApiService';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns/format';
import { subDays } from 'date-fns/subDays';
import { startOfDay } from 'date-fns/startOfDay';
import { ptBR } from 'date-fns/locale/pt-BR';

const StatCard: React.FC<{ title: string; value: string | number; iconName?: string; description?: string; }> = ({ title, value, iconName, description }) => (
    <div className="bg-white p-5 rounded-xl shadow-lg border border-light-blue hover:shadow-xl transition-shadow h-full">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-primary-blue">{title}</h3>
        {iconName && <span className="material-icons-outlined text-3xl text-primary-blue/70">{iconName}</span>}
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
);

const NoDataState: React.FC<{title: string, message: string}> = ({title, message}) => (
    <div className="text-center py-10 px-4 bg-white shadow-md rounded-lg col-span-full">
        <span className="material-icons-outlined text-5xl text-primary-blue/50 mb-3">info</span>
        <h3 className="text-xl font-semibold text-gray-700">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{message}</p>
    </div>
);

const AdminReportsPage: React.FC = () => {
    const { user, barbershopSubscription, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [dateRange, setDateRange] = useState<'last7' | 'last30'>('last30');

    useEffect(() => {
        if (!authLoading && barbershopSubscription && barbershopSubscription.planId !== SubscriptionPlanTier.PRO) {
            navigate('/admin/subscription');
        }
    }, [barbershopSubscription, authLoading, navigate]);

    const fetchData = useCallback(async () => {
        if (user) {
            setLoading(true);
            try {
                const [apps, srvs, brbrs, revs] = await Promise.all([
                    mockGetAdminAppointments(user.id),
                    mockGetServicesForBarbershop(user.id),
                    mockGetBarbersForBarbershop(user.id),
                    mockGetReviewsForBarbershop(user.id)
                ]);
                setAppointments(apps);
                setServices(srvs);
                setBarbers(brbrs);
                setReviews(revs);
            } catch (error) {
                console.error("Error fetching report data:", error);
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const completedAppointments = useMemo(() => appointments.filter(a => a.status === 'completed'), [appointments]);

    const kpiData = useMemo(() => {
        const totalRevenue = completedAppointments.reduce((sum, app) => {
            const service = services.find(s => s.id === app.serviceId);
            return sum + (service?.price || 0);
        }, 0);
        const totalCompleted = completedAppointments.length;
        const averageTicket = totalCompleted > 0 ? totalRevenue / totalCompleted : 0;
        return { totalRevenue, totalCompleted, averageTicket };
    }, [completedAppointments, services]);
    
    const revenueChartData = useMemo(() => {
        const days = dateRange === 'last7' ? 7 : 30;
        const dataMap = new Map<string, number>();
        for (let i = 0; i < days; i++) {
            const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
            dataMap.set(date, 0);
        }

        completedAppointments.forEach(app => {
            const appDate = format(new Date(app.date + 'T00:00:00'), 'yyyy-MM-dd');
            if (dataMap.has(appDate)) {
                const service = services.find(s => s.id === app.serviceId);
                const currentRevenue = dataMap.get(appDate) || 0;
                dataMap.set(appDate, currentRevenue + (service?.price || 0));
            }
        });
        
        return Array.from(dataMap.entries())
            .map(([date, revenue]) => ({
                date: format(new Date(date + 'T00:00:00'), 'dd/MM'),
                Faturamento: revenue
            }))
            .reverse();

    }, [completedAppointments, services, dateRange]);

    const servicesPerformance = useMemo(() => {
        const performanceMap = new Map<string, { bookings: number, revenue: number }>();
        services.forEach(s => performanceMap.set(s.id, { bookings: 0, revenue: 0 }));

        completedAppointments.forEach(app => {
            if (performanceMap.has(app.serviceId)) {
                const current = performanceMap.get(app.serviceId)!;
                const servicePrice = services.find(s => s.id === app.serviceId)?.price || 0;
                current.bookings += 1;
                current.revenue += servicePrice;
            }
        });

        return Array.from(performanceMap.entries())
            .map(([id, data]) => ({ id, name: services.find(s=>s.id === id)?.name || 'N/A', ...data }))
            .filter(item => item.bookings > 0)
            .sort((a, b) => b.revenue - a.revenue);
    }, [completedAppointments, services]);

    const teamPerformance = useMemo(() => {
        const appointmentToRating = new Map(reviews.map(r => [r.appointmentId, r.rating]));
        
        const performanceMap = new Map<string, { bookings: number, revenue: number, ratings: number[], ratedAppointments: number }>();
        barbers.forEach(b => performanceMap.set(b.id, { bookings: 0, revenue: 0, ratings: [], ratedAppointments: 0 }));

        completedAppointments.forEach(app => {
            if (app.barberId && performanceMap.has(app.barberId)) {
                const current = performanceMap.get(app.barberId)!;
                const servicePrice = services.find(s => s.id === app.serviceId)?.price || 0;
                current.bookings += 1;
                current.revenue += servicePrice;
                if(appointmentToRating.has(app.id)) {
                    current.ratings.push(appointmentToRating.get(app.id)!);
                    current.ratedAppointments += 1;
                }
            }
        });
        
        return Array.from(performanceMap.entries())
             .map(([id, data]) => {
                const avgRating = data.ratings.length > 0 ? data.ratings.reduce((a,b)=>a+b,0) / data.ratings.length : 0;
                return { id, name: barbers.find(b=>b.id === id)?.name || 'N/A', ...data, averageRating: avgRating }
            })
            .filter(item => item.bookings > 0)
            .sort((a,b) => b.revenue - a.revenue);

    }, [completedAppointments, barbers, services, reviews]);

    if (loading || authLoading) return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><LoadingSpinner size="lg" label="Carregando relatórios..." /></div>;
    if (barbershopSubscription?.planId !== SubscriptionPlanTier.PRO) return null;
    if(completedAppointments.length === 0) return <NoDataState title="Sem dados para analisar" message="Quando você tiver agendamentos concluídos, os relatórios aparecerão aqui."/>

    const PIE_COLORS = ['#0052FF', '#007BFF', '#58AFFF', '#8BC8FF', '#BEDAFF'];
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary-blue">Relatórios e Análises</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 <StatCard title="Faturamento Total" value={`R$ ${kpiData.totalRevenue.toFixed(2).replace('.', ',')}`} iconName="monetization_on" description="Período completo" />
                 <StatCard title="Agend. Concluídos" value={kpiData.totalCompleted} iconName="event_available" description="Total de serviços prestados" />
                 <StatCard title="Ticket Médio" value={`R$ ${kpiData.averageTicket.toFixed(2).replace('.', ',')}`} iconName="receipt_long" description="Valor médio por agendamento" />
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-light-blue">
                <div className="flex flex-wrap justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-primary-blue">Receita por Dia</h2>
                    <div className="flex gap-2">
                        <Button variant={dateRange === 'last7' ? 'primary' : 'outline'} size="sm" onClick={() => setDateRange('last7')}>7 Dias</Button>
                        <Button variant={dateRange === 'last30' ? 'primary' : 'outline'} size="sm" onClick={() => setDateRange('last30')}>30 Dias</Button>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis fontSize={12} tickFormatter={(value) => `R$${value}`} />
                        <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Faturamento"]}/>
                        <Legend />
                        <Line type="monotone" dataKey="Faturamento" stroke="#0052FF" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-light-blue">
                     <h2 className="text-xl font-semibold text-primary-blue mb-4">Serviços Mais Populares (por Faturamento)</h2>
                     <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={servicesPerformance.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`}/>
                            <Bar dataKey="revenue" name="Receita" fill="#007BFF" radius={[0, 4, 4, 0]} barSize={20}>
                                 {servicesPerformance.slice(0, 5).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                     <div className="mt-4 overflow-x-auto text-xs">
                        <table className="min-w-full">
                            <thead><tr className="border-b-2"><th className="text-left p-1">Serviço</th><th className="p-1">Agend.</th><th className="text-right p-1">Receita</th></tr></thead>
                            <tbody>{servicesPerformance.map(s=>(<tr key={s.id} className="border-b"><td className="text-left p-1">{s.name}</td><td className="text-center p-1">{s.bookings}</td><td className="text-right p-1 font-medium">R$ {s.revenue.toFixed(2)}</td></tr>))}</tbody>
                        </table>
                     </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-light-blue">
                     <h2 className="text-xl font-semibold text-primary-blue mb-4">Desempenho da Equipe</h2>
                     <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={teamPerformance.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                            <Bar dataKey="revenue" name="Receita" fill="#58AFFF" radius={[0, 4, 4, 0]} barSize={20}>
                                {teamPerformance.slice(0, 5).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                      <div className="mt-4 overflow-x-auto text-xs">
                        <table className="min-w-full">
                            <thead><tr className="border-b-2"><th className="text-left p-1">Barbeiro</th><th className="p-1">Agend.</th><th className="p-1">Avaliação</th><th className="text-right p-1">Receita</th></tr></thead>
                            <tbody>{teamPerformance.map(b=>(<tr key={b.id} className="border-b"><td className="text-left p-1">{b.name}</td><td className="text-center p-1">{b.bookings}</td><td className="text-center p-1">{b.averageRating > 0 ? b.averageRating.toFixed(1) : '-'}</td><td className="text-right p-1 font-medium">R$ {b.revenue.toFixed(2)}</td></tr>))}</tbody>
                        </table>
                     </div>
                </div>
            </div>

        </div>
    );
};

export default AdminReportsPage;