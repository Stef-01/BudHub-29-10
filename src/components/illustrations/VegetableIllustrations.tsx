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

export function BottleGourd({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Bottle gourd body - two bulbs */}
      <path
        d="M100 45 Q85 50 82 65 L80 85 Q78 95 80 105 L82 120 Q85 150 90 165 Q95 175 100 178 Q105 175 110 165 Q115 150 118 120 L120 105 Q122 95 120 85 L118 65 Q115 50 100 45 Z"
        fill="#D1FAE5"
      />
      <path
        d="M100 45 Q88 52 85 68 L83 90 Q82 100 84 110 L86 125 Q89 152 95 168"
        fill="#A7F3D0"
        opacity="0.8"
      />
      <ellipse cx="92" cy="100" rx="10" ry="35" fill="#6EE7B7" opacity="0.4" />

      {/* Texture lines */}
      <path d="M88 70 Q100 72 112 70" stroke="#059669" strokeWidth="0.8" opacity="0.3" fill="none" />
      <path d="M86 95 Q100 97 114 95" stroke="#059669" strokeWidth="0.8" opacity="0.3" fill="none" />
      <path d="M87 120 Q100 122 113 120" stroke="#059669" strokeWidth="0.8" opacity="0.3" fill="none" />
      <path d="M89 145 Q100 147 111 145" stroke="#059669" strokeWidth="0.8" opacity="0.3" fill="none" />

      {/* Stem */}
      <path
        d="M95 40 Q93 35 90 37 L88 42 M100 38 L100 45 M105 40 Q107 35 110 37 L112 42"
        stroke="#10B981"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="100" cy="42" rx="7" ry="5" fill="#059669" />
    </svg>
  );
}

export function Pumpkin({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Center segment */}
      <ellipse cx="100" cy="105" rx="25" ry="50" fill="#EA580C" />

      {/* Left segments */}
      <ellipse cx="75" cy="105" rx="22" ry="48" fill="#F97316" opacity="0.9" />
      <ellipse cx="52" cy="108" rx="18" ry="42" fill="#FB923C" opacity="0.8" />

      {/* Right segments */}
      <ellipse cx="125" cy="105" rx="22" ry="48" fill="#F97316" opacity="0.9" />
      <ellipse cx="148" cy="108" rx="18" ry="42" fill="#FB923C" opacity="0.8" />

      {/* Highlights */}
      <ellipse cx="90" cy="90" rx="15" ry="25" fill="#FDBA74" opacity="0.5" />
      <circle cx="85" cy="85" r="10" fill="#FED7AA" opacity="0.6" />

      {/* Ridge lines */}
      <path d="M100 55 Q100 80 100 155" stroke="#C2410C" strokeWidth="2" opacity="0.4" />
      <path d="M75 58 Q75 82 75 152" stroke="#C2410C" strokeWidth="2" opacity="0.4" />
      <path d="M125 58 Q125 82 125 152" stroke="#C2410C" strokeWidth="2" opacity="0.4" />

      {/* Stem - curly */}
      <path
        d="M100 55 Q98 48 96 45 Q94 42 92 45 Q90 48 92 52"
        stroke="#065F46"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M92 52 Q94 49 96 46 Q98 43 100 46"
        stroke="#10B981"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="100" cy="52" rx="8" ry="6" fill="#059669" />
    </svg>
  );
}

export function Cabbage({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer leaves */}
      <circle cx="100" cy="105" r="70" fill="#15803D" />
      <circle cx="100" cy="105" r="65" fill="#16A34A" opacity="0.85" />

      {/* Leaf layers */}
      <path
        d="M50 90 Q45 105 52 120 Q65 135 80 140 L70 115 Z"
        fill="#22C55E"
        opacity="0.7"
      />
      <path
        d="M150 90 Q155 105 148 120 Q135 135 120 140 L130 115 Z"
        fill="#22C55E"
        opacity="0.7"
      />
      <path
        d="M100 45 Q85 50 80 65 L90 90 L110 90 L120 65 Q115 50 100 45 Z"
        fill="#22C55E"
        opacity="0.7"
      />

      {/* Inner layers */}
      <circle cx="100" cy="105" r="50" fill="#D1FAE5" />
      <circle cx="100" cy="105" r="40" fill="#A7F3D0" opacity="0.8" />
      <circle cx="100" cy="105" r="30" fill="#6EE7B7" opacity="0.6" />

      {/* Veins on outer leaves */}
      <path d="M80 90 Q85 105 80 120" stroke="#14532D" strokeWidth="1.5" opacity="0.4" fill="none" />
      <path d="M120 90 Q115 105 120 120" stroke="#14532D" strokeWidth="1.5" opacity="0.4" fill="none" />
      <path d="M100 75 L100 105" stroke="#14532D" strokeWidth="1.5" opacity="0.4" />

      {/* Texture details */}
      <g opacity="0.3" stroke="#14532D" strokeWidth="1" fill="none">
        <path d="M65 95 Q100 98 135 95" />
        <path d="M70 110 Q100 113 130 110" />
        <path d="M75 125 Q100 128 125 125" />
      </g>
    </svg>
  );
}

