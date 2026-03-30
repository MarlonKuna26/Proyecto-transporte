/**
 * Componentes Reutilizables
 *
 * Estos componentes son agnósticos del dominio y pueden usarse en cualquier parte
 * de la aplicación (buttons, inputs, cards, layouts, etc.)
 */

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  className,
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 shadow-blue',
    secondary: 'bg-white text-navy-700 border border-primary-200 hover:bg-primary-50',
    success: 'bg-primary-600 text-white hover:bg-primary-700',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Si se proporciona className personalizado, usarlo; sino, usar variantClasses
  const baseClass = className || `${variantClasses[variant]} ${sizeClasses[size]}`;

  return (
    <button
      className={`
        rounded-xl font-semibold transition-all
        ${baseClass}
        ${loading || disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? 'Cargando...' : children}
    </button>
  );
};
