import React from 'react';
import { Project } from '../types';
import Button from './ui/Button';
import { EditIcon } from '../constants';

interface ProjectHeaderProps {
  project: Project;
  onEditProject: () => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project, onEditProject }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-start mb-2">
        <h1 className="text-3xl font-bold text-primary">{project.name}</h1>
        <Button variant="ghost" size="sm" onClick={onEditProject} leftIcon={<EditIcon className="w-4 h-4"/>}>
          Edit Project
        </Button>
      </div>
      <p className="text-neutral-600 mb-4">{project.description}</p>
      <div className="flex flex-col sm:flex-row sm:space-x-6 text-sm text-neutral-500">
        <span>
          <strong>Start Date:</strong> {new Date(project.startDate).toLocaleDateString()}
        </span>
        <span>
          <strong>End Date:</strong> {new Date(project.endDate).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default ProjectHeader;