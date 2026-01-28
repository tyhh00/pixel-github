'use client';

import { useCallback, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export function MobileControls() {
  const { isMobile, setMobileInput, currentTheme } = useGameStore();
  const colors = currentTheme.colors;

  const handleDirectionStart = useCallback(
    (x: number, y: number) => {
      setMobileInput(x, y);
    },
    [setMobileInput]
  );

  const handleDirectionEnd = useCallback(() => {
    setMobileInput(0, 0);
  }, [setMobileInput]);

  // Prevent default touch behavior
  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest('.mobile-controls')) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefault);
  }, []);

  if (!isMobile) return null;

  return (
    <div className="mobile-controls fixed bottom-24 left-4 z-50 select-none touch-none">
      {/* D-Pad container */}
      <div
        className="relative w-32 h-32"
        style={{
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
        }}
      >
        {/* Up button */}
        <DPadButton
          direction="up"
          onStart={() => handleDirectionStart(0, -1)}
          onEnd={handleDirectionEnd}
          colors={colors}
          className="absolute top-0 left-1/2 -translate-x-1/2"
        >
          <ChevronUp className="w-6 h-6" />
        </DPadButton>

        {/* Down button */}
        <DPadButton
          direction="down"
          onStart={() => handleDirectionStart(0, 1)}
          onEnd={handleDirectionEnd}
          colors={colors}
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="w-6 h-6" />
        </DPadButton>

        {/* Left button */}
        <DPadButton
          direction="left"
          onStart={() => handleDirectionStart(-1, 0)}
          onEnd={handleDirectionEnd}
          colors={colors}
          className="absolute left-0 top-1/2 -translate-y-1/2"
        >
          <ChevronLeft className="w-6 h-6" />
        </DPadButton>

        {/* Right button */}
        <DPadButton
          direction="right"
          onStart={() => handleDirectionStart(1, 0)}
          onEnd={handleDirectionEnd}
          colors={colors}
          className="absolute right-0 top-1/2 -translate-y-1/2"
        >
          <ChevronRight className="w-6 h-6" />
        </DPadButton>

        {/* Center decoration */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full"
          style={{
            background: colors.navbarBg,
            border: `2px solid ${colors.navbarBorder}`,
          }}
        />
      </div>

      {/* Interaction button */}
      <button
        onTouchStart={() => {
          // Trigger interaction by dispatching E key event
          const event = new KeyboardEvent('keydown', { key: 'E', code: 'KeyE' });
          window.dispatchEvent(event);
        }}
        className="absolute -right-16 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold"
        style={{
          background: `linear-gradient(to bottom, ${colors.buttonPrimaryHover}, ${colors.buttonPrimary})`,
          border: `3px solid ${colors.accent}`,
          color: colors.accent,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}
      >
        E
      </button>
    </div>
  );
}

interface DPadButtonProps {
  direction: 'up' | 'down' | 'left' | 'right';
  onStart: () => void;
  onEnd: () => void;
  colors: any;
  className?: string;
  children: React.ReactNode;
}

function DPadButton({
  direction,
  onStart,
  onEnd,
  colors,
  className,
  children,
}: DPadButtonProps) {
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      onStart();
    },
    [onStart]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      onEnd();
    },
    [onEnd]
  );

  return (
    <button
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={onStart}
      onMouseUp={onEnd}
      onMouseLeave={onEnd}
      className={`w-10 h-10 rounded-lg flex items-center justify-center active:scale-95 transition-transform ${className}`}
      style={{
        background: colors.navbarBg,
        border: `2px solid ${colors.navbarBorder}`,
        color: colors.navbarText,
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      }}
    >
      {children}
    </button>
  );
}
