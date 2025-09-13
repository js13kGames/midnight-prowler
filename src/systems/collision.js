// systems/collision.js
import { effectSystem } from './effects.js';
export const collisionSystem = {
    /**
     * Checks all possible collisions in the game.
     * @param {object} player - The player object.
     * @param {Array} monsters - The array of monsters.
     * @param {Array} projectiles - The array of projectiles.
     * @param {object} gameEngine - A reference to the game engine, used to trigger effects.
     */
    checkCollisions: function(player, monsters, projectiles, gameEngine) {
        // 1. Check: Projectiles vs. Monsters
        for (let p of projectiles) {
            // If the projectile has already been handled, skip it
            if (p.isDead) continue;

            for (let m of monsters) {
                // If the monster is already dead, skip it
                if (!m.isAlive()) continue;

                const dx = m.x - p.x;
                const dy = m.y - p.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < m.size + p.size) {
                    // Collision occurred!
                    m.takeDamage(p.damage); // Monster takes damage
                    p.isDead = true; // Mark projectile for removal
                    effectSystem.createExplosion(p.x, p.y);// Create explosion effect 
                    // Trigger screen shake
                    if (gameEngine) {
                        gameEngine.triggerScreenShake(4, 0.15);
                    }
                    break; // One projectile hits only one monster
                }
            }
        }

        // 2. Check: Player vs. Monster (optional, if monsters can harm the player)
        for (let m of monsters) {
            if (!m.isAlive()) continue;
            
            const dx = m.x - player.x;
            const dy = m.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Assuming both player and monster have a collisionRadius
            if (distance < m.collisionRadius + player.collisionRadius) {
                 // Player takes damage, but needs a cooldown, otherwise it's instant death
                 player.takeDamage(m.damage); // Assuming player.takeDamage handles invincibility frames internally
                 // Screen shake can also be triggered here
            }
        }

    }
};