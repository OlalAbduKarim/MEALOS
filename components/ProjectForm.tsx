import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import Button from './ui/Button';

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: Omit<Project, 'id'> | Project) => void;
  initialData?: Project;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setStartDate(initialData.startDate);
      setEndDate(initialData.endDate);
    } else {
      // Reset form for new project
      setName('');
      setDescription('');
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]); // Default to one year from today
    }
  }, [initialData, isOpen]); // Depend on isOpen to reset when modal reopens

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(startDate) > new Date(endDate)) {
        alert("Start date cannot be after end date.");
        return;
    }
    const projectData = { name, description, startDate, endDate };
    if (initialData) {
      onSubmit({ ...initialData, ...projectData });
    } else {
      onSubmit(projectData);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Project Details' : 'Create New Project'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Project Name" 
          id="projectName" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
          placeholder="e.g., Community Health Initiative"
        />
        <Textarea 
          label="Project Description" 
          id="projectDescription" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          required 
          rows={4}
          placeholder="Briefly describe the project's goals and scope."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Start Date" 
            id="projectStartDate" 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            required 
          />
          <Input 
            label="End Date" 
            id="projectEndDate" 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            required 
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">{initialData ? 'Save Changes' : 'Create Project'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectForm;
