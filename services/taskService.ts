// services/taskService.ts
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

// A pool of generic, repeatable tasks to ensure every day has activities, with a new focus on physical activity
const routineTasks: Omit<Task, 'id' | 'plantId' | 'day' | 'isCompleted'>[] = [
    { title: 'Weed Check', description: 'Take a 10-minute walk and pull any new weeds. Focus on deep-rooted ones for a better workout.', category: 'Maintenance', priority: 'Low', movement: 'hinge_and_squat' },
    { title: 'Observe for New Growth', description: 'Look closely at your plants. Can you spot any new leaves, buds, or shoots?', category: 'Maintenance', priority: 'Low', movement: 'light_standing' },
    { title: 'Check Soil Moisture', description: 'Feel the soil about an inch deep. Is it dry, moist, or wet?', category: 'Watering', priority: 'Medium', movement: 'hinge_and_squat' },
    { title: 'Turn Compost Pile', description: 'Aerate your compost pile with a garden fork. Great for your compost and a great workout!', category: 'Maintenance', priority: 'Medium', movement: 'carry_push' },
    { title: 'Garden Mobility', description: 'Take 10 minutes for mobility exercises. Focus on squats, lunges, and torso twists to support your gardening posture.', category: 'Maintenance', priority: 'Low', movement: 'stretch_reach' },
    { title: 'Bucket Brigade Watering', description: 'For a light workout, carry a few buckets of water to plants that need it instead of using a hose.', category: 'Watering', priority: 'Low', movement: 'carry_push' },
    { title: 'Pathway Patrol', description: 'Clear weeds and debris from garden pathways. Good for the garden and gets you squatting and bending.', category: 'Maintenance', priority: 'Medium', movement: 'hinge_and_squat' },
];

// Helper arrays for plant groups
const loquatGroup = ['Loquat', 'Bronze Loquat'];
const citrusGroup = ['Lemon', 'Lemonade Fruit', 'Lime', 'Mandarin', 'Grapefruit', 'Pomelo', 'Kumquat', 'Hong Kong Kumquat', 'Nimbu (Lemon/Lime)'];
const summerFruitGroup = [
    'Mango', 'Aam (Mango)', 'Achacha', 'Abiu', 'Canistel', 'Star Apple', 'White Sapote', 'Black Sapote', 'Rollinia', 'Cherimoya', 'Mountain Soursop', 'Sapodilla', 'Chikoo (Sapodilla)', 'Madrono',
    'Lychee', 'Longan', 'Wampee', 'Kwai Muk', 'Lakoocha', 'Fig', 'Pomegranate', 'Anar (Pomegranate)', 'Grapes', 'Angoor (Grape)', 'Muscadine Grape', 'Jujube', 'Ber (Indian Jujube)',
    'Olive', 'Pear', 'Quince', 'Brazilian Cherry', 'Grumichama', 'Cherry Rio Grande', 'Cherry Guava', 'Jaboticaba', 'Feijoa', 'Guava', 'Amrood (Guava)', 'Sea Grape',
    'Acerola', 'Capulin'
];
const longSeasonVinesGroup = ['Passionfruit', 'Ivy Gourd', 'Snake Gourd', 'Snake Gourd (Chichinda)', 'Orange Trumpet Vine', 'Rangoon Creeper', 'Mexican Creeper', 'Stephanotis'];
const cucurbits = ['Cucumber', 'Zucchini (Courgette)', 'Lauki (Bottle Gourd)', 'Karela (Bitter Gourd)', 'Turai (Ridge Gourd)', 'Kaddu (Pumpkin)', 'Watermelon', 'Ash Gourd (Petha)', 'Pointed Gourd (Parwal)', 'Snake Gourd (Chichinda)', 'Tinda (Indian Squash)', 'New Guinea Bean', 'Wax Gourd'];
const warmSeasonVegGroup = [
    'Brinjal (Eggplant)', 'Capsicum (Bell Pepper)', 'Chilli (Cayenne)', 'Chilli (Bhut Jolokia)', 'Chilli (Guntur)', 'Green Chilli', 'Bhindi (Okra)',
    'Snake Beans', 'Rosella', 'Genda (Marigold)', 'Four o’clock Flower', 'Globe Amaranth'
];
const rootTuberGroup = ['Cassava', 'Arrowroot', 'Arbi (Taro/Colocasia)', 'Oca Yam', 'Native Yam', 'Lotus Root'];
const herbSpiceGroup = [
    'Lemon Myrtle', 'Aniseed Myrtle', 'Cinnamon Myrtle', 'Allspice', 'Dalchini (Cinnamon)', 'Kadi Patta (Curry Leaves)', 'Elaichi (Cardamom)',
    'Elettaria Cardamom', 'Pepper', 'Lemongrass', 'Betel Leaf', 'Gotu Kola', 'Brahmi', 'Tea Plant',
    'Pandanus', 'Tej Patta (Bay Leaf)', 'Tulsi (Holy Basil)', 'Pudina (Mint)', 'Dhania (Coriander Leaves)'
];
const rhizomeGroup = ['Ginger', 'Galangal', 'Turmeric (Haldi)', 'Kencur', 'Mango Ginger', 'Arrowroot'];
const nutTreeGroup = ['Macadamia', 'Bunya Nut', 'Almond', 'Hazelnut', 'Pecan', 'Walnut', 'Malabar Chestnut', 'Candle Nut'];
const nativeEdiblesGroup = [
    'Davidson’s Plum', 'Burdekin Plum', 'Native Tamarind', 'Sandpaper Fig', 'Atherton Raspberry', 'Lilly Pilly', 'Peanut Tree', 'Warrigal Greens', 'Large Leaf Native Tamarind'
];
const palmsGroup = [
    'Alexandra Palm', 'Foxtail Palm', 'Kentia Palm', 'Solitary Palm', 'Walking-stick Palm', 'Golden Cane Palm', 'Majestic Palm', 'Red Neck Palm', 'Triangle Palm', 'Cuban Royal Palm', 'Fishtail Palm'
];
const ornamentalsGroup = [
    'Frangipani', 'Gudhal (Hibiscus)', 'Water Hibiscus', 'Pride of Barbados', 'Crape Myrtle', 'Queen of the Night', 'Chinese Tulip Tree', 'Magnolia Macrophylla',
    'Butterfly Bush', 'Butterfly Ginger', 'Stephanotis', 'Vetiver Grass', 'Bamboo', 'Rice-paper Tree', 'Gulab (Rose)', 'Mogra (Jasmine Sambac)',
    'Aparajita (Butterfly Pea)', 'Parijat (Night-flowering Jasmine)'
];

