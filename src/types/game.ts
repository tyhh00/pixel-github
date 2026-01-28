import type { GitHubRepo, GitHubUser } from '@/services/github';

// Building types that users can place in slots
export type BuildingType =
  | 'treehouse'
  | 'mushroom-house'
  | 'cottage'
  | 'tower'
  | 'windmill'
  | 'portal';

// A slot where a building can be placed
export interface BuildingSlot {
  id: string;
  x: number;
  y: number;
  buildingType: BuildingType;
  label: string;
  description?: string;
  repoUrl?: string;
  stars?: number;
  forks?: number;
  language?: string;
  isInteractive: boolean;
}

// Project data associated with a building
export interface ProjectData {
  id: string;
  name: string;
  description: string;
  repoUrl: string;
  stars: number;
  language?: string;
  topics?: string[];
  readmeSummary?: string;
}

// GitHub profile data for display
export interface ProfileData {
  username: string;
  user: GitHubUser;
  repos: GitHubRepo[];
  totalStars: number;
}

// Player state
export interface PlayerState {
  x: number;
  y: number;
  isGhost: boolean;
  characterSprite: string;
}

// World template configuration
export interface WorldTemplate {
  id: string;
  name: string;
  backgroundKey: string;
  slots: BuildingSlot[];
  requiredStars: number; // Minimum stars to unlock this template
}

// Game state shared between Phaser and React
export interface GameState {
  // Player
  player: PlayerState;
  setPlayerPosition: (x: number, y: number) => void;
  setIsGhost: (isGhost: boolean) => void;

  // Interaction
  activeBuilding: BuildingSlot | null;
  setActiveBuilding: (building: BuildingSlot | null) => void;

  // World
  currentTemplate: WorldTemplate | null;
  setCurrentTemplate: (template: WorldTemplate) => void;

  // UI State
  isActionBarOpen: boolean;
  setActionBarOpen: (open: boolean) => void;

  // Customization mode
  isCustomizing: boolean;
  setIsCustomizing: (customizing: boolean) => void;
}
