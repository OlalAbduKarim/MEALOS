
import React from 'react';
import { Project } from '../../types';
import { DocumentDuplicateIcon } from '../../constants';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface FormTemplatesViewProps {
  activeProject: Project | null;
}

const MOCK_FORM_TEMPLATES = [
  { id: 'kap', name: 'KAP Survey Template', description: 'Knowledge, Attitudes, and Practices survey.' },
  { id: 'household', name: 'Household Interview Form', description: 'Standard household data collection.' },
  { id: 'checklist', name: 'Observation Checklist', description: 'For direct observation activities.' },
  { id: 'fgd_guide', name: 'Focus Group Discussion Guide', description: 'Template for FGDs.' },
];

const FormTemplatesView: React.FC<FormTemplatesViewProps> = ({ activeProject }) => {
  return (
    <div className="p-4 sm:p-6 bg-neutral-50 rounded-lg shadow-inner min-h-[calc(100vh-200px)]">
      <Card className="w-full">
        <div className="text-center mb-8">
            <DocumentDuplicateIcon className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-semibold text-primary-dark mb-3">
            Form Templates
            </h2>
            {activeProject && (
            <p className="text-lg text-neutral-600 mb-1">
                For Project: <span className="font-semibold text-primary">{activeProject.name}</span>
            </p>
            )}
            <p className="text-md text-neutral-500 max-w-xl mx-auto">
            Browse and utilize pre-defined templates for common data collection scenarios. This feature is under development.
            </p>
        </div>
        
        <div className="space-y-4">
            {MOCK_FORM_TEMPLATES.map(template => (
                 <Card key={template.id} className="bg-white hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div className="flex-grow">
                        <h3 className="text-lg font-semibold text-primary mb-1">{template.name}</h3>
                        <p className="text-sm text-neutral-600 mb-2">{template.description}</p>
                        </div>
                        <div className="mt-3 sm:mt-0 sm:ml-4 flex-shrink-0 space-x-2">
                            <Button size="sm" variant="ghost" disabled>Preview</Button>
                            <Button size="sm" disabled>Use Template</Button>
                        </div>
                    </div>
                 </Card>
            ))}
        </div>
         <p className="mt-8 text-xs text-neutral-400 text-center">
          Using a template will help you quickly set up forms for your project.
        </p>
      </Card>
    </div>
  );
};

export default FormTemplatesView;
