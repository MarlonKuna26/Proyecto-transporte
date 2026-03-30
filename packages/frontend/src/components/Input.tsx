/**
 * Componente Input
 * Componente reutilizable para formularios
 */

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  id,
  className,
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-navy-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          w-full px-3 py-2 border border-primary-200 rounded-xl
          focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500
          transition-all text-navy-900 bg-white
          ${error ? 'border-red-400 focus:ring-red-500/40' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      {helper && <p className="mt-1 text-sm text-dark-400">{helper}</p>}
    </div>
  );
};
