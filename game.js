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
const ballRadius = 3;        // Reduced ball size to 3px radius
const brickRowCount = 13;    // Keep 13 rows
const brickColumnCount = 70; // Keep width-filling columns
const brickWidth = 10;      // Keep original small square bricks
const brickHeight = 10;     // Keep original square shape
const brickPadding = 1;     // Keep original padding
const brickOffsetTop = 80;  // Keep bricks moved down
const brickOffsetLeft = (canvas.width - (brickColumnCount * (brickWidth + brickPadding))) / 2;

// Game state
let lives = 3;
let gameOver = false;
let currentLevel = 1;
let score = 0;
let highScore = localStorage.getItem('breakoutHighScore') || 0;
let showLevelAnimation = true;
let levelAnimationStart = Date.now();
const levelAnimationDuration = 2000; // 2 seconds

// Audio settings
let sfxEnabled = localStorage.getItem('sfxEnabled') !== 'false';
let bgmEnabled = localStorage.getItem('bgmEnabled') !== 'false';
const bgMusic = document.getElementById('bgMusic');

// Preload sound effects
const soundEffects = {
    paddle_hit: new Audio('sounds/paddle_hit.wav'),
    wall_hit: new Audio('sounds/wall_hit.wav'),
    brick_break: new Audio('sounds/brick_break.wav'),
    game_over: new Audio('sounds/game_over.wav'),
    game_start: new Audio('sounds/game_start.wav'),
    button_click: new Audio('sounds/button_click.wav')
};

// Set volume for all sound effects
Object.values(soundEffects).forEach(sound => {
    sound.volume = 0.3;
});

function playSound(soundName) {
    if (!sfxEnabled) return;
    
    try {
        const sound = soundEffects[soundName];
        if (sound) {
            // Create a clone to allow overlapping sounds
            const clone = sound.cloneNode();
            clone.volume = 0.3;
            clone.play().catch(error => {
                console.log('Error playing sound:', error);
            });
        }
    } catch (error) {
        console.log('Error playing sound:', error);
    }
}

// Background music handling
function toggleBackgroundMusic() {
    if (bgMusic) {
        if (bgmEnabled) {
            bgMusic.src = 'sounds/background.mp3';
            bgMusic.loop = true;
            bgMusic.volume = 0.2;
            bgMusic.play().catch(error => console.log('Error playing background music:', error));
        } else {
            bgMusic.pause();
            bgMusic.currentTime = 0;
        }
    }
}

