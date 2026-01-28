import Phaser from 'phaser';
import { useGameStore } from '@/store/gameStore';
import type { BuildingSlot, BuildingType } from '@/types/game';
import type { ThemeConfig } from '@/config/themes';
import { formatStarCount } from '@/services/github';

interface InteractionZone extends Phaser.GameObjects.Container {
  slotData: BuildingSlot;
  glowGraphics: Phaser.GameObjects.Graphics;
  labelText: Phaser.GameObjects.Text;
  buildingSprite: Phaser.GameObjects.Graphics;
}

export class MainScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private interactionZones: InteractionZone[] = [];
  private currentActiveZone: InteractionZone | null = null;
  private playerSpeed = 280;
  private interactionRadius = 70;
  private background!: Phaser.GameObjects.Image;
  private worldSize = { width: 0, height: 0 };
  private theme!: ThemeConfig;
  private storeUnsubscribe?: () => void;

  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    // Get theme from store
    this.theme = useGameStore.getState().currentTheme;

    // Create background first (sets world size)
    this.createBackground();

    // Create interaction zones with buildings
    this.createInteractionZones();

    // Create player (after zones so it renders on top)
    this.createPlayer();

    // Setup camera AFTER player is created and positioned
    this.setupCamera();

    // Setup input
    this.setupInput();

    // Handle resize
    this.scale.on('resize', this.handleResize, this);

    // Check if mobile
    this.checkMobile();

    // Subscribe to profile data changes
    this.subscribeToProfileData();

    // Check if profile data already exists
    const profileData = useGameStore.getState().profileData;
    if (profileData) {
      this.updateZonesWithRepoData(profileData.repos);
    }
  }

  private subscribeToProfileData() {
    // Subscribe to store changes
    this.storeUnsubscribe = useGameStore.subscribe((state, prevState) => {
      if (state.profileData !== prevState.profileData && state.profileData) {
        this.updateZonesWithRepoData(state.profileData.repos);
      }
    });
  }

  private updateZonesWithRepoData(repos: { name: string; description: string | null; html_url: string; stargazers_count: number; forks_count: number; language: string | null }[]) {
    // Map repos to zones (excluding the portal)
    const editableZones = this.interactionZones.filter(z => z.slotData.id !== 'home-portal');

    repos.forEach((repo, index) => {
      if (index < editableZones.length) {
        const zone = editableZones[index];

        // Update slot data
        zone.slotData.label = repo.name;
        zone.slotData.description = repo.description || 'No description available';
        zone.slotData.repoUrl = repo.html_url;
        zone.slotData.stars = repo.stargazers_count;
        zone.slotData.forks = repo.forks_count;
        zone.slotData.language = repo.language || undefined;

        // Update the label text
        const displayName = repo.name.length > 18 ? repo.name.substring(0, 16) + '...' : repo.name;
        const starText = repo.stargazers_count > 0 ? ` ★${formatStarCount(repo.stargazers_count)}` : '';
        zone.labelText.setText(displayName + starText);
      }
    });
  }

  shutdown() {
    // Clean up subscription when scene is destroyed
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
    }
  }

  private checkMobile() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768;
    useGameStore.getState().setIsMobile(isMobile);
  }

  private createBackground() {
    // Add the background image at origin
    this.background = this.add.image(0, 0, 'bg-woody');
    this.background.setOrigin(0, 0);
    this.background.setDepth(0);

    // Get background native dimensions (should be square, e.g., 512x512 or 1024x1024)
    const bgWidth = this.background.width;
    const bgHeight = this.background.height;

    // Get the actual game canvas size from Phaser
    const canvasWidth = this.scale.width;
    const canvasHeight = this.scale.height;

    console.log('Background native:', bgWidth, 'x', bgHeight);
    console.log('Canvas size:', canvasWidth, 'x', canvasHeight);

    // Scale the background to be larger than the canvas
    // We want the world to be about 1.3-2.0x the canvas size so there's room to scroll
    const scaleToFillWidth = canvasWidth / bgWidth;
    const scaleToFillHeight = canvasHeight / bgHeight;

    // Use worldScale from theme config (default 1.4), higher = more zoomed out
    const worldScaleMultiplier = this.theme.worldScale ?? 1.4;
    const scale = Math.max(scaleToFillWidth, scaleToFillHeight) * worldScaleMultiplier;

    this.background.setScale(scale);

    // Set world size to the scaled background dimensions
    this.worldSize.width = Math.floor(bgWidth * scale);
    this.worldSize.height = Math.floor(bgHeight * scale);

    // Set physics world bounds to match
    this.physics.world.setBounds(0, 0, this.worldSize.width, this.worldSize.height);

    console.log('Scale applied:', scale.toFixed(2));
    console.log('World size:', this.worldSize.width, 'x', this.worldSize.height);
  }

  private createInteractionZones() {
    // Get slot positions from theme config
    const slots = this.theme.slots;

    slots.forEach((slotPos) => {
      const x = this.worldSize.width * slotPos.x;
      const y = this.worldSize.height * slotPos.y;

      const slot: BuildingSlot = {
        id: slotPos.id,
        x,
        y,
        buildingType: slotPos.defaultBuildingType,
        label: slotPos.label,
        isInteractive: true,
      };

      const zone = this.createInteractionZone(slot);
      this.interactionZones.push(zone);
    });
  }

  private createInteractionZone(slot: BuildingSlot): InteractionZone {
    const container = this.add.container(slot.x, slot.y) as InteractionZone;
    container.slotData = slot;
    container.setDepth(10);

    // Create glow graphics (for highlight effect when player is near)
    const glowGraphics = this.add.graphics();
    glowGraphics.setDepth(5);
    container.add(glowGraphics);
    container.glowGraphics = glowGraphics;

    // Create building sprite placeholder (rendered above glow)
    const buildingSprite = this.add.graphics();
    buildingSprite.setDepth(15);
    this.drawBuilding(buildingSprite, slot.buildingType);
    container.add(buildingSprite);
    container.buildingSprite = buildingSprite;

    // Add floating label
    const label = this.add.text(0, -70, slot.label, {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: this.theme.colors.labelText,
      backgroundColor: this.theme.colors.labelBg,
      padding: { x: 8, y: 4 },
    });
    label.setOrigin(0.5, 0.5);
    label.setAlpha(0.9);
    label.setDepth(20);
    container.add(label);
    container.labelText = label;

    return container;
  }

  private drawBuilding(graphics: Phaser.GameObjects.Graphics, type: BuildingType) {
    graphics.clear();

    // Scale factor for buildings
    const s = 1.2;

    switch (type) {
      case 'treehouse':
        // Tree trunk
        graphics.fillStyle(0x5d4037);
        graphics.fillRect(-8 * s, -10 * s, 16 * s, 50 * s);
        // Tree foliage
        graphics.fillStyle(0x2e7d32);
        graphics.fillCircle(0, -30 * s, 30 * s);
        graphics.fillCircle(-15 * s, -15 * s, 20 * s);
        graphics.fillCircle(15 * s, -15 * s, 20 * s);
        // House platform
        graphics.fillStyle(0x8d6e63);
        graphics.fillRect(-25 * s, -25 * s, 50 * s, 8 * s);
        // House
        graphics.fillStyle(0xffcc80);
        graphics.fillRect(-18 * s, -50 * s, 36 * s, 25 * s);
        // Roof
        graphics.fillStyle(0x6d4c41);
        graphics.fillTriangle(-22 * s, -50 * s, 0, -70 * s, 22 * s, -50 * s);
        // Window
        graphics.fillStyle(0x81d4fa);
        graphics.fillRect(-5 * s, -45 * s, 10 * s, 10 * s);
        break;

      case 'mushroom-house':
        // Stem
        graphics.fillStyle(0xfff8e1);
        graphics.fillRect(-12 * s, -10 * s, 24 * s, 35 * s);
        // Cap
        graphics.fillStyle(0xe53935);
        graphics.fillCircle(0, -20 * s, 35 * s);
        // White spots
        graphics.fillStyle(0xffffff);
        graphics.fillCircle(-15 * s, -30 * s, 8 * s);
        graphics.fillCircle(10 * s, -25 * s, 6 * s);
        graphics.fillCircle(-5 * s, -15 * s, 5 * s);
        graphics.fillCircle(18 * s, -35 * s, 7 * s);
        // Door
        graphics.fillStyle(0x5d4037);
        graphics.fillRoundedRect(-8 * s, 0, 16 * s, 25 * s, 8 * s);
        // Window
        graphics.fillStyle(0x81d4fa);
        graphics.fillCircle(0, -5 * s, 5 * s);
        break;

      case 'cottage':
        // Base
        graphics.fillStyle(0xbcaaa4);
        graphics.fillRect(-25 * s, -15 * s, 50 * s, 40 * s);
        // Roof
        graphics.fillStyle(0x6d4c41);
        graphics.fillTriangle(-30 * s, -15 * s, 0, -50 * s, 30 * s, -15 * s);
        // Door
        graphics.fillStyle(0x5d4037);
        graphics.fillRect(-8 * s, 5 * s, 16 * s, 20 * s);
        // Windows
        graphics.fillStyle(0x81d4fa);
        graphics.fillRect(-20 * s, -5 * s, 10 * s, 10 * s);
        graphics.fillRect(10 * s, -5 * s, 10 * s, 10 * s);
        // Chimney
        graphics.fillStyle(0x8d6e63);
        graphics.fillRect(10 * s, -45 * s, 10 * s, 15 * s);
        break;

      case 'tower':
        // Tower body
        graphics.fillStyle(0x5c6bc0);
        graphics.fillRect(-15 * s, -30 * s, 30 * s, 60 * s);
        // Roof
        graphics.fillStyle(0x7e57c2);
        graphics.fillTriangle(-18 * s, -30 * s, 0, -60 * s, 18 * s, -30 * s);
        // Windows
        graphics.fillStyle(0xffd54f);
        graphics.fillRect(-8 * s, -20 * s, 8 * s, 10 * s);
        graphics.fillRect(0, -20 * s, 8 * s, 10 * s);
        graphics.fillRect(-4 * s, 0, 8 * s, 10 * s);
        // Door
        graphics.fillStyle(0x4e342e);
        graphics.fillRoundedRect(-6 * s, 15 * s, 12 * s, 15 * s, 6 * s);
        break;

      case 'windmill':
        // Body
        graphics.fillStyle(0xfff8e1);
        graphics.fillRect(-15 * s, -20 * s, 30 * s, 50 * s);
        // Roof
        graphics.fillStyle(0x6d4c41);
        graphics.fillTriangle(-18 * s, -20 * s, 0, -40 * s, 18 * s, -20 * s);
        // Blades
        graphics.lineStyle(4 * s, 0x8d6e63);
        graphics.lineBetween(0, -30 * s, 0, -60 * s);
        graphics.lineBetween(0, -30 * s, 25 * s, -15 * s);
        graphics.lineBetween(0, -30 * s, -25 * s, -15 * s);
        graphics.lineBetween(0, -30 * s, 0, 0);
        // Center
        graphics.fillStyle(0x5d4037);
        graphics.fillCircle(0, -30 * s, 5 * s);
        break;

      case 'portal':
        // This slot is on the central tree, so just draw the portal glow
        // Portal glow effect
        graphics.fillStyle(0x4fc3f7, 0.6);
        graphics.fillEllipse(0, 0, 35 * s, 50 * s);
        graphics.fillStyle(0x81d4fa, 0.7);
        graphics.fillEllipse(0, 0, 25 * s, 38 * s);
        graphics.fillStyle(0xffffff, 0.8);
        graphics.fillEllipse(0, 0, 12 * s, 20 * s);
        break;
    }
  }

  private createPlayer() {
    // Start player in the center of the world
    const startX = this.worldSize.width * 0.5;
    const startY = this.worldSize.height * 0.6;

    console.log('Creating player at:', startX, startY);

    this.player = this.add.container(startX, startY);
    this.player.setDepth(50); // Above buildings but below UI

    const wizard = this.add.graphics();

    // Shadow
    wizard.fillStyle(0x000000, 0.3);
    wizard.fillEllipse(0, 28, 35, 12);

    // Robe body
    wizard.fillStyle(0x7b1fa2);
    wizard.fillTriangle(-18, 28, 0, -12, 18, 28);

    // Robe highlight
    wizard.fillStyle(0x9c27b0, 0.5);
    wizard.fillTriangle(-8, 28, 0, 0, 8, 28);

    // Face
    wizard.fillStyle(0xffcc80);
    wizard.fillCircle(0, -18, 12);

    // Eyes
    wizard.fillStyle(0x000000);
    wizard.fillCircle(-4, -20, 2);
    wizard.fillCircle(4, -20, 2);

    // Hat
    wizard.fillStyle(0x7b1fa2);
    wizard.fillTriangle(-14, -18, 0, -52, 14, -18);
    wizard.fillRect(-18, -22, 36, 7);

    // Hat band
    wizard.fillStyle(0xffd700);
    wizard.fillRect(-14, -22, 28, 3);

    // Beard
    wizard.fillStyle(0xeeeeee);
    wizard.fillTriangle(-6, -10, 0, 12, 6, -10);

    // Staff
    wizard.fillStyle(0x8d6e63);
    wizard.fillRect(20, -35, 5, 63);

    // Staff orb
    wizard.fillStyle(0x4fc3f7);
    wizard.fillCircle(22, -40, 10);
    wizard.fillStyle(0xffffff, 0.6);
    wizard.fillCircle(19, -43, 4);

    this.player.add(wizard);

    // Add physics
    this.physics.world.enable(this.player);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(36, 36);
    body.setOffset(-18, 0);
  }

  private setupCamera() {
    const camera = this.cameras.main;

    // Set zoom to 1 (no zoom) - the world is already scaled appropriately
    camera.setZoom(1);

    // Set camera bounds to world size - this prevents showing empty space
    camera.setBounds(0, 0, this.worldSize.width, this.worldSize.height);

    // Start following the player with smooth lerp
    camera.startFollow(this.player, true, 0.1, 0.1);

    // Force camera to center on player immediately
    camera.centerOn(this.player.x, this.player.y);

    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    console.log('Camera setup complete');
    console.log('Screen/View:', screenWidth, 'x', screenHeight);
    console.log('World:', this.worldSize.width, 'x', this.worldSize.height);
    console.log('Player at:', this.player.x.toFixed(0), this.player.y.toFixed(0));
    console.log('Scroll room - X:', (this.worldSize.width - screenWidth).toFixed(0), 'Y:', (this.worldSize.height - screenHeight).toFixed(0));
  }

  private updateCameraZoom() {
    // Keep zoom at 1 - world scaling handles the sizing
    this.cameras.main.setZoom(1);
  }

  private handleResize() {
    this.updateCameraZoom();
    this.checkMobile();
  }

  private setupInput() {
    if (!this.input.keyboard) return;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Interaction key
    this.input.keyboard.on('keydown-E', () => {
      if (this.currentActiveZone) {
        this.triggerInteraction(this.currentActiveZone);
      }
    });

    // Customize key
    this.input.keyboard.on('keydown-C', () => {
      const store = useGameStore.getState();
      store.setIsCustomizing(!store.isCustomizing);
    });

    // ESC to close panels
    this.input.keyboard.on('keydown-ESC', () => {
      const store = useGameStore.getState();
      store.setActionBarOpen(false);
      store.setIsCustomizing(false);
    });

    // Click/tap on zones
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

      this.interactionZones.forEach((zone) => {
        const distance = Phaser.Math.Distance.Between(
          worldPoint.x,
          worldPoint.y,
          zone.x,
          zone.y
        );
        if (distance < this.interactionRadius + 20) {
          this.triggerInteraction(zone);
        }
      });
    });
  }

  private triggerInteraction(zone: InteractionZone) {
    const store = useGameStore.getState();
    store.setActiveBuilding(zone.slotData);
    store.setActionBarOpen(true);
  }

  update() {
    this.handlePlayerMovement();
    this.checkZoneProximity();
    this.updateGlowEffects();
  }

  private handlePlayerMovement() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    let velocityX = 0;
    let velocityY = 0;

    // Keyboard input
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      velocityX = -this.playerSpeed;
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      velocityX = this.playerSpeed;
    }

    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      velocityY = -this.playerSpeed;
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      velocityY = this.playerSpeed;
    }

    // Mobile input (from store)
    const { mobileInput } = useGameStore.getState();
    if (mobileInput.x !== 0 || mobileInput.y !== 0) {
      velocityX = mobileInput.x * this.playerSpeed;
      velocityY = mobileInput.y * this.playerSpeed;
    }

    // Normalize diagonal movement
    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= 0.707;
      velocityY *= 0.707;
    }

    body.setVelocity(velocityX, velocityY);

    // Update store
    useGameStore.getState().setPlayerPosition(this.player.x, this.player.y);
  }

  private checkZoneProximity() {
    let nearestZone: InteractionZone | null = null;
    let nearestDistance = Infinity;

    this.interactionZones.forEach((zone) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        zone.x,
        zone.y
      );

      if (distance < this.interactionRadius && distance < nearestDistance) {
        nearestDistance = distance;
        nearestZone = zone;
      }
    });

    if (nearestZone !== this.currentActiveZone) {
      if (this.currentActiveZone) {
        this.onExitZone(this.currentActiveZone);
      }
      if (nearestZone) {
        this.onEnterZone(nearestZone);
      }
      this.currentActiveZone = nearestZone;
    }
  }

  private onEnterZone(zone: InteractionZone) {
    // Show interaction hint
    const hint = this.add.text(0, 55, '[E] Interact', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#ffd700',
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: { x: 6, y: 3 },
    });
    hint.setOrigin(0.5, 0.5);
    hint.setName('interaction-hint');
    hint.setDepth(25);
    zone.add(hint);

    // Highlight label
    zone.labelText.setAlpha(1);
    zone.labelText.setStyle({ backgroundColor: this.theme.colors.highlightBg });

    // Open action bar
    const store = useGameStore.getState();
    store.setActiveBuilding(zone.slotData);
    store.setActionBarOpen(true);
  }

  private onExitZone(zone: InteractionZone) {
    const hint = zone.getByName('interaction-hint');
    if (hint) {
      hint.destroy();
    }

    zone.labelText.setAlpha(0.9);
    zone.labelText.setStyle({ backgroundColor: this.theme.colors.labelBg });

    const store = useGameStore.getState();
    store.setActionBarOpen(false);
    store.setActiveBuilding(null);
  }

  private updateGlowEffects() {
    const time = this.time.now;

    this.interactionZones.forEach((zone) => {
      const isActive = zone === this.currentActiveZone;

      zone.glowGraphics.clear();

      if (isActive) {
        const pulseAlpha = 0.5 + Math.sin(time / 150) * 0.25;
        const pulseSize = this.interactionRadius + Math.sin(time / 200) * 8;

        // Outer glow
        zone.glowGraphics.lineStyle(5, 0xffd700, pulseAlpha);
        zone.glowGraphics.strokeCircle(0, 0, pulseSize);

        // Inner glow
        zone.glowGraphics.lineStyle(3, 0xffeb3b, pulseAlpha * 0.7);
        zone.glowGraphics.strokeCircle(0, 0, pulseSize - 12);

        // Subtle fill
        zone.glowGraphics.fillStyle(0xffd700, pulseAlpha * 0.1);
        zone.glowGraphics.fillCircle(0, 0, pulseSize);
      }
    });
  }

  // Public method to update building type (called from React)
  public updateBuildingType(slotId: string, newType: BuildingType) {
    const zone = this.interactionZones.find((z) => z.slotData.id === slotId);
    if (zone) {
      zone.slotData.buildingType = newType;
      // Redraw the building
      this.drawBuilding(zone.buildingSprite, newType);
    }
  }
}
