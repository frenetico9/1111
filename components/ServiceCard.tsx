import React from 'react';
import { Service } from '../types';
import Button from './Button';
import { Link } from 'react-router-dom';

interface ServiceCardProps {
  service: Service;
  barbershopId: string; // Needed for booking link construction
  onBook?: (serviceId: string) => void; // For client view, though Link is used now
  onEdit?: (service: Service) => void; // For admin panel
  onToggleActive?: (serviceId: string, isActive: boolean) => void; // For admin panel
  isAdminView?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ 
  service, 
  barbershopId,
  onEdit, 
  onToggleActive, 
  isAdminView = false 
}) => {
  return (
    <div 
      className={`p-5 rounded-lg shadow-lg border-2 transition-all duration-300 ease-in-out hover:shadow-xl
                  ${service.isActive ? 'border-light-blue bg-white hover:border-primary-blue' 
                                      : 'border-gray-200 bg-gray-50 opacity-70'}`}
    >
      <h3 className="text-lg font-semibold text-primary-blue mb-2 truncate" title={service.name}>{service.name}</h3>
      <p className="text-gray-700 text-sm mb-1">Duração: {service.duration} minutos</p>
      <p className="text-md font-bold text-primary-blue mb-3">R$ {service.price.toFixed(2).replace('.', ',')}</p>
      {service.description && <p className="text-xs text-gray-600 mb-4 h-10 overflow-hidden text-ellipsis">{service.description}</p>}
      
      {isAdminView ? (
        <div className="mt-4 space-y-2">
          <Button onClick={() => onEdit && onEdit(service)} variant="outline" size="sm" fullWidth>
            <span className="material-icons-outlined text-sm mr-1">edit</span>Editar
          </Button>
          <Button 
            onClick={() => onToggleActive && onToggleActive(service.id, !service.isActive)} 
            variant={service.isActive ? "danger" : "primary"} 
            size="sm" 
            fullWidth
          >
            <span className="material-icons-outlined text-sm mr-1">{service.isActive ? 'visibility_off' : 'visibility'}</span>
            {service.isActive ? 'Desativar' : 'Ativar'}
          </Button>
        </div>
      ) : (
        service.isActive ? (
          <Link to={`/barbershop/${barbershopId}/book/${service.id}`} className="block mt-4">
            <Button 
              variant="primary" 
              fullWidth
            >
              Agendar Serviço
            </Button>
          </Link>
        ) : (
          <p className="text-sm text-center text-red-500 mt-4 font-medium">Serviço indisponível</p>
        )
      )}
    </div>
  );
};

export default ServiceCard;