// Add score display
let gameWon = false;
let maxLevel = 3;

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
    if (e.code === 'Space' && (gameOver || gameWon)) {
        window.location.href = '/index.html';
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
            let b = bricks[c][r];
            if (b.status === 1) {
                // Calculate distances between ball and brick
                const distX = Math.abs(ball.x - (b.x + brickWidth/2));
                const distY = Math.abs(ball.y - (b.y + brickHeight/2));

                // Check if ball is close enough for collision
                if (distX <= (brickWidth/2 + ballRadius) && distY <= (brickHeight/2 + ballRadius)) {
                    // Determine which side of the brick was hit
                    if (distX >= distY) {
                        // Hit was on left or right side
                        ball.dx = -ball.dx;
                    } else {
                        // Hit was on top or bottom
                        ball.dy = -ball.dy;
                    }
                    
                    b.status = 0;
                    score++;
                    
                    playSound('brick_break');
                    
                    // Check if level is complete
                    checkLevelComplete();
                    return;
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
        playSound('wall_hit');
    } else if (nextX - ballRadius < 0) {
        ball.x = ballRadius;
        ball.dx = Math.abs(ball.dx); // Ensure it bounces right
        playSound('wall_hit');
    } else {
        ball.x = nextX;
    }

    // Top wall
    if (nextY - ballRadius < 0) {
        ball.y = ballRadius;
        ball.dy = Math.abs(ball.dy); // Ensure it bounces down
        playSound('wall_hit');
    } else {
        ball.y = nextY;
    }
    
    // Bottom wall (lose life)
    if (nextY + ballRadius > canvas.height) {
        lives--;
        if (sfxEnabled) playSound('game_over');
        if (lives === 0) {
            handleGameOver();
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
        playSound('paddle_hit');
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
    drawScore();
    
    // Update game state if not game over
    if (!gameOver && !gameWon) {
        updatePaddlePosition(deltaTime);
        updateBallPosition(deltaTime);
        collisionDetection();
    }
    
    // Draw messages
    if (gameOver) {
        drawGameOver();
        return;
    } else if (gameWon) {
        drawGameWon();
    } else {
        drawLevelStart();
    }
    
    // Request next frame
    animationFrameId = requestAnimationFrame(draw);
}

function drawScore() {
    ctx.font = '16px "Press Start 2P"';
    ctx.fillStyle = '#00f7ff';
    ctx.shadowColor = '#00f7ff';
    ctx.shadowBlur = 10;
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 8, 30);
    ctx.fillStyle = '#ffffff';  // High score in white
    ctx.fillText('High Score: ' + highScore, 8, 55);
    ctx.fillStyle = '#00f7ff';
    ctx.textAlign = 'right';
    ctx.fillText('Level: ' + currentLevel, canvas.width - 8, 30);
    ctx.shadowBlur = 0;  // Reset shadow
}

function drawLevelDisplay() {
    ctx.font = '20px "Press Start 2P"';
    ctx.fillStyle = '#00f7ff';
    ctx.shadowColor = '#00f7ff';
    ctx.shadowBlur = 10;
    ctx.textAlign = 'right';
    ctx.fillText(`LEVEL ${currentLevel}`, canvas.width - 40, canvas.height - 25);
    ctx.shadowBlur = 0;  // Reset shadow
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
    ctx.save();
    
    // Create gradient background for game over screen
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(26, 26, 46, 0.9)');
    gradient.addColorStop(1, 'rgba(22, 33, 62, 0.9)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Game Over text with glow effect
    ctx.font = "48px 'Press Start 2P'";
    ctx.textAlign = 'center';
    
    // Text shadow for glow effect
    ctx.shadowColor = '#00f7ff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#00f7ff';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 50);
    
    // Score display
    ctx.font = "24px 'Press Start 2P'";
    ctx.shadowColor = '#00f7ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Final Score: ${score}`, canvas.width/2, canvas.height/2 + 20);
    
    // High score display
    if (score > highScore) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText('New High Score!', canvas.width/2, canvas.height/2 + 60);
    }
    
    // Continue text with animation
    const now = Date.now();
    const alpha = (Math.sin(now / 500) + 1) / 2; // Pulsing effect
    ctx.globalAlpha = alpha;
    ctx.font = "20px 'Press Start 2P'";
    ctx.fillStyle = '#00f7ff';
    ctx.fillText('Click or Press SPACE to return', canvas.width/2, canvas.height/2 + 100);
    
    ctx.restore();
}

function drawGameWon() {
    ctx.save();
    
    // Create gradient background for victory screen
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(26, 26, 46, 0.9)');
    gradient.addColorStop(1, 'rgba(22, 33, 62, 0.9)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Victory text with glow effect
    ctx.font = "48px 'Press Start 2P'";
    ctx.textAlign = 'center';
    
    // Text shadow for glow effect
    ctx.shadowColor = '#00f7ff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#00f7ff';
    ctx.fillText('YOU WON!', canvas.width/2, canvas.height/2 - 50);
    
    // Score display
    ctx.font = "24px 'Press Start 2P'";
    ctx.shadowColor = '#00f7ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Final Score: ${score}`, canvas.width/2, canvas.height/2 + 20);
    
    // High score display
    if (score > highScore) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText('New High Score!', canvas.width/2, canvas.height/2 + 60);
    }
    
    // Continue text with animation
    const now = Date.now();
    const alpha = (Math.sin(now / 500) + 1) / 2; // Pulsing effect
    ctx.globalAlpha = alpha;
    ctx.font = "20px 'Press Start 2P'";
    ctx.fillStyle = '#00f7ff';
    ctx.fillText('Click or Press SPACE to return', canvas.width/2, canvas.height/2 + 100);
    
    ctx.restore();
}

function drawLevelStart() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - levelAnimationStart;
    
    if (elapsedTime < 2000) {  // Show for 2 seconds
        ctx.font = '48px "Press Start 2P"';
        ctx.fillStyle = '#00f7ff';
        ctx.shadowColor = '#00f7ff';
        ctx.shadowBlur = 20;
        ctx.textAlign = 'center';
        // Fade out effect
        ctx.globalAlpha = 1 - elapsedTime/2000;
        ctx.fillText(`LEVEL ${currentLevel}`, canvas.width/2, canvas.height/2);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
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

function gameLoop(currentTime) {
    if (bgmEnabled && bgMusic.paused) {
        toggleBackgroundMusic();
    }
    
    const deltaTime = (currentTime - lastTime) / 16;
    lastTime = currentTime;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw game elements
    drawBricks();
    drawBall();
    drawPaddle();
    drawLives();
    drawLevelDisplay();
    drawScore();
    
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

function handleGameOver() {
    // Stop background music and play game over sound
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }
    playSound('game_over');
    
    // Update high score if needed
    const currentHighScore = localStorage.getItem('breakoutHighScore') || 0;
    if (score > currentHighScore) {
        localStorage.setItem('breakoutHighScore', score);
    }
    
    // Set game over state
    gameOver = true;
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
    
    // Play start sound then background music
    playSound('game_start');
    setTimeout(() => {
        if (bgmEnabled) {
            toggleBackgroundMusic();
        }
    }, 500);
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
playSound('game_start');  // Play start sound

// Start the game loop
gameLoop(performance.now());

// Add click event listener for game over
canvas.addEventListener('click', () => {
    if (gameOver || gameWon) {
        window.location.href = '/index.html';
    }
});