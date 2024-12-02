# Breakout Game

A modern implementation of the classic Breakout arcade game, built with HTML5 Canvas and JavaScript. This game features smooth animations, retro-style graphics, and engaging gameplay mechanics.

## Features

- Classic arcade-style Breakout gameplay with modern enhancements
- Smooth paddle and ball physics
- Dynamic difficulty progression with infinite levels
- Retro-styled pixel graphics with no anti-aliasing for authentic feel
- Persistent high score system using Local Storage
- Customizable audio settings
  - Background music
  - Sound effects for collisions and game events
- Responsive paddle controls (keyboard and mouse support)
- Level progression system
- Lives system with visual indicators
- Animated level transitions
- Game state persistence

## Technical Details

Built using:
- HTML5 Canvas for rendering
- Vanilla JavaScript for game logic
- Flask (Python) for serving the game
- Local Storage API for game state persistence
- Custom audio system for sound effects and music

## How to Play

1. Clone the repository
2. Install the required Python dependencies:
   ```bash
   pip install flask
   ```
3. Start the Flask server:
   ```bash
   python server.py
   ```
4. Open your browser and navigate to `http://localhost:8080`

## Game Controls

- **Mouse Movement**: Move the paddle left/right
- **Left/Right Arrow Keys**: Alternative paddle control
- **Settings Menu**: 
  - Toggle background music
  - Adjust sound effects
  - Configure game settings

## Game Mechanics

- Break bricks to score points
- Each brick hit increases your score
- Clear all bricks to advance to the next level
- Game features 3 lives
- Paddle size and ball speed adjust with game progression
- High scores are automatically saved

## Development

The game is built with performance in mind:
- Optimized canvas rendering with disabled alpha channel
- Pre-calculated collision detection values
- Efficient game loop using requestAnimationFrame
- Modular code structure for easy maintenance

## Contributing

Feel free to fork the repository and submit pull requests for any improvements or bug fixes.
