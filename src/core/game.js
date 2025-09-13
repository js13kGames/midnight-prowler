// game.js - Simplified main game logic

import { GAME_CONFIG } from '../config/config.js';
import { player } from '../game/player.js';
import { monsterSystem, setPlayerRef, setGameEngineRef } from '../game/monsters.js';
import { inputSystem } from '../systems/input.js';
import { uiSystem } from '../systems/ui.js';
import { createRaycastingRenderer } from '../graphics/raycasting.js';
import { collisionSystem } from '../systems/collision.js';
import { attackSystem } from '../systems/attack.js';
import { mapSystem } from '../game/map.js';
import { audioSystem } from '../systems/audio.js';
import { effectSystem } from '../systems/effects.js';
export class GameEngine {
  constructor() {
    // Renderer
    this.raycastingRenderer = null;

    // Game state
    this.gameState = 'playing'; // playing, paused, gameOver, victory
    this.lastTime = 0;
    this.overlay = null;

    // Screen shake system
    this.screenShake = {
      intensity: 0,
      duration: 0,
      time: 0,
      offsetX: 0,
      offsetY: 0,
      isAlarm: false,    // Is it in alarm mode
      alarmColor: true,  // Alarm color
      pulseCount: 0      // Number of alarm shakes
    };

    // Set up dependency injection
    this.setupDependencies();

    // Initialization
    this.initRenderer();
    this.setupInputHandlers();
    this.setupWindowEvents();
  }

  // Set up dependency injection
  setupDependencies() {
    setPlayerRef(player);
    setGameEngineRef(this);
    window.gameEngineRef = this;  // Provide a global reference
  }

  // Initialize the renderer
  initRenderer() {
    const canvas = document.getElementById('game-canvas');

    if (!canvas) {
      throw new Error('Required canvas element not found');
    }

    this.raycastingRenderer = createRaycastingRenderer(canvas);

    // Set up pointer lock
    inputSystem.requestPointerLock(canvas);

    // Initialize audio on the first user interaction with the canvas.
    const initAudio = () => {
      audioSystem.initialize();
      canvas.removeEventListener('click', initAudio, { once: true });
    };
    canvas.addEventListener('click', initAudio, { once: true });

    this.handleResize();
  }

