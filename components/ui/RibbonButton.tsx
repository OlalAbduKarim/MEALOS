import React from 'react';

interface RibbonButtonProps {
  label: string;
  icon?: React.ReactElement<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
}

const RibbonButton: React.FC<RibbonButtonProps> = ({ label, icon, onClick, disabled, tooltip }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative group flex flex-col items-center justify-center p-2 rounded hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-light focus:z-10 transition-colors duration-150
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={!tooltip ? label : undefined} // Use default title if no custom tooltip
    >
      {icon && <span className="mb-1">{React.cloneElement(icon, { className: `w-6 h-6 ${disabled ? 'text-neutral-400' : 'text-neutral-700'}` })}</span>}
      <span className={`text-xs text-center ${disabled ? 'text-neutral-500' : 'text-neutral-700'}`}>{label}</span>
      {tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20 pointer-events-none">
          {tooltip}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-neutral-800"></div> {/* Arrow */}
        </div>
      )}
    </button>
  );
};

export default RibbonButton;
