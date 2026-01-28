import { create } from 'zustand';
import type {
  CustomSlotPosition,
  CustomTextElement,
  EditorTool,
  HistoryEntry,
  UserWorldConfig,
} from '@/types/editor';
import { v4 as uuidv4 } from 'uuid';

interface EditorState {
  // Initialization
  isInitialized: boolean;
  isLoading: boolean;
  isSaving: boolean;

  // World metadata
  worldId: string | null;
  username: string | null;
  baseThemeId: string;
  isPublished: boolean;

  // Editor tools
  activeTool: EditorTool;
  setActiveTool: (tool: EditorTool) => void;

  // Selection
  selectedElementId: string | null;
  selectedElementType: 'slot' | 'text' | null;
  selectElement: (id: string, type: 'slot' | 'text') => void;
  deselectElement: () => void;

  // Background
  backgroundImagePath: string | null;
  backgroundImageUrl: string | null;
  setBackgroundImage: (path: string | null, url: string | null) => void;

  // World scale
  worldScale: number;
  setWorldScale: (scale: number) => void;

  // Slots
  slots: CustomSlotPosition[];
  addSlot: (slot?: Partial<CustomSlotPosition>) => void;
  updateSlot: (id: string, updates: Partial<CustomSlotPosition>) => void;
  removeSlot: (id: string) => void;

  // Text elements
  textElements: CustomTextElement[];
  addTextElement: (element?: Partial<CustomTextElement>) => void;
  updateTextElement: (id: string, updates: Partial<CustomTextElement>) => void;
  removeTextElement: (id: string) => void;

  // History (undo/redo)
  history: HistoryEntry[];
  historyIndex: number;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Dirty state
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;

  // Load/export
  loadWorldConfig: (config: UserWorldConfig | null, username: string) => void;
  exportConfig: () => Partial<UserWorldConfig>;

  // Reset
  reset: () => void;
}

const DEFAULT_SLOTS: CustomSlotPosition[] = [
  { id: 'slot-1', x: 0.17, y: 0.36, width: 1, height: 1, label: 'Project 1', buildingType: 'treehouse' },
  { id: 'slot-2', x: 0.83, y: 0.36, width: 1, height: 1, label: 'Project 2', buildingType: 'treehouse' },
  { id: 'slot-3', x: 0.14, y: 0.70, width: 1, height: 1, label: 'Project 3', buildingType: 'mushroom-house' },
  { id: 'slot-4', x: 0.86, y: 0.70, width: 1, height: 1, label: 'Project 4', buildingType: 'mushroom-house' },
  { id: 'home-portal', x: 0.50, y: 0.47, width: 1, height: 1, label: 'Home', buildingType: 'portal' },
];

