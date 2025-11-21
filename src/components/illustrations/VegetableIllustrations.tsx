// src/components/illustrations/VegetableIllustrations.tsx

export function Tomato({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main tomato body */}
      <circle cx="100" cy="110" r="65" fill="#DC2626" />
      <circle cx="100" cy="110" r="60" fill="#EF4444" opacity="0.9" />

      {/* Highlight */}
      <ellipse cx="80" cy="95" rx="25" ry="30" fill="#F87171" opacity="0.6" />
      <circle cx="75" cy="90" r="12" fill="#FCA5A5" opacity="0.7" />

      {/* Stem and leaves */}
      <path
        d="M85 50 Q90 40 95 45 L100 50 L105 45 Q110 40 115 50 L110 60 L100 55 L90 60 Z"
        fill="#10B981"
      />
      <path
        d="M90 55 Q85 50 82 52 L80 58 M110 55 Q115 50 118 52 L120 58"
        fill="#059669"
      />
      <line x1="100" y1="50" x2="100" y2="60" stroke="#065F46" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Onion({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Onion body */}
      <ellipse cx="100" cy="110" rx="60" ry="70" fill="#A16207" />
      <ellipse cx="100" cy="110" rx="55" ry="65" fill="#CA8A04" opacity="0.8" />
      <ellipse cx="100" cy="110" rx="50" ry="60" fill="#EAB308" opacity="0.6" />

      {/* Texture lines */}
      <path
        d="M70 80 Q100 85 130 80"
        stroke="#92400E"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M65 100 Q100 105 135 100"
        stroke="#92400E"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M68 120 Q100 125 132 120"
        stroke="#92400E"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />

      {/* Roots/sprout */}
      <path
        d="M95 35 Q90 30 92 40 L95 50 M100 30 L100 50 M105 35 Q110 30 108 40 L105 50"
        stroke="#10B981"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="100" cy="50" rx="8" ry="5" fill="#D97706" />
    </svg>
  );
}

export function Potato({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Potato body - irregular shape */}
      <ellipse cx="100" cy="100" rx="70" ry="50" fill="#78350F" />
      <ellipse cx="100" cy="100" rx="65" ry="45" fill="#92400E" opacity="0.8" />
      <ellipse cx="100" cy="100" rx="60" ry="42" fill="#A16207" opacity="0.7" />

      {/* Highlights */}
      <ellipse cx="85" cy="90" rx="20" ry="15" fill="#D97706" opacity="0.5" />
      <circle cx="80" cy="88" r="8" fill="#FBBF24" opacity="0.4" />

      {/* Eyes/spots */}
      <g fill="#451A03" opacity="0.6">
        <ellipse cx="75" cy="95" rx="4" ry="3" />
        <ellipse cx="90" cy="110" rx="3" ry="2" />
        <ellipse cx="110" cy="100" rx="4" ry="3" />
        <ellipse cx="120" cy="90" rx="3" ry="2" />
        <ellipse cx="105" cy="85" rx="3" ry="2" />
      </g>
    </svg>
  );
}

export function Eggplant({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Eggplant body */}
      <path
        d="M100 60 Q70 70 65 100 Q60 130 75 155 Q90 170 100 175 Q110 170 125 155 Q140 130 135 100 Q130 70 100 60 Z"
        fill="#4C1D95"
      />
      <path
        d="M100 60 Q75 72 70 100 Q67 125 80 150 Q92 165 100 170"
        fill="#5B21B6"
        opacity="0.7"
      />
      <ellipse cx="85" cy="95" rx="15" ry="25" fill="#6D28D9" opacity="0.5" />

      {/* Stem/cap */}
      <ellipse cx="100" cy="55" rx="20" ry="12" fill="#10B981" />
      <path
        d="M85 50 Q90 45 95 48 L100 52 L105 48 Q110 45 115 50"
        fill="#059669"
      />
      <rect x="98" y="52" width="4" height="10" fill="#065F46" rx="2" />

      {/* Highlight */}
      <circle cx="90" cy="100" r="10" fill="#7C3AED" opacity="0.4" />
    </svg>
  );
}

