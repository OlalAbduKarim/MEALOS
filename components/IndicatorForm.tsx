
import React, { useState, useEffect } from 'react';
import { Indicator, IndicatorDataType, Option, AggregationType, StatusThresholds } from '../types';
import { DEFAULT_STATUS_THRESHOLDS } from '../constants';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import Select from './ui/Select';
import Button from './ui/Button';

interface IndicatorFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (indicatorData: Omit<Indicator, 'id' | 'projectId'> | Indicator) => void;
  initialData?: Indicator;
  projectId: string;
}

const IndicatorForm: React.FC<IndicatorFormProps> = ({ isOpen, onClose, onSubmit, initialData, projectId }) => {
  const getInitialState = () => ({
    name: initialData?.name || '',
    description: initialData?.description || '',
    unitOfMeasure: initialData?.unitOfMeasure || '',
    dataType: initialData?.dataType || IndicatorDataType.Numeric,
    targetValue: initialData?.targetValue || '',
    calculationFormula: initialData?.calculationFormula || '',
    aggregationType: initialData?.aggregationType || AggregationType.NONE,
    dependsOnIndicatorIds: initialData?.dependsOnIndicatorIds?.join(', ') || '',
    disaggregationCategories: initialData?.disaggregationCategories?.join(', ') || '',
    minValue: initialData?.minValue ?? '', // Use ?? for empty string if undefined
    maxValue: initialData?.maxValue ?? '', // Use ?? for empty string if undefined
    statusThresholds: initialData?.statusThresholds || { ...DEFAULT_STATUS_THRESHOLDS },
  });

  const [formData, setFormData] = useState(getInitialState());

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialState());
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      statusThresholds: {
        ...prev.statusThresholds,
        [name]: parseFloat(value) || 0,
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalTargetValue: string | number = formData.targetValue;
    if (formData.dataType === IndicatorDataType.Numeric || formData.dataType === IndicatorDataType.Percentage) {
        finalTargetValue = parseFloat(formData.targetValue as string);
        if (isNaN(finalTargetValue)) {
            alert("Target value must be a number for Numeric or Percentage types.");
            return;
        }
    }

    const indicatorPayload = {
      ...formData,
      targetValue: finalTargetValue,
      minValue: formData.minValue !== '' ? parseFloat(String(formData.minValue)) : undefined,
      maxValue: formData.maxValue !== '' ? parseFloat(String(formData.maxValue)) : undefined,
      dependsOnIndicatorIds: formData.dependsOnIndicatorIds.split(',').map(s => s.trim()).filter(s => s),
      disaggregationCategories: formData.disaggregationCategories.split(',').map(s => s.trim()).filter(s => s),
      statusThresholds: {
        offTrackLessThan: parseFloat(String(formData.statusThresholds.offTrackLessThan)),
        atRiskLessThan: parseFloat(String(formData.statusThresholds.atRiskLessThan)),
      }
    };
    
    if (indicatorPayload.statusThresholds.offTrackLessThan >= indicatorPayload.statusThresholds.atRiskLessThan) {
      alert("'Off Track Less Than' threshold must be lower than 'At Risk Less Than' threshold.");
      return;
    }


    if (initialData) {
      onSubmit({ ...initialData, ...indicatorPayload });
    } else {
      onSubmit({ ...indicatorPayload, projectId });
    }
    onClose();
  };

  const dataTypeOptions: Option[] = Object.values(IndicatorDataType).map(value => ({ value, label: value }));
  const aggregationTypeOptions: Option[] = Object.values(AggregationType).map(value => ({ value, label: value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Indicator' : 'Add New Indicator'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Indicator Name" id="indicatorName" name="name" value={formData.name} onChange={handleChange} required />
        <Textarea label="Description" id="indicatorDescription" name="description" value={formData.description} onChange={handleChange} required />
        <Input label="Unit of Measure" id="unitOfMeasure" name="unitOfMeasure" value={formData.unitOfMeasure} onChange={handleChange} required />
        <Select label="Data Type" id="dataType" name="dataType" options={dataTypeOptions} value={formData.dataType} onChange={handleChange} required />
        
        {formData.dataType === IndicatorDataType.Numeric && (
          <Input label="Target Value (Numeric)" id="targetValue" name="targetValue" type="number" step="any" value={formData.targetValue as string} onChange={handleChange} required />
        )}
        {formData.dataType === IndicatorDataType.Percentage && (
          <Input label="Target Value (Percentage 0-100)" id="targetValue" name="targetValue" type="number" step="any" min="0" max="100" value={formData.targetValue as string} onChange={handleChange} required />
        )}
        {formData.dataType === IndicatorDataType.Text && (
          <Input label="Target Value (Text)" id="targetValue" name="targetValue" type="text" value={formData.targetValue as string} onChange={handleChange} required />
        )}

        <h4 className="text-md font-semibold pt-2 border-t mt-6 text-neutral-700">Advanced Configuration (Optional)</h4>
        
        <Input label="Calculation Formula" id="calculationFormula" name="calculationFormula" value={formData.calculationFormula} onChange={handleChange} placeholder="e.g., (ind_A / ind_B) * 100" />
        <Select label="Aggregation Type" id="aggregationType" name="aggregationType" options={aggregationTypeOptions} value={formData.aggregationType} onChange={handleChange} />
        <Input label="Depends on Indicator IDs (comma-separated)" id="dependsOnIndicatorIds" name="dependsOnIndicatorIds" value={formData.dependsOnIndicatorIds} onChange={handleChange} placeholder="e.g., id_1, id_2" />
        <Input label="Disaggregation Categories (comma-separated)" id="disaggregationCategories" name="disaggregationCategories" value={formData.disaggregationCategories} onChange={handleChange} placeholder="e.g., Gender, Location" />

        {formData.dataType === IndicatorDataType.Numeric || formData.dataType === IndicatorDataType.Percentage ? (
            <>
                <Input label="Minimum Value (Validation)" id="minValue" name="minValue" type="number" step="any" value={formData.minValue as string} onChange={handleChange} />
                <Input label="Maximum Value (Validation)" id="maxValue" name="maxValue" type="number" step="any" value={formData.maxValue as string} onChange={handleChange} />
            </>
        ) : null}


        <h4 className="text-md font-semibold pt-2 border-t mt-6 text-neutral-700">Status Thresholds (for Numeric/Percentage)</h4>
        <div className="grid grid-cols-2 gap-4">
            <Input 
                label="Off Track If Less Than (%)" 
                id="offTrackLessThan" 
                name="offTrackLessThan" 
                type="number" 
                step="any" 
                min="0" max="100"
                value={formData.statusThresholds.offTrackLessThan} 
                onChange={handleThresholdChange} 
            />
            <Input 
                label="At Risk If Less Than (%)" 
                id="atRiskLessThan" 
                name="atRiskLessThan" 
                type="number" 
                step="any" 
                min="0" max="100"
                value={formData.statusThresholds.atRiskLessThan} 
                onChange={handleThresholdChange} 
            />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">{initialData ? 'Save Changes' : 'Add Indicator'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default IndicatorForm;
