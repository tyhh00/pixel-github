import { create } from 'zustand';
import type { GameState, BuildingSlot, WorldTemplate, BuildingType, ProfileData } from '@/types/game';
import type { UserWorldConfig } from '@/types/editor';
import type Phaser from 'phaser';
import { defaultTheme, type ThemeConfig } from '@/config/themes';

interface ExtendedGameState extends GameState {
  // Phaser game reference
  gameInstance: Phaser.Game | null;
  setGameInstance: (game: Phaser.Game | null) => void;

  // Theme
  currentTheme: ThemeConfig;
  setCurrentTheme: (theme: ThemeConfig) => void;

  // Building customization
  updateSlotBuildingType: (slotId: string, buildingType: BuildingType) => void;

  // Mobile controls
  isMobile: boolean;
  setIsMobile: (isMobile: boolean) => void;
  mobileInput: { x: number; y: number };
  setMobileInput: (x: number, y: number) => void;

  // GitHub profile data
  profileData: ProfileData | null;
  setProfileData: (data: ProfileData | null) => void;

  // Journal modal state
  isJournalOpen: boolean;
  journalRepoFullName: string | null;
  journalRepoName: string | null;
  openJournal: (repoFullName: string, repoName: string) => void;
  closeJournal: () => void;

  // Custom world config (from D1 database)
  customWorldConfig: UserWorldConfig | null;
  setCustomWorldConfig: (config: UserWorldConfig | null) => void;
}

export const useGameStore = create<ExtendedGameState>((set, get) => ({
  // Player state
  player: {
    x: 400,
    y: 400,
    isGhost: true,
    characterSprite: 'wizard',
  },
  setPlayerPosition: (x, y) =>
    set((state) => ({
      player: { ...state.player, x, y },
    })),
  setIsGhost: (isGhost) =>
    set((state) => ({
      player: { ...state.player, isGhost },
    })),

  // Interaction state
  activeBuilding: null,
  setActiveBuilding: (building) => set({ activeBuilding: building }),

  // World state
  currentTemplate: null,
  setCurrentTemplate: (template) => set({ currentTemplate: template }),

  // UI state
  isActionBarOpen: false,
  setActionBarOpen: (open) => set({ isActionBarOpen: open }),

  // Customization mode
  isCustomizing: false,
  setIsCustomizing: (customizing) => set({ isCustomizing: customizing }),

  // Theme
  currentTheme: defaultTheme,
  setCurrentTheme: (theme) => set({ currentTheme: theme }),

  // Phaser game reference
  gameInstance: null,
  setGameInstance: (game) => set({ gameInstance: game }),

  // Mobile controls
  isMobile: false,
  setIsMobile: (isMobile) => set({ isMobile }),
  mobileInput: { x: 0, y: 0 },
  setMobileInput: (x, y) => set({ mobileInput: { x, y } }),

  // GitHub profile data
  profileData: null,
  setProfileData: (data) => set({ profileData: data }),

  // Journal modal state
  isJournalOpen: false,
  journalRepoFullName: null,
  journalRepoName: null,
  openJournal: (repoFullName, repoName) =>
    set({ isJournalOpen: true, journalRepoFullName: repoFullName, journalRepoName: repoName }),
  closeJournal: () =>
    set({ isJournalOpen: false, journalRepoFullName: null, journalRepoName: null }),

  // Custom world config
  customWorldConfig: null,
  setCustomWorldConfig: (config) => set({ customWorldConfig: config }),

  // Building customization
  updateSlotBuildingType: (slotId, buildingType) => {
    const { gameInstance, activeBuilding } = get();

    // Update the active building in store
    if (activeBuilding && activeBuilding.id === slotId) {
      set({
        activeBuilding: { ...activeBuilding, buildingType },
      });
    }

    // Update in Phaser scene
    if (gameInstance) {
      const mainScene = gameInstance.scene.getScene('MainScene') as any;
      if (mainScene && mainScene.updateBuildingType) {
        mainScene.updateBuildingType(slotId, buildingType);
      }
    }
  },
}));

// Subscribe to store changes from Phaser
export const subscribeToGameStore = useGameStore.subscribe;

// Get current state snapshot (for Phaser)
export const getGameState = useGameStore.getState;
