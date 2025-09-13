// monster-renderer.js - Monster appearance and animation rendering system
import { parseColor } from '../utils/color.js';
export class MonsterRenderer {
  constructor() {
    // Monster appearance configuration
    this.monsterConfigs = {
      blackCat: {
        bodyColor: '#000000',
        eyeColor: '#ff8800',
        chaseEyeColor: '#ff0000',
        noseColor: '#660000',
        whiskerColor: '#cccccc',
        earInnerColor: '#800000',
        mouthColor: '#330000',
        animations: {
          attack: { duration: 0.8, lungeIntensity: 0.1 },
          move: { bobAmount: 2, frequency: 8 }
        }
      }
    };
  }

  // Main monster rendering entry point
  renderMonster(context, monster, startX, startY, width, height, transformY, zBuffer, lightInfo = { intensity: 1, color: {r: 255, g: 255, b: 255} }) {
    const healthPercent = monster.hp / monster.maxHP;
    const animState = monster.getAnimationState();
    
    // Calculate animation effects
    const animatedPosition = this.calculateAnimatedPosition(
      startX, startY, width, height, animState, monster
    );
    
    // Draw stripe by vertical pixel stripe
    for (let stripe = Math.floor(animatedPosition.x); 
         stripe < Math.floor(animatedPosition.x + animatedPosition.width); 
         stripe++) {
      
      if (stripe >= 0 && stripe < zBuffer.length && transformY < zBuffer[stripe]) {
        const relativeX = stripe - animatedPosition.x;
        const xRatio = relativeX / animatedPosition.width;
        
        this.drawMonsterStripe(
          context, stripe, animatedPosition.y, animatedPosition.x,
          animatedPosition.width, animatedPosition.height, xRatio,
          monster, healthPercent, animState, lightInfo
        );
      }
    }
    
    // Draw health bar
    this.drawHealthBar(context, animatedPosition, monster, healthPercent);
  }
  /**
   * Applies lighting effects to a color string.
   * @param {string} colorStr - The original color string 
   * @param {object} lightInfo - The lighting information object { intensity, color: {r, g, b} }
   * @returns {string} - The new 'rgb(...)' color string after applying lighting.
   */
  /**
   * Applies lighting effects to a color string to calculate the final rendered color.
   * (This function is now very concise, focusing on lighting calculations)
   * @param {string} colorStr - The original color string (e.g., '#ff8800').
   * @param {object} lightInfo - The light source information object { intensity, color: {r, g, b} }.
   * @returns {string} - Returns a new color string in 'rgb(r, g, b)' format after applying lighting effects.
   */
  applyLightToColor(colorStr, lightInfo) {
    // 1. Directly use the parseColor function imported from color.js
    const baseColor = parseColor(colorStr);
    
    // 2. Core lighting calculation logic (unchanged)
    const finalR = Math.min(255, Math.floor(baseColor.r * lightInfo.intensity * (lightInfo.color.r / 255)));
    const finalG = Math.min(255, Math.floor(baseColor.g * lightInfo.intensity * (lightInfo.color.g / 255)));
    const finalB = Math.min(255, Math.floor(baseColor.b * lightInfo.intensity * (lightInfo.color.b / 255)));
    
    // 3. Return the calculation result
    return `rgb(${finalR}, ${finalG}, ${finalB})`;
  }
  // Calculate animated position and size
  calculateAnimatedPosition(startX, startY, width, height, animState, monster) {
    let animStartX = startX;
    let animStartY = startY;
    let animWidth = width;
    let animHeight = height;
    
    // Attack animation effect
    if (animState.isAttacking) {
      const attackConfig = this.monsterConfigs.blackCat.animations.attack;
      const attackProgress = animState.attackProgress;
      
      if (attackProgress > 0.2) {
        const lungeIntensity = Math.sin((attackProgress - 0.2) / 0.8 * Math.PI) * attackConfig.lungeIntensity;
        
        // Calculate lunge direction
        let directionToPlayer = this.calculatePlayerDirection(monster, startX, width);
        
        // Position and size adjustment
        animStartX -= width * lungeIntensity * directionToPlayer;
        animWidth *= (1 + lungeIntensity * 0.08);
        animHeight *= (1 + lungeIntensity * 0.05);
        animStartY -= height * lungeIntensity * 0.05;
      }
      
      // Ensure the monster does not move out of the visible range
      animStartX = Math.max(-width * 0.3, Math.min(800 + width * 0.3, animStartX)); // Assuming canvas width is 800
      animWidth = Math.max(width * 0.8, animWidth);
      animHeight = Math.max(height * 0.8, animHeight);
    }
    
    // Movement animation - slight bobbing
    if (animState.isMoving && !animState.isAttacking) {
      const moveConfig = this.monsterConfigs.blackCat.animations.move;
      const bobAmount = Math.sin(animState.animationTime * moveConfig.frequency) * moveConfig.bobAmount;
      animStartY += bobAmount;
    }
    
    return {
      x: animStartX,
      y: animStartY,
      width: animWidth,
      height: animHeight
    };
  }

