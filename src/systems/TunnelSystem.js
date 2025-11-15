import * as THREE from 'three';

export class TunnelSystem {
    constructor(scene) {
        this.scene = scene;
        this.tunnelSegments = [];
        this.segmentLength = 20;
        this.tunnelRadius = 8;
        this.numSegments = 10;
        
        this.init();
    }
    
    init() {
        // Create initial tunnel segments
        for (let i = 0; i < this.numSegments; i++) {
            this.createSegment(i);
        }
    }
    
    createSegment(index) {
        const group = new THREE.Group();
        
        // Create tunnel cylinder (inverted so we see inside)
        const geometry = new THREE.CylinderGeometry(
            this.tunnelRadius,
            this.tunnelRadius,
            this.segmentLength,
            32,
            1,
            true
        );
        
        // Create procedural texture using canvas
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Base grey
        ctx.fillStyle = '#404040';
        ctx.fillRect(0, 0, 512, 512);
        
        // Add grid lines
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 2;
        
        // Vertical lines
        for (let i = 0; i < 512; i += 64) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 512);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let i = 0; i < 512; i += 64) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(512, i);
            ctx.stroke();
        }
        
        // Add some noise/detail
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const size = Math.random() * 3;
            ctx.fillStyle = Math.random() > 0.5 ? '#505050' : '#353535';
            ctx.fillRect(x, y, size, size);
        }
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 2);
        
        // Grey material with texture
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.BackSide,
            wireframe: false,
            emissive: 0x202020,
            emissiveIntensity: 0.1,
            metalness: 0.4,
            roughness: 0.8,
        });
        
        const tunnel = new THREE.Mesh(geometry, material);
        tunnel.rotation.x = Math.PI / 2;
        group.add(tunnel);
        
        // Position segment
        group.position.z = -index * this.segmentLength;
        
        this.scene.add(group);
        this.tunnelSegments.push(group);
    }
    
    update(speed) {
        // Move all segments forward
        for (let i = 0; i < this.tunnelSegments.length; i++) {
            const segment = this.tunnelSegments[i];
            segment.position.z += speed;
            
            // If segment is behind camera, move it to the front
            if (segment.position.z > this.segmentLength) {
                segment.position.z -= this.numSegments * this.segmentLength;
            }
        }
    }
    
    reset() {
        // Check if tunnel segments are still in the scene
        const segmentsInScene = this.tunnelSegments.filter(segment => 
            this.scene.children.includes(segment)
        );
        
        if (segmentsInScene.length === 0) {
            // Tunnel was removed from scene (e.g., after race mode)
            // Clear old segments and recreate
            console.log('🔄 Recreating tunnel after scene clear...');
            this.tunnelSegments = [];
            this.init();
        } else {
            // Reset all segment positions
            for (let i = 0; i < this.tunnelSegments.length; i++) {
                this.tunnelSegments[i].position.z = -i * this.segmentLength;
            }
        }
    }
    
    getTunnelRadius() {
        return this.tunnelRadius;
    }
}

