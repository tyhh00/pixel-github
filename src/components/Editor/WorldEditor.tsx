'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MousePointer2,
  Move,
  Maximize2,
  Type,
  Plus,
  Undo2,
  Redo2,
  Save,
  Eye,
  Upload,
  ArrowLeft,
  Trash2,
  Check,
} from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { useGameStore } from '@/store/gameStore';
import type { UserWorldConfig } from '@/types/editor';
import type { ThemeColors } from '@/config/themes';

interface WorldEditorProps {
  username: string;
}

export function WorldEditor({ username }: WorldEditorProps) {
  const router = useRouter();
  const { currentTheme } = useGameStore();
  const colors = currentTheme.colors;

  const {
    isInitialized,
    isLoading,
    isSaving,
    activeTool,
    setActiveTool,
    selectedElementId,
    selectedElementType,
    deselectElement,
    slots,
    textElements,
    updateSlot,
    removeSlot,
    addTextElement,
    updateTextElement,
    removeTextElement,
    backgroundImageUrl,
    setBackgroundImage,
    worldScale,
    setWorldScale,
    isDirty,
    setIsDirty,
    canUndo,
    canRedo,
    undo,
    redo,
    loadWorldConfig,
    exportConfig,
    isPublished,
  } = useEditorStore();

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load world config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`/api/world/${username}`);
        const data = await res.json();
        loadWorldConfig(data.customWorld as UserWorldConfig | null, username);
      } catch (error) {
        console.error('Failed to load world config:', error);
        loadWorldConfig(null, username);
      }
    }

    loadConfig();
  }, [username, loadWorldConfig]);

  // Handle save
  const handleSave = useCallback(async (publish: boolean = false) => {
    setSaveStatus('saving');
    useEditorStore.setState({ isSaving: true });

    try {
      const config = exportConfig();
      const res = await fetch('/api/world/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          isPublished: publish,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }

      setSaveStatus('saved');
      setIsDirty(false);

      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
    } finally {
      useEditorStore.setState({ isSaving: false });
    }
  }, [exportConfig, setIsDirty]);

  // Handle background upload
  const handleBackgroundUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'background');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      setBackgroundImage(data.path, data.url);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image');
    }
  }, [setBackgroundImage]);

  // Get selected element
  const selectedSlot = selectedElementType === 'slot'
    ? slots.find(s => s.id === selectedElementId)
    : null;
  const selectedText = selectedElementType === 'text'
    ? textElements.find(t => t.id === selectedElementId)
    : null;

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: colors.primaryDark }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/80">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: colors.primaryDark }}>
      {/* Top Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{
          background: colors.navbarBg,
          borderColor: colors.navbarBorder,
        }}
      >
        {/* Left: Back button and title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/${username}`)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: colors.navbarText }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <div>
            <h1 className="text-lg font-bold" style={{ color: colors.navbarText }}>
              World Editor
            </h1>
            <p className="text-xs" style={{ color: colors.panelTextMuted }}>
              {username}&apos;s world {isDirty && '• Unsaved changes'}
            </p>
          </div>
        </div>

        {/* Center: Tools */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <ToolButton
            icon={<MousePointer2 className="w-4 h-4" />}
            label="Select"
            isActive={activeTool === 'select'}
            onClick={() => setActiveTool('select')}
            colors={colors}
          />
          <ToolButton
            icon={<Move className="w-4 h-4" />}
            label="Move"
            isActive={activeTool === 'move'}
            onClick={() => setActiveTool('move')}
            colors={colors}
          />
          <ToolButton
            icon={<Maximize2 className="w-4 h-4" />}
            label="Resize"
            isActive={activeTool === 'resize'}
            onClick={() => setActiveTool('resize')}
            colors={colors}
          />
          <div className="w-px h-6 mx-1" style={{ background: colors.panelBorder }} />
          <ToolButton
            icon={<Type className="w-4 h-4" />}
            label="Add Text"
            isActive={activeTool === 'addText'}
            onClick={() => {
              setActiveTool('addText');
              addTextElement();
            }}
            colors={colors}
          />
          <ToolButton
            icon={<Plus className="w-4 h-4" />}
            label="Add Slot"
            isActive={activeTool === 'addSlot'}
            onClick={() => setActiveTool('addSlot')}
            colors={colors}
          />
          <div className="w-px h-6 mx-1" style={{ background: colors.panelBorder }} />
          <ToolButton
            icon={<Undo2 className="w-4 h-4" />}
            label="Undo"
            onClick={undo}
            disabled={!canUndo()}
            colors={colors}
          />
          <ToolButton
            icon={<Redo2 className="w-4 h-4" />}
            label="Redo"
            onClick={redo}
            disabled={!canRedo()}
            colors={colors}
          />
        </div>

        {/* Right: Save buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/${username}`)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{
              background: colors.buttonSecondary,
              color: colors.panelText,
              border: `1px solid ${colors.panelBorder}`,
            }}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{
              background: colors.buttonSecondary,
              color: colors.panelText,
              border: `1px solid ${colors.panelBorder}`,
            }}
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: `linear-gradient(to bottom, ${colors.buttonPrimaryHover}, ${colors.buttonPrimary})`,
              color: colors.accent,
              border: `2px solid ${colors.accent}`,
            }}
          >
            {saveStatus === 'saved' ? (
              <>
                <Check className="w-4 h-4" />
                Published!
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {isPublished ? 'Update' : 'Publish'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Canvas Area */}
        <div
          className="flex-1 relative overflow-hidden"
          onClick={() => deselectElement()}
        >
          {/* Background Image Preview */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: backgroundImageUrl
                ? `url(${backgroundImageUrl})`
                : `url(/themes/woody/background.png)`,
              transform: `scale(${worldScale / 1.8})`,
              transformOrigin: 'center',
            }}
          />

          {/* Slots overlay */}
          <div className="absolute inset-0">
            {slots.map((slot) => (
              <DraggableSlot
                key={slot.id}
                slot={slot}
                isSelected={selectedElementId === slot.id}
                onSelect={() => useEditorStore.getState().selectElement(slot.id, 'slot')}
                onUpdate={(updates) => updateSlot(slot.id, updates)}
                colors={colors}
              />
            ))}

            {/* Text elements overlay */}
            {textElements.map((text) => (
              <DraggableText
                key={text.id}
                element={text}
                isSelected={selectedElementId === text.id}
                onSelect={() => useEditorStore.getState().selectElement(text.id, 'text')}
                onUpdate={(updates) => updateTextElement(text.id, updates)}
                colors={colors}
              />
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div
          className="w-72 flex flex-col border-l"
          style={{
            background: colors.panelBg,
            borderColor: colors.navbarBorder,
          }}
        >
          {/* Background Section */}
          <div className="p-4 border-b" style={{ borderColor: colors.panelBorder }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: colors.panelText }}>
              Background
            </h3>
            <label
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg cursor-pointer transition-colors"
              style={{
                background: colors.buttonSecondary,
                border: `2px dashed ${colors.panelBorder}`,
                color: colors.panelTextMuted,
              }}
            >
              <Upload className="w-5 h-5" />
              <span className="text-sm">Upload Image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBackgroundUpload}
              />
            </label>
          </div>

          {/* World Scale Section */}
          <div className="p-4 border-b" style={{ borderColor: colors.panelBorder }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: colors.panelText }}>
              Zoom Level
            </h3>
            <input
              type="range"
              min="1.2"
              max="2.5"
              step="0.1"
              value={worldScale}
              onChange={(e) => setWorldScale(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: colors.panelTextMuted }}>
              <span>Zoomed In</span>
              <span>{worldScale.toFixed(1)}x</span>
              <span>Zoomed Out</span>
            </div>
          </div>

          {/* Properties Panel */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-sm font-bold mb-3" style={{ color: colors.panelText }}>
              {selectedSlot ? 'Slot Properties' : selectedText ? 'Text Properties' : 'Properties'}
            </h3>

            {selectedSlot && (
              <SlotProperties
                slot={selectedSlot}
                onUpdate={(updates) => updateSlot(selectedSlot.id, updates)}
                onDelete={() => removeSlot(selectedSlot.id)}
                colors={colors}
              />
            )}

            {selectedText && (
              <TextProperties
                element={selectedText}
                onUpdate={(updates) => updateTextElement(selectedText.id, updates)}
                onDelete={() => removeTextElement(selectedText.id)}
                colors={colors}
              />
            )}

            {!selectedSlot && !selectedText && (
              <p className="text-sm" style={{ color: colors.panelTextMuted }}>
                Select an element to edit its properties
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Tool button component
function ToolButton({
  icon,
  label,
  isActive,
  onClick,
  disabled,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
  colors: ThemeColors;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50"
      style={{
        background: isActive ? colors.buttonPrimary : 'transparent',
        color: isActive ? colors.accent : colors.navbarText,
      }}
    >
      {icon}
    </button>
  );
}

// Draggable slot component
function DraggableSlot({
  slot,
  isSelected,
  onSelect,
  onUpdate,
  colors,
}: {
  slot: ReturnType<typeof useEditorStore.getState>['slots'][0];
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<typeof slot>) => void;
  colors: ThemeColors;
}) {
  const handleDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();

    const startX = e.clientX;
    const startY = e.clientY;
    const startSlotX = slot.x;
    const startSlotY = slot.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / window.innerWidth;
      const deltaY = (moveEvent.clientY - startY) / window.innerHeight;

      onUpdate({
        x: Math.max(0.05, Math.min(0.95, startSlotX + deltaX)),
        y: Math.max(0.05, Math.min(0.95, startSlotY + deltaY)),
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      useEditorStore.getState().pushHistory();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <motion.div
      className="absolute cursor-move"
      style={{
        left: `${slot.x * 100}%`,
        top: `${slot.y * 100}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseDown={handleDrag}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div
        className="px-3 py-2 rounded-lg text-sm font-medium"
        style={{
          background: isSelected ? colors.accent : colors.labelBg,
          color: isSelected ? colors.primaryDark : colors.labelText,
          border: isSelected ? `2px solid ${colors.accent}` : `2px solid transparent`,
          boxShadow: isSelected ? `0 0 0 4px ${colors.accent}40` : 'none',
        }}
      >
        {slot.label}
      </div>
    </motion.div>
  );
}

// Draggable text component
function DraggableText({
  element,
  isSelected,
  onSelect,
  onUpdate,
  colors,
}: {
  element: ReturnType<typeof useEditorStore.getState>['textElements'][0];
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<typeof element>) => void;
  colors: ThemeColors;
}) {
  const handleDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();

    const startX = e.clientX;
    const startY = e.clientY;
    const startElX = element.x;
    const startElY = element.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / window.innerWidth;
      const deltaY = (moveEvent.clientY - startY) / window.innerHeight;

      onUpdate({
        x: Math.max(0.05, Math.min(0.95, startElX + deltaX)),
        y: Math.max(0.05, Math.min(0.95, startElY + deltaY)),
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      useEditorStore.getState().pushHistory();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className="absolute cursor-move"
      style={{
        left: `${element.x * 100}%`,
        top: `${element.y * 100}%`,
        transform: `translate(-50%, -50%) rotate(${element.rotation}deg) scale(${element.scale})`,
        fontSize: element.fontSize,
        fontFamily: element.fontFamily,
        color: element.color,
        backgroundColor: element.backgroundColor || 'transparent',
        padding: '4px 8px',
        borderRadius: '4px',
        border: isSelected ? `2px solid ${colors.accent}` : '2px solid transparent',
        boxShadow: isSelected ? `0 0 0 4px ${colors.accent}40` : 'none',
      }}
      onMouseDown={handleDrag}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {element.content}
    </div>
  );
}

// Slot properties panel
function SlotProperties({
  slot,
  onUpdate,
  onDelete,
  colors,
}: {
  slot: ReturnType<typeof useEditorStore.getState>['slots'][0];
  onUpdate: (updates: Partial<typeof slot>) => void;
  onDelete: () => void;
  colors: ThemeColors;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs mb-1" style={{ color: colors.panelTextMuted }}>
          Label
        </label>
        <input
          type="text"
          value={slot.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{
            background: colors.buttonSecondary,
            color: colors.panelText,
            border: `1px solid ${colors.panelBorder}`,
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs mb-1" style={{ color: colors.panelTextMuted }}>
            X Position
          </label>
          <input
            type="number"
            value={(slot.x * 100).toFixed(0)}
            onChange={(e) => onUpdate({ x: parseFloat(e.target.value) / 100 })}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              background: colors.buttonSecondary,
              color: colors.panelText,
              border: `1px solid ${colors.panelBorder}`,
            }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: colors.panelTextMuted }}>
            Y Position
          </label>
          <input
            type="number"
            value={(slot.y * 100).toFixed(0)}
            onChange={(e) => onUpdate({ y: parseFloat(e.target.value) / 100 })}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              background: colors.buttonSecondary,
              color: colors.panelText,
              border: `1px solid ${colors.panelBorder}`,
            }}
          />
        </div>
      </div>

      {slot.id !== 'home-portal' && (
        <button
          onClick={onDelete}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm justify-center"
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <Trash2 className="w-4 h-4" />
          Delete Slot
        </button>
      )}
    </div>
  );
}

// Text properties panel
function TextProperties({
  element,
  onUpdate,
  onDelete,
  colors,
}: {
  element: ReturnType<typeof useEditorStore.getState>['textElements'][0];
  onUpdate: (updates: Partial<typeof element>) => void;
  onDelete: () => void;
  colors: ThemeColors;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs mb-1" style={{ color: colors.panelTextMuted }}>
          Content
        </label>
        <textarea
          value={element.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg text-sm resize-none"
          style={{
            background: colors.buttonSecondary,
            color: colors.panelText,
            border: `1px solid ${colors.panelBorder}`,
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs mb-1" style={{ color: colors.panelTextMuted }}>
            Font Size
          </label>
          <input
            type="number"
            value={element.fontSize}
            onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              background: colors.buttonSecondary,
              color: colors.panelText,
              border: `1px solid ${colors.panelBorder}`,
            }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: colors.panelTextMuted }}>
            Color
          </label>
          <input
            type="color"
            value={element.color}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="w-full h-9 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      <button
        onClick={onDelete}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm justify-center"
        style={{
          background: 'rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        }}
      >
        <Trash2 className="w-4 h-4" />
        Delete Text
      </button>
    </div>
  );
}