export function Radish({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Radish body - gradient from white to pink */}
      <ellipse cx="100" cy="115" rx="35" ry="55" fill="#FDF2F8" />
      <ellipse cx="100" cy="120" rx="32" ry="50" fill="#FCE7F3" />
      <ellipse cx="100" cy="130" rx="28" ry="40" fill="#FBCFE8" opacity="0.8" />
      <ellipse cx="100" cy="145" rx="22" ry="25" fill="#F9A8D4" opacity="0.7" />

      {/* Highlight */}
      <ellipse cx="90" cy="110" rx="12" ry="20" fill="#FFFFFF" opacity="0.7" />
      <circle cx="88" cy="105" r="8" fill="#FFFFFF" opacity="0.9" />

      {/* Root tip */}
      <path
        d="M100 170 Q98 175 100 178 Q102 175 100 170"
        fill="#EC4899"
        opacity="0.6"
      />

      {/* Root hairs */}
      <g stroke="#E879F9" strokeWidth="1" opacity="0.4">
        <line x1="75" y1="140" x2="70" y2="145" />
        <line x1="80" y1="155" x2="75" y2="162" />
        <line x1="125" y1="140" x2="130" y2="145" />
        <line x1="120" y1="155" x2="125" y2="162" />
        <line x1="95" y1="168" x2="92" y2="175" />
        <line x1="105" y1="168" x2="108" y2="175" />
      </g>

      {/* Greens/leaves */}
      <path
        d="M95 60 Q90 50 85 52 L80 65 Q78 72 82 78 L90 85"
        fill="#10B981"
      />
      <path
        d="M105 60 Q110 50 115 52 L120 65 Q122 72 118 78 L110 85"
        fill="#10B981"
      />
      <path
        d="M100 55 Q98 45 95 47 L93 58 Q92 65 95 70 L100 78"
        fill="#059669"
      />

      {/* Leaf veins */}
      <path d="M85 52 L82 75" stroke="#065F46" strokeWidth="1.5" opacity="0.5" />
      <path d="M115 52 L118 75" stroke="#065F46" strokeWidth="1.5" opacity="0.5" />
      <path d="M95 47 L95 70" stroke="#065F46" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}

export function Beetroot({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Beetroot body */}
      <circle cx="100" cy="115" r="55" fill="#7C2D12" />
      <circle cx="100" cy="115" r="50" fill="#991B1B" opacity="0.9" />
      <circle cx="100" cy="115" r="45" fill="#B91C1C" opacity="0.8" />

      {/* Highlight */}
      <ellipse cx="85" cy="100" rx="18" ry="25" fill="#DC2626" opacity="0.6" />
      <circle cx="80" cy="95" r="12" fill="#EF4444" opacity="0.5" />

      {/* Root texture lines */}
      <g stroke="#7F1D1D" strokeWidth="1.5" opacity="0.4" fill="none">
        <path d="M100 60 Q100 90 100 170" />
        <path d="M70 100 Q100 105 130 100" />
        <path d="M75 130 Q100 135 125 130" />
      </g>

      {/* Root end */}
      <path
        d="M100 170 L98 175 Q100 178 102 175 Z"
        fill="#991B1B"
      />

      {/* Greens - multiple stalks */}
      <g>
        <path
          d="M95 60 Q92 48 88 45 L85 50 Q83 58 85 65 L90 75"
          fill="#15803D"
        />
        <path
          d="M100 58 Q100 42 96 40 L94 48 Q93 56 95 63 L98 72"
          fill="#16A34A"
        />
        <path
          d="M105 60 Q108 48 112 45 L115 50 Q117 58 115 65 L110 75"
          fill="#15803D"
        />
      </g>

      {/* Leaf veins */}
      <g stroke="#7C2D12" strokeWidth="1.2" opacity="0.5">
        <path d="M88 45 L85 65" />
        <path d="M96 40 L95 63" />
        <path d="M112 45 L115 65" />
      </g>

      {/* Texture spots */}
      <g fill="#450A0A" opacity="0.3">
        <circle cx="110" cy="110" r="3" />
        <circle cx="90" cy="125" r="2.5" />
        <circle cx="115" cy="130" r="2" />
      </g>
    </svg>
  );
}

