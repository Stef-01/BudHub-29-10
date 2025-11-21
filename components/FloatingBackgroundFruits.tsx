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
      {/* Evenly distributed throughout page - avoiding top hero section */}

      {/* Upper-middle section */}
      <FloatingFruit delay={0} duration={25} className="absolute top-[500px] left-[3%] z-0 opacity-28 pointer-events-none hidden lg:block">
        <BackgroundStrawberry size={110} />
      </FloatingFruit>

      <FloatingFruit delay={2} duration={22} className="absolute top-[700px] right-[5%] z-0 opacity-25 pointer-events-none hidden lg:block">
        <BackgroundBlueberry size={95} />
      </FloatingFruit>

      {/* Middle section */}
      <FloatingFruit delay={4} duration={28} className="absolute top-[950px] left-[8%] z-0 opacity-22 pointer-events-none hidden lg:block">
        <BackgroundKiwi size={120} />
      </FloatingFruit>

      <FloatingFruit delay={1.5} duration={24} className="absolute top-[1150px] right-[6%] z-0 opacity-26 pointer-events-none hidden lg:block">
        <BackgroundWatermelon size={130} />
      </FloatingFruit>

      <FloatingFruit delay={3} duration={26} className="absolute top-[1350px] left-[4%] z-0 opacity-24 pointer-events-none hidden md:block">
        <BackgroundPineapple size={105} />
      </FloatingFruit>

      {/* Lower-middle section */}
      <FloatingFruit delay={5} duration={23} className="absolute top-[1600px] right-[10%] z-0 opacity-28 pointer-events-none hidden lg:block">
        <BackgroundGrapes size={100} />
      </FloatingFruit>

      <FloatingFruit delay={2.5} duration={27} className="absolute top-[1850px] left-[6%] z-0 opacity-26 pointer-events-none hidden md:block">
        <BackgroundOrange size={110} />
      </FloatingFruit>

      {/* Bottom section - more concentrated here */}
      <FloatingFruit delay={4.5} duration={21} className="absolute top-[2100px] right-[7%] z-0 opacity-30 pointer-events-none hidden lg:block">
        <BackgroundLemon size={105} />
      </FloatingFruit>

      <FloatingFruit delay={1} duration={29} className="absolute top-[2350px] left-[12%] z-0 opacity-28 pointer-events-none hidden lg:block">
        <BackgroundStrawberry size={115} />
      </FloatingFruit>

      <FloatingFruit delay={3.5} duration={25} className="absolute top-[2600px] right-[8%] z-0 opacity-32 pointer-events-none hidden lg:block">
        <BackgroundWatermelon size={125} />
      </FloatingFruit>

      {/* Additional bottom fruits for richness */}
      <FloatingFruit delay={5.5} duration={24} className="absolute top-[2850px] left-[5%] z-0 opacity-30 pointer-events-none hidden xl:block">
        <BackgroundGrapes size={90} />
      </FloatingFruit>

      <FloatingFruit delay={2} duration={26} className="absolute top-[3100px] right-[12%] z-0 opacity-28 pointer-events-none hidden xl:block">
        <BackgroundPineapple size={100} />
      </FloatingFruit>
    </div>
  );
};

export default FloatingBackgroundFruits;
