import * as THREE from 'three';
import { RaceTrackSystem } from '../systems/RaceTrackSystem.js';
import { NPCRacerSystem } from '../systems/NPCRacerSystem.js';
import { RacePlayerSystem } from '../systems/RacePlayerSystem.js';
import { RaceObstacleSystem } from '../systems/RaceObstacleSystem.js';

export class RaceMode {
    constructor(game) {
        this.game = game;
        this.trackSystem = null;
        this.npcSystem = null;
        this.racePlayerSystem = null;
        this.obstacleSystem = null;
        this.playerData = null;
        this.raceStarted = false;
        this.raceFinished = false;
        this.startTime = 0;
        this.finishTime = 0;
        this.countdown = 3;
        this.countdownActive = false;
        this.countdownTimer = 0;
        this.finishOrder = [];
        this.previousHeight = 0.8; // Lifted to prevent clipping
        
        this.init();
    }
    
    init() {
        // COMPLETELY clear the scene except for lights
        const lightsToKeep = [];
        this.game.scene.children.forEach(child => {
            if (child.isLight) {
                lightsToKeep.push(child);
            } else {
                // Remove everything else
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
        
        this.game.scene.children = lightsToKeep;
        
        // Hide tunnel player system
        if (this.game.playerSystem && this.game.playerSystem.player) {
            this.game.playerSystem.player.visible = false;
        }
        
        // Set racing environment
        this.game.scene.fog = new THREE.Fog(0x0a0a2e, 100, 300);
        this.game.scene.background = new THREE.Color(0x000000);
        
        // Create race-specific player system
        this.racePlayerSystem = new RacePlayerSystem(this.game.scene);
        
        // Create race track
        this.trackSystem = new RaceTrackSystem(this.game.scene);
        
        // Create NPCs
        this.npcSystem = new NPCRacerSystem(this.game.scene, this.trackSystem);
        
        // Set up NPC finish callback
        this.npcSystem.onNPCFinish = (npc) => this.handleNPCFinish(npc);
        
        // Create obstacles
        this.obstacleSystem = new RaceObstacleSystem(this.game.scene, this.trackSystem);
        
        // Connect obstacle system to NPCs for AI avoidance
        this.npcSystem.obstacleSystem = this.obstacleSystem;
        
        // Initialize player data with racing controls
        const startPos = this.trackSystem.getStartPosition(0).clone();
        startPos.y = 0.8; // Lift car above ground to prevent clipping through floor
        
        this.playerData = {
            position: startPos,
            rotation: 0,
            speed: 0,
            verticalVelocity: 0,  // For jump physics
            isAirborne: false,     // Track if car is in the air
            finished: false,
            finishPosition: 0
        };
        
        // Position race player at start
        this.racePlayerSystem.updatePosition(this.playerData.position, this.playerData.rotation);
        
        // Position camera behind player car
        this.game.camera.position.set(
            this.playerData.position.x,
            this.playerData.position.y + 6,
            this.playerData.position.z + 18
        );
        // Look at the car
        this.game.camera.lookAt(this.playerData.position);
    }
    
    start() {
        // Start countdown
        this.countdownActive = true;
        this.countdown = 3;
        this.showCountdown(3);
        // Initialize traffic lights to RED
        this.trackSystem.updateTrafficLights(3);
    }
    
    showCountdown(number) {
        // Show countdown on screen
        const countdownEl = document.getElementById('countdownDisplay');
        if (countdownEl) {
            countdownEl.style.display = 'block';
            countdownEl.textContent = number > 0 ? number : 'GO!';
            countdownEl.style.fontSize = '8rem';
            countdownEl.style.animation = 'countdownPulse 1s ease-out';
        }
    }
    
    hideCountdown() {
        const countdownEl = document.getElementById('countdownDisplay');
        if (countdownEl) {
            countdownEl.style.display = 'none';
        }
    }
    
    update(deltaTime) {
        // Stop updating if race is finished
        if (this.raceFinished) {
            console.log('Race finished, stopping updates');
            return;
        }
        
        // Handle countdown
        if (this.countdownActive) {
            this.countdownTimer += deltaTime;
            if (this.countdownTimer >= 1.0) {
                this.countdownTimer = 0;
                this.countdown--;

                if (this.countdown > 0) {
                    this.showCountdown(this.countdown);
                    // Update traffic lights to match countdown
                    this.trackSystem.updateTrafficLights(this.countdown);
                } else if (this.countdown === 0) {
                    this.showCountdown(0); // Show "GO!"
                    this.raceStarted = true;
                    this.startTime = Date.now();
                    // Update traffic lights to GREEN (GO!)
                    this.trackSystem.updateTrafficLights(0);
                    setTimeout(() => this.hideCountdown(), 1000);
                } else {
                    this.countdownActive = false;
                }
            }

            // Update camera during countdown
            this.updateCamera();
            return;
        }

        if (!this.raceStarted) return;
        
        // Get input for racing controls
        const input = this.game.inputSystem.getInput();
        
        // Racing controls: W/S for forward/backward, A/D for steering
        const acceleration = 30; // Forward/backward acceleration
        const maxSpeed = this.playerSpeedBoostActive ? 60 : 40;
        const turnSpeed = 2.5; // Steering speed
        const friction = 0.95; // Slow down over time
        
        // Forward/Backward (W/S or Up/Down)
        if (input.y > 0) { // W or Up - Forward
            this.playerData.speed += acceleration * deltaTime;
        } else if (input.y < 0) { // S or Down - Backward
            this.playerData.speed -= acceleration * deltaTime * 0.5; // Slower reverse
        } else {
            // Apply friction when no input
            this.playerData.speed *= friction;
        }
        
        // Clamp speed
        this.playerData.speed = Math.max(-maxSpeed * 0.5, Math.min(maxSpeed, this.playerData.speed));
        
        // Steering (A/D or Left/Right) - only works when moving
        if (Math.abs(this.playerData.speed) > 1) {
            if (input.x < 0) { // A or Left
                this.playerData.rotation += turnSpeed * deltaTime * (this.playerData.speed / maxSpeed);
            } else if (input.x > 0) { // D or Right
                this.playerData.rotation -= turnSpeed * deltaTime * (this.playerData.speed / maxSpeed);
            }
        }
        
        // Update player position based on rotation and speed
        const moveX = Math.sin(this.playerData.rotation) * this.playerData.speed * deltaTime;
        const moveZ = Math.cos(this.playerData.rotation) * this.playerData.speed * deltaTime;
        
        const newX = this.playerData.position.x + moveX;
        const newZ = this.playerData.position.z + moveZ;
        
        // Check obstacle collision BEFORE updating position
        const obstacleCollision = this.obstacleSystem.checkCollision(
            new THREE.Vector3(newX, this.playerData.position.y, newZ),
            { x: moveX, z: moveZ }
        );
        
        if (obstacleCollision.hit) {
            // Push car away from obstacle forcefully to prevent getting stuck
            this.playerData.position.x += obstacleCollision.x * 0.3; // Push away
            this.playerData.position.z += obstacleCollision.z * 0.3;
            this.playerData.speed *= 0.3; // Slow down significantly
            console.log('💥 Hit obstacle!');
            // Play obstacle hit sound
            this.game.audioSystem.playObstacleHitSound();
        } else {
            // Check track boundaries - prevent driving off track
            if (this.trackSystem.trackBounds) {
                const { box } = this.trackSystem.trackBounds;
                const margin = 1; // Stay 1 unit away from edge (tight to red walls)
                
                // Clamp position to track bounds
                this.playerData.position.x = Math.max(box.min.x + margin, Math.min(box.max.x - margin, newX));
                this.playerData.position.z = Math.max(box.min.z + margin, Math.min(box.max.z - margin, newZ));
            } else {
                this.playerData.position.x = newX;
                this.playerData.position.z = newZ;
            }
        }
        
        // ===== RAMP PHYSICS - Smooth momentum-based physics =====
        const gravity = -15; // Gravity pulling car down (reduced for smoother arc)
        const groundLevel = 0.2; // Normal car height on ground (lifted to prevent clipping)
        
        // Store previous height to calculate vertical velocity from ramp slope
        if (!this.previousHeight) this.previousHeight = groundLevel;
        
        // Get the height the car should be at based on ramp position
        const rampHeight = this.trackSystem.getRampHeight(this.playerData.position.z);
        
        // Calculate the change in height (slope) to determine vertical velocity
        const heightChange = (rampHeight - this.previousHeight) / deltaTime;
        
        // Check if car just left the ramp (height is decreasing and we're past the peak)
        const isLeavingRamp = rampHeight < this.previousHeight && this.playerData.position.z > this.trackSystem.rampZ;
        
        // If not airborne, follow the ramp surface
        if (!this.playerData.isAirborne) {
            this.playerData.position.y = rampHeight;
            
            // Inherit vertical velocity from ramp slope
            this.playerData.verticalVelocity = heightChange;
            
            // Become airborne when leaving the ramp with upward momentum + LAUNCH BOOST
            if (isLeavingRamp && this.playerData.verticalVelocity < -1) {
                this.playerData.isAirborne = true;
                // Add launch boost for bigger jump!
                const launchBoost = 8; // Extra upward velocity
                this.playerData.verticalVelocity = Math.abs(this.playerData.verticalVelocity) * 0.5 + launchBoost;
                console.log('🚗 LAUNCH! Velocity:', this.playerData.verticalVelocity.toFixed(2));
            }
        }
        
        // Apply gravity and vertical movement when airborne
        if (this.playerData.isAirborne) {
            this.playerData.verticalVelocity += gravity * deltaTime;
            this.playerData.position.y += this.playerData.verticalVelocity * deltaTime;
            
            // Land back on ground or ramp
            const targetHeight = this.trackSystem.getRampHeight(this.playerData.position.z);
            if (this.playerData.position.y <= targetHeight) {
                this.playerData.position.y = targetHeight;
                this.playerData.verticalVelocity = 0;
                this.playerData.isAirborne = false;
                console.log('🚗 Landed!');
            }
        }
        
        // Store current height for next frame
        this.previousHeight = rampHeight;
        
        // Update race player mesh
        this.racePlayerSystem.updatePosition(this.playerData.position, this.playerData.rotation);
        
        // Update NPCs
        try {
            this.npcSystem.update(deltaTime);
        } catch (error) {
            console.error('NPC update error:', error);
        }
        
        // Check if player crossed finish line
        try {
            const raceCompleted = this.trackSystem.checkCheckpoint(
                this.racePlayerSystem.getPosition(),
                this.playerData
            );
            
            // Check if player finished
            if (raceCompleted && !this.playerData.finished) {
                this.playerData.finished = true;
                this.finishTime = Date.now();
                
                // Play race finish sound
                this.game.audioSystem.playRaceFinishSound();
                
                // Hide player car
                if (this.racePlayerSystem && this.racePlayerSystem.carModel) {
                    this.racePlayerSystem.carModel.visible = false;
                }
                
                // Add player to finish order
                this.handlePlayerFinish();
                
                this.checkRaceFinished();
            }
        } catch (error) {
            console.error('Error checking finish line:', error);
        }
        
        // Update camera
        try {
            this.updateCamera();
        } catch (error) {
            console.error('Camera update error:', error);
        }
    }
    
    updateCamera() {
        // Camera follows behind the car
        const playerPos = this.playerData.position;
        const playerRot = this.playerData.rotation;
        
        const cameraDistance = 12;  // Closer to car (was 18)
        const cameraHeight = 4;     // Lower camera (was 6)
        
        // Position camera behind car based on car's rotation
        const cameraX = playerPos.x - Math.sin(playerRot) * cameraDistance;
        const cameraZ = playerPos.z - Math.cos(playerRot) * cameraDistance;
        
        this.game.camera.position.x = cameraX;
        this.game.camera.position.y = playerPos.y + cameraHeight;
        this.game.camera.position.z = cameraZ;
        
        // Look at the car
        this.game.camera.lookAt(playerPos.x, playerPos.y + 0.5, playerPos.z);
    }
    
    getCurrentPosition() {
        // Calculate player's current position in race based on Z position
        let position = 1;
        
        const npcs = this.npcSystem.getNPCs();
        for (const npc of npcs) {
            // Further along the road (higher Z) = ahead
            if (npc.position.z > this.playerData.position.z) {
                position++;
            }
        }
        
        return position;
    }
    
    getProgress() {
        // Calculate progress as percentage of road completed
        if (!this.trackSystem.trackBounds || !this.trackSystem.finishLineZ) return 0;
        
        const startZ = this.trackSystem.trackBounds.box.min.z;
        const finishZ = this.trackSystem.finishLineZ; // Use actual finish line position
        const currentZ = this.playerData.position.z;
        
        // Progress from start to finish line (not to end of track)
        const progress = ((currentZ - startZ) / (finishZ - startZ)) * 100;
        return Math.max(0, Math.min(100, progress)); // Clamp between 0-100
    }
    
    checkRaceFinished() {
        // Only check once
        if (this.raceFinished) return;
        
        const npcs = this.npcSystem.getNPCs();
        
        // Show results when player finishes (don't wait for NPCs)
        if (this.playerData.finished) {
            this.raceFinished = true;
            this.playerData.finishPosition = this.getCurrentPosition();
            
            // Small delay before showing results
            setTimeout(() => {
                this.showResults();
            }, 500);
        }
    }
    
    handleNPCFinish(npc) {
        // Add NPC to finish order
        const finishPosition = this.finishOrder.length + 1;
        npc.finishPosition = finishPosition;
        this.finishOrder.push({ name: npc.name, position: finishPosition, isPlayer: false });
        
        // Show announcement
        this.showFinishAnnouncement(`${npc.name} finished ${this.getOrdinal(finishPosition)}!`, npc.color);
    }
    
    handlePlayerFinish() {
        // Add player to finish order
        const finishPosition = this.finishOrder.length + 1;
        this.playerData.finishPosition = finishPosition;
        this.finishOrder.push({ name: 'You', position: finishPosition, isPlayer: true });
        
        // Show announcement
        this.showFinishAnnouncement(`You finished ${this.getOrdinal(finishPosition)}!`, 0x0066cc);
    }
    
    showFinishAnnouncement(message, color) {
        // Create or get the announcement container
        let container = document.getElementById('finishAnnouncementContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'finishAnnouncementContainer';
            container.style.position = 'fixed';
            container.style.top = '100px';
            container.style.right = '20px';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '10px';
            container.style.zIndex = '9999';
            container.style.maxWidth = '300px';
            document.body.appendChild(container);
        }
        
        // Create announcement element
        const announcement = document.createElement('div');
        announcement.style.padding = '15px 25px';
        announcement.style.backgroundColor = `#${color.toString(16).padStart(6, '0')}`;
        announcement.style.color = 'white';
        announcement.style.fontSize = '1.2rem';
        announcement.style.fontWeight = 'bold';
        announcement.style.borderRadius = '8px';
        announcement.style.textAlign = 'center';
        announcement.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5)';
        announcement.style.opacity = '0';
        announcement.style.transform = 'translateX(50px)';
        announcement.style.transition = 'all 0.3s ease-out';
        announcement.textContent = message;
        
        container.appendChild(announcement);
        
        // Fade in animation
        setTimeout(() => {
            announcement.style.opacity = '1';
            announcement.style.transform = 'translateX(0)';
        }, 10);
        
        // Fade out and remove after 3 seconds
        setTimeout(() => {
            announcement.style.opacity = '0';
            announcement.style.transform = 'translateX(50px)';
            setTimeout(() => {
                announcement.remove();
                // Remove container if empty
                if (container.children.length === 0) {
                    container.remove();
                }
            }, 300);
        }, 3000);
    }
    
    getOrdinal(n) {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }
    
    showResults() {
        const raceTime = ((this.finishTime - this.startTime) / 1000).toFixed(2);
        this.game.uiSystem.showRaceResults(this.playerData.finishPosition, raceTime);
    }
    
    cleanup() {
        console.log('Cleaning up race mode...');
        
        // Clean up race-specific systems
        if (this.npcSystem) {
            this.npcSystem.reset();
        }
        if (this.racePlayerSystem) {
            this.racePlayerSystem.cleanup();
        }
        if (this.obstacleSystem) {
            this.obstacleSystem.reset();
        }
        
        // Clear the entire scene (tunnel will be recreated when switching back)
        const objectsToRemove = [];
        this.game.scene.children.forEach((object) => {
            // Keep only lights
            if (!object.isLight) {
                objectsToRemove.push(object);
            }
        });
        
        objectsToRemove.forEach(obj => {
            this.game.scene.remove(obj);
            // Dispose of geometries and materials
            obj.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        });
        
        console.log('Removed', objectsToRemove.length, 'race objects from scene');
        
        // Show tunnel player again
        if (this.game.playerSystem && this.game.playerSystem.player) {
            this.game.playerSystem.player.visible = true;
        }
        
        // Reset scene fog for tunnel mode
        this.game.scene.fog = new THREE.Fog(0x000033, 10, 100);
        this.game.scene.background = new THREE.Color(0x000033);
    }
}