export function Ginger({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main rhizome body - irregular */}
      <path
        d="M60 100 Q55 90 65 85 L85 80 Q100 78 115 82 L130 88 Q140 92 142 100 Q145 110 138 115 L120 122 Q105 125 90 123 L70 118 Q58 112 60 100 Z"
        fill="#92400E"
      />
      <path
        d="M60 100 Q58 93 68 88 L88 83 Q102 81 118 85 L132 91 Q140 95 140 103"
        fill="#B45309"
        opacity="0.8"
      />

      {/* Side knobs */}
      <ellipse cx="75" cy="90" rx="12" ry="15" fill="#A16207" transform="rotate(-20 75 90)" />
      <ellipse cx="125" cy="95" rx="10" ry="13" fill="#A16207" transform="rotate(25 125 95)" />
      <ellipse cx="95" cy="115" rx="11" ry="14" fill="#A16207" transform="rotate(-10 95 115)" />

      {/* Texture and wrinkles */}
      <g stroke="#78350F" strokeWidth="1.2" opacity="0.5" fill="none">
        <path d="M70 92 Q90 90 110 93" />
        <path d="M68 100 Q95 98 125 102" />
        <path d="M72 108 Q98 106 122 110" />
      </g>

      {/* Detailed texture spots */}
      <g fill="#451A03" opacity="0.4">
        <circle cx="80" cy="95" r="2" />
        <circle cx="100" cy="92" r="2.5" />
        <circle cx="120" cy="100" r="2" />
        <circle cx="90" cy="108" r="2" />
        <circle cx="110" cy="113" r="2.5" />
      </g>

      {/* Highlight */}
      <ellipse cx="95" cy="90" rx="8" ry="12" fill="#D97706" opacity="0.5" />

      {/* Small sprouting shoots */}
      <g stroke="#10B981" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M85 80 Q83 72 80 70" />
        <path d="M115 82 Q117 74 120 72" />
      </g>
      <circle cx="80" cy="70" r="3" fill="#059669" />
      <circle cx="120" cy="72" r="3" fill="#059669" />
    </svg>
  );
}

