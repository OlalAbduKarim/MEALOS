
import React from 'react';
import { Project, FrameworkTemplateType, TheoryOfChangeFramework, LogFrameFramework, ResultsChainFramework } from '../types';
import { MOCK_TOC_TEMPLATE, MOCK_LOGFRAME_TEMPLATE, MOCK_RESULTS_CHAIN_TEMPLATE } from '../constants';
import Button from './ui/Button';
import Card from './ui/Card';
import { PlusIcon, FrameworkIcon, BriefcaseIcon, LightBulbIcon, ShareIcon } from '../constants';
import ProjectCard from './ProjectCard'; 

interface HomeScreenProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onCreateNewProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onLoadFrameworkTemplate: (type: FrameworkTemplateType, data: any) => void;
}

interface TemplateCardData {
  id: FrameworkTemplateType;
  name: string;
  description: string;
  icon: React.ReactElement<{ className?: string }>;
  data: Omit<TheoryOfChangeFramework, 'id' | 'projectId' | 'lastUpdated'> | Omit<LogFrameFramework, 'id' | 'projectId' | 'lastUpdated'> | Omit<ResultsChainFramework, 'id' | 'projectId' | 'lastUpdated'>;
}

const FRAMEWORK_TEMPLATES: TemplateCardData[] = [
  { 
    id: 'logframe', 
    name: 'Logical Framework', 
    description: 'Define project hierarchy, indicators, MoVs, and assumptions using a standard LogFrame structure.', 
    icon: <FrameworkIcon className="w-10 h-10 text-primary" />,
    data: MOCK_LOGFRAME_TEMPLATE
  },
  { 
    id: 'toc', 
    name: 'Theory of Change', 
    description: 'Visually map out the causal pathways from inputs and activities to long-term impact.', 
    icon: <LightBulbIcon className="w-10 h-10 text-secondary" />,
    data: MOCK_TOC_TEMPLATE
  },
  { 
    id: 'results_chain', 
    name: 'Results Chain', 
    description: 'Focus on the sequence of results from inputs/activities to short, medium, and long-term outcomes/impact.', 
    icon: <ShareIcon className="w-10 h-10 text-accent" />,
    data: MOCK_RESULTS_CHAIN_TEMPLATE
  },
];

const HomeScreen: React.FC<HomeScreenProps> = ({ 
    projects, 
    onSelectProject, 
    onCreateNewProject, 
    onEditProject, 
    onDeleteProject,
    onLoadFrameworkTemplate
}) => {
  return (
    <div className="p-4 sm:p-8 space-y-12">
      {/* Welcome/Intro Section */}
      <section className="text-center bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-4xl font-bold text-primary mb-4">M&E Software Platform</h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Streamline your Monitoring & Evaluation processes. Define frameworks, track indicators, collect data, and generate insightful reports all in one place.
        </p>
      </section>

      {/* Templates Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-neutral-700">Start with a Model Framework</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FRAMEWORK_TEMPLATES.map(template => (
            <Card 
              key={template.id} 
              className="text-center hover:bg-neutral-50 cursor-pointer" 
              onClick={() => onLoadFrameworkTemplate(template.id, template.data)}
            >
              <div className="flex flex-col items-center p-4">
                {React.cloneElement(template.icon, { className: "w-12 h-12 mb-4" })}
                <h3 className="text-xl font-semibold text-primary-dark mb-2">{template.name}</h3>
                <p className="text-sm text-neutral-600">{template.description}</p>
              </div>
            </Card>
          ))}
        </div>
         <p className="text-sm text-neutral-500 mt-4 text-center">
            Select a template to load its structure into an active project's editor. You must have a project selected or create one first.
        </p>
      </section>

      {/* Existing Projects Section */}
      <section>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-neutral-700">Your Projects</h2>
          <Button onClick={onCreateNewProject} leftIcon={<PlusIcon />} className="mt-4 sm:mt-0">
            Create New Project
          </Button>
        </div>
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onSelectProject={() => onSelectProject(project.id)}
                onEditProject={() => onEditProject(project)}
                onDeleteProject={() => onDeleteProject(project.id)}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center">
             <BriefcaseIcon className="mx-auto h-16 w-16 text-neutral-400 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-700 mb-2">No Projects Yet</h3>
            <p className="text-neutral-500 mb-6">Get started by creating your first M&E project.</p>
            <Button onClick={onCreateNewProject} leftIcon={<PlusIcon />}>
              Create New Project
            </Button>
          </Card>
        )}
      </section>
    </div>
  );
};

export default HomeScreen;
