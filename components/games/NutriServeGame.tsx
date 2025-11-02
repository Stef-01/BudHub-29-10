// components/games/NutriServeGame.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUserCookbook } from '../../../contexts/UserCookbookContext';
import { useGameScores } from '../../../contexts/GameScoresContext';
import { useGamification } from '../../../contexts/GamificationContext';
import { generateCustomerTargets, getNutrientStatus, calculateTotalNutrients } from '../../../services/nutriserveUtils';
import { CHARACTERS } from '../../../services/nutriserveCharacters';
import { FOOD_DATA } from '../../../services/nutriserveFoodData';
import type { FoodItem, PlateItem, NutriServeCustomerWithTargets, Nutrients } from './NutriServeTypes';
import CustomerDisplay from './nutriserve-ui/CustomerDisplay';
import FoodLibrary from './nutriserve-ui/FoodLibrary';
import Plate from './nutriserve-ui/Plate';
import MealAnalysis from './nutriserve-ui/MealAnalysis';
import ServingSizeModal from './nutriserve-ui/ServingSizeModal';
import ResultModal from './nutriserve-ui/ResultModal';
import { IconXCircle } from './nutriserve-ui/Icons';
import GameOverModal from '../GameOverModal';

const TOTAL_ROUNDS = 3;

const NutriServeGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
    const [round, setRound] = useState(1);
    const [totalScore, setTotalScore] = useState(0);
    const [customer, setCustomer] = useState<NutriServeCustomerWithTargets | null>(null);
    const [plate, setPlate] = useState<PlateItem[]>([]);
    const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
    const [editingItem, setEditingItem] = useState<PlateItem | null>(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [roundScore, setRoundScore] = useState(0);
    const [roundFeedback, setRoundFeedback] = useState<Record<string, 'low' | 'good' | 'high' | 'ok'>>({});
    
    const { saveScore } = useGameScores();
    const { addXp } = useGamification();

    const getNewCustomer = useCallback(() => {
        const randomCharacter = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        const targets = generateCustomerTargets(randomCharacter.order.plateSize, randomCharacter.order.diabetesMode);
        setCustomer({ ...randomCharacter, targets });
        setPlate([]);
    }, []);

    useEffect(() => {
        getNewCustomer();
    }, [getNewCustomer]);

    const handleUpdatePlate = (foodItem: FoodItem, grams: number, instanceId?: string) => {
        setPlate(prevPlate => {
            if (instanceId) {
                return prevPlate.map(item => item.instanceId === instanceId ? { ...item, grams } : item);
            } else {
                return [...prevPlate, { foodItem, grams, instanceId: `${foodItem.id}_${Date.now()}` }];
            }
        });
        setSelectedFood(null);
        setEditingItem(null);
    };

    const handleRemoveFromPlate = (instanceId: string) => {
        setPlate(prev => prev.filter(item => item.instanceId !== instanceId));
        setEditingItem(null);
    };

    const handleServePlate = () => {
        if (!customer) return;
        const totalNutrients = calculateTotalNutrients(plate);
        let score = 0;
        const feedback: typeof roundFeedback = {};

        Object.keys(customer.targets).forEach(key => {
            const nutrient = key as keyof Nutrients;
            const status = getNutrientStatus(totalNutrients[nutrient], customer.targets[nutrient]);
            feedback[nutrient] = status;
            if (status === 'good') score += 25;
            else if (status === 'low' && nutrient !== 'carbs_g' && nutrient !== 'fat_g' && nutrient !== 'sodium_mg') score += 10;
        });
        
        // Bonus for including required items
        customer.order.required_items.forEach(reqId => {
            const baseId = reqId.split('_')[0];
            if (plate.some(p => p.foodItem.id.startsWith(baseId))) {
                score += 30;
            }
        });

        // Penalty for treats
        if (plate.some(p => p.foodItem.isTreat)) {
            score -= 20;
        }

        score = Math.max(0, Math.min(150, score));
        setRoundScore(score);
        setRoundFeedback(feedback);
        setShowResultModal(true);
    };

    const handleNextRound = () => {
        setTotalScore(s => s + roundScore);
        addXp(roundScore > 100 ? 'High' : (roundScore > 50 ? 'Medium' : 'Low'), 'add');
        setShowResultModal(false);

        if (round < TOTAL_ROUNDS) {
            setRound(r => r + 1);
            getNewCustomer();
        } else {
            // Game over
            saveScore('nutriserve', totalScore + roundScore);
        }
    };
    
    if (!customer) return <div>Loading...</div>;

    const isGameOver = round > TOTAL_ROUNDS;

    return (
        <div className="bg-slate-100 min-h-screen p-4 md:p-6 lg:p-8">
            <header className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">NutriServe Chef</h2>
                    <p className="text-slate-500">Round {round}/{TOTAL_ROUNDS} | Total Score: {totalScore}</p>
                </div>
                <button onClick={onExit} className="p-2 rounded-full text-slate-500 hover:bg-slate-200"><IconXCircle className="h-8 w-8" /></button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <CustomerDisplay customer={customer} />
                    <div className="relative">
                        <Plate items={plate} onSelectItem={setEditingItem} isServing={showResultModal} />
                    </div>
                    <button
                        onClick={handleServePlate}
                        disabled={plate.length === 0}
                        className="w-full py-4 bg-emerald-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        Serve Plate
                    </button>
                </div>
                <div className="grid grid-rows-[minmax(0,_1fr)_minmax(0,_1fr)] gap-6 h-[80vh] lg:h-auto">
                    <FoodLibrary onSelectFood={setSelectedFood} />
                    <MealAnalysis plate={plate} customer={customer} />
                </div>
            </div>

            {(selectedFood || editingItem) && (
                <ServingSizeModal
                    foodItem={selectedFood || editingItem!.foodItem}
                    currentItem={editingItem || undefined}
                    onUpdate={handleUpdatePlate}
                    onRemove={handleRemoveFromPlate}
                    onClose={() => { setSelectedFood(null); setEditingItem(null); }}
                />
            )}
            
            {showResultModal && (
                <ResultModal
                    score={roundScore}
                    customer={customer}
                    feedback={roundFeedback}
                    onNext={handleNextRound}
                    isLastRound={round === TOTAL_ROUNDS}
                />
            )}
            
            {isGameOver && (
                <GameOverModal
                    score={totalScore}
                    onPlayAgain={() => { /* Not implemented for this game, just exit */ onExit(); }}
                    onExit={onExit}
                />
            )}
        </div>
    );
};

export default NutriServeGame;
