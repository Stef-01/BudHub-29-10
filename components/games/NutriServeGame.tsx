// components/games/NutriServeGame.tsx
import React, { useState, useEffect, useReducer, useCallback } from 'react';
import type { NutriServeCustomerWithTargets, PlateItem, FoodItem } from './NutriServeTypes';
import { getNewCustomer, calculateMealTotals, calculateScoreAndFeedback } from '../../services/nutriserveUtils';
// FIX: Corrected import casing for 'nutriserveFoodData' for consistency across the module.
import { FOOD_LIBRARY } from '../../services/nutriServeFoodData';
import { useGameScores } from '../../contexts/GameScoresContext';
import { useGamification } from '../../contexts/GamificationContext';

import Plate from './nutriserve-ui/Plate';
import FoodLibrary from './nutriserve-ui/FoodLibrary';
import MealAnalysis from './nutriserve-ui/MealAnalysis';
import CustomerDisplay from './nutriserve-ui/CustomerDisplay';
import ServingSizeModal from './nutriserve-ui/ServingSizeModal';
import ResultModal from './nutriserve-ui/ResultModal';
import ChangelogModal from './nutriserve-ui/ChangelogModal';
import GameOverModal from '../GameOverModal';
import { IconXCircle } from './nutriserve-ui/Icons';


const MAX_ROUNDS = 20;

type GameState = {
  round: number;
  totalScore: number;
  customer: NutriServeCustomerWithTargets | null;
  plateItems: PlateItem[];
  view: 'playing' | 'result' | 'gameover' | 'changelog';
  resultData: { score: number; feedback: Record<string, any> } | null;
};

type GameAction =
  | { type: 'START_GAME' }
  | { type: 'NEXT_CUSTOMER' }
  | { type: 'ADD_ITEM'; payload: PlateItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_PLATE' }
  | { type: 'SERVE_PLATE' }
  | { type: 'SHOW_CHANGELOG' }
  | { type: 'CLOSE_MODAL' };

const allFoodItems = FOOD_LIBRARY.flatMap(g => g.items);

const initialState: GameState = {
  round: 0,
  totalScore: 0,
  customer: null,
  plateItems: [],
  view: 'playing',
  resultData: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return { ...initialState, customer: getNewCustomer(1), round: 1 };
    case 'NEXT_CUSTOMER':
      if (state.round >= MAX_ROUNDS) {
        return { ...state, view: 'gameover' };
      }
      const nextRound = state.round + 1;
      return { ...state, round: nextRound, customer: getNewCustomer(nextRound), plateItems: [], view: 'playing', resultData: null };
    case 'ADD_ITEM':
      return { ...state, plateItems: [...state.plateItems, action.payload] };
    case 'REMOVE_ITEM':
      return { ...state, plateItems: state.plateItems.filter(item => item.instanceId !== action.payload) };
    case 'CLEAR_PLATE':
      return { ...state, plateItems: [] };
    case 'SERVE_PLATE': {
      if (!state.customer) return state;
      const totals = calculateMealTotals(state.plateItems);
      const { score, feedback } = calculateScoreAndFeedback(totals, state.customer.targets);
      return { ...state, totalScore: state.totalScore + score, view: 'result', resultData: { score, feedback } };
    }
    case 'SHOW_CHANGELOG':
      return { ...state, view: 'changelog' };
    case 'CLOSE_MODAL':
      return { ...state, view: 'playing' };
    default:
      return state;
  }
}

interface NutriServeGameProps {
  onExit: () => void;
}

