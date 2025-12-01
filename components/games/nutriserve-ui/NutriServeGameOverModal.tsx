// components/games/nutriserve-ui/NutriServeGameOverModal.tsx
import React, { useMemo } from 'react';
import type { NutrientStatus } from '../../../services/nutriserveUtils';
import SocialShareButton from '../../SocialShareButton';
import { generateAIFeedback, calculatePercentile } from '../../../services/AIFeedbackGenerator';

interface MistakeData {
  nutrient: string;
  count: number;
  type: 'high' | 'low' | 'off';
}

interface NutriServeGameOverModalProps {
  score: number;
  roundScores: number[];
  mistakes: Record<string, MistakeData>;
  onPlayAgain: () => void;
  onExit: () => void;
}

const nutrientLabels: Record<string, string> = {
  calories_kcal: 'Calories',
  protein_g: 'Protein',
  carbs_g: 'Carbs',
  fat_g: 'Fat',
  fiber_g: 'Fiber',
  sodium_mg: 'Sodium',
};

const nutrientAdvice: Record<string, { high: string; low: string }> = {
  calories_kcal: {
    high: 'Try smaller portions or choose lighter options to avoid excess calories.',
    low: 'Add more substantial foods to meet energy needs.',
  },
  protein_g: {
    high: 'Balance protein with vegetables and whole grains.',
    low: 'Include Dal, paneer, or chicken to boost protein content.',
  },
  carbs_g: {
    high: 'For diabetics, reduce rice/roti portions and add more vegetables.',
    low: 'Ensure adequate complex carbs like brown rice or roti for energy.',
  },
  fat_g: {
    high: 'Limit fried foods and use healthier cooking methods like grilling.',
    low: 'Include healthy fats from nuts, avocados, or olive oil.',
  },
  fiber_g: {
    high: 'Great job! High fiber is beneficial for blood sugar control.',
    low: 'Add more vegetables, whole grains, and Dal for better fiber content.',
  },
  sodium_mg: {
    high: 'Reduce salt and avoid processed foods for better heart health.',
    low: 'Maintain current levels - low sodium is good for blood pressure.',
  },
};

