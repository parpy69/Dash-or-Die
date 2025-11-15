export class InputSystem {
    constructor() {
        this.keys = {};
        this.touch = { x: 0, y: 0, active: false };
        this.joystick = { x: 0, y: 0 };
        this.isMobile = this.detectMobile();
        
        this.init();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    init() {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Mobile controls
        if (this.isMobile) {
            this.setupMobileControls();
        }
    }
    
    setupMobileControls() {
        const mobileControls = document.getElementById('mobileControls');
        const joystick = document.getElementById('joystick');
        const joystickInner = joystick.querySelector('.joystick-inner');
        
        mobileControls.style.display = 'block';
        
        let joystickCenter = { x: 0, y: 0 };
        const maxDistance = 35;
        
        const updateJoystick = (touch) => {
            const rect = joystick.getBoundingClientRect();
            joystickCenter.x = rect.left + rect.width / 2;
            joystickCenter.y = rect.top + rect.height / 2;
            
            const deltaX = touch.clientX - joystickCenter.x;
            const deltaY = touch.clientY - joystickCenter.y;
            
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const angle = Math.atan2(deltaY, deltaX);
            
            const limitedDistance = Math.min(distance, maxDistance);
            
            const x = Math.cos(angle) * limitedDistance;
            const y = Math.sin(angle) * limitedDistance;
            
            joystickInner.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
            
            this.joystick.x = x / maxDistance;
            this.joystick.y = -y / maxDistance; // Invert Y for game coordinates
        };
        
        const resetJoystick = () => {
            joystickInner.style.transform = 'translate(-50%, -50%)';
            this.joystick.x = 0;
            this.joystick.y = 0;
        };
        
        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touch.active = true;
        });
        
        joystick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.touch.active) {
                updateJoystick(e.touches[0]);
            }
        });
        
        joystick.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touch.active = false;
            resetJoystick();
        });
    }
    
    getInput() {
        let x = 0;
        let y = 0;
        
        // Keyboard input
        if (this.keys['a'] || this.keys['arrowleft']) x -= 1;
        if (this.keys['d'] || this.keys['arrowright']) x += 1;
        if (this.keys['w'] || this.keys['arrowup']) y += 1;
        if (this.keys['s'] || this.keys['arrowdown']) y -= 1;
        
        // Mobile joystick input
        if (this.isMobile && this.touch.active) {
            x = this.joystick.x;
            y = this.joystick.y;
        }
        
        // Normalize diagonal movement
        const length = Math.sqrt(x * x + y * y);
        if (length > 1) {
            x /= length;
            y /= length;
        }
        
        return { x, y };
    }
}

