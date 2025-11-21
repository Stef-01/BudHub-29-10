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
    <>
      {/* Top left area */}
      <FloatingFruit delay={0} duration={25} className="fixed top-[5%] left-[3%] z-0 opacity-30 pointer-events-none hidden lg:block">
        <BackgroundStrawberry size={120} />
      </FloatingFruit>

      <FloatingFruit delay={2} duration={22} className="fixed top-[15%] right-[8%] z-0 opacity-25 pointer-events-none hidden lg:block">
        <BackgroundBlueberry size={100} />
      </FloatingFruit>

      {/* Middle section */}
      <FloatingFruit delay={4} duration={28} className="fixed top-[35%] left-[5%] z-0 opacity-20 pointer-events-none hidden lg:block">
        <BackgroundKiwi size={130} />
      </FloatingFruit>

      <FloatingFruit delay={1.5} duration={24} className="fixed top-[30%] right-[4%] z-0 opacity-25 pointer-events-none hidden lg:block">
        <BackgroundWatermelon size={140} />
      </FloatingFruit>

      <FloatingFruit delay={3} duration={26} className="fixed top-[50%] left-[10%] z-0 opacity-20 pointer-events-none hidden md:block">
        <BackgroundPineapple size={110} />
      </FloatingFruit>

      {/* Lower section */}
      <FloatingFruit delay={5} duration={23} className="fixed top-[65%] right-[12%] z-0 opacity-30 pointer-events-none hidden lg:block">
        <BackgroundGrapes size={100} />
      </FloatingFruit>

      <FloatingFruit delay={2.5} duration={27} className="fixed top-[75%] left-[7%] z-0 opacity-25 pointer-events-none hidden md:block">
        <BackgroundOrange size={115} />
      </FloatingFruit>

      <FloatingFruit delay={4.5} duration={21} className="fixed top-[80%] right-[6%] z-0 opacity-20 pointer-events-none hidden lg:block">
        <BackgroundLemon size={95} />
      </FloatingFruit>

      {/* Additional scattered fruits for richness */}
      <FloatingFruit delay={1} duration={29} className="fixed top-[20%] left-[15%] z-0 opacity-15 pointer-events-none hidden xl:block">
        <BackgroundGrapes size={80} />
      </FloatingFruit>

      <FloatingFruit delay={3.5} duration={25} className="fixed top-[45%] right-[15%] z-0 opacity-18 pointer-events-none hidden xl:block">
        <BackgroundLemon size={85} />
      </FloatingFruit>

      <FloatingFruit delay={5.5} duration={24} className="fixed top-[60%] left-[2%] z-0 opacity-22 pointer-events-none hidden xl:block">
        <BackgroundStrawberry size={95} />
      </FloatingFruit>
    </>
  );
};

export default FloatingBackgroundFruits;
