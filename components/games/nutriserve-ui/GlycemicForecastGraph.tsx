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

  // SVG dimensions and padding (30% smaller from original for glucose curve)
  const width = 210;
  const height = 126;
  const padding = { top: 14, right: 14, bottom: 21, left: 21 };

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
  if (peakValue > 75) curveColor = 'stroke-amber-500'; // Moderate peak
  if (peakValue > 100) curveColor = 'stroke-rose-500'; // High peak

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid lines */}
        <g className="text-slate-200" strokeWidth="1">
          {[0.25, 0.5, 0.75, 1].map(f => (
            <line key={f} x1={padding.left} y1={yScale(maxRise * f)} x2={width - padding.right} y2={yScale(maxRise * f)} />
          ))}
          {[60, 120, 180].map(t => (
            <line key={t} x1={xScale(t)} y1={padding.top} x2={xScale(t)} y2={height - padding.bottom} />
          ))}
        </g>
        
        {/* Axes */}
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="currentColor" className="text-slate-300" />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="currentColor" className="text-slate-300" />

        {/* The glycemic curve */}
        <path d={pathData} fill="none" className={curveColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Axis Labels */}
        <g className="text-xs fill-current text-slate-500">
          <text x={xScale(60)} y={height - padding.bottom + 15} textAnchor="middle">60m</text>
          <text x={xScale(120)} y={height - padding.bottom + 15} textAnchor="middle">120m</text>
          <text x={xScale(180)} y={height - padding.bottom + 15} textAnchor="middle">180m</text>
          <text x={padding.left - 8} y={yScale(0)} textAnchor="end" alignmentBaseline="middle">Low</text>
          <text x={padding.left - 8} y={yScale(maxRise)} textAnchor="end" alignmentBaseline="middle">High</text>
        </g>
      </svg>
      <p className="text-center text-sm text-slate-500 mt-2 px-4">
        A lower, flatter curve is generally better for stable energy levels.
      </p>
    </div>
  );
};

export default GlycemicForecastGraph;