
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  colorScheme?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray' | 'teal' | 'orange';
  className?: string;
  // Fix: Specify a more precise type for the icon prop to allow className modification.
  icon?: React.ReactElement<{ className?: string }>;
  size?: 'xs' | 'sm';
}

const Badge: React.FC<BadgeProps> = ({ children, colorScheme = 'gray', className = '', icon, size = 'xs' }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800',
    gray: 'bg-neutral-200 text-neutral-800',
    teal: 'bg-teal-100 text-teal-800',
    orange: 'bg-orange-100 text-orange-800'
  };

  const sizeStyles = {
    xs: 'px-2 py-0.5 text-xs leading-5',
    sm: 'px-2.5 py-1 text-sm leading-5'
  }

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${colors[colorScheme]} ${sizeStyles[size]} ${className}`}
    >
      {icon && React.cloneElement(icon, { className: `mr-1.5 ${size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'}` })}
      {children}
    </span>
  );
};

export default Badge;