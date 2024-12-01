// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });  // Disable alpha for better performance
ctx.imageSmoothingEnabled = false;  // Disable anti-aliasing for retro feel

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game object dimensions
const paddleWidth = 100;
const paddleHeight = 10;
const ballRadius = 3;  // Smaller ball
const brickRowCount = 15;  // Increased rows
const brickColumnCount = 70;  // Increased to fill width
const brickWidth = 10;  // Half size square bricks
const brickHeight = 10; // Same as width for square shape
const brickPadding = 1;      // Reduced padding
const brickOffsetTop = 30;
const brickOffsetLeft = (canvas.width - (brickColumnCount * (brickWidth + brickPadding))) / 2;

// Game state
let lives = 3;
let gameOver = false;
let gameWon = false;
let currentLevel = 1;
let maxLevel = 3;
let showLevelAnimation = true;
let levelAnimationStart = Date.now();
const levelAnimationDuration = 2000; // 2 seconds

// Retro color palette
const retroColors = [
    '#FF0000',  // Classic Red
    '#FF6B00',  // Orange
    '#FFD500',  // Yellow
    '#00FF00',  // Classic Green
    '#00FFFF',  // Cyan
    '#0000FF',  // Classic Blue
    '#FF00FF',  // Magenta
    '#FF007F',  // Hot Pink
    '#00FF7F',  // Spring Green
    '#7FFF00'   // Chartreuse
];

// Level configurations
const levelConfigs = {
    1: {
        pattern: 'full',     // All bricks
        ballSpeed: 5,
        paddleSpeed: 15
    },
    2: {
        pattern: 'zigzag',   // Zigzag pattern
        ballSpeed: 6,
        paddleSpeed: 16
    },
    3: {
        pattern: 'random',   // Random pattern
        ballSpeed: 7,
        paddleSpeed: 10
    }
};

// Background Music System
let backgroundMusic = null;
let musicStatus = document.getElementById('musicStatus');
let uploadButton = document.getElementById('uploadButton');
let musicUpload = document.getElementById('musicUpload');
let toggleMusicButton = document.getElementById('toggleMusic');

// Set up music upload handling
uploadButton.addEventListener('click', () => {
    musicUpload.click();
});

musicUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        // Stop current music if playing
        if (backgroundMusic) {
            backgroundMusic.pause();
            backgroundMusic = null;
        }

        // Create URL for the uploaded file
        const musicUrl = URL.createObjectURL(file);
        backgroundMusic = new Audio(musicUrl);
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.3;

        musicStatus.textContent = `Music loaded: ${file.name}`;
        
        // Auto-play the music
        toggleBackgroundMusic();
    }
});

toggleMusicButton.addEventListener('click', toggleBackgroundMusic);

function toggleBackgroundMusic() {
    if (!backgroundMusic) {
        musicStatus.textContent = 'Please upload a music file first';
        return;
    }
    
    if (backgroundMusic.paused) {
        console.log('Starting music...');
        backgroundMusic.play().catch(error => {
            console.log('Error playing music:', error);
            musicStatus.textContent = 'Error playing music. Click to try again.';
        });
        musicStatus.textContent = 'Music: Playing';
        toggleMusicButton.textContent = 'Pause Music (M)';
    } else {
        console.log('Stopping music...');
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        musicStatus.textContent = 'Music: Paused';
        toggleMusicButton.textContent = 'Play Music (M)';
    }
}

// Keep the 'M' key functionality
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'm') {
        console.log('Music toggle pressed');
        toggleBackgroundMusic();
    }
});

// Audio functions for sound effects
function createOscillator(frequency, type = 'sine') {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    return { oscillator, gainNode };
}

