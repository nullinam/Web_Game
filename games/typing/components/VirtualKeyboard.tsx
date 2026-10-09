
import React from 'react';
import { KeyMapping } from '../types';
import { KEYBOARD_ROWS, QWERTY_LABELS } from '../constants';
import HandOverlay from './HandOverlay';

interface VirtualKeyboardProps {
  mappings: KeyMapping[];
  activeKeyCode: string | null;
  lastPressedCode: string | null;
  needsShift: boolean;
  showHands: boolean; // Prop to toggle hand guides
  showNumberRow: boolean; // Force the number row on small screens when the session needs it
  spaceLabel: string;
  onKeyTap: (code: string) => void;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ mappings, activeKeyCode, lastPressedCode, needsShift, showHands, showNumberRow, spaceLabel, onKeyTap }) => {
  const getMapping = (code: string) => mappings.find(m => m.code === code);

  const handleTap = (e: React.PointerEvent, code: string) => {
    // Keep focus on the hidden game input and stop the tap from scrolling or zooming
    e.preventDefault();
    e.stopPropagation();
    onKeyTap(code);
  };

  return (
    <div className="w-full px-1 sm:px-2 relative">

      {/* Hand Overlay: drawn over the keys; hidden where it would cover them on small screens */}
      {showHands && (
        <div className="hand-overlay absolute inset-0 z-50 pointer-events-none overflow-hidden hidden md:block">
           <HandOverlay activeCode={activeKeyCode} />
        </div>
      )}

      <div className="flex flex-col gap-1 md:gap-2 relative z-10 py-1 md:py-2">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`w-full justify-center gap-0.5 sm:gap-1 md:gap-2 ${rowIndex === 0 && !showNumberRow ? 'hidden md:flex short:hidden' : 'flex'}`}
          >
            {row.map((code) => {
              const isShiftKey = code.startsWith('Shift');
              const mapping = getMapping(code);

              const isShiftActive = isShiftKey && needsShift;
              const isActive = activeKeyCode === code;
              const isPressed = lastPressedCode === code || (isShiftKey && lastPressedCode?.startsWith('Shift'));

              let bgClass = "bg-slate-950/60 border-slate-800 shadow-sm";
              let textClass = mapping || isShiftKey ? "text-orange-400/80" : "text-slate-600";

              if (isShiftActive) {
                bgClass = "key-shift-highlight z-20";
                textClass = "text-white";
              } else if (isActive) {
                bgClass = "key-highlight z-20";
                textClass = "text-white";
              } else if (isPressed) {
                bgClass = "bg-orange-600 border-orange-400 transform translate-y-[2px]";
                textClass = "text-white";
              }

              const widthClass = isShiftKey
                ? "flex-[1.6] max-w-[8rem] lg:max-w-[10rem] 2xl:max-w-[12rem]"
                : "flex-1 max-w-[4.75rem] lg:max-w-[6rem] 2xl:max-w-[7rem]";

              const baseClasses = `
                kb-key relative flex flex-col items-center justify-center min-w-0
                ${widthClass}
                border border-b-2 rounded-md md:rounded-lg
                transition-all duration-75 select-none touch-manipulation
                ${bgClass}
                ${isShiftKey ? 'cursor-default' : 'cursor-pointer active:scale-95'}
              `;

              if (isShiftKey) {
                return (
                  <div key={code} className={baseClasses} aria-hidden="true">
                    <span className={`text-[8px] sm:text-[10px] md:text-sm lg:text-base font-bold ${textClass}`}>SHIFT</span>
                  </div>
                );
              }

              return (
                <button
                  key={code}
                  type="button"
                  tabIndex={-1}
                  aria-label={[mapping?.char, mapping?.shiftChar].filter(Boolean).join(' ') || QWERTY_LABELS[code]}
                  className={baseClasses}
                  onPointerDown={(e) => handleTap(e, code)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {/* QWERTY/Layout Label (Small) */}
                  <span className={`absolute top-0.5 left-1 md:top-1 md:left-1.5 text-[7px] sm:text-[8px] md:text-[10px] lg:text-xs uppercase opacity-40 ${textClass}`}>
                    {mapping?.label || QWERTY_LABELS[code]}
                  </span>

                  {/* Target Char (Large) */}
                  <span className={`text-sm sm:text-lg md:text-2xl lg:text-3xl font-bold leading-none ${textClass}`}>
                    {mapping?.char || ''}
                  </span>

                  {/* Shift Char (Tiny) */}
                  {mapping?.shiftChar && (
                    <span className={`absolute bottom-0.5 right-1 md:bottom-1 md:right-1.5 text-[7px] sm:text-[8px] md:text-[10px] lg:text-xs opacity-60 ${textClass}`}>
                      {mapping.shiftChar}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
        {/* Space Bar */}
        <div className="flex justify-center mt-0.5 md:mt-1">
           <button
              type="button"
              tabIndex={-1}
              className={`
                kb-space w-1/2 max-w-md lg:max-w-xl 2xl:max-w-2xl border border-b-2 rounded-lg bg-slate-950/60 border-slate-800
                flex items-center justify-center text-slate-500 text-[10px] md:text-xs lg:text-sm tracking-[0.2em] font-bold transition-all duration-75
                cursor-pointer active:scale-95 touch-manipulation select-none
                ${lastPressedCode === 'Space' ? 'bg-orange-700 border-orange-500 text-white transform translate-y-[2px]' : ''}
                ${activeKeyCode === 'Space' ? 'key-highlight text-white' : ''}
              `}
              onPointerDown={(e) => handleTap(e, 'Space')}
              onMouseDown={(e) => e.preventDefault()}
           >
             {spaceLabel}
           </button>
        </div>
      </div>
    </div>
  );
};

export default VirtualKeyboard;
