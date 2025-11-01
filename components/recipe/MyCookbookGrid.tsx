// components/recipe/MyCookbookGrid.tsx
import React from 'react';
import { useUserCookbook } from '../../contexts/UserCookbookContext';
import RecipeCard from '../RecipeCard';
import RecipeActions from './RecipeActions';

interface MyCookbookGridProps {
    onRecipeClick: (id: string) => void;
    onOpenAddModal: () => void;
}

const MyCookbookGrid: React.FC<MyCookbookGridProps> = ({ onRecipeClick, onOpenAddModal }) => {
    const { recipes } = useUserCookbook();

    return (
        <div>
            {recipes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {recipes.map((recipe) => (
                        <RecipeCard key={recipe.id} recipe={recipe} onClick={() => onRecipeClick(recipe.id)} />
                    ))}
                </div>
            ) : (
                 <div className="text-center p-8 bg-white/80 rounded-xl">
                    <h3 className="text-xl font-semibold text-gray-700">Your cookbook is empty!</h3>
                    <p className="text-gray-500 mt-2 mb-6">Get started by adding a recipe from our suggestions or creating your own.</p>
                    <div className="flex justify-center">
                        <RecipeActions onOpenAddModal={onOpenAddModal} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyCookbookGrid;
