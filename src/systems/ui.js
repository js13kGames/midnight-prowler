// ui.js - UI system and minimap

import { GAME_CONFIG } from '../config/config.js';
import { player } from '../game/player.js';
import { monsterSystem } from '../game/monsters.js';
import { mapSystem } from '../game/map.js';

export class UISystem {
  constructor() {
    this.uiElement = document.getElementById('ui');
    this.showingDialog = false;
    this.dialogMessage = '';
    this.dialogCallback = null;
    this.redOverlayAlpha = 0;
    this.fadeOutSpeed = 0.02;
  }

  // Show alert dialog
  showAlertDialog(message, callback) {
    this.showingDialog = true;
    this.dialogMessage = message;
    this.dialogCallback = callback;
    this.redOverlayAlpha = 0.3; // Initial red overlay alpha value
  }

  // Check if user presses spacebar
  checkInput(inputSystem) {
    if (this.showingDialog && inputSystem.keys[' ']) {
      if (this.dialogCallback) {
        this.dialogCallback();
      }
      this.showingDialog = false;
      this.dialogMessage = '';
      this.dialogCallback = null;
    }
  }

  // Update UI information
  update(context, canvas, inputSystem) {
    // Check input
    if (inputSystem) {
      this.checkInput(inputSystem);
    }

    if (!this.uiElement) return;

    const stats = {
      playerHP: player.hp,
      playerMaxHP: player.maxHP,
      aliveMonsters: monsterSystem.getAliveCount(),
      totalMonsters: monsterSystem.getAllMonsters().length
    };

    this.uiElement.innerHTML = `
      <div>HP: ${stats.playerHP}/${stats.playerMaxHP}</div>
      <div>Monster: ${stats.aliveMonsters}/${stats.totalMonsters}</div>
    `;

    // Render red overlay and dialog box
    if (this.redOverlayAlpha > 0) {
      context.fillStyle = `rgba(255, 0, 0, ${this.redOverlayAlpha})`;
      context.fillRect(0, 0, canvas.width, canvas.height);
      this.redOverlayAlpha = Math.max(0, this.redOverlayAlpha - this.fadeOutSpeed);
    }

    // Render dialog box
    if (this.showingDialog) {
      const dialogWidth = canvas.width * 0.6;
      const dialogHeight = canvas.height * 0.2;
      const dialogX = (canvas.width - dialogWidth) / 2;
      const dialogY = (canvas.height - dialogHeight) / 2;

      // Draw dialog background
      context.fillStyle = 'rgba(0, 0, 0, 0.8)';
      context.fillRect(dialogX, dialogY, dialogWidth, dialogHeight);
      context.strokeStyle = '#ff0000';
      context.lineWidth = 2;
      context.strokeRect(dialogX, dialogY, dialogWidth, dialogHeight);

      // Draw text
      context.fillStyle = '#ffffff';
      context.font = '20px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(this.dialogMessage, canvas.width / 2, canvas.height / 2 - 10);
      context.font = '16px Arial';
      context.fillText('Press Space to continue...', canvas.width / 2, canvas.height / 2 + 20);
    }
    if (this.showingDialog) {
      const dialogWidth = canvas.width * 0.6;
      const dialogHeight = canvas.height * 0.2;
      const dialogX = (canvas.width - dialogWidth) / 2;
      const dialogY = (canvas.height - dialogHeight) / 2;

      // Draw dialog background
      context.fillStyle = 'rgba(0, 0, 0, 0.8)';
      context.fillRect(dialogX, dialogY, dialogWidth, dialogHeight);
      context.strokeStyle = '#ff0000';
      context.lineWidth = 2;
      context.strokeRect(dialogX, dialogY, dialogWidth, dialogHeight);

      // Draw text
      context.fillStyle = '#ffffff';
      context.font = '20px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(this.dialogMessage, canvas.width / 2, canvas.height / 2 - 10);
      context.font = '16px Arial';
      context.fillText('Press Space to continue...', canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  // Render crosshair
  renderCrosshair(context, canvas) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const size = 10;

    context.strokeStyle = '#ffffff';
    context.lineWidth = 2;
    context.beginPath();

    // Vertical line
    context.moveTo(centerX, centerY - size);
    context.lineTo(centerX, centerY + size);

    // Horizontal line
    context.moveTo(centerX - size, centerY);
    context.lineTo(centerX + size, centerY);

    context.stroke();
  }

  // Render minimap
  renderMiniMap(context, canvas) {
    const mapSize = GAME_CONFIG.miniMap.size;
    const padding = GAME_CONFIG.miniMap.padding;
    const mapX = canvas.width - mapSize - padding;
    const mapY = padding;
    const cellSize = mapSize / Math.max(mapSystem.width, mapSystem.height);

    // Draw minimap background
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(mapX - 2, mapY - 2, mapSize + 4, mapSize + 4);

    // Draw map cells
    for (let y = 0; y < mapSystem.height; y++) {
      for (let x = 0; x < mapSystem.width; x++) {
        const cellX = mapX + x * cellSize;
        const cellY = mapY + y * cellSize;

        if (mapSystem.isExplored(x, y)) {
          const tileType = mapSystem.getTile(x + 0.5, y + 0.5);

          if (tileType === 0) {
            context.fillStyle = 'rgba(200, 200, 200, 0.8)'; // Empty space
          } else if (tileType === 1) {
            context.fillStyle = 'rgba(100, 100, 100, 0.9)'; // Wall
          } else if (tileType === 2) {
            context.fillStyle = 'rgba(120, 180, 170, 0.9)'; // Special wall
          } else if (tileType === 3) {
            context.fillStyle = 'rgba(200, 120, 110, 0.9)'; // Another special wall
          }
        } else {
          context.fillStyle = 'rgba(0, 0, 0, 0.9)'; // Unexplored area
        }

        context.fillRect(cellX, cellY, cellSize, cellSize);
      }
    }

    // Draw player position
    const playerPos = player.getPosition();
    const playerMapX = mapX + playerPos.x * cellSize - 2;
    const playerMapY = mapY + playerPos.y * cellSize - 2;
    context.fillStyle = '#00ff00';
    context.fillRect(playerMapX, playerMapY, 4, 4);

    // Draw monster positions
    monsterSystem.getAllMonsters().forEach(monster => {
      if (monster.hp > 0) {
        const monsterMapX = mapX + monster.x * cellSize - 2;
        const monsterMapY = mapY + monster.y * cellSize - 2;
        context.fillStyle = (monster.state === 'chase' || monster.state === 'attack') ? '#ff0000' : '#ff8800';
        context.fillRect(monsterMapX, monsterMapY, 4, 4);
      }
    });

    // Draw player direction
    const playerDir = player.getDirection();
    const dirLength = 8;
    context.strokeStyle = '#00ff00';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(playerMapX + 2, playerMapY + 2);
    context.lineTo(
      playerMapX + 2 + playerDir.x * dirLength,
      playerMapY + 2 + playerDir.y * dirLength
    );
    context.stroke();
  }

  // Show game finish screen
  showGameFinish(opts = {}) {
    const { stats, isSuccess } = opts;
    
    // If already exists, remove it first
    if (document.getElementById('gFin')) {
      document.getElementById('gFin').remove();
    }
    const style = document.createElement('style');
    style.id = 'gFin';
    style.textContent = `
    #gOverlay{
      position:fixed; inset:0; z-index:1000; color:#fff; overflow:hidden;
      display:flex; align-items:center; justify-content:center;
      background: radial-gradient(1200px 800px at 50% 120%, #0a0d14 0%, #070a12 60%, #04060b 100%);
      animation: go-fade .35s ease-out both;
    }
    /* Vignette + Scanlines */
    #gOverlay::before{
      content:""; position:absolute; inset:0; pointer-events:none;
      background:
        radial-gradient(70% 60% at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,.45) 100%),
        repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0 2px, rgba(0,0,0,0) 2px 4px);
      mix-blend-mode: normal;
    }


    /* Center glass card */
    .go-card{
      width:min(560px,86vw); padding:28px 36px 24px;
      background: rgba(10,12,18,.55);
      border:2px solid ${isSuccess ? 'rgba(62, 220, 62, 0.28)' : 'rgba(255,70,70,.28)'};
      border-radius:16px;
      text-align:center;
      animation: go-shake .7s cubic-bezier(.36,.07,.19,.97) 1;
      z-index: 100;
    }

    /* Title: White text + red/blue offset glitch */
    .go-title{
      font: 800 42px/1.1 "Noto Sans TC", system-ui, sans-serif;
      letter-spacing:.08em;
    }
    
    .go-sub{ margin-top:8px; color:#cdd3e1; opacity:.85; font-size:14px; }
    .go-stats{
      margin:14px auto 0; display:flex; gap:14px; justify-content:center; flex-wrap:wrap;
      color:#dcdfe8; opacity:.9; font-size:13px;
    }
    .go-stat{ padding:6px 10px; border:1px solid rgba(255,255,255,.08); border-radius:10px; background:rgba(255,255,255,.04); }

    .go-cta{ margin-top:16px; color:#ffd7d2; font-size:14px; opacity:.95; }
    .key{
      display:inline-block; min-width:1.6em; padding:.1em .55em; margin-right:.35em;
      border-radius:8px; border:1px solid ${isSuccess ? 'rgba(62, 220, 62, 0.45)' : 'rgba(255,70,70,.45)'};
      background:linear-gradient(180deg,   ${isSuccess ? 'rgba(62, 220, 62, 0.25)' : 'rgba(255,120,110,.22)'}, rgba(255,60,50,.12));
      font-weight:700; color:#fff;
    }

    /* Falling cinder particles */
    .go-cinder{
      position:absolute; top:-8vh; width:6px; height:6px; border-radius:50%;
      background: radial-gradient(circle at 35% 35%, ${isSuccess? '#f9f9f9 0%, #ffffff 40%, #fdfdfd 70%, rgba(255, 0, 0, 0)' : '#ffd0c3 0%, #ff7a65 40%, #ff3a2a 70%, rgba(255,0,0,0)'} 100%);
      filter:saturate(1.1);
      animation: go-fall var(--dur) linear var(--delay) infinite;
      opacity:.85;
    }

    @keyframes go-fade{ from{opacity:0} to{opacity:1} }
    @keyframes go-shake{
      10%, 90% { transform: translate3d(-1px, 0, 0) }
      20%, 80% { transform: translate3d( 2px, 0, 0) }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0) }
      40%, 60% { transform: translate3d( 4px, 0, 0) }
    }
    @keyframes go-glitch{
      0%{ clip-path: inset(0 0 82% 0) } 10%{ clip-path: inset(10% 0 60% 0) }
      20%{ clip-path: inset(85% 0 0 0) } 30%{ clip-path: inset(40% 0 30% 0) }
      40%{ clip-path: inset(0 0 65% 0) } 50%{ clip-path: inset(20% 0 40% 0) }
      60%{ clip-path: inset(70% 0 5% 0) } 70%{ clip-path: inset(45% 0 25% 0) }
      80%{ clip-path: inset(5% 0 75% 0) } 90%{ clip-path: inset(25% 0 35% 0) }
      100%{ clip-path: inset(0 0 82% 0) }
    }
    @keyframes go-fall{
      0%   { transform: translateY(-10vh) translateX(0) scale(.7); opacity:0 }
      10%  { opacity:.9 }
      100% { transform: translateY(120vh) translateX(var(--drift)) scale(1.15); opacity:0 }
    }
    `;
    document.head.appendChild(style);


    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'gOverlay';

    // Card
    const card = document.createElement('div');
    card.className = 'go-card';

    if (isSuccess) {
      card.innerHTML = `
    <div class="go-title">Victory</div>
    <div class="go-sub">The night is guarded.</div>`;
    }
    else {
      card.innerHTML = `
    <div class="go-title" data-text="Game Over">Game Over</div>
    <div class="go-sub">This round failed to hold onto the night.</div>`;
    }
    card.innerHTML += `
    ${stats ? `<div class="go-stats">
      ${stats.time ? `<div class="go-stat">Survival Time: ${stats.time}</div>` : ``}
      ${stats.kills != null ? `<div class="go-stat">Kills: ${stats.kills}</div>` : ``}
      ${stats.score != null ? `<div class="go-stat">Score: ${stats.score}</div>` : ``}
    </div>` : ``}
    <div class="go-cta"><span class="key">R</span>Restart</div>
  `;
    overlay.appendChild(card);

    // Particles
    const DOTS = 28;
    for (let i = 0; i < DOTS; i++) {
      const p = document.createElement('i');
      p.className = 'go-cinder';
      const left = Math.random() * 100;
      const drift = (Math.random() * 40 - 20) + 'vw';
      const dur = (6 + Math.random() * 7).toFixed(2) + 's';
      const delay = (-Math.random() * 7).toFixed(2) + 's'; // Negative delay: particles are present on entry
      p.style.left = left + 'vw';
      p.style.setProperty('--drift', drift);
      p.style.setProperty('--dur', dur);
      p.style.setProperty('--delay', delay);
      overlay.appendChild(p);
    }

    // Interaction
    function cleanup() {
      window.removeEventListener('keydown', onKey);
      overlay.remove();
    }
    function onKey(e) {
      if (e.key === 'r' || e.key === 'R') { cleanup(); if (typeof onRestart === 'function') onRestart(); }
    }
    window.addEventListener('keydown', onKey);

    document.body.appendChild(overlay);
    return overlay;
  }

  // Show alert dialog
  showAlertDialog(message, onContinue) {
    // Inject CSS once
    if (!document.getElementById('alert-dialog-css')) {
      const style = document.createElement('style');
      style.id = 'alert-dialog-css';
      style.textContent = `
        #olay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          color: #fff;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(1200px 800px at 50% 120%, #0a0d1480 0%, #070a1280 60%, #04060b80 100%);
          animation: alert-fade-in 0.3s ease-out both;
        }

        .alert-card {
          position: relative;
          width: min(460px, 80vw);
          padding: 24px 32px 20px;
          background: rgba(10, 12, 18, 0.95);
          border: 2px solid rgba(255, 50, 50, 0.4);
          border-radius: 16px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6), inset 0 0 80px rgba(255, 70, 80, 0.1);
          backdrop-filter: blur(6px);
          text-align: center;
          animation: alert-pulse 0.5s ease-out both;
        }

        .alert-message {
          font: 700 20px/1.4 "Noto Sans TC", system-ui, sans-serif;
          color: #fff;
          text-shadow: 0 0 20px rgba(255, 80, 80, 0.4);
          margin-bottom: 20px;
        }

        .alert-cta {
          color: #ffd7d2;
          font-size: 14px;
          opacity: 0.95;
        }

        .key {
          display: inline-block;
          min-width: 1.6em;
          padding: 0.1em 0.55em;
          margin-right: 0.35em;
          border-radius: 8px;
          border: 1px solid rgba(255, 140, 140, 0.45);
          background: linear-gradient(180deg, rgba(255, 120, 110, 0.25), rgba(255, 60, 50, 0.15));
          box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.25), 0 0 12px rgba(255, 80, 60, 0.25);
          font-weight: 700;
          color: #fff;
        }

        @keyframes alert-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes alert-pulse {
          0% { transform: scale(0.96); opacity: 0; }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'olay';

    // Create card
    const card = document.createElement('div');
    card.className = 'alert-card';
    card.innerHTML = `
      <div class="alert-message">${message}</div>
      <div class="alert-cta"><span class="key">Space</span>Continue</div>
    `;
    overlay.appendChild(card);

    // Add event listener
    function cleanup() {
      window.removeEventListener('keydown', onKey);
      overlay.remove();
    }

    function onKey(e) {
      if (e.code === 'Space') {
        cleanup();
        if (typeof onContinue === 'function') {
          onContinue();
        }
      }
    }

    window.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    return overlay;
  }

  // Remove overlay
  removeOverlay(overlay) {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }
}

export const uiSystem = new UISystem();