const NutriServeGameOverModal: React.FC<NutriServeGameOverModalProps> = ({
  score,
  roundScores,
  mistakes,
  onPlayAgain,
  onExit,
}) => {
  // Calculate statistics
  const perfectRounds = roundScores.filter(s => s >= 150).length;
  const avgScore = Math.round(roundScores.reduce((a, b) => a + b, 0) / roundScores.length);

  const percentile = useMemo(() => calculatePercentile(score, 'nutriserve'), [score]);
  const aiFeedback = useMemo(() => generateAIFeedback('nutriserve', { score, mistakes, totalRounds: roundScores.length }), [score, mistakes, roundScores]);

  // Save score to localStorage for SWAAD Coach analysis
  React.useEffect(() => {
    try {
      const savedScores = localStorage.getItem('nutriServeScores');
      const scores = savedScores ? JSON.parse(savedScores) : [];
      // Only add if it's a new score (simple check to avoid duplicates on re-render)
      // In a real app, we'd use a unique game ID
      const lastScore = scores[scores.length - 1];
      if (lastScore !== score) {
        scores.push(score);
        // Keep last 20 scores
        if (scores.length > 20) scores.shift();
        localStorage.setItem('nutriServeScores', JSON.stringify(scores));

        // Also save mistakes for analysis
        const savedMistakes = localStorage.getItem('nutriServeMistakes');
        const allMistakes: { date: string; mistakes: Record<string, MistakeData> }[] = savedMistakes ? JSON.parse(savedMistakes) : [];
        allMistakes.push({ date: new Date().toISOString(), mistakes });
        if (allMistakes.length > 10) allMistakes.shift();
        localStorage.setItem('nutriServeMistakes', JSON.stringify(allMistakes));
      }
    } catch (e) {
      console.error('Failed to save score:', e);
    }
  }, [score, mistakes]);

  // Sort mistakes by frequency to show top issues
  const sortedMistakes: [string, MistakeData][] = Object.entries(mistakes)
    .sort(([, a]: [string, MistakeData], [, b]: [string, MistakeData]) => b.count - a.count)
    .slice(0, 3); // Top 3 most common mistakes

  // Performance rating
  let rating = '';
  let ratingColor = '';
  if (avgScore >= 130) {
    rating = 'Excellent! 🌟';
    ratingColor = 'text-emerald-600';
  } else if (avgScore >= 100) {
    rating = 'Good Work! 👍';
    ratingColor = 'text-green-600';
  } else if (avgScore >= 70) {
    rating = 'Keep Practicing! 💪';
    ratingColor = 'text-amber-600';
  } else {
    rating = 'Room for Growth 📚';
    ratingColor = 'text-slate-600';
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all animate-jump-in">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 text-white rounded-t-2xl">
          <h2 className="text-3xl font-bold mb-2">Game Complete! 🎉</h2>
          <p className="text-emerald-50">You served {roundScores.length} customers</p>
        </div>

        {/* Score Summary */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Score</p>
              <p className="text-5xl font-black text-emerald-600">{score}</p>
              <p className="text-sm text-emerald-600 font-semibold mt-1">
                Better than {percentile}% of players!
              </p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${ratingColor}`}>{rating}</p>
              <p className="text-slate-500 text-sm mt-1">Avg: {avgScore} per round</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <p className="text-emerald-700 font-semibold text-lg">{perfectRounds}</p>
              <p className="text-emerald-600 text-xs font-medium">Perfect Rounds</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-blue-700 font-semibold text-lg">{avgScore}%</p>
              <p className="text-blue-600 text-xs font-medium">Accuracy</p>
            </div>
          </div>
        </div>

        {/* AI Feedback Section */}
        <div className="p-6 border-b border-slate-200 bg-indigo-50">
          <h3 className="text-lg font-bold text-indigo-800 mb-2 flex items-center gap-2">
            <span>🤖</span> AI Chef Feedback
          </h3>
          <p className="text-indigo-700 italic">"{aiFeedback}"</p>
        </div>

        {/* Personalized Feedback */}
        {sortedMistakes.length > 0 && (
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="text-amber-500">💡</span>
              Areas for Improvement
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Based on your {roundScores.length} rounds, here's where you can improve:
            </p>

            <div className="space-y-3">
              {sortedMistakes.map(([nutrient, data]) => {
                const label = nutrientLabels[nutrient] || nutrient;
                const advice = nutrientAdvice[nutrient]?.[data.type] || 'Keep practicing!';
                const issueText = data.type === 'high' ? 'too high' : data.type === 'low' ? 'too low' : 'off target';

                return (
                  <div key={nutrient} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                        {data.count}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 text-sm mb-1">
                          <span className="text-amber-600">{label}</span> {issueText} ({data.count} times)
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">{advice}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Success Message */}
        {sortedMistakes.length === 0 && (
          <div className="p-6 border-b border-slate-200">
            <div className="bg-emerald-50 rounded-lg p-6 text-center border-2 border-emerald-200">
              <p className="text-4xl mb-2">🏆</p>
              <p className="text-emerald-800 font-bold text-lg mb-1">Outstanding Performance!</p>
              <p className="text-emerald-700 text-sm">
                You maintained excellent nutrition balance throughout all rounds!
              </p>
            </div>
          </div>
        )}

        {/* Tips for Next Time */}
        <div className="p-6 bg-slate-50">
          <h4 className="font-bold text-slate-700 text-sm mb-2">💪 Pro Tips:</h4>
          <ul className="text-xs text-slate-600 space-y-1.5">
            <li>• Focus on balanced plates: ½ vegetables, ¼ protein, ¼ carbs</li>
            <li>• Pay attention to customer health conditions (diabetes, heart disease)</li>
            <li>• Fiber helps control blood sugar - aim for 10-15g per meal</li>
            <li>• Keep sodium under 800mg for heart health</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="p-6 space-y-3">
          <SocialShareButton
            score={score}
            percentile={percentile}
            gameName="NutriServe"
          />

          <button
            onClick={onPlayAgain}
            className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold rounded-lg shadow-lg hover:from-emerald-700 hover:to-green-700 transition-all transform hover:scale-105"
          >
            Play Again
          </button>
          <button
            onClick={onExit}
            className="w-full px-4 py-3 bg-white text-slate-700 border-2 border-slate-300 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
          >
            Exit to Games
          </button>
        </div>
      </div>
    </div>
  );
};

export default NutriServeGameOverModal;
