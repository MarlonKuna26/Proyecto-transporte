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
        bg-white rounded-2xl shadow-card p-6 border border-primary-100
        hover:shadow-card-hover transition-shadow
        ${className}
      `}
    >
      {title && <h3 className="text-lg font-semibold text-navy-900 mb-2">{title}</h3>}
      {description && <p className="text-dark-500 text-sm mb-4">{description}</p>}
      {children}
    </div>
  );
};