export function Okra({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Okra pod */}
      <path
        d="M100 40 Q85 50 82 70 L85 120 Q87 145 92 160 Q97 170 100 175 Q103 170 108 160 Q113 145 115 120 L118 70 Q115 50 100 40 Z"
        fill="#15803D"
      />
      <path
        d="M100 40 Q88 52 86 75 L88 120 Q90 142 95 158"
        fill="#16A34A"
        opacity="0.8"
      />

      {/* Ridge lines */}
      <path d="M92 60 L94 140" stroke="#14532D" strokeWidth="1.5" opacity="0.5" />
      <path d="M100 45 L100 165" stroke="#14532D" strokeWidth="1.5" opacity="0.5" />
      <path d="M108 60 L106 140" stroke="#14532D" strokeWidth="1.5" opacity="0.5" />

      {/* Stem */}
      <path
        d="M100 40 L100 30 Q98 25 95 28 L93 32 M100 30 Q102 25 105 28 L107 32"
        stroke="#059669"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Highlight */}
      <ellipse cx="105" cy="90" rx="6" ry="25" fill="#22C55E" opacity="0.4" />
    </svg>
  );
}

export function Spinach({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Large leaf */}
      <path
        d="M100 50 Q130 70 135 100 Q132 130 100 145 Q68 130 65 100 Q70 70 100 50 Z"
        fill="#15803D"
      />
      <path
        d="M100 50 Q125 68 130 98 Q128 120 100 135"
        fill="#16A34A"
        opacity="0.7"
      />

      {/* Vein */}
      <path
        d="M100 50 L100 145"
        stroke="#14532D"
        strokeWidth="2"
        opacity="0.6"
      />
      <path d="M100 70 Q115 75 120 85" stroke="#14532D" strokeWidth="1.5" opacity="0.4" />
      <path d="M100 70 Q85 75 80 85" stroke="#14532D" strokeWidth="1.5" opacity="0.4" />
      <path d="M100 95 Q115 98 118 105" stroke="#14532D" strokeWidth="1.5" opacity="0.4" />
      <path d="M100 95 Q85 98 82 105" stroke="#14532D" strokeWidth="1.5" opacity="0.4" />

      {/* Small overlapping leaves */}
      <path
        d="M80 110 Q70 120 72 135 Q80 145 90 140 Q95 130 90 118 Z"
        fill="#16A34A"
        opacity="0.8"
      />
      <path
        d="M120 110 Q130 120 128 135 Q120 145 110 140 Q105 130 110 118 Z"
        fill="#16A34A"
        opacity="0.8"
      />

      {/* Highlights */}
      <ellipse cx="110" cy="80" rx="12" ry="18" fill="#22C55E" opacity="0.4" />
    </svg>
  );
}

export function Carrot({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Carrot body */}
      <path
        d="M100 60 Q90 65 85 80 L75 120 Q70 145 75 165 Q82 175 95 172 Q105 168 100 150 L110 100 Q112 75 100 60 Z"
        fill="#C2410C"
      />
      <path
        d="M100 60 Q92 67 88 85 L80 125 Q76 148 82 165"
        fill="#EA580C"
        opacity="0.8"
      />
      <ellipse cx="92" cy="100" rx="8" ry="20" fill="#F97316" opacity="0.6" />

      {/* Ring textures */}
      <path d="M87 85 Q95 87 103 85" stroke="#9A3412" strokeWidth="1" opacity="0.4" />
      <path d="M83 105 Q92 107 100 105" stroke="#9A3412" strokeWidth="1" opacity="0.4" />
      <path d="M79 125 Q88 127 96 125" stroke="#9A3412" strokeWidth="1" opacity="0.4" />
      <path d="M77 145 Q85 147 93 145" stroke="#9A3412" strokeWidth="1" opacity="0.4" />

      {/* Greens */}
      <path
        d="M95 55 Q92 40 88 42 L85 50 M100 53 Q100 35 96 37 L95 48 M105 55 Q108 40 112 42 L115 50"
        stroke="#10B981"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M88 42 Q85 38 82 40 M96 37 Q96 32 93 34 M112 42 Q115 38 118 40"
        fill="#059669"
      />
    </svg>
  );
}

export function Cauliflower({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Cauliflower head - cluster of circles */}
      <circle cx="100" cy="100" r="35" fill="#E5E7EB" />
      <circle cx="80" cy="95" r="28" fill="#F3F4F6" />
      <circle cx="120" cy="95" r="28" fill="#F3F4F6" />
      <circle cx="90" cy="120" r="25" fill="#E5E7EB" />
      <circle cx="110" cy="120" r="25" fill="#E5E7EB" />
      <circle cx="100" cy="80" r="22" fill="#F9FAFB" />
      <circle cx="75" cy="110" r="20" fill="#E5E7EB" />
      <circle cx="125" cy="110" r="20" fill="#E5E7EB" />

      {/* Texture details */}
      <g opacity="0.3" fill="#D1D5DB">
        <circle cx="95" cy="95" r="8" />
        <circle cx="105" cy="95" r="8" />
        <circle cx="100" cy="105" r="8" />
        <circle cx="85" cy="105" r="6" />
        <circle cx="115" cy="105" r="6" />
      </g>

      {/* Leaves */}
      <path
        d="M65 115 Q60 125 62 135 L70 140 Q75 135 73 125 Z"
        fill="#10B981"
      />
      <path
        d="M135 115 Q140 125 138 135 L130 140 Q125 135 127 125 Z"
        fill="#10B981"
      />
      <path
        d="M75 135 Q70 145 72 155 L85 160 Q90 152 85 142 Z"
        fill="#059669"
      />
      <path
        d="M125 135 Q130 145 128 155 L115 160 Q110 152 115 142 Z"
        fill="#059669"
      />
    </svg>
  );
}

