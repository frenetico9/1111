import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { mockGetConversationsForClient, mockGetMessagesForConversation, mockSendMessage } from '../../services/mockApiService';
import { Conversation, ChatMessage } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { ptBR } from 'date-fns/locale/pt-BR';
import { NAVALHA_LOGO_URL } from '../../constants';

const ConversationListItem: React.FC<{ conv: Conversation; isSelected: boolean; onClick: () => void }> = ({ conv, isSelected, onClick }) => (
    <div
        onClick={onClick}
        className={`p-3 flex items-center space-x-3 cursor-pointer rounded-lg transition-colors duration-150 border-l-4 ${isSelected ? 'bg-light-blue border-primary-blue' : 'border-transparent hover:bg-gray-100'}`}
    >
        <img src={conv.otherParty.avatarUrl || NAVALHA_LOGO_URL} alt={conv.otherParty.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0 bg-white" />
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
                <p className="font-semibold text-text-dark truncate">{conv.otherParty.name}</p>
                <span className="text-xs text-text-light flex-shrink-0 ml-2">{format(parseISO(conv.lastMessageTimestamp), 'HH:mm')}</span>
            </div>
            <div className="flex justify-between items-start">
                <p className="text-sm text-text-light truncate">{conv.lastMessage}</p>
                {conv.unreadCount > 0 && (
                    <span className="bg-primary-blue text-white text-xs font-bold rounded-full px-2 py-0.5 ml-2">{conv.unreadCount}</span>
                )}
            </div>
        </div>
    </div>
);

const ChatMessageBubble: React.FC<{ message: ChatMessage; isMe: boolean }> = ({ message, isMe }) => (
    <div className={`flex my-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div className={`p-3 rounded-2xl max-w-[80%] ${isMe ? 'bg-primary-blue text-white rounded-br-none' : 'bg-gray-200 text-text-dark rounded-bl-none'}`}>
            <p className="text-sm">{message.message}</p>
            <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-500'} text-right`}>
                {format(parseISO(message.createdAt), 'HH:mm')}
            </p>
        </div>
    </div>
);

const ClientChatPage: React.FC = () => {
    const { user } = useAuth();
    const { conversationId } = useParams<{ conversationId?: string }>();
    const navigate = useNavigate();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const selectedConversation = conversations.find(c => c.id === conversationId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchConversations = useCallback(async () => {
        if (user) {
            setLoadingConversations(true);
            try {
                const convs = await mockGetConversationsForClient(user.id);
                setConversations(convs);
            } catch (error) {
                console.error("Failed to fetch conversations", error);
            } finally {
                setLoadingConversations(false);
            }
        }
    }, [user]);

    const fetchMessages = useCallback(async () => {
        if (user && conversationId) {
            setLoadingMessages(true);
            try {
                const msgs = await mockGetMessagesForConversation(conversationId, user.id);
                setMessages(msgs);
                // After fetching, mark the conversation as read locally
                setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c));
            } catch (error) {
                console.error("Failed to fetch messages", error);
            } finally {
                setLoadingMessages(false);
            }
        }
    }, [user, conversationId]);

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 10000); // Poll for new conversations every 10s
        return () => clearInterval(interval);
    }, [fetchConversations]);

    useEffect(() => {
        if (conversationId) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 5000); // Poll for new messages every 5s
            return () => clearInterval(interval);
        } else {
            setMessages([]);
        }
    }, [conversationId, fetchMessages]);

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedConversation || !newMessage.trim()) return;

        setIsSending(true);
        try {
            await mockSendMessage({
                conversationId: selectedConversation.id,
                senderId: user.id,
                receiverId: selectedConversation.otherParty.id,
                message: newMessage.trim(),
            });
            setNewMessage('');
            await fetchMessages(); // Refetch immediately after sending
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setIsSending(false);
        }
    };

    const handleSelectConversation = (convId: string) => {
        navigate(`/client/chat/${convId}`);
    };

    return (
        <div className="flex h-[calc(100vh-100px)] bg-white rounded-lg shadow-xl border border-light-blue overflow-hidden">
            {/* Conversations List */}
            <div className={`w-full md:w-1/3 border-r border-light-blue flex-col ${conversationId && 'hidden md:flex'}`}>
                <div className="p-4 border-b border-light-blue">
                    <h1 className="text-xl font-bold text-primary-blue">Conversas</h1>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loadingConversations ? <LoadingSpinner label="Carregando..." /> : conversations.length === 0 ? (
                        <p className="p-4 text-center text-sm text-text-light">Nenhuma conversa encontrada.</p>
                    ) : (
                        conversations.map(conv => (
                            <ConversationListItem
                                key={conv.id}
                                conv={conv}
                                isSelected={conv.id === conversationId}
                                onClick={() => handleSelectConversation(conv.id)}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Chat View */}
            <div className={`w-full md:w-2/3 flex-col ${!conversationId && 'hidden md:flex'}`}>
                {selectedConversation ? (
                    <>
                        <div className="p-3 border-b border-light-blue flex items-center space-x-3">
                            <Button variant="ghost" className="md:hidden" onClick={() => navigate('/client/chat')}><span className="material-icons-outlined">arrow_back</span></Button>
                            <img src={selectedConversation.otherParty.avatarUrl || NAVALHA_LOGO_URL} alt={selectedConversation.otherParty.name} className="w-10 h-10 rounded-full object-cover bg-white" />
                            <div>
                                <p className="font-semibold text-text-dark">{selectedConversation.otherParty.name}</p>
                                {selectedConversation.otherParty.phone && (
                                    <a href={`tel:${selectedConversation.otherParty.phone}`} className="text-xs text-primary-blue hover:underline flex items-center">
                                       <span className="material-icons-outlined text-xs mr-1">phone</span> {selectedConversation.otherParty.phone}
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                            {loadingMessages ? <LoadingSpinner /> : (
                                <>
                                    {messages.map(msg => <ChatMessageBubble key={msg.id} message={msg} isMe={msg.senderId === user?.id} />)}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-light-blue bg-white">
                            <div className="flex items-center space-x-2">
                                <Input
                                    name="newMessage"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Digite sua mensagem..."
                                    containerClassName="flex-1 mb-0"
                                    disabled={isSending}
                                    autoComplete="off"
                                />
                                <Button type="submit" isLoading={isSending} disabled={!newMessage.trim()}>
                                    <span className="material-icons-outlined">send</span>
                                </Button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-text-light p-8">
                        <span className="material-icons-outlined text-6xl text-primary-blue/50 mb-4">chat</span>
                        <h2 className="text-xl font-semibold">Selecione uma conversa</h2>
                        <p>Escolha uma conversa na lista para ver as mensagens.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientChatPage;