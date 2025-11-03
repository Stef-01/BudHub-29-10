// components/games/nutriserve-ui/DishImageDisplay.tsx
import React from 'react';
import { getFoodImage } from '../../../services/foodImageDataset';

interface DishImageDisplayProps {
  foodItemId: string;
  fallbackVisual?: React.FC<any>;
  maxHeight?: string;
}

/**
 * Displays food images from the permanent dataset.
 * No AI generation - uses pre-uploaded images from the admin panel.
 */
const DishImageDisplay: React.FC<DishImageDisplayProps> = ({
  foodItemId,
  fallbackVisual: FallbackVisual,
  maxHeight = '200px',
}) => {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Load food image from permanent dataset
  React.useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!foodItemId) {
        setLoading(false);
        return;
      }

      try {
        const foodImage = await getFoodImage(foodItemId);
        if (isMounted && foodImage) {
          setImageUrl(foodImage.urls.preview);
        }
      } catch (error) {
        console.warn(`Failed to load food image for ${foodItemId}:`, error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadImage();
    return () => {
      isMounted = false;
    };
  }, [foodItemId]);

  if (loading) {
    return (
      <div
        style={{ height: maxHeight, maxHeight }}
        className="flex items-center justify-center bg-slate-100 rounded-lg animate-pulse"
      >
        <div className="h-8 w-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If we have a dataset image, display it
  if (imageUrl) {
    return (
      <div
        className="rounded-lg overflow-hidden shadow-md bg-white"
        style={{ height: maxHeight, maxHeight }}
      >
        <img
          src={imageUrl}
          alt="Food dish"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Fallback to custom visual component (SVG illustrations)
  if (FallbackVisual) {
    return (
      <div
        style={{ height: maxHeight, maxHeight }}
        className="flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg"
      >
        <FallbackVisual />
      </div>
    );
  }

  // Last resort: placeholder with upload hint
  return (
    <div
      className="flex flex-col items-center justify-center bg-slate-100 rounded-lg border-2 border-dashed border-slate-300"
      style={{ height: maxHeight, maxHeight }}
    >
      <p className="text-slate-400 text-sm">No image uploaded</p>
      <p className="text-slate-300 text-xs mt-1">Use admin panel to add</p>
    </div>
  );
};

export default DishImageDisplay;
