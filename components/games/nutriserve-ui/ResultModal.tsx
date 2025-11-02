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

const feedbackText: Record<string, (status: NutrientStatus) => string> = {
    calories_kcal: s => s === 'good' ? 'Perfect calorie range!' : (s === 'low' ? 'A bit light on calories.' : 'A bit too heavy.'),
    protein_g: s => s === 'good' ? 'Great protein level!' : 'Could use more protein.',
    carbs_g: s => s === 'good' ? 'Carbs are in check!' : 'Too many carbs.',
    fat_g: s => s === 'good' ? 'Healthy fat amount!' : 'A bit too much fat.',
    fiber_g: s => s === 'good' ? 'Excellent fiber!' : 'Could use more fiber.',
    sodium_mg: s => s === 'good' ? 'Sodium level is great!' : 'Too much sodium.',
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center animate-jump-in max-h-[90vh] overflow-y-auto">
        
        <div className="w-24 h-24 mx-auto">
            <CharacterVisual />
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mt-2">Order Complete!</h2>
        <p className="text-slate-600 italic mt-2 p-2 bg-slate-50 rounded-lg">"{dialogue}" - {customer.name}</p>
        
        {mainDish && (
          <div className="my-4">
            <p className="text-sm text-slate-600 font-semibold mb-2">
              You prepared:
            </p>
            <DishImageDisplay
              foodItemId={mainDish.foodItem.id}
              recipeId={mainDish.recipeId}
              maxHeight="180px"
            />
          </div>
        )}

        <p className={`text-6xl font-extrabold my-4 ${isSuccess ? 'text-emerald-600' : 'text-rose-500'}`}>
            +{score}
        </p>
        
        <div className="space-y-1 text-left my-6 text-sm">
            {Object.entries(feedback).map(([nutrient, status]) => {
                const key = nutrient as keyof typeof feedbackText;
                if (!feedbackText[key]) return null;
                return (
                    <div key={nutrient} className={`p-1.5 rounded-md font-semibold ${status === 'good' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {/* FIX: Cast status to NutrientStatus to resolve TS error with Object.entries */}
                        {feedbackText[key](status as NutrientStatus)}
                    </div>
                )
            })}
        </div>
        
        <button
          onClick={onNext}
          className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-700 transition-colors"
        >
          {isLastRound ? 'Finish Game' : 'Next Customer'}
          <IconArrowRightCircle className="ml-2 h-5 w-5"/>
        </button>
      </div>
    </div>
  );
};

export default ResultModal;
