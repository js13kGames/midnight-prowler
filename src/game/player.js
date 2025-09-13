// player.js - Player control and state

import { GAME_CONFIG } from '../config/config.js';
import { mapSystem } from './map.js';
import { attackSystem } from '../systems/attack.js';
import { monsterSystem } from './monsters.js';


export class Player {
  constructor() {
    this.x = GAME_CONFIG.player.initialPosition.x;
    this.y = GAME_CONFIG.player.initialPosition.y;
    // Jump related
    this.z = 0; // Height
    this.velocityZ = 0;
    this.isJumping = false;
    this.jumpPower = 6.5; // Initial jump velocity
    this.gravity = 18; // Gravitational acceleration
    // Player direction
    this.dirX = GAME_CONFIG.player.initialDirection.x;
    this.dirY = GAME_CONFIG.player.initialDirection.y;
    this.planeX = GAME_CONFIG.player.initialPlane.x;
    this.planeY = GAME_CONFIG.player.initialPlane.y;
    this.hp = GAME_CONFIG.player.initialHP;
    this.maxHP = GAME_CONFIG.player.maxHP;
    // Attack related
    this.lastAttackTime = 0;
    this.isAttacking = false;
    this.attackAnimationTime = 0;

    // Rotate player view by default to face the corridor
    this.rotate(1580)
  }

  // Update player position and state
  update(dt, keys) {
    const speed = (keys['shift'] ? GAME_CONFIG.player.runSpeed : GAME_CONFIG.player.normalSpeed) * dt;
    const forward = (keys['w'] ? 1 : 0) - (keys['s'] ? 1 : 0);
    const strafe = (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0);

    // Calculate movement vector
    const moveX = this.dirX * forward + (-this.dirY) * strafe;
    const moveY = this.dirY * forward + (this.dirX) * strafe;

    const newX = this.x + moveX * speed;
    const newY = this.y + moveY * speed;

    // Collision detection
    if (mapSystem.isEmpty(newX, this.y)) this.x = newX;
    if (mapSystem.isEmpty(this.x, newY)) this.y = newY;

    // Jump logic
    if (keys.jump && !this.isJumping && this.z === 0) {
      this.jump();
    }
    if (this.isJumping) {
      this.velocityZ -= this.gravity * dt;
      this.z += this.velocityZ * dt;
      if (this.z <= 0) {
        this.z = 0;
        this.velocityZ = 0;
        this.isJumping = false;
      }
    }

    // Update explored area
    mapSystem.updateExploration(this.x, this.y, GAME_CONFIG.miniMap.exploreRadius);
    
    // Check if monster teleport is triggered
    monsterSystem.checkTeleportTrigger(this.x, this.y);

    // Update attack animation
    if (this.isAttacking) {
      this.attackAnimationTime += dt;
      if (this.attackAnimationTime > 0.3) { // Attack animation lasts 0.3s
        this.isAttacking = false;
        this.attackAnimationTime = 0;
      }
    }
  }

  // Jump method
  jump() {
    this.isJumping = true;
    this.velocityZ = this.jumpPower;
  }

  // Rotate player view
  rotate(deltaX) {
    const rot = deltaX * GAME_CONFIG.rendering.rotationSensitivity;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);  
    
    // Update direction vector
    const oldDirX = this.dirX;
    this.dirX = this.dirX * cos - this.dirY * sin;
    this.dirY = oldDirX * sin + this.dirY * cos;
    
    // Update plane vector
    const oldPlaneX = this.planeX;
    this.planeX = this.planeX * cos - this.planeY * sin;
    this.planeY = oldPlaneX * sin + this.planeY * cos;
  }

  // Perform attack
  attack() {
    const now = performance.now();
    
    // Check attack cooldown
    if (now - this.lastAttackTime < GAME_CONFIG.player.attackCooldown || this.isAttacking) {
      return false;
    }
    
    // Start attack animation
    this.isAttacking = true;
    this.attackAnimationTime = 0;
    this.lastAttackTime = now;
    // Create fireball projectile
    attackSystem.createFireball(this);
    return true;
  }

  // Take damage
  takeDamage(damage) {
    this.hp = Math.max(0, this.hp - damage);
    return this.hp <= 0; // Return whether the player is dead
  }

  // Check if alive
  isAlive() {
    return this.hp > 0;
  }

  // Get position
  getPosition() {
    return { x: this.x, y: this.y };
  }

  // Get direction
  getDirection() {
    return { x: this.dirX, y: this.dirY };
  }

  // Get plane
  getPlane() {
    return { x: this.planeX, y: this.planeY };
  }

  // Reset player state
  reset() {
    this.x = GAME_CONFIG.player.initialPosition.x;
    this.y = GAME_CONFIG.player.initialPosition.y;
    this.z = 0;
    this.velocityZ = 0;
    this.isJumping = false;
    this.dirX = GAME_CONFIG.player.initialDirection.x;
    this.dirY = GAME_CONFIG.player.initialDirection.y;
    this.planeX = GAME_CONFIG.player.initialPlane.x;
    this.planeY = GAME_CONFIG.player.initialPlane.y;
    this.hp = GAME_CONFIG.player.initialHP;
    this.isAttacking = false;
    this.attackAnimationTime = 0;
    this.lastAttackTime = 0;
  }
}

export const player = new Player();
