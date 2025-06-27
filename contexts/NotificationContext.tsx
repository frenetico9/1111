import React, { createContext, useState, useCallback, ReactNode, useContext } from 'react';
import { NotificationMessage } from '../types';

interface NotificationContextType {
  notifications: NotificationMessage[];
  addNotification: (notification: Omit<NotificationMessage, 'id'>) => void;
  removeNotification: (id: string) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((notification: Omit<NotificationMessage, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { ...notification, id }]);
    
    setTimeout(() => {
      removeNotification(id);
    }, 5000); // Auto-remove after 5 seconds
  }, [removeNotification]);


  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
  }
  return context;
};