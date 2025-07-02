import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ChatConversation, ChatMessage, UserType } from '../../types';
import {
  mockGetAdminConversations,
  mockGetMessagesForChat,
  mockSendMessage,
  mockCreateOrGetChat,
} from '../../services/mockApiService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useNotification } from '../../contexts/NotificationContext';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { formatDistance } from 'date-fns/formatDistance';
import { ptBR } from 'date-fns/locale/pt-BR';
import Button from '../../components/Button';
import Input from '../../components/Input';


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
      if (isNaN(parsedDate.getTime())) {
        console.warn('Invalid date value received for formatting:', date);
        return '';
      }
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
      <div className="w-12 h-12 rounded-full mr-3 bg-gray-200 flex items-center justify-center text-primary-blue text-lg font-bold flex-shrink-0">
        {conversation.clientName.charAt(0)}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-sm text-text-dark truncate">{conversation.clientName}</h4>
          <span className="text-xs text-text-light flex-shrink-0 ml-2">{formatLastMessageTime(conversation.lastMessageAt)}</span>
        </div>
        <div className="flex justify-between items-start">
          <p className="text-xs text-text-light truncate pr-2">{conversation.lastMessage || 'Nenhuma mensagem ainda.'}</p>
          {conversation.hasUnread && (
            <span className="w-2.5 h-2.5 bg-primary-blue rounded-full flex-shrink-0 mt-1"></span>
          )}
        </div>
      </div>
    </div>
  );
};

const ChatBubble: React.FC<{ message: ChatMessage; isCurrentUser: boolean }> = ({ message, isCurrentUser }) => {
  const alignment = isCurrentUser ? 'justify-end' : 'justify-start';
  const bubbleColor = isCurrentUser ? 'bg-primary-blue text-white' : 'bg-gray-200 text-text-dark';
  const borderRadius = isCurrentUser ? 'rounded-br-none' : 'rounded-bl-none';

  const formattedTime = new Date(message.createdAt).toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  });

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

const AdminChatPage: React.FC = () => {
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const { clientId: clientIdFromUrl } = useParams<{ clientId?: string }>();
    const navigate = useNavigate();
    
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');

    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const fetchConversations = useCallback(async () => {
        if (!user) return;
        setLoadingConversations(true);
        try {
            const convos = await mockGetAdminConversations(user.id);
            setConversations(convos);
        } catch (error) {
            console.error('Erro ao buscar conversas:', error);
            addNotification({ message: "Erro ao buscar conversas.", type: 'error' });
        } finally {
            setLoadingConversations(false);
        }
    }, [user, addNotification]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);
    
    const handleSelectConversation = useCallback(async (conversation: ChatConversation) => {
        if (!user || activeConversation?.id === conversation.id) return;
        
        navigate(`/admin/chat/${conversation.clientId}`, { replace: true });
        setActiveConversation(conversation);
        setLoadingMessages(true);
        try {
            const fetchedMessages = await mockGetMessagesForChat(conversation.id, user.id, UserType.ADMIN);
            setMessages(fetchedMessages);
            // Mark as read locally
            setConversations(prev => prev.map(c => c.id === conversation.id ? { ...c, hasUnread: false } : c));
        } catch (error) {
            console.error('Erro ao carregar mensagens:', error);
            addNotification({ message: 'Erro ao carregar mensagens.', type: 'error' });
        } finally {
            setLoadingMessages(false);
        }
    }, [user, navigate, addNotification, activeConversation]);


    useEffect(() => {
        if (clientIdFromUrl && conversations.length > 0) {
            const convoToSelect = conversations.find(c => c.clientId === clientIdFromUrl);
            if (convoToSelect && convoToSelect.id !== activeConversation?.id) {
                handleSelectConversation(convoToSelect);
            }
        }
    }, [clientIdFromUrl, conversations, handleSelectConversation, activeConversation]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation || !user) return;

        setIsSending(true);
        try {
            const sentMessage = await mockSendMessage(activeConversation.id, user.id, UserType.ADMIN, newMessage.trim());
            setMessages(prev => [...prev, sentMessage]);
            setNewMessage('');
            // Update conversation list
            fetchConversations();
        } catch (error) {
            console.error('Falha ao enviar mensagem:', error);
            addNotification({ message: 'Falha ao enviar mensagem.', type: 'error' });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-120px)] bg-white rounded-lg shadow-xl border border-light-blue overflow-hidden">
            {/* Conversations List */}
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

            {/* Active Chat Window */}
            <div className="w-2/3 flex flex-col">
                {activeConversation ? (
                    <>
                        <div className="p-4 border-b border-light-blue flex justify-between items-center bg-gray-50">
                            <h3 className="font-semibold text-text-dark">{activeConversation.clientName}</h3>
                            {activeConversation.clientPhone && (
                                <a 
                                    href={`tel:${activeConversation.clientPhone.replace(/\D/g, '')}`} 
                                    className="text-primary-blue hover:text-primary-blue-dark transition-colors p-2 rounded-full hover:bg-light-blue"
                                    aria-label={`Ligar para ${activeConversation.clientName}`}
                                    title={`Ligar para ${activeConversation.clientPhone}`}
                                >
                                    <span className="material-icons-outlined">call</span>
                                </a>
                            )}
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50">
                            {loadingMessages ? <LoadingSpinner /> : (
                                messages.map(msg => (
                                    <ChatBubble key={msg.id} message={msg} isCurrentUser={msg.senderType === 'admin'} />
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
                        <p className="text-sm text-gray-500 max-w-xs">Escolha uma conversa da lista à esquerda para ver as mensagens e responder.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminChatPage;
