import React from 'react';
import { Project, Indicator, DataPoint, IndicatorDataType } from '../../types';
import Button from '../ui/Button';
import { DownloadIcon } from '../../constants';

interface ExportDataViewProps {
  activeProject: Project | null;
  projectIndicators: Indicator[];
  allDataPoints: DataPoint[];
}

const ExportDataView: React.FC<ExportDataViewProps> = ({ activeProject, projectIndicators, allDataPoints }) => {
  if (!activeProject) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <p className="text-neutral-600">No active project selected. Please select a project to export its data.</p>
      </div>
    );
  }

  const handleExportData = () => {
    if (!activeProject) return;

    const dataToExport = projectIndicators.map(indicator => {
      const latestDataPoint = allDataPoints
        .filter(dp => dp.indicatorId === indicator.id)
        .sort((a, b) => new Date(b.collectionDate).getTime() - new Date(a.collectionDate).getTime())[0];
      
      return {
        'Project ID': activeProject.id,
        'Project Name': activeProject.name,
        'Indicator ID': indicator.id,
        'Indicator Name': indicator.name,
        'Unit of Measure': indicator.unitOfMeasure,
        'Data Type': indicator.dataType,
        'Target Value': indicator.targetValue.toString(),
        'Calculation Formula': indicator.calculationFormula || '',
        'Aggregation Type': indicator.aggregationType || '',
        'Depends On IDs': indicator.dependsOnIndicatorIds?.join('; ') || '',
        'Disaggregation Categories': indicator.disaggregationCategories?.join('; ') || '',
        'Min Value': indicator.minValue?.toString() || '',
        'Max Value': indicator.maxValue?.toString() || '',
        'Off-Track Threshold (%)': indicator.statusThresholds?.offTrackLessThan.toString() || '',
        'At-Risk Threshold (%)': indicator.statusThresholds?.atRiskLessThan.toString() || '',
        'Latest DataPoint ID': latestDataPoint?.id || '',
        'Latest Actual Value': latestDataPoint?.actualValue.toString() || '',
        'Latest Collection Date': latestDataPoint?.collectionDate || '',
        'Latest Notes': latestDataPoint?.notes || '',
        'Latest Tags (JSON)': latestDataPoint?.tags ? JSON.stringify(latestDataPoint.tags) : '{}',
      };
    });

    if (dataToExport.length === 0) {
      alert('No indicators found for this project to export.');
      return;
    }

    const csvHeaders = Object.keys(dataToExport[0]);
    const csvRows = dataToExport.map(row => 
      csvHeaders.map(header => `"${String(row[header as keyof typeof row]).replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const safeProjectName = activeProject.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute('download', `${safeProjectName}_indicators_data.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-primary-dark mb-4">Export Data for: {activeProject.name}</h2>
      <p className="text-neutral-600 mb-6">
        This tool allows you to export all indicators and their latest data points for the current project ({activeProject.name}) as a CSV file.
      </p>
      <Button onClick={handleExportData} leftIcon={<DownloadIcon className="w-5 h-5" />}>
        Export Project Indicators & Latest Data (CSV)
      </Button>
      <div className="mt-6 text-sm text-neutral-500">
        <p><strong>Note:</strong> The CSV export includes comprehensive details for each indicator and the most recent data point collected for it.</p>
        <p>Fields include: Project ID, Project Name, Indicator ID, Name, Unit, Data Type, Target, Formula, Aggregation, Dependencies, Disaggregations, Validation Min/Max, Status Thresholds, Latest DataPoint details (ID, Actual Value, Date, Notes, Tags as JSON).</p>
      </div>
    </div>
  );
};

export default ExportDataView;
