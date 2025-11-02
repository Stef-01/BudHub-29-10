import React, { useState, useMemo, useCallback } from 'react';
import type { PlateItem, NutriServeCustomerWithTargets, Nutrients, MealGoals } from './NutriServeTypes';
import { useGameScores } from '../../contexts/GameScoresContext';
import { useGamification } from '../../contexts/GamificationContext';

import FoodLibrary from './nutriserve-ui/FoodLibrary';
import Plate from './nutriserve-ui/Plate';
import MealAnalysis from './nutriserve-ui/MealAnalysis';
import CustomerDisplay from './nutriserve-ui/CustomerDisplay';
import ResultModal from './nutriserve-ui/ResultModal';
import DidYouKnowCard from './nutriserve-ui/DidYouKnowCard';
import ChangelogModal from './nutriserve-ui/ChangelogModal';
// FIX: Import ServingSizeModal component to resolve reference error.
import ServingSizeModal from './nutriserve-ui/ServingSizeModal';

import { CHARACTERS } from '../../services/nutriserveCharacters';
// FIX: Import FOOD_DATA to resolve reference error.
// FIX: Corrected casing for nutriServeFoodData to resolve module conflicts.
import { FOOD_DATA, MEAL_GOALS } from '../../services/nutriServeFoodData';
import { calculateTotalNutrients, getNutrientStatus } from '../../services/nutriserveUtils';
import { IconXCircle } from './nutriserve-ui/Icons';


const GAME_ROUNDS = 3;

const getCustomerWithTargets = (customer: typeof CHARACTERS[0]): NutriServeCustomerWithTargets => {
    const baseGoals = MEAL_GOALS[customer.order.plateSize];
    let protein_g: MealGoals['protein_g'] = { min: 20 };
    let carbs_g: MealGoals['carbs_g'] = { max: 75 };
    let fat_g: MealGoals['fat_g'] = { max: 25 };

    if (customer.order.plateSize === 'Light') { protein_g.min = 15; carbs_g.max = 50; fat_g.max = 20; }
    if (customer.order.plateSize === 'Hearty') { protein_g.min = 30; carbs_g.max = 90; fat_g.max = 30; }
    
    if (customer.order.diabetesMode === 'Low-Carb') carbs_g.max = 40;
    if (customer.order.diabetesMode === 'Balanced') carbs_g.max = 60;
    
    return {
        ...customer,
        targets: { ...baseGoals, protein_g, carbs_g, fat_g },
    };
};

const NutriServeGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
    const { saveScore } = useGameScores();
    const { addXp } = useGamification();

    const [round, setRound] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [plateItems, setPlateItems] = useState<PlateItem[]>([]);
    const [isResultVisible, setIsResultVisible] = useState(false);
    const [lastScore, setLastScore] = useState(0);
    const [lastFeedback, setLastFeedback] = useState<Record<string, 'low' | 'good' | 'high' | 'ok'>>({});
    const [selectedFood, setSelectedFood] = useState<any | null>(null);
    const [showChangelog, setShowChangelog] = useState(false);
    
    const customers = useMemo(() => CHARACTERS.map(getCustomerWithTargets), []);
    const currentCustomer = customers[round % customers.length];

    const totalNutrients = useMemo(() => calculateTotalNutrients(plateItems), [plateItems]);

    const handleAddItem = useCallback((item: PlateItem) => {
        setPlateItems(prev => [...prev, item]);
        setSelectedFood(null);
    }, []);

    const handleSelectItem = useCallback((foodItem: any) => {
      setSelectedFood(foodItem);
    }, []);

    const handleRemoveItem = useCallback((instanceId: string) => {
        setPlateItems(prev => prev.filter(item => item.instanceId !== instanceId));
    }, []);
    
    const handleEditItem = useCallback((item: PlateItem) => {
        const foodItem = plateItems.find(p => p.instanceId === item.instanceId)?.foodItem;
        if (foodItem) {
          setSelectedFood(foodItem);
        }
    }, [plateItems]);

    const handleDropOnPlate = useCallback((foodItemId: string) => {
        const foodItem = FOOD_DATA.find(f => f.id === foodItemId);
        if(foodItem){
            setSelectedFood(foodItem);
        }
    }, []);


    const handleServePlate = () => {
        let score = 100; // Start with a perfect score
        const feedback: Record<string, 'low' | 'good' | 'high' | 'ok'> = {};

        Object.keys(currentCustomer.targets).forEach(key => {
            const nutrient = key as keyof Nutrients;
            const status = getNutrientStatus(totalNutrients[nutrient], currentCustomer.targets[nutrient]);
            feedback[nutrient] = status;
            if (status !== 'good') score -= 20;
        });

        const hasRequired = currentCustomer.order.required_items.every(reqId => plateItems.some(p => p.foodItem.id === reqId));
        if (hasRequired) score += 20; else score -= 30;

        score = Math.max(0, Math.min(150, score));
        
        setTotalScore(prev => prev + score);
        setLastScore(score);
        setLastFeedback(feedback);
        setIsResultVisible(true);
    };
    
    const handleNextRound = () => {
        addXp('Medium', 'add');
        if (round + 1 >= GAME_ROUNDS) {
            saveScore('nutriserve', totalScore + lastScore);
            onExit();
        } else {
            setRound(prev => prev + 1);
            setPlateItems([]); // Clear plate for next round
            setIsResultVisible(false);
        }
    };
    
    const handleExitGame = () => {
      if(totalScore > 0) saveScore('nutriserve', totalScore);
      onExit();
    }

    return (
        <div className="bg-slate-100 min-h-screen font-sans">
            <header className="bg-white/80 backdrop-blur-sm shadow-sm py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <h1 className="text-xl font-bold text-slate-800">NutriPlate Planner</h1>
                <div className="flex items-center space-x-4 text-slate-500">
                    {/* Placeholder for future icons */}
                </div>
            </header>

            <main className="p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        NutriServe <span className="text-2xl">🥗</span>
                    </h2>
                    <button 
                        onClick={() => setShowChangelog(true)} 
                        className="text-sm font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
                    >
                        Changelog
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 xl:col-span-1 h-[calc(100vh-160px)]">
                        <FoodLibrary onSelectItem={handleSelectItem}/>
                    </div>

                    <div className="lg:col-span-2 xl:col-span-2 space-y-6">
                        <CustomerDisplay 
                          customer={currentCustomer} 
                          onServe={handleServePlate} 
                          isPlateEmpty={plateItems.length === 0} 
                        />
                        <Plate 
                          items={plateItems} 
                          onEditItem={handleEditItem} 
                          onRemoveItem={handleRemoveItem}
                          onDropItem={handleDropOnPlate}
                          plateSize={currentCustomer.order.plateSize}
                        />
                    </div>

                    <div className="lg:col-span-3 xl:col-span-1 space-y-6">
                        <MealAnalysis totals={totalNutrients} targets={currentCustomer.targets} />
                        <DidYouKnowCard />
                    </div>
                </div>
            </main>

            {selectedFood && (
                <ServingSizeModal
                    foodItem={selectedFood}
                    onClose={() => setSelectedFood(null)}
                    onAdd={handleAddItem}
                />
            )}

            {isResultVisible && (
                <ResultModal
                    score={lastScore}
                    customer={currentCustomer}
                    feedback={lastFeedback}
                    onNext={handleNextRound}
                    isLastRound={round + 1 >= GAME_ROUNDS}
                />
            )}
            
            {showChangelog && (
                <ChangelogModal onClose={() => setShowChangelog(false)} />
            )}
        </div>
    );
};

export default NutriServeGame;
