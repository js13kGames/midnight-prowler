// monsters.js - Monster AI and behavior system

import { GAME_CONFIG, INITIAL_MONSTERS } from '../config/config.js';
import { mapSystem } from './map.js';
import { audioSystem } from '../systems/audio.js';
import { uiSystem } from '../systems/ui.js';

// Player will be passed via dependency injection to avoid circular dependencies
let playerRef = null;
let gameEngineRef = null;

// Set Player reference
export function setPlayerRef(player) {
  playerRef = player;
}

// Set game engine reference
export function setGameEngineRef(gameEngine) {
  gameEngineRef = gameEngine;
}

export class Monster {
  constructor(config) {
    this.x = config.x;
    this.y = config.y;
    this.dirX = config.dirX;
    this.dirY = config.dirY;
    this.hp = config.hp;
    this.maxHP = config.maxHP;
    this.speed = config.speed;
    this.state = config.state; // 'patrol', 'chase', 'attack', 'dead'
    this.detectionRange = config.detectionRange;
    this.attackRange = config.attackRange;
    this.size = config.size || 1.0; // Default collision radius
    this.patrolTarget = { ...config.patrolTarget };
    this.alertness = config.alertness;
    this.lastAttack = config.lastAttack;
    this.attackCooldown = config.attackCooldown;
    this.lastSeen = { x: 0, y: 0 };
    this.teleportDest = config.teleportDest || null;
    
    // Animation related
    this.animationTime = 0;
    this.isAttacking = false;
    this.attackAnimationTime = 0;
  }

  // Take damage
  takeDamage(damage) {
    this.hp = Math.max(0, this.hp - damage);
    if (this.hp <= 0) {
      this.state = 'dead';
    }
  }

  // Check if alive
  isAlive() {
    return this.hp > 0;
  }

  // Get animation state (for rendering system)
  getAnimationState() {
    return {
      isAttacking: this.isAttacking,
      attackProgress: this.isAttacking ? (this.attackAnimationTime / 0.8) : 0,
      isMoving: this.state === 'patrol' || this.state === 'chase',
      animationTime: this.animationTime
    };
  }

  // Update monster behavior
  update(dt) {
    if (!this.isAlive()) return;

    const playerPos = playerRef.getPosition();
    const distToPlayer = Math.sqrt((this.x - playerPos.x) ** 2 + (this.y - playerPos.y) ** 2);
    const canSeePlayer = mapSystem.checkLineOfSight(this.x, this.y, playerPos.x, playerPos.y);
    const now = performance.now();

    // Update animation time
    this.animationTime += dt;
    
    // Update attack animation
    if (this.isAttacking) {
      this.attackAnimationTime += dt;
      if (this.attackAnimationTime > 0.8) { // Attack animation lasts 0.8s to make it more noticeable
        this.isAttacking = false;
        this.attackAnimationTime = 0;
      }
    }

    // State machine
    switch (this.state) {
      case 'patrol':
        this.updatePatrolState(dt, playerPos, distToPlayer, canSeePlayer);
        break;
      case 'chase':
        this.updateChaseState(dt, playerPos, distToPlayer, canSeePlayer);
        break;
      case 'attack':
        this.updateAttackState(dt, playerPos, distToPlayer, now);
        break;
    }
  }

  // Patrol state
  updatePatrolState(dt, playerPos, distToPlayer, canSeePlayer) {
    // Patrol behavior
    const distToTarget = Math.sqrt(
      (this.x - this.patrolTarget.x) ** 2 + 
      (this.y - this.patrolTarget.y) ** 2
    );
    
    if (distToTarget < 0.5) {
      // Switch patrol target
      this.patrolTarget = {
        x: 3 + Math.random() * (mapSystem.width - 6),
        y: 3 + Math.random() * (mapSystem.height - 6)
      };
    } else {
      // Move towards patrol target
      const dx = this.patrolTarget.x - this.x;
      const dy = this.patrolTarget.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      this.dirX = dx / dist;
      this.dirY = dy / dist;
      
      const newX = this.x + this.dirX * this.speed * 0.5 * dt;
      const newY = this.y + this.dirY * this.speed * 0.5 * dt;
      
      if (mapSystem.isEmpty(newX, this.y)) this.x = newX;
      if (mapSystem.isEmpty(this.x, newY)) this.y = newY;
    }
    
    // Detect player
    if (distToPlayer < this.detectionRange && canSeePlayer) {
      this.state = 'chase';
      this.lastSeen = { x: playerPos.x, y: playerPos.y };
      this.alertness = 100;
    }
  }

