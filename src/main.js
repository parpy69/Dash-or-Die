import * as THREE from 'three';
import { TunnelSystem } from './systems/TunnelSystem.js';
import { PlayerSystem } from './systems/PlayerSystem.js';
import { ObstacleSystem } from './systems/ObstacleSystem.js';
import { InputSystem } from './systems/InputSystem.js';
import { AudioSystem } from './systems/AudioSystem.js';
import { AuthSystem } from './systems/AuthSystem.js';
import { UISystem } from './ui/UISystem.js';
import { GameMode } from './modes/GameMode.js';
import { RaceMode } from './modes/RaceMode.js';

class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.tunnelSystem = null;
        this.playerSystem = null;
        this.obstacleSystem = null;
        this.inputSystem = null;
        this.audioSystem = null;
        this.authSystem = null;
        this.uiSystem = null;
        this.gameMode = null;
        this.raceMode = null;
        this.currentMode = 'endless'; // Track current mode
        
        this.isRunning = false;
        this.score = 0;
        this.distance = 0;
        this.speed = 1.0;
        this.baseSpeed = 0.2;
        this.maxSpeed = 2.0; // Cap at 10x (10 / baseSpeed / speed multiplier)
        this.speedIncrementPerSecond = 0.2; // 1x every 5 seconds (0.2 * 5 = 1.0)
        this.gameTime = 0; // Track game time
        
        this.clock = new THREE.Clock();
        
        this.init();
    }
    
    init() {
        // Setup Three.js
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000033, 10, 100);
        
        // Check WebGL support before proceeding
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            alert('WebGL is not available. Please use a modern browser like Chrome, Firefox, or Safari.');
            return;
        }
        
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 2, 5);
        
        try {
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                alpha: true,
                powerPreference: "high-performance",
                failIfMajorPerformanceCaveat: false
            });
        } catch (e) {
            console.error('WebGL initialization failed:', e);
            // Try without antialias
            try {
                this.renderer = new THREE.WebGLRenderer({ 
                    antialias: false,
                    alpha: true,
                    powerPreference: "default",
                    failIfMajorPerformanceCaveat: false
                });
            } catch (e2) {
                alert('WebGL is not supported on your browser/device. Please try a different browser or enable WebGL.');
                throw e2;
            }
        }
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio
        document.body.appendChild(this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 10, 10);
        this.scene.add(directionalLight);
        
        const pointLight = new THREE.PointLight(0xff00ff, 1, 50);
        pointLight.position.set(0, 0, -10);
        this.scene.add(pointLight);
        
        // Initialize systems
        this.tunnelSystem = new TunnelSystem(this.scene);
        this.playerSystem = new PlayerSystem(this.scene, this.camera);
        this.obstacleSystem = new ObstacleSystem(this.scene);
        this.inputSystem = new InputSystem();
        this.audioSystem = new AudioSystem();
        this.authSystem = new AuthSystem();
        this.uiSystem = new UISystem(this);
        
        // Event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
        
        // Start render loop
        this.animate();
    }
    
    cleanup() {
        // Dispose of Three.js resources
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.forceContextLoss();
        }
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }
    }
    
    startGame(mode = 'endless') {
        console.log('🎮 Starting game with mode:', mode);
        this.isRunning = true;
        this.currentMode = mode;
        this.score = 0;
        this.distance = 0;
        this.speed = 1.0;
        this.gameTime = 0;
        
        // Clean up previous race mode if exists
        if (this.raceMode) {
            console.log('🧹 Cleaning up previous race mode');
            this.raceMode.cleanup();
            this.raceMode = null;
        }
        
        if (mode === 'race') {
            try {
                console.log('🏁 Initializing race mode...');
                // Initialize race mode
                this.raceMode = new RaceMode(this);
                console.log('✅ Race mode initialized successfully');
                // Start race after a short delay (countdown could be added here)
                setTimeout(() => {
                    if (this.raceMode) {
                        console.log('🏁 Starting race countdown...');
                        this.raceMode.start();
                    }
                }, 1000);
            } catch (error) {
                console.error('❌ Error initializing race mode:', error);
            }
        } else {
            // Reset scene settings for tunnel mode
            console.log('🌀 Setting up tunnel mode...');
            this.scene.fog = new THREE.Fog(0x000033, 10, 100);
            this.scene.background = new THREE.Color(0x000033);
            
            // Reset camera for tunnel mode
            this.camera.position.set(0, 2, 5);
            this.camera.lookAt(0, 0, 0);
            
            // Reset systems for tunnel mode
            this.playerSystem.reset();
            this.obstacleSystem.reset();
            this.tunnelSystem.reset();
            
            // Set game mode
            this.gameMode = new GameMode(mode);
            console.log('✅ Tunnel mode ready!');
        }
        
        // Start music
        this.audioSystem.startMusic();
        
        this.clock.start();
    }
    
    gameOver() {
        this.isRunning = false;
        
        // Stop music and play collision sound
        this.audioSystem.stopMusic();
        this.audioSystem.playCollisionSound();
        
        // Update high score
        this.authSystem.updateHighScore(this.score);
        
        this.uiSystem.showGameOver(this.score, Math.floor(this.distance));
    }
    
    update(deltaTime) {
        if (!this.isRunning) return;
        
        if (this.currentMode === 'race' && this.raceMode) {
            // Don't update if race is finished
            if (this.raceMode.raceFinished) {
                this.isRunning = false;
                return;
            }
            
            // Race mode update - handles its own input and player movement
            this.raceMode.update(deltaTime);
            
            // Update race HUD
            const raceTime = this.raceMode.raceStarted ? (Date.now() - this.raceMode.startTime) / 1000 : 0;
            const progress = this.raceMode.getProgress();
            this.uiSystem.updateRaceHUD(
                this.raceMode.getCurrentPosition(),
                progress,
                raceTime,
                this.raceMode.playerSpeedBoostActive
            );
        } else {
            // Tunnel mode update
            this.gameTime += deltaTime;
            
            // Update speed - increases by 1x every 5 seconds
            this.speed = Math.min(1.0 + (this.gameTime * this.speedIncrementPerSecond), this.maxSpeed / this.baseSpeed);
            const currentSpeed = this.baseSpeed * this.speed;
            
            // Update distance and score
            this.distance += currentSpeed;
            this.score = Math.floor(this.distance * 10);
            
            // Get input
            const input = this.inputSystem.getInput();
            
            // Update systems
            this.playerSystem.update(input, deltaTime);
            this.tunnelSystem.update(currentSpeed);
            this.obstacleSystem.update(currentSpeed, this.speed, deltaTime);
            
            // Update audio based on speed
            this.audioSystem.updateSpeed(this.speed);
            
            // Check collisions
            if (this.obstacleSystem.checkCollision(this.playerSystem.getPosition())) {
                this.gameOver();
            }
            
            // Update camera to follow player - instant sync, no lerp
            const playerPos = this.playerSystem.getPosition();
            this.camera.position.x = playerPos.x;
            this.camera.position.y = playerPos.y + 2;
            this.camera.lookAt(playerPos.x, playerPos.y, playerPos.z - 10);
            
            // Update UI
            this.uiSystem.updateHUD(this.score, Math.floor(this.distance), this.speed, this.gameTime);
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        this.update(deltaTime);
        
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Start the game
window.game = new Game();

