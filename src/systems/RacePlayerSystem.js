import * as THREE from 'three';

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
        // Create simple block car like NPCs - PLAYER COLOR (White)
        this.carModel = this.createBlockCar(0xffffff); // White for player - stands out!
        this.scene.add(this.carModel);
        this.modelLoaded = true;
        console.log('✅ Player block car created (WHITE)');
    }
    
    createBlockCar(color) {
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

        // Taillights (red) - BIGGER and BRIGHTER
        const taillightMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1.5,
        });
        const taillightGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.15);

        const taillight1 = new THREE.Mesh(taillightGeometry, taillightMaterial);
        taillight1.position.set(-0.7, 0.5, -2.05);
        group.add(taillight1);

        const taillight2 = new THREE.Mesh(taillightGeometry, taillightMaterial);
        taillight2.position.set(0.7, 0.5, -2.05);
        group.add(taillight2);

        // Add point lights for tail light glow
        const leftGlow = new THREE.PointLight(0xff0000, 2, 5);
        leftGlow.position.set(-0.7, 0.5, -2.2);
        group.add(leftGlow);

        const rightGlow = new THREE.PointLight(0xff0000, 2, 5);
        rightGlow.position.set(0.7, 0.5, -2.2);
        group.add(rightGlow);

        return group;
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
