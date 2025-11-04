// components/UnifiedNutrientGame.tsx

import React, { useState, useEffect, useCallback } from 'react';
import type { GameMode, GameQuestion } from '../types';
import { useUserCookbook } from '../contexts/UserCookbookContext';
import { useGameScores } from '../contexts/GameScoresContext';
import { useGamification } from '../contexts/GamificationContext';
import { generateQuestion } from '../services/gameService';
import GameRecipeCard from './GameRecipeCard';
import GameOverModal from './GameOverModal';
import { XIcon } from './icons/Icons';

const ROUND_TIME = 10; // seconds

interface UnifiedNutrientGameProps {
  onExit: () => void;
}

type NutrientMetric = 'high_protein' | 'high_fiber' | 'low_carb' | 'diabetic_friendly';

const metricInfo: Record<NutrientMetric, { title: string; description: string; icon: string; color: string }> = {
  high_protein: {
    title: 'Protein Packed',
    description: 'Identify the recipe with the highest protein content to build muscle.',
    icon: '💪',
    color: 'from-yellow-400 to-yellow-600'
  },
  high_fiber: {
    title: 'Fiber Finder',
    description: 'Find the meal that\'s best for gut health and feeling full.',
    icon: '🌾',
    color: 'from-green-400 to-green-600'
  },
  low_carb: {
    title: 'Carb Counter',
    description: 'Pick the recipe with the lowest carbohydrate count.',
    icon: '🥗',
    color: 'from-purple-400 to-purple-600'
  },
  diabetic_friendly: {
    title: 'Sugar Smart',
    description: 'Which of these recipes is best for managing blood sugar levels?',
    icon: '❤️',
    color: 'from-blue-400 to-blue-600'
  }
};

const UnifiedNutrientGame: React.FC<UnifiedNutrientGameProps> = ({ onExit }) => {
  const { recipes } = useUserCookbook();
  const { saveScore } = useGameScores();
  const { addXp } = useGamification();

  const [selectedMetric, setSelectedMetric] = useState<NutrientMetric | null>(null);
  const [question, setQuestion] = useState<GameQuestion | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timer, setTimer] = useState(ROUND_TIME);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const nextQuestion = useCallback(() => {
    if (!selectedMetric) return;

    const newQuestion = generateQuestion(selectedMetric, recipes);
    if (newQuestion) {
      setQuestion(newQuestion);
      setSelectedAnswerId(null);
      setIsRevealed(false);
      setTimer(ROUND_TIME);
    } else {
      // Not enough recipes to continue, end the game.
      setIsGameOver(true);
    }
  }, [selectedMetric, recipes]);

  useEffect(() => {
    if (selectedMetric) {
      nextQuestion();
    }
  }, [selectedMetric, nextQuestion]);

  useEffect(() => {
    if (isRevealed || isGameOver || !selectedMetric) return;

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
  }, [timer, isRevealed, isGameOver, lives, nextQuestion, selectedMetric]);

  const handleAnswerClick = (recipeId: string) => {
    if (isRevealed || !selectedMetric) return;

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
    setSelectedMetric(null);
    setQuestion(null);
  };

  const handleExit = () => {
    if (score > 0 && selectedMetric) {
      saveScore(selectedMetric, score);
    }
    onExit();
  };

  // Metric Selection Screen
  if (!selectedMetric) {
    return (
      <div className="p-4 md:p-6 min-h-screen bg-gradient-to-br from-emerald-50 to-green-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-green-900">Nutrient Challenge</h2>
          <button onClick={handleExit} className="p-2 rounded-full text-gray-500 hover:bg-white/50">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <p className="text-center text-lg text-slate-700 mb-8">
          Choose which nutrient you want to focus on:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {(Object.keys(metricInfo) as NutrientMetric[]).map(metric => {
            const info = metricInfo[metric];
            return (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`bg-gradient-to-br ${info.color} p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-white`}
              >
                <div className="text-6xl mb-4">{info.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{info.title}</h3>
                <p className="text-sm opacity-90">{info.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Game Screen
  if (!question) {
    return (
      <div className="text-center p-8">
        <h3 className="text-xl font-semibold">Loading Game...</h3>
        <p className="text-gray-500 mt-2">
          Not enough recipes with images to play this mode. Try adding more recipes or generating images.
        </p>
        <button onClick={handleExit} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg">Back to Games</button>
      </div>
    );
  }

  const currentMetricInfo = metricInfo[selectedMetric];

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-green-900">{currentMetricInfo.title}</h2>
        <button onClick={handleExit} className="p-2 rounded-full text-gray-500 hover:bg-gray-200">
          <XIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="flex justify-between items-center mb-4 bg-white/80 p-4 rounded-xl shadow-sm">
        <div>Score: <span className="font-bold text-xl">{score}</span></div>
        <div>Lives: <span className="font-bold text-xl">{'❤️'.repeat(lives)}</span></div>
        <div>Time: <span className="font-bold text-xl">{timer}</span></div>
      </div>

      <div className="relative w-full bg-gray-200 rounded-full h-2.5 mb-6">
        <div
          className="bg-green-600 h-2.5 rounded-full transition-all duration-1000 linear"
          style={{ width: `${(timer / ROUND_TIME) * 100}%` }}
        ></div>
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
            gameMode={selectedMetric}
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
