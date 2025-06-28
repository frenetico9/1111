import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { User, Appointment, UserType } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { mockGetClientsForBarbershop, mockGetAppointmentsForClientByBarbershop } from '../../services/mockApiService';
import LoadingSpinner from '../../components/LoadingSpinner';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientWithDetails extends User {
  totalAppointments: number;
  lastAppointmentDate?: string; // ISO string
}

const ClientRow: React.FC<{ client: ClientWithDetails, onSelectClient: (client: ClientWithDetails) => void }> = ({ client, onSelectClient }) => (
  <tr className="hover:bg-light-blue transition-colors duration-150" onClick={() => onSelectClient(client)} role="button" tabIndex={0} 
      onKeyPress={(e) => e.key === 'Enter' && onSelectClient(client)}>
    <td className="px-4 py-3 border-b border-gray-200 bg-white text-sm text-text-dark font-medium">{client.name}</td>
    <td className="px-4 py-3 border-b border-gray-200 bg-white text-sm text-gray-600">{client.email}</td>
    <td className="px-4 py-3 border-b border-gray-200 bg-white text-sm text-gray-600 hidden md:table-cell">{client.phone}</td>
    <td className="px-4 py-3 border-b border-gray-200 bg-white text-sm text-center text-gray-600 hidden sm:table-cell">{client.totalAppointments}</td>
    <td className="px-4 py-3 border-b border-gray-200 bg-white text-sm text-gray-600">
      {client.lastAppointmentDate ? format(parseISO(client.lastAppointmentDate), 'dd/MM/yyyy', {locale: ptBR}) : 'N/A'}
    </td>
    <td className="px-4 py-3 border-b border-gray-200 bg-white text-sm text-right">
        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onSelectClient(client);}}>Ver Detalhes</Button>
    </td>
  </tr>
);

const ClientDetailModalContent: React.FC<{ client: ClientWithDetails, appointments: Appointment[], loadingDetails: boolean }> = ({ client, appointments, loadingDetails }) => {
  if (loadingDetails) return <LoadingSpinner label="Carregando detalhes do cliente..." />;
  return (
    <div className="space-y-3">
      <p><strong>Email:</strong> {client.email}</p>
      <p><strong>Telefone:</strong> {client.phone}</p>
      <p><strong>Total de Agendamentos na sua barbearia:</strong> {client.totalAppointments}</p>
      <p className="mb-3"><strong>Último Agendamento:</strong> {client.lastAppointmentDate ? format(parseISO(client.lastAppointmentDate), "dd/MM/yyyy 'às' HH:mm", {locale: ptBR}) : 'Nenhum agendamento registrado'}</p>
      
      <h3 className="text-md font-semibold text-gray-700 mt-4 border-t pt-3 mb-2">Histórico de Agendamentos (nesta barbearia):</h3>
      {appointments.length > 0 ? (
        <ul className="max-h-60 overflow-y-auto space-y-1.5 text-xs border rounded-md p-2 bg-gray-50">
          {appointments.map(app => (
            <li key={app.id} className="p-1.5 bg-light-blue/60 rounded-sm shadow-sm">
              {format(parseISO(app.date + 'T' + app.time), "dd/MM/yy HH:mm", {locale: ptBR})} - <strong>{app.serviceNames?.join(', ')}</strong> ({app.status})
              {app.barberName && <span className="text-gray-500"> com {app.barberName}</span>}
            </li>
          ))}
        </ul>
      ) : <p className="text-xs text-gray-500">Nenhum agendamento encontrado para este cliente na sua barbearia.</p>}
    </div>
  );
}


