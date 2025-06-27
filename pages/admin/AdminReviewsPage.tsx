import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Review } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { mockGetReviewsForBarbershop, mockReplyToReview } from '../../services/mockApiService';
import ReviewCard from '../../components/ReviewCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useNotification } from '../../contexts/NotificationContext';
import { format } from 'date-fns';
import parseISO from 'date-fns/parseISO';
import ptBR from 'date-fns/locale/pt-BR';

const AdminReviewsPage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterReplied, setFilterReplied] = useState<'all' | 'replied' | 'not_replied'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest_rating' | 'lowest_rating'>('newest');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);


  const fetchReviews = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const fetchedReviews = await mockGetReviewsForBarbershop(user.id);
        setReviews(fetchedReviews);
      } catch (error) {
        addNotification({ message: 'Erro ao buscar avaliações.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  }, [user, addNotification]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleReply = async (reviewId: string, replyText: string) => {
    if (!user) return;
    setReplyingTo(reviewId);
    try {
      await mockReplyToReview(reviewId, replyText, user.id);
      addNotification({ message: 'Resposta enviada com sucesso!', type: 'success' });
      fetchReviews(); // Refresh list
    } catch (error) {
      addNotification({ message: `Erro ao enviar resposta: ${(error as Error).message}`, type: 'error' });
    } finally {
      setReplyingTo(null);
    }
  };
  
  const filteredAndSortedReviews = useMemo(() => {
    let processedReviews = [...reviews];

    // Filter
    if (filterReplied === 'replied') {
      processedReviews = processedReviews.filter(r => !!r.reply);
    } else if (filterReplied === 'not_replied') {
      processedReviews = processedReviews.filter(r => !r.reply);
    }

    // Sort
    switch (sortOrder) {
      case 'newest':
        processedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        processedReviews.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'highest_rating':
        processedReviews.sort((a, b) => b.rating - a.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'lowest_rating':
        processedReviews.sort((a, b) => a.rating - b.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    return processedReviews;
  }, [reviews, filterReplied, sortOrder]);


  if (loading && reviews.length === 0) return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-primary-blue mb-6 sm:mb-8">Gerenciar Avaliações de Clientes</h1>

      <div className="mb-6 p-4 bg-white rounded-lg shadow-md flex flex-wrap gap-4 items-end border border-light-blue">
        <div>
          <label htmlFor="filterReplied" className="block text-xs font-medium text-gray-700">Filtrar por Resposta:</label>
          <select 
            id="filterReplied"
            value={filterReplied} 
            onChange={(e) => setFilterReplied(e.target.value as 'all' | 'replied' | 'not_replied')}
            className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue text-sm"
          >
            <option value="all">Todas</option>
            <option value="replied">Respondidas</option>
            <option value="not_replied">Aguardando Resposta</option>
          </select>
        </div>
        <div>
          <label htmlFor="sortOrder" className="block text-xs font-medium text-gray-700">Ordenar por:</label>
          <select 
            id="sortOrder"
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating')}
            className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue text-sm"
          >
            <option value="newest">Mais Recentes</option>
            <option value="oldest">Mais Antigas</option>
            <option value="highest_rating">Maior Nota</option>
            <option value="lowest_rating">Menor Nota</option>
          </select>
        </div>
      </div>
      
      {filteredAndSortedReviews.length === 0 && !loading ? (
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
          <span className="material-icons-outlined text-6xl text-primary-blue/50 mb-4">reviews</span>
          <p className="text-xl text-gray-600 mb-4">Nenhuma avaliação encontrada.</p>
          <p className="text-sm text-gray-500">{filterReplied !== 'all' || sortOrder !== 'newest' ? "Tente ajustar os filtros." : "Quando seus clientes avaliarem os serviços, as avaliações aparecerão aqui."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedReviews.map(review => (
            <ReviewCard 
              key={review.id} 
              review={review} 
              isAdminView={true}
              onReply={handleReply}
              isReplying={replyingTo === review.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviewsPage;