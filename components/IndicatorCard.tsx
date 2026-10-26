
import React from 'react';
import { Indicator, DataPoint, IndicatorDataType, IndicatorStatus, AggregationType } from '../types';
import { EditIcon, DeleteIcon, PlusIcon, CheckCircleIcon, ExclamationCircleIcon, XCircleIcon } from '../constants';
import Button from './ui/Button';
import ProgressBar from './ui/ProgressBar';
import Badge from './ui/Badge';
import { getIndicatorStatus } from '../utils/mneUtils'; // Import the utility function

interface IndicatorCardProps {
  indicator: Indicator;
  dataPoints: DataPoint[];
  onAddDataPoint: (indicator: Indicator) => void;
  onEditIndicator: (indicator: Indicator) => void;
  onDeleteIndicator: (indicatorId: string) => void;
}

const IndicatorCard: React.FC<IndicatorCardProps> = ({ indicator, dataPoints, onAddDataPoint, onEditIndicator, onDeleteIndicator }) => {
  const latestDataPoint = dataPoints
    .filter(dp => dp.indicatorId === indicator.id)
    .sort((a, b) => new Date(b.collectionDate).getTime() - new Date(a.collectionDate).getTime())[0];

  const status = getIndicatorStatus(indicator, latestDataPoint); // Use the utility function

  const getBadgeColor = (currentStatus: IndicatorStatus) => {
    switch(currentStatus) {
      case IndicatorStatus.ON_TRACK: return 'green';
      case IndicatorStatus.AT_RISK: return 'yellow';
      case IndicatorStatus.OFF_TRACK: return 'red';
      case IndicatorStatus.NO_DATA: return 'gray';
      case IndicatorStatus.NOT_APPLICABLE: return 'blue'; // Or a different color like purple
      default: return 'gray';
    }
  };
  
  const getStatusIcon = (currentStatus: IndicatorStatus) => {
    switch(currentStatus) {
      case IndicatorStatus.ON_TRACK: return <CheckCircleIcon />;
      case IndicatorStatus.AT_RISK: return <ExclamationCircleIcon />;
      case IndicatorStatus.OFF_TRACK: return <XCircleIcon />;
      default: return undefined;
    }
  };
  
  const dataTypeBadgeColor = (type: IndicatorDataType) => {
    switch(type) {
      case IndicatorDataType.Numeric: return 'blue';
      case IndicatorDataType.Percentage: return 'teal';
      case IndicatorDataType.Text: return 'purple';
      default: return 'gray';
    }
  }

  const isCalculatedOrAggregated = indicator.calculationFormula || (indicator.aggregationType && indicator.aggregationType !== AggregationType.NONE);

  const actualValueForDisplay = latestDataPoint?.actualValue ?? 'N/A';
  const targetValueForDisplay = indicator.targetValue ?? 'N/A';
  
  let progressBarValue = 0;
  let progressBarMax = 100;

  if (latestDataPoint && typeof latestDataPoint.actualValue === 'number' && typeof indicator.targetValue === 'number') {
    progressBarValue = latestDataPoint.actualValue;
    if (indicator.dataType === IndicatorDataType.Percentage) {
      // If targetValue is e.g. 80 (meaning 80%), and actual is 40 (meaning 40%), progress bar should show 40 out of 80 (or 100 if target is 100)
      progressBarMax = indicator.targetValue === 100 ? 100 : indicator.targetValue; 
    } else { // Numeric
      progressBarMax = indicator.targetValue;
    }
  }


  return (
    <div className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-xl font-semibold text-primary-dark flex-1 mr-2">{indicator.name}</h3>
          <Badge colorScheme={dataTypeBadgeColor(indicator.dataType)} size="sm">{indicator.dataType}</Badge>
        </div>
        <div className="mb-3">
             <Badge colorScheme={getBadgeColor(status)} icon={getStatusIcon(status)} size="sm">{status}</Badge>
        </div>

        <p className="text-sm text-neutral-600 mb-1 italic">Unit: {indicator.unitOfMeasure}</p>
        <p className="text-sm text-neutral-600 mb-4 h-12 overflow-y-auto custom-scrollbar">{indicator.description}</p>

        {isCalculatedOrAggregated && (
          <p className="text-xs text-purple-700 bg-purple-100 p-1 rounded mb-2">
            {indicator.calculationFormula ? `Formula: ${indicator.calculationFormula}` : `Aggregates Data (${indicator.aggregationType || AggregationType.NONE})`}
          </p>
        )}

        <div className="mb-4">
          <p className="text-sm font-medium text-neutral-700">
            Target: <span className="font-bold">{typeof targetValueForDisplay === 'number' ? targetValueForDisplay.toLocaleString() : targetValueForDisplay}</span> 
            {indicator.dataType === IndicatorDataType.Percentage ? '%' : ''}
          </p>
          {latestDataPoint ? (
            <>
              <p className="text-sm text-neutral-700">
                Actual (Latest): <span className="font-bold">{typeof actualValueForDisplay === 'number' ? actualValueForDisplay.toLocaleString() : actualValueForDisplay}</span>
                {indicator.dataType === IndicatorDataType.Percentage ? '%' : ''}
                <span className="text-xs text-neutral-500 ml-2">
                  (as of {new Date(latestDataPoint.collectionDate).toLocaleDateString()})
                </span>
              </p>
              {latestDataPoint.tags && Object.keys(latestDataPoint.tags).length > 0 && (
                <div className="mt-1 text-xs text-neutral-500">
                  Disaggregated by: {Object.entries(latestDataPoint.tags).map(([key, value]) => `${key}: ${value}`).join(', ')}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-neutral-500 italic">No data collected yet.</p>
          )}
        </div>

        {(indicator.dataType === IndicatorDataType.Numeric || indicator.dataType === IndicatorDataType.Percentage) && 
         status !== IndicatorStatus.NOT_APPLICABLE && status !== IndicatorStatus.NO_DATA &&
         typeof progressBarValue === 'number' && typeof progressBarMax === 'number' && progressBarMax !== 0 && (
          <div className="mb-4">
            <ProgressBar 
              value={progressBarValue} 
              max={progressBarMax}
              status={status}
            />
          </div>
        )}
        
        {latestDataPoint?.notes && (
          <div className="mb-4 p-2 bg-neutral-100 rounded">
            <p className="text-xs font-semibold text-neutral-700">Latest Note:</p>
            <p className="text-xs text-neutral-600 italic custom-scrollbar overflow-y-auto h-10">{latestDataPoint.notes}</p>
          </div>
        )}

        {indicator.disaggregationCategories && indicator.disaggregationCategories.length > 0 && (
             <p className="text-xs text-neutral-500 mt-1">Disaggregates by: {indicator.disaggregationCategories.join(', ')}</p>
        )}


      </div> {/* End flex-grow */}

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-auto pt-4 border-t border-neutral-200">
        <Button 
          variant="primary" 
          size="sm" 
          onClick={() => onAddDataPoint(indicator)}
          leftIcon={<PlusIcon className="w-4 h-4"/>}
          className="w-full sm:w-auto"
        >
          Add Data
        </Button>
        <div className="flex space-x-2 w-full sm:w-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onEditIndicator(indicator)}
            leftIcon={<EditIcon />}
            className="flex-1 sm:flex-initial"
            aria-label="Edit Indicator"
          >
             Edit
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              if(window.confirm(`Are you sure you want to delete indicator "${indicator.name}"? This will also delete all its data points.`)) {
                onDeleteIndicator(indicator.id)
              }
            }}
            className="text-red-600 hover:bg-red-100 border-red-300 hover:border-red-500 flex-1 sm:flex-initial"
            leftIcon={<DeleteIcon />}
            aria-label="Delete Indicator"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IndicatorCard;
