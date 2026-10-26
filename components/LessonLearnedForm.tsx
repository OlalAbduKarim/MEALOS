
import React, { useState, useEffect } from 'react';
import { LessonLearned, Option } from '../types';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import Select from './ui/Select';
import Button from './ui/Button';

interface LessonLearnedFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (lessonData: Omit<LessonLearned, 'id' | 'projectId'> | LessonLearned) => void;
  initialData?: LessonLearned;
  projectId: string;
}

const lessonCategories: Option[] = [
  { value: 'Positive', label: 'Positive Outcome / Success Factor' },
  { value: 'Negative', label: 'Challenge / Obstacle Faced' },
  { value: 'Neutral', label: 'General Observation' },
  { value: 'Observation', label: 'Key Observation' },
  { value: 'Recommendation', label: 'Recommendation for Future' },
];

const LessonLearnedForm: React.FC<LessonLearnedFormProps> = ({ isOpen, onClose, onSubmit, initialData, projectId }) => {
  const getInitialState = () => ({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'Observation',
    dateDocumented: initialData?.dateDocumented || new Date().toISOString().split('T')[0],
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      alert("Title and description are required for a lesson learned.");
      return;
    }
    
    const payload = {
      ...formData,
      category: formData.category as LessonLearned['category'], // Ensure type
    };

    if (initialData) {
      onSubmit({ ...initialData, ...payload });
    } else {
      onSubmit({ ...payload, projectId });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Lesson Learned' : 'Add New Lesson Learned'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title / Key Finding" id="lessonTitle" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g., Importance of early community engagement"/>
        <Textarea label="Detailed Description" id="lessonDescription" name="description" value={formData.description} onChange={handleChange} required rows={5} placeholder="Elaborate on the lesson, context, and implications..."/>
        <Select label="Category" id="lessonCategory" name="category" options={lessonCategories} value={formData.category} onChange={handleChange} required />
        <Input label="Date Documented" id="lessonDateDocumented" name="dateDocumented" type="date" value={formData.dateDocumented} onChange={handleChange} required />
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">{initialData ? 'Save Changes' : 'Add Lesson'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default LessonLearnedForm;
