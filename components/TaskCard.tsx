import React from 'react';
import type { Task, Plant, TaskCategory } from '../types';
import { CheckIcon, WateringCanIcon, FertilizerIcon, BugIcon, ShieldIcon, PrunersIcon, TrashIcon, MulchIcon, TrellisIcon } from './icons/Icons';

interface TaskCardProps {
  task: Task;
  plant: Plant | undefined;
  onToggleComplete: (task: Task, isCompleted: boolean) => void;
  onDismiss: (taskId: string) => void;
}

const TaskCategoryIcon: React.FC<{ category: TaskCategory; className?: string }> = ({ category, className = "h-6 w-6" }) => {
    switch(category) {
        case 'Watering': return <WateringCanIcon className={className} />;
        case 'Feeding': return <FertilizerIcon className={className} />;
        case 'Pest Control': return <BugIcon className={className} />;
        case 'Protection': return <ShieldIcon className={className} />;
        case 'Maintenance': return <PrunersIcon className={className} />;
        case 'Mulching': return <MulchIcon className={className} />;
        case 'Fruiting Support': return <TrellisIcon className={className} />;
        default: return <CheckIcon className={className} />;
    }
};

const priorityStyles: { [key in Task['priority']]: { bg: string, text: string, ring: string } } = {
    High: { bg: 'bg-red-100', text: 'text-red-800', ring: 'ring-red-300' },
    Medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', ring: 'ring-yellow-300' },
    Low: { bg: 'bg-green-100', text: 'text-green-800', ring: 'ring-green-300' },
};

const TaskCard: React.FC<TaskCardProps> = ({ task, plant, onToggleComplete, onDismiss }) => {
  const { priority } = task;

  return (
    <div className={`group relative p-4 rounded-xl shadow-md transition-all duration-300 flex items-start space-x-4 ${task.isCompleted ? 'bg-white/60 opacity-70' : 'bg-white/90 hover:shadow-lg'}`}>
        <div className="flex-shrink-0 pt-1">
          <div className={`p-3 rounded-full ${priorityStyles[priority].bg}`}>
            <TaskCategoryIcon category={task.category} className={`h-6 w-6 ${priorityStyles[priority].text}`} />
          </div>
        </div>

        <div className="flex-grow">
            <div className="flex justify-between items-start">
                <h4 id={`task-title-${task.id}`} className={`font-bold text-gray-800 ${task.isCompleted ? 'line-through' : ''}`}>{task.title}</h4>
                <div className="relative flex items-center">
                    <input
                        type="checkbox"
                        checked={task.isCompleted}
                        onChange={(e) => onToggleComplete(task, e.target.checked)}
                        className={`appearance-none h-6 w-6 rounded-full border-2 transition-colors cursor-pointer ${
                            task.isCompleted
                                ? `bg-green-500 border-green-500 ${priorityStyles[priority].ring}`
                                : `border-gray-300 hover:border-green-400`
                        }`}
                        aria-labelledby={`task-title-${task.id}`}
                    />
                    {task.isCompleted && <CheckIcon className="h-4 w-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />}
                </div>
            </div>

            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
            
            <div className="flex flex-wrap gap-2 mt-3 text-xs font-semibold">
                {plant && (
                    <span className="flex items-center bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {plant.icon} <span className="ml-1.5">{plant.name}</span>
                    </span>
                )}
                 <span className={`px-2 py-1 rounded-full ${priorityStyles[priority].bg} ${priorityStyles[priority].text}`}>{priority} Priority</span>
            </div>
        </div>
        
        {!task.isCompleted && (
          <button
            onClick={() => onDismiss(task.id)}
            className="absolute bottom-2 right-2 p-1 rounded-full bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 focus:opacity-100"
            aria-label={`Dismiss task: ${task.title}`}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
    </div>
  );
};

export default TaskCard;