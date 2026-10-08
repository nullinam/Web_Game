
import React from 'react';
import { KEY_TO_FINGER } from '../constants';

interface HandOverlayProps {
  activeCode: string | null;
}

// Finger indices:
// 0: L Pinky, 1: L Ring, 2: L Middle, 3: L Index, 4: L Thumb
// 5: R Thumb, 6: R Index, 7: R Middle, 8: R Ring, 9: R Pinky

const HandOverlay: React.FC<HandOverlayProps> = ({ activeCode }) => {
  const activeFinger = activeCode ? KEY_TO_FINGER[activeCode] : null;

  const isFingerActive = (fingerIndex: number) => activeFinger === fingerIndex;

  // We use a single SVG for both hands to ensure they are spaced correctly relative to the full keyboard width
  return (
    <div className="w-full h-full relative opacity-60">
       <svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice" className="w-full h-full">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* LEFT HAND (Shifted to x=145 so index aligns with F) */}
          <g transform="translate(145, 100)">
            {/* Pinky (0) */}
            <path d="M20 120 L20 80 L50 80 L50 120"
                  className={`transition-all duration-100 ${isFingerActive(0) ? 'fill-yellow-400/80 stroke-yellow-200 -translate-y-4' : 'fill-cyan-500/20 stroke-cyan-400/50'}`}
                  strokeWidth="3" />
            {/* Ring (1) */}
            <path d="M60 120 L60 60 L90 60 L90 120"
                  className={`transition-all duration-100 ${isFingerActive(1) ? 'fill-yellow-400/80 stroke-yellow-200 -translate-y-4' : 'fill-cyan-500/20 stroke-cyan-400/50'}`}
                  strokeWidth="3" />
            {/* Middle (2) */}
            <path d="M100 120 L100 40 L130 40 L130 120"
                  className={`transition-all duration-100 ${isFingerActive(2) ? 'fill-yellow-400/80 stroke-yellow-200 -translate-y-4' : 'fill-cyan-500/20 stroke-cyan-400/50'}`}
                  strokeWidth="3" />
            {/* Index (3) */}
            <path d="M140 120 L140 60 L170 60 L170 120"
                  className={`transition-all duration-100 ${isFingerActive(3) ? 'fill-yellow-400/80 stroke-yellow-200 -translate-y-4' : 'fill-cyan-500/20 stroke-cyan-400/50'}`}
                  strokeWidth="3" />
            {/* Thumb (4) */}
            <path d="M180 140 L220 120 L240 140 L220 160"
                  className={`transition-all duration-100 ${isFingerActive(4) ? 'fill-yellow-400/80 stroke-yellow-200 -translate-y-2' : 'fill-cyan-500/20 stroke-cyan-400/50'}`}
                  strokeWidth="3" />

            {/* Palm */}
            <path d="M20 120 L170 120 L220 160 L180 220 L60 220 Z" className="fill-cyan-500/20 stroke-cyan-400/50" strokeWidth="3" />
          </g>


          {/* RIGHT HAND (Centered around J key - approx 65% width) */}
          <g transform="translate(420, 100)">
             {/* Thumb (5) */}
             <path d="M40 140 L20 120 L0 140 L20 160"
                  className={`transition-all duration-100 ${isFingerActive(5) ? 'fill-yellow-400/80 stroke-yellow-200 -translate-y-2' : 'fill-cyan-500/20 stroke-cyan-400/50'}`}
                  strokeWidth="3" />
             {/* Index (6) */}
            <path d="M50 120 L50 60 L80 60 L80 120"
                  className={`transition-all duration-100 ${isFingerActive(6) ? 'fill-yellow-400/80 stroke-yellow-200 -translate-y-4' : 'fill-cyan-500/20 stroke-cyan-400/50'}`}
                  strokeWidth="3" />
            {/* Middle (7) */}
            <path d="M90 120 L90 40 L120 40 L120 120"
                  className={`transition-all duration-100 ${isFingerActive(7) ? 'fill-yellow-400/80 stroke-yellow-200 -translate-y-4' : 'fill-cyan-500/20 stroke-cyan-400/50'}`}
                  strokeWidth="3" />
            {/* Ring (8) */}
            <path d="M130 120 L130 60 L160 60 L160 120"
                  className={`transition-all duration-100 ${isFingerActive(8) ? 'fill-yellow-400/80 stroke-yellow-200 -translate-y-4' : 'fill-cyan-500/20 stroke-cyan-400/50'}`}
                  strokeWidth="3" />
             {/* Pinky (9) */}
            <path d="M170 120 L170 80 L200 80 L200 120"
                  className={`transition-all duration-100 ${isFingerActive(9) ? 'fill-yellow-400/80 stroke-yellow-200 -translate-y-4' : 'fill-cyan-500/20 stroke-cyan-400/50'}`}
                  strokeWidth="3" />

             {/* Palm */}
             <path d="M50 120 L200 120 L160 220 L40 220 L0 160 Z" className="fill-cyan-500/20 stroke-cyan-400/50" strokeWidth="3" />
          </g>

       </svg>
    </div>
  );
};

export default HandOverlay;
