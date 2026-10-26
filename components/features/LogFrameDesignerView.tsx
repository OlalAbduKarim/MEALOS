
import React, { useState, useEffect } from 'react';
import { Project, LogFrameFramework } from '../../types';
import { FrameworkIcon } from '../../constants';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';

interface LogFrameDesignerViewProps {
  activeProject: Project | null;
  frameworkData: LogFrameFramework | null;
  onSaveFramework: (data: LogFrameFramework) => Promise<void>;
  isLoading: boolean;
}

const LogFrameSectionDisplay: React.FC<{ title: string; content: string; placeholder: string; isHeader?: boolean }> = ({ title, content, placeholder, isHeader }) => (
  <div className={`border border-neutral-300 p-3 bg-white min-h-[80px] flex flex-col ${isHeader ? 'bg-primary-light text-white rounded-t-md' : 'bg-white'}`}>
    <h3 className={`font-semibold text-sm mb-1.5 ${isHeader ? 'text-white' : 'text-primary-dark'}`}>{title}</h3>
    {!isHeader && (content.trim() ? (
      <ul className="text-xs list-disc list-inside space-y-1 text-neutral-700 flex-grow">
        {content.split('\n').map((item, index) => item.trim() && <li key={index}>{item.trim()}</li>)}
      </ul>
    ) : (
      <p className="text-xs text-neutral-500 italic mt-auto">{placeholder}</p>
    ))}
  </div>
);