const initialState = {
  isInitialized: false,
  isLoading: false,
  isSaving: false,
  worldId: null,
  username: null,
  baseThemeId: 'woody',
  isPublished: false,
  activeTool: 'select' as EditorTool,
  selectedElementId: null,
  selectedElementType: null,
  backgroundImagePath: null,
  backgroundImageUrl: null,
  worldScale: 1.8,
  slots: [...DEFAULT_SLOTS],
  textElements: [],
  history: [],
  historyIndex: -1,
  isDirty: false,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialState,

  setActiveTool: (tool) => set({ activeTool: tool }),

  selectElement: (id, type) =>
    set({ selectedElementId: id, selectedElementType: type }),

  deselectElement: () =>
    set({ selectedElementId: null, selectedElementType: null }),

  setBackgroundImage: (path, url) => {
    get().pushHistory();
    set({
      backgroundImagePath: path,
      backgroundImageUrl: url,
      isDirty: true,
    });
  },

  setWorldScale: (scale) => {
    get().pushHistory();
    set({ worldScale: scale, isDirty: true });
  },

  addSlot: (slot) => {
    get().pushHistory();
    const newSlot: CustomSlotPosition = {
      id: uuidv4(),
      x: slot?.x ?? 0.5,
      y: slot?.y ?? 0.5,
      width: slot?.width ?? 1,
      height: slot?.height ?? 1,
      label: slot?.label ?? `Slot ${get().slots.length + 1}`,
      buildingType: slot?.buildingType ?? 'cottage',
    };
    set((state) => ({
      slots: [...state.slots, newSlot],
      isDirty: true,
      selectedElementId: newSlot.id,
      selectedElementType: 'slot',
    }));
  },

  updateSlot: (id, updates) => {
    set((state) => ({
      slots: state.slots.map((slot) =>
        slot.id === id ? { ...slot, ...updates } : slot
      ),
      isDirty: true,
    }));
  },

  removeSlot: (id) => {
    // Don't allow removing the home portal
    if (id === 'home-portal') return;

    get().pushHistory();
    set((state) => ({
      slots: state.slots.filter((slot) => slot.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
      selectedElementType: state.selectedElementId === id ? null : state.selectedElementType,
      isDirty: true,
    }));
  },

  addTextElement: (element) => {
    get().pushHistory();
    const newElement: CustomTextElement = {
      id: uuidv4(),
      x: element?.x ?? 0.5,
      y: element?.y ?? 0.3,
      content: element?.content ?? 'New Text',
      fontSize: element?.fontSize ?? 24,
      fontFamily: element?.fontFamily ?? 'monospace',
      color: element?.color ?? '#ffffff',
      backgroundColor: element?.backgroundColor,
      rotation: element?.rotation ?? 0,
      scale: element?.scale ?? 1,
      zIndex: element?.zIndex ?? get().textElements.length,
    };
    set((state) => ({
      textElements: [...state.textElements, newElement],
      isDirty: true,
      selectedElementId: newElement.id,
      selectedElementType: 'text',
    }));
  },

  updateTextElement: (id, updates) => {
    set((state) => ({
      textElements: state.textElements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
      isDirty: true,
    }));
  },

  removeTextElement: (id) => {
    get().pushHistory();
    set((state) => ({
      textElements: state.textElements.filter((el) => el.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
      selectedElementType: state.selectedElementId === id ? null : state.selectedElementType,
      isDirty: true,
    }));
  },

  pushHistory: () => {
    const { slots, textElements, backgroundImagePath, history, historyIndex } = get();

    // Trim history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);

    // Add current state to history
    newHistory.push({
      slots: JSON.parse(JSON.stringify(slots)),
      textElements: JSON.parse(JSON.stringify(textElements)),
      backgroundImagePath: backgroundImagePath ?? undefined,
    });

    // Keep max 50 history entries
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;

    const prevState = history[historyIndex - 1];
    set({
      slots: prevState.slots,
      textElements: prevState.textElements,
      backgroundImagePath: prevState.backgroundImagePath,
      historyIndex: historyIndex - 1,
      isDirty: true,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;

    const nextState = history[historyIndex + 1];
    set({
      slots: nextState.slots,
      textElements: nextState.textElements,
      backgroundImagePath: nextState.backgroundImagePath,
      historyIndex: historyIndex + 1,
      isDirty: true,
    });
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  setIsDirty: (dirty) => set({ isDirty: dirty }),

  loadWorldConfig: (config, username) => {
    if (config) {
      set({
        isInitialized: true,
        worldId: config.id,
        username,
        baseThemeId: config.baseThemeId || 'woody',
        isPublished: config.isPublished,
        backgroundImagePath: config.backgroundImagePath || null,
        backgroundImageUrl: config.backgroundImagePath
          ? `${process.env.NEXT_PUBLIC_R2_URL || ''}/${config.backgroundImagePath}`
          : null,
        worldScale: config.worldScale || 1.8,
        slots: config.slots.length > 0 ? config.slots : [...DEFAULT_SLOTS],
        textElements: config.textElements || [],
        isDirty: false,
        history: [],
        historyIndex: -1,
      });
    } else {
      // No existing config - use defaults
      set({
        isInitialized: true,
        worldId: null,
        username,
        baseThemeId: 'woody',
        isPublished: false,
        backgroundImagePath: null,
        backgroundImageUrl: null,
        worldScale: 1.8,
        slots: [...DEFAULT_SLOTS],
        textElements: [],
        isDirty: false,
        history: [],
        historyIndex: -1,
      });
    }

    // Push initial state to history
    get().pushHistory();
  },

  exportConfig: () => {
    const {
      worldId,
      username,
      baseThemeId,
      isPublished,
      backgroundImagePath,
      worldScale,
      slots,
      textElements,
    } = get();

    return {
      id: worldId || undefined,
      username: username || undefined,
      baseThemeId,
      isPublished,
      backgroundImagePath: backgroundImagePath || undefined,
      worldScale,
      slots,
      textElements,
    };
  },

  reset: () => set(initialState),
}));