  // Calculate player direction
  calculatePlayerDirection(monster, startX, width) {
    if (monster.lastSeen) {
      return monster.lastSeen.x > monster.x ? 1 : -1;
    } else {
      const screenCenter = 400; // Assuming half of canvas width 800
      const monsterScreenX = startX + width / 2;
      return monsterScreenX < screenCenter ? 1 : -1;
    }
  }

  // Draw a single vertical stripe of the monster
  drawMonsterStripe(context, stripe, yStart, startX, width, height, xRatio, monster, healthPercent, animState, lightInfo) {
    const config = this.monsterConfigs.blackCat;
    
    // 1. Color Calculation Phase (centralized processing)
    // --- Determine the "base" color for each part ---
    let bodyBaseColor = healthPercent > 0.5 ? config.bodyColor : '#1a0000';
    if (animState.isAttacking) {
      bodyBaseColor = this.calculateAttackBodyColor(animState.attackProgress);
    }

    let eyeBaseColor = config.eyeColor;
    if (monster.state === 'chase' || monster.state === 'attack') {
      eyeBaseColor = config.chaseEyeColor;
    }
    if (animState.isAttacking) {
      eyeBaseColor = this.calculateAttackEyeColor(animState.attackProgress);
    }
    
    const earOuterBaseColor = '#000000'; // Outer ear is fixed to black
    const teethBaseColor = '#ffffff';    // Teeth are fixed to white

    // --- Use applyLightToColor to calculate the "final" color ---
    const finalBodyColor = this.applyLightToColor(bodyBaseColor, lightInfo);
    const finalEyeColor = this.applyLightToColor(eyeBaseColor, lightInfo);
    const finalNoseColor = this.applyLightToColor(config.noseColor, lightInfo);
    const finalWhiskerColor = this.applyLightToColor(config.whiskerColor, lightInfo);
    const finalEarOuterColor = this.applyLightToColor(earOuterBaseColor, lightInfo);
    const finalEarInnerColor = this.applyLightToColor(config.earInnerColor, lightInfo);
    const finalMouthColor = this.applyLightToColor(config.mouthColor, lightInfo);
    const finalTeethColor = this.applyLightToColor(teethBaseColor, lightInfo);
    const finalPupilColor = this.applyLightToColor('#000000', lightInfo); // Pupil color is also affected by light

    // 2. Drawing Phase (pass the calculated final colors)
    this.drawBody(context, stripe, yStart, height, xRatio, finalBodyColor);
    this.drawHead(context, stripe, yStart, height, xRatio, finalBodyColor);
    this.drawEars(context, stripe, yStart, height, xRatio, finalEarOuterColor, finalEarInnerColor);
    this.drawEyes(context, stripe, yStart, height, xRatio, finalEyeColor, finalPupilColor);
    this.drawNose(context, stripe, yStart, height, xRatio, finalNoseColor);
    this.drawMouth(context, stripe, yStart, height, xRatio, monster, animState, finalMouthColor, finalTeethColor);
    this.drawWhiskers(context, stripe, yStart, height, xRatio, finalWhiskerColor);
  }

