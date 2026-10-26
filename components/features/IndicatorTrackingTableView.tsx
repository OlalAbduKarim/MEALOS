
import React, { useMemo, useState } from 'react';
import { Indicator, DataPoint, IndicatorDataType, IndicatorStatus } from '../../types';
import { getIndicatorStatus } from '../../utils/mneUtils';
import ProgressBar from '../ui/ProgressBar';
import Badge from '../ui/Badge';
import { TableCellsIcon, CheckCircleIcon, ExclamationCircleIcon, XCircleIcon } from '../../constants';

interface IndicatorTrackingTableViewProps {
  projectIndicators: Indicator[];
  allDataPoints: DataPoint[];
  activeProjectName: string | undefined;
}

type SortConfig = {
  key: keyof FormattedIndicatorData | null;
  direction: 'ascending' | 'descending';
};

interface FormattedIndicatorData {
  id: string;
  name: string;
  unitOfMeasure: string;
  targetValue: string | number;
  latestActualValue: string | number;
  latestCollectionDate: string;
  status: IndicatorStatus;
  percentageAchieved: number | null; // Null if not applicable
  dataType: IndicatorDataType;
}


const IndicatorTrackingTableView: React.FC<IndicatorTrackingTableViewProps> = ({ projectIndicators, allDataPoints, activeProjectName }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' });

  const formattedData = useMemo((): FormattedIndicatorData[] => {
    return projectIndicators.map(indicator => {
      const latestDataPoint = allDataPoints
        .filter(dp => dp.indicatorId === indicator.id)
        .sort((a, b) => new Date(b.collectionDate).getTime() - new Date(a.collectionDate).getTime())[0];

      const status = getIndicatorStatus(indicator, latestDataPoint);
      let percentageAchieved: number | null = null;

      if (latestDataPoint && (indicator.dataType === IndicatorDataType.Numeric || indicator.dataType === IndicatorDataType.Percentage)) {
        const actual = typeof latestDataPoint.actualValue === 'string' ? parseFloat(latestDataPoint.actualValue) : latestDataPoint.actualValue;
        const target = typeof indicator.targetValue === 'string' ? parseFloat(indicator.targetValue) : indicator.targetValue;

        if (typeof actual === 'number' && typeof target === 'number' && !isNaN(actual) && !isNaN(target)) {
          if (indicator.dataType === IndicatorDataType.Percentage) {
            percentageAchieved = actual; // Actual value is already the percentage
          } else if (target !== 0) {
            percentageAchieved = (actual / target) * 100;
          } else { // target is 0 for numeric
            percentageAchieved = actual === 0 ? 100 : 0; // Or some other logic for 0 target
          }
        }
      }
      
      return {
        id: indicator.id,
        name: indicator.name,
        unitOfMeasure: indicator.unitOfMeasure,
        targetValue: indicator.targetValue,
        latestActualValue: latestDataPoint?.actualValue ?? 'N/A',
        latestCollectionDate: latestDataPoint ? new Date(latestDataPoint.collectionDate).toLocaleDateString() : 'N/A',
        status,
        percentageAchieved,
        dataType: indicator.dataType,
      };
    });
  }, [projectIndicators, allDataPoints]);

  const sortedData = useMemo(() => {
    let sortableItems = [...formattedData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];

        let comparison = 0;

        if (sortConfig.key === 'latestCollectionDate') {
          // Handle 'N/A' dates: sort them to the end for ascending, beginning for descending
          if (valA === 'N/A' && valB !== 'N/A') {
            comparison = 1;
          } else if (valA !== 'N/A' && valB === 'N/A') {
            comparison = -1;
          } else if (valA === 'N/A' && valB === 'N/A') {
            comparison = 0;
          } else if (typeof valA === 'string' && typeof valB === 'string') {
            // Both are valid date strings
            const dateA = new Date(valA);
            const dateB = new Date(valB);
            comparison = dateA.getTime() - dateB.getTime();
          }
        } else if (sortConfig.key === 'percentageAchieved') {
          // Handle nulls for percentageAchieved: nulls sort before numbers
          if (valA === null && valB !== null) comparison = -1;
          else if (valA !== null && valB === null) comparison = 1;
          else if (valA === null && valB === null) comparison = 0;
          else if (typeof valA === 'number' && typeof valB === 'number') comparison = valA - valB;
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        } else if (sortConfig.key === 'status') {
           const order: IndicatorStatus[] = [IndicatorStatus.ON_TRACK, IndicatorStatus.AT_RISK, IndicatorStatus.OFF_TRACK, IndicatorStatus.NO_DATA, IndicatorStatus.NOT_APPLICABLE];
           comparison = order.indexOf(valA as IndicatorStatus) - order.indexOf(valB as IndicatorStatus);
        }
        
        return sortConfig.direction === 'ascending' ? comparison : comparison * -1;
      });
    }
    return sortableItems;
  }, [formattedData, sortConfig]);

  const requestSort = (key: keyof FormattedIndicatorData) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof FormattedIndicatorData) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? '▲' : '▼';
    }
    return '';
  };
  
  const getStatusBadge = (status: IndicatorStatus) => {
    let colorScheme: 'green' | 'yellow' | 'red' | 'gray' | 'blue' = 'gray';
    let icon;
    switch(status) {
      case IndicatorStatus.ON_TRACK: colorScheme = 'green'; icon = <CheckCircleIcon />; break;
      case IndicatorStatus.AT_RISK: colorScheme = 'yellow'; icon = <ExclamationCircleIcon />; break;
      case IndicatorStatus.OFF_TRACK: colorScheme = 'red'; icon = <XCircleIcon />; break;
      case IndicatorStatus.NO_DATA: colorScheme = 'gray'; break;
      case IndicatorStatus.NOT_APPLICABLE: colorScheme = 'blue'; break;
    }
    return <Badge colorScheme={colorScheme} icon={icon}>{status}</Badge>;
  };

  if (projectIndicators.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <p className="text-neutral-600">No indicators defined for this project yet.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-primary-dark mb-1 flex items-center">
        <TableCellsIcon className="w-7 h-7 mr-3 text-primary"/>
        Indicator Tracking Table
      </h2>
      {activeProjectName && <p className="text-md text-neutral-600 mb-6">Project: {activeProjectName}</p>}
      
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-neutral-200 border border-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              {([
                { key: 'name', label: 'Indicator Name' },
                { key: 'unitOfMeasure', label: 'Unit' },
                { key: 'targetValue', label: 'Target' },
                { key: 'latestActualValue', label: 'Actual' },
                { key: 'latestCollectionDate', label: 'Date' },
                { key: 'status', label: 'Status' },
                { key: 'percentageAchieved', label: '% Achieved' }
              ] as {key: keyof FormattedIndicatorData, label: string}[]).map(header => (
                <th
                  key={header.key}
                  scope="col"
                  onClick={() => requestSort(header.key)}
                  className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                >
                  {header.label} {getSortIndicator(header.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {sortedData.map((item) => (
              <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3 whitespace-normal text-sm font-medium text-neutral-900 max-w-xs">{item.name}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500">{item.unitOfMeasure}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500 text-right">{typeof item.targetValue === 'number' ? item.targetValue.toLocaleString() : item.targetValue}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500 text-right">{typeof item.latestActualValue === 'number' ? item.latestActualValue.toLocaleString() : item.latestActualValue}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500">{item.latestCollectionDate}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">{getStatusBadge(item.status)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500">
                  {item.percentageAchieved !== null && item.status !== IndicatorStatus.NOT_APPLICABLE && item.status !== IndicatorStatus.NO_DATA && (item.dataType === IndicatorDataType.Numeric || item.dataType === IndicatorDataType.Percentage) ? (
                    <ProgressBar 
                        value={typeof item.latestActualValue === 'number' ? item.latestActualValue : 0} 
                        max={typeof item.targetValue === 'number' && item.targetValue !== 0 ? item.targetValue : 100} // Ensure max is not 0 for ProgressBar unless actual is 0
                        status={item.status} 
                    />
                  ) : (
                    <span className="text-neutral-400">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IndicatorTrackingTableView;
