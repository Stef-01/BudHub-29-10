// components/games/nutriserve-ui/FoodVisuals.tsx
import React from 'react';
import type { VisualProps } from '../NutriServeTypes';

// A reusable bowl component with a subtle gradient for a more 3D effect.
const Bowl: React.FC<{ id: string, fill: string | `url(#${string})`; children?: React.ReactNode }> = ({ id, fill, children }) => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <radialGradient id={`bowl-shadow-${id}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" style={{stopColor: 'rgb(0,0,0)', stopOpacity: 0.1}} />
                <stop offset="70%" style={{stopColor: 'rgb(0,0,0)', stopOpacity: 0.1}} />
                <stop offset="100%" style={{stopColor: 'rgb(0,0,0)', stopOpacity: 0}} />
            </radialGradient>
        </defs>
        <path d="M10 50 C 10 77.6, 90 77.6, 90 50" fill="#f1f5f9" stroke="#d1d5db" strokeWidth="4" />
        <ellipse cx="50" cy="50" rx="40" ry="15" fill={fill} stroke="#d1d5db" strokeWidth="2" />
        {children}
        <ellipse cx="50" cy="50" rx="40" ry="15" fill={`url(#bowl-shadow-${id})`} />
    </svg>
);

const interpolate = (value: number, from: [number, number], to: [number, number]) => {
    const [fromMin, fromMax] = from;
    const [toMin, toMax] = to;
    if (fromMax - fromMin === 0) return toMin; // Avoid division by zero
    const fromRange = fromMax - fromMin;
    const toRange = toMax - toMin;
    const scaledValue = (value - fromMin) / fromRange;
    return toMin + (scaledValue * toRange);
};


export const RiceVisual: React.FC<VisualProps> = ({ volume_ml }) => {
    // Default volume is a medium "Scoop" size for library view
    const currentVolume = volume_ml ?? 160; 

    // Map volume (80ml to 360ml) to a clipping circle radius (180 to 350)
    const clipRadius = interpolate(currentVolume, [80, 360], [180, 350]);

    return (
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="rice-mound-clip">
                <circle cx="512" cy="512" r={clipRadius} />
            </clipPath>
            <radialGradient id="rice-bowl-grad" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#d1d5db"/>
              <stop offset="100%" stopColor="#94a3b8"/>
            </radialGradient>
            <radialGradient id="rice-mound-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff"/>
              <stop offset="100%" stopColor="#f6f7fb"/>
            </radialGradient>
            <linearGradient id="rice-grain-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f1f5f9"/>
              <stop offset="50%" stopColor="#ffffff"/>
              <stop offset="100%" stopColor="#f1f5f9"/>
            </linearGradient>
            <filter id="rice-shadow-blur"><feGaussianBlur in="SourceGraphic" stdDeviation="15"/></filter>
          </defs>
          <g id="shadow">
            <ellipse cx="512" cy="820" rx="320" ry="60" fill="#000" opacity="0.1" filter="url(#rice-shadow-blur)"/>
          </g>
          <g id="vessel">
            <circle cx="512" cy="512" r="400" fill="url(#rice-bowl-grad)" stroke="#94a3b8" strokeWidth="2"/>
            <path d="M112 512 A 400 400 0 0 0 912 512 A 420 200 0 0 1 112 512 Z" fill="#ffffff" opacity="0.7"/>
            <circle cx="512" cy="512" r="400" fill="none" stroke="#ffffff" strokeWidth="6" opacity="0.5"/>
          </g>
          <g clipPath="url(#rice-mound-clip)">
              <g id="base_mass">
                <circle cx="512" cy="512" r="350" fill="url(#rice-mound-grad)"/>
              </g>
              <g id="ingredient_a" stroke="#d1d5db" strokeWidth="0.5">
                {/* Simplified grain rendering for brevity, but imagine hundreds */}
                <path d="M480 450 q 20 -10 40 0 q -20 10 -40 0 Z" fill="url(#rice-grain-grad)" transform="rotate(15 500 470)" />
                <path d="M520 460 q 20 -10 40 0 q -20 10 -40 0 Z" fill="url(#rice-grain-grad)" transform="rotate(35 540 480)" />
                <path d="M550 490 q 22 -11 44 0 q -22 11 -44 0 Z" fill="url(#rice-grain-grad)" transform="rotate(-10 572 512)" />
                <path d="M450 500 q 20 -10 40 0 q -20 10 -40 0 Z" fill="url(#rice-grain-grad)" transform="rotate(85 470 520)" />
                <path d="M490 530 q 25 -12 50 0 q -25 12 -50 0 Z" fill="url(#rice-grain-grad)" transform="rotate(25 515 555)" />
                <path d="M560 550 q 20 -10 40 0 q -20 10 -40 0 Z" fill="url(#rice-grain-grad)" transform="rotate(5 580 570)" />
                <path d="M600 510 q 22 -11 44 0 q -22 11 -44 0 Z" fill="url(#rice-grain-grad)" transform="rotate(-25 622 532)" />
                <path d="M400 550 q 20 -10 40 0 q -20 10 -40 0 Z" fill="url(#rice-grain-grad)" transform="rotate(95 420 570)" />
                <path d="M430 600 q 20 -10 40 0 q -20 10 -40 0 Z" fill="url(#rice-grain-grad)" transform="rotate(15 450 620)" />
                <path d="M500 620 q 22 -11 44 0 q -22 11 -44 0 Z" fill="url(#rice-grain-grad)" transform="rotate(45 522 642)" />
                <path d="M380 480 q 20 -10 40 0 q -20 10 -40 0 Z" fill="url(#rice-grain-grad)" transform="rotate(125 400 500)" />
                <path d="M650 480 q 25 -12 50 0 q -25 12 -50 0 Z" fill="url(#rice-grain-grad)" transform="rotate(-45 675 505)" />
              </g>
               <g id="ingredient_b">
                <path d="M510 480 q 22 -9 44 0 q -22 9 -44 0 Z" fill="#ffffff" transform="rotate(40 532 500)" />
                <path d="M480 510 q 22 -9 44 0 q -22 9 -44 0 Z" fill="#ffffff" transform="rotate(-15 502 530)" />
                <path d="M550 530 q 24 -10 48 0 q -24 10 -48 0 Z" fill="#ffffff" transform="rotate(55 574 554)" />
              </g>
          </g>
          <g id="specular">
            <ellipse cx="650" cy="380" rx="80" ry="30" fill="white" opacity="0.6" transform="rotate(-20 650 380)"/>
            <path d="M132 482 A 400 400 0 0 1 250 350" stroke="white" strokeWidth="3" opacity="0.8" fill="none"/>
          </g>
        </svg>
    );
};


// Dal with a tadka swirl and garnishes
export const DalVisual: React.FC<VisualProps> = () => (
     <Bowl id="dal" fill="url(#dal-gradient)">
        <defs>
            <radialGradient id="dal-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fcd34d" />
                <stop offset="100%" stopColor="#fb923c" />
            </radialGradient>
            <path id="coriander-leaf-dal" d="M10 10 Q 15 5, 20 10 T 10 10 M15 7.5 Q 12.5 12.5, 10 15 M15 7.5 Q 17.5 12.5, 20 15" fill="#16a34a" />
        </defs>
        <circle cx="50" cy="50" r="2" fill="#854d0e" opacity="0.5"/>
        <circle cx="45" cy="48" r="1.5" fill="#854d0e" opacity="0.5"/>
        <circle cx="58" cy="53" r="1.5" fill="#854d0e" opacity="0.5"/>
        <use href="#coriander-leaf-dal" x="40" y="38" transform="scale(0.5)" />
    </Bowl>
);

// Sabzi with more distinct vegetable shapes
export const SabziVisual: React.FC<VisualProps> = () => (
    <Bowl id="sabzi" fill="#fde68a">
        <circle cx="50" cy="50" r="8" fill="#4ade80" /> 
        <rect x="35" y="42" width="12" height="12" fill="#fb923c" rx="3" transform="rotate(15 41 48)" /> 
        <path d="M60 55 C 62 50, 68 50, 70 55 C 72 60, 68 62, 65 60 C 62 62, 58 60, 60 55" fill="#f8fafc" /> 
    </Bowl>
);

// Raita with cucumber shreds and spice garnish
export const RaitaVisual: React.FC<VisualProps> = () => (
    <Bowl id="raita" fill="#f0fdf4">
        <path d="M45 50 C 48 48, 52 48, 55 50" stroke="#16a34a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M58 48 C 61 47, 64 47, 67 48" stroke="#16a34a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M50 53 C 53 54, 57 54, 60 53" stroke="#16a34a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="52" cy="50" r="1" fill="#dc2626" opacity="0.7"/>
    </Bowl>
);

// Roti with realistic texture and charred spots
export const RotiVisual: React.FC<VisualProps> = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <filter id="roti-texture">
                <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="2" result="turbulence"/>
                <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="2" />
            </filter>
            <radialGradient id="roti-color" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f5deb3" />
                <stop offset="80%" stopColor="#e3c896" />
                <stop offset="100%" stopColor="#d2b48c" />
            </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#roti-color)" filter="url(#roti-texture)" />
        <path d="M30 35 Q 40 25, 50 35 T 30 35" fill="#854d0e" opacity="0.4" transform="rotate(20 40 30)"/>
        <path d="M60 65 Q 75 60, 80 70 T 60 65" fill="#854d0e" opacity="0.5" transform="rotate(-30 70 68)"/>
    </svg>
);

