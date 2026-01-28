'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { ActionBar } from '@/components/UI/ActionBar';
import { TopBar } from '@/components/UI/TopBar';
import { CustomizationPanel } from '@/components/UI/CustomizationPanel';
import { ControlsHint } from '@/components/UI/ControlsHint';
import { MobileControls } from '@/components/UI/MobileControls';
import { JournalModal } from '@/components/UI/JournalModal';
import { useGameStore } from '@/store/gameStore';
import { Paintbrush, Edit3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { GitHubRepo, GitHubUser } from '@/services/github';

// Dynamically import GameCanvas to avoid SSR issues with Phaser
const GameCanvas = dynamic(
  () => import('./GameCanvas').then((mod) => mod.GameCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#1a3d12]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/80 font-mono text-sm">Loading world...</p>
        </div>
      </div>
    ),
  }
);

interface GameWrapperProps {
  username?: string;
  user?: GitHubUser;
  repos?: GitHubRepo[];
  totalStars?: number;
  isOwner?: boolean;
}

export function GameWrapper({ username, user, repos, totalStars, isOwner = false }: GameWrapperProps) {
  const router = useRouter();
  const { isCustomizing, setIsCustomizing, currentTheme, setProfileData, isJournalOpen, journalRepoFullName, journalRepoName, closeJournal } = useGameStore();
  const colors = currentTheme.colors;

  // Set profile data in store when props change
  useEffect(() => {
    if (username && user && repos) {
      setProfileData({
        username,
        user,
        repos,
        totalStars: totalStars ?? 0,
      });
    }
  }, [username, user, repos, totalStars, setProfileData]);

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ background: colors.primaryDark }}
    >
      {/* Browser-style frame */}
      <div className="absolute inset-0 flex flex-col">
        {/* Top bar */}
        <TopBar username={username} />

        {/* Game canvas area */}
        <div className="flex-1 relative">
          <GameCanvas />
        </div>
      </div>

      {/* Owner-only controls */}
      {isOwner && (
        <div className="fixed top-16 right-4 z-40 flex flex-col gap-2">
          {/* Edit World button */}
          <button
            onClick={() => router.push(`/${username}/editor`)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all"
            style={{
              background: `linear-gradient(to bottom, ${colors.buttonPrimaryHover}, ${colors.buttonPrimary})`,
              color: colors.accent,
              border: `2px solid ${colors.accent}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">Edit World</span>
          </button>

          {/* Customize building button */}
          <button
            onClick={() => setIsCustomizing(!isCustomizing)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all"
            style={{
              background: isCustomizing
                ? `linear-gradient(to bottom, ${colors.buttonPrimaryHover}, ${colors.buttonPrimary})`
                : colors.navbarBg,
              color: isCustomizing ? colors.accent : colors.navbarText,
              border: `2px solid ${isCustomizing ? colors.accent : colors.navbarBorder}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <Paintbrush className="w-4 h-4" />
            <span className="hidden sm:inline">Customize</span>
          </button>
        </div>
      )}

      {/* UI Overlays */}
      <ActionBar />
      <CustomizationPanel userStars={totalStars ?? 0} />
      <ControlsHint />
      <MobileControls />

      {/* Journal Modal for README */}
      <JournalModal
        isOpen={isJournalOpen}
        onClose={closeJournal}
        repoFullName={journalRepoFullName ?? undefined}
        repoName={journalRepoName ?? undefined}
      />
    </div>
  );
}
