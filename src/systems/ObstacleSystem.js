import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export class ObstacleSystem {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.spawnDistance = -50;
        this.despawnDistance = 10;
        this.spawnTimer = 0;
        this.baseSpawnInterval = 1.0; // 20% slower spawning (was 0.8)
        this.minSpawnInterval = 0.25; // Slightly slower at max speed too
        this.tunnelRadius = 7;
        this.obstaclePool = [];
        this.carModel = null;
        this.carModelLoaded = false;
        
        this.init();
        this.loadCarModel();
    }
    
    loadCarModel() {
        // Load texture
        const textureLoader = new THREE.TextureLoader();
        this.carTexture = textureLoader.load('Free Sample/TX_FlyingCars.png');
        
        const loader = new FBXLoader();
        loader.load(
            'Free Sample/Car1.fbx',
            (fbx) => {
                this.carModel = fbx;
                this.carModelLoaded = true;
            },
            undefined,
            (error) => {
                console.warn('Could not load obstacle car model:', error);
            }
        );
    }
    
    init() {
        // Pre-create obstacle pool for performance
        for (let i = 0; i < 50; i++) {
            const obstacle = this.createObstacle();
            obstacle.visible = false;
            this.obstaclePool.push(obstacle);
        }
    }
    
    createObstacle() {
        const group = new THREE.Group();
        group.userData.isObstacle = true; // Mark as obstacle
        
        // 30% chance to use car model if loaded
        if (this.carModelLoaded && Math.random() < 0.3) {
            const carClone = this.carModel.clone();
            carClone.scale.set(0.018, 0.018, 0.018); // Bigger to show detail
            
            // Make it red and glowing with texture
            carClone.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({
                        map: this.carTexture,
                        color: 0xff0000,
                        emissive: 0xff0000,
                        emissiveIntensity: 0.5,
                        metalness: 0.8,
                        roughness: 0.2,
                    });
                    child.castShadow = true;
                }
            });
            
            group.add(carClone);
        } else {
            // Random obstacle type - all bigger and longer
            const type = Math.floor(Math.random() * 4);
            let geometry;
            
            switch (type) {
                case 0: // Long Box
                    geometry = new THREE.BoxGeometry(2, 2, 3); // Much bigger
                    break;
                case 1: // Large Sphere
                    geometry = new THREE.SphereGeometry(1.2, 16, 16); // Doubled size
                    break;
                case 2: // Tall Pyramid
                    geometry = new THREE.ConeGeometry(1.2, 2.5, 4); // Bigger and taller
                    break;
                case 3: // Long Cylinder (new)
                    geometry = new THREE.CylinderGeometry(0.8, 0.8, 3, 16);
                    break;
            }
            
            const material = new THREE.MeshStandardMaterial({
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 0.5,
                metalness: 0.3,
                roughness: 0.7,
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            group.add(mesh);
        }
        
        // No glow - it was causing collision issues
        
        this.scene.add(group);
        return group;
    }
    
    spawnObstacle() {
        // Get obstacle from pool
        let obstacle = this.obstaclePool.find(obs => !obs.visible);
        if (!obstacle) {
            obstacle = this.createObstacle();
            this.obstaclePool.push(obstacle);
        }
        
        // Randomize position throughout the entire tunnel cross-section
        const spawnType = Math.random();
        
        if (spawnType < 0.25) {
            // Center area (0-2 units from center)
            const centerRadius = Math.random() * 2;
            const angle = Math.random() * Math.PI * 2;
            obstacle.position.x = Math.cos(angle) * centerRadius;
            obstacle.position.y = Math.sin(angle) * centerRadius;
        } else if (spawnType < 0.5) {
            // Mid-tunnel area (2-4 units from center)
            const midRadius = 2 + Math.random() * 2;
            const angle = Math.random() * Math.PI * 2;
            obstacle.position.x = Math.cos(angle) * midRadius;
            obstacle.position.y = Math.sin(angle) * midRadius;
        } else if (spawnType < 0.75) {
            // Outer area (4-6 units from center)
            const outerRadius = 4 + Math.random() * 2;
            const angle = Math.random() * Math.PI * 2;
            obstacle.position.x = Math.cos(angle) * outerRadius;
            obstacle.position.y = Math.sin(angle) * outerRadius;
        } else {
            // Tunnel wall (6-7 units from center)
            const wallRadius = 6 + Math.random() * 1;
            const angle = Math.random() * Math.PI * 2;
            obstacle.position.x = Math.cos(angle) * wallRadius;
            obstacle.position.y = Math.sin(angle) * wallRadius;
        }
        
        obstacle.position.z = this.spawnDistance;
        
        // Random rotation
        obstacle.rotation.x = Math.random() * Math.PI;
        obstacle.rotation.y = Math.random() * Math.PI;
        obstacle.rotation.z = Math.random() * Math.PI;
        
        obstacle.visible = true;
        obstacle.userData.active = true;
        
        this.obstacles.push(obstacle);
    }
    
    update(speed, gameSpeed, deltaTime) {
        // Update spawn timer
        this.spawnTimer += deltaTime;
        
        // Calculate spawn interval based on game speed
        const spawnInterval = Math.max(
            this.baseSpawnInterval - (gameSpeed - 1) * 0.3,
            this.minSpawnInterval
        );
        
        // Spawn new obstacles
        if (this.spawnTimer >= spawnInterval) {
            this.spawnObstacle();
            this.spawnTimer = 0;
            
            // Spawn multiple obstacles more frequently
            if (gameSpeed > 1.5 && Math.random() > 0.5) {
                setTimeout(() => this.spawnObstacle(), 150);
            }
            
            // At high speeds, spawn even more
            if (gameSpeed > 3 && Math.random() > 0.6) {
                setTimeout(() => this.spawnObstacle(), 300);
            }
            
            // Extreme mode - spawn clusters
            if (gameSpeed > 5 && Math.random() > 0.7) {
                setTimeout(() => {
                    this.spawnObstacle();
                    setTimeout(() => this.spawnObstacle(), 100);
                }, 200);
            }
        }
        
        // Update existing obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            
            if (!obstacle.userData.active) continue;
            
            // Move obstacle forward
            obstacle.position.z += speed;
            
            // Rotate for effect
            obstacle.rotation.x += deltaTime * 2;
            obstacle.rotation.y += deltaTime;
            
            // Remove if passed player
            if (obstacle.position.z > this.despawnDistance) {
                obstacle.visible = false;
                obstacle.userData.active = false;
                this.obstacles.splice(i, 1);
            }
        }
    }
    
    checkCollision(playerPosition) {
        // Player bounding sphere
        const playerRadius = 0.5;
        
        for (const obstacle of this.obstacles) {
            if (!obstacle.userData.active) continue;
            
            // Check if obstacle is near player in Z-axis first
            const zDistance = Math.abs(obstacle.position.z - playerPosition.z);
            if (zDistance > 2.5) continue; // Skip far obstacles
            
            // Get all meshes in the obstacle and check collision
            let hasCollision = false;
            obstacle.traverse((child) => {
                if (hasCollision) return; // Already found collision
                
                if (child.isMesh && child.visible) {
                    // Update world matrix to ensure transforms are current
                    child.updateMatrixWorld(true);
                    
                    // Compute bounding sphere
                    if (!child.geometry.boundingSphere) {
                        child.geometry.computeBoundingSphere();
                    }
                    
                    // Get world space bounding sphere center
                    const sphereCenter = child.geometry.boundingSphere.center.clone();
                    sphereCenter.applyMatrix4(child.matrixWorld);
                    
                    // Get world space radius (accounting for scale)
                    const scale = child.getWorldScale(new THREE.Vector3());
                    const maxScale = Math.max(scale.x, scale.y, scale.z);
                    
                    // Use 70% of the bounding sphere radius for tighter collision on boxes/cylinders
                    const sphereRadius = child.geometry.boundingSphere.radius * maxScale * 0.7;
                    
                    // Check sphere-to-sphere collision
                    const distance = sphereCenter.distanceTo(playerPosition);
                    
                    if (distance < (playerRadius + sphereRadius)) {
                        hasCollision = true;
                    }
                }
            });
            
            if (hasCollision) return true;
        }
        return false;
    }
    
    reset() {
        // Hide all active obstacles
        for (const obstacle of this.obstacles) {
            obstacle.visible = false;
            obstacle.userData.active = false;
        }
        this.obstacles = [];
        this.spawnTimer = 0;
        
        // Ensure obstacle pool is in the scene
        for (const obstacle of this.obstaclePool) {
            if (!this.scene.children.includes(obstacle)) {
                console.log('🔄 Re-adding obstacle to scene...');
                this.scene.add(obstacle);
            }
            obstacle.visible = false;
            obstacle.userData.active = false;
        }
    }
}

