// map.js - Map system

import { GAME_MAP, MAP_WIDTH, MAP_HEIGHT } from '../config/config.js';

export class MapSystem {
  constructor() {
    this.map = GAME_MAP;
    this.width = MAP_WIDTH;
    this.height = MAP_HEIGHT;
    this.explored = Array(MAP_HEIGHT).fill().map(() => Array(MAP_WIDTH).fill(false));
  }

  // Check if a position is empty (passable)
  isEmpty(x, y) {
    const mapX = Math.trunc(x);
    const mapY = Math.trunc(y);
    return mapX >= 0 && mapY >= 0 && 
           mapX < this.width && mapY < this.height && 
           this.map[mapY][mapX] === 0;
  }

  // Get the value on the map
  getTile(x, y) {
    const mapX = Math.trunc(x);
    const mapY = Math.trunc(y);
    if (mapX >= 0 && mapY >= 0 && mapX < this.width && mapY < this.height) {
      return this.map[mapY][mapX];
    }
    return 1; // Treat out-of-bounds as a wall
  }

  // Update explored area
  updateExploration(playerX, playerY, radius = 2) {
    const mapX = Math.trunc(playerX);
    const mapY = Math.trunc(playerY);
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const checkX = mapX + Math.round(dx);
        const checkY = mapY + Math.round(dy);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= radius && 
            checkX >= 0 && checkX < this.width && 
            checkY >= 0 && checkY < this.height) {
          this.explored[checkY][checkX] = true;
        }
      }
    }
  }

  // Check for a clear line of sight
  checkLineOfSight(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const steps = Math.max(dx, dy) * 2;
    
    for (let i = 0; i <= steps; i++) {
      const x = x1 + (x2 - x1) * i / steps;
      const y = y1 + (y2 - y1) * i / steps;
      if (!this.isEmpty(x, y)) return false;
    }
    return true;
  }

  // Get exploration status
  isExplored(x, y) {
    if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
      return this.explored[y][x];
    }
    return false;
  }

  // Reset exploration status
  resetExploration() {
    this.explored = Array(MAP_HEIGHT).fill().map(() => Array(MAP_WIDTH).fill(false));
  }
}

export const mapSystem = new MapSystem();
