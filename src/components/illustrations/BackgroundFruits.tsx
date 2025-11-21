// Background decorative fruit elements with soft, pastel styling
import React from 'react';

export function BackgroundStrawberry({ className = "", size = 150 }: { className?: string; size?: number }) {
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
      <ellipse cx="100" cy="180" rx="60" ry="12" fill="#000000" opacity="0.08" />

      {/* Main body - softer colors */}
      <path
        d="M100 50 Q80 40 70 50 L60 70 Q55 90 60 110 Q70 140 100 170 Q130 140 140 110 Q145 90 140 70 L130 50 Q120 40 100 50 Z"
        fill="#FCA5A5"
      />
      <path
        d="M100 50 Q85 45 75 52 Q70 60 70 70 L78 90 Q85 105 95 120"
        fill="#FEE2E2"
        opacity="0.7"
      />

      {/* Seeds - softer yellow */}
      <g fill="#FDE68A" opacity="0.6">
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
      </g>

      {/* Leaves - softer green */}
      <path
        d="M85 45 Q90 30 95 35 L100 40 L105 35 Q110 30 115 45"
        fill="#86EFAC"
      />
      <path
        d="M90 40 L92 45 M100 35 L100 42 M110 40 L108 45"
        stroke="#4ADE80"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BackgroundBlueberry({ className = "", size = 150 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Soft shadow */}
      <ellipse cx="90" cy="165" rx="50" ry="10" fill="#000000" opacity="0.08" />

      {/* Main body - pastel purple/blue */}
      <circle cx="90" cy="90" r="70" fill="#C4B5FD" />
      <circle cx="90" cy="90" r="65" fill="#DDD6FE" opacity="0.8" />

      {/* Highlights */}
      <ellipse cx="70" cy="75" rx="20" ry="25" fill="#EDE9FE" opacity="0.6" />
      <ellipse cx="110" cy="80" rx="18" ry="22" fill="#EDE9FE" opacity="0.5" />
      <circle cx="75" cy="70" r="8" fill="#FFFFFF" opacity="0.7" />

      {/* Crown */}
      <path
        d="M85 30 Q80 25 78 28 Q76 32 78 35 L82 38 L90 35 L88 30 Z"
        fill="#86EFAC"
      />
      <path
        d="M95 30 Q100 25 102 28 Q104 32 102 35 L98 38 L90 35 L92 30 Z"
        fill="#86EFAC"
      />
    </svg>
  );
}

export function BackgroundKiwi({ className = "", size = 150 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 190 190"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Soft shadow */}
      <ellipse cx="95" cy="175" rx="55" ry="12" fill="#000000" opacity="0.08" />

      {/* Fuzzy skin - light brown */}
      <ellipse cx="95" cy="95" rx="70" ry="75" fill="#D6BCAA" />

      {/* Flesh - soft green */}
      <ellipse cx="95" cy="95" rx="60" ry="65" fill="#D9F99D" />
      <ellipse cx="95" cy="95" rx="50" ry="55" fill="#BEF264" opacity="0.7" />

      {/* Center - cream */}
      <circle cx="95" cy="95" r="15" fill="#FEF3C7" />

      {/* Seeds - soft pattern */}
      <g fill="#065F46" opacity="0.4">
        {[...Array(16)].map((_, i) => {
          const angle = Math.random() * Math.PI * 2;
          const distance = 30 + Math.random() * 20;
          const x = 95 + Math.cos(angle) * distance;
          const y = 95 + Math.sin(angle) * distance;
          return <circle key={i} cx={x} cy={y} r="1.5" />;
        })}
      </g>

      {/* Rays from center */}
      {[...Array(10)].map((_, i) => {
        const angle = (i * 36 * Math.PI) / 180;
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
            opacity="0.5"
          />
        );
      })}
    </svg>
  );
}

export function BackgroundWatermelon({ className = "", size = 180 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Soft shadow */}
      <ellipse cx="110" cy="200" rx="80" ry="15" fill="#000000" opacity="0.08" />

      {/* Slice shape - softer red/pink */}
      <path
        d="M40 110 Q40 50 110 50 Q180 50 180 110 Q180 170 110 170 Q40 170 40 110 Z"
        fill="#FDA4AF"
      />
      <path
        d="M50 110 Q50 65 110 65 Q170 65 170 110 Q170 155 110 155 Q50 155 50 110 Z"
        fill="#FECDD3"
      />

      {/* Rind - soft green */}
      <path
        d="M40 110 Q40 170 110 170 Q180 170 180 110"
        stroke="#86EFAC"
        strokeWidth="20"
        fill="none"
      />
      <path
        d="M35 110 Q35 175 110 175 Q185 175 185 110"
        stroke="#BBF7D0"
        strokeWidth="8"
        fill="none"
      />

      {/* Seeds - lighter */}
      <g fill="#1F2937" opacity="0.3">
        <ellipse cx="80" cy="100" rx="4" ry="7" transform="rotate(-20 80 100)" />
        <ellipse cx="110" cy="95" rx="4" ry="7" transform="rotate(10 110 95)" />
        <ellipse cx="140" cy="100" rx="4" ry="7" transform="rotate(-15 140 100)" />
        <ellipse cx="95" cy="115" rx="4" ry="7" transform="rotate(25 95 115)" />
        <ellipse cx="125" cy="115" rx="4" ry="7" transform="rotate(-30 125 115)" />
      </g>
    </svg>
  );
}

