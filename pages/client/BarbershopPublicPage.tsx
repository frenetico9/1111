import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarbershopProfile, Service, Review as ReviewType } from '../../types';
import { mockGetBarbershopProfile, mockGetServicesForBarbershop, mockGetReviewsForBarbershop } from '../../services/mockApiService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ServiceCard from '../../components/ServiceCard';
import ReviewCard from '../../components/ReviewCard';
import Button from '../../components/Button';
import { DAYS_OF_WEEK } from '../../constants';
import StarRating from '../../components/StarRating';
import BackButton from '../../components/BackButton';

const BarbershopPublicPage: React.FC = () => {
  const { barbershopId } = useParams<{ barbershopId: string }>();
  const [barbershop, setBarbershop] = useState<BarbershopProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!barbershopId) {
      setError("ID da barbearia não fornecido.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const profilePromise = mockGetBarbershopProfile(barbershopId);
      const servicesPromise = mockGetServicesForBarbershop(barbershopId);
      const reviewsPromise = mockGetReviewsForBarbershop(barbershopId);

      const [profile, fetchedServices, fetchedReviews] = await Promise.all([profilePromise, servicesPromise, reviewsPromise]);
      
      if (!profile) {
        setError("Barbearia não encontrada. Verifique o ID ou tente novamente.");
        setLoading(false);
        return;
      }

      setBarbershop(profile);
      setServices(fetchedServices.filter(s => s.isActive)); // Show only active services
      fetchedReviews.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReviews(fetchedReviews);
    } catch (err) {
      setError("Erro ao carregar dados da barbearia. Tente novamente mais tarde.");
      console.error("Fetch data error:", err);
    } finally {
      setLoading(false);
    }
  }, [barbershopId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
  }, [reviews]);

  if (loading) return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><LoadingSpinner size="lg" label="Carregando barbearia..." /></div>;
  if (error) return <div className="text-center text-red-600 py-10 text-xl bg-white p-8 rounded-lg shadow-md">{error} <Link to="/"><Button variant="primary" className="mt-6">Voltar para Início</Button></Link></div>;
  if (!barbershop) return <div className="text-center text-gray-500 py-10 text-xl bg-white p-8 rounded-lg shadow-md">Barbearia não encontrada.</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Header Section */}
      <header className="relative h-64 md:h-80 w-full mb-10">
         <div className="absolute inset-0 bg-gradient-to-br from-primary-blue to-blue-500">
           {barbershop.coverImageUrl && (
              <img src={barbershop.coverImageUrl} alt={`${barbershop.name} cover`} className="w-full h-full object-cover"/>
           )}
         </div>
         <div className="absolute inset-0 bg-black/50"></div>
         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full px-4">
          <div className="container mx-auto flex flex-col md:flex-row items-center justify-center md:justify-start text-center md:text-left">
            {barbershop.logoUrl ? 
                <img src={barbershop.logoUrl} alt={`${barbershop.name} Logo`} className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white object-cover shadow-xl flex-shrink-0 bg-white" />
                : <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-white flex items-center justify-center text-primary-blue text-5xl font-bold border-4 border-white shadow-xl flex-shrink-0">{barbershop.name.charAt(0)}</div>
            }
            <div className="bg-black/40 backdrop-blur-sm text-white p-4 rounded-b-lg md:rounded-r-lg md:rounded-b-none mt-0 md:-ml-4 md:pt-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">{barbershop.name}</h1>
              {barbershop.description && <p className="text-sm sm:text-md mt-1 max-w-xl opacity-90">{barbershop.description}</p>}
              {reviews.length > 0 && (
                <div className="mt-2 flex items-center justify-center md:justify-start space-x-2">
                  <StarRating value={averageRating} isEditable={false} size={20} color="#FFD700" />
                  <span className="text-sm font-semibold">({averageRating.toFixed(1)} de {reviews.length} avaliações)</span>
                </div>
              )}
            </div>
          </div>
         </div>
      </header>
      
      <div className="mt-24"></div>


      <div className="container mx-auto px-4">
        <div className="mb-6">
          <BackButton />
        </div>
        <div className="grid md:grid-cols-12 gap-8">
            {/* Services Section - Main Column */}
            <section className="md:col-span-8 space-y-8">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-primary-blue mb-6 border-b-2 border-primary-blue pb-2">Nossos Serviços</h2>
                {services.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-6">
                    {services.map(service => (
                    <ServiceCard key={service.id} service={service} barbershopId={barbershop.id} />
                    ))}
                </div>
                ) : (
                <div className="text-center text-gray-600 bg-white p-8 rounded-lg shadow-md">
                    <span className="material-icons-outlined text-5xl text-gray-400 mb-3">sentiment_dissatisfied</span>
                    <p>Nenhum serviço cadastrado no momento. Volte em breve!</p>
                </div>
                )}
            </div>
            {/* Reviews Section */}
            {reviews.length > 0 && (
                <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-primary-blue mb-8 border-b-2 border-primary-blue pb-2">O que nossos clientes dizem</h2>
                <div className="space-y-6">
                    {reviews.slice(0,3).map(review => ( // Show up to 3 reviews initially
                    <ReviewCard key={review.id} review={review} />
                    ))}
                </div>
                {reviews.length > 3 && (
                    <div className="text-center mt-8">
                        {/* TODO: Add "show more reviews" functionality or pagination */}
                        <p className="text-gray-600 text-sm">Mostrando {Math.min(3, reviews.length)} de {reviews.length} avaliações.</p>
                    </div>
                )}
                </div>
            )}
            {services.length > 0 && reviews.length === 0 && (
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-primary-blue mb-6 border-b-2 border-primary-blue pb-2">Avaliações</h2>
                    <div className="text-center text-gray-600 bg-white p-8 rounded-lg shadow-md">
                    <span className="material-icons-outlined text-5xl text-gray-400 mb-3">rate_review</span>
                    <p>Esta barbearia ainda não possui avaliações. Seja o primeiro a avaliar após seu agendamento!</p>
                    </div>
                </div>
            )}
            </section>

            {/* Sidebar - Working Hours & Location */}
            <aside className="md:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-xl border border-light-blue sticky top-24"> {/* Sticky sidebar */}
                    <h3 className="text-xl font-semibold text-primary-blue mb-3 flex items-center">
                    <span className="material-icons-outlined mr-2">schedule</span>
                    Horário de Funcionamento
                    </h3>
                    <ul className="text-gray-700 space-y-1.5 text-sm">
                        {barbershop.workingHours.sort((a,b) => a.dayOfWeek - b.dayOfWeek).map(wh => (
                            <li key={wh.dayOfWeek} className="flex justify-between items-center py-1 border-b border-light-blue last:border-b-0">
                                <span className="font-medium">{DAYS_OF_WEEK[wh.dayOfWeek]}:</span>
                                <span className={`font-semibold ${wh.isOpen ? 'text-green-600' : 'text-red-500'}`}>
                                    {wh.isOpen ? `${wh.start} - ${wh.end}` : 'Fechado'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
                {/* Placeholder for Map - Could use an iframe or image */}
                <div className="bg-white p-6 rounded-xl shadow-xl border border-light-blue">
                    <h3 className="text-xl font-semibold text-primary-blue mb-3 flex items-center">
                    <span className="material-icons-outlined mr-2">location_on</span>
                    Localização
                    </h3>
                    <p className="text-gray-700 text-sm mb-3">{barbershop.address}</p>
                    <div className="bg-gray-200 h-48 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                        (Integração com mapa aqui)
                    </div>
                    <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(barbershop.address)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block mt-3"
                    >
                        <Button variant="outline" fullWidth>
                            Ver no Google Maps
                            <span className="material-icons-outlined text-sm ml-2">open_in_new</span>
                        </Button>
                    </a>
                </div>
            </aside>
        </div>
      </div>
    </div>
  );
};

export default BarbershopPublicPage;