export function GreenBeans({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* First bean pod */}
      <path
        d="M70 50 Q68 55 68 70 L70 110 Q72 125 75 135 Q78 142 82 145 Q85 142 87 135 Q90 125 92 110 L94 70 Q94 55 92 50 Q88 48 81 50 Z"
        fill="#15803D"
      />
      <path
        d="M70 50 Q69 58 69 75 L71 115 Q73 128 76 137"
        fill="#16A34A"
        opacity="0.8"
      />
      <ellipse cx="76" cy="90" rx="4" ry="20" fill="#22C55E" opacity="0.5" />

      {/* Second bean pod - overlapping */}
      <path
        d="M100 60 Q98 65 98 80 L100 120 Q102 135 105 145 Q108 152 112 155 Q115 152 117 145 Q120 135 122 120 L124 80 Q124 65 122 60 Q118 58 111 60 Z"
        fill="#15803D"
      />
      <path
        d="M100 60 Q99 68 99 85 L101 125 Q103 138 106 147"
        fill="#16A34A"
        opacity="0.8"
      />
      <ellipse cx="106" cy="100" rx="4" ry="20" fill="#22C55E" opacity="0.5" />

      {/* Third bean pod */}
      <path
        d="M130 55 Q128 60 128 75 L130 115 Q132 130 135 140 Q138 147 142 150 Q145 147 147 140 Q150 130 152 115 L154 75 Q154 60 152 55 Q148 53 141 55 Z"
        fill="#15803D"
      />
      <path
        d="M130 55 Q129 63 129 80 L131 120 Q133 133 136 142"
        fill="#16A34A"
        opacity="0.8"
      />
      <ellipse cx="136" cy="95" rx="4" ry="20" fill="#22C55E" opacity="0.5" />

      {/* Bean bumps/seeds inside pods */}
      <g fill="#14532D" opacity="0.3">
        <ellipse cx="81" cy="70" rx="3" ry="5" />
        <ellipse cx="81" cy="85" rx="3" ry="5" />
        <ellipse cx="81" cy="100" rx="3" ry="5" />
        <ellipse cx="81" cy="115" rx="3" ry="5" />
        <ellipse cx="81" cy="130" rx="3" ry="5" />

        <ellipse cx="111" cy="80" rx="3" ry="5" />
        <ellipse cx="111" cy="95" rx="3" ry="5" />
        <ellipse cx="111" cy="110" rx="3" ry="5" />
        <ellipse cx="111" cy="125" rx="3" ry="5" />
        <ellipse cx="111" cy="140" rx="3" ry="5" />

        <ellipse cx="141" cy="75" rx="3" ry="5" />
        <ellipse cx="141" cy="90" rx="3" ry="5" />
        <ellipse cx="141" cy="105" rx="3" ry="5" />
        <ellipse cx="141" cy="120" rx="3" ry="5" />
        <ellipse cx="141" cy="135" rx="3" ry="5" />
      </g>

      {/* Stems */}
      <path d="M81 50 Q78 45 75 42" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
      <path d="M111 60 Q108 55 105 52" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
      <path d="M141 55 Q138 50 135 47" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Garlic({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Garlic bulb base */}
      <circle cx="100" cy="110" r="50" fill="#F5F5F4" />
      <circle cx="100" cy="110" r="45" fill="#FAFAF9" />

      {/* Individual cloves */}
      <g>
        {/* Center clove */}
        <path
          d="M100 70 Q95 75 93 85 L92 105 Q93 115 100 118 Q107 115 108 105 L107 85 Q105 75 100 70 Z"
          fill="#E7E5E4"
        />

        {/* Left clove */}
        <path
          d="M75 85 Q70 90 70 100 L72 115 Q75 123 82 125 Q88 122 90 115 L90 100 Q88 90 82 85 Z"
          fill="#E7E5E4"
        />

        {/* Right clove */}
        <path
          d="M125 85 Q130 90 130 100 L128 115 Q125 123 118 125 Q112 122 110 115 L110 100 Q112 90 118 85 Z"
          fill="#E7E5E4"
        />

        {/* Bottom left clove */}
        <path
          d="M80 115 Q75 120 76 130 L78 142 Q82 150 88 151 Q94 148 95 142 L94 130 Q92 120 88 115 Z"
          fill="#E7E5E4"
        />

        {/* Bottom right clove */}
        <path
          d="M120 115 Q125 120 124 130 L122 142 Q118 150 112 151 Q106 148 105 142 L106 130 Q108 120 112 115 Z"
          fill="#E7E5E4"
        />
      </g>

      {/* Clove details/lines */}
      <g stroke="#D6D3D1" strokeWidth="1" opacity="0.6" fill="none">
        <path d="M100 75 L100 115" />
        <path d="M75 90 L90 118" />
        <path d="M125 90 L110 118" />
        <path d="M82 120 L94 145" />
        <path d="M118 120 L106 145" />
      </g>

      {/* Papery skin texture */}
      <g stroke="#A8A29E" strokeWidth="0.8" opacity="0.3" fill="none">
        <path d="M65 95 Q100 92 135 95" />
        <path d="M70 110 Q100 108 130 110" />
        <path d="M75 125 Q100 123 125 125" />
      </g>

      {/* Stem/sprout */}
      <path
        d="M100 70 Q98 62 95 58 L93 52 M100 70 L100 50 M100 70 Q102 62 105 58 L107 52"
        stroke="#10B981"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <g fill="#059669">
        <circle cx="93" cy="52" r="2.5" />
        <circle cx="100" cy="50" r="2.5" />
        <circle cx="107" cy="52" r="2.5" />
      </g>

      {/* Root area */}
      <ellipse cx="100" cy="155" rx="25" ry="8" fill="#E7E5E4" opacity="0.6" />
      <g stroke="#D6D3D1" strokeWidth="1" opacity="0.4">
        <line x1="90" y1="155" x2="88" y2="162" />
        <line x1="100" y1="156" x2="100" y2="163" />
        <line x1="110" y1="155" x2="112" y2="162" />
      </g>
    </svg>
  );
}

