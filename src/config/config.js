// config.js - Simplified game configuration

export const GAME_CONFIG = {
  // Screen dimensions
  width: window.innerWidth,
  height: window.innerHeight,
  
  // Player settings
  player: {
    initialHP: 200,
    maxHP: 200,
    normalSpeed: 1.6,
    runSpeed: 3.0,
    initialPosition: { x: 2.4, y: 2.5 },
    initialDirection: { x: 0.707, y: -0.707 },
    initialPlane: { x: 0.707, y: 0.707 },
    attackRange: 1.5,
    attackDamage: 30,
    attackCooldown: 600, // ms
    fireball: {
            speed: 10,  // Map units per second
            size: 0.2,  // Map unit radius
            life: 500,    // Lifespan in seconds
            damage: 20,
            spawnDistance: 1.0,  // Distance in front of caster to spawn fireball
            offsetX: 0.0,        // Additional X offset (positive = right, negative = left)
            offsetY: 0.0,         // Additional Y offset (useful for different caster heights or positions)
            // Define lighting properties for the fireball
            light: {
                radius: 7.0,          // Effective radius of the light source (in map cells)
                intensity: 1.3,       // Light intensity (> 1 creates overexposure, < 1 is dimmer)
                color: { r: 255, g: 165, b: 0 } // Light color (here it's orange-yellow)
            }
          }
  },

  // Monster settings
  monster: {
    defaultHP: 75,
    defaultSpeed: 1.8,
    detectionRange: 8,
    attackRange: 2,
    attackCooldown: 1500,
    attackDamage: 20,
    size: 1.5, // Monster's collision radius
    teleportTrigger: [{ x: 31.5, y: 35 }, { x: 19, y: 38.5 }], // Player reaching these coordinates triggers teleport
    teleportRange: 1 // Trigger range
  },
  
  // Minimap settings
  miniMap: {
    size: 150,
    padding: 15,
    exploreRadius: 2
  },
  
  // Rendering settings
  rendering: {
    rotationSensitivity: 0.0005,
    cameraFollowSpeed: 0.05
  }
};

// Map data
export const RAW_MAP = [
  "11111111111111111111111111111111111111111",
  "1.....1...........1.....1...............1",
  "1...........1.....1.....................1",
  "1.....1.....1.....1...........1.........1",
  "11111111111111.111111..111111111111....11",
  "1....1111.1111....1.....1.....1.........1",
  "1....1.......1....1.....1.11111.1111....1",
  "1....1.......1..........1.1........1....1",
  "11..11..22...111111111111.1........1.1111",
  "1.......22........1.....1.1...33...1....1",
  "1....1.......1....1.....1.....33........1",
  "1....1.......1....1.......1........1....1",
  "1111.........111111111111.1........111.11",
  "1.....111.1111....1.....1.11111.1111....1",
  "1...........1.....1.....1.....1.........1",
  "1.....1.....1.....1.....1.....1.........1",
  "11111111111.111111111.11111..111111111111",
  "1.....1.................1.....1.........1",
  "1.....1.................1.....1.........1",
  "1...........1.................1.........1",
  "1....111111111111111111.111111111.1111111",
  "1.....1.....1.....1.....1.....1.........1",
  "1...........1.....1.....1.....1.........1",
  "1.....1.....1.....1.....1...............1",
  "1....11111.111111111111111111111111.11111",
  "1.....1.....1.....1.....1.....1.........1",
  "1.....1.11111.11111.....1..1111.1111....1",
  "1.......1........11.....1..1.......1....1",
  "1111111.1........11111111111.......111111",
  "1.....1.1........11........1..33...1....1",
  "1.....1.1..22....11...........33........1",
  "1.....1....22..............1.......1....1",
  "111111111........111.1111111.......111111",
  "1....1..1........11.....1..1.......1....1",
  "1....1..1........11.....1..1111.1111....1",
  "1....1..11111.11111.....1...............1",
  "111.11..11111.11111111111...............1",
  "1.....1.....1.....1.....................1",
  "1.......................................1",
  "1.....1.....1.....1.....................1",
  "11111111111111111111111111111111111111111"
];

export const MAP_WIDTH = RAW_MAP[0].length;
export const MAP_HEIGHT = RAW_MAP.length;

// Convert character map to number map
export const GAME_MAP = RAW_MAP.map(row => 
  [...row].map(char => char === '.' ? 0 : +char || 1)
);

