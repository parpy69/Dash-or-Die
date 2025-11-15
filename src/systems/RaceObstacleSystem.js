import * as THREE from 'three';

export class RaceObstacleSystem {
    constructor(scene, trackSystem) {
        this.scene = scene;
        this.trackSystem = trackSystem;
        this.obstacles = [];
        
        this.init();
    }

    init() {
        this.createObstacles();
    }

    createObstacles() {
        // Create random obstacles along the track
        const roadLength = 800;
        const roadWidth = 20;
        const numObstacles = 12; // Number of obstacles
        
        // Ramp zone to avoid (ramp is at Z=0, length=12, so -6 to +6)
        const rampStartZ = -6;
        const rampEndZ = 6;
        const rampBuffer = 10; // Extra space around ramp to avoid

        for (let i = 0; i < numObstacles; i++) {
            let z;
            let attempts = 0;
            
            // Keep trying to find a position that's not on the ramp
            do {
                z = -350 + (i * 60) + (Math.random() * 20 - 10); // Spread along track
                attempts++;
                
                // If we've tried too many times, force it to a safe zone
                if (attempts > 10) {
                    if (i % 2 === 0) {
                        z = -350 + (i * 60); // Before ramp
                    } else {
                        z = 50 + (i * 60); // After ramp
                    }
                    break;
                }
            } while (z >= (rampStartZ - rampBuffer) && z <= (rampEndZ + rampBuffer));
            
            const x = (Math.random() * 12) - 6; // Random X within road bounds (-6 to 6)

            // Create obstacle type randomly
            const obstacleType = Math.floor(Math.random() * 3);
            let mesh;

            if (obstacleType === 0) {
                // Traffic cone
                mesh = this.createTrafficCone();
            } else if (obstacleType === 1) {
                // Barrel
                mesh = this.createBarrel();
            } else {
                // Tire stack
                mesh = this.createTireStack();
            }

            mesh.position.set(x, 0.5, z);
            this.scene.add(mesh);

            this.obstacles.push({
                mesh: mesh,
                position: new THREE.Vector3(x, 0.5, z),
                radius: 0.8, // Collision radius (reduced from 1.2 to 0.8)
                type: obstacleType
            });

            console.log(`Obstacle ${i} created at X:${x.toFixed(1)}, Z:${z.toFixed(1)}`);
        }

        console.log(`Total obstacles created: ${this.obstacles.length}`);
    }

    createTrafficCone() {
        const group = new THREE.Group();

        // Cone body (orange)
        const coneGeometry = new THREE.ConeGeometry(0.5, 1.5, 8);
        const coneMaterial = new THREE.MeshStandardMaterial({
            color: 0xff6600,
            emissive: 0xff6600,
            emissiveIntensity: 0.3,
            metalness: 0.2,
            roughness: 0.8,
        });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.y = 0.75;
        group.add(cone);

        // White stripe
        const stripeGeometry = new THREE.CylinderGeometry(0.52, 0.52, 0.3, 8);
        const stripeMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.1,
            roughness: 0.9,
        });
        const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe.position.y = 0.75;
        group.add(stripe);

        return group;
    }

    createBarrel() {
        const group = new THREE.Group();

        // Barrel body (yellow)
        const barrelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 16);
        const barrelMaterial = new THREE.MeshStandardMaterial({
            color: 0xffcc00,
            metalness: 0.6,
            roughness: 0.4,
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.y = 0.6;
        group.add(barrel);

        // Black stripes
        const stripeGeometry = new THREE.CylinderGeometry(0.52, 0.52, 0.15, 16);
        const stripeMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            metalness: 0.3,
            roughness: 0.7,
        });

        const stripe1 = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe1.position.y = 0.3;
        group.add(stripe1);

        const stripe2 = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe2.position.y = 0.9;
        group.add(stripe2);

        return group;
    }

    createTireStack() {
        const group = new THREE.Group();

        const tireGeometry = new THREE.TorusGeometry(0.4, 0.2, 8, 16);
        const tireMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.2,
            roughness: 0.9,
        });

        // Bottom tire
        const tire1 = new THREE.Mesh(tireGeometry, tireMaterial);
        tire1.rotation.x = Math.PI / 2;
        tire1.position.y = 0.2;
        group.add(tire1);

        // Top tire
        const tire2 = new THREE.Mesh(tireGeometry, tireMaterial);
        tire2.rotation.x = Math.PI / 2;
        tire2.position.y = 0.6;
        group.add(tire2);

        return group;
    }

    checkCollision(carPosition, carVelocity) {
        // Check if car collides with any obstacle
        for (const obstacle of this.obstacles) {
            const distance = carPosition.distanceTo(obstacle.position);

            if (distance < obstacle.radius + 1.0) { // Car radius ~1.0
                // Collision detected! Calculate bounce direction
                const bounceDirection = new THREE.Vector3()
                    .subVectors(carPosition, obstacle.position)
                    .normalize();

                // Push car back
                const bounceStrength = 5; // How far to push back
                const bounce = {
                    x: bounceDirection.x * bounceStrength,
                    z: bounceDirection.z * bounceStrength,
                    hit: true
                };

                console.log('Collision with obstacle!', obstacle.type);
                return bounce;
            }
        }

        return { x: 0, z: 0, hit: false };
    }

    getObstacles() {
        return this.obstacles;
    }

    reset() {
        // Remove all obstacles from scene
        this.obstacles.forEach(obstacle => {
            this.scene.remove(obstacle.mesh);
            obstacle.mesh.traverse((child) => {
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
        this.obstacles = [];
    }
}