export function Peas({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Pea pod - open to show peas */}
      <path
        d="M70 80 Q65 85 65 100 L68 130 Q70 145 75 155 Q80 160 85 160 L115 160 Q120 160 125 155 Q130 145 132 130 L135 100 Q135 85 130 80 Z"
        fill="#15803D"
      />
      <path
        d="M70 80 Q67 87 67 105 L70 135 Q72 148 78 156"
        fill="#16A34A"
        opacity="0.8"
      />

      {/* Pod opening - lighter inside */}
      <path
        d="M80 85 Q78 90 78 105 L80 135 Q82 148 88 155 L112 155 Q118 148 120 135 L122 105 Q122 90 120 85 Z"
        fill="#D1FAE5"
      />

      {/* Individual peas inside */}
      <g>
        <circle cx="90" cy="100" r="10" fill="#10B981" />
        <circle cx="90" cy="100" r="8" fill="#22C55E" opacity="0.8" />
        <circle cx="88" cy="97" r="4" fill="#6EE7B7" opacity="0.6" />

        <circle cx="100" cy="110" r="11" fill="#10B981" />
        <circle cx="100" cy="110" r="9" fill="#22C55E" opacity="0.8" />
        <circle cx="98" cy="107" r="4" fill="#6EE7B7" opacity="0.6" />

        <circle cx="110" cy="100" r="10" fill="#10B981" />
        <circle cx="110" cy="100" r="8" fill="#22C55E" opacity="0.8" />
        <circle cx="108" cy="97" r="4" fill="#6EE7B7" opacity="0.6" />

        <circle cx="95" cy="125" r="10" fill="#10B981" />
        <circle cx="95" cy="125" r="8" fill="#22C55E" opacity="0.8" />
        <circle cx="93" cy="122" r="4" fill="#6EE7B7" opacity="0.6" />

        <circle cx="105" cy="130" r="10" fill="#10B981" />
        <circle cx="105" cy="130" r="8" fill="#22C55E" opacity="0.8" />
        <circle cx="103" cy="127" r="4" fill="#6EE7B7" opacity="0.6" />
      </g>

      {/* Pod texture/seam */}
      <path
        d="M75 85 Q70 100 70 115 L72 140 Q74 152 78 158"
        stroke="#14532D"
        strokeWidth="1.5"
        opacity="0.5"
        fill="none"
      />
      <path
        d="M125 85 Q130 100 130 115 L128 140 Q126 152 122 158"
        stroke="#14532D"
        strokeWidth="1.5"
        opacity="0.5"
        fill="none"
      />

      {/* Stem and tendril */}
      <path
        d="M100 80 L100 65 Q98 60 96 58"
        stroke="#059669"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M96 58 Q94 55 92 54 Q90 53 88 55 Q86 57 87 60"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function CurryLeaves({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Stem */}
      <path
        d="M100 160 Q100 120 100 80 L100 50"
        stroke="#065F46"
        strokeWidth="2.5"
        fill="none"
      />

      {/* Leaves on right side */}
      <path
        d="M100 70 Q110 68 118 72 Q125 78 125 85 Q123 92 118 96 Q110 98 100 95 Z"
        fill="#15803D"
      />
      <path
        d="M100 90 Q110 88 118 92 Q125 98 125 105 Q123 112 118 116 Q110 118 100 115 Z"
        fill="#16A34A"
      />
      <path
        d="M100 110 Q110 108 118 112 Q125 118 125 125 Q123 132 118 136 Q110 138 100 135 Z"
        fill="#15803D"
      />
      <path
        d="M100 130 Q110 128 118 132 Q125 138 125 145 Q123 152 118 156 Q110 158 100 155 Z"
        fill="#16A34A"
      />

      {/* Leaves on left side */}
      <path
        d="M100 80 Q90 78 82 82 Q75 88 75 95 Q77 102 82 106 Q90 108 100 105 Z"
        fill="#16A34A"
      />
      <path
        d="M100 100 Q90 98 82 102 Q75 108 75 115 Q77 122 82 126 Q90 128 100 125 Z"
        fill="#15803D"
      />
      <path
        d="M100 120 Q90 118 82 122 Q75 128 75 135 Q77 142 82 146 Q90 148 100 145 Z"
        fill="#16A34A"
      />

      {/* Leaf veins */}
      <g stroke="#14532D" strokeWidth="0.8" opacity="0.5">
        <path d="M100 70 Q112 72 118 80" />
        <path d="M100 90 Q112 92 118 100" />
        <path d="M100 110 Q112 112 118 120" />
        <path d="M100 130 Q112 132 118 140" />
        <path d="M100 80 Q88 82 82 90" />
        <path d="M100 100 Q88 102 82 110" />
        <path d="M100 120 Q88 122 82 130" />
      </g>

      {/* Highlights */}
      <g fill="#22C55E" opacity="0.4">
        <ellipse cx="108" cy="82" rx="4" ry="6" />
        <ellipse cx="108" cy="102" rx="4" ry="6" />
        <ellipse cx="92" cy="92" rx="4" ry="6" />
        <ellipse cx="92" cy="112" rx="4" ry="6" />
      </g>
    </svg>
  );
}

export function Coriander({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Stems - multiple stalks */}
      <g stroke="#059669" strokeWidth="2" fill="none">
        <path d="M85 140 L82 110 Q80 80 78 60" />
        <path d="M100 145 L100 110 Q100 80 100 55" />
        <path d="M115 140 L118 110 Q120 80 122 60" />
      </g>

      {/* Left stalk leaves */}
      <g fill="#16A34A">
        <path d="M78 60 Q72 58 68 62 Q66 68 70 72 Q75 73 78 70 Z" />
        <path d="M80 75 Q74 73 70 77 Q68 83 72 87 Q77 88 80 85 Z" />
        <path d="M82 95 Q76 93 72 97 Q70 103 74 107 Q79 108 82 105 Z" />
      </g>

      {/* Center stalk leaves - fuller, more detailed */}
      <g fill="#10B981">
        <path d="M95 55 Q90 52 85 55 Q82 60 85 65 Q90 68 95 65 Z" />
        <path d="M105 55 Q110 52 115 55 Q118 60 115 65 Q110 68 105 65 Z" />
        <path d="M92 70 Q87 68 83 72 Q81 77 84 81 Q89 83 92 80 Z" />
        <path d="M108 70 Q113 68 117 72 Q119 77 116 81 Q111 83 108 80 Z" />
        <path d="M95 85 Q90 83 86 87 Q84 92 87 96 Q92 98 95 95 Z" />
        <path d="M105 85 Q110 83 114 87 Q116 92 113 96 Q108 98 105 95 Z" />
      </g>

      {/* Right stalk leaves */}
      <g fill="#16A34A">
        <path d="M122 60 Q128 58 132 62 Q134 68 130 72 Q125 73 122 70 Z" />
        <path d="M120 75 Q126 73 130 77 Q132 83 128 87 Q123 88 120 85 Z" />
        <path d="M118 95 Q124 93 128 97 Q130 103 126 107 Q121 108 118 105 Z" />
      </g>

      {/* Detailed leaf structure - serrated edges */}
      <g stroke="#14532D" strokeWidth="0.6" opacity="0.4" fill="none">
        <path d="M95 55 Q92 58 95 60" />
        <path d="M105 55 Q108 58 105 60" />
        <path d="M92 70 Q89 73 92 75" />
        <path d="M108 70 Q111 73 108 75" />
      </g>

      {/* Highlights */}
      <g fill="#6EE7B7" opacity="0.5">
        <circle cx="92" cy="58" r="2.5" />
        <circle cx="108" cy="58" r="2.5" />
        <circle cx="100" cy="73" r="2.5" />
      </g>
    </svg>
  );
}

