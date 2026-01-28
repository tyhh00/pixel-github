'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Star, GitFork, ExternalLink, Sparkles, BookOpen, Code, Circle } from 'lucide-react';
import { formatStarCount } from '@/services/github';

// Language color mapping
const languageColors: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Vue: '#41b883',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
};

export function ActionBar() {
  const { activeBuilding, isActionBarOpen, currentTheme, profileData, openJournal } = useGameStore();
  const colors = currentTheme.colors;

  // Get the full repo name (owner/repo) for the active building
  const getRepoFullName = () => {
    if (!activeBuilding?.repoUrl) return null;
    // Extract owner/repo from URL like https://github.com/owner/repo
    const match = activeBuilding.repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
    return match ? match[1] : null;
  };

  return (
    <AnimatePresence>
      {isActionBarOpen && activeBuilding && (
        <motion.div
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 200, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
        >
          {/* Backdrop gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to top, rgba(62, 39, 35, 0.95), rgba(62, 39, 35, 0.6), transparent)`,
            }}
          />

          {/* Action bar content */}
          <div className="relative max-w-2xl mx-auto px-4 pb-6 pointer-events-auto">
            {/* Close hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-3"
            >
              <span
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{
                  backgroundColor: 'rgba(62, 39, 35, 0.9)',
                  color: colors.panelTextMuted,
                  border: `1px solid ${colors.panelBorder}`,
                }}
              >
                Walk away to close
              </span>
            </motion.div>

            {/* Main card - wood frame style */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="rounded-xl overflow-hidden"
              style={{
                background: colors.panelBg,
                border: `3px solid ${colors.navbarBorder}`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)`,
              }}
            >
              {/* Header */}
              <div
                className="relative px-5 py-4"
                style={{
                  background: colors.navbarBg,
                  borderBottom: `2px solid ${colors.panelBorder}`,
                }}
              >
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${colors.buttonPrimary}, ${colors.buttonPrimaryHover})`,
                        border: `2px solid ${colors.accent}`,
                        boxShadow: `0 2px 8px rgba(0,0,0,0.3)`,
                      }}
                    >
                      <Code className="w-5 h-5" style={{ color: colors.accent }} />
                    </div>
                    <div>
                      <h2
                        className="text-lg font-bold"
                        style={{ color: colors.panelText }}
                      >
                        {activeBuilding.label}
                      </h2>
                      <div className="flex items-center gap-2">
                        {activeBuilding.language && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: colors.panelTextMuted }}>
                            <Circle
                              className="w-2.5 h-2.5 fill-current"
                              style={{ color: languageColors[activeBuilding.language] || '#888' }}
                            />
                            {activeBuilding.language}
                          </span>
                        )}
                        {!activeBuilding.language && (
                          <p
                            className="text-sm capitalize"
                            style={{ color: colors.panelTextMuted }}
                          >
                            {activeBuilding.buildingType.replace('-', ' ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4">
                    <div
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md"
                      style={{
                        color: colors.accent,
                        background: 'rgba(0,0,0,0.2)',
                      }}
                    >
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-bold">
                        {activeBuilding.stars !== undefined
                          ? formatStarCount(activeBuilding.stars)
                          : '0'}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md"
                      style={{
                        color: colors.panelTextMuted,
                        background: 'rgba(0,0,0,0.2)',
                      }}
                    >
                      <GitFork className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {activeBuilding.forks !== undefined
                          ? formatStarCount(activeBuilding.forks)
                          : '0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="px-5 py-4">
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: colors.panelText }}
                >
                  {activeBuilding.description || 'No description available. Click "View Repo" to explore this project on GitHub.'}
                </p>
              </div>

              {/* Action buttons */}
              <div className="px-5 pb-4">
                <div className="grid grid-cols-3 gap-3">
                  <ActionButton
                    icon={<BookOpen className="w-4 h-4" />}
                    label="README"
                    variant="secondary"
                    colors={colors}
                    onClick={() => {
                      const repoFullName = getRepoFullName();
                      if (repoFullName && activeBuilding) {
                        openJournal(repoFullName, activeBuilding.label);
                      }
                    }}
                  />
                  <ActionButton
                    icon={<Sparkles className="w-4 h-4" />}
                    label="AI Summary"
                    variant="primary"
                    colors={colors}
                    onClick={() => console.log('AI Summary')}
                  />
                  <ActionButton
                    icon={<ExternalLink className="w-4 h-4" />}
                    label="View Repo"
                    variant="secondary"
                    colors={colors}
                    onClick={() => {
                      if (activeBuilding.repoUrl) {
                        window.open(activeBuilding.repoUrl, '_blank');
                      }
                    }}
                  />
                </div>
              </div>

              {/* Keyboard hints */}
              <div
                className="px-5 py-3"
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderTop: `1px solid ${colors.panelBorder}`,
                }}
              >
                <div
                  className="flex items-center justify-center gap-6 text-xs"
                  style={{ color: colors.panelTextMuted }}
                >
                  <span>
                    <kbd
                      className="px-1.5 py-0.5 rounded font-mono text-[10px]"
                      style={{
                        background: colors.buttonSecondary,
                        color: colors.panelText,
                        border: `1px solid ${colors.panelBorder}`,
                      }}
                    >
                      E
                    </kbd>{' '}
                    Interact
                  </span>
                  <span>
                    <kbd
                      className="px-1.5 py-0.5 rounded font-mono text-[10px]"
                      style={{
                        background: colors.buttonSecondary,
                        color: colors.panelText,
                        border: `1px solid ${colors.panelBorder}`,
                      }}
                    >
                      WASD
                    </kbd>{' '}
                    Move
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  variant: 'primary' | 'secondary';
  colors: any;
  onClick: () => void;
}

function ActionButton({ icon, label, variant, colors, onClick }: ActionButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-200"
      style={{
        background: isPrimary
          ? `linear-gradient(to bottom, ${colors.buttonPrimaryHover}, ${colors.buttonPrimary})`
          : colors.buttonSecondary,
        color: isPrimary ? colors.accent : colors.panelText,
        border: `2px solid ${isPrimary ? colors.accent : colors.panelBorder}`,
        boxShadow: isPrimary
          ? `0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`
          : `0 2px 4px rgba(0,0,0,0.2)`,
      }}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
}
