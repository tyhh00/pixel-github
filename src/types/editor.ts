import type { BuildingType } from './game';

// Custom slot position for editor
export interface CustomSlotPosition {
  id: string;
  x: number; // percentage 0-1
  y: number; // percentage 0-1
  width: number; // percentage 0-1 (relative to default)
  height: number; // percentage 0-1 (relative to default)
  label: string;
  buildingType: BuildingType;
}

// Custom text element
export interface CustomTextElement {
  id: string;
  x: number; // percentage 0-1
  y: number; // percentage 0-1
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  rotation: number;
  scale: number;
  zIndex: number;
}

// User's saved world configuration
export interface UserWorldConfig {
  id: string;
  username: string;
  baseThemeId: string;
  backgroundImagePath?: string;
  worldScale: number;
  customColors?: Record<string, string>;
  slots: CustomSlotPosition[];
  textElements: CustomTextElement[];
  isPublished: boolean;
  createdAt?: number;
  updatedAt?: number;
}

// Editor state for a slot being edited
export interface EditorSlot extends CustomSlotPosition {
  isSelected: boolean;
  isDragging: boolean;
  isResizing: boolean;
}

// Editor state for a text element being edited
export interface EditorTextElement extends CustomTextElement {
  isSelected: boolean;
  isDragging: boolean;
  isEditing: boolean;
}

// Editor tool types
export type EditorTool = 'select' | 'move' | 'resize' | 'addText' | 'addSlot';

// History entry for undo/redo
export interface HistoryEntry {
  slots: CustomSlotPosition[];
  textElements: CustomTextElement[];
  backgroundImagePath?: string;
}
