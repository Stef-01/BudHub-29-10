// components/recipe/RecipeActions.tsx
import React, { useState } from 'react';
import type { Recipe } from '../../types';
import { useUserCookbook } from '../../contexts/UserCookbookContext';
import { useUserGarden } from '../../contexts/UserGardenContext';
import { getRecipeSuggestion } from '../../services/geminiService';
import Button from '../ui/Button';
import { SparklesIcon, PlusIcon, LoadingSpinner } from '../icons/Icons';

interface RecipeActionsProps {
    onOpenAddModal: () => void;
}

const RecipeActions: React.FC<RecipeActionsProps> = ({ onOpenAddModal }) => {
    const { myPlants } = useUserGarden();
    const { saveRecipe } = useUserCookbook();
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateRecipe = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const recipeData = await getRecipeSuggestion(myPlants);
            if (recipeData.name !== "Garden's Resting") {
              const newRecipe: Recipe = {
                ...recipeData,
                id: `recipe_gemini_${new Date().getTime()}`,
                source: 'gemini',
                keyIngredients: [],
                imageMetadata: { source: 'emoji', status: 'pending' }
              };
              saveRecipe(newRecipe);
            } else {
              setError("Nothing is ready for harvest right now, so we can't suggest a recipe.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate a recipe. Please try again.');
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };
    
    return (
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-green-900">My Cookbook</h2>
            <div className="flex gap-2 flex-wrap">
                <Button
                    variant="ai"
                    onClick={handleGenerateRecipe}
                    disabled={isGenerating || myPlants.length === 0}
                    title={myPlants.length === 0 ? "Add plants to your garden to get recipe suggestions" : "Suggest a recipe with Gemini"}
                >
                    {isGenerating ? <LoadingSpinner className="h-5 w-5 mr-2"/> : <SparklesIcon className="h-5 w-5 mr-2" />}
                    {isGenerating ? 'Cooking...' : 'AI Suggestion'}
                </Button>
                <Button 
                    variant="primary"
                    onClick={onOpenAddModal}
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Your Own
                </Button>
            </div>
            {error && <p className="w-full text-center text-red-600">{error}</p>}
        </div>
    );
};

export default RecipeActions;
