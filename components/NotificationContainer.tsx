import React, { useEffect, useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { NotificationMessage } from '../types';

const NotificationItem: React.FC<{ notification: NotificationMessage, onDismiss: (id: string) => void }> = ({ notification, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setIsVisible(true);
  }, []);

  let bgColor = 'bg-gray-800';
  let textColor = 'text-white';
  let iconName = 'info';

  switch (notification.type) {
    case 'success':
      bgColor = 'bg-green-500';
      iconName = 'check_circle';
      break;
    case 'error':
      bgColor = 'bg-red-600';
      iconName = 'error';
      break;
    case 'warning':
      bgColor = 'bg-yellow-500';
      textColor = 'text-yellow-900';
      iconName = 'warning';
      break;
    case 'info':
      bgColor = 'bg-blue-500';
      iconName = 'info';
      break;
  }

  return (
    <div 
      className={`p-4 rounded-lg shadow-xl ${bgColor} ${textColor} mb-3 flex items-start transition-all duration-500 ease-out transform ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}
      role="alert"
      aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
    >
      <span className="material-icons-outlined mr-3 text-xl">{iconName}</span>
      <span className="flex-1 text-sm font-medium">{notification.message}</span>
      <button 
        onClick={() => {
          setIsVisible(false);
          // Wait for animation to complete before removing from DOM
          setTimeout(() => onDismiss(notification.id), 500);
        }} 
        className={`ml-3 text-lg font-bold ${textColor} hover:opacity-75 focus:outline-none`}
        aria-label="Fechar notificação"
      >
        &times;
      </button>
    </div>
  );
};

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-5 right-5 z-[1000] w-full max-w-sm space-y-0"> {/* Adjusted spacing */}
      {notifications.map(notification => (
        <NotificationItem key={notification.id} notification={notification} onDismiss={removeNotification} />
      ))}
    </div>
  );
};

export default NotificationContainer;