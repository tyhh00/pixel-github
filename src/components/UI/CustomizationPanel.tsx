'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { buildingConfigs, getAvailableBuildings } from '@/config/buildingTypes';
import type { BuildingType } from '@/types/game';
import { X, Lock, TreeDeciduous, Sparkles, Cpu, Star } from 'lucide-react';

interface CustomizationPanelProps {
  userStars?: number;
}

export function CustomizationPanel({
  userStars = 0,
}: CustomizationPanelProps) {
  const { isCustomizing, setIsCustomizing, activeBuilding, updateSlotBuildingType, currentTheme } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const colors = currentTheme.colors;

  const availableBuildings = getAvailableBuildings(userStars);
  const allBuildings = Object.values(buildingConfigs);

  const categories = [
    { id: 'all', label: 'All', icon: <Star className="w-3.5 h-3.5" /> },
    { id: 'nature', label: 'Nature', icon: <TreeDeciduous className="w-3.5 h-3.5" /> },
    { id: 'fantasy', label: 'Fantasy', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'tech', label: 'Tech', icon: <Cpu className="w-3.5 h-3.5" /> },
  ];

  const filteredBuildings =
    selectedCategory === 'all'
      ? allBuildings
      : allBuildings.filter((b) => b.category === selectedCategory);

  return (
    <AnimatePresence>
      {isCustomizing && (
        <motion.div
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed right-0 top-0 bottom-0 w-72 z-50"
        >
          {/* Panel background - wood theme */}
          <div
            className="absolute inset-0"
            style={{
              background: colors.panelBg,
              borderLeft: `3px solid ${colors.navbarBorder}`,
              boxShadow: `-8px 0 32px rgba(0,0,0,0.4)`,
            }}
          />

          {/* Content */}
          <div className="relative h-full flex flex-col">
            {/* Header - matches navbar */}
            <div
              className="px-4 py-3"
              style={{
                background: colors.navbarBg,
                borderBottom: `2px solid ${colors.panelBorder}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2
                    className="text-base font-bold"
                    style={{ color: colors.panelText }}
                  >
                    Customize
                  </h2>
                  <p
                    className="text-xs"
                    style={{ color: colors.panelTextMuted }}
                  >
                    {activeBuilding
                      ? `Editing: ${activeBuilding.label}`
                      : 'Select a slot first'}
                  </p>
                </div>
                <button
                  onClick={() => setIsCustomizing(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                  style={{
                    background: colors.buttonSecondary,
                    color: colors.panelTextMuted,
                    border: `1px solid ${colors.panelBorder}`,
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User stars */}
              <div
                className="mt-2 flex items-center gap-2 px-2 py-1 rounded-md"
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  color: colors.accent,
                }}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-bold">{userStars} stars</span>
                <span className="text-xs" style={{ color: colors.panelTextMuted }}>
                  · {availableBuildings.length}/{allBuildings.length} unlocked
                </span>
              </div>
            </div>

            {/* Category tabs */}
            <div
              className="px-3 py-2"
              style={{ borderBottom: `1px solid ${colors.panelBorder}` }}
            >
              <div className="flex gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all"
                    style={{
                      background: selectedCategory === cat.id
                        ? `linear-gradient(to bottom, ${colors.buttonPrimaryHover}, ${colors.buttonPrimary})`
                        : colors.buttonSecondary,
                      color: selectedCategory === cat.id
                        ? colors.accent
                        : colors.panelTextMuted,
                      border: `1px solid ${selectedCategory === cat.id ? colors.accent : colors.panelBorder}`,
                    }}
                  >
                    {cat.icon}
                    <span className="hidden sm:inline">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Building grid */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-2 gap-2">
                {filteredBuildings.map((building) => {
                  const isUnlocked = building.requiredStars <= userStars;
                  const isSelected =
                    activeBuilding?.buildingType === building.id;

                  return (
                    <motion.button
                      key={building.id}
                      whileHover={isUnlocked ? { scale: 1.02, y: -2 } : undefined}
                      whileTap={isUnlocked ? { scale: 0.98 } : undefined}
                      onClick={() => {
                        if (isUnlocked && activeBuilding) {
                          updateSlotBuildingType(activeBuilding.id, building.id);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="relative p-2 rounded-lg transition-all"
                      style={{
                        background: isSelected
                          ? `linear-gradient(to bottom, ${colors.buttonPrimaryHover}, ${colors.buttonPrimary})`
                          : colors.buttonSecondary,
                        border: `2px solid ${isSelected ? colors.accent : colors.panelBorder}`,
                        opacity: isUnlocked ? 1 : 0.5,
                        boxShadow: isSelected
                          ? `0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`
                          : `0 2px 4px rgba(0,0,0,0.2)`,
                      }}
                    >
                      {/* Building preview */}
                      <div
                        className="w-full aspect-square rounded-md flex items-center justify-center mb-1.5"
                        style={{ background: 'rgba(0,0,0,0.25)' }}
                      >
                        <BuildingPreview
                          type={building.id}
                          colors={building.colors}
                        />
                      </div>

                      {/* Building info */}
                      <div className="text-left">
                        <h3
                          className="text-xs font-medium truncate"
                          style={{ color: isSelected ? colors.accent : colors.panelText }}
                        >
                          {building.name}
                        </h3>
                      </div>

                      {/* Lock overlay */}
                      {!isUnlocked && (
                        <div
                          className="absolute inset-0 flex items-center justify-center rounded-lg"
                          style={{ background: 'rgba(0,0,0,0.6)' }}
                        >
                          <div className="text-center">
                            <Lock
                              className="w-5 h-5 mx-auto mb-0.5"
                              style={{ color: colors.panelTextMuted }}
                            />
                            <span
                              className="text-[10px] font-bold"
                              style={{ color: colors.accent }}
                            >
                              {building.requiredStars}★
                            </span>
                          </div>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Footer hint */}
            <div
              className="px-3 py-2"
              style={{
                background: 'rgba(0,0,0,0.2)',
                borderTop: `1px solid ${colors.panelBorder}`,
              }}
            >
              <p
                className="text-[10px] text-center"
                style={{ color: colors.panelTextMuted }}
              >
                Walk to a slot and press{' '}
                <kbd
                  className="px-1 py-0.5 rounded font-mono"
                  style={{
                    background: colors.buttonSecondary,
                    color: colors.panelText,
                    border: `1px solid ${colors.panelBorder}`,
                  }}
                >
                  C
                </kbd>
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Simple SVG preview for buildings
function BuildingPreview({
  type,
  colors,
}: {
  type: BuildingType;
  colors: { primary: number; secondary: number; accent: number };
}) {
  const toHex = (n: number) => '#' + n.toString(16).padStart(6, '0');

  switch (type) {
    case 'treehouse':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10">
          <rect x="28" y="32" width="8" height="24" fill={toHex(colors.primary)} />
          <circle cx="32" cy="24" r="16" fill={toHex(colors.secondary)} />
          <rect x="24" y="20" width="16" height="12" fill={toHex(colors.accent)} />
          <polygon points="20,20 32,8 44,20" fill={toHex(colors.primary)} />
        </svg>
      );
    case 'mushroom-house':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10">
          <rect x="26" y="36" width="12" height="20" fill={toHex(colors.secondary)} />
          <ellipse cx="32" cy="28" rx="24" ry="18" fill={toHex(colors.primary)} />
          <circle cx="24" cy="22" r="5" fill={toHex(colors.accent)} />
          <circle cx="40" cy="26" r="4" fill={toHex(colors.accent)} />
          <circle cx="32" cy="18" r="3" fill={toHex(colors.accent)} />
        </svg>
      );
    case 'cottage':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10">
          <rect x="16" y="32" width="32" height="24" fill={toHex(colors.primary)} />
          <polygon points="12,32 32,12 52,32" fill={toHex(colors.secondary)} />
          <rect x="28" y="42" width="8" height="14" fill={toHex(colors.secondary)} />
          <rect x="18" y="36" width="8" height="8" fill={toHex(colors.accent)} />
          <rect x="38" y="36" width="8" height="8" fill={toHex(colors.accent)} />
        </svg>
      );
    case 'tower':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10">
          <rect x="24" y="20" width="16" height="36" fill={toHex(colors.primary)} />
          <polygon points="20,20 32,4 44,20" fill={toHex(colors.secondary)} />
          <circle cx="32" cy="12" r="4" fill={toHex(colors.accent)} />
          <rect x="28" y="30" width="8" height="8" fill={toHex(colors.accent)} />
          <rect x="28" y="42" width="8" height="8" fill={toHex(colors.accent)} />
        </svg>
      );
    case 'windmill':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10">
          <rect x="26" y="24" width="12" height="32" fill={toHex(colors.primary)} />
          <polygon points="22,24 32,12 42,24" fill={toHex(colors.accent)} />
          <line x1="32" y1="28" x2="32" y2="4" stroke={toHex(colors.secondary)} strokeWidth="3" />
          <line x1="32" y1="28" x2="56" y2="36" stroke={toHex(colors.secondary)} strokeWidth="3" />
          <line x1="32" y1="28" x2="8" y2="36" stroke={toHex(colors.secondary)} strokeWidth="3" />
          <line x1="32" y1="28" x2="32" y2="52" stroke={toHex(colors.secondary)} strokeWidth="3" />
        </svg>
      );
    case 'portal':
      return (
        <svg viewBox="0 0 64 64" className="w-10 h-10">
          <rect x="26" y="20" width="12" height="36" fill={toHex(colors.primary)} />
          <circle cx="32" cy="16" r="20" fill={toHex(colors.primary)} opacity="0.3" />
          <ellipse cx="32" cy="40" rx="10" ry="14" fill={toHex(colors.secondary)} />
          <ellipse cx="32" cy="40" rx="6" ry="10" fill={toHex(colors.accent)} />
        </svg>
      );
    default:
      return null;
  }
}
