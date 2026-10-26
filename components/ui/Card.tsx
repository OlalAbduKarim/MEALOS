import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
  footer?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick, title, footer }) => {
  const cardClasses = `bg-white shadow-lg rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl ${onClick ? 'cursor-pointer' : ''} ${className}`;

  return (
    <div className={cardClasses} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}>
      {title && (
        <div className="p-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-primary-dark">{title}</h3>
        </div>
      )}
      <div className="p-4 sm:p-6">
        {children}
      </div>
      {footer && (
        <div className="p-4 border-t border-neutral-200 bg-neutral-50">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
