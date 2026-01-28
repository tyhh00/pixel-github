import type { BuildingType } from '@/types/game';

export interface BuildingConfig {
  id: BuildingType;
  name: string;
  description: string;
  category: 'nature' | 'fantasy' | 'tech' | 'special';
  requiredStars: number;
  colors: {
    primary: number;
    secondary: number;
    accent: number;
  };
}

export const buildingConfigs: Record<BuildingType, BuildingConfig> = {
  treehouse: {
    id: 'treehouse',
    name: 'Treehouse',
    description: 'A cozy house nestled in the branches',
    category: 'nature',
    requiredStars: 0,
    colors: {
      primary: 0x5d4037, // trunk
      secondary: 0x2e7d32, // leaves
      accent: 0xffcc80, // house
    },
  },
  'mushroom-house': {
    id: 'mushroom-house',
    name: 'Mushroom House',
    description: 'A whimsical fungi dwelling',
    category: 'fantasy',
    requiredStars: 0,
    colors: {
      primary: 0xe53935, // cap
      secondary: 0xfff8e1, // stem
      accent: 0xffffff, // spots
    },
  },
  cottage: {
    id: 'cottage',
    name: 'Cottage',
    description: 'A classic countryside home',
    category: 'nature',
    requiredStars: 0,
    colors: {
      primary: 0xbcaaa4, // walls
      secondary: 0x6d4c41, // roof
      accent: 0x81d4fa, // windows
    },
  },
  tower: {
    id: 'tower',
    name: 'Wizard Tower',
    description: 'A mystical spire of arcane knowledge',
    category: 'fantasy',
    requiredStars: 100,
    colors: {
      primary: 0x5c6bc0, // tower
      secondary: 0x7e57c2, // roof
      accent: 0xffd54f, // glow
    },
  },
  windmill: {
    id: 'windmill',
    name: 'Windmill',
    description: 'A charming mill that catches the breeze',
    category: 'nature',
    requiredStars: 50,
    colors: {
      primary: 0xfff8e1, // body
      secondary: 0x8d6e63, // blades
      accent: 0x6d4c41, // roof
    },
  },
  portal: {
    id: 'portal',
    name: 'Magic Portal',
    description: 'A gateway to other realms',
    category: 'special',
    requiredStars: 0,
    colors: {
      primary: 0x5d4037, // tree
      secondary: 0x4fc3f7, // glow
      accent: 0xffffff, // sparkle
    },
  },
};

export const getBuildingsByCategory = (category: BuildingConfig['category']) => {
  return Object.values(buildingConfigs).filter((b) => b.category === category);
};

export const getAvailableBuildings = (totalStars: number) => {
  return Object.values(buildingConfigs).filter(
    (b) => b.requiredStars <= totalStars
  );
};
