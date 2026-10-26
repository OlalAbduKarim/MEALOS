
import React, { useState, useEffect } from 'react';
import { Project, TheoryOfChangeFramework } from '../../types';
import { LightBulbIcon } from '../../constants';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';

interface TheoryOfChangeVisualizerProps {
  activeProject: Project | null;
  frameworkData: TheoryOfChangeFramework | null;
  onSaveFramework: (data: TheoryOfChangeFramework) => Promise<void>;
  isLoading: boolean;
}

const TocElementDisplay: React.FC<{ title: string; content: string; color: string; textColor?: string }> = ({ title, content, color, textColor = "text-neutral-800" }) => (
  <div className={`p-3 rounded-lg shadow-md min-h-[120px] ${color} ${textColor} flex-1 flex flex-col`}>
    <h3 className="font-semibold text-sm text-center mb-2">{title}</h3>
    {content.trim() ? (
      <ul className="text-xs list-disc list-inside space-y-1 flex-grow">
        {content.split('\n').map((item, index) => item.trim() && <li key={index}>{item.trim()}</li>)}
      </ul>
    ) : (
      <p className="text-xs italic text-center mt-auto">No {title.toLowerCase()} defined.</p>
    )}
  </div>
);

const ArrowConnector: React.FC = () => (
  <div className="flex items-center justify-center text-primary-light my-2 md:my-0 md:mx-2">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 md:w-10 md:h-10 transform md:rotate-0 rotate-90">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
    </svg>
  </div>
);


const TheoryOfChangeVisualizer: React.FC<TheoryOfChangeVisualizerProps> = ({ activeProject, frameworkData, onSaveFramework, isLoading: appIsLoading }) => {
  const [editableData, setEditableData] = useState<Omit<TheoryOfChangeFramework, 'id' | 'projectId' | 'lastUpdated'>>({
    inputs: '', activities: '', outputs: '', outcomes: '', impact: '', assumptions: ''
  });
  const [internalLoading, setInternalLoading] = useState(false);

  useEffect(() => {
    if (frameworkData) {
      setEditableData({
        inputs: frameworkData.inputs || '',
        activities: frameworkData.activities || '',
        outputs: frameworkData.outputs || '',
        outcomes: frameworkData.outcomes || '',
        impact: frameworkData.impact || '',
        assumptions: frameworkData.assumptions || '',
      });
    } else if (activeProject) { 
        setEditableData({ inputs: '', activities: '', outputs: '', outcomes: '', impact: '', assumptions: '' });
    }
  }, [frameworkData, activeProject]);

  const handleChange = (field: keyof typeof editableData, value: string) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!activeProject) return;
    setInternalLoading(true);
    const dataToSave: TheoryOfChangeFramework = {
      ...(frameworkData || { projectId: activeProject.id, lastUpdated: '', id: undefined }), 
      ...editableData,
      projectId: activeProject.id,
      lastUpdated: new Date().toISOString(),
    };
     if (frameworkData && frameworkData.id) { 
        dataToSave.id = frameworkData.id;
    }
    await onSaveFramework(dataToSave);
    setInternalLoading(false);
  };
  
  const isOverallLoading = appIsLoading || internalLoading;

  if (!activeProject) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <p className="text-neutral-600">Please select an active project to view or edit its Theory of Change.</p>
      </div>
    );
  }
  
  if (appIsLoading && !frameworkData) {
     return (
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-neutral-600">Loading Theory of Change data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-neutral-50 rounded-lg shadow-inner">
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 pb-4 border-b">
          <h2 className="text-2xl font-semibold text-primary-dark mb-2 sm:mb-0 flex items-center">
            <LightBulbIcon className="w-7 h-7 mr-3 text-secondary"/>
            Theory of Change Editor
          </h2>
          <Button onClick={handleSave} disabled={isOverallLoading}>
            {isOverallLoading ? 'Saving...' : 'Save ToC Data'}
          </Button>
        </div>
        {activeProject && <p className="text-md text-neutral-600 mb-2">Project: <span className="font-semibold">{activeProject.name}</span></p>}
        {frameworkData?.lastUpdated && <p className="text-xs text-neutral-500 mb-4">Last Updated: {new Date(frameworkData.lastUpdated).toLocaleString()}</p>}

        {/* Visualizer Section */}
        <h3 className="text-lg font-medium text-neutral-700 mb-3">ToC Visualization</h3>
        <div className="flex flex-col md:flex-row md:items-stretch md:space-x-1 space-y-2 md:space-y-0 overflow-x-auto custom-scrollbar pb-4 mb-6 border-b">
          <TocElementDisplay title="Inputs" content={editableData.inputs} color="bg-blue-100" />
          <ArrowConnector />
          <TocElementDisplay title="Activities" content={editableData.activities} color="bg-teal-100" />
          <ArrowConnector />
          <TocElementDisplay title="Outputs" content={editableData.outputs} color="bg-green-100" />
          <ArrowConnector />
          <TocElementDisplay title="Outcomes" content={editableData.outcomes} color="bg-yellow-100" />
          <ArrowConnector />
          <TocElementDisplay title="Impact" content={editableData.impact} color="bg-orange-100" />
        </div>
        
        {editableData.assumptions && editableData.assumptions.trim() && (
            <div className="mb-6 p-3 bg-neutral-100 rounded-md">
                <h4 className="font-semibold text-sm text-neutral-700 mb-1">Overall Assumptions:</h4>
                <ul className="text-xs list-disc list-inside space-y-1 text-neutral-600">
                    {editableData.assumptions.split('\n').map((item, index) => item.trim() && <li key={index}>{item.trim()}</li>)}
                </ul>
            </div>
        )}


        {/* Editor Section */}
        <h3 className="text-lg font-medium text-neutral-700 mb-3 mt-6">Edit ToC Content</h3>
        <p className="text-sm text-neutral-500 mb-4">Enter items for each section, one item per line.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea label="Inputs" value={editableData.inputs} onChange={(e) => handleChange('inputs', e.target.value)} rows={4} placeholder="e.g., Funding&#10;Staff expertise&#10;Community volunteers"/>
          <Textarea label="Activities" value={editableData.activities} onChange={(e) => handleChange('activities', e.target.value)} rows={4} placeholder="e.g., Conduct health workshops&#10;Train CHWs"/>
          <Textarea label="Outputs" value={editableData.outputs} onChange={(e) => handleChange('outputs', e.target.value)} rows={4} placeholder="e.g., Increased # of trained CHWs&#10;Improved clinic facilities"/>
          <Textarea label="Outcomes" value={editableData.outcomes} onChange={(e) => handleChange('outcomes', e.target.value)} rows={4} placeholder="e.g., Improved health knowledge&#10;Increased access to quality services"/>
          <Textarea label="Impact" value={editableData.impact} onChange={(e) => handleChange('impact', e.target.value)} rows={4} placeholder="e.g., Reduced child mortality&#10;Improved maternal health"/>
          <Textarea label="Overall Assumptions (Optional)" value={editableData.assumptions || ''} onChange={(e) => handleChange('assumptions', e.target.value)} rows={3} placeholder="e.g., Political stability remains&#10;Community participates actively"/>
        </div>
      </Card>
    </div>
  );
};

export default TheoryOfChangeVisualizer;
