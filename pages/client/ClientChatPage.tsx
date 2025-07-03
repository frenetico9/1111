


import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ChatConversation, ChatMessage, UserType } from '../../types';
import {
  mockGetClientConversations,
  mockGetMessagesForChat,
  mockSendMessage,
  mockCreateOrGetConversation,
  mockDeleteChatForUser,
} from '../../services/mockApiService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useNotification } from '../../contexts/NotificationContext';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { formatDistance } from 'date-fns/formatDistance';
import { ptBR } from 'date-fns/locale/pt-BR';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { NAVALHA_LOGO_URL } from '../../constants';


const ConversationListItem: React.FC<{
  conversation: ChatConversation;
  isSelected: boolean;
  onClick: () => void;
  onDelete: (conversationId: string) => void;
}> = ({ conversation, isSelected, onClick, onDelete }) => {
  const bgColor = isSelected ? 'bg-light-blue' : 'bg-white hover:bg-gray-50';
  const formatLastMessageTime = (date?: string) => {
    if (!date) return '';
    try {
      const parsedDate = parseISO(date);
      if (isNaN(parsedDate.getTime())) {
        console.warn('Invalid date value received for formatting:', date);
        return '';
      }
      const formatOptions = { addSuffix: true, locale: ptBR };
      return formatDistance(parsedDate, new Date(), formatOptions);
    } catch (error) {
      console.error('Error formatting date in ConversationListItem:', error);
      return '';
    }
  };

  return (
    <div
      className={`group flex items-center p-3 cursor-pointer transition-colors duration-150 border-b border-light-blue ${bgColor}`}
      onClick={onClick}
    >
      <img
        src={conversation.barbershopLogoUrl || NAVALHA_LOGO_URL}
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
          {conversation.hasUnread && (
            <span className="w-2.5 h-2.5 bg-primary-blue rounded-full flex-shrink-0 mt-1"></span>
          )}
        </div>
      </div>
       <button
        onClick={(e) => {
            e.stopPropagation();
            onDelete(conversation.id);
        }}
        className="ml-2 p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors"
        title="Apagar conversa"
        aria-label="Apagar conversa"
      >
        <span className="material-icons-outlined text-lg">delete</span>
      </button>
    </div>
  );
};

