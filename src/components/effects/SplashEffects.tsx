import { motion } from 'framer-motion';

export function JuiceSplash({ className = "", size = 300, color = "#F97316" }: { className?: string; size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.circle
          cx="150"
          cy="150"
          r="80"
          fill={color}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.8, times: [0, 0.6, 1] }}
        />

        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const distance = 90 + Math.random() * 30;
          const x = 150 + Math.cos(angle) * distance;
          const y = 150 + Math.sin(angle) * distance;
          const size = 15 + Math.random() * 25;

          return (
            <motion.path
              key={i}
              d={`M ${x} ${y} Q ${x + size} ${y - size} ${x + size * 0.5} ${y - size * 1.5} Q ${x - size * 0.3} ${y - size} ${x} ${y} Z`}
              fill={color}
              opacity="0.8"
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{
                scale: [0, 1.3, 1],
                x: [0, (x - 150) * 0.3, x - 150],
                y: [0, (y - 150) * 0.3, y - 150]
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.03,
                times: [0, 0.5, 1],
                ease: "easeOut"
              }}
            />
          );
        })}

        {[...Array(20)].map((_, i) => {
          const angle = (i * 18 * Math.PI) / 180;
          const distance = 120 + Math.random() * 40;
          const x = 150 + Math.cos(angle) * distance;
          const y = 150 + Math.sin(angle) * distance;
          const dropSize = 3 + Math.random() * 6;

          return (
            <motion.circle
              key={`drop-${i}`}
              cx={x}
              cy={y}
              r={dropSize}
              fill={color}
              opacity="0.7"
              initial={{ scale: 0, x: 150, y: 150 }}
              animate={{
                scale: [0, 1.5, 1],
                x: [150, 150, x],
                y: [150, 150, y]
              }}
              transition={{
                duration: 0.9,
                delay: i * 0.02,
                ease: "easeOut"
              }}
            />
          );
        })}
      </motion.g>
    </svg>
  );
}

export function LiquidWave({ className = "", size = 400 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <motion.path
        d="M0 200 Q100 150 200 200 T400 200 L400 400 L0 400 Z"
        fill="#10B981"
        opacity="0.2"
        animate={{
          d: [
            "M0 200 Q100 150 200 200 T400 200 L400 400 L0 400 Z",
            "M0 200 Q100 250 200 200 T400 200 L400 400 L0 400 Z",
            "M0 200 Q100 150 200 200 T400 200 L400 400 L0 400 Z",
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.path
        d="M0 220 Q100 170 200 220 T400 220 L400 400 L0 400 Z"
        fill="#10B981"
        opacity="0.3"
        animate={{
          d: [
            "M0 220 Q100 170 200 220 T400 220 L400 400 L0 400 Z",
            "M0 220 Q100 270 200 220 T400 220 L400 400 L0 400 Z",
            "M0 220 Q100 170 200 220 T400 220 L400 400 L0 400 Z",
          ],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.path
        d="M0 240 Q100 190 200 240 T400 240 L400 400 L0 400 Z"
        fill="#10B981"
        opacity="0.4"
        animate={{
          d: [
            "M0 240 Q100 190 200 240 T400 240 L400 400 L0 400 Z",
            "M0 240 Q100 290 200 240 T400 240 L400 400 L0 400 Z",
            "M0 240 Q100 190 200 240 T400 240 L400 400 L0 400 Z",
          ],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </svg>
  );
}

export function AnimatedBottle({ className = "", size = 250 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 250 250"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="bottleGlass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="juiceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>

      <motion.rect
        x="80"
        y="50"
        width="90"
        height="30"
        rx="5"
        fill="url(#bottleGlass)"
        stroke="#0EA5E9"
        strokeWidth="2"
      />

      <motion.rect
        x="85"
        y="70"
        width="80"
        height="150"
        rx="15"
        fill="url(#bottleGlass)"
        stroke="#0EA5E9"
        strokeWidth="3"
      />

      <motion.rect
        x="90"
        y="140"
        width="70"
        height="70"
        rx="10"
        fill="url(#juiceGradient)"
        initial={{ height: 0, y: 210 }}
        animate={{ height: 70, y: 140 }}
        transition={{
          duration: 2,
          ease: "easeOut",
          repeat: Infinity,
          repeatDelay: 2,
        }}
      />

      <motion.ellipse
        cx="125"
        cy="145"
        rx="28"
        ry="8"
        fill="#FB923C"
        opacity="0.4"
        animate={{
          ry: [8, 12, 8],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {[...Array(5)].map((_, i) => (
        <motion.circle
          key={i}
          cx={100 + i * 10}
          cy={180}
          r="3"
          fill="#FED7AA"
          initial={{ y: 180, opacity: 0 }}
          animate={{
            y: [180, 150, 180],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 2,
            delay: i * 0.2,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        />
      ))}

      <motion.ellipse
        cx="105"
        cy="95"
        rx="15"
        ry="25"
        fill="white"
        opacity="0.4"
        animate={{
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </svg>
  );
}

export function ParticleExplosion({ className = "", size = 300, color = "#F59E0B" }: { className?: string; size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {[...Array(30)].map((_, i) => {
        const angle = (i * 12 * Math.PI) / 180;
        const distance = 80 + Math.random() * 70;
        const x = 150 + Math.cos(angle) * distance;
        const y = 150 + Math.sin(angle) * distance;
        const size = 2 + Math.random() * 6;

        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r={size}
            fill={color}
            initial={{
              cx: 150,
              cy: 150,
              r: 0,
              opacity: 0
            }}
            animate={{
              cx: x,
              cy: y,
              r: size,
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.02,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeOut",
            }}
          />
        );
      })}

      {[...Array(15)].map((_, i) => {
        const angle = (i * 24 * Math.PI) / 180;
        const x1 = 150;
        const y1 = 150;
        const x2 = 150 + Math.cos(angle) * 100;
        const y2 = 150 + Math.sin(angle) * 100;

        return (
          <motion.line
            key={`line-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            initial={{
              pathLength: 0,
              opacity: 0
            }}
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0, 0.8, 0]
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.03,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeOut",
            }}
          />
        );
      })}
    </svg>
  );
}
