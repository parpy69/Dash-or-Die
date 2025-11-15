import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export class RacePlayerSystem {
    constructor(scene) {
        this.scene = scene;
        this.carModel = null;
        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = 0;
        this.speed = 0;
        this.modelLoaded = false;
        
        this.init();
    }
    
    init() {
        const loader = new FBXLoader();
        loader.load(
            'uploads_files_255378_Long_Car.fbx',
            (fbx) => {
                this.carModel = fbx;
                
                // Scale the car much smaller
                this.carModel.scale.set(0.0002, 0.0002, 0.0002); // Even smaller - was 0.0005
                this.carModel.rotation.y = 0; // Face forward
                
                console.log('Player car loaded and scaled to 0.0002');
                
                // Apply realistic car materials and colors
                this.carModel.traverse((child) => {
                    if (child.isMesh) {
                        const meshName = child.name.toLowerCase();
                        
                        console.log('Car part:', meshName);
                        
                        // Body parts - glossy blue car paint
                        if (meshName.includes('body') || meshName.includes('hood') || meshName.includes('door') || 
                            meshName.includes('roof') || meshName.includes('trunk') || meshName.includes('fender')) {
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0x0066cc, // Deep blue
                                metalness: 0.9,
                                roughness: 0.1,
                                envMapIntensity: 1.0,
                            });
                        }
                        // Windows - white/light gray
                        else if (meshName.includes('window') || meshName.includes('glass') || meshName.includes('windshield')) {
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0xeeeeee, // White/light gray
                                metalness: 0.9,
                                roughness: 0.1,
                                transparent: true,
                                opacity: 0.8,
                            });
                        }
                        // License plate / Name plate - white with black text
                        else if (meshName.includes('plate') || meshName.includes('license') || meshName.includes('number')) {
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0xffffff, // White
                                metalness: 0.1,
                                roughness: 0.7,
                            });
                        }
                        // Wheels/Tires - black rubber
                        else if (meshName.includes('wheel') || meshName.includes('tire') || meshName.includes('rim')) {
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0x0a0a0a,
                                metalness: 0.2,
                                roughness: 0.9,
                            });
                        }
                        // Chrome/Metal parts
                        else if (meshName.includes('chrome') || meshName.includes('bumper') || meshName.includes('grill')) {
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0xcccccc,
                                metalness: 1.0,
                                roughness: 0.1,
                            });
                        }
                        // Headlights - bright white
                        else if (meshName.includes('headlight') || meshName.includes('front') && meshName.includes('light')) {
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0xffffff,
                                emissive: 0xffffff,
                                emissiveIntensity: 1.0,
                                metalness: 0.9,
                                roughness: 0.1,
                            });
                        }
                        // Taillights - bright red
                        else if (meshName.includes('taillight') || meshName.includes('tail') || meshName.includes('rear') && meshName.includes('light') || meshName.includes('brake')) {
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0xff0000,
                                emissive: 0xff0000,
                                emissiveIntensity: 1.0,
                                metalness: 0.8,
                                roughness: 0.2,
                            });
                        }
                        // Generic lights
                        else if (meshName.includes('light')) {
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0xffaa00,
                                emissive: 0xffaa00,
                                emissiveIntensity: 0.8,
                                metalness: 0.8,
                                roughness: 0.2,
                            });
                        }
                        // Default - blue body
                        else {
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0x0066cc,
                                metalness: 0.8,
                                roughness: 0.2,
                            });
                        }
                        
                        // Shadows disabled for performance
                    }
                });
                
                // Add tail lights to the car
                this.addTailLights();
                
                this.scene.add(this.carModel);
                this.modelLoaded = true;
                console.log('Race car loaded successfully!');
            },
            (progress) => {
                console.log('Loading race car:', (progress.loaded / progress.total * 100).toFixed(0) + '%');
            },
            (error) => {
                console.error('Could not load race car:', error);
                this.createFallbackCar();
            }
        );
    }
    
    addTailLights() {
        if (!this.carModel) return;
        
        // Create red tail lights
        const lightGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const lightMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1.0,
            metalness: 0.8,
            roughness: 0.2,
        });
        
        // Left tail light
        const leftLight = new THREE.Mesh(lightGeometry, lightMaterial);
        leftLight.position.set(-0.6, 0.3, 1.2); // Left back corner
        this.carModel.add(leftLight);
        
        // Right tail light
        const rightLight = new THREE.Mesh(lightGeometry, lightMaterial);
        rightLight.position.set(0.6, 0.3, 1.2); // Right back corner
        this.carModel.add(rightLight);
        
        // Add point lights for glow effect
        const leftGlow = new THREE.PointLight(0xff0000, 1, 3);
        leftGlow.position.set(-0.6, 0.3, 1.2);
        this.carModel.add(leftGlow);
        
        const rightGlow = new THREE.PointLight(0xff0000, 1, 3);
        rightGlow.position.set(0.6, 0.3, 1.2);
        this.carModel.add(rightGlow);
        
        console.log('Tail lights added to player car');
    }
    
    createFallbackCar() {
        // Simple fallback car
        const carGeometry = new THREE.BoxGeometry(2, 1, 4);
        const carMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            metalness: 0.6,
            roughness: 0.4,
        });
        this.carModel = new THREE.Mesh(carGeometry, carMaterial);
        this.scene.add(this.carModel);
        this.modelLoaded = true;
    }
    
    updatePosition(position, rotation) {
        this.position.copy(position);
        this.rotation = rotation;
        
        if (this.carModel) {
            this.carModel.position.copy(position);
            this.carModel.rotation.y = rotation;
        }
    }
    
    getPosition() {
        return this.position;
    }
    
    cleanup() {
        if (this.carModel) {
            this.scene.remove(this.carModel);
            this.carModel.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
    }
}

