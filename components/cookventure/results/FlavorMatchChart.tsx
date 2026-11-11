// components/cookventure/results/FlavorMatchChart.tsx
// Dumbbell chart: the user's taste vs the dish on each of the four flavor axes (0-3).
import React, { useState } from 'react';
import type { TasteAxes } from '../../../types/cookventure';
import { TASTE_AXES, TASTE_LEVEL_LABELS } from '../../../services/cookventure/labels';

// Categorical slots 1 & 2 of the validated dataviz palette (CVD-safe pair on white)
const YOU_COLOR = '#2a78d6';
const DISH_COLOR = '#eb6834';
const MAX_LEVEL = 3;

interface FlavorMatchChartProps {
  userTaste: TasteAxes;
  dishTaste: TasteAxes;
  /** Dish taste before a tadka swap, used to point out which axis moved */
  previousDishTaste?: TasteAxes;
}

const pct = (value: number) => `${(value / MAX_LEVEL) * 100}%`;
const levelText = (value: number) => `${TASTE_LEVEL_LABELS[value] ?? value} (${value})`;

const FlavorMatchChart: React.FC<FlavorMatchChartProps> = ({ userTaste, dishTaste, previousDishTaste }) => {
  const [hovered, setHovered] = useState<keyof TasteAxes | null>(null);
  const hoveredAxis = TASTE_AXES.find((a) => a.key === hovered);

  return (
    <figure className="m-0">
      {/* Legend: shape + color, so identity never relies on color alone */}
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-600" aria-hidden="true">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-3.5 h-3.5 rounded-full bg-white"
            style={{ boxShadow: `inset 0 0 0 2.5px ${YOU_COLOR}` }}
          />
          You
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: DISH_COLOR }} />
          This dish
        </span>
        <span className="ml-auto text-gray-500">Gap</span>
      </div>

      <div className="space-y-1" role="list">
        {TASTE_AXES.map((axis) => {
          const you = userTaste[axis.key];
          const dish = dishTaste[axis.key];
          const gap = Math.abs(you - dish);
          const lo = Math.min(you, dish);
          const hi = Math.max(you, dish);
          const moved = previousDishTaste && previousDishTaste[axis.key] !== dish;
          const description = `${axis.roman} (${axis.en}): you like ${levelText(you)}, this dish is ${levelText(dish)}`;

          return (
            <div
              key={axis.key}
              role="listitem"
              tabIndex={0}
              aria-label={description}
              onMouseEnter={() => setHovered(axis.key)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(axis.key)}
              onBlur={() => setHovered(null)}
              className={`grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-2 rounded-md px-1 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
                hovered === axis.key ? 'bg-gray-50' : ''
              }`}
            >
              <div className="leading-tight">
                <div className="text-xs font-semibold text-gray-800">
                  <span aria-hidden="true">{axis.emoji}</span> {axis.roman}
                </div>
                <div className="text-[10px] text-gray-500">{axis.hi}</div>
              </div>

              {/* Plot area: hairline track, gap connector, then markers */}
              <div className="relative h-6 mx-2" aria-hidden="true">
                <div className="absolute inset-x-0 top-1/2 h-px bg-gray-200" />
                {[0, 1, 2, 3].map((tick) => (
                  <div
                    key={tick}
                    className="absolute top-1/2 w-px h-2 -mt-1 bg-gray-200"
                    style={{ left: pct(tick) }}
                  />
                ))}
                {gap > 0 && (
                  <div
                    className="absolute top-1/2 h-0.5 -mt-px bg-gray-400 rounded-full"
                    style={{ left: pct(lo), width: `calc(${pct(hi)} - ${pct(lo)})` }}
                  />
                )}
                {/* You: hollow ring (drawn larger, so an exact match reads as a bullseye) */}
                <div
                  className="absolute top-1/2 w-4 h-4 -ml-2 -mt-2 rounded-full bg-white"
                  style={{ left: pct(you), boxShadow: `inset 0 0 0 2.5px ${YOU_COLOR}` }}
                />
                {/* Dish: filled dot with a 2px surface ring */}
                <div
                  className="absolute top-1/2 w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full transition-[left] duration-500"
                  style={{ left: pct(dish), background: DISH_COLOR, boxShadow: '0 0 0 2px #fff' }}
                />
              </div>

              <div className="text-right text-xs tabular-nums text-gray-700">
                {gap === 0 ? (
                  <span className="text-green-700 font-semibold">✓</span>
                ) : (
                  <span>
                    {gap}
                    {moved && <span className="sr-only"> (changed by tadka swap)</span>}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Axis labels, aligned with the plot column */}
      <div className="grid grid-cols-[6.5rem_1fr_2.5rem] gap-2 px-1 mt-1" aria-hidden="true">
        <span />
        <div className="relative h-4 mx-2">
          {TASTE_LEVEL_LABELS.map((label, idx) => (
            <span
              key={label}
              className={`absolute text-[10px] text-gray-500 whitespace-nowrap ${
                idx === 0 ? '' : idx === MAX_LEVEL ? '-translate-x-full' : '-translate-x-1/2'
              }`}
              style={{ left: pct(idx) }}
            >
              {label}
            </span>
          ))}
        </div>
        <span />
      </div>

      <figcaption className="mt-2 min-h-[1.25rem] text-xs text-gray-600">
        {hoveredAxis
          ? `${hoveredAxis.roman}: you like ${levelText(userTaste[hoveredAxis.key])}, this dish is ${levelText(
              dishTaste[hoveredAxis.key]
            )}`
          : 'Hover or focus a row to compare. Closer dots = better match.'}
      </figcaption>
    </figure>
  );
};

export default FlavorMatchChart;
