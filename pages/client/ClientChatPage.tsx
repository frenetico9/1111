import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ChatConversation, ChatMessage, UserType } from '../../types';
import {
  mockGetClientConversations,
  mockGetMessagesForChat,
  mockSendMessage,
  mockCreateOrGetChat,
  mockGetBarbershopProfile,
} from '../../services/mockApiService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useNotification } from '../../contexts/NotificationContext';
import { formatDistance } from 'date-fns/formatDistance';
import { parseISO } from 'date-fns/parseISO';
import { ptBR } from 'date-fns/locale/pt-BR';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';


const ConversationListItem: React.FC<{
  conversation: ChatConversation;
  isSelected: boolean;
  onClick: () => void;
}> = ({ conversation, isSelected, onClick }) => {
  const bgColor = isSelected ? 'bg-light-blue' : 'bg-white hover:bg-gray-50';
  const formatLastMessageTime = (date?: string) => {
    if (!date) return '';
    try {
      const parsedDate = parseISO(date);
      // Fix for potential TypeScript typing issue with date-fns locale
      const formatOptions = { addSuffix: true, locale: ptBR };
      return formatDistance(parsedDate, new Date(), formatOptions);
    } catch (error) {
      console.error('Error formatting date in ConversationListItem:', error);
      return '';
    }
  };

  return (
    <div
      className={`flex items-center p-3 cursor-pointer transition-colors duration-150 border-b border-light-blue ${bgColor}`}
      onClick={onClick}
    >
      <img
        src={conversation.barbershopLogoUrl || 'https://i.imgur.com/OViX73g.png'}
        alt={`${conversation.barbershopName} logo`}
        className="w-12 h-12 rounded-full mr-3 object-cover flex-shrink-0"
      />
      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-sm text-text-dark truncate">{conversation.barbershopName}</h4>
          <span className="text-xs text-text-light flex-shrink-0 ml-2">{formatLastMessageTime(conversation.lastMessageAt)}</span>
        </div>
        <div className="flex justify-between items-start">
          <p className="text-xs text-text-light truncate pr-2">{conversation.lastMessage || 'Nenhuma mensagem ainda.'}</p>
          {conversation.unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
               {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const formatMessageTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      console.error("Failed to format message time:", e);
      return '--:--';
    }
};

const ChatBubble: React.FC<{ message: ChatMessage; isCurrentUser: boolean }> = ({ message, isCurrentUser }) => {
  const alignment = isCurrentUser ? 'justify-end' : 'justify-start';
  const bubbleColor = isCurrentUser ? 'bg-primary-blue text-white' : 'bg-gray-200 text-text-dark';
  const borderRadius = isCurrentUser ? 'rounded-br-none' : 'rounded-bl-none';

  return (
    <div className={`flex ${alignment} mb-3`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl shadow-sm ${bubbleColor} ${borderRadius}`}>
        <p className="text-sm break-words">{message.content}</p>
        <p className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'} text-right`}>
          {formatMessageTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
};


const ClientChatPage: React.FC = () => {
  const { user, refreshUnreadCount } = useAuth();
  const { addNotification } = useNotification();
  const { barbershopId: barbershopIdFromUrl } = useParams<{ barbershopId?: string }>();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(scrollToBottom, [messages]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConversations(true);
    try {
        const convos = await mockGetClientConversations(user.id);
        setConversations(convos);
        refreshUnreadCount();
    } catch (error) {
        console.error('Erro ao buscar conversas:', error);
        addNotification({ message: "Erro ao buscar conversas.", type: 'error' });
    } finally {
        setLoadingConversations(false);
    }
  }, [user, addNotification, refreshUnreadCount]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleSelectConversation = useCallback(async (conversation: ChatConversation) => {
    if (!user || activeConversation?.id === conversation.id) return;

    navigate(`/client/chat/${conversation.barbershopId}`, { replace: true });
    setActiveConversation(conversation);
    setLoadingMessages(true);
    try {
        const fetchedMessages = await mockGetMessagesForChat(conversation.id, user.id, UserType.CLIENT);
        setMessages(fetchedMessages);
        await fetchConversations(); // Refreshes all counts
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
        addNotification({ message: 'Erro ao carregar mensagens.', type: 'error' });
    } finally {
        setLoadingMessages(false);
    }
  }, [user, navigate, addNotification, activeConversation, fetchConversations]);

  const initiateNewConversation = useCallback(async (barbershopId: string) => {
    if (!user) return;
    setLoadingMessages(true);
    try {
        const profile = await mockGetBarbershopProfile(barbershopId);
        if (!profile) {
            addNotification({ message: 'Barbearia não encontrada.', type: 'error' });
            navigate('/client/chat');
            return;
        }
        const chatId = await mockCreateOrGetChat(user.id, barbershopId);
        if (!chatId) {
            throw new Error("Não foi possível criar ou obter o chat.");
        }
        
        await fetchConversations();
        
        const newConvo: ChatConversation = {
            id: chatId,
            clientId: user.id,
            clientName: user.name || '',
            barbershopId: profile.id,
            barbershopName: profile.name,
            barbershopLogoUrl: profile.logoUrl,
            barbershopPhone: profile.phone,
            lastMessageAt: new Date().toISOString(),
            unreadCount: 0,
        };
        setActiveConversation(newConvo);
        const existingMessages = await mockGetMessagesForChat(chatId, user.id, UserType.CLIENT);
        setMessages(existingMessages);
    } catch (error) {
        console.error("Erro ao iniciar nova conversa:", error);
        addNotification({ message: "Erro ao iniciar nova conversa.", type: 'error' });
    } finally {
        setLoadingMessages(false);
    }
  }, [user, addNotification, navigate, fetchConversations]);

  useEffect(() => {
    if (barbershopIdFromUrl && user) {
        if (loadingConversations) return; // Wait until conversations are loaded
        const existingConvo = conversations.find(c => c.barbershopId === barbershopIdFromUrl);
        if (existingConvo) {
            if (activeConversation?.id !== existingConvo.id) {
                handleSelectConversation(existingConvo);
            }
        } else {
            initiateNewConversation(barbershopIdFromUrl);
        }
    }
  }, [barbershopIdFromUrl, user, conversations, loadingConversations, handleSelectConversation, initiateNewConversation, activeConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !user) return;
    setIsSending(true);
    try {
        const sentMessage = await mockSendMessage(activeConversation.id, user.id, UserType.CLIENT, newMessage.trim());
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
        // Update conversation list with new last message and timestamp
        setConversations(prev => prev.map(c => 
            c.id === activeConversation.id 
            ? { ...c, lastMessage: sentMessage.content, lastMessageAt: sentMessage.createdAt }
            : c
        ).sort((a,b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()));

    } catch (error) {
        console.error('Falha ao enviar mensagem:', error);
        addNotification({ message: 'Falha ao enviar mensagem.', type: 'error' });
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-lg shadow-xl border border-light-blue overflow-hidden">
        <div className="w-1/3 border-r border-light-blue flex flex-col">
            <div className="p-4 border-b border-light-blue">
                <h2 className="text-xl font-bold text-primary-blue">Conversas</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {loadingConversations ? <LoadingSpinner /> : conversations.length > 0 ? (
                    conversations.map(convo => (
                        <ConversationListItem
                            key={convo.id}
                            conversation={convo}
                            isSelected={activeConversation?.id === convo.id}
                            onClick={() => handleSelectConversation(convo)}
                        />
                    ))
                ) : (
                    <div className="p-4 text-center text-sm text-gray-500">Nenhuma conversa encontrada.</div>
                )}
            </div>
        </div>

        <div className="w-2/3 flex flex-col">
            {activeConversation ? (
                <>
                    <div className="p-4 border-b border-light-blue flex justify-between items-center bg-gray-50">
                        <h3 className="font-semibold text-text-dark">{activeConversation.barbershopName}</h3>
                        {activeConversation.barbershopPhone && (
                           <button
                                onClick={() => setShowCallModal(true)}
                                className="text-primary-blue hover:text-primary-blue-dark transition-colors p-2 rounded-full hover:bg-light-blue"
                                aria-label={`Ligar para ${activeConversation.barbershopName}`}
                                title={`Ligar para ${activeConversation.barbershopPhone}`}
                            >
                                <span className="material-icons-outlined">call</span>
                            </button>
                        )}
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50">
                        {loadingMessages ? <LoadingSpinner /> : (
                            messages.map(msg => (
                                <ChatBubble key={msg.id} message={msg} isCurrentUser={msg.senderType === 'client'} />
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 bg-white border-t border-light-blue">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <Input
                                containerClassName="flex-grow mb-0"
                                name="newMessage"
                                placeholder="Digite sua mensagem..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                disabled={isSending}
                                autoComplete="off"
                            />
                            <Button type="submit" isLoading={isSending} disabled={!newMessage.trim()} rightIcon={<span className="material-icons-outlined">send</span>}>
                                Enviar
                            </Button>
                        </form>
                    </div>
                </>
            ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50">
                    <span className="material-icons-outlined text-6xl text-primary-blue/30 mb-4">chat</span>
                    <h3 className="text-xl font-semibold text-gray-600">Selecione uma conversa</h3>
                    <p className="text-sm text-gray-500 max-w-xs">Escolha uma conversa da lista ou encontre uma barbearia para iniciar um novo chat.</p>
                </div>
            )}
        </div>
        {activeConversation && (
            <Modal isOpen={showCallModal} onClose={() => setShowCallModal(false)} title="Informações de Contato" size="sm">
                <div className="text-center">
                    <p className="text-sm text-text-light mb-1">Telefone de</p>
                    <p className="font-bold text-lg text-primary-blue mb-4">{activeConversation.barbershopName}</p>
                    <p className="text-2xl font-semibold bg-light-blue p-3 rounded-lg text-text-dark">{activeConversation.barbershopPhone}</p>
                    <a href={`tel:${activeConversation.barbershopPhone?.replace(/\D/g, '')}`}>
                        <Button fullWidth className="mt-6">Ligar Agora</Button>
                    </a>
                </div>
            </Modal>
        )}
    </div>
  );
};

export default ClientChatPage;
