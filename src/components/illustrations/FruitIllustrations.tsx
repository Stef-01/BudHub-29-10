export function Strawberry({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M100 50 Q80 40 70 50 L60 70 Q55 90 60 110 Q70 140 100 170 Q130 140 140 110 Q145 90 140 70 L130 50 Q120 40 100 50 Z"
        fill="#E53E3E"
      />
      <path
        d="M100 50 Q85 45 75 52 Q70 60 70 70 L78 90 Q85 105 95 120"
        fill="#F56565"
        opacity="0.7"
      />

      <g fill="#FBBF24" opacity="0.8">
        <circle cx="80" cy="80" r="3" />
        <circle cx="90" cy="70" r="3" />
        <circle cx="110" cy="70" r="3" />
        <circle cx="120" cy="80" r="3" />
        <circle cx="85" cy="95" r="3" />
        <circle cx="100" cy="90" r="3" />
        <circle cx="115" cy="95" r="3" />
        <circle cx="90" cy="110" r="3" />
        <circle cx="105" cy="105" r="3" />
        <circle cx="110" cy="115" r="3" />
        <circle cx="95" cy="125" r="3" />
        <circle cx="105" cy="130" r="3" />
      </g>

      <path
        d="M85 45 Q90 30 95 35 L100 40 L105 35 Q110 30 115 45"
        fill="#10B981"
      />
      <path
        d="M90 40 L92 45 M100 35 L100 42 M110 40 L108 45"
        stroke="#059669"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Blueberry({ className = "", size = 180 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="90" cy="90" r="70" fill="#4C51BF" />
      <circle cx="90" cy="90" r="65" fill="#5A67D8" opacity="0.8" />

      <ellipse cx="70" cy="75" rx="20" ry="25" fill="#6B46C1" opacity="0.5" />
      <ellipse cx="110" cy="80" rx="18" ry="22" fill="#6B46C1" opacity="0.5" />

      <circle cx="75" cy="70" r="8" fill="#9F7AEA" opacity="0.6" />
      <circle cx="100" cy="65" r="6" fill="#9F7AEA" opacity="0.6" />

      <path
        d="M85 30 Q80 25 78 28 Q76 32 78 35 L82 38 L90 35 L88 30 Z"
        fill="#10B981"
      />
      <path
        d="M95 30 Q100 25 102 28 Q104 32 102 35 L98 38 L90 35 L92 30 Z"
        fill="#10B981"
      />

      <g fill="#2D3748" opacity="0.4">
        <circle cx="75" cy="90" r="2" />
        <circle cx="85" cy="95" r="2" />
        <circle cx="95" cy="95" r="2" />
        <circle cx="105" cy="90" r="2" />
        <circle cx="90" cy="105" r="2" />
        <circle cx="80" cy="105" r="2" />
        <circle cx="100" cy="105" r="2" />
      </g>
    </svg>
  );
}

export function Kiwi({ className = "", size = 190 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 190 190"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <ellipse cx="95" cy="95" rx="70" ry="75" fill="#92400E" />

      <ellipse cx="95" cy="95" rx="60" ry="65" fill="#A3E635" />
      <ellipse cx="95" cy="95" rx="50" ry="55" fill="#84CC16" />

      <circle cx="95" cy="95" r="15" fill="#FEF3C7" />

      {[...Array(12)].map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x = 95 + Math.cos(angle) * 25;
        const y = 95 + Math.sin(angle) * 25;
        return (
          <line
            key={i}
            x1="95"
            y1="95"
            x2={x}
            y2={y}
            stroke="#FEF3C7"
            strokeWidth="1.5"
            opacity="0.6"
          />
        );
      })}

      <g fill="#065F46" opacity="0.7">
        {[...Array(20)].map((_, i) => {
          const angle = Math.random() * Math.PI * 2;
          const distance = 30 + Math.random() * 25;
          const x = 95 + Math.cos(angle) * distance;
          const y = 95 + Math.sin(angle) * distance;
          return <circle key={i} cx={x} cy={y} r="2" />;
        })}
      </g>

      {[...Array(30)].map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 60 + Math.random() * 15;
        const x = 95 + Math.cos(angle) * distance;
        const y = 95 + Math.sin(angle) * distance;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width="2"
            height="8"
            fill="#78350F"
            opacity="0.6"
            transform={`rotate(${Math.random() * 360} ${x} ${y})`}
          />
        );
      })}
    </svg>
  );
}