  // Chase state
  updateChaseState(dt, playerPos, distToPlayer, canSeePlayer) {
    // Update last seen player position
    if (canSeePlayer && distToPlayer < this.detectionRange * 1.5) {
      this.lastSeen = { x: playerPos.x, y: playerPos.y };
      this.alertness = 100;
    } else {
      this.alertness -= dt * 20;
      if (this.alertness <= 0) {
        this.state = 'patrol';
        return;
      }
    }
    
    // Move towards player
    const dx = this.lastSeen.x - this.x;
    const dy = this.lastSeen.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < this.attackRange) {
      this.state = 'attack';
    } else {
      this.dirX = dx / dist;
      this.dirY = dy / dist;
      
      const newX = this.x + this.dirX * this.speed * dt;
      const newY = this.y + this.dirY * this.speed * dt;
      
      if (mapSystem.isEmpty(newX, this.y)) this.x = newX;
      if (mapSystem.isEmpty(this.x, newY)) this.y = newY;
    }
  }

  // Attack state
  updateAttackState(dt, playerPos, distToPlayer, now) {
    if (distToPlayer > this.attackRange * 1.2) {
      this.state = 'chase';
    } else if (now - this.lastAttack > this.attackCooldown) {
      // Attack player
      const damage = GAME_CONFIG.monster.attackDamage;
      const isDead = playerRef.takeDamage(damage);
      
      this.lastAttack = now;
      this.isAttacking = true;
      this.attackAnimationTime = 0;
      
      // Play player hit sound effect
      audioSystem.playSound('player_hit', { volume: 0.6 });

      // Trigger screen shake effect
      if (gameEngineRef) {
        gameEngineRef.triggerScreenShake(15, 0.3, { isAlarm: false }); // Intensity 15, duration 0.3s
      }
    }
  }

  // Teleport monster to a specified location
  teleport() {
    if (this.teleportDest) {
      this.x = this.teleportDest.x;
      this.y = this.teleportDest.y;
      // Reset patrol target to near the new location
      this.patrolTarget = {
        x: this.teleportDest.x + (Math.random() * 4 - 2),
        y: this.teleportDest.y + (Math.random() * 4 - 2)
      };
      // Reset state
      this.state = 'patrol';
      this.alertness = 0;
    }
  }
}

export class MonsterSystem {
  constructor() {
    this.monsters = [];
    this.hasTeleported = false; // Used to track if teleport has already been triggered
    this.reset();
  }

  // Reset monster system
  reset() {
    this.monsters = INITIAL_MONSTERS.map(config => new Monster(config));
    this.hasTeleported = false;
  }

  // Update all monsters
  update(dt) {
    this.monsters.forEach(monster => monster.update(dt));
  }

  // Get all monsters
  getAllMonsters() {
    return this.monsters;
  }

  // Get the number of alive monsters
  getAliveCount() {
    return this.monsters.filter(monster => monster.isAlive()).length;
  }

  // Check if all monsters are dead
  areAllDead() {
    return this.monsters.every(monster => !monster.isAlive());
  }

  // Check and trigger monster teleport
  checkTeleportTrigger(playerX, playerY) {
    if (this.hasTeleported) return; // If already triggered, do not trigger again

    const triggerPos = GAME_CONFIG.monster.teleportTrigger;
    const triggerRange = GAME_CONFIG.monster.teleportRange;
    
    // Check if the player is within the range of any trigger point
    const isInTriggerArea = triggerPos.some(pos => {
      const dx = playerX - pos.x;
      const dy = playerY - pos.y;
      const distToTrigger = Math.sqrt(dx * dx + dy * dy);
      return distToTrigger <= triggerRange;
    });
    
    if (isInTriggerArea) {
      // Pause the game, show alert dialog
      gameEngineRef.gameState = 'paused';
      
      // Show alert dialog
      uiSystem.showAlertDialog("Warning! Mass enemy teleportation detected!", () => {
        // When the player presses space to continue:
        gameEngineRef.gameState = 'playing';
        
        // Trigger teleport for all monsters
        this.monsters.forEach(monster => {
          if (monster.teleportDest && monster.isAlive()) {
            monster.teleport();
          }
        });
        
        // Trigger alarm shake effect
        if (gameEngineRef) {
          gameEngineRef.triggerAlarmShake(3); // 3-pulse alarm shake effect
        }
        
        this.hasTeleported = true;
      });
    }
  }

  // Attack monsters in a specified range
  attackMonstersInRange(playerX, playerY, playerDirX, playerDirY, range, damage) {
    let hitCount = 0;
    
    this.monsters.forEach(monster => {
      if (!monster.isAlive()) return;
      
      // Calculate distance to monster
      const dx = monster.x - playerX;
      const dy = monster.y - playerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= range) {
        // Check if it's in front of the player (general direction)
        const dotProduct = dx * playerDirX + dy * playerDirY;
        if (dotProduct > 0) {
          monster.takeDamage(damage);
          hitCount++;
        }
      }
    });
    
    return hitCount;
  }
}

export const monsterSystem = new MonsterSystem();
