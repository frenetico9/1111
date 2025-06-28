import React, { useEffect, useState, useCallback } from 'react';
import { Appointment, Review, UserType } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { mockGetClientAppointments, mockCancelAppointment, mockAddReview, mockGetReviewForAppointment } from '../../services/mockApiService';
import AppointmentCard from '../../components/AppointmentCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import StarRating from '../../components/StarRating';
import Button from '../../components/Button';
import { useNotification } from '../../contexts/NotificationContext';
import { Link } from 'react-router-dom';

const ClientAppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Review state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  const { addNotification } = useNotification();

  const fetchAppointments = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const fetchedAppointments = await mockGetClientAppointments(user.id);
        // Sort by date: upcoming first, then past most recent first
        fetchedAppointments.sort((a, b) => {
            const dateA = new Date(a.date + 'T' + a.time).getTime();
            const dateB = new Date(b.date + 'T' + b.time).getTime();
            if (a.status === 'scheduled' && b.status !== 'scheduled') return -1;
            if (a.status !== 'scheduled' && b.status === 'scheduled') return 1;
            return dateB - dateA; // For same status, sort by date
        });
        setAppointments(fetchedAppointments);
      } catch (error) {
        addNotification({ message: 'Erro ao buscar agendamentos.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  }, [user, addNotification]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCancelAppointment = async () => {
    if (selectedAppointment && user) {
      setLoading(true); // Indicate processing
      try {
        await mockCancelAppointment(selectedAppointment.id, user.id, 'client');
        addNotification({ message: 'Agendamento cancelado com sucesso.', type: 'success' });
        fetchAppointments(); // Refresh list
      } catch (error) {
        addNotification({ message: `Erro ao cancelar agendamento: ${(error as Error).message}`, type: 'error' });
      } finally {
        setShowCancelModal(false);
        setSelectedAppointment(null);
        setLoading(false);
      }
    }
  };

  const openCancelModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };
  
  const openReviewModal = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setLoading(true);
    try {
        const review = await mockGetReviewForAppointment(appointment.id);
        if (review) {
        setExistingReview(review);
        setReviewRating(review.rating);
        setReviewComment(review.comment || '');
        } else {
        setExistingReview(null);
        setReviewRating(0); // Reset for new review
        setReviewComment('');
        }
    } catch (e) {
        addNotification({ message: "Erro ao verificar avaliação existente.", type: "error"});
    } finally {
        setLoading(false);
        setShowReviewModal(true);
    }
  };

  const handleReviewSubmit = async () => {
    if (selectedAppointment && user && reviewRating > 0) {
      setIsSubmittingReview(true);
      try {
        await mockAddReview({
          appointmentId: selectedAppointment.id,
          clientId: user.id,
          clientName: user.name, // Ensure user.name is available or handle fallback
          barbershopId: selectedAppointment.barbershopId,
          rating: reviewRating,
          comment: reviewComment,
        });
        addNotification({ message: 'Avaliação enviada com sucesso!', type: 'success' });
        fetchAppointments(); // Refresh to potentially update review status on card
      } catch (error) {
        addNotification({ message: `Erro ao enviar avaliação: ${(error as Error).message}`, type: 'error' });
      } finally {
        setShowReviewModal(false);
        setSelectedAppointment(null);
        // Do not reset reviewRating and reviewComment here, they are reset when modal opens
        setIsSubmittingReview(false);
      }
    } else if (reviewRating === 0) {
       addNotification({ message: 'Por favor, selecione uma nota (estrelas) para avaliar.', type: 'warning' });
    }
  };

  const upcomingAppointments = appointments.filter(app => app.status === 'scheduled');
  const pastAppointments = appointments.filter(app => app.status !== 'scheduled');

  if (loading && appointments.length === 0) return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-primary-blue mb-8">Meus Agendamentos</h1>
      
      {appointments.length === 0 && !loading ? (
        <div className="text-center py-10 bg-white shadow-xl rounded-lg border border-light-blue">
          <span className="material-icons-outlined text-6xl text-primary-blue/50 mb-4">event_busy</span>
          <p className="text-xl text-gray-600 mb-4">Você ainda não possui agendamentos.</p>
          <Link to="/client/find-barbershops">
            <Button variant="primary" size="lg">Encontrar Barbearias</Button>
          </Link>
        </div>
      ) : (
        <>
          {upcomingAppointments.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-text-dark mb-4 pb-2 border-b-2 border-primary-blue">Próximos Agendamentos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {upcomingAppointments.map(app => (
                  <AppointmentCard 
                    key={app.id} 
                    appointment={app} 
                    userType={UserType.CLIENT}
                    onCancel={() => openCancelModal(app)}
                    // onReschedule: Navigate to booking page with pre-filled data or open a reschedule modal
                    onReschedule={() => addNotification({ message: "Reagendamento: Cancele e agende novamente.", type: "info"})}
                  />
                ))}
              </div>
            </section>
          )}

          {pastAppointments.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-text-dark mb-4 pb-2 border-b-2 border-gray-300">Histórico de Agendamentos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {pastAppointments.map(app => (
                  <AppointmentCard 
                    key={app.id} 
                    appointment={app} 
                    userType={UserType.CLIENT}
                    onAddReview={() => openReviewModal(app)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Confirmar Cancelamento"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCancelModal(false)} disabled={loading}>Voltar</Button>
            <Button variant="danger" onClick={handleCancelAppointment} isLoading={loading}>Confirmar Cancelamento</Button>
          </>
        }
      >
        <p>Tem certeza que deseja cancelar o agendamento para <span className="font-semibold">{selectedAppointment?.serviceNames?.join(', ')}</span> no dia <span className="font-semibold">{selectedAppointment?.date ? new Date(selectedAppointment.date  + "T00:00:00").toLocaleDateString('pt-BR') : ''}</span> às <span className="font-semibold">{selectedAppointment?.time}</span>?</p>
        <p className="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={existingReview ? "Sua Avaliação" : "Avaliar Atendimento"}
        footer={!existingReview ? (
          <>
            <Button variant="secondary" onClick={() => setShowReviewModal(false)} disabled={isSubmittingReview}>Cancelar</Button>
            <Button variant="primary" onClick={handleReviewSubmit} isLoading={isSubmittingReview}>Enviar Avaliação</Button>
          </>
        ) : <Button variant="primary" onClick={() => setShowReviewModal(false)}>Fechar</Button>}
      >
        {selectedAppointment && (
          <div>
            <p className="mb-1 text-sm">Serviço: <span className="font-semibold">{selectedAppointment.serviceNames?.join(', ')}</span></p>
            <p className="mb-3 text-sm">Data: <span className="font-semibold">{selectedAppointment.date ? new Date(selectedAppointment.date + "T00:00:00").toLocaleDateString('pt-BR') : ''} às {selectedAppointment.time}</span></p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sua nota (estrelas):</label>
              <StarRating value={reviewRating} onChange={setReviewRating} isEditable={!existingReview} size={28} />
            </div>
            <div>
              <label htmlFor="reviewComment" className="block text-sm font-medium text-gray-700 mb-1">Seu comentário (opcional):</label>
              <textarea
                id="reviewComment"
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-blue focus:border-primary-blue text-sm"
                placeholder="Descreva sua experiência..."
                disabled={!!existingReview || isSubmittingReview}
                aria-label="Comentário da avaliação"
              />
            </div>
             {existingReview && <p className="text-xs text-blue-600 mt-2">Você já avaliou este atendimento.</p>}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClientAppointmentsPage;