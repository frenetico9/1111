import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  leftIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, name, error, type = 'text', containerClassName = '', className = '', leftIcon, ...props }) => {
  const baseStyle = 'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors duration-150 ease-in-out shadow-sm';
  const errorStyle = 'border-red-500 focus:ring-red-400 focus:border-red-500';
  const normalStyle = 'border-gray-300 hover:border-gray-400 focus:ring-primary-blue focus:border-primary-blue';
  const disabledStyle = 'bg-gray-100 cursor-not-allowed opacity-70';

  const inputId = props.id || name;

  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-text-dark mb-1">{label}</label>}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          name={name}
          type={type}
          className={`${baseStyle} ${error ? errorStyle : normalStyle} ${props.disabled ? disabledStyle : ''} ${leftIcon ? 'pl-10' : ''} ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
      </div>
      {error && <p id={`${inputId}-error`} className="text-red-600 text-xs mt-1" role="alert">{error}</p>}
    </div>
  );
};

export default Input;