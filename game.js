const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game objects
const paddleWidth = 80;
const paddleHeight = 10;
const ballRadius = 4;  // Made ball smaller
const brickRowCount = 10;  // Changed from 20 to 10 rows
const brickPadding = 1;
const desiredBrickSize = 12;
const brickColumnCount = Math.floor(canvas.width / (desiredBrickSize + brickPadding));
const brickWidth = (canvas.width - (brickPadding * (brickColumnCount + 1))) / brickColumnCount;
const brickHeight = brickWidth;
const brickOffsetTop = 30;
const brickOffsetLeft = (canvas.width - (brickColumnCount * (brickWidth + brickPadding) - brickPadding)) / 2;

// Extended color palette for 10 rows
const brickColors = [
    '#FF0000', // Red
    '#FF7F00', // Orange
    '#FFFF00', // Yellow
    '#00FF00', // Green
    '#00CED1', // Dark Turquoise
    '#0000FF', // Blue
    '#4B0082', // Indigo
    '#8B00FF', // Violet
    '#FF1493', // Deep Pink
    '#FF69B4', // Hot Pink
];

// Game state
let lives = 3;
let score = 0;  // Added score
let gameOver = false;
let gameWon = false;

// Paddle properties
const paddle = {
    x: canvas.width / 2 - paddleWidth / 2,
    y: canvas.height - 30,
    width: paddleWidth,
    height: paddleHeight,
    dx: 8
};

// Ball properties
const ball = {
    x: canvas.width / 2,
    y: paddle.y - ballRadius,
    dx: 7,  // Increased ball speed
    dy: -7,
    radius: ballRadius,
    speed: 7
};

// Create bricks with random colors
const bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { 
            x: 0, 
            y: 0, 
            status: 1,
            color: brickColors[Math.floor(Math.random() * brickColors.length)] // Random color for each brick
        };
    }
}

// Event listeners for paddle movement
let rightPressed = false;
let leftPressed = false;

document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);
document.addEventListener('mousemove', mouseMoveHandler);

function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
    }
}

function mouseMoveHandler(e) {
    const relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width / 2;
    }
}

// Collision detection
function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                if (ball.x > b.x && ball.x < b.x + brickWidth && ball.y > b.y && ball.y < b.y + brickHeight) {
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score += 10;  // Add 10 points for each brick
                    checkWin();
                }
            }
        }
    }
}

function checkWin() {
    let allBroken = true;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                allBroken = false;
                break;
            }
        }
    }
    if (allBroken) {
        gameWon = true;
    }
}

function checkPaddleCollision() {
    if (ball.y + ball.radius > paddle.y && 
        ball.y - ball.radius < paddle.y + paddle.height &&
        ball.x + ball.radius > paddle.x && 
        ball.x - ball.radius < paddle.x + paddle.width) {
        
        // Calculate where on the paddle the ball hit (0 = left edge, 1 = right edge)
        const hitPos = (ball.x - paddle.x) / paddle.width;
        
        // Change angle based on where the ball hits the paddle
        // Hit on edges causes more extreme angles
        const maxBounceAngle = Math.PI / 3; // 60 degrees
        const bounceAngle = maxBounceAngle * (hitPos - 0.5);
        
        // Set new velocity based on bounce angle
        ball.dx = ball.speed * Math.sin(bounceAngle);
        ball.dy = -ball.speed * Math.cos(bounceAngle);
        
        // Ensure ball doesn't get stuck in paddle
        ball.y = paddle.y - ball.radius;
        
        // Add slight speed increase on each hit
        ball.speed = Math.min(ball.speed * 1.05, 15); // Cap max speed at 15
    }
}

