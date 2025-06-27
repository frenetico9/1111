import React from 'react';
import { Barber, Service } from '../types';
import Button from './Button';
import { DAYS_OF_WEEK } from '../constants';

interface BarberCardProps {
  barber: Barber;
  services: Service[]; // All available services in the barbershop to map IDs to names
  onEdit: (barber: Barber) => void;
  onDelete: (barberId: string) => void;
}

const BarberCard: React.FC<BarberCardProps> = ({ barber, services, onEdit, onDelete }) => {
  const getServiceName = (serviceId: string) => {
    return services.find(s => s.id === serviceId)?.name || 'Serviço Desconhecido';
  };

  return (
    <div className="p-5 rounded-lg shadow-xl border border-light-blue bg-white flex flex-col justify-between hover:shadow-2xl transition-shadow">
      <div>
        <h3 className="text-xl font-semibold text-primary-blue mb-2">{barber.name}</h3>
        
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Horários:</h4>
          {barber.availableHours.length > 0 ? (
            <ul className="list-disc list-inside text-xs text-gray-600 pl-1 space-y-0.5">
              {barber.availableHours.map((slot, index) => (
                <li key={index}>{DAYS_OF_WEEK[slot.dayOfWeek]}: {slot.start} - {slot.end}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500">Nenhum horário específico cadastrado (usa horários da barbearia).</p>
          )}
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Serviços Atribuídos:</h4>
          {barber.assignedServices.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {barber.assignedServices.map(serviceId => (
                <span key={serviceId} className="bg-primary-blue text-white text-xs px-2 py-0.5 rounded-full">
                  {getServiceName(serviceId)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">Nenhum serviço atribuído.</p>
          )}
        </div>
      </div>

      <div className="flex space-x-2 mt-auto pt-3 border-t border-gray-200">
        <Button onClick={() => onEdit(barber)} variant="outline" size="sm" className="flex-1">
          <span className="material-icons-outlined text-sm mr-1">edit</span>Editar
        </Button>
        <Button onClick={() => onDelete(barber.id)} variant="danger" size="sm" className="flex-1">
          <span className="material-icons-outlined text-sm mr-1">delete</span>Excluir
        </Button>
      </div>
    </div>
  );
};

export default BarberCard;