// Retro sound generator
const createRetroSound = {
    paddleHit: () => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    },
    
    gameStart: () => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'square';
        
        // Triumphant startup melody (C major arpeggio with extra notes)
        const notes = [262, 330, 392, 523, 659, 523, 392, 523];  // C4, E4, G4, C5, E5, C5, G4, C5
        const noteLength = 0.08;
        
        notes.forEach((freq, i) => {
            oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + i * noteLength);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime + i * noteLength);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (i + 1) * noteLength);
        });
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + notes.length * noteLength);
    },

    heartLost: () => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'square';
        
        // Quick descending tone
        oscillator.frequency.setValueAtTime(330, audioCtx.currentTime); // E4
        oscillator.frequency.exponentialRampToValueAtTime(165, audioCtx.currentTime + 0.2); // E3
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
    },

    gameOver: () => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'square';
        
        // Dramatic game over melody (minor scale descent)
        const notes = [440, 392, 349, 330, 294, 262, 247, 220];  // A4 to A3 in A minor
        const noteLength = 0.2;
        
        notes.forEach((freq, i) => {
            oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + i * noteLength);
            gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime + i * noteLength);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (i + 1) * noteLength);
        });
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + notes.length * noteLength);
    },
    
    brickHit: () => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.05);
    },
    
    wallHit: () => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    },
    
    levelUp: () => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'square';
        
        // Play ascending notes
        const notes = [300, 400, 500, 600];
        const noteLength = 0.1;
        
        notes.forEach((freq, i) => {
            oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + i * noteLength);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime + i * noteLength);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (i + 1) * noteLength);
        });
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + notes.length * noteLength);
    },
    
    loseLife: () => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    },

    gameStart: () => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'square';
        
        // Play a fun startup melody
        const notes = [262, 330, 392, 523];  // C4, E4, G4, C5
        const noteLength = 0.1;
        
        notes.forEach((freq, i) => {
            oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + i * noteLength);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime + i * noteLength);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (i + 1) * noteLength);
        });
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + notes.length * noteLength);
    },

    heartLost: () => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'square';
        
        // Play a sad heart lost sound
        const notes = [440, 392, 349, 330];  // A4, G4, F4, E4
        const noteLength = 0.15;
        
        notes.forEach((freq, i) => {
            oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + i * noteLength);
            gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime + i * noteLength);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (i + 1) * noteLength);
        });
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + notes.length * noteLength);
    }
};

// Function to play sound with retro effects
function playSound(soundId) {
    try {
        createRetroSound[soundId]();
    } catch (error) {
        console.log('Audio play failed:', error);
    }
}

// Create bricks based on level pattern
function createBricks(level) {
    const bricks = [];
    const config = levelConfigs[level];
    
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            let shouldAppear = true;
            
            switch(config.pattern) {
                case 'full':
                    shouldAppear = true;
                    break;
                case 'zigzag':
                    shouldAppear = (c + r) % 3 !== 0;
                    break;
                case 'random':
                    shouldAppear = Math.random() < 0.7;
                    break;
            }
            
            bricks[c][r] = { 
                x: 0, 
                y: 0, 
                status: shouldAppear ? 1 : 0,
                color: retroColors[Math.floor(Math.random() * retroColors.length)]
            };
        }
    }
    return bricks;
}

// Initialize game objects
let bricks = createBricks(currentLevel);

// Paddle starting position (moved up)
const paddleBottomMargin = 50;  // Space from bottom for lives display

// Paddle properties
const paddle = {
    x: (canvas.width - paddleWidth) / 2,
    y: canvas.height - paddleHeight - paddleBottomMargin,  // Moved up
    width: paddleWidth,
    height: paddleHeight,
    speed: levelConfigs[1].paddleSpeed  // Increased paddle speed
};

// Ball properties with normalized speed
const ball = {
    x: canvas.width / 2,
    y: paddle.y - ballRadius,  // Adjusted to new paddle position
    dx: 0,
    dy: 0,
    radius: ballRadius,
    speed: levelConfigs[1].ballSpeed
};

function nextLevel() {
    currentLevel++;
    if (currentLevel <= maxLevel) {
        // Reset ball and paddle
        resetBall();
        // Create new bricks for the level
        bricks = createBricks(currentLevel);
        // Update speeds
        ball.speed = levelConfigs[currentLevel].ballSpeed;
        paddle.speed = levelConfigs[currentLevel].paddleSpeed;
        gameWon = false;
        // Show level animation
        showLevelAnimation = true;
        levelAnimationStart = Date.now();
    } else {
        gameWon = true;
    }
}

function checkLevelComplete() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                return false;
            }
        }
    }
    nextLevel();
    return true;
}

// Pre-calculate values used in collision detection
const ballRadiusSquared = ballRadius * ballRadius;
const brickWidthHalf = brickWidth / 2;
const brickHeightHalf = brickHeight / 2;

// Keyboard controls
const keys = {
    left: false,
    right: false
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'Space' && (gameOver || gameWon)) {
        document.location.reload();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
});

function updatePaddlePosition(deltaTime) {
    const paddleSpeed = paddle.speed;  // Use faster paddle speed
    if (keys.left && paddle.x > 0) {
        paddle.x -= paddleSpeed * deltaTime;
    }
    if (keys.right && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddleSpeed * deltaTime;
    }
}

// Event listeners for paddle movement
document.addEventListener('mousemove', (e) => {
    const relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width / 2;
    }
});

