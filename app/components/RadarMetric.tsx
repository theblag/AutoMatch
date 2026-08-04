'use client';

import React from 'react';

interface RadarMetricProps {
  metrics: {
    performance: number;
    efficiency: number;
    utility: number;
    value: number;
    comfort: number;
  };
  userMetrics?: {
    performance: number;
    efficiency: number;
    utility: number;
    value: number;
    comfort: number;
  };
  size?: number;
}

export default function RadarMetric({ metrics, userMetrics, size = 180 }: RadarMetricProps) {
  const center = size / 2;
  const maxRadius = (size / 2) * 0.72;

  const axes = [
    { label: 'PERFORMANCE', key: 'performance', angle: -Math.PI / 2 },
    { label: 'EFFICIENCY', key: 'efficiency', angle: -Math.PI / 2 + (2 * Math.PI) / 5 },
    { label: 'UTILITY', key: 'utility', angle: -Math.PI / 2 + (4 * Math.PI) / 5 },
    { label: 'VALUE', key: 'value', angle: -Math.PI / 2 + (6 * Math.PI) / 5 },
    { label: 'COMFORT', key: 'comfort', angle: -Math.PI / 2 + (8 * Math.PI) / 5 },
  ] as const;

  const getCoordinates = (vals: typeof metrics) => {
    return axes.map(axis => {
      const val = vals[axis.key];
      const radius = (val / 10) * maxRadius;
      const x = center + radius * Math.cos(axis.angle);
      const y = center + radius * Math.sin(axis.angle);
      return { x, y };
    });
  };

  const carPoints = getCoordinates(metrics);
  const userPoints = userMetrics ? getCoordinates(userMetrics) : [];

  const carPath = carPoints.map(p => `${p.x},${p.y}`).join(' ');
  const userPath = userPoints.map(p => `${p.x},${p.y}`).join(' ');

  const gridRings = [0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-ivory-border/60">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid Rings */}
        {gridRings.map((scale, i) => (
          <polygon
            key={i}
            points={axes
              .map(axis => {
                const radius = scale * maxRadius;
                const x = center + radius * Math.cos(axis.angle);
                const y = center + radius * Math.sin(axis.angle);
                return `${x},${y}`;
              })
              .join(' ')}
            className="fill-none stroke-[#e8e2dc] stroke-[0.75]"
          />
        ))}

        {/* Axis Lines */}
        {axes.map((axis, i) => {
          const x = center + maxRadius * Math.cos(axis.angle);
          const y = center + maxRadius * Math.sin(axis.angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              className="stroke-[#e8e2dc] stroke-[0.75]"
            />
          );
        })}

        {/* Axis Labels (Elegant Serif) */}
        {axes.map((axis, i) => {
          const labelDist = maxRadius + 14;
          const x = center + labelDist * Math.cos(axis.angle);
          const y = center + labelDist * Math.sin(axis.angle);
          const textAnchor = Math.abs(x - center) < 10 ? 'middle' : x < center ? 'end' : 'start';
          const dy = y < center - 5 ? '-2px' : y > center + 5 ? '8px' : '3px';

          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor={textAnchor}
              dy={dy}
              className="fill-ivory-text-muted text-cursive text-[8px] tracking-wider uppercase font-semibold"
            >
              {axis.label}
            </text>
          );
        })}

        {/* User baseline Preference (Delicate dotted taupe line) */}
        {userMetrics && (
          <polygon
            points={userPath}
            className="fill-none stroke-dashed stroke-ivory-text-muted/40 stroke-[1.2]"
          />
        )}

        {/* Car Metrics (Warm Gold filled polygon) */}
        <polygon
          points={carPath}
          className="fill-brand/8 stroke-brand stroke-[1.5] animate-draw"
          style={{ transformOrigin: 'center' }}
        />

        {/* Fine anchor dots */}
        {carPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2.5"
            className="fill-white stroke-brand stroke-[1.2]"
          />
        ))}
      </svg>
    </div>
  );
}
