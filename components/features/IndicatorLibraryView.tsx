import React, { useState } from 'react';
import { Indicator, Project, IndicatorDataType } from '../../types';
import Input from '../ui/Input'; // For search/filter later
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { BookOpenIcon } from '../../constants';

interface IndicatorLibraryViewProps {
  allIndicators: Indicator[];
  allProjects: Project[];
}

const IndicatorLibraryView: React.FC<IndicatorLibraryViewProps> = ({ allIndicators, allProjects }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getProjectName = (projectId: string): string => {
    const project = allProjects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const filteredIndicators = allIndicators.filter(indicator => 
    indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    indicator.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getProjectName(indicator.projectId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dataTypeBadgeColor = (type: IndicatorDataType) => {
    switch(type) {
      case IndicatorDataType.Numeric: return 'blue';
      case IndicatorDataType.Percentage: return 'teal';
      case IndicatorDataType.Text: return 'purple';
      default: return 'gray';
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-primary-dark mb-4 sm:mb-0 flex items-center">
          <BookOpenIcon className="w-7 h-7 mr-3 text-primary"/> Indicator Library
        </h2>
        <div className="w-full sm:w-72">
          <Input 
            type="text"
            placeholder="Search indicators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {allIndicators.length === 0 ? (
         <p className="text-neutral-600 text-center py-8">No indicators found in the system yet.</p>
      ) : filteredIndicators.length === 0 ? (
        <p className="text-neutral-600 text-center py-8">No indicators match your search term "{searchTerm}".</p>
      ) : (
        <div className="space-y-4">
          {filteredIndicators.map(indicator => (
            <Card key={indicator.id} className="hover:bg-neutral-50">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                <div className="flex-grow mb-3 sm:mb-0">
                  <h3 className="text-lg font-semibold text-primary mb-1">{indicator.name}</h3>
                  <p className="text-xs text-neutral-500 mb-2">
                    Project: <span className="font-medium">{getProjectName(indicator.projectId)}</span>
                  </p>
                  <p className="text-sm text-neutral-600 custom-scrollbar max-h-20 overflow-y-auto">{indicator.description}</p>
                </div>
                <div className="flex flex-col items-start sm:items-end sm:ml-4 space-y-2 flex-shrink-0">
                  <Badge colorScheme={dataTypeBadgeColor(indicator.dataType)} size="sm">{indicator.dataType}</Badge>
                   <p className="text-xs text-neutral-500">
                    Target: <span className="font-semibold">{indicator.targetValue.toLocaleString()}</span>
                    {indicator.dataType === IndicatorDataType.Percentage && '%'}
                  </p>
                  <p className="text-xs text-neutral-500">Unit: {indicator.unitOfMeasure}</p>
                </div>
              </div>
               {indicator.disaggregationCategories && indicator.disaggregationCategories.length > 0 && (
                <p className="text-xs text-neutral-500 mt-2 pt-2 border-t border-neutral-100">
                  Disaggregates by: {indicator.disaggregationCategories.join(', ')}
                </p>
              )}
               {indicator.calculationFormula && (
                <p className="text-xs text-purple-600 mt-2 pt-2 border-t border-neutral-100">
                  Formula: {indicator.calculationFormula}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default IndicatorLibraryView;
