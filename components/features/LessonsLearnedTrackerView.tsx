
import React from 'react';
import { LessonLearned, ModalDataLessonLearned } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { PlusIcon, ClipboardListIcon, EditIcon, DeleteIcon } from '../../constants';

interface LessonsLearnedTrackerViewProps {
  lessonsLearned: LessonLearned[];
  activeProjectName: string | undefined;
  activeProjectId: string | null;
  onOpenModal: (type: 'ADD_LESSON_LEARNED' | 'EDIT_LESSON_LEARNED', data: ModalDataLessonLearned) => void;
  onDeleteLesson: (lessonId: string) => void;
}

const LessonsLearnedTrackerView: React.FC<LessonsLearnedTrackerViewProps> = ({ 
  lessonsLearned, 
  activeProjectName, 
  activeProjectId,
  onOpenModal,
  onDeleteLesson
}) => {

  if (!activeProjectId) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <p className="text-neutral-600">Please select an active project to manage lessons learned.</p>
      </div>
    );
  }

  const projectLessons = lessonsLearned.filter(lesson => lesson.projectId === activeProjectId);

  const getCategoryBadgeColor = (category: LessonLearned['category']) => {
    switch(category) {
      case 'Positive': return 'green';
      case 'Negative': return 'red';
      case 'Neutral': return 'gray';
      case 'Observation': return 'blue';
      case 'Recommendation': return 'purple';
      default: return 'gray';
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-primary-dark mb-2 sm:mb-0 flex items-center">
          <ClipboardListIcon className="w-7 h-7 mr-3 text-primary"/>
          Lessons Learned Tracker
        </h2>
        <Button 
          onClick={() => onOpenModal('ADD_LESSON_LEARNED', { projectId: activeProjectId })}
          leftIcon={<PlusIcon />}
        >
          Add New Lesson
        </Button>
      </div>
      {activeProjectName && <p className="text-md text-neutral-600 mb-6">For Project: {activeProjectName}</p>}

      {projectLessons.length === 0 ? (
        <Card className="text-center py-10">
          <ClipboardListIcon className="mx-auto h-16 w-16 text-neutral-300 mb-4" />
          <h3 className="text-xl font-medium text-neutral-700">No Lessons Documented Yet</h3>
          <p className="text-neutral-500 mb-4">Capture valuable insights and experiences from your project.</p>
           <Button 
            onClick={() => onOpenModal('ADD_LESSON_LEARNED', { projectId: activeProjectId })}
            leftIcon={<PlusIcon />}
          >
            Add First Lesson
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {projectLessons.sort((a,b) => new Date(b.dateDocumented).getTime() - new Date(a.dateDocumented).getTime()).map(lesson => (
            <Card key={lesson.id} className="group">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-primary flex-grow mr-2">{lesson.title}</h3>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => onOpenModal('EDIT_LESSON_LEARNED', { lesson, projectId: activeProjectId })}
                        aria-label="Edit lesson"
                    >
                        <EditIcon className="w-4 h-4"/>
                    </Button>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-500 hover:bg-red-100"
                        onClick={() => {
                           if(window.confirm(`Are you sure you want to delete the lesson: "${lesson.title}"?`)) {
                                onDeleteLesson(lesson.id);
                           }
                        }}
                        aria-label="Delete lesson"
                    >
                        <DeleteIcon className="w-4 h-4"/>
                    </Button>
                </div>
              </div>
              <div className="flex items-center space-x-3 mb-2">
                <Badge colorScheme={getCategoryBadgeColor(lesson.category)}>{lesson.category}</Badge>
                <p className="text-xs text-neutral-500">
                  Date: {new Date(lesson.dateDocumented).toLocaleDateString()}
                </p>
              </div>
              <div className="prose prose-sm max-w-none custom-scrollbar max-h-40 overflow-y-auto">
                <p>{lesson.description}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LessonsLearnedTrackerView;
