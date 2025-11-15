# Dash or Die

A cartoonish 3D tunnel dodging game built with Three.js.

## Features

- **3D Tunnel Environment**: Fly through an infinite, colorful tunnel
- **Smooth Controls**: WASD/Arrow keys on desktop, virtual joystick on mobile
- **Progressive Difficulty**: Speed increases over time, obstacles spawn faster
- **Multiple Game Modes**:
  - Endless Mode: Survive as long as possible
- **Score System**: Track distance traveled and high scores
- **Responsive Design**: Works on desktop and mobile devices

## How to Play

1. Open `index.html` in a modern web browser
2. Click "Start Game" or select a mode from "Mode Select"
3. Use **WASD** or **Arrow Keys** to move your ship
4. Dodge red obstacles flying towards you
5. Survive as long as possible to get a high score!

## Controls

### Desktop
- **W / ↑**: Move Up
- **S / ↓**: Move Down
- **A / ←**: Move Left
- **D / →**: Move Right

### Mobile
- Use the virtual joystick in the bottom-right corner

## Project Structure

```
Dash or Die/
├── index.html          # Main HTML file
├── src/
│   ├── main.js         # Game initialization and main loop
│   ├── styles.css      # All styling
│   ├── systems/        # Core game systems
│   │   ├── TunnelSystem.js    # Infinite tunnel generation
│   │   ├── PlayerSystem.js    # Player ship and movement
│   │   ├── ObstacleSystem.js  # Obstacle spawning and collision
│   │   └── InputSystem.js     # Keyboard and touch input
│   ├── ui/
│   │   └── UISystem.js        # Menu and HUD management
│   └── modes/
│       └── GameMode.js        # Game mode logic
└── README.md
```

## Technologies

- **Three.js** (v0.160.0): 3D rendering
- **Vanilla JavaScript**: Game logic
- **CSS3**: UI and animations
- **LocalStorage**: High score persistence

## Browser Compatibility

Works best in modern browsers with WebGL support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

No build process required! Just open `index.html` in your browser.

For local development, you can use any simple HTTP server:
```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server
```

Then open `http://localhost:8000` in your browser.

## Future Enhancements

- Real multiplayer with WebSockets
- Power-ups and collectibles
- Different tunnel themes
- Leaderboards
- Sound effects and music
- More obstacle types and patterns

