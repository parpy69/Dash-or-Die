import * as THREE from 'three';

export class PowerUpSystem {
    constructor(scene, trackSystem) {
        this.scene = scene;
        this.trackSystem = trackSystem;
        this.powerUps = [];
        this.spawnTimer = 0;
        this.spawnInterval = 5; // Spawn every 5 seconds
        this.maxPowerUps = 3;
    }
    
    update(deltaTime) {
        this.spawnTimer += deltaTime;
        
        // Spawn new power-up
        if (this.spawnTimer >= this.spawnInterval && this.powerUps.length < this.maxPowerUps) {
            this.spawnPowerUp();
            this.spawnTimer = 0;
        }
        
        // Animate existing power-ups
        for (const powerUp of this.powerUps) {
            powerUp.mesh.rotation.y += deltaTime * 2;
            powerUp.mesh.position.y = Math.sin(Date.now() * 0.003) * 0.5;
        }
    }
    
    spawnPowerUp() {
        // Random position on track
        const angle = Math.random() * Math.PI * 2;
        const position = this.trackSystem.getTrackPosition(angle);
        position.y = 0;
        
        // Create power-up mesh
        const geometry = new THREE.OctahedronGeometry(1);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.8,
            metalness: 0.5,
            roughness: 0.2,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        
        // Add glow
        const glowGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.3,
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        mesh.add(glow);
        
        this.scene.add(mesh);
        
        this.powerUps.push({
            mesh: mesh,
            position: position,
            collected: false
        });
    }
    
    checkCollection(racerPosition, onCollect) {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (powerUp.collected) continue;
            
            const distance = racerPosition.distanceTo(powerUp.position);
            if (distance < 2) {
                // Collected!
                powerUp.collected = true;
                this.scene.remove(powerUp.mesh);
                this.powerUps.splice(i, 1);
                
                if (onCollect) {
                    onCollect();
                }
                
                return true;
            }
        }
        return false;
    }
    
    checkNPCCollection(npcs) {
        for (const npc of npcs) {
            if (npc.finished) continue;
            
            for (let i = this.powerUps.length - 1; i >= 0; i--) {
                const powerUp = this.powerUps[i];
                if (powerUp.collected) continue;
                
                const distance = npc.position.distanceTo(powerUp.position);
                if (distance < 2) {
                    powerUp.collected = true;
                    this.scene.remove(powerUp.mesh);
                    this.powerUps.splice(i, 1);
                    return npc.id; // Return NPC index that collected it
                }
            }
        }
        return -1;
    }
    
    reset() {
        for (const powerUp of this.powerUps) {
            this.scene.remove(powerUp.mesh);
        }
        this.powerUps = [];
        this.spawnTimer = 0;
    }
}

