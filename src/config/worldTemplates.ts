import type { WorldTemplate, BuildingSlot } from '@/types/game';

// Default slot positions for the forest template (based on reference image)
const forestSlots: BuildingSlot[] = [
  {
    id: 'slot-1',
    x: 150,
    y: 200,
    buildingType: 'treehouse',
    label: 'Project A',
    isInteractive: true,
  },
  {
    id: 'slot-2',
    x: 300,
    y: 150,
    buildingType: 'mushroom-house',
    label: 'Lib B',
    isInteractive: true,
  },
  {
    id: 'slot-3',
    x: 550,
    y: 180,
    buildingType: 'cottage',
    label: 'Game C',
    isInteractive: true,
  },
  {
    id: 'slot-4',
    x: 650,
    y: 280,
    buildingType: 'treehouse',
    label: 'Project D',
    isInteractive: true,
  },
  {
    id: 'slot-5',
    x: 200,
    y: 400,
    buildingType: 'treehouse',
    label: 'Project E',
    isInteractive: true,
  },
  {
    id: 'slot-6',
    x: 350,
    y: 450,
    buildingType: 'mushroom-house',
    label: 'Lib F',
    isInteractive: true,
  },
  {
    id: 'slot-7',
    x: 500,
    y: 420,
    buildingType: 'mushroom-house',
    label: 'Game G',
    isInteractive: true,
  },
  {
    id: 'slot-8',
    x: 650,
    y: 450,
    buildingType: 'cottage',
    label: 'Game H',
    isInteractive: true,
  },
  // Central portal (home)
  {
    id: 'home-portal',
    x: 400,
    y: 300,
    buildingType: 'portal',
    label: 'Home',
    isInteractive: true,
  },
];

export const worldTemplates: WorldTemplate[] = [
  {
    id: 'forest',
    name: 'Enchanted Forest',
    backgroundKey: 'bg-forest',
    slots: forestSlots,
    requiredStars: 0, // Default template, available to everyone
  },
  {
    id: 'desert',
    name: 'Desert Oasis',
    backgroundKey: 'bg-desert',
    slots: [], // Will be populated later
    requiredStars: 100,
  },
  {
    id: 'ocean',
    name: 'Ocean Kingdom',
    backgroundKey: 'bg-ocean',
    slots: [],
    requiredStars: 500,
  },
  {
    id: 'space',
    name: 'Space Station',
    backgroundKey: 'bg-space',
    slots: [],
    requiredStars: 1000,
  },
  {
    id: 'cyberpunk',
    name: 'Neon City',
    backgroundKey: 'bg-cyberpunk',
    slots: [],
    requiredStars: 5000,
  },
];

export const getTemplateById = (id: string): WorldTemplate | undefined => {
  return worldTemplates.find((t) => t.id === id);
};

export const getAvailableTemplates = (totalStars: number): WorldTemplate[] => {
  return worldTemplates.filter((t) => t.requiredStars <= totalStars);
};

export const defaultTemplate = worldTemplates[0];
