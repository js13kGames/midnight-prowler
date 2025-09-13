// src/systems/audio.js

/**
 * A simple audio system for generating and playing sounds using the Web Audio API.
 */
class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.isInitialized = false;
    }

    /**
     * Initializes the AudioContext. Must be called after a user interaction (e.g., a click).
     */
    initialize() {
        if (this.isInitialized || this.audioContext) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.isInitialized = true;
            this._createSounds();
            console.log("Audio system initialized successfully.");
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.", e);
        }
    }

    /**
     * Generates the sound functions and stores them.
     */
    _createSounds() {
        this.sounds['player_hit'] = this._createPlayerHitSound.bind(this);
        this.sounds['explosion'] = this._createExplosionSound.bind(this);
    }

    /**
     * Plays a named sound.
     * @param {string} name - The name of the sound to play ('player_hit', 'explosion').
     * @param {object} [options] - Playback options.
     * @param {number} [options.volume=1.0] - The volume of the sound.
     * @param {number} [options.pitch=1.0] - The pitch multiplier.
     */
    playSound(name, { volume = 1.0, pitch = 1.0 } = {}) {
        if (!this.isInitialized || !this.sounds[name]) {
            return;
        }
        this.sounds[name]({ volume, pitch });
    }

    _createPlayerHitSound({ volume, pitch }) {
        const context = this.audioContext;
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200 * pitch, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50 * pitch, context.currentTime + 0.2);

        gainNode.gain.setValueAtTime(volume * 0.5, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.2);
    }

    _createExplosionSound({ volume, pitch }) {
        const context = this.audioContext;
        const now = context.currentTime;
        const totalDuration = 0.6;

        // --- 1. Low-end "Thump" ---
        const thumpOsc = context.createOscillator();
        thumpOsc.type = 'sine';
        thumpOsc.frequency.setValueAtTime(120 * pitch, now);
        thumpOsc.frequency.exponentialRampToValueAtTime(40 * pitch, now + 0.25);

        const thumpGain = context.createGain();
        thumpGain.gain.setValueAtTime(volume * 1.0, now);
        thumpGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        thumpOsc.connect(thumpGain).connect(context.destination);

        // --- 2. Mid-range "Crackle" (noise burst) ---
        const noiseDuration = 0.5;
        const noiseBuffer = context.createBuffer(1, context.sampleRate * noiseDuration, context.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }
        const noiseSource = context.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        const noiseFilter = context.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1500 * pitch, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(300 * pitch, now + 0.3);
        noiseFilter.Q.value = 1;

        const noiseGain = context.createGain();
        noiseGain.gain.setValueAtTime(volume * 0.6, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        noiseSource.connect(noiseFilter).connect(noiseGain).connect(context.destination);

        // --- Start and Stop ---
        thumpOsc.start(now);
        noiseSource.start(now);

        thumpOsc.stop(now + totalDuration);
        noiseSource.stop(now + noiseDuration);
    }
}

export const audioSystem = new AudioSystem();