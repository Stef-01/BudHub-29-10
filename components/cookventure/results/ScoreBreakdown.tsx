// components/cookventure/results/ScoreBreakdown.tsx
// One meter per scoring component: points earned out of the points available.
import React from 'react';
import type { ScoreComponent } from '../../../types/cookventure';
import { REASON_STYLE } from './MatchExplanationChip';

interface ScoreBreakdownProps {
  breakdown: ScoreComponent[];
  /** Points per component before a tadka swap, to show what changed */
  previous?: ScoreComponent[];
}

const formatPoints = (points: number) => (Number.isInteger(points) ? `${points}` : points.toFixed(1));

const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ breakdown, previous }) => {
  return (
    <ul className="space-y-3">
      {breakdown.map((component) => {
        const share = component.maxPoints > 0 ? component.points / component.maxPoints : 0;
        const before = previous?.find((p) => p.kind === component.kind);
        const delta = before ? component.points - before.points : 0;
        const style = REASON_STYLE[component.kind];

        return (
          <li key={component.kind}>
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <span className="text-xs font-semibold text-gray-800">
                <span aria-hidden="true">{style.icon}</span> {component.label}
              </span>
              <span className="text-xs tabular-nums text-gray-700 whitespace-nowrap">
                {Math.abs(delta) >= 0.05 && (
                  <span className="mr-1.5 font-semibold text-gray-900">
                    {delta > 0 ? '▲' : '▼'} {formatPoints(Math.abs(delta))}
                  </span>
                )}
                {formatPoints(Math.round(component.points * 10) / 10)}
                <span className="text-gray-400"> / {component.maxPoints}</span>
              </span>
            </div>
            {/* Meter: the track is a lighter step of the fill's own hue */}
            <div
              className="h-2 rounded-full bg-emerald-100 overflow-hidden"
              role="meter"
              aria-label={component.label}
              aria-valuemin={0}
              aria-valuemax={component.maxPoints}
              aria-valuenow={Math.round(component.points * 10) / 10}
              aria-valuetext={`${formatPoints(Math.round(component.points * 10) / 10)} of ${component.maxPoints} points. ${component.detail ?? ''}`}
            >
              <div
                className="h-full rounded-full bg-emerald-600 transition-[width] duration-500"
                style={{ width: `${Math.max(0, Math.min(1, share)) * 100}%` }}
              />
            </div>
            {component.detail && <p className="mt-1 text-[11px] text-gray-500">{component.detail}</p>}
          </li>
        );
      })}
    </ul>
  );
};

export default ScoreBreakdown;
