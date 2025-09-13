// in: src/systems/effects.js
import { audioSystem } from './audio.js';

// Detailed settings for the explosion effect
const EXPLOSION_CONFIG = {
  particleCount: 25, // An explosion consists of 25 particles
  life: 0.5,         // Explosion effect lasts for 0.5 seconds
  speed: 9,          // Maximum flight speed of particles
  size: 0.18,        // Base size of particles
  gravity: -12       // Gravity affecting particles (negative value gives a feeling of floating up and then falling)
};

// An array to store all active effect particles in the game world
let activeEffects = [];

export const effectSystem = {
  /**
   * Creates an explosion effect at a specified position.
   * @param {number} x - The X coordinate of the explosion's center.
   * @param {number} y - The Y coordinate of the explosion's center.
   */
  createExplosion: function(x, y) {
    // Play explosion sound
    audioSystem.playSound('explosion', { volume: 0.5, pitch: 0.8 + Math.random() * 0.4 });

    for (let i = 0; i < EXPLOSION_CONFIG.particleCount; i++) {
      // Generate a random initial direction and speed for each particle
      const angle = Math.random() * 2 * Math.PI;
      const speed = Math.random() * EXPLOSION_CONFIG.speed;

      const newParticle = {
        type: 'explosion_particle', // Mark the type for renderer identification
        x: x, // Initial position
        y: y,
        // Initial velocity vector
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: (Math.random() - 0.2) * EXPLOSION_CONFIG.speed * 1.5, // Z-axis velocity to give a 3D feel
        
        life: EXPLOSION_CONFIG.life * (0.7 + Math.random() * 0.3), // Each particle has a slightly different lifecycle
        maxLife: EXPLOSION_CONFIG.life,
        size: EXPLOSION_CONFIG.size * (0.5 + Math.random() * 0.5),
        
        // Particle color transitions from bright yellow to orange-red
        color: {
          start: { r: 255, g: 255, b: 100 },
          end: { r: 255, g: 69, b: 0 }
        }
      };
      activeEffects.push(newParticle);
    }
  },

  /**
   * Updates the state of all effects (called every frame).
   * @param {number} deltaTime - The time difference.
   */
  update: function(deltaTime) {
    // Iterate backwards to safely remove elements in the loop
    for (let i = activeEffects.length - 1; i >= 0; i--) {
      let p = activeEffects[i];
      
      // Update lifecycle
      p.life -= deltaTime;
      
      // If life ends, remove from the array
      if (p.life <= 0) {
        activeEffects.splice(i, 1);
        continue;
      }
      
      // Update position
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      
      // Simulate gravity/air resistance
      p.vz += EXPLOSION_CONFIG.gravity * deltaTime;
      p.vx *= 0.98; // Velocity decays over time
      p.vy *= 0.98;
    }
  },

  /**
   * Provides a method for the rendering engine to get all active effects.
   * @returns {Array} An array of active effect particles.
   */
  getEffects: function() {
    return activeEffects;
  }
};