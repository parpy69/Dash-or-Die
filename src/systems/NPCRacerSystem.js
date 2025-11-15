import * as THREE from 'three';

export class NPCRacerSystem {
    constructor(scene, trackSystem) {
        this.scene = scene;
        this.trackSystem = trackSystem;
        this.npcs = [];
        this.obstacleSystem = null; // Will be set by RaceMode
        
        // Create NPCs immediately with simple blocks
        this.createNPCs();
    }
    
    createNPCs() {
        this.colorNames = ['Red', 'Blue', 'Green', 'Yellow', 'Magenta', 'Cyan', 'Orange'];
        const colors = [
            0xff0000, // Red
            0x0000ff, // Blue
            0x00ff00, // Green
            0xffff00, // Yellow
            0xff00ff, // Magenta
            0x00ffff, // Cyan
            0xffa500, // Orange
        ];
        
        for (let i = 0; i < 7; i++) {
            // Create varied speeds - slower overall and more spread out
            // Speed range: 20-32 units/sec (slower than player's max of 40)
            const speedVariation = 20 + (i * 1.7) + Math.random() * 3;
            
            const startPos = this.trackSystem.getStartPosition(i + 1).clone();
            const npc = {
                id: i,
                name: this.colorNames[i],
                color: colors[i],
                mesh: this.createNPCMesh(colors[i]),
                position: startPos,
                startLane: startPos.x, // Store starting lane (left or right)
                speed: speedVariation,
                baseSpeed: speedVariation,
                speedBoostActive: false,
                speedBoostTimer: 0,
                verticalVelocity: 0,  // For jump physics
                isAirborne: false,     // Track if NPC is in the air
                finished: false,
                finishTime: 0,
                finishPosition: 0
            };
            
            // Stagger starting positions slightly
            const headStart = (i % 4) * 3; // 0, 3, 6, or 9 units ahead
            npc.position.z += headStart;
            
            npc.mesh.position.copy(npc.position);
            npc.mesh.position.y = 0.2; // Same height as player
            
            console.log(`NPC ${i} created at position:`, npc.position.x.toFixed(2), npc.position.y.toFixed(2), npc.position.z.toFixed(2), 'Speed:', npc.speed.toFixed(1), 'Head start:', headStart);
            
            this.npcs.push(npc);
        }
        
        console.log(`Total NPCs created: ${this.npcs.length}`);
    }
    
