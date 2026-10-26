import React from 'react';
import { BriefcaseIcon, LightBulbIcon } from '../constants'; // Using existing icons for variety

interface PlaceholderFeatureViewProps {
  featureName: string;
  activeProjectName?: string;
}

const PlaceholderFeatureView: React.FC<PlaceholderFeatureViewProps> = ({ featureName, activeProjectName }) => {
  const formattedFeatureName = featureName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-white rounded-lg shadow-md text-center">
      {featureName.includes('dashboard') || featureName.includes('report') ? (
         <BriefcaseIcon className="w-16 h-16 text-primary-light mb-6" />
      ) : (
         <LightBulbIcon className="w-16 h-16 text-secondary mb-6" />
      )}
      <h2 className="text-3xl font-semibold text-primary-dark mb-3">
        {formattedFeatureName}
      </h2>
      {activeProjectName && (
        <p className="text-lg text-neutral-600 mb-1">
          For Project: <span className="font-semibold text-primary">{activeProjectName}</span>
        </p>
      )}
      <p className="text-md text-neutral-500 mb-8">
        This feature is currently under development and will be available soon.
      </p>
      <div className="animate-pulse">
        <div className="w-48 h-4 bg-neutral-200 rounded-md mb-2"></div>
        <div className="w-64 h-4 bg-neutral-200 rounded-md"></div>
      </div>
      <p className="mt-8 text-sm text-neutral-400">
        Thank you for your patience as we enhance the M&amp;E Indicator Tracker.
      </p>
    </div>
  );
};

export default PlaceholderFeatureView;
