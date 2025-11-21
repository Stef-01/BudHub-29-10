// components/games/nutriserve-ui/GlycemicForecastGraph.tsx
import React from 'react';
import type { Nutrients } from '../NutriServeTypes';
// FIX: Corrected import path
import { calculateGlycemicCurve } from '../../../services/nutriserveUtils';

interface GlycemicForecastGraphProps {
  totalNutrients: Nutrients;
}

/**
 * @description Renders a graph simulating the post-meal glycemic response.
 * The curve is calculated based on the meal's total carbs, fiber, and fat.
 * This provides a visual tool for players to learn how to "flatten the curve."
 */
const GlycemicForecastGraph: React.FC<GlycemicForecastGraphProps> = ({ totalNutrients }) => {
  const { carbs_g, fiber_g, fat_g } = totalNutrients;
  const curveData = calculateGlycemicCurve(carbs_g, fiber_g, fat_g);

  // SVG dimensions with proper padding to prevent text cutoff
  const width = 140;
  const height = 90;
  const padding = { top: 18, right: 12, bottom: 24, left: 34 }; // Increased left padding to fix "High" truncation

  // Calculate scales
  const maxTime = 180; // 3 hours
  const maxRise = Math.max(50, ...curveData.map(d => d.rise)); // Ensure a minimum height for the y-axis

  const xScale = (time: number) => padding.left + (time / maxTime) * (width - padding.left - padding.right);
  const yScale = (rise: number) => height - padding.bottom - (rise / maxRise) * (height - padding.top - padding.bottom);

  // Create the SVG path string for the curve
  const pathData = curveData
    .map((p, i) => {
      const x = xScale(p.time);
      const y = yScale(p.rise);
      return i === 0 ? `M ${x},${y}` : `L ${x},${y}`;
    })
    .join(' ');

  // Determine curve color based on peak height for quick visual feedback
  const peakValue = Math.max(...curveData.map(d => d.rise));
  let curveColor = 'stroke-emerald-500'; // Good, low peak
  let bgColor = 'bg-emerald-50/30'; // Matching background tint
  if (peakValue > 75) {
    curveColor = 'stroke-amber-500'; // Moderate peak
    bgColor = 'bg-amber-50/30';
  }
  if (peakValue > 100) {
    curveColor = 'stroke-rose-500'; // High peak
    bgColor = 'bg-rose-50/30';
  }

  return (
    <div className="h-full flex flex-col items-center justify-center">
      {/* Graph Container with Card Styling */}
      <div className={`w-full rounded-lg border border-slate-200 p-3 ${bgColor} shadow-sm`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
          {/* Grid lines - more visible */}
          <g className="text-slate-200" stroke="currentColor" strokeWidth="0.5" opacity="0.6">
            {[0.25, 0.5, 0.75, 1].map(f => (
              <line key={f} x1={padding.left} y1={yScale(maxRise * f)} x2={width - padding.right} y2={yScale(maxRise * f)} />
            ))}
            {[60, 120, 180].map(t => (
              <line key={t} x1={xScale(t)} y1={padding.top} x2={xScale(t)} y2={height - padding.bottom} />
            ))}
          </g>

          {/* Axes - more prominent */}
          <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="currentColor" className="text-slate-400" strokeWidth="1.5" />
          <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="currentColor" className="text-slate-400" strokeWidth="1.5" />

          {/* The glycemic curve - thicker and more visible */}
          <path d={pathData} fill="none" className={curveColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Axis Labels - larger and more readable */}
          <g className="text-[9px] fill-current text-slate-600 font-semibold">
            <text x={xScale(60)} y={height - padding.bottom + 14} textAnchor="middle">60m</text>
            <text x={xScale(120)} y={height - padding.bottom + 14} textAnchor="middle">120m</text>
            <text x={xScale(180)} y={height - padding.bottom + 14} textAnchor="middle">180m</text>
            <text x={padding.left - 6} y={yScale(0) + 2} textAnchor="end" alignmentBaseline="middle">Low</text>
            <text x={padding.left - 6} y={yScale(maxRise) + 2} textAnchor="end" alignmentBaseline="middle">High</text>
          </g>
        </svg>
      </div>

      {/* Info Box - more compact and integrated */}
      <div className="bg-slate-100/80 rounded-md px-3 py-2 mt-2 w-full border border-slate-200">
        <p className="text-center text-[10px] text-slate-600 leading-snug font-medium">
          💡 Lower, flatter curves help prevent complications and maintain stable energy
        </p>
      </div>
    </div>
  );
};

export default GlycemicForecastGraph;