export const generateWeeklyTasks = (plants: Plant[], weather: Weather): Task[] => {
    const tasks: Task[] = [];
    taskIdCounter = 0; // Reset for predictability

    const currentMonth = new Date().getMonth(); // 0 = Jan, 11 = Dec
    const isWinter = [5, 6, 7].includes(currentMonth); // Jun, Jul, Aug
    const isSpring = [8, 9, 10].includes(currentMonth); // Sep, Oct, Nov
    const isSummer = [11, 0, 1].includes(currentMonth); // Dec, Jan, Feb
    const isAutumn = [2, 3, 4].includes(currentMonth); // Mar, Apr, May

    const dailyTaskMap: Map<DayOfWeek, Task[]> = new Map(weather.forecast.map(day => [day.day, []]));

    weather.forecast.forEach(dayForecast => {
        const dailyTasksForMap: Task[] = [];

        // --- Plant-Specific Tasks ---
        plants.forEach(plant => {
            const plantTasks: Task[] = [];
            
            // Generic Watering based on Heat
            if (dayForecast.maxTempC > 28 && dayForecast.chanceOfRain < 30) {
                plantTasks.push(createTask(dayForecast.day, `Deep Water: ${plant.name}`, `It's hot! Give your ${plant.name} a thorough soak at the base.`, 'Watering', 'High', 'carry_push', plant));
            }

            // Generic Feeding
            if (['Flowering', 'Fruiting'].includes(plant.phenology) && dayForecast.day === 'Sunday') {
                plantTasks.push(createTask(dayForecast.day, `Feed: ${plant.name}`, `Boost your ${plant.name} with some liquid fertilizer to support its growth.`, 'Feeding', 'Medium', 'hinge_and_squat', plant));
            }

            // --- NEW DETAILED TASK LOGIC ---

            if (loquatGroup.includes(plant.name)) {
                if (isWinter && plant.phenology === 'Flowering' && dayForecast.minTempC < 5) {
                    plantTasks.push(createTask(dayForecast.day, `Protect Blossoms: ${plant.name}`, `Cold night ahead! Protect your ${plant.name}'s delicate winter flowers with a frost cloth.`, 'Protection', 'High', 'stretch_reach', plant));
                }
                if (isSpring && plant.phenology === 'Fruiting' && dayForecast.day === 'Tuesday') {
                    plantTasks.push(createTask(dayForecast.day, `Net Fruit: ${plant.name}`, `Fruit is showing color. Net the tree to protect it from birds.`, 'Protection', 'Medium', 'stretch_reach', plant));
                }
            }

            if (citrusGroup.includes(plant.name)) {
                if (isSpring && dayForecast.day === 'Thursday') {
                     plantTasks.push(createTask(dayForecast.day, `Monitor Leaf Miner: ${plant.name}`, `Check the new spring growth on your ${plant.name} for silvery trails from leaf miners.`, 'Pest Control', 'Medium', 'light_standing', plant));
                }
                if ((isSpring || isSummer) && plant.phenology === 'Fruiting') {
                     plantTasks.push(createTask(dayForecast.day, `Deep Water: ${plant.name}`, `Citrus needs consistent water during fruit swell. Ensure soil is moist, not wet.`, 'Watering', 'High', 'carry_push', plant));
                }
                if (isSpring && dayForecast.day === 'Friday') {
                    plantTasks.push(createTask(dayForecast.day, `Apply Heavy Mulch: ${plant.name}`, `Your ${plant.name} is thirsty as it develops fruit. Apply a thick layer of mulch to retain moisture. A great squatting workout!`, 'Mulching', 'High', 'hinge_and_squat', plant));
                }
            }
            
            if (summerFruitGroup.includes(plant.name)) {
                 if (plant.phenology === 'Fruiting' && dayForecast.day === 'Monday') {
                    plantTasks.push(createTask(dayForecast.day, `Check Moisture: ${plant.name}`, `Ensure even moisture for your ${plant.name} to prevent fruit drop.`, 'Watering', 'Medium', 'hinge_and_squat', plant));
                 }
                 if (plant.phenology === 'Fruiting' && dayForecast.day === 'Friday') {
                    plantTasks.push(createTask(dayForecast.day, `Fruit Fly Watch: ${plant.name}`, `Pre-empt fruit fly on your ${plant.name}. Set traps or prepare exclusion bags.`, 'Pest Control', 'High', 'light_standing', plant));
                 }
                 if (isSummer && plant.phenology === 'Fruiting' && dayForecast.day === 'Wednesday') {
                     plantTasks.push(createTask(dayForecast.day, `Net Fruit from Pests: ${plant.name}`, `Protect your ripening fruit from birds and bats. Netting is a great chemical-free option.`, 'Fruiting Support', 'Medium', 'stretch_reach', plant));
                 }
                 if (isSpring && ['Grapes', 'Angoor (Grape)', 'Muscadine Grape'].includes(plant.name) && dayForecast.day === 'Saturday') {
                    plantTasks.push(createTask(dayForecast.day, `Install Fruiting Supports: ${plant.name}`, `Your ${plant.name} will need support as it grows heavy with fruit. Install stakes or a trellis now.`, 'Fruiting Support', 'High', 'carry_push', plant));
                 }
                 if (isAutumn && dayForecast.day === 'Saturday') {
                     plantTasks.push(createTask(dayForecast.day, `Prune for Airflow: ${plant.name}`, `Now that peak heat is over, give your ${plant.name} a light prune to improve airflow and set it up for next season.`, 'Maintenance', 'Medium', 'stretch_reach', plant));
                 }
            }
            
            if (longSeasonVinesGroup.includes(plant.name)) {
                if (isSpring && dayForecast.day === 'Wednesday') {
                    plantTasks.push(createTask(dayForecast.day, `Build/Strengthen Trellis: ${plant.name}`, 'Ensure the trellis is strong enough for a full season of growth. Reinforce or build as needed.', 'Fruiting Support', 'High', 'carry_push', plant));
                }
                if(dayForecast.day === 'Wednesday') {
                    plantTasks.push(createTask(dayForecast.day, `Check Ties & Pests: ${plant.name}`, `Ensure vine ties are loose. Check for scale and mealybugs.`, 'Maintenance', 'Medium', 'stretch_reach', plant));
                }
                if (isSummer && plant.phenology === 'Fruiting' && dayForecast.day === 'Thursday') {
                    plantTasks.push(createTask(dayForecast.day, `Bag Prized Fruit: ${plant.name}`, `For prized fruits, consider bagging them individually to protect from pests and sunburn.`, 'Fruiting Support', 'Low', 'light_standing', plant));
                }
            }

            if (warmSeasonVegGroup.includes(plant.name) || cucurbits.includes(plant.name)) {
                 if (dayForecast.maxTempC > 30 && dayForecast.day === 'Tuesday') {
                    plantTasks.push(createTask(dayForecast.day, `Heat Stress Watch: ${plant.name}`, `Check for signs of heat stress. Watch for powdery mildew and mites.`, 'Pest Control', 'Medium', 'light_standing', plant));
                 }
                 if (plant.phenology === 'Fruiting' && dayForecast.day === 'Sunday') {
                    plantTasks.push(createTask(dayForecast.day, `Side-dress Feed: ${plant.name}`, `Give a light side-dressing of compost or fertilizer to support fruiting.`, 'Feeding', 'Medium', 'hinge_and_squat', plant));
                 }
                 if (isSummer && dayForecast.day === 'Saturday') {
                     plantTasks.push(createTask(dayForecast.day, `Apply Mulch: ${plant.name}`, `Lay down mulch to keep the soil cool, retain moisture, and suppress weeds during the hot season.`, 'Mulching', 'Medium', 'hinge_and_squat', plant));
                 }
                 if (cucurbits.includes(plant.name) && isSummer && dayForecast.day === 'Wednesday') {
                     plantTasks.push(createTask(dayForecast.day, `Trellis Check: ${plant.name}`, `Ensure your cucurbits have good support and airflow. Guide any wandering vines onto the trellis.`, 'Fruiting Support', 'Medium', 'stretch_reach', plant));
                 }
            }
            
            if (rootTuberGroup.includes(plant.name)) {
                if (isAutumn && plant.phenology === 'Harvest' && dayForecast.day === 'Friday') {
                    plantTasks.push(createTask(dayForecast.day, `Lift and Store Tubers: ${plant.name}`, 'Harvest your tubers on a dry day. This involves digging and lifting, great for functional strength.', 'Maintenance', 'High', 'hinge_and_squat', plant));
                }
            }
            
            if (rhizomeGroup.includes(plant.name)) {
                if (dayForecast.day === 'Monday') {
                    plantTasks.push(createTask(dayForecast.day, `Mulch & Moisture Check: ${plant.name}`, `Ensure rhizomes are well-mulched and the soil is consistently moist.`, 'Mulching', 'Medium', 'hinge_and_squat', plant));
                }
                if (isAutumn && dayForecast.day === 'Saturday') {
                    plantTasks.push(createTask(dayForecast.day, `Harvest Check: ${plant.name}`, `Rhizomes like ${plant.name} are ready to harvest late summer to autumn. Check for size on a dry day.`, 'Maintenance', 'Low', 'hinge_and_squat', plant));
                }
            }

            if (herbSpiceGroup.includes(plant.name)) {
                if ((isSpring || isSummer) && dayForecast.day === 'Thursday') {
                     plantTasks.push(createTask(dayForecast.day, `Pinch & Prune: ${plant.name}`, `Regularly trim your ${plant.name} to encourage bushy growth and a continuous supply of fresh leaves.`, 'Maintenance', 'Low', 'light_standing', plant));
                }
            }

            if (nutTreeGroup.includes(plant.name)) {
                if (plant.phenology === 'Fruiting') {
                    plantTasks.push(createTask(dayForecast.day, `Deep Water for Nut Fill: ${plant.name}`, `Nut trees require ample water during nut fill. Irrigate deeply if no rain.`, 'Watering', 'High', 'carry_push', plant));
                }
                if (dayForecast.day === 'Monday') {
                    plantTasks.push(createTask(dayForecast.day, `Check Tree Stakes: ${plant.name}`, 'Ensure young trees are securely staked to protect from wind rock, especially before storm season.', 'Maintenance', 'Medium', 'carry_push', plant));
                }
                if (isAutumn && dayForecast.day === 'Sunday') {
                    plantTasks.push(createTask(dayForecast.day, `Post-Harvest Prune: ${plant.name}`, `After the harvest, perform a light structural prune to shape the tree and remove any dead or crossing branches.`, 'Maintenance', 'Medium', 'carry_push', plant));
                }
            }
            
            if (nativeEdiblesGroup.includes(plant.name)) {
                 if (plant.phenology === 'Fruiting' && dayForecast.day === 'Tuesday') {
                    plantTasks.push(createTask(dayForecast.day, `Net Fruit: ${plant.name}`, `Native birds love native fruit! Net your ${plant.name} as it ripens.`, 'Protection', 'Medium', 'stretch_reach', plant));
                 }
                 if (isSpring && dayForecast.day === 'Friday') {
                     plantTasks.push(createTask(dayForecast.day, `Mulch for Fruit Swell: ${plant.name}`, `Apply a good layer of mulch around your native edibles to support them as they begin to develop fruit.`, 'Mulching', 'Medium', 'hinge_and_squat', plant));
                 }
                 if (isAutumn && dayForecast.day === 'Saturday') {
                     plantTasks.push(createTask(dayForecast.day, `Shape Up: ${plant.name}`, `Prune after harvesting to shape the plant and encourage good form for next year's growth.`, 'Maintenance', 'Low', 'stretch_reach', plant));
                 }
            }

            if (ornamentalsGroup.includes(plant.name) && plant.phenology === 'Flowering' && dayForecast.day === 'Saturday') {
                 plantTasks.push(createTask(dayForecast.day, `Deadhead Flowers: ${plant.name}`, `Remove spent flowers from your ${plant.name} to encourage a longer blooming season.`, 'Maintenance', 'Low', 'light_standing', plant));
            }

            if (palmsGroup.includes(plant.name) && dayForecast.day === 'Saturday') {
                 plantTasks.push(createTask(dayForecast.day, `Tidy Up: ${plant.name}`, `Remove any spent inflorescences or dead fronds from your ${plant.name}.`, 'Maintenance', 'Low', 'light_standing', plant));
            }

            // Add unique tasks to the daily list
            // This prevents duplicate tasks if multiple conditions are met
            const uniqueTasks = plantTasks.filter((task, index, self) => 
                index === self.findIndex(t => t.title === task.title)
            );
            dailyTasksForMap.push(...uniqueTasks);
        });

        // --- General Physical Activity Tasks by Season ---
        if (isSpring && dayForecast.day === 'Saturday' && !dailyTasksForMap.some(t => t.title === 'Prepare New Garden Bed')) {
            dailyTasksForMap.push(createTask(dayForecast.day, 'Prepare New Garden Bed', 'Expand your garden! Clear, weed, and amend the soil in a new area. A great workout!', 'Maintenance', 'High', 'hinge_and_squat'));
        }
        if (isAutumn && dayForecast.day === 'Sunday' && !dailyTasksForMap.some(t => t.title === 'Top-Dress Beds with Compost')) {
            dailyTasksForMap.push(createTask(dayForecast.day, 'Top-Dress Beds with Compost', 'Enrich your soil for winter. Spread a thick layer of compost over your garden beds. Involves lifting and carrying.', 'Feeding', 'Medium', 'carry_push'));
        }
        
        dailyTaskMap.set(dayForecast.day, dailyTasksForMap);
    });

    // --- Add Routine Tasks to Pad Each Day ---
    weather.forecast.forEach(dayForecast => {
        const dailyTasks = dailyTaskMap.get(dayForecast.day) || [];

        // Add a selection of routine tasks to pad out the day
        routineTasks.forEach((routineTask, index) => {
            // Use modulo to distribute routine tasks across days of the week to avoid repetition
            if ( (taskIdCounter + index) % weather.forecast.length === weather.forecast.findIndex(d => d.day === dayForecast.day) ) {
                // Check if a similar task doesn't already exist for that day
                if (!dailyTasks.some(t => t.title === routineTask.title)) {
                    dailyTasks.push(createTask(
                        dayForecast.day,
                        routineTask.title,
                        routineTask.description,
                        routineTask.category,
                        routineTask.priority,
                        routineTask.movement
                    ));
                }
            }
        });
        
        if (dayForecast.day === 'Tuesday' && !dailyTasks.some(t => t.category === 'Pest Control')) {
            dailyTasks.push(createTask(dayForecast.day, 'Garden Pest Patrol', 'Do a general walk-through and check for common pests on all plants.', 'Pest Control', 'Medium', 'light_standing'));
        }
        
        if (dayForecast.day === 'Friday' && !dailyTasks.some(t => t.category === 'Mulching')) {
            dailyTasks.push(createTask(dayForecast.day, 'Mulch Layer Check', 'Ensure mulch is not touching stems and is at least 2 inches thick.', 'Mulching', 'Low', 'hinge_and_squat'));
        }

        dailyTaskMap.set(dayForecast.day, dailyTasks);
    });

    // Flatten map to array
    dailyTaskMap.forEach(dayTasks => tasks.push(...dayTasks));
    
    return tasks;
};