// Drawing functions
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    // Add shine effect to ball
    const gradient = ctx.createRadialGradient(
        ball.x - ball.radius/3, 
        ball.y - ball.radius/3, 
        ball.radius/4,
        ball.x, 
        ball.y, 
        ball.radius
    );
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(1, '#4834D4');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = '#4834D4';
    ctx.fill();
    // Add 3D effect to paddle
    ctx.beginPath();
    ctx.moveTo(paddle.x, paddle.y + paddle.height);
    ctx.lineTo(paddle.x, paddle.y);
    ctx.lineTo(paddle.x + paddle.width, paddle.y);
    ctx.strokeStyle = '#FFFFFF80';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
    
    ctx.beginPath();
    ctx.moveTo(paddle.x + paddle.width, paddle.y);
    ctx.lineTo(paddle.x + paddle.width, paddle.y + paddle.height);
    ctx.lineTo(paddle.x, paddle.y + paddle.height);
    ctx.strokeStyle = '#00000040';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;

                // Main brick body
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = bricks[c][r].color;
                ctx.fill();
                ctx.closePath();

                // 3D effect - lighter top and left edges
                ctx.beginPath();
                ctx.moveTo(brickX, brickY + brickHeight);
                ctx.lineTo(brickX, brickY);
                ctx.lineTo(brickX + brickWidth, brickY);
                ctx.strokeStyle = '#FFFFFF80';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.closePath();

                // 3D effect - darker bottom and right edges
                ctx.beginPath();
                ctx.moveTo(brickX + brickWidth, brickY);
                ctx.lineTo(brickX + brickWidth, brickY + brickHeight);
                ctx.lineTo(brickX, brickY + brickHeight);
                ctx.strokeStyle = '#00000040';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
}

function drawScore() {
    ctx.font = '16px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Score: ' + score, canvas.width - 100, canvas.height - 20);
}

function drawLives() {
    ctx.font = '16px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Lives: ' + lives, 20, canvas.height - 20);
}

function drawGameOver() {
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    
    // Shadow effect
    ctx.fillStyle = '#FF0000';
    for(let i = 0; i < 5; i++) {
        ctx.fillText('GAME OVER', canvas.width/2 + i, canvas.height/2 + i);
    }
    
    // Main text
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
    
    // Blinking "Press SPACE to restart" text
    if(Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.font = '20px Courier New';
        ctx.fillStyle = '#FFFF00';
        ctx.fillText('PRESS SPACE TO RESTART', canvas.width/2, canvas.height/2 + 50);
    }
}

function drawWin() {
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    
    // Rainbow effect
    const hue = (Date.now() / 50) % 360;
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.fillText('YOU WIN!', canvas.width/2, canvas.height/2);
    
    if(Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.font = '20px Courier New';
        ctx.fillStyle = '#FFFF00';
        ctx.fillText('PRESS SPACE TO RESTART', canvas.width/2, canvas.height/2 + 50);
    }
}

// Add space bar listener for restart
document.addEventListener('keydown', function(e) {
    if((gameOver || gameWon) && e.code === 'Space') {
        document.location.reload();
    }
});

// Cache frequently used values
let lastTime = 0;
const fps = 60;
const frameInterval = 1000 / fps;

function draw(currentTime) {
    // Control frame rate
    const deltaTime = currentTime - lastTime;
    if (deltaTime < frameInterval) {
        requestAnimationFrame(draw);
        return;
    }
    lastTime = currentTime;

    if (gameOver || gameWon) {
        if (gameOver) drawGameOver();
        if (gameWon) drawWin();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update game state
    if (rightPressed && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.dx;
    }
    else if (leftPressed && paddle.x > 0) {
        paddle.x -= paddle.dx;
    }

    // Update ball position
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with walls
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
    }
    if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
    }
    else if (ball.y + ball.radius > canvas.height) {
        lives--;
        if (lives === 0) {
            gameOver = true;
        } else {
            ball.x = canvas.width / 2;
            ball.y = paddle.y - ball.radius;
            ball.dx = 7;
            ball.dy = -7;
            paddle.x = (canvas.width - paddle.width) / 2;
        }
    }

    // Draw game objects
    drawBricks();
    drawBall();
    drawPaddle();
    drawScore();
    drawLives();
    
    // Check collisions
    collisionDetection();
    checkPaddleCollision();

    requestAnimationFrame(draw);
}

// Start the game with requestAnimationFrame
requestAnimationFrame(draw);
