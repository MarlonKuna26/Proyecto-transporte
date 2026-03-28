/**
 * Componente Card
 * Contenedor reutilizable para secciones
 */

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, title, description, className }) => {
  return (
    <div
      className={`
        bg-white rounded-lg shadow-md p-6 border border-gray-200
        hover:shadow-lg transition-shadow
        ${className}
      `}
    >
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>}
      {description && <p className="text-gray-600 text-sm mb-4">{description}</p>}
      {children}
    </div>
  );
};
