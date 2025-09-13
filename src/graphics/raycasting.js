// raycasting.js - Raycasting rendering engine (scene rendering)

import { mapSystem } from '../game/map.js';
import { explosionRenderer } from './explosion-renderer.js';
import { monsterRenderer } from './monster-renderer.js';
import { fireballRenderer } from './fireball-renderer.js';

export class RaycastingRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.zBuffer = new Array(this.width);

        // Create a registry for sprite renderers
        // The key is sprite.type, and the value is the corresponding rendering function
        this.spriteRenderers = {
            'monster': monsterRenderer.renderMonster.bind(monsterRenderer),
            'fireball': fireballRenderer.renderFireball.bind(fireballRenderer),
            'explosion_particle': explosionRenderer.renderExplosionParticle.bind(explosionRenderer)
        };

        this.setupCanvas();
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        // Also reset the Z-Buffer on resize
        this.zBuffer = new Array(this.width);
        this.buildProceduralSky(); // Make the moon/star density more natural at the new height
    }

    nextPow2(n) { return 1 << Math.ceil(Math.log2(Math.max(1, n))); }

    buildProceduralSky(opts = {}) {
        const DPR = window.devicePixelRatio || 1;
        const oversampleX = opts.oversampleX ?? 2.0;      // Horizontal oversampling factor
        const oversampleY = opts.oversampleY ?? 1.2;      // Vertical oversampling factor
        const horizonRatio = this._skyHorizonRatio ?? 0.55;

        // Target size (take power of 2 for better scaling and quality)
        let texW = Math.ceil(this.width * DPR * oversampleX);
        let texH = Math.ceil(this.height * DPR * horizonRatio * oversampleY);

        // Clamp to a reasonable range
        texW = Math.min(8192, Math.max(1024, this.nextPow2(texW)));
        texH = Math.min(1024, Math.max(256, this.nextPow2(texH)));

        this._skyTexW = texW;
        this._skyTexH = texH;

        // Create off-screen canvas
        this._skyCanvas = document.createElement('canvas');
        this._skyCanvas.width = texW;
        this._skyCanvas.height = texH;
        this._skyCtx = this._skyCanvas.getContext('2d');

        const ctx = this._skyCtx;

        const g = ctx.createLinearGradient(0, 0, 0, texH);
        g.addColorStop(0, THEME.skyTop);
        g.addColorStop(1, THEME.skyBottom);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, texW, texH);


        this._skyReady = true;
    }

    drawProceduralSkySlice(player) {
        if (!this._skyReady || !this._skyCanvas) return false;

        const ctx = this.context;
        const img = this._skyCanvas;
        const texW = this._skyTexW;
        const texH = this._skyTexH;

        // Horizon height: use your original z-lift logic
        const cameraLift = Math.floor((player.z || 0) * 32);
        const horizonRatio = (this._skyHorizonRatio ?? 0.55); // Can also correspond to GAME_CONFIG.rendering.sky.horizon
        const horizon = Math.max(0, Math.min(this.height, Math.floor(this.height * horizonRatio) + cameraLift));
        const skyH = horizon | 0;
        if (skyH <= 0) return true;

        // Correctly calculate horizontal offset based on player direction.
        const yaw = Math.atan2(player.dirY || 0, player.dirX || 1);
        let u = 0.5 + (yaw / Math.PI); // Increased rotation speed by 2x
        u = u - Math.floor(u); // Take the fractional part

        const sx = Math.floor(u * texW);
        const leftW = texW - sx;
        const leftScreenW = Math.floor(this.width * (leftW / texW));

        // Left segment: sx -> right edge
        ctx.drawImage(img, sx, 0, leftW, texH, 0, 0, leftScreenW, skyH);
        // Right segment: 0 -> sx
        ctx.drawImage(img, 0, 0, sx, texH, leftScreenW, 0, this.width - leftScreenW, skyH);

        return true;
    }

    renderBackground(player = { z: 0, dirX: 1, dirY: 0 }) {
        const drewSky = this.drawProceduralSkySlice(player);

        if (!drewSky) {
            const cameraLift = Math.floor(player.z * 32);
            const horizon = Math.floor(this.height / 2 + cameraLift);

            // Sky gradient
            const skyGradient = this.context.createLinearGradient(0, 0, 0, horizon);
            skyGradient.addColorStop(0, THEME.skyTop);
            skyGradient.addColorStop(1, THEME.skyBottom);
            this.context.fillStyle = skyGradient;
            this.context.fillRect(0, 0, this.width, horizon);

        }

        // Ground gradient (shared)
        const cameraLift = Math.floor((player.z || 0) * 32);
        const baseH = Math.floor(this.height * (this._skyHorizonRatio ?? 0.55));
        const horizon = Math.max(0, Math.min(this.height, baseH + cameraLift));

        const groundGradient = this.context.createLinearGradient(0, horizon, 0, this.height);
        groundGradient.addColorStop(0, THEME.floorTop);
        groundGradient.addColorStop(1, THEME.floorBot);
        this.context.fillStyle = groundGradient;
        this.context.fillRect(0, horizon, this.width, this.height - horizon);
    }
    setupCanvas() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    /**
     * Main render function
     * @param {object} player - The player object
     * @param {Array} allSprites - An array prepared by game.js, containing all sprites to be rendered
     */
    render(player, allSprites, dynamicLights) {
        this.context.clearRect(0, 0, this.width, this.height);

        // Render background (pass player to get z)
        this.renderBackground(player);

        // Perform raycasting (walls) and fill the Z-Buffer
        this.performRaycasting(player, dynamicLights);

        // this.postVignette();

        // Render all sprite objects (monsters, fireballs, etc.)
        this.renderSprites(player, allSprites, dynamicLights);

        this._skyHorizonRatio = 0.55;   // If you want it higher, adjust to 0.6~0.65
        this.buildProceduralSky();      // Build it once first
    }

    // Screen vignette (more focused overall)
    postVignette() {
        const cx = this.width / 2, cy = this.height / 2;
        const g = this.context.createRadialGradient(cx, cy * 1.03, this.width * 0.25, cx, cy, this.width * 0.8);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.35)');
        this.context.fillStyle = g;
        this.context.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Perform raycasting algorithm (walls)
     * @param {object} player - The player object
     */
    performRaycasting(player, dynamicLights) {
        const playerPos = player.getPosition();
        const playerDir = player.getDirection();
        const playerPlane = player.getPlane();

        // Iterate over every vertical stripe on the screen
        for (let x = 0; x < this.width; x++) {
            // Calculate ray direction
            const cameraX = 2 * x / this.width - 1; // x-coordinate in camera space, range [-1, 1]
            const rayDirX = playerDir.x + playerPlane.x * cameraX;
            const rayDirY = playerDir.y + playerPlane.y * cameraX;

            // Player's position in the map
            let mapX = Math.floor(playerPos.x);
            let mapY = Math.floor(playerPos.y);

            // Distance from the ray to the next x-side or y-side
            const deltaDistX = Math.abs(1 / rayDirX);
            const deltaDistY = Math.abs(1 / rayDirY);

            let sideDistX, sideDistY;
            let stepX, stepY;

            // Calculate step and initial sideDist
            if (rayDirX < 0) {
                stepX = -1;
                sideDistX = (playerPos.x - mapX) * deltaDistX;
            } else {
                stepX = 1;
                sideDistX = (mapX + 1.0 - playerPos.x) * deltaDistX;
            }

            if (rayDirY < 0) {
                stepY = -1;
                sideDistY = (playerPos.y - mapY) * deltaDistY;
            } else {
                stepY = 1;
                sideDistY = (mapY + 1.0 - playerPos.y) * deltaDistY;
            }

            // Perform DDA algorithm
            let hit = 0;
            let side; // Determine if the ray hit an NS wall or an EW wall

            while (hit === 0) {
                // Jump to the next map square, in the x-axis or y-axis direction
                if (sideDistX < sideDistY) {
                    sideDistX += deltaDistX;
                    mapX += stepX;
                    side = 0;
                } else {
                    sideDistY += deltaDistY;
                    mapY += stepY;
                    side = 1;
                }

                // Check if the ray has hit a wall
                if (mapSystem.getTile(mapX, mapY) > 0) hit = 1;
            }

            // Calculate distance
            let perpWallDist;
            if (side === 0) {
                perpWallDist = (mapX - playerPos.x + (1 - stepX) / 2) / rayDirX;
            } else {
                perpWallDist = (mapY - playerPos.y + (1 - stepY) / 2) / rayDirY;
            }

            // Calculate line height
            const lineHeight = Math.floor(this.height / perpWallDist);

            // Calculate the lowest and highest pixel positions to fill the current stripe, adjusting the view height based on player.z
            // player.z represents jump height, convert it to a screen pixel offset
            const cameraLift = Math.floor(player.z * 32); // 32 can be adjusted for jump visual magnitude
            let drawStart = Math.floor(-lineHeight / 2 + this.height / 2 + cameraLift);
            if (drawStart < 0) drawStart = 0;
            let drawEnd = Math.floor(lineHeight / 2 + this.height / 2 + cameraLift);
            if (drawEnd >= this.height) drawEnd = this.height - 1;

            // Select wall base color (cool tone)
            const wallType = mapSystem.getTile(mapX, mapY);
            let baseHex;
            switch (wallType) {
                case 1: baseHex = THEME.wall1; break; // Dark blue-gray
                case 2: baseHex = THEME.wall2; break; // Cool gray
                case 3: baseHex = THEME.wall3; break; // Darker
                default: baseHex = THEME.wall1; break;
            }

            // Shading based on distance + moonlight + fog
            let baseRgb = hexToRgb(baseHex);
            baseRgb = shadeWithFog(baseRgb, perpWallDist);

            // Darker on the side (for shape definition)
            if (side === 1) baseRgb = mulRgb(baseRgb, 0.82);

            // 1. Define scene basic lighting parameters
            const maxDistance = 15.0; // Beyond this distance, objects approach pure black
            const ambientLight = 0.1; // Ambient light, brightness of the darkest part of the scene (0.0 to 1.0)

            // 2. Calculate basic light intensity based on distance (distance fog effect)
            let totalLightIntensity = 1.0 - (perpWallDist / maxDistance);

            // 3. Initialize light color mixer
            let accumulatedLight = { r: 0, g: 0, b: 0 };
            let dynamicContribution = 0;

            // 4. Calculate the actual world coordinates of the wall hit point
            const hitX = playerPos.x + perpWallDist * (playerDir.x + playerPlane.x * (2 * x / this.width - 1));
            const hitY = playerPos.y + perpWallDist * (playerDir.y + playerPlane.y * (2 * x / this.width - 1));

            // 5. Iterate through all dynamic light sources and accumulate their effect on this point
            if (dynamicLights && dynamicLights.length > 0) {
                dynamicLights.forEach(light => {
                    const dx = hitX - light.x;
                    const dy = hitY - light.y;
                    const distSq = dx * dx + dy * dy; // Use squared distance to avoid square root, improving performance
                    const radiusSq = light.radius * light.radius;

                    if (distSq < radiusSq) {
                        // Light intensity attenuates linearly with distance
                        const falloff = Math.pow(1 - Math.sqrt(distSq) / light.radius, 2); // Use squared falloff for a more natural effect
                        const contribution = light.intensity * falloff;

                        // Accumulate light intensity and color
                        totalLightIntensity += contribution;
                        accumulatedLight.r += light.color.r * contribution;
                        accumulatedLight.g += light.color.g * contribution;
                        accumulatedLight.b += light.color.b * contribution;
                        dynamicContribution += contribution;
                    }
                });
            }

            // 6. Calculate the final light color
            let finalLightColor = { r: 255, g: 255, b: 255 }; // Default white light
            if (dynamicContribution > 0) {
                finalLightColor.r = Math.floor(accumulatedLight.r / dynamicContribution);
                finalLightColor.g = Math.floor(accumulatedLight.g / dynamicContribution);
                finalLightColor.b = Math.floor(accumulatedLight.b / dynamicContribution);
            }

            // 7. Clamp the total light intensity to a reasonable range
            totalLightIntensity = Math.max(ambientLight, Math.min(2.0, totalLightIntensity)); // Allow slight overexposure

            // 8. Mix base color, light color, and light intensity to get the final color
            const lit = {
                r: Math.floor(baseRgb.r * totalLightIntensity * (finalLightColor.r / 255)),
                g: Math.floor(baseRgb.g * totalLightIntensity * (finalLightColor.g / 255)),
                b: Math.floor(baseRgb.b * totalLightIntensity * (finalLightColor.b / 255))
            };
            const finalColor = rgbToStr(lit);

            // Draw vertical line
            this.context.fillStyle = finalColor;
            this.context.fillRect(x, drawStart, 1, drawEnd - drawStart);

            if (drawEnd > drawStart) {
                const rim = rgbToStr(brighten(lit, 0.18));
                this.context.fillStyle = rim;
                this.context.fillRect(x, drawStart, 1, 1);
            }

            // Contact shadow between wall and ground (ambient occlusion feel)
            if (drawEnd >= 0 && drawEnd < this.height) {
                const aoAlpha = Math.min(0.35, 0.15 + perpWallDist * 0.02);
                this.context.fillStyle = `rgba(0,0,0,${aoAlpha})`;
                this.context.fillRect(x, drawEnd, 1, 1);
            }

            // Draw vertical line
            this.context.fillStyle = finalColor;
            this.context.fillRect(x, drawStart, 1, drawEnd - drawStart);

            // Store Z-buffer value for sprite rendering
            this.zBuffer[x] = perpWallDist;
        }
    }


    /**
     *  Render all sprites (monsters, fireballs, etc.)
     * @param {object} player - The player object.
     * @param {Array} allSprites - An array containing all sprites to be rendered
     */
    renderSprites(player, allSprites, dynamicLights) {
        const playerPos = player.getPosition();
        const playerDir = player.getDirection();
        const playerPlane = player.getPlane();

        // 1. Calculate the distance of each sprite from the player (for sorting)
        allSprites.forEach(sprite => {
            const dx = sprite.object.x - playerPos.x;
            const dy = sprite.object.y - playerPos.y;
            sprite.distanceSq = dx * dx + dy * dy;
        });

        // 2. Sort from far to near based on squared distance
        allSprites.sort((a, b) => b.distanceSq - a.distanceSq);

        // 3. Iterate and draw all sprites
        allSprites.forEach(sprite => {
            // Calculate sprite coordinates relative to the player
            const dx = sprite.object.x - playerPos.x;
            const dy = sprite.object.y - playerPos.y;

            // Perform view matrix transformation
            const invDet = 1.0 / (playerPlane.x * playerDir.y - playerDir.x * playerPlane.y);
            const transformX = invDet * (playerDir.y * dx - playerDir.x * dy);
            const transformY = invDet * (-playerPlane.y * dx + playerPlane.x * dy); // Depth within the view

            // Only render sprites in front of the player
            if (transformY > 0.1) {
                // Calculate the sprite's position and size on the screen
                const screenX = Math.floor(this.width / 2 * (1 + transformX / transformY));

                // Allow sprite objects to have a custom scale, default is 1
                const scale = sprite.object.scale || 1;
                const spriteHeight = Math.abs(Math.floor(this.height / (transformY * scale)));
                const spriteWidth = spriteHeight;

                // Adjust sprite vertical position based on player.z, so monsters/fireballs move during a jump
                // Adjust fireball height based on the difference between player.z and fireball.z
                let cameraLift = Math.floor(player.z * 32);
                if (sprite.type === 'fireball' && typeof sprite.object.z === 'number') {
                    // fireball.z - player.z determines the fireball's height relative to the view
                    cameraLift = Math.floor((player.z - sprite.object.z) * 32);
                }
                const drawStartY = Math.floor((this.height - spriteHeight) / 2 + cameraLift);
                const drawStartX = Math.floor(screenX - spriteWidth / 2);
                

                // 1. Calculate basic lighting at the sprite's center point (distance fog)
                const maxDistance = 15.0;
                const ambientLight = 0.1;
                let lightAtSprite = {
                    intensity: Math.max(ambientLight, 1.0 - (sprite.distanceSq / (maxDistance * maxDistance))),
                    color: { r: 255, g: 255, b: 255 }
                };

                // 2. Iterate through all dynamic light sources and accumulate their effect on the sprite
                let accumulatedLight = { r: 0, g: 0, b: 0 };
                let dynamicContribution = 0;
                if (dynamicLights && dynamicLights.length > 0) {
                    dynamicLights.forEach(light => {
                        const dx = sprite.object.x - light.x;
                        const dy = sprite.object.y - light.y;
                        const distSq = dx * dx + dy * dy;
                        const radiusSq = light.radius * light.radius;

                        if (distSq < radiusSq) {
                            const falloff = Math.pow(1 - Math.sqrt(distSq) / light.radius, 2);
                            const contribution = light.intensity * falloff;

                            lightAtSprite.intensity += contribution;
                            accumulatedLight.r += light.color.r * contribution;
                            accumulatedLight.g += light.color.g * contribution;
                            accumulatedLight.b += light.color.b * contribution;
                            dynamicContribution += contribution;
                        }
                    });
                    if (dynamicContribution > 0) {
                        lightAtSprite.color.r = Math.floor(accumulatedLight.r / dynamicContribution);
                        lightAtSprite.color.g = Math.floor(accumulatedLight.g / dynamicContribution);
                        lightAtSprite.color.b = Math.floor(accumulatedLight.b / dynamicContribution);
                    }
                }
                lightAtSprite.intensity = Math.min(2.0, lightAtSprite.intensity); // Limit max brightness

                // 4. Look up the corresponding renderer from the registry
                const renderer = this.spriteRenderers[sprite.type];

                // 5. If found, call it to perform the drawing
                if (renderer) {
                    renderer(
                        this.context,
                        sprite.object,
                        drawStartX,
                        drawStartY,
                        spriteWidth,
                        spriteHeight,
                        transformY,
                        this.zBuffer
                    );
                }
            }
        });
    }
}