// Paneer curry with creamy gravy and garnish
export const PaneerVisual: React.FC<VisualProps> = () => (
    <Bowl id="paneer" fill="url(#paneer-gravy)">
        <defs>
            <radialGradient id="paneer-gravy">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f97316" />
            </radialGradient>
            <linearGradient id="paneer-cube" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="white" />
                <stop offset="100%" stopColor="#f1f5f9" />
            </linearGradient>
             <path id="coriander-leaf-paneer" d="M10 10 Q 15 5, 20 10 T 10 10 M15 7.5 Q 12.5 12.5, 10 15 M15 7.5 Q 17.5 12.5, 20 15" fill="#16a34a" />
        </defs>
        <rect x="45" y="45" width="12" height="12" fill="url(#paneer-cube)" rx="2" transform="rotate(10 51 51)"/>
        <rect x="32" y="50" width="12" height="12" fill="url(#paneer-cube)" rx="2" transform="rotate(-15 38 56)"/>
        <rect x="58" y="51" width="12" height="12" fill="url(#paneer-cube)" rx="2" transform="rotate(5 64 57)"/>
        <use href="#coriander-leaf-paneer" x="42" y="36" transform="scale(0.5)" />
    </Bowl>
);

// Chicken curry with defined pieces in a rich sauce
export const ChickenCurryVisual: React.FC<VisualProps> = () => (
    <Bowl id="chicken" fill="url(#chicken-gravy)">
        <defs>
            <radialGradient id="chicken-gravy">
                <stop offset="0%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#854d0e" />
            </radialGradient>
        </defs>
        <path d="M45 45 C 35 40, 30 50, 40 55 C 50 60, 55 50, 45 45" fill="#fef3c7" stroke="#eab308" strokeWidth="1"/>
        <path d="M65 50 C 55 48, 55 58, 62 60 C 70 62, 75 55, 65 50" fill="#fef3c7" stroke="#eab308" strokeWidth="1"/>
    </Bowl>
);

// Salad with layered, detailed leaves and other vegetables
export const SaladVisual: React.FC<VisualProps> = () => (
    <Bowl id="salad" fill="#f0fdf4">
        {/* Lettuce Leaves */}
        <path d="M25 60 Q 50 30, 75 60 T 25 60 Z" fill="#4ade80" opacity="0.8"/>
        <path d="M30 55 Q 55 25, 80 55 T 30 55 Z" fill="#86efac" opacity="0.8"/>
        
        {/* Tomato Wedge */}
        <path d="M60 45 C 50 50, 55 60, 60 60 C 65 60, 70 50, 60 45" fill="#ef4444" />
        <path d="M60 48 C 55 52, 58 58, 60 58 C 62 58, 65 52, 60 48" fill="#fef2f2" opacity="0.7"/>

        {/* Cucumber Slice */}
        <circle cx="45" cy="48" r="8" fill="#a3e635" />
        <circle cx="45" cy="48" r="6" fill="#d9f99d" />

        {/* Carrot Shreds */}
        <rect x="50" y="55" width="15" height="2" fill="#fb923c" rx="1" transform="rotate(20 57.5 56)"/>
    </Bowl>
);

// --- VISUALS from 2.1.0 ---

export const ButterChickenVisual: React.FC<VisualProps> = () => (
    <Bowl id="butter-chicken" fill="url(#butter-chicken-gravy)">
        <defs>
            <radialGradient id="butter-chicken-gravy">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ea580c" />
            </radialGradient>
        </defs>
        <path d="M45 45 C 35 40, 30 50, 40 55 C 50 60, 55 50, 45 45" fill="#fed7aa" stroke="#fb923c" strokeWidth="1"/>
        <path d="M65 50 C 55 48, 55 58, 62 60 C 70 62, 75 55, 65 50" fill="#fed7aa" stroke="#fb923c" strokeWidth="1"/>
        <path d="M40 50 C 45 45, 55 45, 60 50" stroke="#fff7ed" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </Bowl>
);

