// components/ProduceCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { JuicySplashFruit } from '../src/components/animations/FruitAnimations';
import {
  Strawberry,
  Blueberry,
  Kiwi,
  Watermelon,
  PineappleSlice,
  GrapeCluster
} from '../src/components/illustrations/FruitIllustrations';

interface ProduceCardProps {
  name: string;
  price: string;
  market?: string;
  fruitType?: 'strawberry' | 'blueberry' | 'kiwi' | 'watermelon' | 'pineapple' | 'grape' | 'generic';
  isIndianStaple?: boolean;
  isLowGI?: boolean;
  onClick?: () => void;
}

const ProduceCard: React.FC<ProduceCardProps> = ({
  name,
  price,
  market,
  fruitType = 'generic',
  isIndianStaple = false,
  isLowGI = false,
  onClick
}) => {
  // Select fruit illustration based on type
  const FruitIllustration = () => {
    switch (fruitType) {
      case 'strawberry':
        return <Strawberry size={90} />;
      case 'blueberry':
        return <Blueberry size={90} />;
      case 'kiwi':
        return <Kiwi size={90} />;
      case 'watermelon':
        return <Watermelon size={90} />;
      case 'pineapple':
        return <PineappleSlice size={90} />;
      case 'grape':
        return <GrapeCluster size={90} />;
      default:
        // Fallback to a generic fruit emoji
        return <div className="text-6xl">🥬</div>;
    }
  };

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer border border-gray-100 hover:border-green-300 overflow-hidden min-w-[220px]"
    >
      {/* Gradient glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-radial from-green-400/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      <div className="relative z-10">
        {/* Animated Fruit Icon */}
        <div className="flex justify-center mb-4">
          {fruitType !== 'generic' ? (
            <JuicySplashFruit>
              <FruitIllustration />
            </JuicySplashFruit>
          ) : (
            <FruitIllustration />
          )}
        </div>

        {/* Product Name */}
        <h3 className="font-display text-lg font-bold text-gray-900 mb-2 text-center group-hover:text-green-600 transition-colors">
          {name}
        </h3>

        {/* Price */}
        <div className="text-center mb-3">
          <span className="font-display text-3xl font-black text-green-600">
            {price}
          </span>
          <span className="font-sans text-sm text-gray-500">/kg</span>
        </div>

        {/* Market Badge */}
        {market && (
          <div className="flex items-center justify-center text-sm text-gray-600 mb-2">
            <span className="font-sans font-medium truncate">{market}</span>
          </div>
        )}

        {/* Tags */}
        {(isIndianStaple || isLowGI) && (
          <div className="flex flex-wrap gap-2 justify-center">
            {isIndianStaple && (
              <span className="inline-flex px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-semibold rounded-full">
                Indian Staple
              </span>
            )}
            {isLowGI && (
              <span className="inline-flex px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                Low GI
              </span>
            )}
          </div>
        )}

        {/* Decorative corner */}
        <div className="absolute top-3 right-3 w-8 h-8 bg-green-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-xs">✨</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProduceCard;

/**
 * Helper function to map produce names to fruit types
 * This can be expanded based on your actual produce items
 */
export const mapProduceToFruitType = (produceName: string): ProduceCardProps['fruitType'] => {
  const name = produceName.toLowerCase();

  if (name.includes('strawberry')) return 'strawberry';
  if (name.includes('blueberry')) return 'blueberry';
  if (name.includes('kiwi')) return 'kiwi';
  if (name.includes('watermelon')) return 'watermelon';
  if (name.includes('pineapple')) return 'pineapple';
  if (name.includes('grape')) return 'grape';

  return 'generic';
};
