
import type { Plant, Weather, Task, DayOfWeek, TaskCategory, TaskPriority, MovementProfile } from '../types';

let taskIdCounter = 0;

const createTask = (
    day: DayOfWeek,
    title: string,
    description: string,
    category: TaskCategory,
    priority: TaskPriority,
    movement: MovementProfile,
    plant: Plant | null = null,
): Task => {
    return {
        id: `task-${taskIdCounter++}`,
        plantId: plant ? plant.id : null,
        day,
        title,
        description,
        category,
        priority,
        movement,
        isCompleted: false,
    };
};

// A pool of generic, repeatable tasks to ensure every day has activities
const routineTasks: Omit<Task, 'id' | 'plantId' | 'day' | 'isCompleted'>[] = [
    { title: 'Weed Check', description: 'Take a 5-minute walk and pull any new weeds you see.', category: 'Maintenance', priority: 'Low', movement: 'hinge_and_squat' },
    { title: 'Observe for New Growth', description: 'Look closely at your plants. Can you spot any new leaves, buds, or shoots?', category: 'Maintenance', priority: 'Low', movement: 'light_standing' },
    { title: 'Check Soil Moisture', description: 'Feel the soil about an inch deep. Is it dry, moist, or wet?', category: 'Watering', priority: 'Medium', movement: 'hinge_and_squat' },
    { title: 'Rotate Potted Plants', description: 'Give any potted plants a quarter turn to ensure even sun exposure.', category: 'Maintenance', priority: 'Low', movement: 'carry_push' },
    { title: 'Top Up Mulch', description: 'Check for any bare spots and top up the mulch layer to retain moisture.', category: 'Mulching', priority: 'Medium', movement: 'hinge_and_squat'},
];


export const generateWeeklyTasks = (plants: Plant[], weather: Weather): Task[] => {
    const tasks: Task[] = [];
    taskIdCounter = 0; // Reset for predictability

    weather.forecast.forEach(dayForecast => {
        const dailyTasks: Task[] = [];

        // --- Plant-Specific Tasks ---
        plants.forEach(plant => {
            // Watering Tasks
            if (dayForecast.maxTempC > 28 && dayForecast.chanceOfRain < 30) {
                dailyTasks.push(createTask(dayForecast.day, `Deep Water: ${plant.name}`, `It's hot! Give your ${plant.name} a thorough soak at the base.`, 'Watering', 'High', 'carry_push', plant));
            }

            // Feeding Tasks
            if (['Flowering', 'Fruiting'].includes(plant.phenology) && dayForecast.day === 'Sunday') {
                dailyTasks.push(createTask(dayForecast.day, `Feed: ${plant.name}`, `Boost your ${plant.name} with some liquid fertilizer to support its growth.`, 'Feeding', 'Medium', 'hinge_and_squat', plant));
            }

            // Pest Control
            if (dayForecast.day === 'Wednesday' && plant.category !== 'Flower') {
                 dailyTasks.push(createTask(dayForecast.day, `Pest Scout: ${plant.name}`, `Inspect leaves (top and bottom) for pests like aphids or mites.`, 'Pest Control', 'Medium', 'stretch_reach', plant));
            }
            
            // Fruiting Support
            if (plant.phenology === 'Fruiting' && (plant.category === 'Vegetable' || plant.category === 'Berry or Vine')) {
                dailyTasks.push(createTask(dayForecast.day, `Support: ${plant.name}`, `Check that any trellises, stakes, or supports are secure for your ${plant.name}.`, 'Fruiting Support', 'Medium', 'carry_push', plant));
            }
             
            // Maintenance
            if (dayForecast.day === 'Saturday') {
                 dailyTasks.push(createTask(dayForecast.day, `Tidy Up: ${plant.name}`, `Remove any yellowed leaves or debris from around your ${plant.name}.`, 'Maintenance', 'Low', 'light_standing', plant));
            }
        });

        // --- General Daily Tasks ---
        // Add a selection of routine tasks to pad out the day
        routineTasks.forEach((routineTask, index) => {
            // Use modulo to distribute routine tasks across days of the week to avoid repetition
            if ( (taskIdCounter + index) % weather.forecast.length === weather.forecast.findIndex(d => d.day === dayForecast.day) ) {
                dailyTasks.push(createTask(
                    dayForecast.day,
                    routineTask.title,
                    routineTask.description,
                    routineTask.category,
                    routineTask.priority,
                    routineTask.movement
                ));
            }
        });
        
        // Add general pest check
        if (dayForecast.day === 'Tuesday') {
            dailyTasks.push(createTask(dayForecast.day, 'Garden Pest Patrol', 'Do a general walk-through and check for common pests on all plants.', 'Pest Control', 'Medium', 'light_standing'));
        }
        
        // Add general mulch check
        if (dayForecast.day === 'Friday') {
            dailyTasks.push(createTask(dayForecast.day, 'Mulch Layer Check', 'Ensure mulch is not touching stems and is at least 2 inches thick.', 'Mulching', 'Low', 'hinge_and_squat'));
        }

        tasks.push(...dailyTasks);
    });

    return tasks;
};