export const ParathaVisual: React.FC<VisualProps> = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <filter id="paratha-texture">
                <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" result="turbulence"/>
                <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="1.5" />
            </filter>
            <radialGradient id="paratha-color" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="80%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#eab308" />
            </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#paratha-color)" filter="url(#paratha-texture)" />
        <path d="M30 35 Q 40 25, 50 35 T 30 35" fill="#a16207" opacity="0.4" transform="rotate(20 40 30)"/>
        <path d="M60 65 Q 75 60, 80 70 T 60 65" fill="#a16207" opacity="0.5" transform="rotate(-30 70 68)"/>
    </svg>
);

export const CholeVisual: React.FC<VisualProps> = () => (
    <Bowl id="chole" fill="url(#chole-gravy)">
        <defs>
            <radialGradient id="chole-gravy">
                <stop offset="0%" stopColor="#a16207" />
                <stop offset="100%" stopColor="#854d0e" />
            </radialGradient>
        </defs>
        <ellipse cx="45" cy="48" rx="6" ry="8" fill="#fcd34d" transform="rotate(20 45 48)"/>
        <ellipse cx="60" cy="55" rx="6" ry="8" fill="#fcd34d" transform="rotate(-10 60 55)"/>
        <ellipse cx="40" cy="58" rx="6" ry="8" fill="#fcd34d" transform="rotate(5 40 58)"/>
    </Bowl>
);

export const BhindiSabziVisual: React.FC<VisualProps> = () => (
    <Bowl id="bhindi" fill="rgba(250, 250, 210, 0.5)">
        <path d="M40 45 L 60 50 L 55 60 Z" fill="#4d7c0f" />
        <path d="M60 42 L 70 45 L 65 55 Z" fill="#65a30d" />
        <path d="M35 55 L 50 65 L 40 60 Z" fill="#65a30d" />
        <circle cx="45" cy="50" r="1.5" fill="white" />
        <circle cx="62" cy="48" r="1.5" fill="white" />
        <circle cx="42" cy="58" r="1.5" fill="white" />
    </Bowl>
);

export const YogurtVisual: React.FC<VisualProps> = () => (
    <Bowl id="yogurt" fill="#f8fafc" />
);

// --- VISUALS from 2.2.0 ---

export const BrownRiceVisual: React.FC<VisualProps> = ({ volume_ml }) => {
    const currentVolume = volume_ml ?? 160; 
    const clipRadius = interpolate(currentVolume, [80, 360], [180, 350]);
    return (
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <clipPath id="brown-rice-clip"><circle cx="512" cy="512" r={clipRadius} /></clipPath>
                <radialGradient id="brown-rice-bowl-grad"><stop offset="60%" stopColor="#e2e8f0"/><stop offset="100%" stopColor="#cbd5e1"/></radialGradient>
                <radialGradient id="brown-rice-mound-grad"><stop offset="0%" stopColor="#c0a080"/><stop offset="100%" stopColor="#a08060"/></radialGradient>
                <linearGradient id="brown-rice-grain-grad"><stop offset="0%" stopColor="#d2b48c"/><stop offset="50%" stopColor="#c2a47c"/><stop offset="100%" stopColor="#d2b48c"/></linearGradient>
            </defs>
            <g id="vessel"><circle cx="512" cy="512" r="400" fill="url(#brown-rice-bowl-grad)" stroke="#b8c5d8" strokeWidth="2"/></g>
            <g clipPath="url(#brown-rice-clip)">
                <circle cx="512" cy="512" r="350" fill="url(#brown-rice-mound-grad)"/>
                {/* Simplified grain rendering */}
                <path d="M480 450 q 20 -10 40 0 q -20 10 -40 0 Z" fill="url(#brown-rice-grain-grad)" transform="rotate(15 500 470)" />
                <path d="M520 460 q 20 -10 40 0 q -20 10 -40 0 Z" fill="url(#brown-rice-grain-grad)" transform="rotate(35 540 480)" />
            </g>
        </svg>
    );
};

export const RedRiceVisual: React.FC<VisualProps> = ({ volume_ml }) => {
    const currentVolume = volume_ml ?? 160; 
    const clipRadius = interpolate(currentVolume, [80, 360], [180, 350]);
    return (
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <clipPath id="red-rice-clip"><circle cx="512" cy="512" r={clipRadius} /></clipPath>
                <radialGradient id="red-rice-bowl-grad"><stop offset="60%" stopColor="#e2e8f0"/><stop offset="100%" stopColor="#cbd5e1"/></radialGradient>
                <radialGradient id="red-rice-mound-grad"><stop offset="0%" stopColor="#c08080"/><stop offset="100%" stopColor="#a06060"/></radialGradient>
                <linearGradient id="red-rice-grain-grad"><stop offset="0%" stopColor="#b07070"/><stop offset="50%" stopColor="#a06060"/><stop offset="100%" stopColor="#b07070"/></linearGradient>
            </defs>
            <g id="vessel"><circle cx="512" cy="512" r="400" fill="url(#red-rice-bowl-grad)" stroke="#b8c5d8" strokeWidth="2"/></g>
            <g clipPath="url(#red-rice-clip)">
                <circle cx="512" cy="512" r="350" fill="url(#red-rice-mound-grad)"/>
                <path d="M480 450 q 20 -10 40 0 q -20 10 -40 0 Z" fill="url(#red-rice-grain-grad)" transform="rotate(15 500 470)" />
                <path d="M520 460 q 20 -10 40 0 q -20 10 -40 0 Z" fill="url(#red-rice-grain-grad)" transform="rotate(35 540 480)" />
            </g>
        </svg>
    );
};


export const BeanCurryVisual: React.FC<VisualProps> = () => (
    <Bowl id="bean-curry" fill="url(#bean-curry-gravy)">
        <defs>
            <radialGradient id="bean-curry-gravy"><stop offset="0%" stopColor="#b91c1c"/><stop offset="100%" stopColor="#991b1b"/></radialGradient>
        </defs>
        <ellipse cx="45" cy="48" rx="8" ry="6" fill="#fecaca" transform="rotate(-25 45 48)"/>
        <ellipse cx="60" cy="55" rx="8" ry="6" fill="#fecaca" transform="rotate(15 60 55)"/>
        <ellipse cx="40" cy="58" rx="8" ry="6" fill="#fecaca" transform="rotate(35 40 58)"/>
    </Bowl>
);

export const FriedFishVisual: React.FC<VisualProps> = () => (
    <Bowl id="fried-fish" fill="url(#fish-curry-gravy)">
        <defs>
            <radialGradient id="fish-curry-gravy"><stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#d97706"/></radialGradient>
        </defs>
        <path d="M30 55 C 40 40, 70 40, 80 55 S 60 70, 55 60 C 50 70, 20 70, 30 55" fill="#fef3c7" stroke="#ca8a04" strokeWidth="2"/>
    </Bowl>
);

