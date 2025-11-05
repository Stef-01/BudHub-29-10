// components/games/nutriserve-ui/ResultModal.tsx
import React, { useMemo } from 'react';
// FIX: Corrected import path for NutriServeCustomerWithTargets type.
import type { NutriServeCustomerWithTargets } from '../NutriServeTypes';
// FIX: Corrected import path for NutrientStatus type.
import type { NutrientStatus } from '../../../services/nutriserveUtils';
import { IconArrowRightCircle } from './Icons';
// FIX: Corrected import path for getMainDishFromOrder utility.
import { getMainDishFromOrder } from '../../../services/nutriserveUtils';
import DishImageDisplay from './DishImageDisplay';

interface ResultModalProps {
  score: number;
  customer: NutriServeCustomerWithTargets;
  feedback: Record<string, NutrientStatus>;
  onNext: () => void;
  isLastRound: boolean;
}

// Generate health-condition specific feedback
const generateConditionFeedback = (
    nutrient: string,
    status: NutrientStatus,
    diabetesMode: string,
    customerName: string
): string => {
    if (status === 'good') {
        const goodMessages: Record<string, string> = {
            calories_kcal: 'Perfect calorie range!',
            protein_g: 'Great protein level!',
            carbs_g: diabetesMode !== 'None' ? 'Carbs won\'t spike blood sugar!' : 'Carbs are in check!',
            fat_g: 'Healthy fat amount!',
            fiber_g: diabetesMode !== 'None' ? 'Excellent fiber for blood sugar control!' : 'Excellent fiber!',
            sodium_mg: 'Sodium level is great for heart health!',
        };
        return goodMessages[nutrient] || 'Good!';
    }

    // Condition-specific bad feedback
    const isDiabetic = diabetesMode === 'Low-Carb' || diabetesMode === 'Balanced';

    if (nutrient === 'carbs_g' && status === 'high') {
        if (diabetesMode === 'Low-Carb') {
            return '⚠️ Too many carbs! This will spike blood sugar dangerously for a diabetic on low-carb diet.';
        } else if (diabetesMode === 'Balanced') {
            return '⚠️ Excessive carbs! This could cause a blood sugar spike for a Type 2 diabetic.';
        }
        return 'Too many carbs.';
    }

    if (nutrient === 'calories_kcal') {
        if (status === 'high') {
            return isDiabetic
                ? '⚠️ Too many calories! Weight management is crucial for diabetes control.'
                : 'Too many calories - this is too heavy.';
        }
        return 'A bit light on calories.';
    }

    if (nutrient === 'fat_g' && status === 'high') {
        return '⚠️ Too much fat! This is dangerous for someone with high cholesterol and heart disease history.';
    }

    if (nutrient === 'sodium_mg' && status === 'high') {
        return '⚠️ Excessive sodium! This will raise blood pressure - dangerous for cardiac patients with hypertension.';
    }

    if (nutrient === 'fiber_g' && status === 'low') {
        return isDiabetic
            ? '⚠️ Not enough fiber! Fiber is essential to slow glucose absorption and prevent blood sugar spikes.'
            : 'Could use more fiber for digestive health.';
    }

    if (nutrient === 'protein_g' && status === 'low') {
        return isDiabetic
            ? '⚠️ Insufficient protein! Protein helps stabilize blood sugar levels.'
            : 'Could use more protein.';
    }

    return 'Not quite right.';
};

const ResultModal: React.FC<ResultModalProps> = ({ score, customer, feedback, onNext, isLastRound }) => {
    const isSuccess = score >= 100;
    const CharacterVisual = isSuccess ? customer.visuals.happy : customer.visuals.sad;
    const dialogue = isSuccess ? customer.dialogue.positive : (score > 50 ? customer.dialogue.neutral : customer.dialogue.negative);
    
    // Extract main dish info
    const mainDish = useMemo(
        () => getMainDishFromOrder(customer.order.required_items),
        [customer.order.required_items]
    );


  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-jump-in">

        {/* Scrollable content area */}
        <div className="p-6 text-center overflow-y-auto flex-1">
          <div className="w-20 h-20 mx-auto">
              <CharacterVisual />
          </div>

          <h2 className="text-xl font-bold text-slate-800 mt-2">Order Complete!</h2>
          <p className="text-slate-600 italic mt-1 p-2 bg-slate-50 rounded-lg text-sm">"{dialogue}" - {customer.name}</p>

          {mainDish && (
            <div className="my-3">
              <p className="text-xs text-slate-600 font-semibold mb-2">
                You prepared: {mainDish.foodItem.label}
              </p>
              <DishImageDisplay
                foodItemId={mainDish.foodItem.id}
                fallbackVisual={mainDish.foodItem.visual}
                maxHeight="140px"
              />
            </div>
          )}

          <p className={`text-5xl font-extrabold my-3 ${isSuccess ? 'text-emerald-600' : 'text-rose-500'}`}>
              +{score}
          </p>

          <div className="space-y-1.5 text-left my-4 text-xs">
              {Object.entries(feedback).map(([nutrient, status]) => {
                  const message = generateConditionFeedback(
                      nutrient,
                      status as NutrientStatus,
                      customer.order.diabetesMode,
                      customer.name
                  );
                  return (
                      <div key={nutrient} className={`p-2 rounded-md font-semibold ${status === 'good' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {message}
                      </div>
                  )
              })}
          </div>
        </div>

        {/* Fixed button at bottom */}
        <div className="p-4 border-t border-slate-200 flex-shrink-0">
          <button
            onClick={onNext}
            className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-700 transition-colors"
          >
            {isLastRound ? 'Finish Game' : 'Next Customer'}
            <IconArrowRightCircle className="ml-2 h-5 w-5"/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;