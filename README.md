# 🚗 Dash or Die

A high-octane 3D racing and tunnel dodging game built with Three.js. Race against AI opponents or dodge obstacles in an infinite neon tunnel!

![Game Preview](https://img.shields.io/badge/Status-Playable-brightgreen) ![Three.js](https://img.shields.io/badge/Three.js-v0.160.0-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎮 [PLAY NOW - Live Demo](https://dash-or-die.vercel.app/)

**👉 [https://dash-or-die.vercel.app/](https://dash-or-die.vercel.app/) 👈**

---

## 🎮 Game Modes

### 🌀 Endless Tunnel Mode
Fly through an infinite tunnel, dodging obstacles at breakneck speeds!
- **Progressive Difficulty**: Speed increases every 5 seconds (caps at 7.5x)
- **Dynamic Obstacles**: Spinning cubes, cylinders, and spheres with accurate hitboxes
- **Procedural Generation**: Infinite tunnel with textured grey walls
- **Ramping Music**: Background music intensifies as you go faster
- **High Score Tracking**: Beat your personal best!

### 🏁 Race Mode (8 Players)
Compete against 7 AI opponents on a challenging straight track!
- **Realistic Racing**: Drive with forward/backward acceleration and steering
- **Smart AI**: NPCs avoid obstacles and maintain different speeds
- **Dynamic Track**: Features turns, a jump ramp with physics, and track boundaries
- **Traffic Light Start**: Red → Orange → Green countdown system
- **Live Positioning**: Real-time position tracking and progress bar
- **Finish Announcements**: See who crosses the line in style
- **Collision Physics**: Obstacles bump cars back with realistic impact
- **Sound Effects**: Obstacle hits and race finish sounds

## ✨ Features

### 🎨 Visual & Audio
- **3D Graphics**: Powered by Three.js with WebGL rendering
- **Custom Car Models**: Detailed block cars with headlights, tail lights, and windows
- **Textured Environments**: Grey textured tunnel and asphalt race track
- **Dynamic Lighting**: Point lights and emissive materials for atmosphere
- **Procedural Music**: Web Audio API generates dynamic background music
- **Sound Effects**: Impact sounds and victory fanfares

### 🎯 Gameplay Mechanics
- **Smooth Controls**: Instant response with no acceleration lag (tunnel mode)
- **Realistic Driving**: Acceleration, braking, and steering physics (race mode)
- **Jump Physics**: Momentum-based ramp jumps with gravity and airtime
- **Accurate Hitboxes**: 70% bounding sphere for tight collision detection
- **Camera System**: Synced third-person camera that follows player movement
- **Obstacle Variety**: Geometric shapes with spinning and static variants

### 👤 User System
- **Authentication**: Sign up, sign in, or play as guest
- **Session Persistence**: Stay logged in across page refreshes
- **Leaderboard**: Track top scores across all players
- **Personal Stats**: View your high scores and progress

### 📱 Responsive Design
- **Desktop Controls**: WASD/Arrow keys for tunnel, WASD for racing
- **Mobile Support**: Virtual joystick for touch devices
- **Adaptive UI**: Clean HUD that scales to any screen size

## 🎮 How to Play

### Endless Tunnel Mode
1. Select **"Endless Tunnel"** from the mode menu
2. Use **WASD** or **Arrow Keys** to move your ship up/down/left/right
3. Dodge red obstacles flying towards you
4. Survive as long as possible - speed increases every 5 seconds!
5. Beat your high score displayed in the bottom left

### Race Mode
1. Select **"Race Mode (8 Players)"** from the mode menu
2. Wait for the traffic light countdown (Red → Orange → Green)
3. Use **W/S** to accelerate/brake and **A/D** to steer
4. Avoid obstacles on the track - they'll slow you down!
5. Hit the jump ramp for some airtime
6. Cross the finish line first to win!

## 🕹️ Controls

### Endless Tunnel Mode (Desktop)
- **W / ↑**: Move Up
- **S / ↓**: Move Down
- **A / ←**: Move Left
- **D / →**: Move Right

### Race Mode (Desktop)
- **W**: Accelerate Forward
- **S**: Brake / Reverse
- **A**: Steer Left
- **D**: Steer Right

### Mobile
- Use the virtual joystick in the bottom-right corner (Endless Mode)
- Touch controls for racing (Race Mode)

## 🏗️ Project Structure

```
Dash or Die/
├── index.html                      # Main HTML file with UI elements
├── src/
│   ├── main.js                     # Game initialization and main loop
│   ├── styles.css                  # All styling and animations
│   ├── systems/                    # Core game systems
│   │   ├── TunnelSystem.js         # Infinite tunnel generation
│   │   ├── PlayerSystem.js         # Player ship (tunnel mode)
│   │   ├── ObstacleSystem.js       # Obstacle spawning (tunnel mode)
│   │   ├── InputSystem.js          # Keyboard and touch input
│   │   ├── AudioSystem.js          # Music and sound effects
│   │   ├── RaceTrackSystem.js      # Race track generation
│   │   ├── RacePlayerSystem.js     # Player car (race mode)
│   │   ├── NPCRacerSystem.js       # AI opponents
│   │   └── RaceObstacleSystem.js   # Race obstacles
│   ├── ui/
│   │   ├── UISystem.js             # Menu and HUD management
│   │   └── AuthSystem.js           # User authentication
│   └── modes/
│       ├── GameMode.js             # Base game mode logic
│       └── RaceMode.js             # Race mode orchestration
└── README.md                       # You are here!
```

## 🛠️ Technologies

- **Three.js** (v0.160.0): 3D rendering and WebGL
- **Web Audio API**: Procedural music and sound effects
- **Vanilla JavaScript**: Game logic and systems
- **CSS3**: UI, animations, and responsive design
- **LocalStorage**: High scores, user accounts, and session persistence

## 🚀 Getting Started

### Installation

No installation or build process required! Just clone and play:

```bash
git clone https://github.com/parpy69/dash-or-die.git
cd dash-or-die
```

### Running the Game

Simply open `index.html` in a modern web browser, or use a local server:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server

# PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## 🌐 Browser Compatibility

Works best in modern browsers with WebGL support:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Note**: Safari may have WebGL context limits. Close other tabs if you experience issues.

## 🎯 Game Mechanics Deep Dive

### Speed Ramping (Tunnel Mode)
- Starts at **1.0x** speed
- Increases by **1.0x every 5 seconds**
- Caps at **7.5x** maximum speed
- Obstacle spawn rate increases with speed
- Music intensity scales with speed

### Collision Detection
- **Tunnel Mode**: 70% bounding sphere for spinning objects, scaled sphere for static
- **Race Mode**: Bounding box for track boundaries, sphere for obstacles
- **Obstacle Response**: Push-back force and speed reduction on impact

### Jump Physics (Race Mode)
- **Gravity**: -15 units/sec²
- **Momentum Preservation**: Vertical velocity inherited from ramp slope
- **Launch Boost**: +8 units/sec upward velocity at ramp exit
- **Smooth Landing**: Gradual return to ground level

### AI Behavior (Race Mode)
- **Lane Maintenance**: NPCs stay in their starting lanes with slight swerving
- **Obstacle Avoidance**: Look-ahead system to steer around obstacles
- **Speed Variation**: 20-32 units/sec with progressive differences
- **Collision Recovery**: Push away from obstacles and slow down temporarily

## 🎨 Customization

### Player Car Colors
- **Tunnel Mode**: Cyan spaceship
- **Race Mode**: White car (Player), 7 different colors for NPCs

### Tunnel Appearance
- Grey textured walls
- Dark blue fog for depth
- Procedurally generated segments

### Race Track
- 800-unit long straight road with curves
- Dark asphalt texture
- Red boundary walls
- Green grass surroundings
- White center lines

## 🐛 Known Issues & Solutions

### WebGL Context Lost
If you see "WebGL: CONTEXT_LOST_WEBGL":
1. Close other browser tabs using WebGL
2. Restart your browser
3. Try Safari if using Chrome (or vice versa)

### Performance Issues
- Lower your screen resolution
- Close background applications
- Ensure hardware acceleration is enabled in browser settings

## 🔮 Future Enhancements

- [ ] Online multiplayer with WebSockets
- [ ] More race tracks (circular, figure-8, custom shapes)
- [ ] Power-ups in race mode (speed boost, shield, etc.)
- [ ] More tunnel themes (neon, space, underwater)
- [ ] Global leaderboards with backend
- [ ] Customizable cars and ships
- [ ] Achievement system
- [ ] Replay system
- [ ] Time trial mode
- [ ] Tournament brackets

## 📄 License

MIT License - Feel free to use, modify, and distribute!

## 👨‍💻 Developer

Created by **parpy69**

GitHub: [@parpy69](https://github.com/parpy69)

---

⭐ **Star this repo if you enjoyed the game!** ⭐

🎮 **Have fun and may the fastest racer win!** 🏁