export const PappadumVisual: React.FC<VisualProps> = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <filter id="pappadum-texture"><feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves="3" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="3"/></filter>
            <radialGradient id="pappadum-color"><stop offset="0%" stopColor="#fffbeb"/><stop offset="100%" stopColor="#fef3c7"/></radialGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#pappadum-color)" filter="url(#pappadum-texture)"/>
    </svg>
);

export const MasalaDosaVisual: React.FC<VisualProps> = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <radialGradient id="dosa-color"><stop offset="0%" stopColor="#fcd34d"/><stop offset="100%" stopColor="#fbbf24"/></radialGradient>
            <radialGradient id="masala-color"><stop offset="0%" stopColor="#fef3c7"/><stop offset="100%" stopColor="#fde68a"/></radialGradient>
        </defs>
        <path d="M20 30 C 40 10, 80 20, 90 40 L 80 70 C 60 90, 30 80, 20 60 Z" fill="url(#dosa-color)"/>
        <circle cx="75" cy="45" r="10" fill="url(#masala-color)"/>
    </svg>
);


// --- NEW VISUALS from 2.5.0 ---

export const ChanaMasalaVisual: React.FC<VisualProps> = () => (
    <Bowl id="chana-masala" fill="url(#chana-gravy)">
        <defs><radialGradient id="chana-gravy"><stop offset="0%" stopColor="#b45309"/><stop offset="100%" stopColor="#92400e"/></radialGradient></defs>
        <ellipse cx="48" cy="48" rx="6" ry="8" fill="#fef3c7" transform="rotate(20 48 48)"/>
        <ellipse cx="62" cy="53" rx="6" ry="8" fill="#fef3c7" transform="rotate(-10 62 53)"/>
        <ellipse cx="38" cy="55" rx="6" ry="8" fill="#fef3c7" transform="rotate(5 38 55)"/>
    </Bowl>
);

export const PalakDalVisual: React.FC<VisualProps> = () => (
    <Bowl id="palak-dal" fill="url(#palak-dal-color)">
        <defs><radialGradient id="palak-dal-color"><stop offset="0%" stopColor="#15803d"/><stop offset="100%" stopColor="#166534"/></radialGradient></defs>
        <path d="M40 50 C 45 45, 55 45, 60 50" stroke="#f0fdf4" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </Bowl>
);

export const MasoorDalVisual: React.FC<VisualProps> = () => (
    <Bowl id="masoor-dal" fill="url(#masoor-dal-color)">
        <defs><radialGradient id="masoor-dal-color"><stop offset="0%" stopColor="#f97316"/><stop offset="100%" stopColor="#ea580c"/></radialGradient></defs>
    </Bowl>
);

export const MoongDalTadkaVisual: React.FC<VisualProps> = () => (
    <Bowl id="moong-dal-tadka" fill="url(#moong-dal-color)">
        <defs><radialGradient id="moong-dal-color"><stop offset="0%" stopColor="#facc15"/><stop offset="100%" stopColor="#eab308"/></radialGradient></defs>
    </Bowl>
);

export const RajmaMasalaVisual: React.FC<VisualProps> = () => ( <BeanCurryVisual /> ); // Alias for BeanCurryVisual

export const SambarVisual: React.FC<VisualProps> = () => (
    <Bowl id="sambar" fill="url(#sambar-color)">
        <defs><radialGradient id="sambar-color"><stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#d97706"/></radialGradient></defs>
        <rect x="40" y="45" width="20" height="5" fill="#fef3c7" rx="2" transform="rotate(30 50 47.5)"/>
        <circle cx="60" cy="55" r="4" fill="#ef4444" />
    </Bowl>
);

export const BainganBhartaVisual: React.FC<VisualProps> = () => (
    <Bowl id="baingan-bharta" fill="url(#baingan-bharta-color)">
        <defs>
            <radialGradient id="baingan-bharta-color"><stop offset="0%" stopColor="#a3a3a3"/><stop offset="100%" stopColor="#737373"/></radialGradient>
            <filter id="bharta-texture"><feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves="2" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="2"/></filter>
        </defs>
        <ellipse cx="50" cy="50" rx="40" ry="15" fill="url(#baingan-bharta-color)" filter="url(#bharta-texture)"/>
    </Bowl>
);

export const BhindiMasalaVisual: React.FC<VisualProps> = () => ( <BhindiSabziVisual /> ); // Alias for BhindiSabziVisual

export const PalakPaneerVisual: React.FC<VisualProps> = () => (
    <Bowl id="palak-paneer" fill="url(#palak-paneer-color)">
        <defs>
            <radialGradient id="palak-paneer-color"><stop offset="0%" stopColor="#166534"/><stop offset="100%" stopColor="#14532d"/></radialGradient>
            <linearGradient id="palak-paneer-cube"><stop offset="0%" stopColor="white" /><stop offset="100%" stopColor="#f1f5f9" /></linearGradient>
        </defs>
        <rect x="45" y="45" width="10" height="10" fill="url(#palak-paneer-cube)" rx="2" transform="rotate(10 50 50)"/>
        <rect x="32" y="50" width="10" height="10" fill="url(#palak-paneer-cube)" rx="2" transform="rotate(-15 37 55)"/>
        <rect x="58" y="51" width="10" height="10" fill="url(#palak-paneer-cube)" rx="2" transform="rotate(5 63 56)"/>
    </Bowl>
);

export const MixedVegCurryVisual: React.FC<VisualProps> = () => (
    <Bowl id="mixed-veg-curry" fill="url(#mixed-veg-curry-color)">
        <defs><radialGradient id="mixed-veg-curry-color"><stop offset="0%" stopColor="#fcd34d"/><stop offset="100%" stopColor="#fb923c"/></radialGradient></defs>
        <circle cx="50" cy="50" r="5" fill="#4ade80" /> 
        <rect x="38" y="45" width="8" height="8" fill="#fb923c" rx="2" transform="rotate(15 42 49)" /> 
        <path d="M60 55 C 62 52, 65 52, 67 55" fill="#f8fafc" /> 
    </Bowl>
);

export const MethiTheplaVisual: React.FC<VisualProps> = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <filter id="thepla-texture"><feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="2" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="2" /></filter>
            <radialGradient id="thepla-color"><stop offset="0%" stopColor="#f5deb3" /><stop offset="100%" stopColor="#e3c896" /></radialGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#thepla-color)" filter="url(#thepla-texture)" />
        <circle cx="35" cy="40" r="2" fill="#166534" opacity="0.7"/>
        <circle cx="65" cy="60" r="2" fill="#166534" opacity="0.7"/>
        <circle cx="50" cy="65" r="2" fill="#166534" opacity="0.7"/>
    </svg>
);

export const MoongDalCheelaVisual: React.FC<VisualProps> = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <filter id="cheela-texture"><feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="2" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="1.5" /></filter>
            <radialGradient id="cheela-color"><stop offset="0%" stopColor="#fde047" /><stop offset="100%" stopColor="#facc15" /></radialGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#cheela-color)" filter="url(#cheela-texture)" />
    </svg>
);