// Collision detection
function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const brick = bricks[c][r];
            if (brick.status === 1) {
                // Calculate the ball's position relative to the brick
                const brickCenterX = brick.x + brickWidthHalf;
                const brickCenterY = brick.y + brickHeightHalf;
                const dx = Math.abs(ball.x - brickCenterX);
                const dy = Math.abs(ball.y - brickCenterY);

                if (dx <= (brickWidthHalf + ballRadius) && 
                    dy <= (brickHeightHalf + ballRadius)) {
                    
                    // Determine which side of the brick was hit
                    if (dx > brickWidthHalf) {
                        // Hit on the left or right side
                        ball.dx = -ball.dx;
                    } else if (dy > brickHeightHalf) {
                        // Hit on the top or bottom
                        ball.dy = -ball.dy;
                    } else {
                        // Hit at a corner
                        ball.dx = -ball.dx;
                        ball.dy = -ball.dy;
                    }
                    
                    brick.status = 0;  // Break this brick
                    
                    // Check if game is won
                    if (checkLevelComplete()) {
                        gameWon = true;
                    }
                    
                    playSound('brickHit');
                    
                    return;  // Exit after breaking one brick
                }
            }
        }
    }
}

function updateBallPosition(deltaTime) {
    // Calculate next position
    const nextX = ball.x + ball.dx * deltaTime;
    const nextY = ball.y + ball.dy * deltaTime;

    // Check wall collisions before moving
    // Right and left walls
    if (nextX + ballRadius > canvas.width) {
        ball.x = canvas.width - ballRadius;
        ball.dx = -Math.abs(ball.dx); // Ensure it bounces left
        playSound('wallHit');
    } else if (nextX - ballRadius < 0) {
        ball.x = ballRadius;
        ball.dx = Math.abs(ball.dx); // Ensure it bounces right
        playSound('wallHit');
    } else {
        ball.x = nextX;
    }

    // Top wall
    if (nextY - ballRadius < 0) {
        ball.y = ballRadius;
        ball.dy = Math.abs(ball.dy); // Ensure it bounces down
        playSound('wallHit');
    } else {
        ball.y = nextY;
    }
    
    // Bottom wall (lose life)
    if (nextY + ballRadius > canvas.height) {
        lives--;
        playSound('heartLost');  // Play heart lost sound
        if (lives === 0) {
            gameOver = true;
            playSound('gameOver');
        } else {
            resetBall();
        }
        return;
    }

    // Check paddle collision
    if (nextY + ballRadius > paddle.y && 
        nextY - ballRadius < paddle.y + paddle.height &&
        nextX + ballRadius > paddle.x && 
        nextX - ballRadius < paddle.x + paddle.width) {
        
        // Calculate where on the paddle the ball hit (0 = left edge, 1 = right edge)
        const hitPos = (ball.x - paddle.x) / paddle.width;
        
        // Calculate bounce angle (-60 to 60 degrees)
        const bounceAngle = (hitPos - 0.5) * Math.PI * 0.67;
        
        // Set new velocity based on bounce angle
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        ball.dx = speed * Math.sin(bounceAngle);
        ball.dy = -speed * Math.cos(bounceAngle);
        
        // Ensure ball doesn't get stuck in paddle
        ball.y = paddle.y - ballRadius;
        playSound('paddleHit');
    }
}

function draw() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 16;
    lastTime = currentTime;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw game elements
    drawBricks();
    drawPaddle();
    drawBall();
    drawLives();
    drawLevelDisplay();
    
    // Update game state if not game over
    if (!gameOver && !gameWon) {
        updatePaddlePosition(deltaTime);
        updateBallPosition(deltaTime);
        collisionDetection();
    }
    
    // Draw messages
    if (gameOver) {
        drawGameOver();
    } else if (gameWon) {
        drawGameWon();
    } else {
        drawLevelStart();
    }
    
    // Request next frame
    animationFrameId = requestAnimationFrame(draw);
}

function drawLevelDisplay() {
    ctx.font = '20px "Press Start 2P", "Courier New", monospace';
    ctx.fillStyle = '#FF0000';  // Match heart color
    ctx.textAlign = 'right';
    ctx.fillText(`LEVEL ${currentLevel}`, canvas.width - 40, canvas.height - 25);
}

function drawLives() {
    // Draw heart symbols for each life in bottom left
    const spacing = 30;
    const startX = 40;  // Starting from left side
    const startY = canvas.height - 25;  // Near bottom
    
    for(let i = 0; i < lives; i++) {
        const x = startX + i * spacing;
        // Draw heart shape
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.bezierCurveTo(x, startY-3, x-5, startY-10, x-10, startY-10);
        ctx.bezierCurveTo(x-15, startY-10, x-15, startY, x-15, startY);
        ctx.bezierCurveTo(x-15, startY+5, x-10, startY+10, x, startY+15);
        ctx.bezierCurveTo(x+10, startY+10, x+15, startY+5, x+15, startY);
        ctx.bezierCurveTo(x+15, startY, x+15, startY-10, x+10, startY-10);
        ctx.bezierCurveTo(x+5, startY-10, x, startY-3, x, startY);
        ctx.fillStyle = '#FF0000';
        ctx.fill();
    }
}

