const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game objects
const paddleWidth = 80;
const paddleHeight = 10;
const ballRadius = 6;
const brickRowCount = 4;
const brickColumnCount = 8;  // Increased columns for full width
const brickPadding = 2;     // Reduced padding between bricks
const brickHeight = 25;     // Slightly taller bricks
// Calculate brick width based on canvas width
const brickWidth = (canvas.width - (brickPadding * (brickColumnCount + 1))) / brickColumnCount;
const brickOffsetTop = 30;
const brickOffsetLeft = brickPadding; // Start from left edge with padding

// Retro color palette
const brickColors = [
    '#FF0000', // Red
    '#FF7F00', // Orange
    '#FFFF00', // Yellow
    '#00FF00', // Green
];

// Game state
let lives = 3;
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
    dx: 5,
    dy: -5,
    radius: ballRadius
};

// Create bricks with colors
const bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { 
            x: 0, 
            y: 0, 
            status: 1,
            color: brickColors[r] // Each row has its own color
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

function drawLives() {
    const heartSize = 20;
    const startX = canvas.width - (heartSize * 4);
    const startY = 20;
    
    for (let i = 0; i < lives; i++) {
        ctx.beginPath();
        const x = startX + (heartSize * i * 1.2);
        // Draw heart shape
        ctx.moveTo(x + heartSize/2, startY + heartSize/4);
        ctx.bezierCurveTo(
            x + heartSize/2, startY, 
            x, startY, 
            x, startY + heartSize/4
        );
        ctx.bezierCurveTo(
            x, startY + heartSize/2, 
            x + heartSize/2, startY + heartSize * 0.75, 
            x + heartSize/2, startY + heartSize
        );
        ctx.bezierCurveTo(
            x + heartSize/2, startY + heartSize * 0.75, 
            x + heartSize, startY + heartSize/2, 
            x + heartSize, startY + heartSize/4
        );
        ctx.bezierCurveTo(
            x + heartSize, startY, 
            x + heartSize/2, startY, 
            x + heartSize/2, startY + heartSize/4
        );
        ctx.fillStyle = '#FF6B6B';
        ctx.fill();
        ctx.closePath();
    }
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

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw game objects
    drawBricks();
    drawBall();
    drawPaddle();
    drawLives();

    // Check for collisions
    collisionDetection();

    // Ball collision with walls
    if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
        ball.dx = -ball.dx;
    }
    if (ball.y + ball.dy < ball.radius) {
        ball.dy = -ball.dy;
    } else if (ball.y + ball.dy > canvas.height - ball.radius) {
        if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
            ball.dy = -ball.dy;
        } else {
            lives--;
            if (!lives) {
                gameOver = true;
            } else {
                ball.x = canvas.width / 2;
                ball.y = paddle.y - ball.radius;
                ball.dx = 5;
                ball.dy = -5;
                paddle.x = (canvas.width - paddle.width) / 2;
            }
        }
    }

    // Paddle movement
    if (rightPressed && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.dx;
    } else if (leftPressed && paddle.x > 0) {
        paddle.x -= paddle.dx;
    }

    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Game over or won
    if (gameOver) {
        drawGameOver();
        return;
    }

    if (gameWon) {
        drawWin();
        return;
    }

    requestAnimationFrame(draw);
}

// Start the game
draw();