const AdminClientsPage: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedClient, setSelectedClient] = useState<ClientWithDetails | null>(null);
  const [clientAppointments, setClientAppointments] = useState<Appointment[]>([]);
  const [loadingClientDetails, setLoadingClientDetails] = useState(false);

  const fetchClients = useCallback(async () => {
    if (user && user.type === UserType.ADMIN) {
      setLoading(true);
      try {
        const fetchedClients = await mockGetClientsForBarbershop(user.id);
        const clientsWithDetailsPromises = fetchedClients.map(async (client) => {
          if (!client.id) return { ...client, totalAppointments: 0 } as ClientWithDetails; // Should not happen with mock data
          const appointments = await mockGetAppointmentsForClientByBarbershop(client.id, user.id);
          const completedOrScheduledAppointments = appointments.filter(a => a.status === 'completed' || a.status === 'scheduled');
          completedOrScheduledAppointments.sort((a,b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());
          return {
            ...client,
            id: client.id, // ensure id is present
            totalAppointments: appointments.length,
            lastAppointmentDate: completedOrScheduledAppointments.length > 0 ? `${completedOrScheduledAppointments[0].date}T${completedOrScheduledAppointments[0].time}` : undefined,
          } as ClientWithDetails;
        });
        const clientsWithDetails = await Promise.all(clientsWithDetailsPromises);
        setClients(clientsWithDetails);
      } catch (error) {
        console.error("Error fetching clients:", error);
        // Add notification here
      } finally {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);
  
  const handleSelectClient = async (client: ClientWithDetails) => {
    setSelectedClient(client);
    setShowModal(true);
    setLoadingClientDetails(true);
    if(user && client.id) { // client.id should always be there
        try {
            const appointments = await mockGetAppointmentsForClientByBarbershop(client.id, user.id);
            appointments.sort((a,b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());
            setClientAppointments(appointments);
        } catch (error) {
            console.error("Error fetching client appointments:", error);
            setClientAppointments([]); // Clear on error
        }
    }
    setLoadingClientDetails(false);
  };

  const [showModal, setShowModal] = useState(false);
  const closeModal = () => {
      setShowModal(false);
      setSelectedClient(null);
      setClientAppointments([]);
  }

  const filteredClients = useMemo(() => {
    return clients.filter(client =>
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, '')) // Search phone numbers ignoring format
    ).sort((a, b) => (b.lastAppointmentDate || '0').localeCompare(a.lastAppointmentDate || '0')); // Sort by last appointment desc
  }, [clients, searchTerm]);

  if (loading && clients.length === 0) return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-primary-blue mb-6 sm:mb-8">Clientes da Barbearia</h1>
      
      <div className="mb-6">
        <Input 
          type="search"
          placeholder="Buscar por nome, email ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          containerClassName="max-w-md mb-0"
          leftIcon={<span className="material-icons-outlined">search</span>}
        />
      </div>

      {filteredClients.length === 0 && !loading ? (
         <div className="text-center py-10 bg-white shadow-md rounded-lg">
          <span className="material-icons-outlined text-6xl text-primary-blue/50 mb-4">person_search</span>
          <p className="text-xl text-gray-600 mb-4">Nenhum cliente encontrado.</p>
          <p className="text-sm text-gray-500">{searchTerm ? "Tente refinar sua busca." : "Seus clientes aparecerão aqui após o primeiro agendamento."}</p>
        </div>
      ) : (
        <div className="bg-white shadow-xl rounded-lg overflow-x-auto border border-light-blue">
          <table className="min-w-full leading-normal">
            <thead className="bg-primary-blue/10">
              <tr >
                <th className="px-4 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-primary-blue uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-primary-blue uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-primary-blue uppercase tracking-wider hidden md:table-cell">Telefone</th>
                <th className="px-4 py-3 border-b-2 border-gray-200 text-center text-xs font-semibold text-primary-blue uppercase tracking-wider hidden sm:table-cell">Agend.</th>
                <th className="px-4 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-primary-blue uppercase tracking-wider">Últ. Agend.</th>
                <th className="px-4 py-3 border-b-2 border-gray-200 text-right text-xs font-semibold text-primary-blue uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => (
                <ClientRow key={client.id} client={client} onSelectClient={handleSelectClient} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <Modal isOpen={showModal && !!selectedClient} onClose={closeModal} title={`Detalhes de ${selectedClient?.name || 'Cliente'}`} size="lg">
         {selectedClient && <ClientDetailModalContent client={selectedClient} appointments={clientAppointments} loadingDetails={loadingClientDetails} />}
      </Modal>
    </div>
  );
};

export default AdminClientsPage;