export function BackgroundPineapple({ className = "", size = 150 }: { className?: string; size?: number }) {
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

      {/* Slice - soft yellow */}
      <circle cx="100" cy="100" r="80" fill="#FDE68A" />
      <circle cx="100" cy="100" r="70" fill="#FEF3C7" />
      <circle cx="100" cy="100" r="25" fill="#FFFBEB" />

      {/* Segments - very soft */}
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
              stroke="#FCD34D"
              strokeWidth="2"
              opacity="0.4"
            />
          </g>
        );
      })}

      {/* Center pattern - dots */}
      {[...Array(8)].map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        const x = 100 + Math.cos(angle) * 35;
        const y = 100 + Math.sin(angle) * 35;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="3"
            fill="#92400E"
            opacity="0.3"
          />
        );
      })}
    </svg>
  );
}

export function BackgroundGrapes({ className = "", size = 150 }: { className?: string; size?: number }) {
  const grapes = [
    { cx: 100, cy: 60, r: 14 },
    { cx: 85, cy: 78, r: 14 },
    { cx: 115, cy: 78, r: 14 },
    { cx: 75, cy: 96, r: 13 },
    { cx: 100, cy: 93, r: 15 },
    { cx: 125, cy: 96, r: 13 },
    { cx: 85, cy: 112, r: 14 },
    { cx: 115, cy: 112, r: 14 },
    { cx: 100, cy: 128, r: 14 },
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
      {/* Soft shadow */}
      <ellipse cx="100" cy="170" rx="50" ry="10" fill="#000000" opacity="0.08" />

      {/* Leaves */}
      <path
        d="M95 40 Q85 25 80 30 L75 38 Q73 42 75 48 L85 55"
        fill="#86EFAC"
      />
      <path
        d="M105 40 Q115 25 120 30 L125 38 Q127 42 125 48 L115 55"
        fill="#86EFAC"
      />

      {/* Grapes - soft purple */}
      {grapes.map((grape, i) => (
        <g key={i}>
          <circle {...grape} fill="#DDD6FE" />
          <circle
            cx={grape.cx - 3}
            cy={grape.cy - 3}
            r={grape.r * 0.4}
            fill="#FFFFFF"
            opacity="0.6"
          />
        </g>
      ))}
    </svg>
  );
}

export function BackgroundOrange({ className = "", size = 150 }: { className?: string; size?: number }) {
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

      {/* Orange body - soft orange */}
      <circle cx="100" cy="100" r="75" fill="#FED7AA" />
      <circle cx="100" cy="100" r="65" fill="#FDBA74" opacity="0.8" />

      {/* Segments */}
      {[...Array(8)].map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        const x = 100 + Math.cos(angle) * 50;
        const y = 100 + Math.sin(angle) * 50;
        return (
          <line
            key={i}
            x1="100"
            y1="100"
            x2={x}
            y2={y}
            stroke="#FB923C"
            strokeWidth="2"
            opacity="0.3"
          />
        );
      })}

      {/* Center */}
      <circle cx="100" cy="100" r="8" fill="#FFFBEB" />

      {/* Highlight */}
      <ellipse cx="85" cy="85" rx="20" ry="25" fill="#FFFFFF" opacity="0.4" />
    </svg>
  );
}

export function BackgroundLemon({ className = "", size = 140 }: { className?: string; size?: number }) {
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
      <ellipse cx="100" cy="185" rx="55" ry="10" fill="#000000" opacity="0.08" />

      {/* Lemon shape - soft yellow */}
      <ellipse cx="100" cy="100" rx="60" ry="75" fill="#FEF3C7" />
      <ellipse cx="100" cy="100" rx="50" ry="65" fill="#FEF9C3" opacity="0.8" />

      {/* Highlight */}
      <ellipse cx="85" cy="80" rx="18" ry="28" fill="#FFFFFF" opacity="0.5" />

      {/* Texture dots */}
      <g fill="#EAB308" opacity="0.2">
        {[...Array(15)].map((_, i) => {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * 50;
          const x = 100 + Math.cos(angle) * distance;
          const y = 100 + Math.sin(angle) * distance * 1.2;
          return <circle key={i} cx={x} cy={y} r="1.5" />;
        })}
      </g>
    </svg>
  );
}
