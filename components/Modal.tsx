import React, { ReactNode, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'; // Added more sizes
  closeOnEscape?: boolean;
  closeOnClickOutside?: boolean;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer, 
  size = 'md',
  closeOnEscape = true,
  closeOnClickOutside = true
}) => {

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  let sizeClasses = '';
  switch (size) {
    case 'sm': sizeClasses = 'max-w-sm'; break;
    case 'md': sizeClasses = 'max-w-md'; break;
    case 'lg': sizeClasses = 'max-w-lg'; break;
    case 'xl': sizeClasses = 'max-w-xl'; break;
    case '2xl': sizeClasses = 'max-w-2xl'; break;
    case 'full': sizeClasses = 'max-w-full h-full sm:max-w-3/4 sm:h-auto sm:max-h-[90vh]'; break; // Example for full, adjust as needed
    default: sizeClasses = 'max-w-md';
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-[999] p-4 transition-opacity duration-300 ease-in-out"
      onClick={closeOnClickOutside ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className={`bg-white rounded-xl shadow-2xl w-full ${sizeClasses} flex flex-col max-h-[95vh] transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <header className="flex justify-between items-center p-5 border-b border-border-color">
          <h2 id="modal-title" className="text-xl font-semibold text-primary-blue">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-primary-blue text-2xl p-1 rounded-full hover:bg-light-blue transition-colors"
            aria-label="Fechar modal"
          >
            &times;
          </button>
        </header>
        <div className="p-5 overflow-y-auto flex-grow">
          {children}
        </div>
        {footer && (
          <footer className="p-5 border-t border-border-color flex justify-end space-x-3 bg-gray-50 rounded-b-xl">
            {footer}
          </footer>
        )}
      </div>
      <style>{`
        @keyframes modalShow {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-modalShow {
          animation: modalShow 0.2s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default Modal;