const NutriServeGame: React.FC<NutriServeGameProps> = ({ onExit }) => {
  const [gameState, dispatch] = useReducer(gameReducer, initialState);
  const [modalItem, setModalItem] = useState<FoodItem | null>(null);
  const { saveScore } = useGameScores();
  const { addXp } = useGamification();

  useEffect(() => {
    dispatch({ type: 'START_GAME' });
  }, []);

  const handleAddItem = (item: PlateItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };
  
  const handleDropItem = (foodItemId: string) => {
    const foodItem = allFoodItems.find(i => i.id === foodItemId);
    if (foodItem) {
        setModalItem(foodItem);
    }
  };
  
  const handleRemoveItem = (instanceId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: instanceId });
  };

  const handleServe = () => {
    dispatch({ type: 'SERVE_PLATE' });
  };

  const handleNext = () => {
    // Award XP based on round performance
    if (gameState.resultData && gameState.resultData.score > 100) {
        addXp('High', 'add');
    } else if (gameState.resultData && gameState.resultData.score > 50) {
        addXp('Medium', 'add');
    }
    dispatch({ type: 'NEXT_CUSTOMER' });
  };

  const handlePlayAgain = () => {
    if (gameState.totalScore > 0) {
        saveScore('nutriserve', gameState.totalScore);
    }
    dispatch({ type: 'START_GAME' });
  };
  
  const handleExitGame = () => {
    if (gameState.totalScore > 0) {
      saveScore('nutriserve', gameState.totalScore);
    }
    onExit();
  };

  const mealTotals = useCallback(
    () => calculateMealTotals(gameState.plateItems),
    [gameState.plateItems]
  );
  
  if (!gameState.customer) {
    return <div>Loading...</div>; // Or a loading screen
  }

  const CharacterVisual = gameState.customer.visuals.default;

  return (
    <div className="p-3 md:p-4 bg-slate-50 min-h-screen max-h-screen overflow-hidden flex flex-col">
      {/* Top Header: Title + Exit */}
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-2xl font-bold text-emerald-700">NutriServe Chef</h1>
        <button onClick={onExit} className="p-1.5 rounded-full text-slate-500 hover:bg-slate-200">
            <IconXCircle className="h-7 w-7" />
        </button>
      </div>

      {/* Food Request Header Bar */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl shadow-lg p-4 mb-3 animate-slide-down">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white overflow-hidden flex-shrink-0 border-2 border-white shadow-md animate-bounce-in">
            <CharacterVisual />
          </div>
          <div className="flex-grow animate-fade-in">
            <p className="text-white font-bold text-lg">{gameState.customer.name}</p>
            <p className="text-slate-200 italic text-base">"{gameState.customer.order.description}"</p>
          </div>
          <div className="flex-shrink-0 animate-fade-in">
            <span className="bg-white/20 text-white px-4 py-1.5 rounded-full text-sm font-semibold">
              Round {gameState.round}/{MAX_ROUNDS}
            </span>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Left Column: Food Library */}
        <div className="lg:col-span-4 overflow-y-auto">
          <FoodLibrary />
        </div>

        {/* Center Column: Plate */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center">
          <Plate
            items={gameState.plateItems}
            onEditItem={() => {}} // Edit functionality can be added here
            onRemoveItem={handleRemoveItem}
            onDropItem={handleDropItem}
            plateSize={gameState.customer.order.plateSize}
          />
          <button
            onClick={handleServe}
            disabled={gameState.plateItems.length === 0}
            className="mt-4 px-8 py-2.5 bg-emerald-600 text-white font-bold text-base rounded-lg shadow-md hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all duration-200 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:hover:scale-100 animate-pulse-slow"
          >
            Serve Plate
          </button>
        </div>

        {/* Right Column: Meal Analysis */}
        <div className="lg:col-span-4 overflow-y-auto">
            <MealAnalysis
                totals={mealTotals()}
                targets={gameState.customer.targets}
            />
        </div>
      </div>
      
       {modalItem && (
        <ServingSizeModal 
          foodItem={modalItem}
          onAdd={handleAddItem}
          onClose={() => setModalItem(null)}
        />
      )}
      
      {gameState.view === 'result' && gameState.resultData && (
        <ResultModal
          score={gameState.resultData.score}
          customer={gameState.customer}
          feedback={gameState.resultData.feedback}
          onNext={handleNext}
          isLastRound={gameState.round >= MAX_ROUNDS}
        />
      )}

       {gameState.view === 'gameover' && (
        <GameOverModal
          score={gameState.totalScore}
          onPlayAgain={handlePlayAgain}
          onExit={handleExitGame}
        />
      )}

      {gameState.view === 'changelog' && (
        <ChangelogModal onClose={() => dispatch({ type: 'CLOSE_MODAL' })}/>
      )}

    </div>
  );
};

export default NutriServeGame;