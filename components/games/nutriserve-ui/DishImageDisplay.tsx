// components/games/nutriserve-ui/DishImageDisplay.tsx
import React, { useMemo } from 'react';
import { getRecipeImageState } from '../../../services/imageStoreService';
import { useUserCookbook } from '../../../contexts/UserCookbookContext';
import { LoadingSpinner } from '../../icons/Icons';

interface DishImageDisplayProps {
  foodItemId: string;
  recipeId: string | null;
  fallbackVisual?: React.FC<any>;
  maxHeight?: string;
}

const DishImageDisplay: React.FC<DishImageDisplayProps> = ({
  foodItemId,
  recipeId,
  fallbackVisual: FallbackVisual,
  maxHeight = '200px',
}) => {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { recipes } = useUserCookbook();

  // Try to fetch the recipe image from persistent storage
  React.useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!recipeId || recipeId === 'no-image') {
        setLoading(false);
        return;
      }

      try {
        const imageState = await getRecipeImageState(recipeId);
        if (isMounted && imageState) {
          setImageUrl(imageState.urls.preview);
        }
      } catch (error) {
        console.warn(`Failed to load image for recipe ${recipeId}:`, error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadImage();
    return () => {
      isMounted = false;
    };
  }, [recipeId]);

  // Fallback to emoji if no recipe image available
  const recipeEmoji = React.useMemo(() => {
    if (!recipeId) return null;
    const recipe = recipes.find(r => r.id === recipeId);
    return recipe?.image;
  }, [recipes, recipeId]);

  if (loading && recipeId && recipeId !== 'no-image') {
    return (
      <div
        style={{ height: maxHeight, maxHeight }}
        className="flex items-center justify-center bg-slate-100 rounded-lg animate-pulse"
      >
        <div className="h-8 w-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If we have an image URL, display it
  if (imageUrl) {
    return (
      <div
        className="rounded-lg overflow-hidden shadow-md bg-white"
        style={{ height: maxHeight, maxHeight }}
      >
        <img
          src={imageUrl}
          alt="Prepared dish"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Fallback to custom visual component
  if (FallbackVisual) {
    return (
      <div
        style={{ height: maxHeight, maxHeight }}
        className="flex items-center justify-center"
      >
        <FallbackVisual />
      </div>
    );
  }

  // Fallback to emoji
  if (recipeEmoji && typeof recipeEmoji === 'string') {
    return (
      <div
        className="flex items-center justify-center text-6xl bg-slate-50 rounded-lg border-2 border-slate-200"
        style={{ height: maxHeight, maxHeight }}
      >
        {recipeEmoji}
      </div>
    );
  }

  // Last resort: placeholder
  return (
    <div
      className="flex items-center justify-center bg-slate-100 rounded-lg border-2 border-dashed border-slate-300"
      style={{ height: maxHeight, maxHeight }}
    >
      <p className="text-slate-400 text-sm">No image available</p>
    </div>
  );
};

export default DishImageDisplay;