  // Calculate body color during attack (this function is unchanged)
  calculateAttackBodyColor(attackProgress) {
    if (attackProgress > 0.3) {
      const intensity = Math.sin((attackProgress - 0.3) * 10) * 0.3 + 0.7;
      const red = Math.floor(30 * intensity);
      return `rgb(${red}, 0, 0)`;
    }
    return '#000000';
  }

  // Draw body (function signature and logic unchanged)
  drawBody(context, stripe, yStart, height, xRatio, bodyColor) {
    if (xRatio >= 0.15 && xRatio <= 0.85) {
      context.fillStyle = bodyColor;
      context.fillRect(stripe, yStart + height * 0.6, 1, height * 0.4);
    }
  }

  // Draw head (function signature and logic unchanged)
  drawHead(context, stripe, yStart, height, xRatio, bodyColor) {
    if (xRatio >= 0.05 && xRatio <= 0.95) {
      context.fillStyle = bodyColor;
      context.fillRect(stripe, yStart, 1, height * 0.6);
    }
  }

  // Draw ears (Modified: receives final colors)
  drawEars(context, stripe, yStart, height, xRatio, outerColor, innerColor) {
    const earHeight = height * 0.25;
    
    // Left ear
    if (xRatio >= 0.15 && xRatio <= 0.3) {
      this.drawSingleEar(context, stripe, yStart, earHeight, xRatio, 0.15, 0.15, outerColor, innerColor);
    }
    
    // Right ear
    if (xRatio >= 0.7 && xRatio <= 0.85) {
      this.drawSingleEar(context, stripe, yStart, earHeight, xRatio, 0.7, 0.15, outerColor, innerColor);
    }
  }

  // Draw a single ear (Modified: receives final colors)
  drawSingleEar(context, stripe, yStart, earHeight, xRatio, earStart, earWidth, outerColor, innerColor) {
    const earProgress = (xRatio - earStart) / earWidth;
    const triangleHeight = Math.sin(earProgress * Math.PI) * earHeight;
    
    if (triangleHeight > 0) {
      context.fillStyle = outerColor;
      context.fillRect(stripe, yStart - triangleHeight * 0.3, 1, triangleHeight);
      
      // Inner red part of the ear
      if (earProgress > 0.3 && earProgress < 0.7) {
        const innerHeight = triangleHeight * 0.6;
        context.fillStyle = innerColor;
        context.fillRect(stripe, yStart - triangleHeight * 0.2, 1, innerHeight);
      }
    }
  }

  // Draw eyes (Modified: receives final colors)
  drawEyes(context, stripe, yStart, height, xRatio, eyeColor, pupilColor) {
    const eyeSize = Math.max(3, Math.floor(height * 0.18));
    const eyeY = yStart + height * 0.25;
    
    // Left eye
    this.drawSingleEye(context, stripe, eyeY, eyeSize, xRatio, 0.24, 0.12, 0.29, 0.32, eyeColor, pupilColor);
    
    // Right eye
    this.drawSingleEye(context, stripe, eyeY, eyeSize, xRatio, 0.64, 0.12, 0.69, 0.72, eyeColor, pupilColor);
  }

  // Draw a single eye (Modified: receives final colors)
  drawSingleEye(context, stripe, eyeY, eyeSize, xRatio, eyeStart, eyeWidth, pupilStart, pupilEnd, eyeColor, pupilColor) {
    if (xRatio >= eyeStart && xRatio <= eyeStart + eyeWidth) {
      context.fillStyle = eyeColor;
      context.fillRect(stripe, eyeY, 1, eyeSize);
      
      // Pupil
      if (xRatio >= pupilStart && xRatio <= pupilEnd) {
        context.fillStyle = pupilColor;
        context.fillRect(stripe, eyeY, 1, eyeSize);
      }
    }
  }

