// Decorative vegetables for the produce section
import React from 'react';
import { motion } from 'framer-motion';
import {
  BackgroundTomato,
  BackgroundCarrot,
  BackgroundEggplant,
  BackgroundOnion,
  BackgroundCauliflower,
  BackgroundPumpkin,
  BackgroundCucumber,
  BackgroundBellPepper
} from '../src/components/illustrations/BackgroundVegetables';

interface FloatingVegetableProps {
  delay?: number;
  duration?: number;
  className?: string;
  children: React.ReactNode;
}

const FloatingVegetable: React.FC<FloatingVegetableProps> = ({
  delay = 0,
  duration = 18,
  className = "",
  children
}) => {
  return (
    <motion.div
      className={className}
      initial={{ y: 0, x: 0, rotate: 0, scale: 1 }}
      animate={{
        y: [0, -15, 0],
        x: [0, 8, 0],
        rotate: [0, 3, -3, 0],
        scale: [1, 1.05, 1],
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

const ProduceSectionDecorations: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top left */}
      <FloatingVegetable delay={0} duration={20} className="absolute top-[5%] left-[2%] opacity-20 hidden lg:block">
        <BackgroundTomato size={110} />
      </FloatingVegetable>

      {/* Top right */}
      <FloatingVegetable delay={1.5} duration={22} className="absolute top-[8%] right-[3%] opacity-18 hidden lg:block">
        <BackgroundCarrot size={100} />
      </FloatingVegetable>

      {/* Middle left */}
      <FloatingVegetable delay={2.5} duration={19} className="absolute top-[35%] left-[1%] opacity-15 hidden md:block">
        <BackgroundEggplant size={95} />
      </FloatingVegetable>

      {/* Middle right */}
      <FloatingVegetable delay={3} duration={21} className="absolute top-[40%] right-[2%] opacity-22 hidden lg:block">
        <BackgroundOnion size={90} />
      </FloatingVegetable>

      {/* Lower left */}
      <FloatingVegetable delay={1} duration={23} className="absolute top-[65%] left-[3%] opacity-17 hidden md:block">
        <BackgroundCauliflower size={105} />
      </FloatingVegetable>

      {/* Lower right */}
      <FloatingVegetable delay={4} duration={20} className="absolute top-[70%] right-[1%] opacity-20 hidden lg:block">
        <BackgroundPumpkin size={115} />
      </FloatingVegetable>

      {/* Extra decorations for larger screens */}
      <FloatingVegetable delay={2} duration={24} className="absolute top-[25%] left-[8%] opacity-12 hidden xl:block">
        <BackgroundCucumber size={85} />
      </FloatingVegetable>

      <FloatingVegetable delay={3.5} duration={19} className="absolute top-[55%] right-[7%] opacity-16 hidden xl:block">
        <BackgroundBellPepper size={95} />
      </FloatingVegetable>
    </div>
  );
};

export default ProduceSectionDecorations;
