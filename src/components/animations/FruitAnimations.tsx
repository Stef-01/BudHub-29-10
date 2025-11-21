import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedFruitProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function FloatingFruit({ children, delay = 0, className = "" }: AnimatedFruitProps) {
  return (
    <motion.div
      className={className}
      initial={{ y: 0, rotate: 0 }}
      animate={{
        y: [-20, 20, -20],
        rotate: [-5, 5, -5],
      }}
      transition={{
        duration: 4 + Math.random() * 2,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

export function RotatingFruit({ children, delay = 0, className = "" }: AnimatedFruitProps) {
  return (
    <motion.div
      className={className}
      initial={{ rotateY: 0, rotateZ: 0 }}
      animate={{
        rotateY: [0, 360],
        rotateZ: [0, 15, 0, -15, 0],
      }}
      transition={{
        rotateY: {
          duration: 8,
          delay,
          repeat: Infinity,
          ease: "linear",
        },
        rotateZ: {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </motion.div>
  );
}

export function BouncingFruit({ children, delay = 0, className = "" }: AnimatedFruitProps) {
  return (
    <motion.div
      className={className}
      initial={{ y: 0, scale: 1 }}
      animate={{
        y: [0, -40, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        ease: "easeOut",
        times: [0, 0.4, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export function PulsatingFruit({ children, delay = 0, className = "" }: AnimatedFruitProps) {
  return (
    <motion.div
      className={className}
      initial={{ scale: 1, opacity: 0.8 }}
      animate={{
        scale: [1, 1.15, 1],
        opacity: [0.8, 1, 0.8],
      }}
      transition={{
        duration: 2.5,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

export function SwingingFruit({ children, delay = 0, className = "" }: AnimatedFruitProps) {
  return (
    <motion.div
      className={className}
      style={{ transformOrigin: "top center" }}
      initial={{ rotate: 0 }}
      animate={{
        rotate: [-15, 15, -15],
      }}
      transition={{
        duration: 3,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

export function SpinningFruit({ children, delay = 0, className = "" }: AnimatedFruitProps) {
  return (
    <motion.div
      className={className}
      initial={{ rotate: 0, scale: 1 }}
      animate={{
        rotate: 360,
        scale: [1, 1.2, 1],
      }}
      transition={{
        rotate: {
          duration: 6,
          delay,
          repeat: Infinity,
          ease: "linear",
        },
        scale: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function WobblingFruit({ children, delay = 0, className = "" }: AnimatedFruitProps) {
  return (
    <motion.div
      className={className}
      initial={{ rotate: 0, x: 0 }}
      animate={{
        rotate: [-10, 10, -10],
        x: [-5, 5, -5],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

export function ScalingFruit({ children, delay = 0, className = "" }: AnimatedFruitProps) {
  return (
    <motion.div
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      whileInView={{
        scale: [0.8, 1.2, 1],
        opacity: [0, 1, 1],
      }}
      viewport={{ once: true }}
      transition={{
        duration: 1,
        delay,
        ease: [0.22, 1, 0.36, 1],
        times: [0, 0.6, 1],
      }}
    >
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function OrbitingFruit({ children, delay = 0, className = "", radius = 50 }: AnimatedFruitProps & { radius?: number }) {
  return (
    <motion.div
      className={className}
      animate={{
        x: [
          Math.cos(0) * radius,
          Math.cos(Math.PI / 2) * radius,
          Math.cos(Math.PI) * radius,
          Math.cos(3 * Math.PI / 2) * radius,
          Math.cos(2 * Math.PI) * radius,
        ],
        y: [
          Math.sin(0) * radius,
          Math.sin(Math.PI / 2) * radius,
          Math.sin(Math.PI) * radius,
          Math.sin(3 * Math.PI / 2) * radius,
          Math.sin(2 * Math.PI) * radius,
        ],
        rotate: [0, 90, 180, 270, 360],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {children}
    </motion.div>
  );
}

export function JuicySplashFruit({ children, delay = 0, className = "" }: AnimatedFruitProps) {
  return (
    <motion.div className={className}>
      <motion.div
        initial={{ scale: 1 }}
        whileHover={{
          scale: 1.2,
          rotate: [0, -5, 5, -5, 0],
          transition: {
            duration: 0.5,
          },
        }}
        whileTap={{
          scale: 0.9,
        }}
      >
        {children}
      </motion.div>

      <motion.div
        className="absolute inset-0 rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        whileHover={{
          scale: [0, 1.5],
          opacity: [0.5, 0],
        }}
        transition={{
          duration: 0.6,
        }}
        style={{
          background: "radial-gradient(circle, rgba(249, 115, 22, 0.4) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
    </motion.div>
  );
}
