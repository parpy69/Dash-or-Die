export class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.oscillators = [];
        this.isPlaying = false;
        this.currentSpeed = 1.0;
        
        this.init();
    }
    
    init() {
        // Create Web Audio API context
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes for volume control
            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.value = 0.08; // Much quieter
            this.musicGain.connect(this.audioContext.destination);
            
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = 0.2; // Softer collision sound
            this.sfxGain.connect(this.audioContext.destination);
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }
    
    startMusic() {
        if (!this.audioContext || this.isPlaying) return;
        
        // Resume audio context (required for autoplay policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.isPlaying = true;
        this.createMusicLoop();
    }
    
    createMusicLoop() {
        if (!this.audioContext) return;
        
        // NO BASS - removed the jet engine sound
        
        // Create a soft melody line (bubble-like sound)
        const melody = this.audioContext.createOscillator();
        melody.type = 'sine'; // Sine for soft bubble sound
        melody.frequency.value = 330; // E4 - pleasant
        
        const melodyGain = this.audioContext.createGain();
        melodyGain.gain.value = 0.4; // Slightly louder since no bass
        melody.connect(melodyGain);
        melodyGain.connect(this.musicGain);
        
        // Create a soft ambient pad (also bubble-like)
        const pad = this.audioContext.createOscillator();
        pad.type = 'triangle'; // Triangle for softer sound
        pad.frequency.value = 523; // C5
        
        const padGain = this.audioContext.createGain();
        padGain.gain.value = 0.3; // Slightly louder
        pad.connect(padGain);
        padGain.connect(this.musicGain);
        
        // Add filter for pad - softer filtering
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800; // Lower cutoff for softer sound
        filter.Q.value = 0.5; // Gentler resonance
        pad.connect(filter);
        filter.connect(padGain);
        
        // Start oscillators
        melody.start();
        pad.start();
        
        this.oscillators = [
            { osc: melody, gain: melodyGain, baseFreq: 330, type: 'melody' },
            { osc: pad, gain: padGain, baseFreq: 523, type: 'pad', filter: filter }
        ];
        
        // Create rhythmic pattern
        this.createRhythm();
    }
    
    createRhythm() {
        if (!this.audioContext || !this.isPlaying) return;
        
        const now = this.audioContext.currentTime;
        const beatDuration = 0.5 / this.currentSpeed; // Faster beats with speed
        
        // NO BASS MODULATION - removed
        
        // Modulate melody - more pleasant intervals (bubble pops)
        const melodyOsc = this.oscillators.find(o => o.type === 'melody');
        if (melodyOsc) {
            const notes = [330, 370, 392, 440, 494]; // E, F#, G, A, B - major scale
            const noteIndex = Math.floor(Math.random() * notes.length);
            melodyOsc.osc.frequency.setValueAtTime(notes[noteIndex], now);
        }
        
        // Schedule next beat
        setTimeout(() => this.createRhythm(), beatDuration * 1000);
    }
    
    updateSpeed(speed) {
        if (!this.audioContext || !this.isPlaying) return;
        
        this.currentSpeed = speed;
        
        // Increase pitch and intensity with speed
        const speedMultiplier = 1 + (speed - 1) * 0.5; // Gradual pitch increase
        
        this.oscillators.forEach(oscData => {
            if (oscData.osc && oscData.osc.frequency) {
                const targetFreq = oscData.baseFreq * speedMultiplier;
                oscData.osc.frequency.linearRampToValueAtTime(
                    targetFreq,
                    this.audioContext.currentTime + 0.1
                );
            }
            
            // Increase volume with speed (more gradually)
            if (oscData.gain) {
                const baseGain = oscData.type === 'melody' ? 0.4 : 0.3; // No bass
                const targetGain = baseGain * (1 + (speed - 1) * 0.15); // Less aggressive increase
                oscData.gain.gain.linearRampToValueAtTime(
                    targetGain,
                    this.audioContext.currentTime + 0.1
                );
            }
            
            // Increase filter cutoff for pad
            if (oscData.filter && oscData.type === 'pad') {
                const targetCutoff = 1000 + (speed - 1) * 2000;
                oscData.filter.frequency.linearRampToValueAtTime(
                    targetCutoff,
                    this.audioContext.currentTime + 0.1
                );
            }
        });
        
        // Increase master volume slightly (capped lower)
        const masterVolume = 0.08 + (speed - 1) * 0.03;
        this.musicGain.gain.linearRampToValueAtTime(
            Math.min(masterVolume, 0.15), // Much lower max volume
            this.audioContext.currentTime + 0.1
        );
    }
    
    stopMusic() {
        if (!this.audioContext) return;
        
        this.isPlaying = false;
        
        // Fade out and stop oscillators
        const now = this.audioContext.currentTime;
        this.musicGain.gain.linearRampToValueAtTime(0, now + 0.5);
        
        setTimeout(() => {
            this.oscillators.forEach(oscData => {
                if (oscData.osc) {
                    try {
                        oscData.osc.stop();
                    } catch (e) {
                        // Already stopped
                    }
                }
            });
            this.oscillators = [];
            this.musicGain.gain.value = 0.08; // Reset for next play
        }, 600);
    }
    
    playCollisionSound() {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        
        // Create softer impact sound
        const noise = this.audioContext.createOscillator();
        noise.type = 'sine'; // Sine for softer impact
        noise.frequency.value = 150; // Higher pitch, less harsh
        
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.3, now); // Quieter
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2); // Shorter
        
        noise.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        
        noise.start(now);
        noise.stop(now + 0.2);
    }
}