// Initial monster configuration
export const INITIAL_MONSTERS = [
  // { x: 2.5, y:  2.5, dirX:  1, dirY:  0, hp: 70,  maxHP: 70,  speed: 1.0, state: 'patrol', detectionRange:  8, attackRange: 2.0, patrolTarget: { x: 12, y:  7 }, alertness: 0, lastAttack: 0, attackCooldown: 1500, teleportDest: { x: 38, y: 38 } },
  { x: 11.5, y:  7.5, dirX:  1, dirY:  0, hp: 70,  maxHP: 70,  speed: 1.0, state: 'patrol', detectionRange:  8, attackRange: 2.0, patrolTarget: { x: 12, y:  7 }, alertness: 0, lastAttack: 0, attackCooldown: 1500, teleportDest: { x: 38, y: 38 } },
  { x: 32.5, y: 11.5, dirX: -1, dirY:  0, hp: 85,  maxHP: 85,  speed: 1.2, state: 'patrol', detectionRange:  9, attackRange: 2.5, patrolTarget: { x: 27, y: 11 }, alertness: 0, lastAttack: 0, attackCooldown: 1700, teleportDest: { x: 38, y: 37 } },
  { x:  9.5, y: 28.5, dirX:  0, dirY:  1, hp: 100, maxHP: 100, speed: 1.4, state: 'patrol', detectionRange: 10, attackRange: 2.0, patrolTarget: { x:  9, y: 34 }, alertness: 0, lastAttack: 0, attackCooldown: 1900, teleportDest: { x: 37, y: 37 } },
  { x: 34.5, y: 28.5, dirX:  0, dirY: -1, hp: 70,  maxHP: 70,  speed: 1.6, state: 'patrol', detectionRange: 11, attackRange: 2.5, patrolTarget: { x: 34, y: 27 }, alertness: 0, lastAttack: 0, attackCooldown: 2100, teleportDest: { x: 36, y: 38 } },

  { x: 20.5, y:  5.5, dirX:  1, dirY:  0, hp: 85,  maxHP: 85,  speed: 1.0, state: 'patrol', detectionRange: 12, attackRange: 2.0, patrolTarget: { x: 23, y:  5 }, alertness: 0, lastAttack: 0, attackCooldown: 1500, teleportDest: { x: 34, y: 38 } },
  { x: 20.5, y: 15.5, dirX: -1, dirY:  0, hp: 100, maxHP: 100, speed: 1.2, state: 'patrol', detectionRange:  8, attackRange: 2.5, patrolTarget: { x: 19, y: 15 }, alertness: 0, lastAttack: 0, attackCooldown: 1700, teleportDest: { x: 32, y: 37 } },
  { x: 20.5, y: 25.5, dirX:  0, dirY:  1, hp: 70,  maxHP: 70,  speed: 1.4, state: 'patrol', detectionRange:  9, attackRange: 2.0, patrolTarget: { x: 20, y: 27 }, alertness: 0, lastAttack: 0, attackCooldown: 1900, teleportDest: { x: 30, y: 37 } },
  { x: 20.5, y: 35.5, dirX:  0, dirY: -1, hp: 85,  maxHP: 85,  speed: 1.6, state: 'patrol', detectionRange: 10, attackRange: 2.5, patrolTarget: { x: 20, y: 29 }, alertness: 0, lastAttack: 0, attackCooldown: 2100, teleportDest: { x: 30, y: 38 } },

  { x:  4.5, y: 24.5, dirX:  1, dirY:  0, hp: 100, maxHP: 100, speed: 1.0, state: 'patrol', detectionRange: 11, attackRange: 2.0, patrolTarget: { x:  4, y: 24 }, alertness: 0, lastAttack: 0, attackCooldown: 1500, teleportDest: { x: 34, y: 30 } },
  { x: 10.5, y: 14.5, dirX: -1, dirY:  0, hp: 70,  maxHP: 70,  speed: 1.2, state: 'patrol', detectionRange: 12, attackRange: 2.5, patrolTarget: { x:  4, y: 14 }, alertness: 0, lastAttack: 0, attackCooldown: 1700, teleportDest: { x: 32, y: 30 } },
  { x: 10.5, y: 34.5, dirX:  0, dirY:  1, hp: 85,  maxHP: 85,  speed: 1.4, state: 'patrol', detectionRange:  8, attackRange: 2.0, patrolTarget: { x: 10, y: 34 }, alertness: 0, lastAttack: 0, attackCooldown: 1900, teleportDest: { x: 30, y: 32 } },
  { x: 33.5, y: 12.5, dirX:  0, dirY: -1, hp: 100, maxHP: 100, speed: 1.6, state: 'patrol', detectionRange:  9, attackRange: 2.5, patrolTarget: { x: 33, y:  7 }, alertness: 0, lastAttack: 0, attackCooldown: 2100, teleportDest: { x: 29, y: 29 } },

  { x: 35.5, y: 30.5, dirX:  1, dirY:  0, hp: 70,  maxHP: 70,  speed: 1.0, state: 'patrol', detectionRange: 10, attackRange: 2.0, patrolTarget: { x: 39, y: 30 }, alertness: 0, lastAttack: 0, attackCooldown: 1500, teleportDest: { x: 30, y: 38 } },
  { x:  4.5, y: 30.5, dirX: -1, dirY:  0, hp: 85,  maxHP: 85,  speed: 1.2, state: 'patrol', detectionRange: 11, attackRange: 2.5, patrolTarget: { x:  1, y: 30 }, alertness: 0, lastAttack: 0, attackCooldown: 1700, teleportDest: { x: 30, y: 37 } },
  { x: 21.5, y: 18.5, dirX:  0, dirY:  1, hp: 100, maxHP: 100, speed: 1.4, state: 'patrol', detectionRange: 12, attackRange: 1.0, patrolTarget: { x: 21, y: 19 }, alertness: 0, lastAttack: 0, attackCooldown: 1900, teleportDest: { x: 15, y: 38 } },
  { x: 16.5, y:  5.5, dirX:  0, dirY: -1, hp: 70,  maxHP: 70,  speed: 1.6, state: 'patrol', detectionRange:  8, attackRange: 1.5, patrolTarget: { x: 16, y:  5 }, alertness: 0, lastAttack: 0, attackCooldown: 2100, teleportDest: { x: 14, y: 37 } },

  { x: 32.5, y: 30.5, dirX:  1, dirY:  0, hp: 85,  maxHP: 85,  speed: 1.0, state: 'patrol', detectionRange:  9, attackRange: 2.0, patrolTarget: { x: 38, y: 30 }, alertness: 0, lastAttack: 0, attackCooldown: 1500, teleportDest: { x: 25, y: 37 } },
  { x:  2.5, y: 30.5, dirX: -1, dirY:  0, hp: 100, maxHP: 100, speed: 1.2, state: 'patrol', detectionRange: 10, attackRange: 2.5, patrolTarget: { x:  1, y: 30 }, alertness: 0, lastAttack: 0, attackCooldown: 1700, teleportDest: { x: 23, y: 38.5 } },
];