export function BellPepper({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Pepper body */}
      <path
        d="M100 65 Q75 70 68 90 L65 120 Q63 145 75 160 Q90 172 100 175 Q110 172 125 160 Q137 145 135 120 L132 90 Q125 70 100 65 Z"
        fill="#DC2626"
      />
      <path
        d="M100 65 Q78 72 72 92 L69 122 Q68 142 78 157 Q90 168 100 172"
        fill="#EF4444"
        opacity="0.7"
      />

      {/* Highlights */}
      <ellipse cx="85" cy="100" rx="20" ry="30" fill="#F87171" opacity="0.5" />
      <circle cx="80" cy="95" r="12" fill="#FCA5A5" opacity="0.6" />

      {/* Lobes */}
      <path
        d="M80 72 Q75 78 75 85 Q77 82 82 80 Z"
        fill="#DC2626"
        opacity="0.6"
      />
      <path
        d="M120 72 Q125 78 125 85 Q123 82 118 80 Z"
        fill="#DC2626"
        opacity="0.6"
      />

      {/* Stem */}
      <rect x="98" y="55" width="4" height="12" fill="#065F46" rx="2" />
      <path
        d="M95 60 Q93 55 90 57 L88 60 M105 60 Q107 55 110 57 L112 60"
        fill="#10B981"
      />
      <ellipse cx="100" cy="60" rx="8" ry="6" fill="#059669" />
    </svg>
  );
}

export function Cucumber({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Cucumber body */}
      <ellipse cx="100" cy="100" rx="30" ry="70" fill="#15803D" />
      <ellipse cx="100" cy="100" rx="27" ry="65" fill="#16A34A" opacity="0.8" />

      {/* Highlight */}
      <ellipse cx="92" cy="90" rx="12" ry="30" fill="#22C55E" opacity="0.5" />
      <ellipse cx="88" cy="85" rx="6" ry="15" fill="#4ADE80" opacity="0.6" />

      {/* Bumps/texture */}
      <g fill="#14532D" opacity="0.3">
        <circle cx="95" cy="70" r="3" />
        <circle cx="105" cy="75" r="3" />
        <circle cx="92" cy="90" r="2.5" />
        <circle cx="108" cy="88" r="2.5" />
        <circle cx="95" cy="105" r="3" />
        <circle cx="105" cy="110" r="3" />
        <circle cx="98" cy="125" r="2.5" />
        <circle cx="102" cy="135" r="2.5" />
      </g>

      {/* Stem end */}
      <ellipse cx="100" cy="35" rx="8" ry="6" fill="#059669" />
      <rect x="98" y="35" width="4" height="8" fill="#047857" rx="2" />

      {/* Flower remnant at top */}
      <path
        d="M95 32 L100 28 L105 32"
        stroke="#FBBF24"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function Chili({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Chili body - curved */}
      <path
        d="M100 50 Q95 60 93 75 L90 100 Q88 125 92 145 Q97 160 105 165 Q110 167 115 162 Q120 155 118 140 L115 110 Q113 85 110 70 Q108 60 100 50 Z"
        fill="#DC2626"
      />
      <path
        d="M100 50 Q96 62 94 78 L91 105 Q89 128 94 148 Q98 158 105 162"
        fill="#EF4444"
        opacity="0.8"
      />

      {/* Highlight */}
      <ellipse cx="100" cy="95" rx="6" ry="25" fill="#F87171" opacity="0.6" transform="rotate(-5 100 95)" />

      {/* Stem */}
      <path
        d="M100 50 Q98 45 96 48 L95 52 M100 50 L100 42 M100 50 Q102 45 104 48 L105 52"
        stroke="#10B981"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="100" cy="48" rx="6" ry="4" fill="#059669" />
    </svg>
  );
}
