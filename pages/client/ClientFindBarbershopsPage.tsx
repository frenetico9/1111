import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { BarbershopSearchResultItem, SubscriptionPlanTier } from '../../types';
import { mockGetPublicBarbershops } from '../../services/mockApiService'; // Use mock API service
import LoadingSpinner from '../../components/LoadingSpinner';
import Input from '../../components/Input';
import BarbershopSearchCard from '../../components/BarbershopSearchCard';
import { useNotification } from '../../contexts/NotificationContext';

type SortOption = 'relevance' | 'name_asc' | 'name_desc' | 'rating_desc';
type RatingFilterOption = 'any' | '4+' | '3+';

const DF_CITIES = [
  'Águas Claras',
  'Brasília (Plano Piloto)',
  'Ceilândia',
  'Gama',
  'Guará',
  'Lago Norte',
  'Lago Sul',
  'Planaltina',
  'Samambaia',
  'Santa Maria',
  'Sobradinho',
  'Sudoeste/Octogonal',
  'Taguatinga',
  'Vicente Pires'
];

const ClientFindBarbershopsPage: React.FC = () => {
  const [allBarbershopsData, setAllBarbershopsData] = useState<BarbershopSearchResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  const [ratingFilter, setRatingFilter] = useState<RatingFilterOption>('any');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const { addNotification } = useNotification();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all barbershops from the mock API endpoint
      const results = await mockGetPublicBarbershops();
      setAllBarbershopsData(results);
    } catch (error) {
      addNotification({ message: 'Erro ao buscar barbearias.', type: 'error' });
      console.error("Error fetching barbershops list:", error);
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredAndSortedBarbershops = useMemo(() => {
    let items = [...allBarbershopsData];

    // Search
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      items = items.filter(shop =>
        shop.name.toLowerCase().includes(lowercasedTerm) ||
        shop.address.toLowerCase().includes(lowercasedTerm)
      );
    }

    // Filter by City
    if (cityFilter !== 'all') {
      items = items.filter(shop => shop.address.toLowerCase().includes(cityFilter.toLowerCase()));
    }

    // Filter by Rating
    if (ratingFilter !== 'any') {
      const minRating = ratingFilter === '4+' ? 4 : 3;
      items = items.filter(shop => shop.averageRating >= minRating);
    }

    // Sort
    const sortFunction = (a: BarbershopSearchResultItem, b: BarbershopSearchResultItem) => {
        // Primary sort: always keep PRO shops before free shops
        if (a.subscriptionTier === 'pro' && b.subscriptionTier !== 'pro') return -1;
        if (a.subscriptionTier !== 'pro' && b.subscriptionTier === 'pro') return 1;

        // Secondary sort: based on user's choice
        switch (sortOption) {
            case 'name_asc':
                return a.name.localeCompare(b.name);
            case 'name_desc':
                return b.name.localeCompare(a.name);
            case 'rating_desc':
            case 'relevance': // Default to rating for relevance
            default:
                 return b.averageRating - a.averageRating || b.reviewCount - a.reviewCount;
        }
    }
    
    items.sort(sortFunction);

    return items;
  }, [allBarbershopsData, searchTerm, ratingFilter, sortOption, cityFilter]);

  if (loading && allBarbershopsData.length === 0) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <LoadingSpinner size="lg" label="Buscando barbearias..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-primary-blue mb-6 sm:mb-8">Encontrar Barbearias no DF</h1>

      {/* Search and Filter Controls */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-md border border-light-blue">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <Input
            label="Buscar por Nome ou Endereço"
            type="search"
            placeholder="Digite aqui..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="mb-0 md:col-span-6"
            leftIcon={<span className="material-icons-outlined">search</span>}
          />
          <div className="md:col-span-2">
            <label htmlFor="cityFilter" className="block text-xs font-medium text-gray-700">Cidade</label>
            <select
              id="cityFilter"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue text-sm"
            >
              <option value="all">Todas as Cidades</option>
              {DF_CITIES.sort().map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="ratingFilter" className="block text-xs font-medium text-gray-700">Avaliação Mínima</label>
            <select
              id="ratingFilter"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value as RatingFilterOption)}
              className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue text-sm"
            >
              <option value="any">Qualquer</option>
              <option value="4+">4+ Estrelas</option>
              <option value="3+">3+ Estrelas</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="sortOption" className="block text-xs font-medium text-gray-700">Ordenar Por</label>
            <select
              id="sortOption"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue text-sm"
            >
              <option value="relevance">Relevância</option>
              <option value="name_asc">Nome (A-Z)</option>
              <option value="name_desc">Nome (Z-A)</option>
              <option value="rating_desc">Melhor Avaliadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading && allBarbershopsData.length > 0 && <div className="my-4"><LoadingSpinner label="Atualizando lista..." /></div>}
      
      {!loading && filteredAndSortedBarbershops.length === 0 ? (
        <div className="text-center py-12 bg-white shadow-lg rounded-lg border border-light-blue">
          <span className="material-icons-outlined text-6xl text-primary-blue/50">store_mall_directory</span>
          <p className="text-xl text-gray-600 mb-3">Nenhuma barbearia encontrada.</p>
          <p className="text-sm text-gray-500">Tente ajustar seus termos de busca ou filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedBarbershops.map(shop => (
            <BarbershopSearchCard key={shop.id} barbershop={shop} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientFindBarbershopsPage;