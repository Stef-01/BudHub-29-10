// Background decorative vegetable elements with soft, pastel styling
import React from 'react';

export function BackgroundTomato({ className = "", size = 150 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Soft shadow */}
      <ellipse cx="100" cy="185" rx="55" ry="12" fill="#000000" opacity="0.08" />

      {/* Main body - soft red */}
      <circle cx="100" cy="110" r="65" fill="#FCA5A5" />
      <circle cx="100" cy="110" r="60" fill="#FEE2E2" opacity="0.9" />

      {/* Highlight */}
      <ellipse cx="80" cy="95" rx="25" ry="30" fill="#FECACA" opacity="0.6" />
      <circle cx="75" cy="90" r="12" fill="#FFFFFF" opacity="0.5" />

      {/* Stem and leaves - soft green */}
      <path d="M85 50 Q90 40 95 45 L100 50 L105 45 Q110 40 115 50 L110 60 L100 55 L90 60 Z" fill="#86EFAC" />
      <line x1="100" y1="50" x2="100" y2="60" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function BackgroundCarrot({ className = "", size = 150 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Soft shadow */}
      <ellipse cx="100" cy="185" rx="45" ry="10" fill="#000000" opacity="0.08" />

      {/* Carrot body - soft orange */}
      <path
        d="M100 50 Q90 60 85 80 Q80 110 85 140 Q90 160 100 170 Q110 160 115 140 Q120 110 115 80 Q110 60 100 50 Z"
        fill="#FDBA74"
      />
      <path
        d="M100 50 Q95 65 93 85 Q91 105 95 125"
        fill="#FED7AA"
        opacity="0.8"
      />

      {/* Texture lines */}
      <g stroke="#FB923C" strokeWidth="1.5" opacity="0.3">
        <line x1="90" y1="90" x2="110" y2="88" />
        <line x1="88" y1="110" x2="112" y2="108" />
        <line x1="87" y1="130" x2="113" y2="128" />
      </g>

      {/* Green leaves top - soft */}
      <path d="M95 50 Q85 35 80 40 L85 50" fill="#86EFAC" />
      <path d="M100 45 Q95 25 90 30 L95 45" fill="#BBF7D0" />
      <path d="M105 50 Q115 35 120 40 L115 50" fill="#86EFAC" />
      <path d="M100 48 Q105 28 110 33 L105 48" fill="#BBF7D0" />
    </svg>
  );
}

export function BackgroundEggplant({ className = "", size = 150 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Soft shadow */}
      <ellipse cx="100" cy="185" rx="50" ry="12" fill="#000000" opacity="0.08" />

      {/* Eggplant body - soft purple */}
      <ellipse cx="100" cy="115" rx="55" ry="75" fill="#DDD6FE" />
      <ellipse cx="100" cy="115" rx="50" ry="70" fill="#EDE9FE" opacity="0.8" />

      {/* Highlight */}
      <ellipse cx="85" cy="95" rx="20" ry="30" fill="#FFFFFF" opacity="0.4" />

      {/* Cap - soft green */}
      <ellipse cx="100" cy="45" rx="30" ry="15" fill="#86EFAC" />
      <path d="M70 45 Q100 35 130 45 L125 55 Q100 48 75 55 Z" fill="#BBF7D0" />

      {/* Stem */}
      <rect x="97" y="30" width="6" height="20" rx="3" fill="#4ADE80" />
    </svg>
  );
}

export function BackgroundOnion({ className = "", size = 140 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Soft shadow */}
      <ellipse cx="100" cy="180" rx="50" ry="12" fill="#000000" opacity="0.08" />

      {/* Onion body - soft tan/cream */}
      <circle cx="100" cy="105" r="60" fill="#FEF3C7" />
      <circle cx="100" cy="105" r="50" fill="#FFFBEB" opacity="0.8" />
      <circle cx="100" cy="105" r="40" fill="#FEF9C3" opacity="0.6" />

      {/* Papery texture */}
      <path
        d="M60 105 Q60 75 100 75 Q140 75 140 105"
        stroke="#FCD34D"
        strokeWidth="2"
        opacity="0.3"
        fill="none"
      />

      {/* Sprout - soft green */}
      <path d="M98 45 Q95 30 90 35 L95 50" fill="#BBF7D0" />
      <path d="M102 45 Q105 30 110 35 L105 50" fill="#86EFAC" />
      <rect x="97" y="45" width="6" height="15" rx="3" fill="#D9F99D" />
    </svg>
  );
}

export function BackgroundCauliflower({ className = "", size = 160 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Soft shadow */}
      <ellipse cx="100" cy="185" rx="60" ry="12" fill="#000000" opacity="0.08" />

      {/* Florets - soft cream white */}
      <circle cx="100" cy="100" r="50" fill="#FFFBEB" />
      <circle cx="75" cy="90" r="30" fill="#FEF9C3" opacity="0.8" />
      <circle cx="125" cy="90" r="30" fill="#FEF9C3" opacity="0.8" />
      <circle cx="90" cy="120" r="28" fill="#FEF3C7" opacity="0.7" />
      <circle cx="110" cy="120" r="28" fill="#FEF3C7" opacity="0.7" />
      <circle cx="100" cy="75" r="25" fill="#FFFFFF" opacity="0.6" />

      {/* Leaves - soft green */}
      <path
        d="M60 130 Q50 115 55 110 L70 120 Q65 130 60 130"
        fill="#BBF7D0"
        opacity="0.7"
      />
      <path
        d="M140 130 Q150 115 145 110 L130 120 Q135 130 140 130"
        fill="#86EFAC"
        opacity="0.7"
      />
    </svg>
  );
}

export function BackgroundPumpkin({ className = "", size = 160 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Soft shadow */}
      <ellipse cx="100" cy="185" rx="65" ry="14" fill="#000000" opacity="0.08" />

      {/* Pumpkin body - soft orange */}
      <ellipse cx="100" cy="110" rx="70" ry="65" fill="#FDBA74" />
      <ellipse cx="100" cy="110" rx="60" ry="55" fill="#FED7AA" opacity="0.8" />

      {/* Segments */}
      <g stroke="#FB923C" strokeWidth="2" opacity="0.3" fill="none">
        <path d="M100 45 Q100 50 100 175" />
        <path d="M70 65 Q75 110 70 155" />
        <path d="M130 65 Q125 110 130 155" />
        <path d="M50 100 Q60 110 50 125" />
        <path d="M150 100 Q140 110 150 125" />
      </g>

      {/* Stem - soft brown/green */}
      <rect x="93" y="30" width="14" height="25" rx="7" fill="#D6BCAA" />
      <path
        d="M95 30 Q85 20 90 18 Q92 22 95 25"
        fill="#86EFAC"
      />
    </svg>
  );
}

export function BackgroundCucumber({ className = "", size = 170 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Soft shadow */}
      <ellipse cx="100" cy="185" rx="40" ry="10" fill="#000000" opacity="0.08" />

      {/* Cucumber body - soft green */}
      <ellipse cx="100" cy="100" rx="35" ry="75" fill="#BBF7D0" transform="rotate(15 100 100)" />
      <ellipse cx="100" cy="100" rx="30" ry="70" fill="#D9F99D" opacity="0.8" transform="rotate(15 100 100)" />

      {/* Bumps texture */}
      <g fill="#86EFAC" opacity="0.3">
        {[...Array(12)].map((_, i) => {
          const y = 50 + i * 12;
          const x = 100 + (i % 2 === 0 ? -8 : 8);
          return <circle key={i} cx={x} cy={y} r="3" />;
        })}
      </g>

      {/* End cap */}
      <ellipse cx="105" cy="45" rx="12" ry="8" fill="#4ADE80" transform="rotate(15 105 45)" />
    </svg>
  );
}

export function BackgroundBellPepper({ className = "", size = 150 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Soft shadow */}
      <ellipse cx="100" cy="185" rx="55" ry="12" fill="#000000" opacity="0.08" />

      {/* Pepper body - soft red/orange */}
      <path
        d="M100 60 Q75 70 70 100 Q68 130 80 150 Q100 165 120 150 Q132 130 130 100 Q125 70 100 60 Z"
        fill="#FCA5A5"
      />
      <path
        d="M100 60 Q80 75 78 100 Q77 120 88 140"
        fill="#FEE2E2"
        opacity="0.7"
      />

      {/* Highlight */}
      <ellipse cx="85" cy="90" rx="20" ry="30" fill="#FFFFFF" opacity="0.4" />

      {/* Stem - soft green */}
      <ellipse cx="100" cy="50" rx="20" ry="12" fill="#86EFAC" />
      <rect x="95" y="35" width="10" height="20" rx="5" fill="#4ADE80" />
    </svg>
  );
}
