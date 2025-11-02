// components/games/NutriServeGame.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Types
import type { NutriServeCustomerWithTargets, PlateItem, FoodItem } from './NutriServeTypes';

// UI Components
import Plate from './nutriserve-ui/Plate';
import FoodLibrary from './nutriserve-ui/FoodLibrary';
import CustomerDisplay from './nutriserve-ui/CustomerDisplay';
import MealAnalysis from './nutriserve-ui/MealAnalysis';
import ServingSizeModal from './nutriserve-ui/ServingSizeModal';
import ResultModal from './nutriserve-ui/ResultModal';
import DidYouKnowCard from './nutriserve-ui/DidYouKnowCard';
import ChangelogModal from './nutriserve-ui/ChangelogModal';
import { IconXCircle } from './nutriserve-ui/Icons';


// Game Data & Logic
import { CHARACTERS } from '../../services/nutriserveCharacters';
import { FOOD_DATA, DID_YOU_KNOW_TIPS } from '../../services/nutriserveFoodData';
import { generateCustomerGoals, calculateTotalNutrients, calculateScoreAndFeedback } from '../../services/nutriserveUtils';
import { useGameScores } from '../../contexts/GameScoresContext';
import { useGamification } from '../../contexts/GamificationContext';

const MAX_ROUNDS = 3;

const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
};

interface NutriServeGameProps {
  onExit: () => void;
}

const NutriServeGame: React.FC<NutriServeGameProps> = ({ onExit }) => {
    const [customers, setCustomers] = useState<NutriServeCustomerWithTargets[]>([]);
    const [currentRound, setCurrentRound] = useState(0);
    const [plateItems, setPlateItems] = useState<PlateItem[]>([]);
    const [totalScore, setTotalScore] = useState(0);
    
    // Modal States
    const [servingModalItem, setServingModalItem] = useState<FoodItem | null>(null);
    const [resultData, setResultData] = useState<{ score: number; feedback: Record<string, any> } | null>(null);
    const [showChangelog, setShowChangelog] = useState(false);

    const { saveScore } = useGameScores();
    const { addXp } = useGamification();

    useEffect(() => {
        const shuffledCharacters = shuffleArray(CHARACTERS);
        const gameCustomers = shuffledCharacters.slice(0, MAX_ROUNDS).map(char => ({
            ...char,
            targets: generateCustomerGoals(char.order),
        }));
        setCustomers(gameCustomers);
        // Show changelog on first load (e.g., check local storage)
        if (!localStorage.getItem('nutriserve_changelog_seen_v3')) {
            setShowChangelog(true);
            localStorage.setItem('nutriserve_changelog_seen_v3', 'true');
        }
    }, []);
    
    const currentCustomer = customers[currentRound];
    
    const totals = useMemo(() => calculateTotalNutrients(plateItems), [plateItems]);
    
    const handleDropItem = useCallback((foodItemId: string) => {
        const foodItem = FOOD_DATA.find(item => item.id === foodItemId);
        if (foodItem) {
            setServingModalItem(foodItem);
        }
    }, []);

    const handleAddItemToPlate = useCallback((plateItem: PlateItem) => {
        setPlateItems(prev => [...prev, plateItem]);
        setServingModalItem(null);
    }, []);

    const handleRemoveItem = useCallback((instanceId: string) => {
        setPlateItems(prev => prev.filter(item => item.instanceId !== instanceId));
    }, []);

    const handleEditItem = useCallback((item: PlateItem) => {
        // For simplicity, we remove and re-add. A real app might have a more complex edit flow.
        handleRemoveItem(item.instanceId);
        setServingModalItem(item.foodItem);
    }, [handleRemoveItem]);

    const handleServePlate = () => {
        if (!currentCustomer) return;
        const { score, feedback } = calculateScoreAndFeedback(totals, currentCustomer.targets);
        setTotalScore(prev => prev + score);
        setResultData({ score, feedback });
    };

    const handleNextRound = () => {
        addXp('Medium', 'add');
        const currentResultScore = resultData?.score || 0;
        setResultData(null);
        setPlateItems([]);

        if (currentRound + 1 >= MAX_ROUNDS) {
            // Game over
            saveScore('nutriserve', totalScore + currentResultScore);
            addXp('High', 'add'); // Bonus XP for finishing
            onExit();
        } else {
            setCurrentRound(prev => prev + 1);
        }
    };
    
    const randomTip = useMemo(() => DID_YOU_KNOW_TIPS[Math.floor(Math.random() * DID_YOU_KNOW_TIPS.length)], [currentRound]);

    if (!currentCustomer) {
        return <div className="p-8 text-center">Loading NutriServe...</div>;
    }

    return (
        <div className="bg-slate-200 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
            <header className="flex justify-between items-center mb-6">
                 <div>
                    <h1 className="text-3xl font-bold text-slate-800">NutriServe Chef</h1>
                    <p className="text-slate-600">Round {currentRound + 1} of {MAX_ROUNDS} | Total Score: {totalScore}</p>
                </div>
                <button
                    onClick={onExit}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 font-semibold rounded-full hover:bg-rose-100 hover:text-rose-700 transition-colors"
                >
                    <IconXCircle className="w-5 h-5"/> Exit
                </button>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Panel - Food Library */}
                <div className="lg:col-span-3">
                    <FoodLibrary />
                </div>

                {/* Center Panel - Plate & Customer */}
                <div className="lg:col-span-6 space-y-6">
                    <CustomerDisplay 
                        customer={currentCustomer}
                        onServe={handleServePlate}
                        isPlateEmpty={plateItems.length === 0}
                    />
                    <Plate 
                        items={plateItems}
                        onDropItem={handleDropItem}
                        onEditItem={handleEditItem}
                        onRemoveItem={handleRemoveItem}
                        plateSize={currentCustomer.order.plateSize}
                    />
                </div>

                {/* Right Panel - Analysis */}
                <div className="lg:col-span-3 space-y-6">
                    <MealAnalysis totals={totals} targets={currentCustomer.targets} />
                    <DidYouKnowCard tip={randomTip} />
                </div>
            </main>

            {servingModalItem && (
                <ServingSizeModal
                    foodItem={servingModalItem}
                    onAdd={handleAddItemToPlate}
                    onClose={() => setServingModalItem(null)}
                />
            )}
            
            {resultData && (
                <ResultModal
                    score={resultData.score}
                    customer={currentCustomer}
                    feedback={resultData.feedback}
                    onNext={handleNextRound}
                    isLastRound={currentRound + 1 >= MAX_ROUNDS}
                />
            )}

            {showChangelog && (
                <ChangelogModal onClose={() => setShowChangelog(false)} />
            )}
        </div>
    );
};

export default NutriServeGame;
