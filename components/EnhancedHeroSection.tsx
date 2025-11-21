// components/EnhancedHeroSection.tsx
import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FloatingFruit, RotatingFruit, BouncingFruit, PulsatingFruit } from '../src/components/animations/FruitAnimations';
import { Strawberry, Blueberry, Kiwi, Watermelon, PineappleSlice, GrapeCluster } from '../src/components/illustrations/FruitIllustrations';
import { BlobShape, LeafShape } from '../src/components/illustrations/DecorativeShapes';

interface EnhancedHeroSectionProps {
  loganDiabeticsCount: number;
  mockHbA1c: number;
  currentStreak: number;
  uniqueGameDays: number;
  averageVegServings: number;
  weather: any;
  level: number;
  xp: number;
  xpForNextLevel: number;
}

const EnhancedHeroSection: React.FC<EnhancedHeroSectionProps> = ({
  loganDiabeticsCount,
  mockHbA1c,
  currentStreak,
  uniqueGameDays,
  averageVegServings,
  weather,
  level,
  xp,
  xpForNextLevel
}) => {
  const { scrollY } = useScroll();

  // Parallax transforms for different layers
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);
  const y3 = useTransform(scrollY, [0, 500], [0, 200]);
  const rotate1 = useTransform(scrollY, [0, 500], [0, 45]);
  const rotate2 = useTransform(scrollY, [0, 500], [0, -30]);
  const opacity1 = useTransform(scrollY, [0, 300], [0.3, 0]);

  // Calculate XP percentage
  const xpPercentage = xpForNextLevel > 0 ? (xp / xpForNextLevel) * 100 : 0;

  // Stagger animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <div className="relative bg-gradient-to-br from-cream via-white to-green-50 rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl border-2 border-green-100 overflow-hidden min-h-[500px]">
      {/* Parallax Background Blobs */}
      <motion.div
        style={{ y: y1, opacity: opacity1 }}
        className="absolute -top-20 -left-20 z-0 pointer-events-none"
      >
        <BlobShape size={400} color="#10B981" className="opacity-20" />
      </motion.div>

      <motion.div
        style={{ y: y2 }}
        className="absolute -bottom-10 -right-10 z-0 pointer-events-none"
      >
        <BlobShape size={350} color="#8B3FE8" className="opacity-15" />
      </motion.div>

      {/* Floating Fruit Decorations - Behind all content */}
      <FloatingFruit delay={0.3} className="absolute top-[15%] left-[8%] z-[1] hidden lg:block">
        <Strawberry size={100} className="opacity-50" />
      </FloatingFruit>

      <RotatingFruit delay={0.5} className="absolute top-[20%] right-[12%] z-[1] hidden lg:block">
        <Blueberry size={90} className="opacity-50" />
      </RotatingFruit>

      <BouncingFruit delay={0.8} className="absolute bottom-[25%] left-[10%] z-[1] hidden lg:block">
        <Watermelon size={110} className="opacity-40" />
      </BouncingFruit>

      <PulsatingFruit delay={1} className="absolute bottom-[30%] right-[8%] z-[1] hidden lg:block">
        <Kiwi size={85} className="opacity-50" />
      </PulsatingFruit>

      <FloatingFruit delay={0.6} className="absolute top-[50%] right-[25%] z-[1] hidden lg:block">
        <PineappleSlice size={75} className="opacity-40" />
      </FloatingFruit>

      <motion.div
        style={{ y: y3, rotate: rotate2 }}
        className="absolute bottom-[15%] left-[20%] z-[1] hidden lg:block"
      >
        <LeafShape size={100} className="opacity-40" />
      </motion.div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col md:flex-row items-center gap-6"
      >
        <div className="flex-1 text-center md:text-left">
          <motion.h1
            variants={itemVariants}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-black mb-6 leading-tight tracking-tight"
          >
            <span className="bg-gradient-to-r from-green-600 via-green-500 to-green-600 bg-clip-text text-transparent">
              Your Logan Health Journey
            </span>
          </motion.h1>

          {/* Glass Morphism Stats Cards */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap gap-3 justify-center md:justify-start"
          >
            {/* Streak Card with Gradient */}
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              className={`glass-card rounded-2xl p-4 hover:shadow-lg transition-all flex items-center gap-3 ${
                currentStreak > 0 ? 'ring-2 ring-orange-400' : ''
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                  currentStreak > 0 ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-gray-100'
                }`}
              >
                {currentStreak > 0 ? '🔥' : '📅'}
              </div>
              <div>
                <div className="font-display text-xl font-bold text-gray-900">
                  {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                </div>
                <div className="font-sans text-xs text-gray-500">Streak</div>
              </div>
            </motion.div>

            {/* HbA1c Card */}
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              className="glass-card rounded-2xl p-4 hover:shadow-lg transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-xl">
                📊
              </div>
              <div>
                <div className="font-display text-xl font-bold text-gray-900">{mockHbA1c}%</div>
                <div className="font-sans text-xs text-gray-500">HbA1c</div>
              </div>
            </motion.div>

            {/* Active Days Card */}
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              className="glass-card rounded-2xl p-4 hover:shadow-lg transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-xl">
                🏃
              </div>
              <div>
                <div className="font-display text-xl font-bold text-gray-900">{uniqueGameDays} days</div>
                <div className="font-sans text-xs text-gray-500">Active</div>
              </div>
            </motion.div>

            {/* Veg Serves Card */}
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              className="glass-card rounded-2xl p-4 hover:shadow-lg transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-kiwi to-green-600 rounded-xl flex items-center justify-center text-xl">
                🥗
              </div>
              <div>
                <div className="font-display text-xl font-bold text-gray-900">{averageVegServings}</div>
                <div className="font-sans text-xs text-gray-500">Veg serves</div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Hero Illustration - Animated Fruit Cluster */}
        <motion.div
          variants={itemVariants}
          className="relative"
        >
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-32 h-32 sm:w-40 sm:h-40 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-full opacity-20 blur-2xl"></div>
            <div className="relative z-10">
              <GrapeCluster size={160} />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* XP Bar with Glass Effect */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-8 glass-card rounded-full p-2 flex items-center gap-4 max-w-md mx-auto md:mx-0 relative z-10"
      >
        <span className="font-display text-sm font-bold text-green-600 ml-2">✨ Level {level}</span>
        <div className="flex-1 h-3 bg-green-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${xpPercentage}%` }}
            transition={{ duration: 1, delay: 1, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default EnhancedHeroSection;
