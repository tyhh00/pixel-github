import type { BuildingType } from '@/types/game';

// Slot position configuration
export interface SlotPosition {
  id: string;
  x: number; // percentage 0-1
  y: number; // percentage 0-1
  label: string;
  defaultBuildingType: BuildingType;
}

// Theme color configuration
export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryDark: string;
  primaryLight: string;

  // Accent colors
  accent: string;
  accentGlow: string;

  // UI colors
  navbarBg: string;
  navbarBorder: string;
  navbarText: string;

  // Panel colors
  panelBg: string;
  panelBorder: string;
  panelText: string;
  panelTextMuted: string;

  // Button colors
  buttonPrimary: string;
  buttonPrimaryHover: string;
  buttonSecondary: string;
  buttonSecondaryHover: string;

  // Game UI
  labelBg: string;
  labelText: string;
  highlightBg: string;
}

// Complete theme configuration
export interface ThemeConfig {
  id: string;
  name: string;
  backgroundImage: string;
  requiredStars: number;
  slots: SlotPosition[];
  colors: ThemeColors;
  // World scaling - higher = more zoomed out (default 1.4, range ~1.2-2.0)
  worldScale?: number;
}

// Woody forest theme - based on the background image
export const woodyTheme: ThemeConfig = {
  id: 'woody',
  name: 'Enchanted Forest',
  backgroundImage: '/themes/woody/background.png',
  requiredStars: 0,
  worldScale: 1.8, // Slightly zoomed out to show more of the forest
  slots: [
    // Top-left tree (large tree on left side)
    { id: 'slot-1', x: 0.17, y: 0.36, label: 'Project A', defaultBuildingType: 'treehouse' },
    // Top-right tree (large tree on right side)
    { id: 'slot-2', x: 0.83, y: 0.36, label: 'Project B', defaultBuildingType: 'treehouse' },
    // Bottom-left golden circle (near mushrooms)
    { id: 'slot-3', x: 0.14, y: 0.70, label: 'Library C', defaultBuildingType: 'mushroom-house' },
    // Bottom-right golden circle (near mushrooms)
    { id: 'slot-4', x: 0.86, y: 0.70, label: 'Library D', defaultBuildingType: 'mushroom-house' },
    // Center portal in the big tree
    { id: 'home-portal', x: 0.50, y: 0.47, label: 'Home', defaultBuildingType: 'portal' },
  ],
  colors: {
    // Forest greens (for game world elements)
    primary: '#2d5a27',
    primaryDark: '#1a3d12',
    primaryLight: '#4a7c43',

    // Golden accent (from the glow circles)
    accent: '#ffd700',
    accentGlow: '#ffeb3b',

    // Navbar/UI - warm wood tones (consistent across all UI)
    navbarBg: 'linear-gradient(to bottom, #6d4c41, #5d4037)',
    navbarBorder: '#4e342e',
    navbarText: '#fff8e1',

    // Panel - wood theme (matching navbar)
    panelBg: 'linear-gradient(to bottom, #5d4037, #4e342e)',
    panelBorder: '#3e2723',
    panelText: '#fff8e1',
    panelTextMuted: '#d7ccc8',

    // Buttons - wood theme
    buttonPrimary: '#6d4c41',
    buttonPrimaryHover: '#8d6e63',
    buttonSecondary: 'rgba(62, 39, 35, 0.8)',
    buttonSecondaryHover: 'rgba(78, 52, 46, 0.9)',

    // Game UI labels (in-world)
    labelBg: 'rgba(62, 39, 35, 0.9)',
    labelText: '#fff8e1',
    highlightBg: '#8d6e63',
  },
};

// Desert theme (placeholder for future)
export const desertTheme: ThemeConfig = {
  id: 'desert',
  name: 'Desert Oasis',
  backgroundImage: '/themes/desert/background.png',
  requiredStars: 100,
  worldScale: 1.6,
  slots: [
    { id: 'slot-1', x: 0.20, y: 0.30, label: 'Project A', defaultBuildingType: 'tower' },
    { id: 'slot-2', x: 0.80, y: 0.30, label: 'Project B', defaultBuildingType: 'tower' },
    { id: 'slot-3', x: 0.15, y: 0.65, label: 'Library C', defaultBuildingType: 'cottage' },
    { id: 'slot-4', x: 0.85, y: 0.65, label: 'Library D', defaultBuildingType: 'cottage' },
    { id: 'home-portal', x: 0.50, y: 0.50, label: 'Home', defaultBuildingType: 'portal' },
  ],
  colors: {
    primary: '#c2956e',
    primaryDark: '#8b6914',
    primaryLight: '#dbb896',
    accent: '#ff9800',
    accentGlow: '#ffb74d',
    navbarBg: 'linear-gradient(to bottom, #a67c52, #8b6914)',
    navbarBorder: '#6d4c41',
    navbarText: '#fff8e1',
    panelBg: 'rgba(139, 105, 20, 0.95)',
    panelBorder: 'rgba(194, 149, 110, 0.5)',
    panelText: '#fff8e1',
    panelTextMuted: '#ffe0b2',
    buttonPrimary: '#c2956e',
    buttonPrimaryHover: '#dbb896',
    buttonSecondary: 'rgba(139, 105, 20, 0.6)',
    buttonSecondaryHover: 'rgba(139, 105, 20, 0.8)',
    labelBg: 'rgba(139, 105, 20, 0.9)',
    labelText: '#fff8e1',
    highlightBg: '#c2956e',
  },
};

// All available themes
export const themes: ThemeConfig[] = [woodyTheme, desertTheme];

// Get theme by ID
export const getThemeById = (id: string): ThemeConfig | undefined => {
  return themes.find((t) => t.id === id);
};

// Get available themes based on star count
export const getAvailableThemes = (totalStars: number): ThemeConfig[] => {
  return themes.filter((t) => t.requiredStars <= totalStars);
};

// Default theme
export const defaultTheme = woodyTheme;
