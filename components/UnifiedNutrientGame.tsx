// components/UnifiedNutrientGame.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GameQuestion } from '../types';
import { useGameScores } from '../contexts/GameScoresContext';
import { useGamification } from '../contexts/GamificationContext';
import { generateDynamicNutrientQuestion } from '../services/gameService';
import { RECIPE_CATALOG } from '../constants';
import GameRecipeCard from './GameRecipeCard';
import GameOverModal from './GameOverModal';
import { XIcon } from './icons/Icons';
import { getUserId } from '../hooks/useUserId';
import {
  logNutrientChallengeAttempt,
  logNutrientChallengeSession,
  type NutrientChallengeAttempt,
} from '../services/supabaseLogger';

const ROUND_TIME = 15; // seconds

interface UnifiedNutrientGameProps {
  onExit: () => void;
}

type DynamicQuestion = GameQuestion & { challenge: string };

const UnifiedNutrientGame: React.FC<UnifiedNutrientGameProps> = ({ onExit }) => {
  // Use full RECIPE_CATALOG like the discovery carousel does!
  // This gives us all 68 recipes with proper distribution
  const recipes = RECIPE_CATALOG;
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

  // Supabase tracking
  const sessionId = useRef(crypto.randomUUID());
  const userId = getUserId();
  const sessionAttemptsRef = useRef<{
    high_protein: { correct: number; total: number };
    high_fiber: { correct: number; total: number };
    low_carb: { correct: number; total: number };
    diabetic_friendly: { correct: number; total: number };
    totalCorrect: number;
    totalQuestions: number;
  }>({
    high_protein: { correct: 0, total: 0 },
    high_fiber: { correct: 0, total: 0 },
    low_carb: { correct: 0, total: 0 },
    diabetic_friendly: { correct: 0, total: 0 },
    totalCorrect: 0,
    totalQuestions: 0,
  });

  const nextQuestion = useCallback(() => {
    console.log('[UnifiedNutrientGame] Attempting to generate question...');
    console.log('[UnifiedNutrientGame] Total recipes in cookbook:', recipes.length);

    if (recipes.length === 0) {
      console.error('[UnifiedNutrientGame] ❌ No recipes available!');
      setIsGameOver(true);
      return;
    }

    // Show recipe property distribution for debugging
    const distribution = {
      high_protein: recipes.filter(r => r.high_protein).length,
      high_fiber: recipes.filter(r => r.high_fiber).length,
      low_carb: recipes.filter(r => r.low_carb).length,
      diabetic_friendly: recipes.filter(r => r.diabetic_friendly).length,
    };
    console.log('[UnifiedNutrientGame] Recipe distribution:', distribution);

    const newQuestion = generateDynamicNutrientQuestion(recipes);
    if (newQuestion) {
      console.log('[UnifiedNutrientGame] ✓ Question generated successfully');
      setQuestion(newQuestion);
      setSelectedAnswerId(null);
      setIsRevealed(false);
      setTimer(ROUND_TIME);

      // Determine which metric this question is testing based on the challenge text
      const challenge = newQuestion.challenge.toLowerCase();
      if (challenge.includes('protein')) {
        setCurrentMetric('high_protein');
      } else if (challenge.includes('fiber')) {
        setCurrentMetric('high_fiber');
      } else if (challenge.includes('carb')) {
        setCurrentMetric('low_carb');
      } else if (challenge.includes('diabetic') || challenge.includes('blood sugar')) {
        setCurrentMetric('diabetic_friendly');
      }
    } else {
      console.error('[UnifiedNutrientGame] ❌ Failed to generate question - not enough valid recipes');
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
      }, 3500);
      return;
    }

    const interval = setInterval(() => {
      setTimer(t => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, isRevealed, isGameOver, lives, nextQuestion]);

  const handleAnswerClick = (recipeId: string) => {
    if (isRevealed || !question) return;

    setSelectedAnswerId(recipeId);
    setIsRevealed(true);

    const isCorrect = recipeId === question?.correctAnswerId;
    const points = isCorrect ? 10 + timer : 0;

    // Find recipe details
    const selectedRecipe = question.options.find(r => r.id === recipeId);
    const correctRecipe = question.options.find(r => r.id === question.correctAnswerId);

    // Log attempt to Supabase
    const attempt: NutrientChallengeAttempt = {
      user_id: userId,
      session_id: sessionId.current,
      metric: currentMetric,
      challenge_text: question.challenge,
      correct_recipe_id: question.correctAnswerId,
      correct_recipe_name: correctRecipe?.name || 'Unknown',
      selected_recipe_id: recipeId,
      selected_recipe_name: selectedRecipe?.name || 'Unknown',
      was_correct: isCorrect,
      options: question.options.map(r => ({
        id: r.id,
        name: r.name,
        image: r.image,
        course: r.course,
      })),
      time_taken_seconds: timer,
      points_earned: points,
      lives_remaining: lives,
    };

    logNutrientChallengeAttempt(attempt);

    // Update session stats
    sessionAttemptsRef.current[currentMetric].total += 1;
    sessionAttemptsRef.current.totalQuestions += 1;
    if (isCorrect) {
      sessionAttemptsRef.current[currentMetric].correct += 1;
      sessionAttemptsRef.current.totalCorrect += 1;
    }

    setTimeout(() => {
      if (isCorrect) {
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
    }, 3500); // Reveal for 3.5 seconds to see nutrient values
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
      // Save under unified_nutrient mode (local IndexedDB)
      saveScore('unified_nutrient', score);

      // Log session to Supabase
      const stats = sessionAttemptsRef.current;
      logNutrientChallengeSession({
        user_id: userId,
        session_id: sessionId.current,
        final_score: score,
        questions_correct: stats.totalCorrect,
        questions_total: stats.totalQuestions,
        high_protein_correct: stats.high_protein.correct,
        high_protein_total: stats.high_protein.total,
        high_fiber_correct: stats.high_fiber.correct,
        high_fiber_total: stats.high_fiber.total,
        low_carb_correct: stats.low_carb.correct,
        low_carb_total: stats.low_carb.total,
        diabetic_friendly_correct: stats.diabetic_friendly.correct,
        diabetic_friendly_total: stats.diabetic_friendly.total,
      });
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
