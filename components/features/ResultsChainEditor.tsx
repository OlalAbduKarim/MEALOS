
import React, { useState, useEffect } from 'react';
import { Project, ResultsChainFramework } from '../../types';
import { ShareIcon } from '../../constants';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';

interface ResultsChainEditorProps {
  activeProject: Project | null;
  frameworkData: ResultsChainFramework | null;
  onSaveFramework: (data: ResultsChainFramework) => Promise<void>;
  isLoading: boolean;
}

const ChainElementDisplay: React.FC<{ title: string; content: string; color: string; textColor?: string }> = ({ title, content, color, textColor = "text-neutral-800" }) => (
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

const ArrowConnector: React.FC<{ isVertical?: boolean }> = ({ isVertical }) => (
  <div className={`flex items-center justify-center text-primary-light ${isVertical ? 'my-2' : 'mx-2'}`}>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`w-8 h-8 md:w-10 md:h-10 ${isVertical ? 'transform rotate-90' : ''}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
    </svg>
  </div>
);

const ResultsChainEditor: React.FC<ResultsChainEditorProps> = ({ activeProject, frameworkData, onSaveFramework, isLoading: appIsLoading }) => {
  const initialEditableState: Omit<ResultsChainFramework, 'id' | 'projectId' | 'lastUpdated'> = {
    inputs: '', activities: '', outputs: '', shortTermOutcomes: '', mediumTermOutcomes: '', longTermImpact: ''
  };
  const [editableData, setEditableData] = useState(initialEditableState);
  const [internalLoading, setInternalLoading] = useState(false);

  useEffect(() => {
    if (frameworkData) {
      setEditableData({
        inputs: frameworkData.inputs || '',
        activities: frameworkData.activities || '',
        outputs: frameworkData.outputs || '',
        shortTermOutcomes: frameworkData.shortTermOutcomes || '',
        mediumTermOutcomes: frameworkData.mediumTermOutcomes || '',
        longTermImpact: frameworkData.longTermImpact || '',
      });
    } else if (activeProject) {
        setEditableData(initialEditableState);
    }
  }, [frameworkData, activeProject]);

  const handleChange = (field: keyof typeof editableData, value: string) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!activeProject) return;
    setInternalLoading(true);
    const dataToSave: ResultsChainFramework = {
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
        <p className="text-neutral-600">Please select an active project to view or edit its Results Chain.</p>
      </div>
    );
  }

  if (appIsLoading && !frameworkData) {
    return (
     <div className="p-6 bg-white rounded-lg shadow-md text-center">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
       <p className="text-neutral-600">Loading Results Chain data...</p>
     </div>
   );
 }

  return (
    <div className="p-4 sm:p-6 bg-neutral-50 rounded-lg shadow-inner">
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 pb-4 border-b">
          <h2 className="text-2xl font-semibold text-primary-dark mb-2 sm:mb-0 flex items-center">
            <ShareIcon className="w-7 h-7 mr-3 text-primary"/>
            Results Chain Editor
          </h2>
          <Button onClick={handleSave} disabled={isOverallLoading}>
            {isOverallLoading ? 'Saving...' : 'Save Results Chain Data'}
          </Button>
        </div>
        {activeProject && <p className="text-md text-neutral-600 mb-2">Project: <span className="font-semibold">{activeProject.name}</span></p>}
        {frameworkData?.lastUpdated && <p className="text-xs text-neutral-500 mb-4">Last Updated: {new Date(frameworkData.lastUpdated).toLocaleString()}</p>}
        
        {/* Visualizer Section */}
        <h3 className="text-lg font-medium text-neutral-700 mb-3">Results Chain Visualization</h3>
        <div className="flex flex-col md:flex-row md:items-stretch md:space-x-1 space-y-2 md:space-y-0 overflow-x-auto custom-scrollbar pb-4 mb-6 border-b">
          <ChainElementDisplay title="Inputs" content={editableData.inputs} color="bg-sky-100" />
          <ArrowConnector />
          <ChainElementDisplay title="Activities" content={editableData.activities} color="bg-cyan-100" />
          <ArrowConnector />
          <ChainElementDisplay title="Outputs" content={editableData.outputs} color="bg-teal-100" />
          <ArrowConnector />
          <ChainElementDisplay title="Short-Term Outcomes" content={editableData.shortTermOutcomes} color="bg-emerald-100" />
          <ArrowConnector />
          <ChainElementDisplay title="Medium-Term Outcomes" content={editableData.mediumTermOutcomes} color="bg-lime-200" />
          <ArrowConnector />
          <ChainElementDisplay title="Long-Term Impact" content={editableData.longTermImpact} color="bg-amber-100" />
        </div>

        {/* Editor Section */}
        <h3 className="text-lg font-medium text-neutral-700 mb-3 mt-6">Edit Results Chain Content</h3>
        <p className="text-sm text-neutral-500 mb-4">Enter items for each section, one item per line.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Textarea label="Inputs" value={editableData.inputs} onChange={(e) => handleChange('inputs', e.target.value)} rows={3} placeholder="e.g., Financial Resources&#10;Human Resources"/>
          <Textarea label="Activities" value={editableData.activities} onChange={(e) => handleChange('activities', e.target.value)} rows={3} placeholder="e.g., Conduct Baseline Survey&#10;Deliver Training Workshops"/>
          <Textarea label="Outputs" value={editableData.outputs} onChange={(e) => handleChange('outputs', e.target.value)} rows={3} placeholder="e.g., 1 Baseline Report Completed&#10;5 Workshops Conducted"/>
          <Textarea label="Short-Term Outcomes" value={editableData.shortTermOutcomes} onChange={(e) => handleChange('shortTermOutcomes', e.target.value)} rows={3} placeholder="e.g., Increased knowledge & skills&#10;Improved service delivery"/>
          <Textarea label="Medium-Term Outcomes" value={editableData.mediumTermOutcomes} onChange={(e) => handleChange('mediumTermOutcomes', e.target.value)} rows={3} placeholder="e.g., Enhanced data collection practices&#10;Policy changes adopted"/>
          <Textarea label="Long-Term Impact" value={editableData.longTermImpact} onChange={(e) => handleChange('longTermImpact', e.target.value)} rows={3} placeholder="e.g., Improved project effectiveness&#10;Sustainable capacity built"/>
        </div>
      </Card>
    </div>
  );
};

export default ResultsChainEditor;
