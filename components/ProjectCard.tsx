
import React, { useEffect } from 'react';
import { Project } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import { EditIcon, DeleteIcon, BriefcaseIcon } from '../constants';

interface ProjectCardProps {
  project: Project;
  onSelectProject: () => void;
  onEditProject: () => void;
  onDeleteProject: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelectProject, onEditProject, onDeleteProject }) => {
  
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Fix: Remove styled-jsx and dynamically inject scrollbar styles
  useEffect(() => {
    const styleId = 'custom-scrollbar-styles';
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.innerHTML = `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #BDBDBD;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9E9E9E;
        }
        .custom-scrollbar { /* For Firefox */
          scrollbar-width: thin;
          scrollbar-color: #BDBDBD #f1f1f1;
        }
      `;
      document.head.appendChild(styleElement);
    }
  }, []);

  return (
    <Card className="flex flex-col h-full" onClick={onSelectProject}>
      <div className="flex-grow">
        <div className="flex items-center mb-3">
          <BriefcaseIcon className="w-6 h-6 text-primary mr-3"/>
          <h3 className="text-xl font-semibold text-primary-dark truncate" title={project.name}>{project.name}</h3>
        </div>
        <p className="text-sm text-neutral-600 mb-3 h-16 overflow-y-auto custom-scrollbar">{project.description}</p>
        <div className="text-xs text-neutral-500 space-y-1">
          <p><strong>Start:</strong> {new Date(project.startDate).toLocaleDateString()}</p>
          <p><strong>End:</strong> {new Date(project.endDate).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-2">
        <Button
            variant="primary"
            size="sm"
            onClick={(e) => { stopPropagation(e); onSelectProject(); }}
            className="w-full sm:w-auto"
        >
            Open Project
        </Button>
        <div className="flex space-x-2 w-full sm:w-auto">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => { stopPropagation(e); onEditProject(); }}
                leftIcon={<EditIcon />}
                className="flex-1 sm:flex-initial"
                aria-label={`Edit project ${project.name}`}
            >
                Edit
            </Button>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => { stopPropagation(e); onDeleteProject();}}
                className="text-red-600 hover:bg-red-100 border-red-300 hover:border-red-500 flex-1 sm:flex-initial"
                leftIcon={<DeleteIcon />}
                aria-label={`Delete project ${project.name}`}
            >
                Delete
            </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProjectCard;