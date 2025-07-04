

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
import { format, parseISO, formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import Button from '../../components/Button';
import Input from '../../components/Input';


const ConversationListItem: React.FC<{
  conversation: ChatConversation;
  isSelected: boolean;
  onClick: () => void;
  onDelete: (conversationId: string) => void;
}> = ({ conversation, isSelected, onClick, onDelete }) => {
  const bgColor = isSelected ? 'bg-light-blue dark:bg-primary-blue/30' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700';
  const formatLastMessageTime = (date?: string) => {
    if (!date) return '';
    try {
      const parsedDate = parseISO(date);
      return formatDistance(parsedDate, new Date(), { addSuffix: true, locale: ptBR });
    } catch (error) {
      return '';
    }
  };

  return (
    <div className={`group flex items-center p-3 cursor-pointer transition-colors duration-150 border-b border-light-blue dark:border-gray-700 ${bgColor}`} onClick={onClick}>
      <img
        src={conversation.barbershopLogoUrl || 'https://i.imgur.com/OViX73g.png'}
        alt={`${conversation.barbershopName} logo`}
        className="w-12 h-12 rounded-full mr-3 object-cover flex-shrink-0"
      />
      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-sm text-text-dark dark:text-gray-200 truncate">{conversation.barbershopName}</h4>
          <span className="text-xs text-text-light dark:text-gray-400 flex-shrink-0 ml-2">{formatLastMessageTime(conversation.lastMessageAt)}</span>
        </div>
        <div className="flex justify-between items-start">
          <p className="text-xs text-text-light dark:text-gray-400 truncate pr-2">{conversation.lastMessage || 'Nenhuma mensagem ainda.'}</p>
          {conversation.hasUnread && (
            <span className="w-2.5 h-2.5 bg-primary-blue rounded-full flex-shrink-0 mt-1"></span>
          )}
        </div>
      </div>
       <button
        onClick={(e) => { e.stopPropagation(); onDelete(conversation.id); }}
        className="ml-2 p-1.5 rounded-full text-gray-400 dark:text-gray-500 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/50 transition-colors opacity-0 group-hover:opacity-100"
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
  const bubbleColor = isCurrentUser ? 'bg-primary-blue text-white' : 'bg-gray-200 dark:bg-gray-700 text-text-dark dark:text-gray-200';
  const borderRadius = isCurrentUser ? 'rounded-br-none' : 'rounded-bl-none';
  
  const formattedTime = message.createdAt ? format(parseISO(message.createdAt), 'HH:mm') : '...';

  return (
    <div className={`flex ${alignment} mb-3`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl shadow-sm ${bubbleColor} ${borderRadius}`}>
        <p className="text-sm break-words">{message.content}</p>
        <p className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-200 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'} text-right`}>
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
  
  const loadAndSetConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConversations(true);
    try {
      const convos = await mockGetClientConversations(user.id);
      setConversations(convos);
    } catch (error) {
      addNotification({ message: "Erro ao buscar conversas.", type: 'error' });
    } finally {
      setLoadingConversations(false);
    }
  }, [user, addNotification]);

  useEffect(() => {
    loadAndSetConversations();
  }, [loadAndSetConversations]);
  
  useEffect(() => {
    const selectConversationFromUrl = async () => {
      if (!user || loadingConversations) return;

      if (!barbershopIdFromUrl) {
        setActiveConversation(null);
        setMessages([]);
        return;
      }
      
      if (activeConversation?.barbershopId === barbershopIdFromUrl) return;

      setLoadingMessages(true);
      setActiveConversation(null); // Clear previous conversation while loading
      setMessages([]);

      try {
        let convoToSelect = conversations.find(c => c.barbershopId === barbershopIdFromUrl);

        if (!convoToSelect) {
            convoToSelect = await mockCreateOrGetConversation(user.id, barbershopIdFromUrl);
            setConversations(prev => [convoToSelect!, ...prev.filter(p => p.id !== convoToSelect!.id)]);
        }
        
        setActiveConversation(convoToSelect);
        const fetchedMessages = await mockGetMessagesForChat(convoToSelect.id, user.id, UserType.CLIENT);
        setMessages(fetchedMessages);

        if (convoToSelect.hasUnread) {
          setConversations(prev => prev.map(c => c.id === convoToSelect.id ? { ...c, hasUnread: false } : c));
          await refreshUnreadCount();
        }
      } catch (error) {
        addNotification({ message: (error as Error).message || "Falha ao carregar a conversa.", type: "error" });
        navigate('/client/chat', { replace: true });
      } finally {
        setLoadingMessages(false);
      }
    };

    selectConversationFromUrl();
  }, [user, barbershopIdFromUrl, conversations, loadingConversations, addNotification, navigate, refreshUnreadCount, activeConversation]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !user || isSending) return;

    setIsSending(true);
    const tempMessageId = `temp_${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempMessageId,
      chatId: activeConversation.id,
      senderId: user.id,
      senderType: UserType.CLIENT,
      content: newMessage.trim(),
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    
    try {
        const sentMessage = await mockSendMessage(activeConversation.id, user.id, UserType.CLIENT, optimisticMessage.content);
        setMessages(prev => prev.map(msg => msg.id === tempMessageId ? sentMessage : msg));
        
        // Optimistically update conversation list
        setConversations(prev => {
            const updatedConvo = { ...activeConversation, lastMessage: sentMessage.content, lastMessageAt: sentMessage.createdAt, hasUnread: false };
            return [updatedConvo, ...prev.filter(c => c.id !== activeConversation.id)];
        });
        await refreshUnreadCount();

    } catch (error) {
        addNotification({ message: 'Falha ao enviar mensagem.', type: 'error' });
        setMessages(prev => prev.filter(msg => msg.id !== tempMessageId)); // Revert optimistic update
    } finally {
        setIsSending(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!window.confirm("Tem certeza que deseja apagar esta conversa? Ela será removida apenas da sua visualização.")) return;
    try {
        await mockDeleteChatForUser(conversationId, UserType.CLIENT);
        addNotification({ message: "Conversa apagada com sucesso.", type: 'success' });
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        if (activeConversation?.id === conversationId) {
            navigate('/client/chat', { replace: true });
        }
        await refreshUnreadCount();
    } catch (error) {
        addNotification({ message: "Erro ao apagar conversa.", type: 'error' });
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-gray-800/50 rounded-lg shadow-xl border border-light-blue dark:border-gray-700 overflow-hidden">
        <div className="w-full md:w-1/3 border-r border-light-blue dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-light-blue dark:border-gray-700">
                <h2 className="text-xl font-bold text-primary-blue">Conversas</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {loadingConversations ? <LoadingSpinner /> : conversations.length > 0 ? (
                    conversations.map(convo => (
                        <ConversationListItem
                            key={convo.id}
                            conversation={convo}
                            isSelected={activeConversation?.id === convo.id}
                            onClick={() => navigate(`/client/chat/${convo.barbershopId}`)}
                            onDelete={handleDeleteConversation}
                        />
                    ))
                ) : (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">Nenhuma conversa encontrada.</div>
                )}
            </div>
        </div>

        <div className="w-full md:w-2/3 flex flex-col">
            {loadingMessages ? <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div> : (
              activeConversation ? (
                  <>
                      <div className="p-4 border-b border-light-blue dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                          <h3 className="font-semibold text-text-dark dark:text-gray-200">{activeConversation.barbershopName}</h3>
                      </div>
                      <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50 dark:bg-dark-bg">
                          {messages.map(msg => (
                              <ChatBubble key={msg.id} message={msg} isCurrentUser={msg.senderType === 'client'} />
                          ))}
                          <div ref={messagesEndRef} />
                      </div>
                      <div className="p-4 bg-white dark:bg-gray-900 border-t border-light-blue dark:border-gray-700">
                          <form onSubmit={handleSendMessage} className="flex gap-2">
                              <Input containerClassName="flex-grow mb-0" name="newMessage" placeholder="Digite sua mensagem..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} disabled={isSending} autoComplete="off" />
                              <Button type="submit" isLoading={isSending} disabled={!newMessage.trim()} rightIcon={<span className="material-icons-outlined">send</span>}>
                                  Enviar
                              </Button>
                          </form>
                      </div>
                  </>
              ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 dark:bg-dark-bg">
                        <span className="material-icons-outlined text-6xl text-primary-blue/30 mb-4">chat</span>
                        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300">Selecione uma conversa</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">Escolha uma conversa da lista ou encontre uma barbearia para iniciar um novo chat.</p>
                   </div>
              )
            )}
        </div>
    </div>
  );
};

export default ClientChatPage;