export function Watermelon({ className = "", size = 220 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M40 110 Q40 50 110 50 Q180 50 180 110 Q180 170 110 170 Q40 170 40 110 Z"
        fill="#DC2626"
      />

      <path
        d="M50 110 Q50 65 110 65 Q170 65 170 110 Q170 155 110 155 Q50 155 50 110 Z"
        fill="#EF4444"
      />

      <path
        d="M60 110 Q60 80 110 80 Q160 80 160 110 Q160 140 110 140 Q60 140 60 110 Z"
        fill="#F87171"
      />

      <path
        d="M40 110 Q40 170 110 170 Q180 170 180 110"
        stroke="#10B981"
        strokeWidth="20"
        fill="none"
      />

      <path
        d="M35 110 Q35 175 110 175 Q185 175 185 110"
        stroke="#059669"
        strokeWidth="8"
        fill="none"
      />

      <g fill="#1F2937">
        <ellipse cx="80" cy="100" rx="5" ry="8" transform="rotate(-20 80 100)" />
        <ellipse cx="110" cy="95" rx="5" ry="8" transform="rotate(10 110 95)" />
        <ellipse cx="140" cy="100" rx="5" ry="8" transform="rotate(-15 140 100)" />
        <ellipse cx="95" cy="115" rx="5" ry="8" transform="rotate(25 95 115)" />
        <ellipse cx="125" cy="115" rx="5" ry="8" transform="rotate(-30 125 115)" />
        <ellipse cx="110" cy="130" rx="5" ry="8" transform="rotate(5 110 130)" />
      </g>
    </svg>
  );
}

export function PineappleSlice({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="100" cy="100" r="80" fill="#FCD34D" />
      <circle cx="100" cy="100" r="70" fill="#FBBF24" />
      <circle cx="100" cy="100" r="25" fill="#FEF3C7" />

      {[...Array(6)].map((_, i) => {
        const angle = (i * 60 * Math.PI) / 180;
        const x = 100 + Math.cos(angle) * 50;
        const y = 100 + Math.sin(angle) * 50;
        return (
          <g key={i}>
            <line
              x1="100"
              y1="100"
              x2={x}
              y2={y}
              stroke="#F59E0B"
              strokeWidth="3"
            />
            <path
              d={`M ${x} ${y} Q ${100 + Math.cos(angle + 0.3) * 65} ${100 + Math.sin(angle + 0.3) * 65} ${100 + Math.cos(angle + 0.52) * 50} ${100 + Math.sin(angle + 0.52) * 50}`}
              fill="#F59E0B"
              opacity="0.3"
            />
          </g>
        );
      })}

      {[...Array(12)].map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x = 100 + Math.cos(angle) * 35;
        const y = 100 + Math.sin(angle) * 35;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="4"
            fill="#92400E"
            opacity="0.6"
          />
        );
      })}
    </svg>
  );
}

export function GrapeCluster({ className = "", size = 200 }: { className?: string; size?: number }) {
  const grapes = [
    { cx: 100, cy: 60, r: 15 },
    { cx: 85, cy: 80, r: 15 },
    { cx: 115, cy: 80, r: 15 },
    { cx: 75, cy: 100, r: 14 },
    { cx: 100, cy: 95, r: 16 },
    { cx: 125, cy: 100, r: 14 },
    { cx: 85, cy: 115, r: 15 },
    { cx: 115, cy: 115, r: 15 },
    { cx: 100, cy: 130, r: 15 },
    { cx: 90, cy: 145, r: 13 },
    { cx: 110, cy: 145, r: 13 },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M95 40 Q85 25 80 30 L75 38 Q73 42 75 48 L85 55"
        fill="#10B981"
      />
      <path
        d="M105 40 Q115 25 120 30 L125 38 Q127 42 125 48 L115 55"
        fill="#10B981"
      />

      {grapes.map((grape, i) => (
        <g key={i}>
          <circle {...grape} fill="#7C3AED" />
          <circle
            cx={grape.cx - 3}
            cy={grape.cy - 3}
            r={grape.r * 0.4}
            fill="#A78BFA"
            opacity="0.6"
          />
        </g>
      ))}
    </svg>
  );
}
