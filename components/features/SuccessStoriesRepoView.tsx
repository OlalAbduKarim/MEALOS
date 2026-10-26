
import React from 'react';
import { SuccessStory, ModalDataSuccessStory } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { PlusIcon, BookOpenIcon, EditIcon, DeleteIcon } from '../../constants';

interface SuccessStoriesRepoViewProps {
  successStories: SuccessStory[];
  activeProjectName: string | undefined;
  activeProjectId: string | null;
  onOpenModal: (type: 'ADD_SUCCESS_STORY' | 'EDIT_SUCCESS_STORY', data: ModalDataSuccessStory) => void;
  onDeleteStory: (storyId: string) => void;
}

const SuccessStoriesRepoView: React.FC<SuccessStoriesRepoViewProps> = ({ 
  successStories, 
  activeProjectName, 
  activeProjectId,
  onOpenModal,
  onDeleteStory
}) => {

  if (!activeProjectId) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <p className="text-neutral-600">Please select an active project to manage success stories.</p>
      </div>
    );
  }
  
  const projectStories = successStories.filter(story => story.projectId === activeProjectId);

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-primary-dark mb-2 sm:mb-0 flex items-center">
          <BookOpenIcon className="w-7 h-7 mr-3 text-primary"/>
          Success Stories Repository
        </h2>
        <Button 
          onClick={() => onOpenModal('ADD_SUCCESS_STORY', { projectId: activeProjectId })}
          leftIcon={<PlusIcon />}
        >
          Add New Success Story
        </Button>
      </div>
      {activeProjectName && <p className="text-md text-neutral-600 mb-6">For Project: {activeProjectName}</p>}

      {projectStories.length === 0 ? (
        <Card className="text-center py-10">
          <BookOpenIcon className="mx-auto h-16 w-16 text-neutral-300 mb-4" />
          <h3 className="text-xl font-medium text-neutral-700">No Success Stories Yet</h3>
          <p className="text-neutral-500 mb-4">Share the positive impacts and achievements of your project.</p>
          <Button 
            onClick={() => onOpenModal('ADD_SUCCESS_STORY', { projectId: activeProjectId })}
            leftIcon={<PlusIcon />}
          >
            Add First Story
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {projectStories.sort((a,b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()).map(story => (
            <Card key={story.id} className="group">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-1">{story.title}</h3>
                  <p className="text-xs text-neutral-500 mb-2">
                    Date Documented: {new Date(story.dateAdded).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => onOpenModal('EDIT_SUCCESS_STORY', { story, projectId: activeProjectId })}
                        aria-label="Edit story"
                    >
                        <EditIcon className="w-4 h-4"/>
                    </Button>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-500 hover:bg-red-100"
                        onClick={() => {
                            if(window.confirm(`Are you sure you want to delete the story: "${story.title}"?`)) {
                                onDeleteStory(story.id);
                            }
                        }}
                        aria-label="Delete story"
                    >
                        <DeleteIcon className="w-4 h-4"/>
                    </Button>
                </div>
              </div>
              <div className="prose prose-sm max-w-none mt-2 custom-scrollbar max-h-48 overflow-y-auto">
                <p>{story.narrative}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuccessStoriesRepoView;