function drawGameOver() {
    ctx.font = '48px "Press Start 2P", "Courier New", monospace';
    ctx.fillStyle = '#ff6b6b';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
    
    ctx.font = '24px "Press Start 2P", "Courier New", monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('Press SPACE to restart', canvas.width/2, canvas.height/2 + 40);
}

function drawGameWon() {
    ctx.font = '48px "Press Start 2P", "Courier New", monospace';
    ctx.fillStyle = '#6bff6b';
    ctx.textAlign = 'center';
    ctx.fillText('YOU WIN!', canvas.width/2, canvas.height/2);
    
    ctx.font = '24px "Press Start 2P", "Courier New", monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('Press SPACE to restart', canvas.width/2, canvas.height/2 + 40);
}

function drawLevelStart() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - levelAnimationStart;
    
    if (elapsedTime < 2000) {  // Show for 2 seconds
        ctx.font = '48px "Press Start 2P", "Courier New", monospace';
        ctx.fillStyle = `rgba(255, 255, 255, ${1 - elapsedTime/2000})`;
        ctx.textAlign = 'center';
        ctx.fillText(`LEVEL ${currentLevel}`, canvas.width/2, canvas.height/2);
    }
}

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const brick = bricks[c][r];
            if (brick.status === 1) {
                brick.x = brickOffsetLeft + c * (brickWidth + brickPadding);
                brick.y = brickOffsetTop + r * (brickHeight + brickPadding);
                
                ctx.fillStyle = brick.color;
                ctx.fillRect(brick.x, brick.y, brickWidth, brickHeight);
                
                // Add retro border effect
                ctx.strokeStyle = '#FFFFFF';
                ctx.strokeRect(brick.x, brick.y, brickWidth, brickHeight);
            }
        }
    }
}

function drawPaddle() {
    ctx.beginPath();
    
    // Create gradient for paddle - retro theme
    const gradient = ctx.createLinearGradient(
        paddle.x, 
        paddle.y, 
        paddle.x, 
        paddle.y + paddle.height
    );
    gradient.addColorStop(0, '#C0C0C0');  // Light Gray
    gradient.addColorStop(0.5, '#808080'); // Gray
    gradient.addColorStop(1, '#404040');   // Dark Gray
    
    // Main paddle body
    ctx.fillStyle = gradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    // Add metallic shine effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height/3);
    
    // Add neon glow effect
    ctx.shadowColor = '#C0C0C0';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    ctx.closePath();
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
    
    // Create gradient for ball - retro theme
    const gradient = ctx.createRadialGradient(
        ball.x - ballRadius/3, 
        ball.y - ballRadius/3, 
        0,
        ball.x,
        ball.y,
        ballRadius
    );
    gradient.addColorStop(0, '#FF69B4');  // Pastel Pink
    gradient.addColorStop(0.3, '#FFC0CB'); // Pastel Red
    gradient.addColorStop(1, '#FFA07A');   // Pastel Orange
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add shine effect
    ctx.beginPath();
    ctx.arc(ball.x - ballRadius/3, ball.y - ballRadius/3, ballRadius/4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
    
    ctx.closePath();
}

let lastTime = 0;
let animationFrameId;

function startGame() {
    createBricks(currentLevel);
    resetBall();
    resetPaddle();
    lives = 3;
    gameOver = false;
    gameWon = false;
    playSound('gameStart');  // Play start sound
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = paddle.y - ballRadius;  // Adjusted to new paddle position
    
    // Set initial angle between -30 and 30 degrees
    const angle = (Math.random() * 60 - 30) * Math.PI / 180;
    ball.dx = ball.speed * Math.sin(angle);
    ball.dy = -ball.speed * Math.cos(angle);
    
    paddle.x = (canvas.width - paddle.width) / 2;
}

function resetPaddle() {
    paddle.x = (canvas.width - paddle.width) / 2;
}

// Initialize ball direction
resetBall();

// Initialize first level animation
showLevelAnimation = true;
levelAnimationStart = Date.now();

// Start the game
startGame();
playSound('gameStart');  // Play start sound

function initGame() {
    lastTime = performance.now();
    playSound('gameStart');  // Play start sound when game initializes
    draw();
}

initGame();

function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 16;
    lastTime = currentTime;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw game elements
    drawBricks();
    drawPaddle();
    drawBall();
    drawLives();
    drawLevelDisplay();
    
    // Update game state if not game over
    if (!gameOver && !gameWon) {
        updatePaddlePosition(deltaTime);
        updateBallPosition(deltaTime);
        collisionDetection();
    }
    
    // Draw messages
    if (gameOver) {
        drawGameOver();
    } else if (gameWon) {
        drawGameWon();
    } else {
        drawLevelStart();
    }
    
    requestAnimationFrame(gameLoop);
}