  // Set up input handlers
  setupInputHandlers() {
    // Attack
    inputSystem.onAttack(() => {
      if (this.gameState === 'playing') {
        // It will handle cooldown and trigger attackSystem to create a fireball
        const success = player.attack();

        if (success) {
          this.triggerScreenShake(1, 0.1);
        }
      }
    });

    // Mouse movement
    inputSystem.onMouseMove((data) => {
      if (this.gameState === 'playing') {
        player.rotate(data.movementX);
      }
    });

    // Restart game (press R key)
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'r' && (this.gameState === 'gameOver' || this.gameState === 'victory')) {
        this.restartGame();
      }
    });
  }

  // Set up window events
  setupWindowEvents() {
    window.addEventListener('resize', () => this.handleResize());
  }

  // Handle window size changes
  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    GAME_CONFIG.width = width;
    GAME_CONFIG.height = height;

    this.raycastingRenderer.resize(width, height);
  }

  // Update game logic
  update(deltaTime) {
    if (this.gameState !== 'playing') return;

    // Get input
    const movement = inputSystem.update();

    // Update game systems
    player.update(deltaTime, movement);
    monsterSystem.update(deltaTime);
    attackSystem.update(mapSystem, deltaTime); 
    
    // After all objects have moved to their new positions, perform a centralized collision check
    const monsters = monsterSystem.getAllMonsters();
    const projectiles = attackSystem.getProjectiles();
    collisionSystem.checkCollisions(player, monsters, projectiles, this);
    effectSystem.update(deltaTime);

    // Update screen shake
    this.updateScreenShake(deltaTime);

    // Check game state
    this.checkGameState();
  }

  // Update screen shake effect
  updateScreenShake(deltaTime) {
    if (this.screenShake.duration > 0) {
      this.screenShake.time += deltaTime;
      this.screenShake.duration -= deltaTime;


      if (this.screenShake.isAlarm) {
        // Alarm mode shake effect
        const totalDuration = 2.5; // Total duration
        const pulseDuration = totalDuration / this.screenShake.pulseCount; // Duration of each shake
        const currentPulse = Math.floor(this.screenShake.time / pulseDuration); // Which shake is it currently
        const pulseProgress = (this.screenShake.time % pulseDuration) / pulseDuration; // Progress of the current shake

        // Use sin function to create a regular shake
        if (pulseProgress < 0.5) {
          const intensity = this.screenShake.intensity * Math.sin(pulseProgress * Math.PI);
          this.screenShake.offsetX = (Math.random() - 0.5) * intensity;
          this.screenShake.offsetY = (Math.random() - 0.5) * intensity;
        } else {
          this.screenShake.offsetX = 0;
          this.screenShake.offsetY = 0;
        }
      } else {
        // Normal shake effect
        const progress = this.screenShake.time / (this.screenShake.time + this.screenShake.duration);
        const intensity = this.screenShake.intensity * (1 - progress);

        this.screenShake.offsetX = (Math.random() - 0.5) * intensity;
        this.screenShake.offsetY = (Math.random() - 0.5) * intensity;
      }

      if (this.screenShake.duration <= 0) {
        this.screenShake.intensity = 0;
        this.screenShake.offsetX = 0;
        this.screenShake.offsetY = 0;
        this.screenShake.isAlarm = false;
        this.screenShake.alarmColor = null;
      }
    }
  }

  // Trigger screen shake
  triggerScreenShake(intensity, duration, options = {}) {
    this.screenShake.intensity = intensity;
    this.screenShake.duration = duration;
    this.screenShake.time = 0;
    this.screenShake.isAlarm = options.isAlarm || false;
    this.screenShake.alarmColor = options.alarmColor || null;
    this.screenShake.pulseCount = options.pulseCount || 0;
  }

  // Trigger alarm shake
  triggerAlarmShake(pulseCount = 3) {
    this.triggerScreenShake(20, 1.5, {
      isAlarm: true,
      alarmColor: '#3201017a',  // Use pure red
      pulseCount: pulseCount
    });
  }

  // Get screen shake offset
  getScreenShakeOffset() {
    return {
      x: this.screenShake.offsetX,
      y: this.screenShake.offsetY
    };
  }

  getFinalState(isSuccess) {
    return {
      isSuccess: isSuccess,
      stats: {
        kills: monsterSystem.getAllMonsters().length - monsterSystem.getAliveCount()
      }
    }
  }
  // Check game state
  checkGameState() {
    // Check victory condition
    if (monsterSystem.areAllDead()) {
      this.gameState = 'victory';
      this.overlay = uiSystem.showGameFinish(this.getFinalState(true));
      return;
    }

    // Check failure condition
    if (!player.isAlive()) {
      this.gameState = 'gameOver';
      this.overlay = uiSystem.showGameFinish(this.getFinalState(false));
      return;
    }
  }

  // Render the game
  render() {
    const context = this.raycastingRenderer.context;
    const canvas = this.raycastingRenderer.canvas;

    // Get and apply screen shake
    const shakeOffset = this.getScreenShakeOffset();
    context.save();
    context.translate(shakeOffset.x, shakeOffset.y);

    // 1. Create an empty array to collect all sprites that need to be rendered
    const allSpritesToRender = [];

    // Update UI
    uiSystem.update(context, canvas, inputSystem);
    // Lighting
    const dynamicLights = [];
    // 2. Collect all living monsters from monsterSystem
    monsterSystem.getAllMonsters().forEach(monster => {
      if (monster.isAlive()) {
        // Pack the monster into a standard format and put it in the array
        allSpritesToRender.push({ type: 'monster', object: monster });
      }
    });

    // 3. Collect all fireballs from attackSystem
    attackSystem.getProjectiles().forEach(fireball => {
      // Pack the fireball into a standard format and put it in the array
      allSpritesToRender.push({ type: 'fireball', object: fireball });
      // If this fireball object has a 'light' property, treat it as a light source
      if (fireball.light) {
        dynamicLights.push({
          x: fireball.x,        // Light source's world coordinate X
          y: fireball.y,        // Light source's world coordinate Y
          ...fireball.light     // Spread and add all properties of the light object (radius, intensity, color)
        });
      }
    });
    // Collect all effect particles from effectSystem
    effectSystem.getEffects().forEach(particle => {
      allSpritesToRender.push({
        type: 'explosion_particle', // Ensure the type matches the key registered in the renderer
        object: particle
      });
    });

    // 4. Pass the player and the unified sprite list to the renderer together
    this.raycastingRenderer.render(player, allSpritesToRender, dynamicLights);
    // Restore canvas state
    this.raycastingRenderer.context.restore();

    // Render UI
    if (this.gameState === 'playing') {
      uiSystem.renderCrosshair(this.raycastingRenderer.context, this.raycastingRenderer.canvas);
      uiSystem.renderMiniMap(this.raycastingRenderer.context, this.raycastingRenderer.canvas);
    }

    // Render a red filter on top of everything
    if (this.screenShake.isAlarm && this.screenShake.alarmColor) {
      const ctx = this.raycastingRenderer.context;
      ctx.save();

      // Create red gradient
      const gradient = ctx.createRadialGradient(
        this.raycastingRenderer.canvas.width / 2,
        this.raycastingRenderer.canvas.height / 2,
        0,
        this.raycastingRenderer.canvas.width / 2,
        this.raycastingRenderer.canvas.height / 2,
        this.raycastingRenderer.canvas.width / 2
      );

      gradient.addColorStop(0, 'rgba(84, 0, 0, 0.6)');
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0.3)');

      ctx.fillStyle = gradient;
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillRect(0, 0, this.raycastingRenderer.canvas.width, this.raycastingRenderer.canvas.height);

      // Add flickering effect
      const pulseProgress = (this.screenShake.time % 0.5) / 0.5; // 0.5 second flicker cycle
      const pulseOpacity = Math.sin(pulseProgress * Math.PI) * 0.3;
      ctx.fillStyle = `rgba(255, 0, 0, ${pulseOpacity})`;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillRect(0, 0, this.raycastingRenderer.canvas.width, this.raycastingRenderer.canvas.height);

      ctx.restore();
    }

    uiSystem.update();
  }

  // Main game loop
  gameLoop(currentTime) {
    const deltaTime = Math.min(0.05, (currentTime - this.lastTime) * 0.001);
    this.lastTime = currentTime;

    // Update and render
    this.update(deltaTime);
    this.render();

    // Continue the loop
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  // Start the game
  start() {
    this.gameState = 'playing';
    this.lastTime = performance.now();

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  // Restart the game
  restartGame() {
    // Remove overlay
    if (this.overlay) {
      uiSystem.removeOverlay(this.overlay);
      this.overlay = null;
    }

    // Reset all systems
    player.reset();
    monsterSystem.reset();

    // Restart the game
    this.gameState = 'playing';
  }

  // Get game state
  getGameState() {
    return this.gameState;
  }
}

// Game initialization function
export function initGame() {
  // Wait for the DOM to be fully ready
  return new Promise((resolve) => {
    const startGame = () => {
      const game = new GameEngine();

      // Delay start to ensure all systems are ready
      setTimeout(() => {
        game.start();
        resolve(game);
      }, 100);
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      startGame();
    } else {
      window.addEventListener('load', startGame);
    }
  });
}

// Initialize the game immediately
let gameInstance = null;

// Initialize after the DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    gameInstance = initGame();
  });
} else {
  gameInstance = initGame();
}

export const game = gameInstance;
