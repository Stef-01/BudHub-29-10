// components/UnifiedNutrientGame.tsx

import React, { useState, useEffect, useCallback } from 'react';
import type { GameQuestion } from '../types';
import { useUserCookbook } from '../contexts/UserCookbookContext';
import { useGameScores } from '../contexts/GameScoresContext';
import { useGamification } from '../contexts/GamificationContext';
import { generateDynamicNutrientQuestion } from '../services/gameService';
import GameRecipeCard from './GameRecipeCard';
import GameOverModal from './GameOverModal';
import { XIcon } from './icons/Icons';

const ROUND_TIME = 10; // seconds

interface UnifiedNutrientGameProps {
  onExit: () => void;
}

type DynamicQuestion = GameQuestion & { challenge: string };

const UnifiedNutrientGame: React.FC<UnifiedNutrientGameProps> = ({ onExit }) => {
  const { recipes } = useUserCookbook();
  const { saveScore } = useGameScores();
  const { addXp } = useGamification();

  const [question, setQuestion] = useState<DynamicQuestion | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timer, setTimer] = useState(ROUND_TIME);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [currentMetric, setCurrentMetric] = useState<'high_protein' | 'high_fiber' | 'low_carb' | 'diabetic_friendly'>('high_protein');

  const nextQuestion = useCallback(() => {
    const newQuestion = generateDynamicNutrientQuestion(recipes);
    if (newQuestion) {
      setQuestion(newQuestion);
      setSelectedAnswerId(null);
      setIsRevealed(false);
      setTimer(ROUND_TIME);

      // Determine which metric this question is testing (for card display)
      const correctRecipe = newQuestion.options.find(r => r.id === newQuestion.correctAnswerId);
      if (correctRecipe) {
        if (correctRecipe.high_protein) setCurrentMetric('high_protein');
        else if (correctRecipe.high_fiber) setCurrentMetric('high_fiber');
        else if (correctRecipe.low_carb) setCurrentMetric('low_carb');
        else if (correctRecipe.diabetic_friendly) setCurrentMetric('diabetic_friendly');
      }
    } else {
      // Not enough recipes to continue, end the game.
      setIsGameOver(true);
    }
  }, [recipes]);

  useEffect(() => {
    nextQuestion();
  }, [nextQuestion]);

  useEffect(() => {
    if (isRevealed || isGameOver) return;

    if (timer <= 0) {
      // Time's up
      setIsRevealed(true);
      setLives(prev => prev - 1);
      setTimeout(() => {
        if (lives - 1 > 0) {
          nextQuestion();
        } else {
          setIsGameOver(true);
        }
      }, 2000);
      return;
    }

    const interval = setInterval(() => {
      setTimer(t => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, isRevealed, isGameOver, lives, nextQuestion]);

  const handleAnswerClick = (recipeId: string) => {
    if (isRevealed) return;

    setSelectedAnswerId(recipeId);
    setIsRevealed(true);

    const isCorrect = recipeId === question?.correctAnswerId;

    setTimeout(() => {
      if (isCorrect) {
        const points = 10 + timer;
        setScore(s => s + points);
        addXp('Low', 'add');
        nextQuestion();
      } else {
        setLives(prev => prev - 1);
        if (lives - 1 > 0) {
          nextQuestion();
        } else {
          setIsGameOver(true);
        }
      }
    }, 2000); // Reveal for 2 seconds
  };

  const handlePlayAgain = () => {
    setScore(0);
    setLives(3);
    setIsGameOver(false);
    setQuestion(null);
    nextQuestion();
  };

  const handleExit = () => {
    if (score > 0) {
      // Save under unified_nutrient mode
      saveScore('unified_nutrient', score);
    }
    onExit();
  };

  if (!question) {
    return (
      <div className="text-center p-8">
        <h3 className="text-xl font-semibold">Loading Game...</h3>
        <p className="text-gray-500 mt-2">
          Not enough recipes to play this mode. Try adding more recipes from your cookbook.
        </p>
        <button onClick={handleExit} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg">Back to Games</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-green-900">Nutrient Challenge</h2>
        <button onClick={handleExit} className="p-2 rounded-full text-gray-500 hover:bg-gray-200">
          <XIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="flex justify-between items-center mb-4 bg-white/80 p-4 rounded-xl shadow-sm">
        <div>Score: <span className="font-bold text-xl">{score}</span></div>
        <div>Lives: <span className="font-bold text-xl">{'❤️'.repeat(lives)}</span></div>
        <div>Time: <span className="font-bold text-xl">{timer}</span></div>
      </div>

      <div className="relative w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div
          className="bg-green-600 h-2.5 rounded-full transition-all duration-1000 linear"
          style={{ width: `${(timer / ROUND_TIME) * 100}%` }}
        ></div>
      </div>

      {/* Challenge Text */}
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl shadow-md">
          {question.challenge}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {question.options.map(recipe => (
          <GameRecipeCard
            key={recipe.id}
            recipe={recipe}
            onClick={handleAnswerClick}
            isSelected={selectedAnswerId === recipe.id}
            isCorrect={question.correctAnswerId === recipe.id}
            isRevealed={isRevealed}
            gameMode={currentMetric}
          />
        ))}
      </div>

      {isGameOver && (
        <GameOverModal
          score={score}
          onPlayAgain={handlePlayAgain}
          onExit={handleExit}
        />
      )}
    </div>
  );
};

export default UnifiedNutrientGame;