export function createRaycastingRenderer(canvas) {
    return new RaycastingRenderer(canvas);
}


// ---- Moonlit Alley THEME & utils ----
const THEME = {
    skyTop: '#05070e',
    skyBottom: '#101829',
    floorTop: '#202631', // Ground near the horizon
    floorBot: '#141920', // Ground near the bottom of the screen
    fog: '#0a101c',
    wall1: '#2a2f3a', // Wall: Dark blue-gray
    wall2: '#3b4150', // Wall variant: Cool gray with a metallic touch
    wall3: '#1e232e', // Wall variant: Darker
    moonTint: { r: 60, g: 90, b: 140 } // Moonlight color tint
};

function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; }
function rgbToStr(c) { return `rgb(${c.r | 0},${c.g | 0},${c.b | 0})`; }
function lerp(a, b, t) { return a + (b - a) * t; }
function mixRgb(a, b, t) { return { r: lerp(a.r, b.r, t), g: lerp(a.g, b.g, t), b: lerp(a.b, b.b, t) }; }
function mulRgb(c, k) { return { r: c.r * k, g: c.g * k, b: c.b * k }; }
function clamp01(x) { return Math.max(0, Math.min(1, x)); }

function applyMoonTint(rgb, amt = 0.14) {
    const m = THEME.moonTint;
    return { r: rgb.r * (1 - amt) + m.r * amt, g: rgb.g * (1 - amt) + m.g * amt, b: rgb.b * (1 - amt) + m.b * amt };
}

// Distance falloff + far fog (returns the base color after moonlight tinting)
function shadeWithFog(baseRgb, dist) {
    const fog = hexToRgb(THEME.fog);

    // Darken with distance (0~0.75)
    const darkT = Math.min(0.75, dist * 0.05);
    // Far fog mix (0~0.55)
    const fogT = Math.min(0.55, dist * 0.045);

    let c = applyMoonTint(baseRgb, 0.14);   // Cool moonlight color
    c = mulRgb(c, (1 - darkT));             // Darken overall
    c = mixRgb(c, fog, fogT);               // Mix with fog
    return c;
}

function brighten(rgb, amt = 0.15) {
    return { r: rgb.r * (1 + amt), g: rgb.g * (1 + amt), b: rgb.b * (1 + amt) };
}
