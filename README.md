# Breakout Game

A classic Breakout-style game implemented in JavaScript using HTML5 Canvas with retro-inspired graphics and sound effects.

## Features
- Classic paddle and ball gameplay
- Multiple levels with increasing difficulty
- Retro-style graphics and animations
- 8-bit sound effects using Web Audio API
- 3-life system with heart display
- Progressive level system
- Smooth animations and controls
- Keyboard and mouse control options

## Game Mechanics
- Break all bricks to advance to the next level
- Each level features different brick patterns
- Ball speed increases with each level
- Paddle reflects ball at different angles based on hit position

## Sound Effects
- Game start melody
- Paddle hits
- Brick breaks
- Wall collisions
- Level completion
- Life lost
- Game over

## Controls
- Left Arrow / Mouse Move: Move paddle left
- Right Arrow / Mouse Move: Move paddle right
- Space: Restart game (after game over)

## How to Play
1. Open `index.html` in your web browser
2. Use left/right arrow keys or mouse to move the paddle
3. Break all bricks to advance to the next level
4. Complete all levels to win
5. You have 3 lives to complete the game

## Technical Details
- Built with vanilla JavaScript
- Uses HTML5 Canvas for rendering
- Web Audio API for sound synthesis
- Responsive game loop with delta time
- No external dependencies

## Development
To run the game locally:
1. Clone the repository
2. Start a local server (e.g., `python -m http.server`)
3. Open `localhost:8000` in your browser
