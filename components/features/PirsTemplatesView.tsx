
import React, { useState } from 'react';
import { PirsTemplate, PirsField } from '../../types';
import { DocumentDuplicateIcon } from '../../constants'; 
import Card from '../ui/Card';
import Button from '../ui/Button';
import Select from '../ui/Select'; 
import Badge from '../ui/Badge'; // Added missing import for Badge

// Helper function to create a basic ClipboardCopyIcon if it doesn't exist in constants
const ClipboardCopyFallbackIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375m7.5 0c.621 0 1.125.504 1.125 1.125v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75" />
  </svg>
);
// Use a general name for the icon that will be used.
// If ClipboardCopyIcon is ever added to constants.ts, this line could be:
// const ActualClipboardCopyIcon = ClipboardCopyIcon || ClipboardCopyFallbackIcon;
// For now, as it's not in constants, we directly use the fallback.
const ActualClipboardCopyIcon = ClipboardCopyFallbackIcon;


interface PirsTemplatesViewProps {
  pirsTemplates: PirsTemplate[];
}

const PirsTemplatesView: React.FC<PirsTemplatesViewProps> = ({ pirsTemplates }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(pirsTemplates.length > 0 ? pirsTemplates[0].id : '');
  const [copyStatus, setCopyStatus] = useState<string>('');

  const selectedTemplate = pirsTemplates.find(t => t.id === selectedTemplateId);

  const templateOptions = pirsTemplates.map(t => ({ value: t.id, label: t.name }));

  const handleCopyToClipboard = () => {
    if (!selectedTemplate) return;

    let textToCopy = `PIRS Template: ${selectedTemplate.name}\n`;
    textToCopy += `Description: ${selectedTemplate.description}\n`;
    textToCopy += `Category: ${selectedTemplate.category}\n\n`;
    textToCopy += "Fields:\n";

    selectedTemplate.fields.forEach(field => {
      textToCopy += `------------------------------------\n`;
      textToCopy += `Field: ${field.label}\n`;
      if (field.description) textToCopy += `Guidance: ${field.description}\n`;
      if (field.placeholder) textToCopy += `Example/Placeholder: ${field.placeholder}\n`;
      textToCopy += `Type: ${field.fieldType}\n`;
      if (field.required) textToCopy += `Required: Yes\n`;
    });
    textToCopy += `------------------------------------\n`;

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopyStatus('Copied to clipboard!');
        setTimeout(() => setCopyStatus(''), 2000);
      })
      .catch(err => {
        setCopyStatus('Failed to copy.');
        console.error('Failed to copy PIRS template to clipboard:', err);
      });
  };


  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-neutral-200">
        <h2 className="text-2xl font-semibold text-primary-dark mb-3 sm:mb-0 flex items-center">
          <DocumentDuplicateIcon className="w-7 h-7 mr-3 text-primary"/>
          PIRS Templates Library
        </h2>
        {pirsTemplates.length > 0 && (
           <div className="w-full sm:w-auto sm:min-w-[250px]">
             <Select
                aria-label="Select PIRS Template"
                options={templateOptions}
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
            />
           </div>
        )}
      </div>

      {pirsTemplates.length === 0 ? (
        <p className="text-neutral-600 text-center py-8">No PIRS templates available at the moment.</p>
      ) : !selectedTemplate ? (
        <p className="text-neutral-600 text-center py-8">Select a template to view its details.</p>
      ) : (
        <Card className="bg-neutral-50 shadow-inner">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-semibold text-primary-dark">{selectedTemplate.name}</h3>
              <p className="text-sm text-neutral-500 italic">{selectedTemplate.description}</p>
              <Badge colorScheme="teal" className="mt-1">{selectedTemplate.category}</Badge>
            </div>
            <Button onClick={handleCopyToClipboard} leftIcon={<ActualClipboardCopyIcon className="w-4 h-4" />} size="sm" variant="ghost">
              {copyStatus || 'Copy Structure'}
            </Button>
          </div>
          
          <div className="mt-6 space-y-5">
            <h4 className="text-md font-semibold text-neutral-700 mb-2">Template Fields:</h4>
            {selectedTemplate.fields.map(field => (
              <div key={field.id} className="p-3 border border-neutral-200 rounded-md bg-white">
                <label className="block text-sm font-medium text-neutral-800">{field.label} {field.required && <span className="text-red-500">*</span>}</label>
                {field.description && <p className="text-xs text-neutral-500 mt-0.5 mb-1">{field.description}</p>}
                <div className="flex items-center space-x-2 text-xs">
                    <span className="text-neutral-600">Type: <Badge colorScheme="blue" size="xs">{field.fieldType}</Badge></span>
                    {field.placeholder && <span className="text-neutral-500 italic">e.g., "{field.placeholder}"</span>}
                </div>

                {field.fieldType === 'select' && field.options && (
                     <div className="mt-2 text-xs">
                        <span className="font-medium text-neutral-700">Options: </span>
                        {field.options.map(opt => opt.label).join(', ')}
                    </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PirsTemplatesView;
