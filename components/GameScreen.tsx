// components/GameScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import type { GameMode, GameQuestion } from '../types';
import { useUserCookbook } from '../contexts/UserCookbookContext';
import { useGameScores } from '../contexts/GameScoresContext';
import { generateQuestion } from '../services/gameService';
import GameRecipeCard from './GameRecipeCard';
import GameOverModal from './GameOverModal';
import { XIcon } from './icons/Icons';

const ROUND_TIME = 10; // seconds

interface GameScreenProps {
  gameMode: GameMode;
  onExit: () => void;
}

const gameTitles: Record<GameMode, string> = {
    diabetic_friendly: 'Sugar Smart',
    high_protein: 'Protein Packed',
    high_fiber: 'Fiber Finder',
    low_carb: 'Carb Counter',
};


const GameScreen: React.FC<GameScreenProps> = ({ gameMode, onExit }) => {
    const { recipes } = useUserCookbook();
    const { saveScore } = useGameScores();
    const [question, setQuestion] = useState<GameQuestion | null>(null);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [timer, setTimer] = useState(ROUND_TIME);
    const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    
    const nextQuestion = useCallback(() => {
        const newQuestion = generateQuestion(gameMode, recipes);
        if (newQuestion) {
            setQuestion(newQuestion);
            setSelectedAnswerId(null);
            setIsRevealed(false);
            setTimer(ROUND_TIME);
        } else {
            // Not enough recipes to continue, end the game.
            setIsGameOver(true);
        }
    }, [gameMode, recipes]);

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
                setScore(s => s + 10 + timer); // Bonus for speed
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
        nextQuestion();
    };
    
    const handleExit = () => {
        if(score > 0) {
            saveScore(gameMode, score);
        }
        onExit();
    };

    if (!question) {
        return (
            <div className="text-center p-8">
                <h3 className="text-xl font-semibold">Loading Game...</h3>
                <p className="text-gray-500 mt-2">
                    Not enough recipes with images to play this mode. Try adding more recipes or generating images.
                </p>
                <button onClick={onExit} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg">Back to Games</button>
            </div>
        );
    }
    
    return (
        <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-green-900">{gameTitles[gameMode]}</h2>
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

export default GameScreen;
