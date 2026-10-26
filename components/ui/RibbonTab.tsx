
import React from 'react';

interface RibbonTabProps {
  title: string;
  // Fix: Specify a more precise type for the icon prop to allow className modification.
  icon?: React.ReactElement<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
}

const RibbonTab: React.FC<RibbonTabProps> = ({ title, icon, isActive, onClick }) => {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 focus:outline-none transition-colors duration-150
        ${
          isActive
            ? 'border-primary text-primary bg-white'
            : 'border-transparent text-neutral-600 hover:text-primary hover:border-primary-light'
        }
      `}
    >
      {icon && <span className="mr-2">{React.cloneElement(icon, { className: `w-4 h-4 ${isActive ? 'text-primary' : 'text-neutral-500'}` })}</span>}
      {title}
    </button>
  );
};

export default RibbonTab;