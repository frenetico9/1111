import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string; // Tailwind color class e.g. 'text-primary-blue'
  className?: string;
  fullPage?: boolean; // If true, centers it on the page
  label?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'text-primary-blue', 
  className = '',
  fullPage = false,
  label = 'Carregando...'
}) => {
  let sizeClasses = '';
  switch (size) {
    case 'xs': sizeClasses = 'h-4 w-4 border-2'; break;
    case 'sm': sizeClasses = 'h-6 w-6 border-2'; break;
    case 'md': sizeClasses = 'h-10 w-10 border-[3px]'; break;
    case 'lg': sizeClasses = 'h-16 w-16 border-4'; break;
    case 'xl': sizeClasses = 'h-20 w-20 border-4'; break;
  }

  const spinner = (
    <div 
      className={`animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${sizeClasses} ${color}`}
      role="status"
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        {label}
      </span>
    </div>
  );

  if (fullPage) {
    return (
      <div className={`fixed inset-0 flex flex-col justify-center items-center bg-white bg-opacity-75 z-[1000] ${className}`}>
        {spinner}
        {label && <p className={`mt-3 text-sm ${color}`}>{label}</p>}
      </div>
    );
  }

  return (
    <div className={`flex flex-col justify-center items-center ${className}`}>
      {spinner}
      {label && size !== 'xs' && size !== 'sm' && <p className={`mt-2 text-xs ${color}`}>{label}</p>}
    </div>
  );
};

export default LoadingSpinner;