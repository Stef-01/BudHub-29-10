// Code-native LAYOUT STUDIES for scenery, vessels and garnish. They give the stations readable,
// interactive geometry until the asset track delivers final art (station art A04, vessel masks and
// foods A03). They are deliberately plain: flat shapes, no attempt to stand in as finished art.
// Every element carries data-layout-study so a visual review can find (and replace) them.
import React from 'react';
import type { StationId } from '../simulation/index.ts';
import { getFood } from '../simulation/index.ts';
import { FINISH_V1 } from '../simulation/index.ts';

export const STATION_COLORS: Record<StationId, { wall: string; accent: string; label: string; hi: string }> = {
  order: { wall: '#b9d87b', accent: '#2f7d3a', label: 'Order', hi: 'ऑर्डर' },
  build: { wall: '#a77cc9', accent: '#5b2f86', label: 'Build', hi: 'परोसें' },
  prep: { wall: '#eda957', accent: '#9a4f0c', label: 'Prep', hi: 'पकाएँ' },
  finish: { wall: '#6f98d6', accent: '#1f4e91', label: 'Finish', hi: 'सजाएँ' },
};

export function StationBackdrop({ station }: { station: StationId }) {
  const { wall } = STATION_COLORS[station];
  return (
    <svg className="ns-backdrop" viewBox="0 0 640 480" aria-hidden="true" data-layout-study="station-backdrop">
      <rect width="640" height="480" fill={wall} />
      {Array.from({ length: 6 }, (_, i) => (
        <path key={i} d={`M0 ${60 + i * 46}H640`} stroke="#fff" opacity=".18" strokeWidth="3" />
      ))}
      {station === 'order' ? (
        <rect x="0" y="330" width="640" height="150" fill="#8a7a62" />
      ) : (
        <>
          <rect x="0" y="352" width="640" height="128" fill="#bdbdb3" stroke="#30291f" strokeWidth="4" />
          <path d="M0 366H640" stroke="#f5f4dd" strokeWidth="6" />
        </>
      )}
    </svg>
  );
}

