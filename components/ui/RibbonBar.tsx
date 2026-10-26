import React from 'react';
import { RibbonTabConfig, RibbonTabId } from '../../types';
import RibbonTab from './RibbonTab';
import RibbonGroup from './RibbonGroup';
import RibbonButton from './RibbonButton';

interface RibbonBarProps {
  tabs: RibbonTabConfig[];
  activeTabId: RibbonTabId;
  onTabSelect: (tabId: RibbonTabId) => void;
}

const RibbonBar: React.FC<RibbonBarProps> = ({ tabs, activeTabId, onTabSelect }) => {
  const activeTabData = tabs.find(tab => tab.id === activeTabId);

  return (
    <div className="bg-neutral-200 shadow-md print:hidden">
      {/* Tabs Navigation */}
      <div className="flex border-b border-neutral-300 px-2">
        {tabs.map(tab => (
          <RibbonTab
            key={tab.id}
            title={tab.title}
            icon={tab.icon}
            isActive={tab.id === activeTabId}
            onClick={() => onTabSelect(tab.id)}
          />
        ))}
      </div>

      {/* Tab Content (Groups and Buttons) */}
      {activeTabData && (
        <div className="p-2 flex space-x-2 bg-white border-b border-neutral-300 min-h-[80px] items-start overflow-x-auto">
          {activeTabData.groups.map(group => (
            <RibbonGroup key={group.id} title={group.title}>
              {group.buttons.map(button => (
                <RibbonButton
                  key={button.id}
                  label={button.label}
                  icon={button.icon}
                  onClick={button.onClick}
                  disabled={button.disabled}
                />
              ))}
            </RibbonGroup>
          ))}
        </div>
      )}
    </div>
  );
};

export default RibbonBar;
