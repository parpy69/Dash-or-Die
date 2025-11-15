import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export class PlayerSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.player = null;
        this.playerModel = null;
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.moveSpeed = 12; // Direct speed, no acceleration
        this.maxRadius = 6; // Keep player inside tunnel
        this.modelLoaded = false;
        
        this.init();
    }
    
    init() {
        // Create player container
        this.player = new THREE.Group();
        this.scene.add(this.player);
        
        // Load texture first
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            'Free Sample/TX_FlyingCars.png',
            (carTexture) => {
                
                // Load FBX car model
                const loader = new FBXLoader();
                loader.load(
                    'Free Sample/Car1.fbx',
                    (fbx) => {
                        this.playerModel = fbx;
                        
                        // Scale and rotate the car - even smaller
                        this.playerModel.scale.set(0.006, 0.006, 0.006);
                        this.playerModel.rotation.y = Math.PI; // Face forward
                        
                        // Apply texture and materials
                        this.playerModel.traverse((child) => {
                            if (child.isMesh) {
                                // Hide wings/side parts
                                const meshName = child.name.toLowerCase();
                                if (meshName.includes('wing') || meshName.includes('side')) {
                                    child.visible = false;
                                } else {
                                    // Clone the original material if it exists, otherwise create new
                                    if (child.material) {
                                        child.material = child.material.clone();
                                        child.material.map = carTexture;
                                        child.material.needsUpdate = true;
                                    } else {
                                        child.material = new THREE.MeshStandardMaterial({
                                            map: carTexture,
                                        });
                                    }
                                    
                                    // Add cyan glow
                                    child.material.emissive = new THREE.Color(0x00ffff);
                                    child.material.emissiveIntensity = 0.2;
                                    child.material.metalness = 0.8;
                                    child.material.roughness = 0.2;
                                    
                                    child.castShadow = true;
                                    child.receiveShadow = true;
                                }
                            }
                        });
                        
                        this.player.add(this.playerModel);
                        this.modelLoaded = true;
                    },
                    (progress) => {
                        // Loading progress
                    },
                    (error) => {
                        console.warn('Could not load car model, using fallback:', error);
                        this.createFallbackShip();
                    }
                );
            },
            (progress) => {
                // Texture loading progress
            },
            (error) => {
                console.error('Could not load texture:', error);
                // Try loading model without texture
                this.loadModelWithoutTexture();
            }
        );
        
        // Don't create fallback - just wait for model to load
    }
    
    loadModelWithoutTexture() {
        const loader = new FBXLoader();
        loader.load(
            'Free Sample/Car1.fbx',
            (fbx) => {
                this.playerModel = fbx;
                this.playerModel.scale.set(0.006, 0.006, 0.006);
                this.playerModel.rotation.y = Math.PI;
                
                this.playerModel.traverse((child) => {
                    if (child.isMesh) {
                        const meshName = child.name.toLowerCase();
                        if (meshName.includes('wing') || meshName.includes('side')) {
                            child.visible = false;
                        } else {
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0x00ffff,
                                emissive: 0x00ffff,
                                emissiveIntensity: 0.3,
                                metalness: 0.8,
                                roughness: 0.2,
                            });
                        }
                    }
                });
                
                this.player.add(this.playerModel);
                this.modelLoaded = true;
            },
            undefined,
            (error) => {
                console.warn('Could not load car model:', error);
                this.createFallbackShip();
            }
        );
    }
    
    createFallbackShip() {
        // Create simple geometric ship as fallback
        const group = new THREE.Group();
        group.userData.isFallback = true; // Mark as fallback
        
        // Main body (cone) - no wings or glow
        const bodyGeometry = new THREE.ConeGeometry(0.5, 1.5, 4);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2,
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2;
        group.add(body);
        
        // Only add if model hasn't loaded yet
        if (!this.modelLoaded) {
            this.player.add(group);
        }
    }
    
    update(input, deltaTime) {
        // Direct control - instant response, no acceleration
        this.velocity.x = input.x * this.moveSpeed;
        this.velocity.y = input.y * this.moveSpeed;
        
        // Update position
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        
        // Clamp position to stay inside tunnel (circular boundary)
        const distanceFromCenter = Math.sqrt(
            this.position.x * this.position.x + 
            this.position.y * this.position.y
        );
        
        if (distanceFromCenter > this.maxRadius) {
            const angle = Math.atan2(this.position.y, this.position.x);
            this.position.x = Math.cos(angle) * this.maxRadius;
            this.position.y = Math.sin(angle) * this.maxRadius;
        }
        
        // Update player mesh position
        this.player.position.copy(this.position);
        
        // Tilt player based on movement
        this.player.rotation.z = -this.velocity.x * deltaTime * 0.5;
        this.player.rotation.x = this.velocity.y * deltaTime * 0.5;
        
        // Add some bobbing animation
        this.player.position.z += Math.sin(Date.now() * 0.005) * 0.02;
    }
    
    getPosition() {
        return this.position.clone();
    }
    
    reset() {
        this.position.set(0, 0, 0);
        this.velocity.set(0, 0, 0);
        this.player.position.copy(this.position);
        this.player.rotation.set(0, 0, 0);
        
        // Make sure player is visible (in case it was hidden by race mode)
        this.player.visible = true;
        
        // Ensure player is in the scene
        if (!this.scene.children.includes(this.player)) {
            console.log('🔄 Re-adding player to scene...');
            this.scene.add(this.player);
        }
    }
}