export const PohaVisual: React.FC<VisualProps> = () => (
    <Bowl id="poha" fill="#fefce8">
        <circle cx="45" cy="50" r="3" fill="#4ade80" />
        <circle cx="60" cy="52" r="3" fill="#4ade80" />
        <rect x="50" y="45" width="8" height="4" fill="#f97316" rx="2" transform="rotate(45 54 47)"/>
    </Bowl>
);

export const JowarRotiVisual: React.FC<VisualProps> = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <filter id="jowar-texture"><feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves="3" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="2.5" /></filter>
            <radialGradient id="jowar-color"><stop offset="0%" stopColor="#f3e8d7" /><stop offset="100%" stopColor="#e4d4be" /></radialGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#jowar-color)" filter="url(#jowar-texture)" />
    </svg>
);

export const SproutsSaladVisual: React.FC<VisualProps> = () => (
    <Bowl id="sprouts" fill="#fafafa">
        <circle cx="50" cy="50" r="4" fill="#fca5a5"/>
        <circle cx="40" cy="55" r="4" fill="#fca5a5"/>
        <path d="M55 45 C 58 42, 62 42, 65 45" stroke="#fefce8" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M45 42 C 48 39, 52 39, 55 42" stroke="#fefce8" strokeWidth="2" fill="none" strokeLinecap="round" />
    </Bowl>
);

export const LemonRiceVisual: React.FC<VisualProps> = () => (
    <Bowl id="lemon-rice" fill="#fefce8">
        <path d="M65 40 C 60 45, 60 55, 65 60 L 70 50 Z" fill="#fde047" stroke="#facc15" strokeWidth="1"/>
    </Bowl>
);

export const MoongDalSoupVisual: React.FC<VisualProps> = () => ( <Bowl id="moong-soup" fill="#fefce8" /> );
export const TomatoSoupVisual: React.FC<VisualProps> = () => ( <Bowl id="tomato-soup" fill="#fecaca" /> );
export const CucumberRaitaVisual: React.FC<VisualProps> = () => ( <RaitaVisual /> );
export const CorianderChutneyVisual: React.FC<VisualProps> = () => ( <Bowl id="chutney" fill="#22c55e" /> );

export const CookedBeansVisual: React.FC<VisualProps> = () => (
    <Bowl id="cooked-beans" fill="url(#cooked-beans-gravy)">
        <defs>
            <radialGradient id="cooked-beans-gravy"><stop offset="0%" stopColor="#a16207"/><stop offset="100%" stopColor="#854d0e"/></radialGradient>
        </defs>
        <ellipse cx="50" cy="52" rx="7" ry="5" fill="#fecaca" transform="rotate(-15 50 52)"/>
        <ellipse cx="42" cy="48" rx="7" ry="5" fill="#fecaca" transform="rotate(25 42 48)"/>
        <ellipse cx="60" cy="49" rx="7" ry="5" fill="#fecaca" transform="rotate(10 60 49)"/>
    </Bowl>
);

// --- NEW VISUALS from 2.7.1 ---

export const GarlicNaanVisual: React.FC<VisualProps> = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <radialGradient id="naan-color"><stop offset="0%" stopColor="#fffbeb"/><stop offset="100%" stopColor="#fef3c7"/></radialGradient>
            <filter id="naan-texture"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="3"/></filter>
        </defs>
        <path d="M20 20 Q 50 0, 80 20 T 80 80 Q 50 100, 20 80 Z" fill="url(#naan-color)" filter="url(#naan-texture)"/>
        <circle cx="40" cy="35" r="2.5" fill="#a16207" opacity="0.6"/>
        <circle cx="65" cy="45" r="2.5" fill="#a16207" opacity="0.6"/>
        <path d="M50 60 L 52 58" stroke="#166534" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M45 70 L 47 68" stroke="#166534" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

export const CheeseNaanVisual: React.FC<VisualProps> = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <radialGradient id="cheese-naan-color"><stop offset="0%" stopColor="#fffbeb"/><stop offset="100%" stopColor="#fef3c7"/></radialGradient>
            <radialGradient id="cheese-color"><stop offset="0%" stopColor="#fde047"/><stop offset="100%" stopColor="#facc15"/></radialGradient>
            <filter id="cheese-naan-texture"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="4"/></filter>
        </defs>
        <path d="M20 20 Q 50 0, 80 20 T 80 80 Q 50 100, 20 80 Z" fill="url(#cheese-naan-color)" filter="url(#cheese-naan-texture)"/>
        <path d="M40 40 Q 50 30, 60 40 T 40 40" fill="url(#cheese-color)" opacity="0.8"/>
    </svg>
);

export const SamosaVisual: React.FC<VisualProps> = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
         <defs>
            <linearGradient id="samosa-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fcd34d"/>
                <stop offset="100%" stopColor="#fb923c"/>
            </linearGradient>
            <filter id="samosa-texture"><feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="2" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="1"/></filter>
        </defs>
        <path d="M30 70 L 70 70 L 50 30 Z" fill="url(#samosa-grad)" filter="url(#samosa-texture)" transform="rotate(-10 50 50)"/>
        <path d="M50 80 L 85 60 L 60 50 Z" fill="url(#samosa-grad)" filter="url(#samosa-texture)" transform="rotate(20 67.5 65)"/>
    </svg>
);

export const Chicken65Visual: React.FC<VisualProps> = () => (
    <Bowl id="chicken65" fill="url(#chicken65-gravy)">
        <defs>
            <radialGradient id="chicken65-gravy"><stop offset="0%" stopColor="#fca5a5"/><stop offset="100%" stopColor="#fee2e2"/></radialGradient>
            <path id="curry-leaf" d="M10 10 C 20 0, 30 10, 20 20 C 10 30, 0 20, 10 10 Z" fill="#166534"/>
        </defs>
        <path d="M45 45 C 35 40, 30 50, 40 55 C 50 60, 55 50, 45 45" fill="#dc2626" stroke="#b91c1c" strokeWidth="1.5"/>
        <path d="M65 50 C 55 48, 55 58, 62 60 C 70 62, 75 55, 65 50" fill="#dc2626" stroke="#b91c1c" strokeWidth="1.5"/>
        <use href="#curry-leaf" x="30" y="30" transform="scale(0.5) rotate(30)"/>
        <use href="#curry-leaf" x="55" y="35" transform="scale(0.5) rotate(-15)"/>
    </Bowl>
);


// --- NEW VISUALS from 2.7.2 ---

