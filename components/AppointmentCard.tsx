import React from 'react';
import { Appointment, UserType } from '../types';
import Button from './Button';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import ptBR from 'date-fns/locale/pt-BR';

interface AppointmentCardProps {
  appointment: Appointment;
  userType: UserType;
  onCancel?: (appointmentId: string) => void;
  onReschedule?: (appointment: Appointment) => void;
  onComplete?: (appointmentId: string) => void; // Admin action
  onAddReview?: (appointment: Appointment) => void; // Client action
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ 
  appointment, 
  userType, 
  onCancel, 
  onReschedule,
  onComplete,
  onAddReview 
}) => {
  
  const getStatusLabel = (status: Appointment['status']): string => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'completed': return 'Concluído';
      case 'cancelled_by_client': return 'Cancelado (Cliente)';
      case 'cancelled_by_admin': return 'Cancelado (Barbearia)';
      default: 
        const statusString = String(status);
        return statusString.charAt(0).toUpperCase() + statusString.slice(1);
    }
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-primary-blue border-primary-blue';
      case 'completed': return 'bg-green-100 text-green-700 border-green-700';
      case 'cancelled_by_client':
      case 'cancelled_by_admin': 
        return 'bg-red-100 text-red-700 border-red-700';
      default: return 'bg-gray-100 text-gray-700 border-gray-700';
    }
  };

  const canCancel = appointment.status === 'scheduled';
  // Reschedule generally means changing date/time, possibly barber. For simplicity, if scheduled.
  const canReschedule = appointment.status === 'scheduled'; 
  const canComplete = userType === UserType.ADMIN && appointment.status === 'scheduled';
  const canReview = userType === UserType.CLIENT && appointment.status === 'completed'; // Could add logic: && !appointment.hasReview

  const formattedDate = format(parseISO(appointment.date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const formattedTime = appointment.time;

  return (
    <div className="p-5 rounded-lg shadow-xl border border-light-blue bg-white flex flex-col justify-between hover:shadow-2xl transition-shadow">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-semibold text-primary-blue leading-tight" title={appointment.serviceName}>{appointment.serviceName}</h3>
            {userType === UserType.ADMIN && <p className="text-xs text-gray-600">Cliente: {appointment.clientName || 'N/A'}</p>}
            {userType === UserType.CLIENT && appointment.barbershopName && <p className="text-xs text-gray-600">Barbearia: {appointment.barbershopName}</p>}
            {appointment.barberName && <p className="text-xs text-gray-600">Barbeiro: {appointment.barberName}</p>}
          </div>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(appointment.status)}`}>
            {getStatusLabel(appointment.status)}
          </span>
        </div>
        
        <div className="text-sm text-gray-700 space-y-1 mb-3">
          <p><span className="material-icons-outlined text-sm mr-1 align-bottom">calendar_today</span> {formattedDate}</p>
          <p><span className="material-icons-outlined text-sm mr-1 align-bottom">schedule</span> {formattedTime}</p>
        </div>
        
        {appointment.notes && <p className="text-xs text-gray-500 italic mb-3 bg-gray-50 p-2 rounded">Obs: {appointment.notes}</p>}
      </div>

      {(canCancel || canReschedule || canComplete || canReview) && (
        <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap gap-2">
          {canCancel && onCancel && (
            <Button onClick={() => onCancel(appointment.id)} variant="danger" size="sm">
              <span className="material-icons-outlined text-sm mr-1">cancel</span>Cancelar
            </Button>
          )}
          {canReschedule && onReschedule && (
            <Button onClick={() => onReschedule(appointment)} variant="outline" size="sm">
             <span className="material-icons-outlined text-sm mr-1">edit_calendar</span>Reagendar
            </Button>
          )}
          {canComplete && onComplete && (
             <Button onClick={() => onComplete(appointment.id)} variant="primary" size="sm">
              <span className="material-icons-outlined text-sm mr-1">check_circle</span>Concluir
            </Button>
          )}
          {canReview && onAddReview && (
            <Button onClick={() => onAddReview(appointment)} variant="primary" size="sm">
              <span className="material-icons-outlined text-sm mr-1">star_outline</span>Avaliar
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentCard;