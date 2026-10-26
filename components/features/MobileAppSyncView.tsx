
import React from 'react';
import { Project } from '../../types';
import { DevicePhoneMobileIcon } from '../../constants';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface MobileAppSyncViewProps {
  activeProject: Project | null;
}

const MobileAppSyncView: React.FC<MobileAppSyncViewProps> = ({ activeProject }) => {
  return (
    <div className="p-4 sm:p-6 bg-neutral-50 rounded-lg shadow-inner min-h-[calc(100vh-200px)] flex items-center justify-center">
      <Card className="w-full max-w-xl text-center">
        <DevicePhoneMobileIcon className="w-16 h-16 text-primary mx-auto mb-6" />
        <h2 className="text-3xl font-semibold text-primary-dark mb-3">
          Mobile Data Collection & Offline Sync
        </h2>
        {activeProject && (
          <p className="text-lg text-neutral-600 mb-1">
            For Project: <span className="font-semibold text-primary">{activeProject.name}</span>
          </p>
        )}
        <p className="text-md text-neutral-500 mb-8">
          Configure settings for mobile data collection, offline capabilities, and data synchronization. This feature is planned for a future update.
        </p>
        
        <div className="mb-6 p-4 border border-neutral-200 rounded-md bg-white">
            <p className="text-md font-medium text-neutral-700">Sync Status: <span className="text-yellow-600">Not Connected</span></p>
            <p className="text-sm text-neutral-500 mt-1">Last Sync: N/A</p>
        </div>

        <Button disabled>
          Configure Mobile App (Coming Soon)
        </Button>

        <ul className="mt-8 text-sm text-neutral-500 list-disc list-inside text-left space-y-1">
            <li>Download forms and project data for offline use on mobile devices.</li>
            <li>Collect data in the field without an internet connection.</li>
            <li>Sync collected data back to the server when online.</li>
        </ul>
      </Card>
    </div>
  );
};

export default MobileAppSyncView;
