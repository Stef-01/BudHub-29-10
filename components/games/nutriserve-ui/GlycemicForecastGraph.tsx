// components/games/nutriserve-ui/GlycemicForecastGraph.tsx
import React, { useMemo } from 'react';
import { calculateGlycemicCurve } from '../../../services/nutriserveUtils';

interface GlycemicForecastGraphProps {
  carbs: number;
  fiber: number;
  fat: number;
}

const GlycemicForecastGraph: React.FC<GlycemicForecastGraphProps> = ({ carbs, fiber, fat }) => {
  const curveData = useMemo(() => calculateGlycemicCurve(carbs, fiber, fat), [carbs, fiber, fat]);

  // Graph dimensions
  const width = 320;
  const height = 160;
  const padding = 25;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  // Scales
  const maxTime = 180; // 3 hours (matches curve data)
  const maxRise = 100; // mg/dL rise cap for visualization

  const xScale = (t: number) => padding + (t / maxTime) * graphWidth;
  const yScale = (v: number) => height - padding - (v / maxRise) * graphHeight;

  // Generate path
  const pathD = curveData.reduce((d, point, i) => {
    const x = xScale(point.time);
    const y = yScale(point.rise);
    return i === 0 ? `M ${x} ${y}` : `${d} L ${x} ${y}`;
  }, '');

  // Create area path (close the loop at the bottom)
  const areaPathD = `${pathD} L ${xScale(curveData[curveData.length - 1].time)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`;

  // Determine color based on peak
  const peak = Math.max(...curveData.map(p => p.rise));
  let color = '#10b981'; // Emerald-500 (Good)
  let label = 'Stable';

  if (peak > 50) {
    color = '#f59e0b'; // Amber-500 (Moderate)
    label = 'Moderate Rise';
  }
  if (peak > 80) {
    color = '#ef4444'; // Red-500 (Spike)
    label = 'Spike Risk';
  }

  return (
    <div className="h-full w-full min-h-[140px]">
      <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-bold text-slate-700">Glycemic Forecast</h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: color }}>
            {label}
          </span>
        </div>

        <div className="flex-1 min-h-0">
          <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible">
            {/* Grid lines */}
            <line x1={padding} y1={yScale(0)} x2={width - padding} y2={yScale(0)} stroke="#e2e8f0" strokeWidth="1" />
            <line x1={padding} y1={yScale(50)} x2={width - padding} y2={yScale(50)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
            <line x1={padding} y1={yScale(100)} x2={width - padding} y2={yScale(100)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />

            {/* Area fill */}
            <path d={areaPathD} fill={color} fillOpacity="0.2" />

            {/* Line */}
            <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {/* Peak Indicator */}
            {peak > 0 && (
              <circle cx={xScale(curveData.find(p => p.rise === peak)?.time || 0)} cy={yScale(peak)} r="4" fill="white" stroke={color} strokeWidth="2" />
            )}

            {/* Axis Labels */}
            <text x={width / 2} y={height - 3} textAnchor="middle" fontSize="10" fill="#64748b">Time (minutes)</text>
            <text x={5} y={height / 2} textAnchor="middle" fontSize="10" fill="#64748b" transform={`rotate(-90, 10, ${height / 2})`}>Glucose Rise</text>

            {/* X-Axis Ticks */}
            <text x={xScale(0)} y={height - 15} textAnchor="middle" fontSize="9" fill="#94a3b8">0</text>
            <text x={xScale(60)} y={height - 15} textAnchor="middle" fontSize="9" fill="#94a3b8">60</text>
            <text x={xScale(120)} y={height - 15} textAnchor="middle" fontSize="9" fill="#94a3b8">120</text>

          </svg>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5 text-center">
          Estimated blood sugar response based on meal composition.
        </p>
      </div>
    </div>
  );
};

export default GlycemicForecastGraph;