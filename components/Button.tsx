import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  ...props
}) => {
  const baseStyle = 'font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out inline-flex items-center justify-center shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed';
  
  let variantStyle = '';
  switch (variant) {
    case 'primary':
      variantStyle = 'bg-primary-blue text-white hover:bg-primary-blue-dark focus:ring-primary-blue';
      break;
    case 'secondary':
      variantStyle = 'bg-gray-200 text-text-dark hover:bg-gray-300 focus:ring-gray-400';
      break;
    case 'danger':
      variantStyle = 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
      break;
    case 'outline':
      variantStyle = 'bg-transparent text-primary-blue border-2 border-primary-blue hover:bg-light-blue focus:ring-primary-blue';
      break;
    case 'ghost':
      variantStyle = 'bg-transparent text-primary-blue hover:bg-light-blue focus:ring-primary-blue shadow-none';
      break;
  }

  let sizeStyle = '';
  switch (size) {
    case 'sm':
      sizeStyle = 'px-4 py-2 text-sm';
      break;
    case 'md':
      sizeStyle = 'px-6 py-2.5 text-base';
      break;
    case 'lg':
      sizeStyle = 'px-8 py-3 text-lg';
      break;
  }
  
  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${widthStyle} ${isLoading ? 'opacity-75 cursor-not-allowed' : ''} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
      aria-live="polite"
      aria-busy={isLoading}
    >
      {isLoading && (
        <svg 
            className="animate-spin h-5 w-5 text-current" 
            style={leftIcon ? {marginRight: '0.5rem'} : rightIcon ? {marginLeft: '0.5rem'} : {}}
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
            role="status"
            aria-label="Carregando"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className="mr-2 inline-flex items-center">{leftIcon}</span>}
      {children}
      {rightIcon && !isLoading && <span className="ml-2 inline-flex items-center">{rightIcon}</span>}
    </button>
  );
};

export default Button;