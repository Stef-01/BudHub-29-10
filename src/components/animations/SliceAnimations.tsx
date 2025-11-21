import { motion } from 'framer-motion';

export function SlicedOrange({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <clipPath id="halfCircle">
          <rect x="0" y="0" width="100" height="200" />
        </clipPath>
      </defs>

      <motion.g
        initial={{ x: 0 }}
        animate={{ x: [-5, 5, -5] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <circle cx="50" cy="100" r="45" fill="#F97316" clipPath="url(#halfCircle)" />
        <circle cx="50" cy="100" r="40" fill="#FB923C" clipPath="url(#halfCircle)" />

        {[...Array(8)].map((_, i) => {
          const angle = (i * 45 * Math.PI) / 180;
          const x1 = 50;
          const y1 = 100;
          const x2 = 50 + Math.cos(angle) * 40;
          const y2 = 100 + Math.sin(angle) * 40;

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#FDBA74"
              strokeWidth="2"
              clipPath="url(#halfCircle)"
            />
          );
        })}
      </motion.g>

      <motion.g
        initial={{ x: 0 }}
        animate={{ x: [5, -5, 5] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <g transform="translate(100, 0)">
          <circle cx="50" cy="100" r="45" fill="#F97316" />
          <circle cx="50" cy="100" r="40" fill="#FB923C" />

          {[...Array(8)].map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            const x1 = 50;
            const y1 = 100;
            const x2 = 50 + Math.cos(angle) * 40;
            const y2 = 100 + Math.sin(angle) * 40;

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#FDBA74"
                strokeWidth="2"
              />
            );
          })}
        </g>
      </motion.g>

      <motion.line
        x1="100"
        y1="50"
        x2="100"
        y2="150"
        stroke="#64748B"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.5 }}
      />
    </svg>
  );
}

export function SqueezedLemon({ className = "", size = 250 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 250 250"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <motion.ellipse
        cx="125"
        cy="80"
        rx="60"
        ry="50"
        fill="#FCD34D"
        animate={{
          ry: [50, 45, 50],
          cy: [80, 85, 80],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.ellipse
        cx="125"
        cy="80"
        rx="50"
        ry="40"
        fill="#FBBF24"
        opacity="0.8"
        animate={{
          ry: [40, 35, 40],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {[...Array(12)].map((_, i) => (
        <motion.circle
          key={i}
          cx="125"
          cy="130"
          r="3"
          fill="#FCD34D"
          initial={{
            y: 0,
            opacity: 0,
          }}
          animate={{
            y: [0, 20 + i * 5, 40 + i * 5],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            delay: i * 0.1,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      <motion.path
        d="M 100 130 Q 125 140 150 130"
        stroke="#FCD34D"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        animate={{
          d: [
            "M 100 130 Q 125 140 150 130",
            "M 100 135 Q 125 145 150 135",
            "M 100 130 Q 125 140 150 130",
          ],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.rect
        x="110"
        y="20"
        width="30"
        height="40"
        rx="5"
        fill="#64748B"
        animate={{
          y: [20, 25, 20],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.path
        d="M 125 170 L 125 220"
        stroke="#FCD34D"
        strokeWidth="8"
        strokeLinecap="round"
        animate={{
          strokeDasharray: ["0 50", "50 0"],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      />
    </svg>
  );
}

export function ChoppedFruits({ className = "", size = 300 }: { className?: string; size?: number }) {
  const pieces = [
    { x: 80, y: 100, rotate: -20, delay: 0, color: '#EF4444' },
    { x: 150, y: 100, rotate: 15, delay: 0.1, color: '#F97316' },
    { x: 220, y: 100, rotate: -10, delay: 0.2, color: '#FBBF24' },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {pieces.map((piece, index) => (
        <motion.g key={index}>
          <motion.rect
            x={piece.x - 20}
            y={piece.y - 15}
            width="40"
            height="30"
            rx="5"
            fill={piece.color}
            initial={{
              y: 50,
              rotate: 0,
              opacity: 0,
            }}
            animate={{
              y: [50, piece.y - 15, piece.y + 150],
              rotate: [0, piece.rotate, piece.rotate + 180],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              delay: piece.delay,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeOut",
            }}
          />

          {[...Array(3)].map((_, i) => (
            <motion.circle
              key={i}
              cx={piece.x + (Math.random() - 0.5) * 20}
              cy={piece.y}
              r="3"
              fill={piece.color}
              opacity="0.6"
              initial={{
                y: 50,
                opacity: 0,
              }}
              animate={{
                y: [50, piece.y + Math.random() * 50, piece.y + 150],
                x: [piece.x, piece.x + (Math.random() - 0.5) * 40],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 2,
                delay: piece.delay + i * 0.05,
                repeat: Infinity,
                repeatDelay: 1,
                ease: "easeOut",
              }}
            />
          ))}
        </motion.g>
      ))}

      <motion.line
        x1="150"
        y1="20"
        x2="150"
        y2="80"
        stroke="#64748B"
        strokeWidth="6"
        strokeLinecap="round"
        animate={{
          y2: [80, 100, 80],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          repeatDelay: 1.5,
        }}
      />
    </svg>
  );
}

export function PeelingFruit({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="100" cy="100" r="50" fill="#FB923C" />

      <motion.path
        d="M 100 50 Q 120 40 130 50 L 140 80 Q 145 100 135 120"
        fill="#F97316"
        animate={{
          d: [
            "M 100 50 Q 120 40 130 50 L 140 80 Q 145 100 135 120",
            "M 100 50 Q 125 35 135 45 L 150 75 Q 160 95 155 115",
            "M 100 50 Q 130 30 140 40 L 160 70 Q 170 90 170 110",
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.path
        d="M 100 50 Q 80 40 70 50 L 60 80 Q 55 100 65 120"
        fill="#F97316"
        animate={{
          d: [
            "M 100 50 Q 80 40 70 50 L 60 80 Q 55 100 65 120",
            "M 100 50 Q 75 35 65 45 L 50 75 Q 40 95 45 115",
            "M 100 50 Q 70 30 60 40 L 40 70 Q 30 90 30 110",
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <circle cx="100" cy="100" r="45" fill="#FDBA74" />

      <motion.ellipse
        cx="85"
        cy="90"
        rx="10"
        ry="15"
        fill="#FED7AA"
        opacity="0.6"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      />
    </svg>
  );
}
