import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export class RaceTrackSystem {
    constructor(scene) {
        this.scene = scene;
        this.trackRadius = 50;
        this.trackWidth = 15;
        this.laps = 1; // Just 1 run from start to finish
        this.checkpoints = [];
        this.trackModel = null;
        this.modelLoaded = false;
        this.roadLength = 500;
        
        this.init();
    }
    
    init() {
        // Create straight road
        this.loadTrackModel();
        this.createCheckpoints();
        // Start and finish lines will be created AFTER track loads
    }
    
    loadTrackModel() {
        // Create the straight road track
        this.createStraightRoad();
        
        // Set track bounds to match the actual road (20 units wide, 800 units long)
        const roadWidth = 20;
        const roadLength = 800;
        
        this.trackBounds = {
            box: new THREE.Box3(
                new THREE.Vector3(-roadWidth / 2, -1, -roadLength / 2),
                new THREE.Vector3(roadWidth / 2, 1, roadLength / 2)
            ),
            size: new THREE.Vector3(roadWidth, 2, roadLength),
            center: new THREE.Vector3(0, 0, 0)
        };
        
        this.modelLoaded = true;
        
        // Add racing environment
        this.addRacingEnvironment();
        
        // Create start line at the beginning and finish line at the end
        this.createStartLineOnTrack();
        this.createFinishLineOnTrack();
        
        // Add jump ramp in the middle of the track
        this.createJumpRamp();
    }
    
    createTrackSegments(roadWidth) {
        // Define track waypoints with curves (x, z positions)
        this.trackWaypoints = [
            { x: 0, z: -400 },      // Start
            { x: 0, z: -300 },      // Straight
            { x: -30, z: -200 },    // Left curve
            { x: -30, z: -100 },    // Straight left
            { x: 0, z: 0 },         // Center curve (ramp here)
            { x: 30, z: 100 },      // Right curve
            { x: 30, z: 200 },      // Straight right
            { x: 0, z: 300 },       // Center curve
            { x: 0, z: 400 }        // Finish
        ];
        
        this.roadLength = 800; // Total length
        this.roadWidth = roadWidth;
        
        // Create one big road surface using curve
        const roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.9,
            metalness: 0.1,
            side: THREE.DoubleSide
        });
        
        // Create a wider road mesh that covers the entire track area
        const roadGeometry = new THREE.PlaneGeometry(100, 900);
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.y = 0;
        this.scene.add(road);
        
        console.log('Main road created');
        
        // Add center line dashes along the path
        for (let i = 0; i < this.trackWaypoints.length - 1; i++) {
            const start = this.trackWaypoints[i];
            const end = this.trackWaypoints[i + 1];
            
            const dashCount = 10;
            for (let j = 0; j < dashCount; j++) {
                const t = j / dashCount;
                const dashX = start.x + (end.x - start.x) * t;
                const dashZ = start.z + (end.z - start.z) * t;
                
                const lineGeometry = new THREE.PlaneGeometry(0.5, 8);
                const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
                const line = new THREE.Mesh(lineGeometry, lineMaterial);
                line.rotation.x = -Math.PI / 2;
                line.position.set(dashX, 0.05, dashZ);
                this.scene.add(line);
            }
        }
        
        // Create barriers along the track
        this.createTrackBarriers(roadWidth);
        
        // Add grass around the track
        const grassGeometry = new THREE.PlaneGeometry(300, 1000);
        const grassMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a4d1a,
            roughness: 1.0,
            metalness: 0.0,
        });
        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        grass.rotation.x = -Math.PI / 2;
        grass.position.y = -0.1;
        this.scene.add(grass);
        
        console.log('Track created with', this.trackWaypoints.length, 'waypoints');
    }
    
    createTrackBarriers(roadWidth) {
        const barrierMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.3,
            roughness: 0.6,
            metalness: 0.4,
        });
        
        // Create barriers along each segment
        for (let i = 0; i < this.trackWaypoints.length - 1; i++) {
            const start = this.trackWaypoints[i];
            const end = this.trackWaypoints[i + 1];
            
            const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.z - start.z, 2));
            const angle = Math.atan2(end.x - start.x, end.z - start.z);
            
            // Left barrier
            const leftBarrier = new THREE.Mesh(
                new THREE.BoxGeometry(1, 2, length),
                barrierMaterial
            );
            const leftOffset = roadWidth / 2 + 0.5;
            leftBarrier.position.set(
                (start.x + end.x) / 2 - Math.cos(angle) * leftOffset,
                1,
                (start.z + end.z) / 2 + Math.sin(angle) * leftOffset
            );
            leftBarrier.rotation.y = angle;
            this.scene.add(leftBarrier);
            
            // Right barrier
            const rightBarrier = new THREE.Mesh(
                new THREE.BoxGeometry(1, 2, length),
                barrierMaterial
            );
            const rightOffset = roadWidth / 2 + 0.5;
            rightBarrier.position.set(
                (start.x + end.x) / 2 + Math.cos(angle) * rightOffset,
                1,
                (start.z + end.z) / 2 - Math.sin(angle) * rightOffset
            );
            rightBarrier.rotation.y = angle;
            this.scene.add(rightBarrier);
        }
    }
    
    createStraightRoad() {
        const roadWidth = 20;
        const roadLength = 800;
        
        // Create main road surface - SIMPLE AND VISIBLE
        const roadGeometry = new THREE.PlaneGeometry(roadWidth, roadLength);
        const roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.9,
            metalness: 0.1,
            side: THREE.DoubleSide
        });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.y = 0;
        this.scene.add(road);
        
        console.log('✅ Road created!');
        
        // Add center line dashes
        const dashCount = 40;
        const dashLength = 8;
        const dashGap = 12;
        for (let i = 0; i < dashCount; i++) {
            const z = -roadLength / 2 + i * (dashLength + dashGap);
            const lineGeometry = new THREE.PlaneGeometry(0.3, dashLength);
            const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.set(0, 0.05, z);
            this.scene.add(line);
        }
        
        // Side barriers
        const barrierHeight = 2;
        const barrierGeometry = new THREE.BoxGeometry(1, barrierHeight, roadLength);
        const barrierMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.3,
        });
        
        const leftBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
        leftBarrier.position.set(-roadWidth / 2 - 0.5, barrierHeight / 2, 0);
        this.scene.add(leftBarrier);
        
        const rightBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
        rightBarrier.position.set(roadWidth / 2 + 0.5, barrierHeight / 2, 0);
        this.scene.add(rightBarrier);
        
        // Grass
        const grassWidth = 50;
        const grassGeometry = new THREE.PlaneGeometry(grassWidth, roadLength);
        const grassMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a4d1a,
            roughness: 1.0,
            metalness: 0.0,
        });
        
        const leftGrass = new THREE.Mesh(grassGeometry, grassMaterial);
        leftGrass.rotation.x = -Math.PI / 2;
        leftGrass.position.set(-roadWidth / 2 - grassWidth / 2 - 1, -0.1, 0);
        this.scene.add(leftGrass);
        
        const rightGrass = new THREE.Mesh(grassGeometry, grassMaterial);
        rightGrass.rotation.x = -Math.PI / 2;
        rightGrass.position.set(roadWidth / 2 + grassWidth / 2 + 1, -0.1, 0);
        this.scene.add(rightGrass);
        
        // Set waypoints for straight road
        this.trackWaypoints = [
            { x: 0, z: -400 },
            { x: 0, z: 400 }
        ];
        this.roadLength = roadLength;
        this.roadWidth = roadWidth;
        
        console.log('✅ Track complete! Length:', roadLength);
    }
    
    addRacingEnvironment() {
        // Simple directional light (much better performance than spotlights)
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(0, 50, 0);
        this.scene.add(dirLight);
        
        // Ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
        this.scene.add(ambientLight);
        
        // Add skybox/atmosphere
        this.scene.background = new THREE.Color(0x0a0a2e);
        this.scene.fog = new THREE.Fog(0x0a0a2e, 100, 400); // Increased fog distance
    }
    
    
    createTrafficLights(x, y, z) {
        // Create a traffic light housing (black box) - BIGGER
        const housingGeometry = new THREE.BoxGeometry(2, 6, 1);
        const housingMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.5,
            roughness: 0.5,
        });
        const housing = new THREE.Mesh(housingGeometry, housingMaterial);
        housing.position.set(x, y, z);
        this.scene.add(housing);
        
        // Create 3 circular lights (red, orange, green) - BIGGER and start with RED ON
        const lightRadius = 0.8;
        const lightGeometry = new THREE.CircleGeometry(lightRadius, 16);
        
        // Red light (top) - START WITH RED ON
        const redLightMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000, // Bright red (ON at start)
            emissive: 0xff0000,
            emissiveIntensity: 1.0,
        });
        const redLight = new THREE.Mesh(lightGeometry, redLightMaterial);
        redLight.position.set(x, y + 1.8, z + 0.6);
        redLight.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; // Face inward
        this.scene.add(redLight);
        
        // Orange light (middle)
        const orangeLightMaterial = new THREE.MeshStandardMaterial({
            color: 0x331a00, // Dark orange (off)
            emissive: 0x331a00,
            emissiveIntensity: 0.1,
        });
        const orangeLight = new THREE.Mesh(lightGeometry, orangeLightMaterial);
        orangeLight.position.set(x, y, z + 0.6);
        orangeLight.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; // Face inward
        this.scene.add(orangeLight);
        
        // Green light (bottom)
        const greenLightMaterial = new THREE.MeshStandardMaterial({
            color: 0x003300, // Dark green (off)
            emissive: 0x003300,
            emissiveIntensity: 0.1,
        });
        const greenLight = new THREE.Mesh(lightGeometry, greenLightMaterial);
        greenLight.position.set(x, y - 1.8, z + 0.6);
        greenLight.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; // Face inward
        this.scene.add(greenLight);
        
        // Add point lights for glow effect (RED starts ON)
        const redPointLight = new THREE.PointLight(0xff0000, 5, 30); // Start with red ON
        redPointLight.position.set(x, y + 1.8, z + 1);
        this.scene.add(redPointLight);
        
        const orangePointLight = new THREE.PointLight(0xff8800, 0, 30);
        orangePointLight.position.set(x, y, z + 1);
        this.scene.add(orangePointLight);
        
        const greenPointLight = new THREE.PointLight(0x00ff00, 0, 30);
        greenPointLight.position.set(x, y - 1.8, z + 1);
        this.scene.add(greenPointLight);
        
        // Store references for countdown control
        if (!this.trafficLights) {
            this.trafficLights = [];
        }
        
        this.trafficLights.push({
            red: { mesh: redLight, light: redPointLight },
            orange: { mesh: orangeLight, light: orangePointLight },
            green: { mesh: greenLight, light: greenPointLight }
        });
    }
    
    updateTrafficLights(countdown) {
        if (!this.trafficLights) return;
        
        // Update all traffic lights based on countdown
        this.trafficLights.forEach(trafficLight => {
            if (countdown === 3) {
                // RED light ON
                trafficLight.red.mesh.material.color.setHex(0xff0000);
                trafficLight.red.mesh.material.emissive.setHex(0xff0000);
                trafficLight.red.mesh.material.emissiveIntensity = 1.0;
                trafficLight.red.light.intensity = 5;
                
                // Others OFF
                trafficLight.orange.mesh.material.color.setHex(0x331a00);
                trafficLight.orange.mesh.material.emissiveIntensity = 0.1;
                trafficLight.orange.light.intensity = 0;
                
                trafficLight.green.mesh.material.color.setHex(0x003300);
                trafficLight.green.mesh.material.emissiveIntensity = 0.1;
                trafficLight.green.light.intensity = 0;
            } else if (countdown === 2) {
                // ORANGE light ON
                trafficLight.orange.mesh.material.color.setHex(0xff8800);
                trafficLight.orange.mesh.material.emissive.setHex(0xff8800);
                trafficLight.orange.mesh.material.emissiveIntensity = 1.0;
                trafficLight.orange.light.intensity = 5;
                
                // Others OFF
                trafficLight.red.mesh.material.color.setHex(0x330000);
                trafficLight.red.mesh.material.emissiveIntensity = 0.1;
                trafficLight.red.light.intensity = 0;
                
                trafficLight.green.mesh.material.color.setHex(0x003300);
                trafficLight.green.mesh.material.emissiveIntensity = 0.1;
                trafficLight.green.light.intensity = 0;
            } else if (countdown === 1) {
                // GREEN light ON
                trafficLight.green.mesh.material.color.setHex(0x00ff00);
                trafficLight.green.mesh.material.emissive.setHex(0x00ff00);
                trafficLight.green.mesh.material.emissiveIntensity = 1.0;
                trafficLight.green.light.intensity = 5;
                
                // Others OFF
                trafficLight.red.mesh.material.color.setHex(0x330000);
                trafficLight.red.mesh.material.emissiveIntensity = 0.1;
                trafficLight.red.light.intensity = 0;
                
                trafficLight.orange.mesh.material.color.setHex(0x331a00);
                trafficLight.orange.mesh.material.emissiveIntensity = 0.1;
                trafficLight.orange.light.intensity = 0;
            } else if (countdown === 0) {
                // All GREEN (GO!)
                trafficLight.green.mesh.material.color.setHex(0x00ff00);
                trafficLight.green.mesh.material.emissive.setHex(0x00ff00);
                trafficLight.green.mesh.material.emissiveIntensity = 1.0;
                trafficLight.green.light.intensity = 8; // Extra bright for GO!
                
                trafficLight.red.mesh.material.color.setHex(0x330000);
                trafficLight.red.mesh.material.emissiveIntensity = 0.1;
                trafficLight.red.light.intensity = 0;
                
                trafficLight.orange.mesh.material.color.setHex(0x331a00);
                trafficLight.orange.mesh.material.emissiveIntensity = 0.1;
                trafficLight.orange.light.intensity = 0;
            }
        });
    }
    
    createJumpRamp() {
        // Create a ramp in the middle of the track
        const rampWidth = 20;
        const rampLength = 12; // Length of the ramp
        const rampHeight = 0.8; // Height at the peak
        const rampAngle = Math.PI / 18; // ~10 degrees
        
        // Ramp geometry - angled up
        const rampGeometry = new THREE.BoxGeometry(rampWidth, rampHeight, rampLength);
        const rampMaterial = new THREE.MeshStandardMaterial({
            color: 0xffaa00, // Orange color to stand out
            emissive: 0xffaa00,
            emissiveIntensity: 0.2,
            roughness: 0.8,
            metalness: 0.2,
        });
        
        const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
        // Position ramp so it sits on the road and angles up
        ramp.position.set(0, 0, 0); // Start at road level
        ramp.rotation.x = -rampAngle; // Angle upward
        this.scene.add(ramp);
        
        // Store ramp position and properties for physics
        this.rampZ = 0;
        this.rampLength = rampLength;
        this.rampHeight = rampHeight;
        this.rampAngle = rampAngle;
        this.rampStartZ = -rampLength / 2;
        this.rampEndZ = rampLength / 2;
        
        console.log('Jump ramp created at Z:', this.rampZ, 'Start:', this.rampStartZ, 'End:', this.rampEndZ);
    }
    
    // Get the height of the car on the ramp based on Z position
    getRampHeight(zPosition) {
        // Check if car is on the ramp
        if (zPosition >= this.rampStartZ && zPosition <= this.rampEndZ) {
            // Calculate position along ramp (0 to 1)
            const progress = (zPosition - this.rampStartZ) / this.rampLength;
            // Height follows a slope up then down
            const height = Math.sin(progress * Math.PI) * this.rampHeight;
            return height + 0.2; // Add base car height
        }
        return 0.2; // Normal ground level
    }
    
    createCheckpoints() {
        // No checkpoints needed for straight road - progress is calculated from Z position
        this.checkpoints = [];
    }
    
    createStartLineOnTrack() {
        // Position start line at the beginning of the curved track
        if (!this.trackBounds) {
            console.warn('Track bounds not available yet');
            return;
        }
        
        // Use the first waypoint position for start line
        const startZ = this.trackWaypoints ? this.trackWaypoints[0].z + 10 : -390;
        const startX = this.trackWaypoints ? this.trackWaypoints[0].x : 0;
        const startY = 0; // At road level
        
        // Create checkered pattern
        const checkeredTexture = this.createCheckeredTexture();
        
        // Start line on the ground
        const lineGeometry = new THREE.PlaneGeometry(20, 3);
        const lineMaterial = new THREE.MeshStandardMaterial({
            map: checkeredTexture,
            emissive: 0xffffff,
            emissiveIntensity: 0.3,
        });
        const startLine = new THREE.Mesh(lineGeometry, lineMaterial);
        startLine.rotation.x = -Math.PI / 2;
        startLine.position.set(startX, startY + 0.05, startZ);
        this.scene.add(startLine);
        
        // Add start line gantry/arch
        const archGeometry = new THREE.BoxGeometry(25, 2, 8);
        const archMaterial = new THREE.MeshStandardMaterial({
            map: checkeredTexture,
            emissive: 0xffffff,
            emissiveIntensity: 0.2,
        });
        const arch = new THREE.Mesh(archGeometry, archMaterial);
        arch.position.set(startX, 8, startZ);
        this.scene.add(arch);
        
        // Add support pillars (dark gray poles)
        const pillarGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 16);
        const pillarMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            metalness: 0.8,
            roughness: 0.2,
        });
        
        const pillar1 = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar1.position.set(startX - 11, 4, startZ);
        this.scene.add(pillar1);
        
        const pillar2 = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar2.position.set(startX + 11, 4, startZ);
        this.scene.add(pillar2);
        
        // Create traffic lights on each pillar (3 lights: red, orange, green)
        this.createTrafficLights(startX - 11, 9, startZ); // Left pillar
        this.createTrafficLights(startX + 11, 9, startZ);  // Right pillar
        
        // Store references for countdown animation
        this.startLineZ = startZ;
        this.startLineX = startX;
    }
    
    createFinishLineOnTrack() {
        // Position finish line at the end of the curved track
        if (!this.trackBounds) {
            console.warn('Track bounds not available yet');
            return;
        }
        
        // Use the last waypoint position for finish line
        const finishZ = this.trackWaypoints ? this.trackWaypoints[this.trackWaypoints.length - 1].z - 10 : 390;
        const finishX = this.trackWaypoints ? this.trackWaypoints[this.trackWaypoints.length - 1].x : 0;
        const finishY = 0; // At road level
        
        // Create checkered pattern
        const checkeredTexture = this.createCheckeredTexture();
        
        // Finish line on the ground
        const lineGeometry = new THREE.PlaneGeometry(20, 3);
        const lineMaterial = new THREE.MeshStandardMaterial({
            map: checkeredTexture,
            emissive: 0xffffff,
            emissiveIntensity: 0.3,
        });
        const finishLine = new THREE.Mesh(lineGeometry, lineMaterial);
        finishLine.rotation.x = -Math.PI / 2;
        finishLine.position.set(finishX, finishY + 0.05, finishZ);
        this.scene.add(finishLine);
        
        // Add finish line gantry/arch
        const archGeometry = new THREE.BoxGeometry(25, 2, 8);
        const archMaterial = new THREE.MeshStandardMaterial({
            map: checkeredTexture,
            emissive: 0xffffff,
            emissiveIntensity: 0.2,
        });
        const arch = new THREE.Mesh(archGeometry, archMaterial);
        arch.position.set(finishX, 8, finishZ);
        this.scene.add(arch);
        
        // Add support pillars
        const pillarGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 16);
        const pillarMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.3,
            metalness: 0.7,
            roughness: 0.3,
        });
        
        const pillar1 = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar1.position.set(finishX - 11, 4, finishZ);
        this.scene.add(pillar1);
        
        const pillar2 = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar2.position.set(finishX + 11, 4, finishZ);
        this.scene.add(pillar2);
        
        // Add "FINISH" lights (red)
        const finishLight1 = new THREE.PointLight(0xff0000, 3, 30);
        finishLight1.position.set(finishX - 11, 10, finishZ);
        this.scene.add(finishLight1);
        
        const finishLight2 = new THREE.PointLight(0xff0000, 3, 30);
        finishLight2.position.set(finishX + 11, 10, finishZ);
        this.scene.add(finishLight2);
        
        // Store finish line position for checking
        this.finishLineZ = finishZ;
        this.finishLineX = finishX;
    }
    
    createCheckeredTexture() {
        // Create checkered pattern texture
        const checkeredCanvas = document.createElement('canvas');
        checkeredCanvas.width = 512;
        checkeredCanvas.height = 512;
        const ctx = checkeredCanvas.getContext('2d');
        
        // Draw checkered pattern
        const squareSize = 64;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                ctx.fillStyle = (i + j) % 2 === 0 ? '#ffffff' : '#000000';
                ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
            }
        }
        
        return new THREE.CanvasTexture(checkeredCanvas);
    }
    
    getStartPosition(index) {
        // Get starting position for racer (8 positions total)
        // Grid formation: 2 cars per row, 4 rows, properly spaced
        const row = Math.floor(index / 2);
        const side = index % 2;
        
        // Starting position BEHIND the start line
        // Start line is at Z = -390, so cars start at -395 and back
        const startLineZ = -390;
        const startZ = startLineZ - 5; // Start 5 units BEFORE the start line
        const startY = 0.2; // Just above road surface
        
        // Spread cars across the width (left and right) - wider spacing
        const x = (side === 0 ? -5 : 5); // 5 units left or right of center (was 4)
        
        // Space cars back in rows (10 units apart for more spread)
        const z = startZ - (row * 10); // Negative to go backwards from start line
        
        return new THREE.Vector3(x, startY, z);
    }
    
    checkCheckpoint(position, racerData) {
        // Safety check
        if (!position || !racerData) return false;
        
        // Simple finish line check - no checkpoints needed
        if (this.finishLineZ && position.z >= this.finishLineZ && !racerData.finished) {
            return true; // Race completed!
        }
        
        return false;
    }
}

