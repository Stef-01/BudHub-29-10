export function DrinkingCharacter({ className = "", size = 300 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M80 180 Q70 160 85 145 L95 135 Q105 130 110 140 L115 160 Q120 180 110 200 Q100 220 85 215 Q75 210 75 195 Z"
        fill="#FBBF24"
        stroke="#F59E0B"
        strokeWidth="3"
      />

      <ellipse cx="88" cy="165" rx="4" ry="5" fill="#78350F" />
      <ellipse cx="103" cy="165" rx="4" ry="5" fill="#78350F" />

      <path
        d="M88 180 Q95 185 102 180"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      <path
        d="M60 200 Q50 190 55 175 Q60 160 75 160 L85 165 Q90 170 88 180 L85 200 Q82 220 70 230 Q58 240 50 230 Q42 220 45 205 Z"
        fill="#10B981"
        stroke="#059669"
        strokeWidth="3"
      />

      <path
        d="M120 250 Q110 240 110 220 L115 200 Q120 190 130 195 L145 210 Q150 225 145 245 L140 265 Q135 280 125 285 Q115 290 110 280 Z"
        fill="#10B981"
        stroke="#059669"
        strokeWidth="3"
      />

      <ellipse
        cx="140"
        cy="160"
        rx="50"
        ry="60"
        fill="#38BDF8"
        opacity="0.3"
        stroke="#0EA5E9"
        strokeWidth="2"
      />

      <ellipse
        cx="140"
        cy="150"
        rx="45"
        ry="50"
        fill="#7DD3FC"
        opacity="0.4"
      />

      <path
        d="M120 130 L130 100 Q135 85 145 88 L155 95 Q160 105 155 115 L145 135"
        stroke="#0EA5E9"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      <ellipse cx="130" cy="145" rx="8" ry="10" fill="#F87171" opacity="0.6" />
      <ellipse cx="150" cy="145" rx="8" ry="10" fill="#FBBF24" opacity="0.6" />

      <path
        d="M125 165 Q135 170 145 165"
        stroke="#0EA5E9"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function TreeCharacter({ className = "", size = 400 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <ellipse cx="200" cy="320" rx="60" ry="15" fill="#6B7280" opacity="0.3" />

      <path
        d="M180 250 L185 290 Q190 310 200 315 Q210 310 215 290 L220 250"
        fill="#78350F"
        stroke="#57290F"
        strokeWidth="4"
      />

      <path
        d="M150 150 Q130 120 145 95 Q160 70 190 85 Q220 70 235 95 Q250 120 230 150 Q220 170 200 180 Q180 170 150 150 Z"
        fill="#10B981"
        stroke="#059669"
        strokeWidth="4"
      />

      <path
        d="M170 130 Q160 110 175 95 Q190 80 210 95 Q225 110 215 130 Q210 145 200 150 Q190 145 170 130 Z"
        fill="#34D399"
        opacity="0.7"
      />

      <circle cx="165" cy="180" r="6" fill="#FBBF24" opacity="0.8" />
      <circle cx="235" cy="180" r="6" fill="#FBBF24" opacity="0.8" />
      <circle cx="195" cy="165" r="6" fill="#F87171" opacity="0.8" />
      <circle cx="210" cy="190" r="5" fill="#FBBF24" opacity="0.8" />

      <path
        d="M185 210 Q195 215 205 210"
        stroke="#059669"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      <path
        d="M140 180 L110 195 Q100 200 105 210 L115 220"
        stroke="#059669"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      <path
        d="M260 180 L290 195 Q300 200 295 210 L285 220"
        stroke="#059669"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      <ellipse cx="175" cy="195" rx="5" ry="7" fill="#1F2937" />
      <ellipse cx="225" cy="195" rx="5" ry="7" fill="#1F2937" />

      <circle cx="150" cy="120" r="15" fill="#FDE68A" />
      <circle cx="250" cy="130" r="12" fill="#FDE68A" />
      <circle cx="190" cy="95" r="10" fill="#FDE68A" />
    </svg>
  );
}

export function TruckCharacter({ className = "", size = 500 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.5}
      viewBox="0 0 600 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <ellipse cx="300" cy="260" rx="200" ry="20" fill="#6B7280" opacity="0.2" />

      <rect
        x="50"
        y="120"
        width="180"
        height="100"
        rx="15"
        fill="#6B7280"
        stroke="#4B5563"
        strokeWidth="4"
      />

      <rect
        x="70"
        y="140"
        width="50"
        height="60"
        rx="5"
        fill="#E0F2FE"
        stroke="#0EA5E9"
        strokeWidth="3"
      />

      <path
        d="M100 155 L105 150 L105 175 L100 170 Z"
        fill="#BAE6FD"
        opacity="0.6"
      />

      <rect
        x="230"
        y="100"
        width="280"
        height="120"
        rx="20"
        fill="#92400E"
        stroke="#78350F"
        strokeWidth="4"
      />

      <circle cx="150" cy="230" r="25" fill="#1F2937" stroke="#0F172A" strokeWidth="4" />
      <circle cx="150" cy="230" r="15" fill="#4B5563" />

      <circle cx="430" cy="230" r="25" fill="#1F2937" stroke="#0F172A" strokeWidth="4" />
      <circle cx="430" cy="230" r="15" fill="#4B5563" />

      <ellipse cx="300" cy="130" rx="25" ry="30" fill="#FBBF24" />
      <path
        d="M295 120 Q290 110 295 105 L300 102 L305 105 Q310 110 305 120"
        fill="#84CC16"
      />

      <ellipse cx="350" cy="140" rx="30" ry="35" fill="#8B5CF6" />
      <path
        d="M345 125 Q340 115 345 110 L350 107 L355 110 Q360 115 355 125"
        fill="#84CC16"
      />

      <path
        d="M380 115 Q375 105 380 95 L390 90 Q400 88 405 95 L410 110 Q412 125 405 135 L395 145 Q385 145 380 135 Z"
        fill="#F87171"
      />

      <ellipse cx="440" cy="145" rx="28" ry="32" fill="#10B981" />
      <path
        d="M435 130 Q430 120 435 115 L440 112 L445 115 Q450 120 445 130"
        fill="#84CC16"
      />

      <path
        d="M470 130 Q465 120 470 110 L480 105 Q490 103 495 110 L500 125 Q502 140 495 150 L485 160 Q475 160 470 150 Z"
        fill="#FDE68A"
      />

      <path
        d="M320 155 Q325 165 335 160"
        stroke="#78350F"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function BlobCharacter({ className = "", size = 200, color = "#8B5CF6" }: { className?: string; size?: number; color?: string }) {
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
        d="M60 100 Q50 70 70 50 Q90 30 110 50 Q130 70 140 100 Q150 130 130 150 Q110 170 90 150 Q70 130 60 100 Z"
        fill={color}
        stroke={color}
        strokeWidth="3"
        opacity="0.9"
      />

      <ellipse cx="80" cy="90" rx="8" ry="12" fill="#1F2937" />
      <ellipse cx="120" cy="90" rx="8" ry="12" fill="#1F2937" />

      <ellipse cx="83" cy="87" rx="3" ry="4" fill="white" />
      <ellipse cx="123" cy="87" rx="3" ry="4" fill="white" />

      <path
        d="M85 110 Q100 120 115 110"
        stroke="#1F2937"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      <ellipse cx="65" cy="105" rx="12" ry="8" fill={color} opacity="0.6" />
      <ellipse cx="135" cy="105" rx="12" ry="8" fill={color} opacity="0.6" />
    </svg>
  );
}

export function FarmerCharacter({ className = "", size = 300 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <ellipse cx="150" cy="270" rx="80" ry="15" fill="#6B7280" opacity="0.3" />

      <path
        d="M120 180 Q115 170 120 160 L125 150 Q130 145 140 150 L150 160 Q155 170 150 185 L145 200 Q140 210 130 205 Q120 200 120 185 Z"
        fill="#FBBF24"
        stroke="#F59E0B"
        strokeWidth="3"
      />

      <ellipse cx="132" cy="170" rx="4" ry="5" fill="#78350F" />
      <ellipse cx="145" cy="170" rx="4" ry="5" fill="#78350F" />

      <path
        d="M132 183 Q138 188 145 183"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      <path
        d="M110 150 Q95 140 100 125 Q105 110 120 115 L135 125 Q145 135 140 145 L130 155"
        fill="#84CC16"
        stroke="#65A30D"
        strokeWidth="3"
      />

      <ellipse cx="115" cy="130" rx="25" ry="15" fill="#84CC16" opacity="0.6" />

      <path
        d="M100 200 Q95 190 95 175 L98 160 Q100 155 108 158 L118 168 Q120 180 115 195 L110 210 Q105 220 98 215 Q92 210 95 200 Z"
        fill="#10B981"
        stroke="#059669"
        strokeWidth="3"
      />

      <path
        d="M150 200 Q155 190 158 175 L162 160 Q165 155 173 158 L183 168 Q188 180 183 195 L178 210 Q173 220 166 215 Q160 210 158 200 Z"
        fill="#10B981"
        stroke="#059669"
        strokeWidth="3"
      />

      <rect
        x="115"
        y="190"
        width="35"
        height="70"
        rx="5"
        fill="#F59E0B"
        stroke="#EA580C"
        strokeWidth="3"
      />

      <path
        d="M105 220 L80 230 Q70 235 72 245 L78 255"
        stroke="#F59E0B"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