export function RidgeGourd({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main gourd body */}
      <path
        d="M100 40 Q90 45 87 60 L85 100 Q84 130 88 150 Q92 165 100 170 Q108 165 112 150 Q116 130 115 100 L113 60 Q110 45 100 40 Z"
        fill="#15803D"
      />
      <path
        d="M100 40 Q92 47 89 65 L87 105 Q86 132 90 152 Q94 163 100 167"
        fill="#16A34A"
        opacity="0.85"
      />

      {/* Ridges - raised texture lines */}
      <g stroke="#14532D" strokeWidth="2" opacity="0.6" fill="none">
        <path d="M92 55 Q90 70 89 100 Q89 125 92 145" />
        <path d="M96 50 Q94 70 93 100 Q93 125 96 150" />
        <path d="M100 45 Q100 70 100 100 Q100 130 100 160" />
        <path d="M104 50 Q106 70 107 100 Q107 125 104 150" />
        <path d="M108 55 Q110 70 111 100 Q111 125 108 145" />
      </g>

      {/* Ridge bumps */}
      <g fill="#14532D" opacity="0.3">
        <ellipse cx="92" cy="70" rx="2" ry="4" />
        <ellipse cx="96" cy="80" rx="2" ry="4" />
        <ellipse cx="104" cy="75" rx="2" ry="4" />
        <ellipse cx="108" cy="85" rx="2" ry="4" />
        <ellipse cx="92" cy="100" rx="2" ry="4" />
        <ellipse cx="108" cy="105" rx="2" ry="4" />
        <ellipse cx="96" cy="120" rx="2" ry="4" />
        <ellipse cx="104" cy="125" rx="2" ry="4" />
      </g>

      {/* Highlight */}
      <ellipse cx="105" cy="85" rx="8" ry="30" fill="#22C55E" opacity="0.4" />

      {/* Stem */}
      <path
        d="M95 35 Q92 30 88 32 L86 38 M100 33 L100 40 M105 35 Q108 30 112 32 L114 38"
        stroke="#10B981"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="100" cy="37" rx="7" ry="5" fill="#059669" />

      {/* Flower remnant */}
      <g fill="#FDE68A" opacity="0.8">
        <circle cx="98" cy="33" r="2" />
        <circle cx="102" cy="33" r="2" />
      </g>
    </svg>
  );
}

export function Coconut({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Coconut shell */}
      <circle cx="100" cy="105" r="60" fill="#78350F" />
      <circle cx="100" cy="105" r="55" fill="#92400E" opacity="0.9" />

      {/* Fibrous texture */}
      <g stroke="#451A03" strokeWidth="1.5" opacity="0.5">
        {[...Array(15)].map((_, i) => {
          const angle = (i * 24 * Math.PI) / 180;
          const x1 = 100 + Math.cos(angle) * 30;
          const y1 = 105 + Math.sin(angle) * 30;
          const x2 = 100 + Math.cos(angle) * 55;
          const y2 = 105 + Math.sin(angle) * 55;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>

      {/* Three eyes of coconut */}
      <g fill="#292524">
        <ellipse cx="90" cy="90" rx="6" ry="8" />
        <ellipse cx="110" cy="88" rx="6" ry="8" />
        <ellipse cx="100" cy="110" rx="6" ry="7" />
      </g>

      {/* Eyes indentation */}
      <g fill="#1C1917" opacity="0.6">
        <ellipse cx="90" cy="90" rx="4" ry="6" />
        <ellipse cx="110" cy="88" rx="4" ry="6" />
        <ellipse cx="100" cy="110" rx="4" ry="5" />
      </g>

      {/* Highlights */}
      <ellipse cx="85" cy="85" rx="15" ry="20" fill="#A16207" opacity="0.6" />
      <circle cx="80" cy="80" r="10" fill="#D97706" opacity="0.5" />

      {/* Additional fibrous details */}
      <g opacity="0.3">
        {[...Array(20)].map((_, i) => {
          const angle = Math.random() * Math.PI * 2;
          const distance = 25 + Math.random() * 25;
          const x = 100 + Math.cos(angle) * distance;
          const y = 105 + Math.sin(angle) * distance;
          const length = 5 + Math.random() * 8;
          return (
            <line
              key={i}
              x1={x}
              y1={y}
              x2={x + Math.cos(angle + Math.PI/4) * length}
              y2={y + Math.sin(angle + Math.PI/4) * length}
              stroke="#57534E"
              strokeWidth="1"
            />
          );
        })}
      </g>

      {/* Base shadow */}
      <ellipse cx="100" cy="165" rx="45" ry="8" fill="#292524" opacity="0.2" />
    </svg>
  );
}
