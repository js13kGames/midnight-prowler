// systems/attack.js

// Import config file for shared settings
import { GAME_CONFIG } from '../config/config.js';
import { effectSystem } from './effects.js';

let gameEngineRef = null;

// Private variable to store all projectiles (fireballs)
let projectiles = [];

// Fireball constants are read from GAME_CONFIG for more flexibility
const FIREBALL_CONFIG = GAME_CONFIG.player.fireball;

// Create a singleton object to manage the attack system
export const attackSystem = {
    /**
     * Creates a fireball
     * @param {object} caster - The caster (player object), needs x, y, dirX, dirY properties
     */
    createFireball: function(caster) {
        // Calculate spawn position with distance and offsets
        const spawnDistance = FIREBALL_CONFIG.spawnDistance;
        const baseX = caster.x + caster.dirX * spawnDistance;
        const baseY = caster.y + caster.dirY * spawnDistance;
        
        // Apply additional offsets
        // For X offset: use perpendicular direction (rotate direction 90 degrees)
        const perpX = -caster.dirY; // Perpendicular to direction (left/right)
        const perpY = caster.dirX;   // Perpendicular to direction (left/right)
        
        const startX = baseX + perpX * FIREBALL_CONFIG.offsetX + caster.dirX * FIREBALL_CONFIG.offsetY;
        const startY = baseY + perpY * FIREBALL_CONFIG.offsetX + caster.dirY * FIREBALL_CONFIG.offsetY;
        
        const newFireball = {
            type: 'fireball',
            x: startX,
            y: startY,
            z: caster.z || 0, // Give the fireball a z-axis, default is 0
            startX: startX,     // Track original spawn position for distance calculations
            startY: startY,     // Track original spawn position for distance calculations
            startZ: caster.z || 0, // Record the starting z
            vx: caster.dirX * FIREBALL_CONFIG.speed,
            vy: caster.dirY * FIREBALL_CONFIG.speed,
            vz: 0, // Currently, the fireball does not fly up/down
            size: FIREBALL_CONFIG.size,
            life: FIREBALL_CONFIG.life,
            damage: FIREBALL_CONFIG.damage,
            light: FIREBALL_CONFIG.light
        };
        // Add the new fireball to the projectiles array
        projectiles.push(newFireball);
    },

    /**
     * Updates the state of all projectiles
     * @param {object} mapSystem - The map system, used for collision detection
     * @param {number} deltaTime - The time elapsed since the last frame
     */
    update: function(mapSystem, deltaTime) {
        // Use reverse loop to safely remove items during iteration
        for (let i = projectiles.length - 1; i >= 0; i--) {
            let projectile = projectiles[i];

            // If marked as dead by the collision system, remove it directly
            if (projectile.isDead) {
                projectiles.splice(i, 1);
                continue;
            }

            // Move the projectile using velocity
            projectile.x += projectile.vx * deltaTime;
            projectile.y += projectile.vy * deltaTime;
            
            // Decrease life (frame-based, not time-based)
            projectile.life -= 1; // Decrease by 1 each frame, not using deltaTime
            
            if (!mapSystem.isEmpty(projectile.x, projectile.y)) {
                // Before removing the fireball, create an explosion effect at its final position
                effectSystem.createExplosion(projectile.x, projectile.y);
                
                projectiles.splice(i, 1);
                continue;
            }
            // Check if projectile hit a wall or life ended
            if (projectile.life <= 0 || !mapSystem.isEmpty(projectile.x, projectile.y)) {
                projectiles.splice(i, 1);
                continue;
            }
            
            // Remove if too far from start position (optional cleanup)
            const distanceFromStart = Math.sqrt(
                Math.pow(projectile.x - projectile.startX, 2) + 
                Math.pow(projectile.y - projectile.startY, 2)
            );
            if (distanceFromStart > 15) { // Increase max range
                projectiles.splice(i, 1);
            }
        }
    },
    /**
     * Used to receive the instance from game.js
     */
    setGameEngineRef: function(gameEngine) {
        gameEngineRef = gameEngine;
    },
    /**
     * Provides a method for external systems (e.g., the rendering engine) to get all projectiles
     * @returns {Array}
     */
    getProjectiles: function() {
        return projectiles;
    }

    
};