const ChatBubble: React.FC<{ message: ChatMessage; isCurrentUser: boolean }> = ({ message, isCurrentUser }) => {
  const alignment = isCurrentUser ? 'justify-end' : 'justify-start';
  const bubbleColor = isCurrentUser ? 'bg-primary-blue text-white' : 'bg-gray-200 text-text-dark';
  const borderRadius = isCurrentUser ? 'rounded-br-none' : 'rounded-bl-none';
  
  const dateObj = parseISO(message.createdAt);
  const formattedTime = !isNaN(dateObj.getTime())
    ? format(dateObj, 'HH:mm')
    : '??:??';

  return (
    <div className={`flex ${alignment} mb-3`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl shadow-sm ${bubbleColor} ${borderRadius}`}>
        <p className="text-sm break-words">{message.content}</p>
        <p className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'} text-right`}>
          {formattedTime}
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(scrollToBottom, [messages]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConversations(true);
    try {
        const convos = await mockGetClientConversations(user.id);
        setConversations(convos);
    } catch (error) {
        console.error('Erro ao buscar conversas:', error);
        addNotification({ message: "Erro ao buscar conversas.", type: 'error' });
    } finally {
        setLoadingConversations(false);
    }
  }, [user, addNotification]);

  // Initial conversation list load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);
  
  // The click handler now only navigates. The URL is the single source of truth.
  const handleSelectConversation = (conversation: ChatConversation) => {
    // Prevent redundant navigation if the same chat is already selected
    if (barbershopIdFromUrl === conversation.barbershopId) {
      return;
    }
    navigate(`/client/chat/${conversation.barbershopId}`, { replace: true });
  };
  
  // This single useEffect hook now manages selecting, loading, and creating conversations
  // based on the `barbershopIdFromUrl` param. This simplifies logic and fixes state bugs.
  useEffect(() => {
    const processUrlAndSelectConversation = async () => {
      // Wait for user and the initial conversation list to be loaded.
      if (!user || loadingConversations) {
        return;
      }

      // If there's no barbershopId in the URL, clear the active chat view.
      if (!barbershopIdFromUrl) {
        setActiveConversation(null);
        setMessages([]);
        return;
      }

      let conversationToSelect = conversations.find(c => c.barbershopId === barbershopIdFromUrl);

      if (conversationToSelect) {
        // The conversation exists in our list. Select it if it's not already the active one.
        if (activeConversation?.id !== conversationToSelect.id) {
          setActiveConversation(conversationToSelect);
          setLoadingMessages(true);
          try {
            const fetchedMessages = await mockGetMessagesForChat(conversationToSelect.id, user.id, UserType.CLIENT);
            setMessages(fetchedMessages);
            // Mark as read locally and refresh the global count in the sidebar
            setConversations(prev => prev.map(c => c.id === conversationToSelect.id ? { ...c, hasUnread: false } : c));
            await refreshUnreadCount();
          } catch (error) {
            console.error('Erro ao carregar mensagens:', error);
            addNotification({ message: 'Erro ao carregar mensagens.', type: 'error' });
          } finally {
            setLoadingMessages(false);
          }
        }
      } else {
        // The conversation does not exist in the list, so we need to create it.
        setLoadingMessages(true); // Show loading state in the main chat panel
        try {
          // This service function creates the chat if it doesn't exist.
          await mockCreateOrGetConversation(user.id, barbershopIdFromUrl);
          // After creation, refetch the entire list to get the new conversation. This is
          // more robust than trying to manually add the new item to the state.
          await fetchConversations();
          // The useEffect will then run again with the updated list, `conversationToSelect`
          // will be found, and the chat will be loaded correctly.
        } catch (error) {
          console.error('Error creating or getting conversation:', error);
          addNotification({ message: 'Falha ao iniciar a conversa.', type: 'error' });
          navigate('/client/chat', { replace: true });
          setLoadingMessages(false);
        }
      }
    };

    processUrlAndSelectConversation();
    
  }, [barbershopIdFromUrl, user, conversations, loadingConversations, navigate, addNotification, fetchConversations, refreshUnreadCount, activeConversation?.id]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !user) return;
    setIsSending(true);
    try {
        const sentMessage = await mockSendMessage(activeConversation.id, user.id, UserType.CLIENT, newMessage.trim());
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
        fetchConversations(); // Refresh list to get last message update
        await refreshUnreadCount();
    } catch (error) {
        console.error('Falha ao enviar mensagem:', error);
        addNotification({ message: 'Falha ao enviar mensagem.', type: 'error' });
    } finally {
        setIsSending(false);
    }
  };
  
    const handleDeleteConversation = async (conversationId: string) => {
        if (!window.confirm("Tem certeza que deseja apagar esta conversa? Esta ação não pode ser desfeita e a conversa será removida apenas da sua visualização.")) {
            return;
        }
        try {
            await mockDeleteChatForUser(conversationId, UserType.CLIENT);
            addNotification({ message: "Conversa apagada com sucesso.", type: 'success' });

            setConversations(prev => prev.filter(c => c.id !== conversationId));
            if (activeConversation?.id === conversationId) {
                setActiveConversation(null);
                setMessages([]);
                navigate('/client/chat', { replace: true });
            }
            await refreshUnreadCount();
        } catch (error) {
            console.error("Erro ao apagar conversa:", error);
            addNotification({ message: "Erro ao apagar conversa.", type: 'error' });
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
                            onDelete={handleDeleteConversation}
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
                           <div className="flex items-center gap-1.5 bg-light-blue text-primary-blue px-3 py-1.5 rounded-lg text-sm font-medium">
                               <span className="material-icons-outlined text-base">phone</span>
                               <span>{activeConversation.barbershopPhone}</span>
                           </div>
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
                    {loadingMessages || (loadingConversations && barbershopIdFromUrl) ? <LoadingSpinner label="Carregando conversa..." /> : (
                         <>
                            <span className="material-icons-outlined text-6xl text-primary-blue/30 mb-4">chat</span>
                            <h3 className="text-xl font-semibold text-gray-600">Selecione uma conversa</h3>
                            <p className="text-sm text-gray-500 max-w-xs">Escolha uma conversa da lista ou encontre uma barbearia para iniciar um novo chat.</p>
                        </>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default ClientChatPage;
