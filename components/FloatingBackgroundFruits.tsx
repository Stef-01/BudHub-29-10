// Floating background decorations component
import React from 'react';
import { motion } from 'framer-motion';
import {
  BackgroundStrawberry,
  BackgroundBlueberry,
  BackgroundKiwi,
  BackgroundWatermelon,
  BackgroundPineapple,
  BackgroundGrapes,
  BackgroundOrange,
  BackgroundLemon
} from '../src/components/illustrations/BackgroundFruits';

interface FloatingFruitProps {
  delay?: number;
  duration?: number;
  className?: string;
  children: React.ReactNode;
}

const FloatingFruit: React.FC<FloatingFruitProps> = ({
  delay = 0,
  duration = 20,
  className = "",
  children
}) => {
  return (
    <motion.div
      className={className}
      initial={{ y: 0, x: 0, rotate: 0 }}
      animate={{
        y: [0, -20, 0],
        x: [0, 10, 0],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: delay,
      }}
    >
      {children}
    </motion.div>
  );
};

const FloatingBackgroundFruits: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top section - near hero */}
      <FloatingFruit delay={0} duration={25} className="absolute top-[100px] left-[3%] z-0 opacity-30 pointer-events-none hidden lg:block">
        <BackgroundStrawberry size={120} />
      </FloatingFruit>

      <FloatingFruit delay={2} duration={22} className="absolute top-[200px] right-[8%] z-0 opacity-25 pointer-events-none hidden lg:block">
        <BackgroundBlueberry size={100} />
      </FloatingFruit>

      {/* Middle section - near produce */}
      <FloatingFruit delay={4} duration={28} className="absolute top-[600px] left-[5%] z-0 opacity-20 pointer-events-none hidden lg:block">
        <BackgroundKiwi size={130} />
      </FloatingFruit>

      <FloatingFruit delay={1.5} duration={24} className="absolute top-[800px] right-[4%] z-0 opacity-25 pointer-events-none hidden lg:block">
        <BackgroundWatermelon size={140} />
      </FloatingFruit>

      <FloatingFruit delay={3} duration={26} className="absolute top-[1000px] left-[10%] z-0 opacity-20 pointer-events-none hidden md:block">
        <BackgroundPineapple size={110} />
      </FloatingFruit>

      {/* Lower section - near games */}
      <FloatingFruit delay={5} duration={23} className="absolute top-[1400px] right-[12%] z-0 opacity-30 pointer-events-none hidden lg:block">
        <BackgroundGrapes size={100} />
      </FloatingFruit>

      <FloatingFruit delay={2.5} duration={27} className="absolute top-[1800px] left-[7%] z-0 opacity-25 pointer-events-none hidden md:block">
        <BackgroundOrange size={115} />
      </FloatingFruit>

      <FloatingFruit delay={4.5} duration={21} className="absolute top-[2200px] right-[6%] z-0 opacity-20 pointer-events-none hidden lg:block">
        <BackgroundLemon size={95} />
      </FloatingFruit>

      {/* Additional scattered fruits for richness */}
      <FloatingFruit delay={1} duration={29} className="absolute top-[400px] left-[15%] z-0 opacity-15 pointer-events-none hidden xl:block">
        <BackgroundGrapes size={80} />
      </FloatingFruit>

      <FloatingFruit delay={3.5} duration={25} className="absolute top-[1200px] right-[15%] z-0 opacity-18 pointer-events-none hidden xl:block">
        <BackgroundLemon size={85} />
      </FloatingFruit>

      <FloatingFruit delay={5.5} duration={24} className="absolute top-[1600px] left-[2%] z-0 opacity-22 pointer-events-none hidden xl:block">
        <BackgroundStrawberry size={95} />
      </FloatingFruit>
    </div>
  );
};

export default FloatingBackgroundFruits;
