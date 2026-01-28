'use client';

import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '@/game/config';
import { useGameStore } from '@/store/gameStore';

export function GameCanvas() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const setGameInstance = useGameStore((state) => state.setGameInstance);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Calculate dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      // Get viewport dimensions, accounting for navbar (~50px)
      const width = Math.max(window.innerWidth, 600);
      const height = Math.max(window.innerHeight - 50, 400);
      setDimensions({ width, height });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    // Only run on client side and when we have dimensions
    if (typeof window === 'undefined') return;
    if (dimensions.width === 0 || dimensions.height === 0) return;
    if (!containerRef.current) return;

    // Prevent double initialization
    if (gameRef.current) {
      // If game exists, just resize it
      gameRef.current.scale.resize(dimensions.width, dimensions.height);
      return;
    }

    // Create game instance with explicit dimensions
    const config: Phaser.Types.Core.GameConfig = {
      ...gameConfig,
      parent: containerRef.current,
      width: dimensions.width,
      height: dimensions.height,
      scale: {
        mode: Phaser.Scale.NONE, // We control the size manually
        width: dimensions.width,
        height: dimensions.height,
      },
    };

    console.log('Creating Phaser game with dimensions:', dimensions.width, 'x', dimensions.height);

    gameRef.current = new Phaser.Game(config);
    setGameInstance(gameRef.current);

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        setGameInstance(null);
      }
    };
  }, [dimensions, setGameInstance]);

  return (
    <div
      ref={containerRef}
      id="game-container"
      style={{
        width: dimensions.width || '100%',
        height: dimensions.height || '100%',
      }}
    />
  );
}