    createNPCMesh(color) {
        const group = new THREE.Group();
        
        // Create simple block car - bright and visible
        const carMaterial = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.5,
            metalness: 0.7,
            roughness: 0.3,
        });
        
        // Main car body
        const bodyGeometry = new THREE.BoxGeometry(2, 1, 4);
        const body = new THREE.Mesh(bodyGeometry, carMaterial);
        body.position.y = 0.5;
        group.add(body);
        
        // Roof/cabin
        const roofGeometry = new THREE.BoxGeometry(1.6, 0.8, 2);
        const roof = new THREE.Mesh(roofGeometry, carMaterial);
        roof.position.y = 1.4;
        group.add(roof);
        
        // Windows (light blue/transparent)
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.6,
            metalness: 0.9,
            roughness: 0.1,
        });
        const windowGeometry = new THREE.BoxGeometry(1.5, 0.7, 1.9);
        const windows = new THREE.Mesh(windowGeometry, windowMaterial);
        windows.position.y = 1.4;
        group.add(windows);
        
        // Wheels (black)
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.3,
            roughness: 0.8,
        });
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
        
        // Front left wheel
        const wheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel1.rotation.z = Math.PI / 2;
        wheel1.position.set(-1.1, 0.4, 1.2);
        group.add(wheel1);
        
        // Front right wheel
        const wheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel2.rotation.z = Math.PI / 2;
        wheel2.position.set(1.1, 0.4, 1.2);
        group.add(wheel2);
        
        // Back left wheel
        const wheel3 = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel3.rotation.z = Math.PI / 2;
        wheel3.position.set(-1.1, 0.4, -1.2);
        group.add(wheel3);
        
        // Back right wheel
        const wheel4 = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel4.rotation.z = Math.PI / 2;
        wheel4.position.set(1.1, 0.4, -1.2);
        group.add(wheel4);
        
        // Headlights (white)
        const headlightMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.8,
        });
        const headlightGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.1);
        
        const headlight1 = new THREE.Mesh(headlightGeometry, headlightMaterial);
        headlight1.position.set(-0.6, 0.5, 2.05);
        group.add(headlight1);
        
        const headlight2 = new THREE.Mesh(headlightGeometry, headlightMaterial);
        headlight2.position.set(0.6, 0.5, 2.05);
        group.add(headlight2);
        
        // Taillights (red)
        const taillightMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.8,
        });
        const taillightGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.1);
        
        const taillight1 = new THREE.Mesh(taillightGeometry, taillightMaterial);
        taillight1.position.set(-0.6, 0.5, -2.05);
        group.add(taillight1);
        
        const taillight2 = new THREE.Mesh(taillightGeometry, taillightMaterial);
        taillight2.position.set(0.6, 0.5, -2.05);
        group.add(taillight2);
        
        this.scene.add(group);
        console.log('Created block car for NPC, color:', color.toString(16));
        return group;
    }
    
    update(deltaTime) {
        // Safety check - don't update if deltaTime is too large (indicates freeze/pause)
        if (deltaTime > 0.5) return;
        
        // Debug: Log NPC positions occasionally
        if (!this.updateCounter) this.updateCounter = 0;
        this.updateCounter++;
        
        if (this.updateCounter % 60 === 0 && this.npcs.length > 0) {
            console.log('=== NPC DEBUG ===');
            console.log('Total NPCs:', this.npcs.length);
            console.log('NPC 0 - X:', this.npcs[0].position.x.toFixed(1), 'Y:', this.npcs[0].position.y.toFixed(1), 'Z:', this.npcs[0].position.z.toFixed(1));
            console.log('NPC 0 mesh visible:', this.npcs[0].mesh.visible, 'in scene:', this.npcs[0].mesh.parent !== null);
        }
        
        for (const npc of this.npcs) {
            if (npc.finished) continue;
            
            // Update speed boost
            if (npc.speedBoostActive) {
                npc.speedBoostTimer -= deltaTime;
                if (npc.speedBoostTimer <= 0) {
                    npc.speedBoostActive = false;
                    npc.speed = npc.baseSpeed;
                }
            }
            
            // Move straight forward along the road
            const currentSpeed = npc.speedBoostActive ? npc.speed * 1.5 : npc.speed;
            const moveZ = currentSpeed * deltaTime;
            
            // AI Obstacle Avoidance
            let targetX = npc.startLane; // Default to starting lane
            
            if (this.obstacleSystem) {
                const obstacles = this.obstacleSystem.getObstacles();
                const lookAheadDistance = 15; // How far ahead to look for obstacles
                
                // Check for obstacles ahead
                for (const obstacle of obstacles) {
                    const distanceZ = obstacle.position.z - npc.position.z;
                    const distanceX = Math.abs(obstacle.position.x - npc.position.x);
                    
                    // If obstacle is ahead and close
                    if (distanceZ > 0 && distanceZ < lookAheadDistance && distanceX < 3) {
                        // Steer away from obstacle
                        if (obstacle.position.x > npc.position.x) {
                            // Obstacle is to the right, go left
                            targetX = npc.startLane - 3;
                        } else {
                            // Obstacle is to the left, go right
                            targetX = npc.startLane + 3;
                        }
                        break; // Only avoid the closest obstacle
                    }
                }
            }
            
            // Smooth steering towards target X with swerving
            const swerve = Math.sin(Date.now() * 0.001 + npc.mesh.id) * 0.5;
            const steerSpeed = 5 * deltaTime; // How fast to steer
            npc.position.x += (targetX + swerve - npc.position.x) * steerSpeed;
            npc.position.x = Math.max(-8, Math.min(8, npc.position.x)); // Keep on road
            
            // Update Z position
            npc.position.z += moveZ;
            
            // Check for obstacle collision and push away to prevent getting stuck
            if (this.obstacleSystem) {
                const collision = this.obstacleSystem.checkCollision(npc.position, { x: 0, z: moveZ });
                if (collision.hit) {
                    // Push away from obstacle forcefully
                    npc.position.x += collision.x * 0.3;
                    npc.position.z += collision.z * 0.3;
                    npc.speed = Math.max(npc.baseSpeed * 0.5, npc.speed * 0.5); // Slow down but keep moving
                }
            }
            
            // ===== RAMP PHYSICS FOR NPCs - Smooth momentum-based =====
            const gravity = -15;
            const groundLevel = 0.2;
            
            // Store previous height for this NPC
            if (!npc.previousHeight) npc.previousHeight = groundLevel;
            
            // Get the height the NPC should be at based on ramp position
            const rampHeight = this.trackSystem.getRampHeight(npc.position.z);
            
            // Calculate the change in height (slope) to determine vertical velocity
            const heightChange = (rampHeight - npc.previousHeight) / deltaTime;
            
            // Check if NPC just left the ramp
            const isLeavingRamp = rampHeight < npc.previousHeight && npc.position.z > this.trackSystem.rampZ;
            
            // If not airborne, follow the ramp surface
            if (!npc.isAirborne) {
                npc.position.y = rampHeight;
                
                // Inherit vertical velocity from ramp slope
                npc.verticalVelocity = heightChange;
                
                // Become airborne when leaving the ramp with upward momentum + LAUNCH BOOST
                if (isLeavingRamp && npc.verticalVelocity < -1) {
                    npc.isAirborne = true;
                    // Add launch boost for bigger jump!
                    const launchBoost = 8; // Extra upward velocity
                    npc.verticalVelocity = Math.abs(npc.verticalVelocity) * 0.5 + launchBoost;
                }
            }
            
            // Apply gravity and vertical movement when airborne
            if (npc.isAirborne) {
                npc.verticalVelocity += gravity * deltaTime;
                npc.position.y += npc.verticalVelocity * deltaTime;
                
                // Land back on ground or ramp
                const targetHeight = this.trackSystem.getRampHeight(npc.position.z);
                if (npc.position.y <= targetHeight) {
                    npc.position.y = targetHeight;
                    npc.verticalVelocity = 0;
                    npc.isAirborne = false;
                }
            }
            
            // Store current height for next frame
            npc.previousHeight = rampHeight;
            
            npc.mesh.position.copy(npc.position);
            
            // Face forward (straight ahead)
            npc.mesh.rotation.y = 0;
            
            // Check if crossed finish line (only if not already finished)
            if (!npc.finished) {
                try {
                    const finished = this.trackSystem.checkCheckpoint(npc.position, npc);
                    
                    if (finished) {
                        npc.finished = true;
                        npc.finishTime = Date.now();
                        
                        // Hide the NPC car
                        npc.mesh.visible = false;
                        
                        // Notify about finish (will be handled by RaceMode)
                        if (this.onNPCFinish) {
                            this.onNPCFinish(npc);
                        }
                    }
                } catch (error) {
                    console.error('Error checking NPC checkpoint:', error);
                }
            }
        }
    }
    
    applySpeedBoost(npcIndex) {
        const npc = this.npcs[npcIndex];
        if (npc && !npc.finished) {
            npc.speedBoostActive = true;
            npc.speedBoostTimer = 3; // 3 seconds boost
            npc.speed = npc.baseSpeed * 1.5;
        }
    }
    
    getNPCs() {
        return this.npcs;
    }
    
    reset() {
        for (let i = 0; i < this.npcs.length; i++) {
            const npc = this.npcs[i];
            npc.position = this.trackSystem.getStartPosition(i + 1).clone();
            npc.mesh.position.copy(npc.position);
            npc.angle = 0;
            npc.speed = npc.baseSpeed;
            npc.currentLap = 1;
            npc.checkpointsPassed = 0;
            npc.passedCheckpoints = new Array(this.trackSystem.checkpoints.length).fill(false);
            npc.speedBoostActive = false;
            npc.speedBoostTimer = 0;
            npc.finished = false;
            npc.finishTime = 0;
        }
    }
}

