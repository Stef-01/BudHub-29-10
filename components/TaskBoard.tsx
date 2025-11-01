import React, { useState, useMemo } from 'react';
import type { DayOfWeek, TaskCategory } from '../types';
import { useUserGarden } from '../contexts/UserGardenContext';
import { useTasks } from '../contexts/TasksContext';
import TaskCard from './TaskCard';
import { WateringCanIcon, FertilizerIcon, BugIcon, ShieldIcon, PrunersIcon, MulchIcon, TrellisIcon } from './icons/Icons';

const WEEK_DAYS: DayOfWeek[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TASK_CATEGORIES: TaskCategory[] = ['Watering', 'Feeding', 'Pest Control', 'Protection', 'Maintenance', 'Mulching', 'Fruiting Support'];
const TASKS_TO_SHOW_INITIALLY = 5;

const categoryIcons: Record<TaskCategory, React.ReactNode> = {
    'Watering': <WateringCanIcon className="h-5 w-5 mr-2" />,
    'Feeding': <FertilizerIcon className="h-5 w-5 mr-2" />,
    'Pest Control': <BugIcon className="h-5 w-5 mr-2" />,
    'Protection': <ShieldIcon className="h-5 w-5 mr-2" />,
    'Maintenance': <PrunersIcon className="h-5 w-5 mr-2" />,
    'Mulching': <MulchIcon className="h-5 w-5 mr-2" />,
    'Fruiting Support': <TrellisIcon className="h-5 w-5 mr-2" />,
};

const getToday = (): DayOfWeek => {
    const todayIndex = new Date().getDay();
    return WEEK_DAYS[todayIndex];
};

const TaskBoard: React.FC = () => {
    const { myPlants } = useUserGarden();
    const { getTasksForDay, dismissTask, toggleTaskComplete, getAllTasks, loading: tasksLoading } = useTasks();

    const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getToday());
    const [hiddenCategories, setHiddenCategories] = useState<Set<TaskCategory>>(new Set());
    const [visibleTaskCount, setVisibleTaskCount] = useState(TASKS_TO_SHOW_INITIALLY);

    const handleToggleCategory = (category: TaskCategory) => {
        setHiddenCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    const handleDayChange = (day: DayOfWeek) => {
        setSelectedDay(day);
        setVisibleTaskCount(TASKS_TO_SHOW_INITIALLY); // Reset count when changing day
    };

    const tasksForDay = useMemo(() => getTasksForDay(selectedDay), [getTasksForDay, selectedDay]);

    const filteredTasks = useMemo(() => {
        return tasksForDay.filter(task => !hiddenCategories.has(task.category));
    }, [tasksForDay, hiddenCategories]);

    const visibleTasks = filteredTasks.slice(0, visibleTaskCount);
    const hasMoreTasks = filteredTasks.length > visibleTaskCount;

    if (tasksLoading) {
        return <div className="text-center p-8">Loading tasks...</div>;
    }

    if (getAllTasks().length === 0 && myPlants.length > 0) {
         return (
            <div className="text-center p-8 bg-white/80 rounded-xl">
                <h3 className="text-xl font-semibold text-gray-700">All quiet this week!</h3>
                <p className="text-gray-500 mt-2">Your garden is happy. No specific tasks generated based on the weather.</p>
            </div>
        )
    }

    if (myPlants.length === 0) {
        return (
            <div className="text-center p-8 bg-white/80 rounded-xl">
                <h3 className="text-xl font-semibold text-gray-700">No tasks this week!</h3>
                <p className="text-gray-500 mt-2">Add some plants to your garden to see your personalized task list.</p>
            </div>
        )
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-green-900 mb-4">This Week's Vibe</h2>

            {/* Day Selector */}
            <div className="mb-6 overflow-x-auto">
                <div className="flex border-b border-gray-200">
                    {WEEK_DAYS.map(day => (
                        <button
                            key={day}
                            onClick={() => handleDayChange(day)}
                            className={`px-4 py-2 text-sm font-medium whitespace-nowrap -mb-px border-b-2 ${
                                selectedDay === day
                                ? 'border-green-600 text-green-700'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Category Filters */}
            <div className="mb-6">
                <p className="text-sm font-semibold text-gray-600 mb-2">Filters:</p>
                <div className="flex flex-wrap gap-2">
                    {TASK_CATEGORIES.map(category => {
                        const isHidden = hiddenCategories.has(category);
                        return (
                            <button
                                key={category}
                                onClick={() => handleToggleCategory(category)}
                                className={`flex items-center px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                                    isHidden
                                    ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                                }`}
                            >
                                {categoryIcons[category]}
                                <span className={isHidden ? 'line-through' : ''}>{category}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Task List */}
            {visibleTasks.length > 0 ? (
                <div className="space-y-4">
                    {visibleTasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            plant={myPlants.find(p => p.id === task.plantId)}
                            onToggleComplete={toggleTaskComplete}
                            onDismiss={dismissTask}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center p-8 bg-white/80 rounded-xl">
                    <p className="text-gray-600">No tasks for today, or you've filtered them all out!</p>
                </div>
            )}
            
            {/* See More Button */}
            {hasMoreTasks && (
                <div className="mt-6 text-center">
                    <button
                        onClick={() => setVisibleTaskCount(prev => prev + 5)}
                        className="px-6 py-2 bg-white text-green-700 border border-green-300 rounded-full font-semibold hover:bg-green-50 transition-colors"
                    >
                        See More Tasks
                    </button>
                </div>
            )}
        </div>
    );
};

export default TaskBoard;