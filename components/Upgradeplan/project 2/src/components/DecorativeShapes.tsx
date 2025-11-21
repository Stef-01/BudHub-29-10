export function PassionFruit({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="100" cy="100" r="90" fill="#8B5CF6" opacity="0.9" />
      <circle cx="100" cy="100" r="80" fill="#A78BFA" opacity="0.8" />
      <ellipse cx="80" cy="80" rx="15" ry="20" fill="#C4B5FD" opacity="0.7" transform="rotate(-20 80 80)" />
      <ellipse cx="120" cy="90" rx="12" ry="18" fill="#C4B5FD" opacity="0.7" transform="rotate(15 120 90)" />
      <circle cx="100" cy="100" r="8" fill="#5B21B6" />
    </svg>
  );
}

export function AcerolaCherry({ className = "", size = 180 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="90" cy="100" r="50" fill="#EF4444" />
      <circle cx="90" cy="100" r="45" fill="#F87171" opacity="0.8" />
      <path
        d="M90 50 Q70 30, 60 40 T70 60"
        stroke="#10B981"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="80" cy="90" rx="8" ry="12" fill="#FCA5A5" opacity="0.6" />
      <circle cx="85" cy="85" r="6" fill="#FEE2E2" opacity="0.8" />
    </svg>
  );
}

export function OrangeSplash({ className = "", size = 220 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="110" cy="110" r="80" fill="#F97316" opacity="0.9" />
      <circle cx="110" cy="110" r="70" fill="#FB923C" opacity="0.8" />
      <path d="M110 40 L110 180 M40 110 L180 110" stroke="#FDBA74" strokeWidth="3" opacity="0.6" />
      <path d="M60 60 L160 160 M160 60 L60 160" stroke="#FDBA74" strokeWidth="3" opacity="0.6" />
      <circle cx="110" cy="110" r="15" fill="#EA580C" opacity="0.7" />
      <circle cx="110" cy="70" r="8" fill="#FED7AA" opacity="0.8" />
      <circle cx="110" cy="150" r="8" fill="#FED7AA" opacity="0.8" />
    </svg>
  );
}

export function LeafShape({ className = "", size = 150 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 150 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M75 10 Q120 30 130 75 Q120 120 75 140 Q30 120 20 75 Q30 30 75 10 Z"
        fill="#10B981"
        opacity="0.8"
      />
      <path
        d="M75 10 L75 140"
        stroke="#059669"
        strokeWidth="3"
        opacity="0.6"
      />
      <path
        d="M75 50 Q95 60 100 75"
        stroke="#059669"
        strokeWidth="2"
        opacity="0.5"
      />
      <path
        d="M75 90 Q55 100 50 115"
        stroke="#059669"
        strokeWidth="2"
        opacity="0.5"
      />
    </svg>
  );
}

export function BlobShape({ className = "", size = 250, color = "#05aa56" }: { className?: string; size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 250 250"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M125 25 Q175 50 200 100 Q225 150 175 200 Q125 225 75 200 Q25 150 25 100 Q50 50 125 25 Z"
        fill={color}
        opacity="0.15"
      />
    </svg>
  );
}

export function StarburstShape({ className = "", size = 180 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x1 = 90 + Math.cos(angle) * 30;
        const y1 = 90 + Math.sin(angle) * 30;
        const x2 = 90 + Math.cos(angle) * 80;
        const y2 = 90 + Math.sin(angle) * 80;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#FCD34D"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.6"
          />
        );
      })}
      <circle cx="90" cy="90" r="25" fill="#FBBF24" opacity="0.8" />
    </svg>
  );
}
