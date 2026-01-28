'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { X, Gamepad2 } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

export function ControlsHint() {
  const [isVisible, setIsVisible] = useState(true);
  const { currentTheme, isMobile } = useGameStore();
  const colors = currentTheme.colors;

  // Hide on mobile (we show D-pad instead)
  if (isMobile) return null;

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-40 w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
        style={{
          background: colors.navbarBg,
          color: colors.navbarText,
          border: `2px solid ${colors.navbarBorder}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        <Gamepad2 className="w-5 h-5" />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-4 z-40"
    >
      <div
        className="rounded-xl overflow-hidden min-w-[180px]"
        style={{
          background: colors.panelBg,
          border: `2px solid ${colors.navbarBorder}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{
            background: colors.navbarBg,
            borderBottom: `1px solid ${colors.panelBorder}`,
          }}
        >
          <h3
            className="text-xs font-bold flex items-center gap-1.5"
            style={{ color: colors.navbarText }}
          >
            <Gamepad2 className="w-3.5 h-3.5" style={{ color: colors.accent }} />
            Controls
          </h3>
          <button
            onClick={() => setIsVisible(false)}
            className="w-5 h-5 flex items-center justify-center rounded transition-colors"
            style={{
              color: colors.panelTextMuted,
              background: 'rgba(0,0,0,0.2)',
            }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Controls list */}
        <div className="p-2.5 space-y-1.5">
          <ControlRow keys={['W', 'A', 'S', 'D']} action="Move" colors={colors} />
          <ControlRow keys={['E']} action="Interact" colors={colors} />
          <ControlRow keys={['C']} action="Customize" colors={colors} />
          <ControlRow keys={['ESC']} action="Close" colors={colors} />
        </div>
      </div>
    </motion.div>
  );
}

function ControlRow({
  keys,
  action,
  colors,
}: {
  keys: string[];
  action: string;
  colors: any;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-0.5">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold min-w-[18px] text-center"
            style={{
              background: colors.buttonSecondary,
              color: colors.panelText,
              border: `1px solid ${colors.panelBorder}`,
            }}
          >
            {key}
          </kbd>
        ))}
      </div>
      <span className="text-[10px]" style={{ color: colors.panelTextMuted }}>{action}</span>
    </div>
  );
}