const LogFrameSectionEditor: React.FC<{ title: string; fieldName: keyof LogFrameFramework; value: string; onChange: (fieldName: keyof LogFrameFramework, value: string) => void; placeholder: string; rows?: number }> = 
({ title, fieldName, value, onChange, placeholder, rows = 3 }) => (
  <div className="flex flex-col h-full">
    <Textarea
      label={title}
      value={value}
      onChange={(e) => onChange(fieldName, e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="text-xs flex-grow"
    />
  </div>
);


const LogFrameDesignerView: React.FC<LogFrameDesignerViewProps> = ({ activeProject, frameworkData, onSaveFramework, isLoading: appIsLoading }) => {
  
  const initialEditableState: Omit<LogFrameFramework, 'id' | 'projectId' | 'lastUpdated'> = {
    goal: '', outcomes: '', outputs: '', activities: '',
    goalIndicators: '', outcomeIndicators: '', outputIndicators: '', activityIndicators: '',
    goalMov: '', outcomeMov: '', outputMov: '', activityMov: '',
    goalAssumptions: '', outcomeAssumptions: '', outputAssumptions: '', activityAssumptions: ''
  };
  const [editableData, setEditableData] = useState(initialEditableState);
  const [internalLoading, setInternalLoading] = useState(false);

  useEffect(() => {
    if (frameworkData) {
      setEditableData({
        goal: frameworkData.goal || '',
        outcomes: frameworkData.outcomes || '',
        outputs: frameworkData.outputs || '',
        activities: frameworkData.activities || '',
        goalIndicators: frameworkData.goalIndicators || '',
        outcomeIndicators: frameworkData.outcomeIndicators || '',
        outputIndicators: frameworkData.outputIndicators || '',
        activityIndicators: frameworkData.activityIndicators || '',
        goalMov: frameworkData.goalMov || '',
        outcomeMov: frameworkData.outcomeMov || '',
        outputMov: frameworkData.outputMov || '',
        activityMov: frameworkData.activityMov || '',
        goalAssumptions: frameworkData.goalAssumptions || '',
        outcomeAssumptions: frameworkData.outcomeAssumptions || '',
        outputAssumptions: frameworkData.outputAssumptions || '',
        activityAssumptions: frameworkData.activityAssumptions || '',
      });
    } else if (activeProject) {
        setEditableData(initialEditableState);
    }
  }, [frameworkData, activeProject]);

  const handleChange = (field: keyof LogFrameFramework, value: string) => {
    setEditableData(prev => ({ ...prev, [field]: value } as Omit<LogFrameFramework, 'id' | 'projectId' | 'lastUpdated'>));
  };

  const handleSave = async () => {
    if (!activeProject) return;
    setInternalLoading(true);
    const dataToSave: LogFrameFramework = {
      ...(frameworkData || { projectId: activeProject.id, lastUpdated: '', id: undefined }), // Ensure id is handled for new/loaded templates
      ...editableData,
      projectId: activeProject.id,
      lastUpdated: new Date().toISOString(),
    };
    if (frameworkData && frameworkData.id) { // If there was existing data, use its ID
        dataToSave.id = frameworkData.id;
    }
    await onSaveFramework(dataToSave);
    setInternalLoading(false);
  };

  const isOverallLoading = appIsLoading || internalLoading;

  if (!activeProject) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <p className="text-neutral-600">Please select an active project to view or design its LogFrame.</p>
      </div>
    );
  }

  if (appIsLoading && !frameworkData) {
    return (
     <div className="p-6 bg-white rounded-lg shadow-md text-center">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
       <p className="text-neutral-600">Loading LogFrame data...</p>
     </div>
   );
 }

  return (
    <div className="p-4 sm:p-6 bg-neutral-50 rounded-lg shadow-inner">
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 pb-4 border-b">
          <h2 className="text-2xl font-semibold text-primary-dark mb-2 sm:mb-0 flex items-center">
            <FrameworkIcon className="w-7 h-7 mr-3 text-primary"/>
            Logical Framework Editor
          </h2>
          <Button onClick={handleSave} disabled={isOverallLoading}>
            {isOverallLoading ? 'Saving...' : 'Save LogFrame Data'}
          </Button>
        </div>
        {activeProject && <p className="text-md text-neutral-600 mb-2">Project: <span className="font-semibold">{activeProject.name}</span></p>}
        {frameworkData?.lastUpdated && <p className="text-xs text-neutral-500 mb-4">Last Updated: {new Date(frameworkData.lastUpdated).toLocaleString()}</p>}

        <p className="text-sm text-neutral-500 mb-4">Enter items for each section, one item per line. These will be displayed in the LogFrame table below.</p>

        {/* Editor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <LogFrameSectionEditor title="Overall Goal / Impact" fieldName="goal" value={editableData.goal} onChange={handleChange} placeholder="Highest level objective..." rows={4}/>
            <LogFrameSectionEditor title="Goal Indicators (OVIs)" fieldName="goalIndicators" value={editableData.goalIndicators} onChange={handleChange} placeholder="Indicators for Goal..." rows={4}/>
            <LogFrameSectionEditor title="Goal MoV" fieldName="goalMov" value={editableData.goalMov} onChange={handleChange} placeholder="Means of Verification for Goal..." rows={4}/>
            <LogFrameSectionEditor title="Goal Assumptions" fieldName="goalAssumptions" value={editableData.goalAssumptions} onChange={handleChange} placeholder="Assumptions for Goal..." rows={4}/>

            <LogFrameSectionEditor title="Outcomes / Purpose" fieldName="outcomes" value={editableData.outcomes} onChange={handleChange} placeholder="Project outcomes..." rows={4}/>
            <LogFrameSectionEditor title="Outcome Indicators" fieldName="outcomeIndicators" value={editableData.outcomeIndicators} onChange={handleChange} placeholder="Indicators for Outcomes..." rows={4}/>
            <LogFrameSectionEditor title="Outcome MoV" fieldName="outcomeMov" value={editableData.outcomeMov} onChange={handleChange} placeholder="MoV for Outcomes..." rows={4}/>
            <LogFrameSectionEditor title="Outcome Assumptions" fieldName="outcomeAssumptions" value={editableData.outcomeAssumptions} onChange={handleChange} placeholder="Assumptions for Outcomes..." rows={4}/>
            
            <LogFrameSectionEditor title="Outputs" fieldName="outputs" value={editableData.outputs} onChange={handleChange} placeholder="Project outputs..." rows={4}/>
            <LogFrameSectionEditor title="Output Indicators" fieldName="outputIndicators" value={editableData.outputIndicators} onChange={handleChange} placeholder="Indicators for Outputs..." rows={4}/>
            <LogFrameSectionEditor title="Output MoV" fieldName="outputMov" value={editableData.outputMov} onChange={handleChange} placeholder="MoV for Outputs..." rows={4}/>
            <LogFrameSectionEditor title="Output Assumptions" fieldName="outputAssumptions" value={editableData.outputAssumptions} onChange={handleChange} placeholder="Assumptions for Outputs..." rows={4}/>

            <LogFrameSectionEditor title="Activities" fieldName="activities" value={editableData.activities} onChange={handleChange} placeholder="Key activities..." rows={4}/>
            <LogFrameSectionEditor title="Activity Indicators (Optional)" fieldName="activityIndicators" value={editableData.activityIndicators || ''} onChange={handleChange} placeholder="Process indicators for Activities..." rows={4}/>
            <LogFrameSectionEditor title="Activity MoV (Optional)" fieldName="activityMov" value={editableData.activityMov || ''} onChange={handleChange} placeholder="MoV for Activities..." rows={4}/>
            <LogFrameSectionEditor title="Activity Assumptions (Optional)" fieldName="activityAssumptions" value={editableData.activityAssumptions || ''} onChange={handleChange} placeholder="Assumptions for Activities..." rows={4}/>
        </div>


        {/* Display Grid (Table-like) */}
        <h3 className="text-lg font-medium text-neutral-700 mb-3 mt-8 pt-4 border-t">LogFrame Preview</h3>
        <div className="overflow-x-auto custom-scrollbar pb-2">
          <div className="grid grid-cols-[minmax(200px,2fr)_minmax(200px,2fr)_minmax(150px,1.5fr)_minmax(150px,1.5fr)] gap-0 min-w-[900px] border border-neutral-300 rounded-lg">
            {/* Header Row */}
            <div className="font-bold text-xs text-white bg-primary p-2 rounded-tl-md">Project Hierarchy</div>
            <div className="font-bold text-xs text-white bg-primary p-2">Objectively Verifiable Indicators (OVIs)</div>
            <div className="font-bold text-xs text-white bg-primary p-2">Means of Verification (MoV)</div>
            <div className="font-bold text-xs text-white bg-primary p-2 rounded-tr-md">Important Assumptions</div>

            {/* Goal */}
            <LogFrameSectionDisplay title="Overall Goal / Impact" content={editableData.goal} placeholder="Define the highest level objective..." />
            <LogFrameSectionDisplay title="Goal Indicators" content={editableData.goalIndicators} placeholder="Indicators for Goal..." />
            <LogFrameSectionDisplay title="Goal MoV" content={editableData.goalMov} placeholder="MoV for Goal..." />
            <LogFrameSectionDisplay title="Goal Assumptions" content={editableData.goalAssumptions} placeholder="Assumptions for Goal..." />
            
            {/* Outcomes */}
            <LogFrameSectionDisplay title="Outcomes / Purpose" content={editableData.outcomes} placeholder="Define project outcomes..." />
            <LogFrameSectionDisplay title="Outcome Indicators" content={editableData.outcomeIndicators} placeholder="Indicators for Outcomes..." />
            <LogFrameSectionDisplay title="Outcome MoV" content={editableData.outcomeMov} placeholder="MoV for Outcomes..." />
            <LogFrameSectionDisplay title="Outcome Assumptions" content={editableData.outcomeAssumptions} placeholder="Assumptions for Outcomes..." />

            {/* Outputs */}
            <LogFrameSectionDisplay title="Outputs" content={editableData.outputs} placeholder="Define project outputs..." />
            <LogFrameSectionDisplay title="Output Indicators" content={editableData.outputIndicators} placeholder="Indicators for Outputs..." />
            <LogFrameSectionDisplay title="Output MoV" content={editableData.outputMov} placeholder="MoV for Outputs..." />
            <LogFrameSectionDisplay title="Output Assumptions" content={editableData.outputAssumptions} placeholder="Assumptions for Outputs..." />

            {/* Activities */}
            <LogFrameSectionDisplay title="Activities" content={editableData.activities} placeholder="Define key activities..." />
            <LogFrameSectionDisplay title="Activity Indicators" content={editableData.activityIndicators || ''} placeholder="Process indicators for Activities..." />
            <LogFrameSectionDisplay title="Activity MoV" content={editableData.activityMov || ''} placeholder="MoV for Activities..." />
            <LogFrameSectionDisplay title="Activity Assumptions" content={editableData.activityAssumptions || ''} placeholder="Assumptions for Activities..." />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LogFrameDesignerView;