export const LadduVisual: React.FC<VisualProps> = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <radialGradient id="laddu-color"><stop offset="0%" stopColor="#fde047"/><stop offset="80%" stopColor="#f59e0b"/></radialGradient>
            <filter id="laddu-texture"><feTurbulence type="fractalNoise" baseFrequency="0.3" numOctaves="2" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="1.5"/></filter>
        </defs>
        <path d="M20 70 L 80 70 L 85 60 L 15 60 Z" fill="#e2e8f0"/>
        <circle cx="50" cy="45" r="30" fill="url(#laddu-color)" filter="url(#laddu-texture)"/>
    </svg>
);

export const MurukkuVisual: React.FC<VisualProps> = () => (
     <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <linearGradient id="murukku-color"><stop offset="0%" stopColor="#fcd34d"/><stop offset="100%" stopColor="#eab308"/></linearGradient>
            <filter id="murukku-texture"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="0.8"/></filter>
        </defs>
        <path d="M50 50 m-30 0 a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0 M50 50 m-20 0 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0" fill="none" stroke="url(#murukku-color)" strokeWidth="8" filter="url(#murukku-texture)"/>
    </svg>
);

export const JalebiVisual: React.FC<VisualProps> = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <linearGradient id="jalebi-color"><stop offset="0%" stopColor="#fb923c"/><stop offset="100%" stopColor="#f97316"/></linearGradient>
            <filter id="jalebi-gloss"><feGaussianBlur in="SourceGraphic" stdDeviation="1.5"/></filter>
        </defs>
        <path d="M50 50 m-30 0 a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0 M50 50 m-20 0 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0" fill="none" stroke="url(#jalebi-color)" strokeWidth="6"/>
        <path d="M50 50 m-28 0 a28 28 0 1 0 56 0" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5" filter="url(#jalebi-gloss)"/>
    </svg>
);

export const BombayMixVisual: React.FC<VisualProps> = () => (
    <Bowl id="bombay-mix" fill="#fef3c7">
        <circle cx="45" cy="50" r="4" fill="#ef4444" opacity="0.6"/>
        <path d="M50 45 C 55 42, 60 42, 65 45" stroke="#ca8a04" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M38 55 C 43 52, 48 52, 53 55" stroke="#ca8a04" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </Bowl>
);

export const PuttuVisual: React.FC<VisualProps> = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <linearGradient id="puttu-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff"/>
                <stop offset="100%" stopColor="#f1f5f9"/>
            </linearGradient>
            <filter id="puttu-texture"><feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves="2" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="1"/></filter>
        </defs>
        <rect x="35" y="20" width="30" height="60" rx="5" fill="url(#puttu-grad)" filter="url(#puttu-texture)"/>
        <rect x="35" y="35" width="30" height="5" fill="#e2e8f0" opacity="0.5"/>
        <rect x="35" y="55" width="30" height="5" fill="#e2e8f0" opacity="0.5"/>
    </svg>
);

export const VadaVisual: React.FC<VisualProps> = () => (
     <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <radialGradient id="vada-color"><stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#b45309"/></radialGradient>
            <filter id="vada-texture"><feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves="3" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="2"/></filter>
        </defs>
        <circle cx="50" cy="50" r="35" fill="url(#vada-color)" filter="url(#vada-texture)"/>
        <circle cx="50" cy="50" r="10" fill="#f1f5f9"/>
    </svg>
);

export const PaniPuriVisual: React.FC<VisualProps> = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <radialGradient id="puri-color"><stop offset="0%" stopColor="#fde68a"/><stop offset="100%" stopColor="#facc15"/></radialGradient>
            <radialGradient id="pani-color"><stop offset="0%" stopColor="#4d7c0f"/><stop offset="100%" stopColor="#365314"/></radialGradient>
        </defs>
        <circle cx="35" cy="40" r="15" fill="url(#puri-color)"/>
        <circle cx="65" cy="45" r="15" fill="url(#puri-color)"/>
        <circle cx="50" cy="70" r="20" fill="url(#pani-color)"/>
    </svg>
);

export const UpmaVisual: React.FC<VisualProps> = () => (
    <Bowl id="upma" fill="url(#upma-color)">
        <defs>
            <radialGradient id="upma-color"><stop offset="0%" stopColor="#fefce8"/><stop offset="100%" stopColor="#fef08a"/></radialGradient>
        </defs>
        <circle cx="48" cy="48" r="2" fill="#16a34a"/>
        <circle cx="60" cy="55" r="2" fill="#16a34a"/>
        <circle cx="55" cy="45" r="1" fill="#1e293b"/>
        <circle cx="45" cy="55" r="1" fill="#1e293b"/>
    </Bowl>
);

// --- NEW VISUALS from 2.9.0 ---

export const AlooGobiVisual: React.FC<VisualProps> = () => (
    <Bowl id="aloo-gobi" fill="rgba(253, 230, 138, 0.4)">
        <path d="M40 50 C 38 45, 42 45, 45 50 C 48 55, 42 55, 40 50" fill="#fef3c7" stroke="#fde68a" strokeWidth="1"/>
        <path d="M60 55 C 58 50, 62 50, 65 55 C 68 60, 62 60, 60 55" fill="#fef3c7" stroke="#fde68a" strokeWidth="1"/>
        <path d="M45 60 C 47 55, 53 55, 55 60 C 57 65, 53 67, 50 65 C 47 67, 43 65, 45 60" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1"/>
        <path d="M55 45 C 57 40, 63 40, 65 45 C 67 50, 63 52, 60 50 C 57 52, 53 50, 55 45" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1"/>
    </Bowl>
);

export const DalMakhaniVisual: React.FC<VisualProps> = () => (
    <Bowl id="dal-makhani" fill="url(#dal-makhani-gravy)">
        <defs>
            <radialGradient id="dal-makhani-gravy"><stop offset="0%" stopColor="#57280d"/><stop offset="100%" stopColor="#431e0a"/></radialGradient>
        </defs>
        <path d="M40 50 C 45 45, 55 45, 60 50 C 65 55, 55 60, 50 55" stroke="#fff7ed" strokeWidth="2" fill="none" strokeLinecap="round" transform="rotate(20 50 52.5)"/>
    </Bowl>
);

export const VegBiryaniVisual: React.FC<VisualProps> = ({ volume_ml }) => {
    const currentVolume = volume_ml ?? 250;
    const clipRadius = interpolate(currentVolume, [150, 350], [220, 350]);
    return (
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <clipPath id="biryani-clip"><circle cx="512" cy="512" r={clipRadius} /></clipPath>
                <radialGradient id="biryani-bowl-grad"><stop offset="60%" stopColor="#e2e8f0"/><stop offset="100%" stopColor="#cbd5e1"/></radialGradient>
                <radialGradient id="biryani-mound-grad"><stop offset="0%" stopColor="#fef3c7"/><stop offset="100%" stopColor="#fde68a"/></radialGradient>
            </defs>
            <g id="vessel"><circle cx="512" cy="512" r="400" fill="url(#biryani-bowl-grad)" stroke="#b8c5d8" strokeWidth="2"/></g>
            <g clipPath="url(#biryani-clip)">
                <circle cx="512" cy="512" r="350" fill="url(#biryani-mound-grad)"/>
                {/* Simplified grain/veg rendering */}
                <path d="M480 450 q 20 -10 40 0 q -20 10 -40 0 Z" fill="#f1f5f9" transform="rotate(15 500 470)" />
                <path d="M520 460 q 20 -10 40 0 q -20 10 -40 0 Z" fill="#fef9c3" transform="rotate(35 540 480)" />
                <rect x="550" y="490" width="15" height="5" rx="2" fill="#fb923c"/>
                <circle cx="460" cy="510" r="4" fill="#4ade80"/>
                <ellipse cx="500" cy="540" rx="8" ry="4" fill="#86efac"/>
            </g>
        </svg>
    );
};

