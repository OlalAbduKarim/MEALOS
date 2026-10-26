
import React, { useState, useEffect } from 'react';
import { DataPoint, IndicatorDataType, Indicator } from '../types';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import Button from './ui/Button';

interface DataPointFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dataPointData: Omit<DataPoint, 'id' | 'indicatorId'>) => void;
  indicator: Indicator; // Pass the full indicator object
}

const DataPointForm: React.FC<DataPointFormProps> = ({ isOpen, onClose, onSubmit, indicator }) => {
  const getInitialState = () => {
    const initialTags: Record<string, string | number> = {};
    if (indicator.disaggregationCategories) {
      indicator.disaggregationCategories.forEach(cat => {
        initialTags[cat] = '';
      });
    }
    return {
      actualValue: '',
      collectionDate: new Date().toISOString().split('T')[0],
      notes: '',
      tags: initialTags,
    };
  };
  
  const [formData, setFormData] = useState(getInitialState());

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialState());
    }
  }, [isOpen, indicator.disaggregationCategories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagChange = (category: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      tags: {
        ...prev.tags,
        [category]: value,
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalActualValue: string | number = formData.actualValue;

    if (indicator.dataType === IndicatorDataType.Numeric || indicator.dataType === IndicatorDataType.Percentage) {
        finalActualValue = parseFloat(formData.actualValue as string);
        if (isNaN(finalActualValue)) {
            alert("Actual value must be a number for this indicator type.");
            return;
        }
        // Basic Min/Max Validation
        if (indicator.minValue !== undefined && finalActualValue < indicator.minValue) {
            alert(`Actual value (${finalActualValue}) cannot be less than the minimum value (${indicator.minValue}).`);
            return;
        }
        if (indicator.maxValue !== undefined && finalActualValue > indicator.maxValue) {
            alert(`Actual value (${finalActualValue}) cannot be greater than the maximum value (${indicator.maxValue}).`);
            return;
        }
        if (indicator.dataType === IndicatorDataType.Percentage) {
            if (finalActualValue < 0 || finalActualValue > 100) {
                 alert("Percentage value must be between 0 and 100.");
                 return;
            }
        }
    }
    
    // Check if all disaggregation tags are filled if categories exist
    if (indicator.disaggregationCategories && indicator.disaggregationCategories.length > 0) {
      for (const category of indicator.disaggregationCategories) {
        if (!formData.tags[category] && String(formData.tags[category]).trim() === '') {
          alert(`Please provide a value for the disaggregation category: "${category}".`);
          return;
        }
      }
    }


    onSubmit({
      actualValue: finalActualValue,
      collectionDate: formData.collectionDate,
      notes: formData.notes,
      tags: formData.tags,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Data for: ${indicator.name}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {indicator.dataType === IndicatorDataType.Numeric && (
          <Input label="Actual Value (Numeric)" id="actualValue" name="actualValue" type="number" step="any" value={formData.actualValue as string} onChange={handleChange} required />
        )}
        {indicator.dataType === IndicatorDataType.Percentage && (
          <Input label="Actual Value (Percentage 0-100)" id="actualValue" name="actualValue" type="number" step="any" min="0" max="100" value={formData.actualValue as string} onChange={handleChange} required />
        )}
        {indicator.dataType === IndicatorDataType.Text && (
          <Input label="Actual Value (Text)" id="actualValue" name="actualValue" type="text" value={formData.actualValue as string} onChange={handleChange} required />
        )}

        <Input label="Collection Date" id="collectionDate" name="collectionDate" type="date" value={formData.collectionDate} onChange={handleChange} required />
        <Textarea label="Notes (Optional)" id="notes" name="notes" value={formData.notes} onChange={handleChange} />
        
        {indicator.disaggregationCategories && indicator.disaggregationCategories.length > 0 && (
          <div className="space-y-3 pt-3 border-t">
            <h4 className="text-md font-semibold text-neutral-700">Disaggregation Data:</h4>
            {indicator.disaggregationCategories.map(category => (
              <Input 
                key={category}
                label={category}
                id={`tag-${category}`}
                name={`tag-${category}`}
                value={formData.tags[category] as string || ''}
                onChange={(e) => handleTagChange(category, e.target.value)}
                required
                placeholder={`Enter value for ${category}`}
              />
            ))}
          </div>
        )}
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save Data Point</Button>
        </div>
      </form>
    </Modal>
  );
};

export default DataPointForm;
