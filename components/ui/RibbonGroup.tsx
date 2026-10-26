import React from 'react';

interface RibbonGroupProps {
  title: string;
  children: React.ReactNode;
}

const RibbonGroup: React.FC<RibbonGroupProps> = ({ title, children }) => {
  return (
    <div className="flex flex-col items-center px-2 py-1 border-r border-neutral-300 last:border-r-0 h-full">
      <div className="flex space-x-1 items-end h-[60px]">
        {children}
      </div>
      <span className="text-xs text-neutral-600 mt-1">{title}</span>
    </div>
  );
};

export default RibbonGroup;
