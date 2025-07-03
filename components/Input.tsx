import React, { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, DetailedHTMLProps } from 'react';

type AllInputProps = InputHTMLAttributes<HTMLInputElement> & TextareaHTMLAttributes<HTMLTextAreaElement> & SelectHTMLAttributes<HTMLSelectElement>;

interface InputProps extends Omit<AllInputProps, 'size'> {
  label?: string;
  error?: string;
  containerClassName?: string;
  leftIcon?: React.ReactNode;
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'search' | 'url' | 'date' | 'time' | 'textarea' | 'select';
  children?: React.ReactNode; // For select options
}

const Input: React.FC<InputProps> = ({ label, name, error, type = 'text', containerClassName = '', className = '', leftIcon, children, ...props }) => {
  const baseStyle = 'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors duration-150 ease-in-out shadow-sm';
  const errorStyle = 'border-red-500 focus:ring-red-400 focus:border-red-500';
  const normalStyle = 'border-gray-300 hover:border-gray-400 focus:ring-primary-blue focus:border-primary-blue dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-blue dark:focus:border-primary-blue';
  const disabledStyle = 'bg-gray-100 cursor-not-allowed opacity-70 dark:bg-gray-800';

  const inputId = props.id || name;

  const derivedInputMode = {
    email: 'email',
    tel: 'tel',
    number: 'numeric',
    search: 'search',
    url: 'url',
    decimal: 'decimal',
  }[type as string] as React.HTMLAttributes<HTMLInputElement>['inputMode'];
  
  const finalClassName = `${baseStyle} ${error ? errorStyle : normalStyle} ${props.disabled ? disabledStyle : ''} ${className}`;

  const renderInput = () => {
    if (type === 'textarea') {
      return <textarea id={inputId} name={name} className={finalClassName} {...props as TextareaHTMLAttributes<HTMLTextAreaElement>} />;
    }
    if (type === 'select') {
      return (
        <select id={inputId} name={name} className={finalClassName} {...props as SelectHTMLAttributes<HTMLSelectElement>}>
          {children}
        </select>
      );
    }
    return (
      <input
        id={inputId}
        name={name}
        type={type}
        inputMode={derivedInputMode}
        className={`${finalClassName} ${leftIcon ? 'pl-10' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props as InputHTMLAttributes<HTMLInputElement>}
      />
    );
  };

  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-text-dark dark:text-gray-300 mb-1">{label}</label>}
      <div className="relative">
        {leftIcon && type !== 'textarea' && type !== 'select' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {leftIcon}
          </div>
        )}
        {renderInput()}
      </div>
      {error && <p id={`${inputId}-error`} className="text-red-600 dark:text-red-500 text-xs mt-1" role="alert">{error}</p>}
    </div>
  );
};

export default Input;