  // Calculate eye color during attack (this function is unchanged)
  calculateAttackEyeColor(attackProgress) {
    if (attackProgress > 0.3) {
      const flashIntensity = Math.sin((attackProgress - 0.3) * 20) * 0.5 + 0.5;
      const red = Math.floor(255 * flashIntensity);
      const green = Math.floor(100 * flashIntensity);
      return `rgb(${red}, ${green}, 0)`;
    }
    return '#ff8800';
  }

  // Draw nose (Modified: receives final color)
  drawNose(context, stripe, yStart, height, xRatio, noseColor) {
    if (xRatio >= 0.45 && xRatio <= 0.55) {
      const noseY = yStart + height * 0.45;
      context.fillStyle = noseColor;
      context.fillRect(stripe, noseY, 1, height * 0.05);
    }
  }

  // Draw mouth (Modified: receives final colors)
  drawMouth(context, stripe, yStart, height, xRatio, monster, animState, mouthColor, teethColor) {
    if (monster.state === 'chase' || monster.state === 'attack') {
      const mouthY = yStart + height * 0.55;
      const mouthHeight = height * 0.15;
      
      let mouthLeft = 0.4;
      let mouthRight = 0.6;
      if (animState.isAttacking && animState.attackProgress > 0.3) {
        mouthLeft = 0.38;
        mouthRight = 0.62;
      }
      
      if (xRatio >= mouthLeft && xRatio <= mouthRight) {
        context.fillStyle = mouthColor;
        context.fillRect(stripe, mouthY, 1, mouthHeight);
      }
      
      this.drawTeeth(context, stripe, mouthY, mouthHeight, xRatio, teethColor);
    }
  }

  // Draw teeth (Modified: receives final color)
  drawTeeth(context, stripe, mouthY, mouthHeight, xRatio, teethColor) {
    const toothHeight = mouthHeight * 0.8;
    
    if ((xRatio >= 0.42 && xRatio <= 0.44) || (xRatio >= 0.56 && xRatio <= 0.58)) {
      context.fillStyle = teethColor;
      context.fillRect(stripe, mouthY, 1, toothHeight);
    }
    
    if (xRatio >= 0.48 && xRatio <= 0.52) {
      context.fillStyle = teethColor;
      context.fillRect(stripe, mouthY, 1, toothHeight * 0.6);
    }
  }

  // Draw whiskers (Modified: receives final color)
  drawWhiskers(context, stripe, yStart, height, xRatio, whiskerColor) {
    const whiskerStartY1 = yStart + height * 0.4;
    const whiskerStartY2 = yStart + height * 0.45;
    const whiskerStartY3 = yStart + height * 0.5;
    const whiskerThickness = 2;
    
    if ((xRatio >= 0.10 && xRatio <= 0.24) || (xRatio >= 0.76 && xRatio <= 0.90)) {
      context.fillStyle = whiskerColor;
      context.fillRect(stripe, whiskerStartY1, 1, whiskerThickness);
      context.fillRect(stripe, whiskerStartY2, 1, whiskerThickness);
      context.fillRect(stripe, whiskerStartY3, 1, whiskerThickness);
    }
  }
    

  // Draw health bar
  drawHealthBar(context, position, monster, healthPercent) {
    if (monster.hp < monster.maxHP) {
      const barHeight = Math.max(2, Math.floor(position.height * 0.08));
      const barY = position.y - barHeight - 5;
      
      // Background
      context.fillStyle = '#400';
      context.fillRect(position.x, barY, position.width, barHeight);
      
      // Health
      context.fillStyle = '#f00';
      context.fillRect(position.x, barY, Math.floor(position.width * healthPercent), barHeight);
    }
  }
}

// Singleton instance
export const monsterRenderer = new MonsterRenderer();
