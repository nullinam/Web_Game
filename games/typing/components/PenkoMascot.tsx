import React, { useState, useEffect } from 'react';
import { PENKO_ANIMATIONS } from '../penko_anim';

interface PenkoMascotProps {
  pose?: 'idle' | 'talk' | 'hurt' | 'jump' | 'walk' | 'walk_right' | 'jump_right';
  size?: number;
  className?: string;
}

// Color palette matching the standard Penko sprite guidelines:
// 0=transparent, 1=black, 2=white, 3=blue-gray, 4=orange,
// 5=red, 6=yellow/gold, 7=blue, 8=green, 9=purple, 10=pink, 11=brown, 12=orange, 13=gray
const COLORS = {
  0: 'transparent',
  1: '#1e293b',  // Slate-800 (Outline)
  2: '#ffffff',  // White (Belly / Eyes)
  3: '#38bdf8',  // Sky-400 (Body - Glowing Theme)
  4: '#fb923c',  // Orange-400 (Beak / Feet)
  5: '#f43f5e',  // Rose-500
  6: '#fbbf24',  // Amber-400
  7: '#60a5fa',  // Blue-400
  8: '#34d399',  // Emerald-400
  9: '#c084fc',  // Purple-400
  10: '#f472b6', // Pink-400
  11: '#a16207', // Brown
  12: '#fb923c', // Cyan-400
  13: '#94a3b8', // Gray
};

export const PenkoMascot: React.FC<PenkoMascotProps> = React.memo(({ pose = 'idle', size = 64, className = '' }) => {
  const [frameIndex, setFrameIndex] = useState(0);

  const activePose = pose in PENKO_ANIMATIONS ? pose : 'idle';
  const frames = PENKO_ANIMATIONS[activePose];

  // Cycle animation frames
  useEffect(() => {
    setFrameIndex(0);
    if (!frames || frames.length <= 1) return;

    const fps = activePose === 'talk' ? 250 : activePose === 'hurt' ? 200 : 350;
    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % frames.length);
    }, fps);

    return () => clearInterval(interval);
  }, [frames, activePose]);

  const matrix = frames[frameIndex] || frames[0];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={`select-none pointer-events-none ${className}`}
    >
      {matrix.map((row: number[], y: number) =>
        row.map((cell: number, x: number) =>
          cell === 0 ? null : (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={COLORS[cell as keyof typeof COLORS]} />
          )
        )
      )}
    </svg>
  );
});

export default PenkoMascot;
