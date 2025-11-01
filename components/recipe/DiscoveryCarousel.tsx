// components/recipe/DiscoveryCarousel.tsx
import React, { useMemo } from 'react';
import { useUserCookbook } from '../../contexts/UserCookbookContext';
import { useUserGarden } from '../../contexts/UserGardenContext';
import { RECIPE_CATALOG } from '../../constants';
import RecipeCard from '../RecipeCard';
import Button from '../ui/Button';
import { CheckIcon, PlusIcon } from '../icons/Icons';

const DiscoveryCarousel: React.FC<{ onRecipeClick: (id: string) => void }> = ({ onRecipeClick }) => {
    const { myPlants } = useUserGarden();
    const { recipes: myRecipes, transientRecipeState, saveRecipe, isRecipeSaved } = useUserCookbook();

    const seasonalRecipes = useMemo(() => {
        const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
        const harvestableIngredients = new Set(
            myPlants.filter(p => p.fruitingMonths.includes(currentMonth)).map(p => p.name)
        );

        if (harvestableIngredients.size === 0) {
            return RECIPE_CATALOG;
        }
        
        return [...RECIPE_CATALOG].sort((a, b) => {
            const aScore = a.keyIngredients.filter(ing => harvestableIngredients.has(ing)).length;
            const bScore = b.keyIngredients.filter(ing => harvestableIngredients.has(ing)).length;
            return bScore - aScore;
        });
    }, [myPlants]);
    
    const myRecipesMap = useMemo(() => new Map(myRecipes.map(r => [r.id, r])), [myRecipes]);

    return (
        <div className="mb-12">
            <h3 className="text-xl font-bold text-green-900 mb-4">Discover New Flavors</h3>
            <div className="flex space-x-6 overflow-x-auto pb-4 -mx-4 px-4 group-hover:pause-animation">
                <div className="flex space-x-6 animate-marquee-slow pause-animation">
                    {seasonalRecipes.map((catalogRecipe) => {
                        const recipe = 
                            myRecipesMap.get(catalogRecipe.id) ||
                            transientRecipeState.get(catalogRecipe.id) ||
                            catalogRecipe;

                        return (
                            <div key={recipe.id} className="w-64 flex-shrink-0">
                                <RecipeCard recipe={recipe} onClick={() => onRecipeClick(recipe.id)} />
                                <div className="mt-2">
                                    {isRecipeSaved(recipe.id) ? (
                                        <Button variant="secondary" disabled className="w-full">
                                            <CheckIcon className="h-5 w-5 mr-2" />
                                            Saved
                                        </Button>
                                    ) : (
                                        <Button variant="secondary" onClick={() => saveRecipe(recipe)} className="w-full">
                                            <PlusIcon className="h-5 w-5 mr-2" />
                                            Save to Cookbook
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DiscoveryCarousel;