// --- KERALA CUISINE VISUALS ---

export const KeralaParippuCurryVisual: React.FC<VisualProps> = () => (
    <Bowl id="kerala-parippu" fill="url(#kerala-parippu-grad)">
        <defs>
            <radialGradient id="kerala-parippu-grad">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#facc15" />
            </radialGradient>
            <path id="curry-leaf-parippu" d="M10 10 Q 15 5, 20 10 T 10 10 M15 7.5 Q 12.5 12.5, 10 15 M15 7.5 Q 17.5 12.5, 20 15" fill="#166534" />
        </defs>
        <circle cx="50" cy="50" r="2" fill="#854d0e" opacity="0.5"/>
        <circle cx="45" cy="48" r="1.5" fill="#854d0e" opacity="0.5"/>
        <circle cx="58" cy="53" r="1.5" fill="#854d0e" opacity="0.5"/>
        <path d="M40 50 C 45 45, 55 45, 60 50" stroke="#f0fdf4" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <use href="#curry-leaf-parippu" x="42" y="36" transform="scale(0.5)" />
    </Bowl>
);

export const BeansCarrotThoranVisual: React.FC<VisualProps> = () => (
    <Bowl id="beans-carrot-thoran" fill="rgba(254, 243, 199, 0.3)">
        <rect x="40" y="45" width="15" height="3" fill="#4ade80" rx="1" transform="rotate(25 47.5 46.5)"/>
        <rect x="50" y="50" width="15" height="3" fill="#4ade80" rx="1" transform="rotate(-15 57.5 51.5)"/>
        <rect x="35" y="55" width="15" height="3" fill="#fb923c" rx="1" transform="rotate(45 42.5 56.5)"/>
        <rect x="55" y="55" width="15" height="3" fill="#fb923c" rx="1" transform="rotate(-35 62.5 56.5)"/>
        <circle cx="48" cy="52" r="1.5" fill="#f8fafc" opacity="0.8"/>
        <circle cx="55" cy="48" r="1.5" fill="#f8fafc" opacity="0.8"/>
    </Bowl>
);

export const TapiocaKappaVisual: React.FC<VisualProps> = () => (
    <Bowl id="tapioca-kappa" fill="url(#tapioca-color)">
        <defs>
            <radialGradient id="tapioca-color">
                <stop offset="0%" stopColor="#fefce8" />
                <stop offset="100%" stopColor="#fef3c7" />
            </radialGradient>
            <filter id="tapioca-texture">
                <feTurbulence type="fractalNoise" baseFrequency="0.3" numOctaves="2" result="t"/>
                <feDisplacementMap in="SourceGraphic" in2="t" scale="2"/>
            </filter>
        </defs>
        <ellipse cx="50" cy="50" rx="40" ry="15" fill="url(#tapioca-color)" filter="url(#tapioca-texture)"/>
    </Bowl>
);

export const KadalaCurryVisual: React.FC<VisualProps> = () => (
    <Bowl id="kadala-curry" fill="url(#kadala-gravy)">
        <defs>
            <radialGradient id="kadala-gravy">
                <stop offset="0%" stopColor="#92400e" />
                <stop offset="100%" stopColor="#78350f" />
            </radialGradient>
            <path id="curry-leaf-kadala" d="M10 10 Q 15 5, 20 10 T 10 10 M15 7.5 Q 12.5 12.5, 10 15 M15 7.5 Q 17.5 12.5, 20 15" fill="#166534" />
        </defs>
        <ellipse cx="45" cy="48" rx="6" ry="8" fill="#a16207" transform="rotate(20 45 48)"/>
        <ellipse cx="60" cy="55" rx="6" ry="8" fill="#a16207" transform="rotate(-10 60 55)"/>
        <ellipse cx="40" cy="58" rx="6" ry="8" fill="#a16207" transform="rotate(5 40 58)"/>
        <use href="#curry-leaf-kadala" x="55" y="38" transform="scale(0.5)" />
    </Bowl>
);

export const MoringaLeafThoranVisual: React.FC<VisualProps> = () => (
    <Bowl id="moringa-thoran" fill="rgba(222, 247, 236, 0.5)">
        <path d="M40 50 Q 45 45, 50 50 T 60 50" fill="#16a34a" opacity="0.8"/>
        <path d="M45 55 Q 50 50, 55 55 T 65 55" fill="#22c55e" opacity="0.8"/>
        <path d="M35 58 Q 40 53, 45 58 T 55 58" fill="#16a34a" opacity="0.8"/>
        <circle cx="48" cy="52" r="1.5" fill="#f8fafc" opacity="0.8"/>
        <circle cx="56" cy="54" r="1.5" fill="#f8fafc" opacity="0.8"/>
    </Bowl>
);

export const BananaFlowerThoranVisual: React.FC<VisualProps> = () => (
    <Bowl id="banana-flower-thoran" fill="rgba(254, 226, 226, 0.3)">
        <path d="M45 48 C 48 45, 52 45, 55 48 C 58 51, 55 54, 50 52" fill="#e11d48" opacity="0.7"/>
        <path d="M40 55 C 43 52, 47 52, 50 55 C 53 58, 50 61, 45 59" fill="#be123c" opacity="0.7"/>
        <path d="M55 55 C 58 52, 62 52, 65 55 C 68 58, 65 61, 60 59" fill="#e11d48" opacity="0.7"/>
        <circle cx="50" cy="52" r="1.5" fill="#f8fafc" opacity="0.8"/>
    </Bowl>
);

export const OkraPachadiVisual: React.FC<VisualProps> = () => (
    <Bowl id="okra-pachadi" fill="#fef3c7">
        <path d="M40 45 L 55 48 L 52 56 Z" fill="#65a30d" opacity="0.7"/>
        <path d="M60 47 L 68 49 L 65 57 Z" fill="#65a30d" opacity="0.7"/>
        <path d="M38 55 L 48 60 L 43 58 Z" fill="#65a30d" opacity="0.7"/>
        <circle cx="45" cy="50" r="1.5" fill="white" />
        <circle cx="62" cy="52" r="1.5" fill="white" />
        <path d="M48 48 C 51 46, 55 46, 58 48" stroke="#f0fdf4" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </Bowl>
);

