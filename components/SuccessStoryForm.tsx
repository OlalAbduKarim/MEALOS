
import React, { useState, useEffect } from 'react';
import { SuccessStory } from '../types';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import Button from './ui/Button';

interface SuccessStoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (storyData: Omit<SuccessStory, 'id' | 'projectId'> | SuccessStory) => void;
  initialData?: SuccessStory;
  projectId: string;
}

const SuccessStoryForm: React.FC<SuccessStoryFormProps> = ({ isOpen, onClose, onSubmit, initialData, projectId }) => {
  const getInitialState = () => ({
    title: initialData?.title || '',
    narrative: initialData?.narrative || '',
    dateAdded: initialData?.dateAdded || new Date().toISOString().split('T')[0],
  });

  const [formData, setFormData] = useState(getInitialState());

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialState());
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.narrative.trim()) {
      alert("Title and narrative are required.");
      return;
    }
    
    if (initialData) {
      onSubmit({ ...initialData, ...formData });
    } else {
      onSubmit({ ...formData, projectId });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Success Story' : 'Add New Success Story'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title" id="storyTitle" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g., Health Clinic Transformation in Siyancoba"/>
        <Textarea label="Narrative" id="storyNarrative" name="narrative" value={formData.narrative} onChange={handleChange} required rows={6} placeholder="Describe the success story in detail..."/>
        <Input label="Date Documented" id="storyDateAdded" name="dateAdded" type="date" value={formData.dateAdded} onChange={handleChange} required />
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">{initialData ? 'Save Changes' : 'Add Story'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default SuccessStoryForm;
