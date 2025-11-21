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
import {
  Tomato,
  Onion,
  Potato,
  Eggplant,
  Okra,
  Spinach,
  Carrot,
  Cauliflower,
  BellPepper,
  Cucumber,
  Chili,
  BottleGourd,
  Pumpkin,
  Cabbage,
  Radish,
  Beetroot,
  Ginger,
  GreenBeans,
  Garlic,
  Peas,
  CurryLeaves,
  Coriander,
  RidgeGourd,
  Coconut
} from '../src/components/illustrations/VegetableIllustrations';

interface ProduceCardProps {
  name: string;
  price: string;
  market?: string;
  fruitType?: 'strawberry' | 'blueberry' | 'kiwi' | 'watermelon' | 'pineapple' | 'grape' |
              'tomato' | 'onion' | 'potato' | 'eggplant' | 'okra' | 'spinach' |
              'carrot' | 'cauliflower' | 'bellpepper' | 'cucumber' | 'chili' |
              'bottlegourd' | 'pumpkin' | 'cabbage' | 'radish' | 'beetroot' |
              'ginger' | 'greenbeans' | 'garlic' | 'peas' |
              'curryleaves' | 'coriander' | 'ridgegourd' | 'coconut' | 'generic';
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
  // Select fruit/vegetable illustration based on type
  const FruitIllustration = () => {
    switch (fruitType) {
      // Fruits
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
      // Vegetables
      case 'tomato':
        return <Tomato size={90} />;
      case 'onion':
        return <Onion size={90} />;
      case 'potato':
        return <Potato size={90} />;
      case 'eggplant':
        return <Eggplant size={90} />;
      case 'okra':
        return <Okra size={90} />;
      case 'spinach':
        return <Spinach size={90} />;
      case 'carrot':
        return <Carrot size={90} />;
      case 'cauliflower':
        return <Cauliflower size={90} />;
      case 'bellpepper':
        return <BellPepper size={90} />;
      case 'cucumber':
        return <Cucumber size={90} />;
      case 'chili':
        return <Chili size={90} />;
      case 'bottlegourd':
        return <BottleGourd size={90} />;
      case 'pumpkin':
        return <Pumpkin size={90} />;
      case 'cabbage':
        return <Cabbage size={90} />;
      case 'radish':
        return <Radish size={90} />;
      case 'beetroot':
        return <Beetroot size={90} />;
      case 'ginger':
        return <Ginger size={90} />;
      case 'greenbeans':
        return <GreenBeans size={90} />;
      case 'garlic':
        return <Garlic size={90} />;
      case 'peas':
        return <Peas size={90} />;
      case 'curryleaves':
        return <CurryLeaves size={90} />;
      case 'coriander':
        return <Coriander size={90} />;
      case 'ridgegourd':
        return <RidgeGourd size={90} />;
      case 'coconut':
        return <Coconut size={90} />;
      default:
        // Fallback to a generic vegetable emoji
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

        {/* Market Badge - subtle and small */}
        {market && (
          <div className="flex items-center justify-center mt-1">
            <span className="font-sans text-xs text-gray-500 truncate">{market}</span>
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
 * Helper function to map produce names to fruit/vegetable types
 * Automatically detects produce type from name
 */
export const mapProduceToFruitType = (produceName: string): ProduceCardProps['fruitType'] => {
  const name = produceName.toLowerCase();

  // Fruits
  if (name.includes('strawberry') || name.includes('strawberries')) return 'strawberry';
  if (name.includes('blueberry') || name.includes('blueberries')) return 'blueberry';
  if (name.includes('kiwi')) return 'kiwi';
  if (name.includes('watermelon')) return 'watermelon';
  if (name.includes('pineapple')) return 'pineapple';
  if (name.includes('grape') || name.includes('grapes')) return 'grape';

  // Vegetables
  if (name.includes('tomato') || name.includes('tamatar')) return 'tomato';
  if (name.includes('onion') || name.includes('pyaaz') || name.includes('pyaz')) return 'onion';
  if (name.includes('potato') || name.includes('aloo') || name.includes('alu')) return 'potato';
  if (name.includes('eggplant') || name.includes('brinjal') || name.includes('baingan')) return 'eggplant';
  if (name.includes('okra') || name.includes('bhindi') || name.includes('lady finger')) return 'okra';
  if (name.includes('spinach') || name.includes('palak') || name.includes('saag')) return 'spinach';
  if (name.includes('carrot') || name.includes('gajar')) return 'carrot';
  if (name.includes('cauliflower') || name.includes('gobi') || name.includes('phool gobi')) return 'cauliflower';
  if (name.includes('pepper') || name.includes('capsicum') || name.includes('shimla mirch')) return 'bellpepper';
  if (name.includes('cucumber') || name.includes('kheera') || name.includes('kakdi')) return 'cucumber';
  if (name.includes('chili') || name.includes('chilli') || name.includes('mirch') || name.includes('green chili')) return 'chili';
  if (name.includes('bottle gourd') || name.includes('lauki') || name.includes('ghiya')) return 'bottlegourd';
  if (name.includes('pumpkin') || name.includes('kaddu') || name.includes('sitaphal')) return 'pumpkin';
  if (name.includes('cabbage') || name.includes('patta gobi') || name.includes('bandh gobi')) return 'cabbage';
  if (name.includes('radish') || name.includes('mooli')) return 'radish';
  if (name.includes('beetroot') || name.includes('beet') || name.includes('chukandar')) return 'beetroot';
  if (name.includes('ginger') || name.includes('adrak')) return 'ginger';
  if (name.includes('green bean') || name.includes('beans') || name.includes('sem')) return 'greenbeans';
  if (name.includes('garlic') || name.includes('lahsun') || name.includes('lasun')) return 'garlic';
  if (name.includes('peas') || name.includes('matar')) return 'peas';
  if (name.includes('curry leaves') || name.includes('curry leaf') || name.includes('kadi patta') || name.includes('kadipatta')) return 'curryleaves';
  if (name.includes('coriander') || name.includes('cilantro') || name.includes('dhania')) return 'coriander';
  if (name.includes('ridge gourd') || name.includes('turai') || name.includes('tori')) return 'ridgegourd';
  if (name.includes('coconut') || name.includes('nariyal')) return 'coconut';

  return 'generic';
};