/** The order counter, drawn IN FRONT of the customer so it hides their legs. */
export function CounterFront() {
  return (
    <svg className="ns-counter-front" viewBox="0 0 640 480" aria-hidden="true" data-layout-study="order-counter">
      <rect x="40" y="300" width="430" height="24" rx="4" fill="#d9c9a3" stroke="#3b3024" strokeWidth="4" />
      <rect x="52" y="324" width="406" height="112" fill="#b38a5a" stroke="#3b3024" strokeWidth="4" />
      <path d="M52 352H458" stroke="#8e6a40" strokeWidth="3" />
    </svg>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  Grains: '#f3e6c4',
  'Lentils & Curries': '#d99234',
  'Vegetable Dishes': '#7f9f3f',
  'Breads & Breakfast': '#efe2c2',
  'Soups, Salads & Sides': '#c9874a',
  Treats: '#c0653a',
};
const FOOD_COLORS: Record<string, string> = {
  rice_white: '#f7f1df',
  rice_brown: '#c9a26b',
  rice_red: '#b8695c',
  raita: '#f1efe4',
  sprouts_salad: '#9cbf4a',
  palak_dal: '#7d9a2f',
  sambar: '#c7652d',
  chicken_curry: '#b5541f',
};

/** Flat layout-study colour for a food (not final food art). */
export function foodColor(foodId: string | undefined): string {
  if (!foodId) return '#ccc';
  return FOOD_COLORS[foodId] ?? CATEGORY_COLORS[getFood(foodId)?.category ?? ''] ?? '#ccc';
}

/** Side view of a steel katori with stacked fills (fractions of the vessel height). */
export function VesselSide({
  layers,
  fillLine,
  label,
}: {
  layers: Array<{ color: string; fraction: number }>;
  /** Fraction of the height where the base fill line sits, if any. */
  fillLine?: number;
  label: string;
}) {
  let y = 104;
  return (
    <svg viewBox="0 0 160 120" role="img" aria-label={label} data-layout-study="vessel-side">
      <defs>
        <clipPath id="ns-katori">
          <path d="M18 34Q23 106 80 108Q137 106 142 34Z" />
        </clipPath>
      </defs>
      <path d="M18 34Q23 106 80 108Q137 106 142 34Z" fill="#c4cfce" stroke="#30332e" strokeWidth="4" />
      <g clipPath="url(#ns-katori)">
        {layers.map((layer, i) => {
          const h = Math.max(0, Math.min(1, layer.fraction)) * 74;
          y -= h;
          return <rect key={i} x="0" y={y} width="160" height={h} fill={layer.color} stroke="#0002" />;
        })}
      </g>
      {fillLine !== undefined && (
        <path d={`M14 ${104 - fillLine * 74}H146`} stroke="#14213d" strokeWidth="2.5" strokeDasharray="0" />
      )}
      <ellipse cx="80" cy="34" rx="63" ry="12" fill="none" stroke="#30332e" strokeWidth="4" />
    </svg>
  );
}

export function GarnishGlyph({ id, size = 10 }: { id: string; size?: number }) {
  const s = size;
  switch (id) {
    case 'coriander':
      return <path d={`M0 ${-s}Q${s} 0 0 ${s}Q${-s} 0 0 ${-s}Z`} fill="#3f8f2f" stroke="#1d4d16" strokeWidth="1.2" />;
    case 'onion':
      return <circle r={s * 0.8} fill="none" stroke="#b86fa8" strokeWidth={s * 0.35} />;
    case 'lemon':
      return <path d={`M${-s} 0A${s} ${s} 0 0 1 ${s} 0Z`} fill="#f2d33b" stroke="#8a7614" strokeWidth="1.2" />;
    case 'green_chilli':
      return <path d={`M${-s} ${s * 0.3}Q0 ${-s} ${s} ${-s * 0.2}`} fill="none" stroke="#2f8a2b" strokeWidth={s * 0.45} strokeLinecap="round" />;
    case 'pomegranate':
      return <circle r={s * 0.5} fill="#c0213b" stroke="#6d0f20" strokeWidth="1" />;
    default:
      return <circle r={s * 0.5} fill="#888" />;
  }
}

/** Top view of the vessel for the finish station: drizzle grid, garnish pieces, keyboard cursor. */
export function VesselTop({
  baseColor,
  mainColor,
  drizzles,
  garnishes,
  cursor,
  label,
}: {
  baseColor: string;
  mainColor: string;
  drizzles: Array<{ color: string; cellsMg: number[] }>;
  garnishes: Array<{ id: string; x: number; y: number; fell: boolean }>;
  cursor?: { x: number; y: number };
  label: string;
}) {
  const n = FINISH_V1.gridSize;
  const cell = 200 / n;
  const toSvg = (v: number) => 120 + v * 100;
  return (
    <svg viewBox="0 0 240 240" role="img" aria-label={label} data-layout-study="vessel-top">
      <circle cx="120" cy="120" r="112" fill="#c4cfce" stroke="#30332e" strokeWidth="4" />
      <circle cx="120" cy="120" r="100" fill={baseColor} />
      <circle cx="120" cy="120" r="62" fill={mainColor} opacity=".95" />
      <clipPath id="ns-top-clip">
        <circle cx="120" cy="120" r="100" />
      </clipPath>
      <g clipPath="url(#ns-top-clip)">
        {drizzles.map((d, di) =>
          d.cellsMg.map((mg, i) =>
            mg > 0 ? (
              <circle
                key={`${di}-${i}`}
                cx={20 + (i % n) * cell + cell / 2}
                cy={20 + Math.floor(i / n) * cell + cell / 2}
                r={cell * Math.min(0.8, 0.35 + mg / 4000)}
                fill={d.color}
                stroke="#0001"
                opacity={Math.min(0.92, 0.45 + mg / 3000)}
              />
            ) : null
          )
        )}
      </g>
      {garnishes.map((g, i) => (
        <g key={i} transform={`translate(${toSvg(g.x)} ${toSvg(g.y)})`} opacity={g.fell ? 0.45 : 1}>
          <GarnishGlyph id={g.id} />
        </g>
      ))}
      {cursor && (
        <g transform={`translate(${toSvg(cursor.x)} ${toSvg(cursor.y)})`} aria-hidden="true">
          <circle r="9" fill="none" stroke="#111" strokeWidth="2" />
          <path d="M-14 0H-5M5 0H14M0 -14V-5M0 5V14" stroke="#111" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}

export const DRIZZLE_COLORS: Record<string, string> = { curd_swirl: '#fbfbf4', ghee_tadka: '#e7b52f' };
