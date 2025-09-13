// input.js - Input control system

export class InputSystem {
  constructor() {
    this.keys = {};
    this.mouseEnabled = false;
    this.callbacks = {
      attack: [],
      mousemove: [],
      continue: []  // For continuing dialogs
    };
    
    this.setupEventListeners();
  }

  // Set up event listeners
  setupEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // Mouse events
    document.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left-click attack
        this.triggerCallbacks('attack');
      }
    });

    // Mouse movement (when pointer is locked)
    document.addEventListener('mousemove', (e) => {
      if (this.mouseEnabled && document.pointerLockElement) {
        this.triggerCallbacks('mousemove', {
          movementX: e.movementX,
          movementY: e.movementY
        });
      }
    });

    // Pointer lock change
    document.addEventListener('pointerlockchange', () => {
      this.mouseEnabled = !!document.pointerLockElement;
    });
  }

  // Request pointer lock
  requestPointerLock(canvas) {
    canvas.addEventListener('click', () => {
      canvas.requestPointerLock();
    });
  }

  // Check if a key is pressed
  isKeyPressed(key) {
    return !!this.keys[key.toLowerCase()];
  }

  // Check movement keys
  getMovementInput() {
    return {
      w: this.isKeyPressed('w'),
      s: this.isKeyPressed('s'),
      a: this.isKeyPressed('a'),
      d: this.isKeyPressed('d'),
      shift: this.isKeyPressed('shift'),
      jump: this.isKeyPressed(' '), // Spacebar to jump
      attack: false // Attack is handled by mouse down
    };
  }

  // Register callback functions
  onAttack(callback) {
    this.callbacks.attack.push(callback);
  }

  onMouseMove(callback) {
    this.callbacks.mousemove.push(callback);
  }

  // Trigger callback functions
  triggerCallbacks(event, data = null) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Callback execution error:`, error);
        }
      });
    }
  }

  // Update input state (called every frame)
  update() {
    const movement = this.getMovementInput();
    
    // Check for continuous attack key press
    if (movement.attack) {
      this.triggerCallbacks('attack');
    }
    
    return movement;
  }
}

export const inputSystem = new InputSystem();