export const JackfruitSeedsThoranVisual: React.FC<VisualProps> = () => (
    <Bowl id="jackfruit-seeds-thoran" fill="rgba(254, 243, 199, 0.4)">
        <ellipse cx="45" cy="50" rx="8" ry="6" fill="#fef3c7" stroke="#eab308" strokeWidth="1" transform="rotate(15 45 50)"/>
        <ellipse cx="58" cy="52" rx="8" ry="6" fill="#fef3c7" stroke="#eab308" strokeWidth="1" transform="rotate(-20 58 52)"/>
        <ellipse cx="42" cy="58" rx="8" ry="6" fill="#fef3c7" stroke="#eab308" strokeWidth="1" transform="rotate(10 42 58)"/>
        <circle cx="50" cy="54" r="1.5" fill="#f8fafc" opacity="0.8"/>
    </Bowl>
);

export const MathiSardineCurryVisual: React.FC<VisualProps> = () => (
    <Bowl id="mathi-curry" fill="url(#mathi-gravy)">
        <defs>
            <radialGradient id="mathi-gravy">
                <stop offset="0%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#b91c1c" />
            </radialGradient>
            <path id="curry-leaf-mathi" d="M10 10 Q 15 5, 20 10 T 10 10 M15 7.5 Q 12.5 12.5, 10 15 M15 7.5 Q 17.5 12.5, 20 15" fill="#166534" />
        </defs>
        <path d="M35 50 C 45 40, 65 40, 75 50 S 60 65, 55 58" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5"/>
        <path d="M40 58 C 48 52, 62 52, 68 58" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5"/>
        <use href="#curry-leaf-mathi" x="55" y="35" transform="scale(0.5)" />
    </Bowl>
);

export const MoruCurryPulisseryVisual: React.FC<VisualProps> = () => (
    <Bowl id="moru-curry" fill="url(#moru-color)">
        <defs>
            <radialGradient id="moru-color">
                <stop offset="0%" stopColor="#fefce8" />
                <stop offset="100%" stopColor="#fef08a" />
            </radialGradient>
            <path id="curry-leaf-moru" d="M10 10 Q 15 5, 20 10 T 10 10 M15 7.5 Q 12.5 12.5, 10 15 M15 7.5 Q 17.5 12.5, 20 15" fill="#166534" />
        </defs>
        <circle cx="50" cy="50" r="2" fill="#854d0e" opacity="0.3"/>
        <circle cx="45" cy="48" r="1.5" fill="#854d0e" opacity="0.3"/>
        <use href="#curry-leaf-moru" x="55" y="38" transform="scale(0.5)" />
    </Bowl>
);

export const KeralaLambCurryVisual: React.FC<VisualProps> = () => (
    <Bowl id="kerala-lamb-curry" fill="url(#lamb-gravy)">
        <defs>
            <radialGradient id="lamb-gravy">
                <stop offset="0%" stopColor="#92400e" />
                <stop offset="100%" stopColor="#78350f" />
            </radialGradient>
            <path id="curry-leaf-lamb" d="M10 10 Q 15 5, 20 10 T 10 10 M15 7.5 Q 12.5 12.5, 10 15 M15 7.5 Q 17.5 12.5, 20 15" fill="#166534" />
        </defs>
        <path d="M42 46 C 36 42, 32 48, 38 54 C 44 60, 50 54, 46 48" fill="#fef3c7" stroke="#b45309" strokeWidth="1.5"/>
        <path d="M62 52 C 56 50, 54 58, 60 62 C 66 66, 72 60, 66 54" fill="#fef3c7" stroke="#b45309" strokeWidth="1.5"/>
        <use href="#curry-leaf-lamb" x="52" y="36" transform="scale(0.5)" />
    </Bowl>
);

export const KeralaBeefCurryVisual: React.FC<VisualProps> = () => (
    <Bowl id="kerala-beef-curry" fill="url(#beef-gravy)">
        <defs>
            <radialGradient id="beef-gravy">
                <stop offset="0%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#57280d" />
            </radialGradient>
            <path id="curry-leaf-beef" d="M10 10 Q 15 5, 20 10 T 10 10 M15 7.5 Q 12.5 12.5, 10 15 M15 7.5 Q 17.5 12.5, 20 15" fill="#166534" />
        </defs>
        <path d="M42 46 C 36 42, 32 48, 38 54 C 44 60, 50 54, 46 48" fill="#d97706" stroke="#92400e" strokeWidth="1.5"/>
        <path d="M62 52 C 56 50, 54 58, 60 62 C 66 66, 72 60, 66 54" fill="#d97706" stroke="#92400e" strokeWidth="1.5"/>
        <path d="M50 58 C 46 56, 44 62, 48 65" fill="#d97706" stroke="#92400e" strokeWidth="1.5"/>
        <use href="#curry-leaf-beef" x="54" y="35" transform="scale(0.5)" />
        <ellipse cx="53" cy="47" rx="3" ry="2" fill="#f8fafc" opacity="0.6"/>
    </Bowl>
);

export const DosaPlainVisual: React.FC<VisualProps> = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <radialGradient id="dosa-color-plain">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="80%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#facc15" />
            </radialGradient>
            <filter id="dosa-texture">
                <feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves="2" result="turbulence"/>
                <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="2" />
            </filter>
        </defs>
        <path d="M20 30 C 40 15, 75 25, 88 45 L 82 70 C 65 88, 35 80, 22 62 Z" fill="url(#dosa-color-plain)" filter="url(#dosa-texture)"/>
        <path d="M35 40 Q 45 35, 55 40 T 35 40" fill="#ca8a04" opacity="0.3" transform="rotate(15 45 40)"/>
        <path d="M65 60 Q 72 55, 78 60 T 65 60" fill="#ca8a04" opacity="0.3" transform="rotate(-20 71.5 60)"/>
    </svg>
);

export const IdliPlainVisual: React.FC<VisualProps> = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <radialGradient id="idli-color">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="80%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#f1f5f9" />
            </radialGradient>
            <filter id="idli-texture">
                <feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves="2" result="t"/>
                <feDisplacementMap in="SourceGraphic" in2="t" scale="1.5"/>
            </filter>
            <radialGradient id="idli-shadow">
                <stop offset="0%" stopColor="rgba(0,0,0,0.1)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
        </defs>
        <ellipse cx="50" cy="75" rx="30" ry="5" fill="url(#idli-shadow)"/>
        <ellipse cx="50" cy="50" rx="32" ry="20" fill="url(#idli-color)" filter="url(#idli-texture)"/>
        <ellipse cx="50" cy="45" rx="30" ry="15" fill="#ffffff" opacity="0.5"/>
    </svg>
);