const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 8;
const PADDLE_SPEED = 6;
const BALL_SPEED = 5;
const MAX_BALL_SPEED = 8;

let gameRunning = false;
let gameStarted = false;

// Player paddle (left side)
const playerPaddle = {
    x: 20,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0,
    speed: PADDLE_SPEED
};

// Computer paddle (right side)
const computerPaddle = {
    x: canvas.width - 20 - PADDLE_WIDTH,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0,
    speed: PADDLE_SPEED * 0.8 // Slightly slower than player
};

// Ball
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    dx: BALL_SPEED,
    dy: BALL_SPEED,
    size: BALL_SIZE
};

// Score
let playerScore = 0;
let computerScore = 0;

// Input handling
const keys = {};
let mouseY = canvas.height / 2;

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === ' ') {
        e.preventDefault();
        if (!gameStarted) {
            gameRunning = true;
            gameStarted = true;
            resetBall();
        } else {
            gameRunning = !gameRunning;
        }
        updateGameStatus();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseY = e.clientY - rect.top;
});

// Game status update
function updateGameStatus() {
    const statusElement = document.getElementById('gameStatus');
    if (!gameStarted) {
        statusElement.textContent = 'Press SPACE to Start';
    } else if (gameRunning) {
        statusElement.textContent = 'Press SPACE to Pause';
    } else {
        statusElement.textContent = 'Paused - Press SPACE to Resume';
    }
}

// Reset ball to center
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED;
    ball.dy = (Math.random() - 0.5) * BALL_SPEED;
}

// Update player paddle position
function updatePlayerPaddle() {
    // Mouse control
    playerPaddle.y = mouseY - playerPaddle.height / 2;
    
    // Arrow keys as backup
    if (keys['ArrowUp']) {
        playerPaddle.y = Math.max(0, playerPaddle.y - playerPaddle.speed);
    }
    if (keys['ArrowDown']) {
        playerPaddle.y = Math.min(canvas.height - playerPaddle.height, playerPaddle.y + playerPaddle.speed);
    }
    
    // Boundary check
    playerPaddle.y = Math.max(0, Math.min(canvas.height - playerPaddle.height, playerPaddle.y));
}

// Update computer paddle position (AI)
function updateComputerPaddle() {
    const computerCenter = computerPaddle.y + computerPaddle.height / 2;
    const ballCenter = ball.y;
    
    // Simple AI: follow the ball with some imperfection
    if (computerCenter < ballCenter - 15) {
        computerPaddle.y = Math.min(canvas.height - computerPaddle.height, computerPaddle.y + computerPaddle.speed);
    } else if (computerCenter > ballCenter + 15) {
        computerPaddle.y = Math.max(0, computerPaddle.y - computerPaddle.speed);
    }
}

// Update ball position
function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Collision with top and bottom walls
    if (ball.y - ball.size < 0 || ball.y + ball.size > canvas.height) {
        ball.dy = -ball.dy;
        ball.y = Math.max(ball.size, Math.min(canvas.height - ball.size, ball.y));
    }
    
    // Collision with paddles
    checkPaddleCollision(playerPaddle);
    checkPaddleCollision(computerPaddle);
    
    // Score points
    if (ball.x - ball.size < 0) {
        computerScore++;
        document.getElementById('computerScore').textContent = computerScore;
        resetBall();
    } else if (ball.x + ball.size > canvas.width) {
        playerScore++;
        document.getElementById('playerScore').textContent = playerScore;
        resetBall();
    }
}

// Check collision between ball and paddle
function checkPaddleCollision(paddle) {
    if (
        ball.x - ball.size < paddle.x + paddle.width &&
        ball.x + ball.size > paddle.x &&
        ball.y - ball.size < paddle.y + paddle.height &&
        ball.y + ball.size > paddle.y
    ) {
        // Reflect ball
        ball.dx = -ball.dx;
        
        // Add spin based on where ball hits paddle
        const paddleCenter = paddle.y + paddle.height / 2;
        const ballRelativePos = ball.y - paddleCenter;
        const normalizedPos = ballRelativePos / (paddle.height / 2);
        ball.dy += normalizedPos * 3;
        
        // Cap ball speed
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        if (speed > MAX_BALL_SPEED) {
            ball.dx = (ball.dx / speed) * MAX_BALL_SPEED;
            ball.dy = (ball.dy / speed) * MAX_BALL_SPEED;
        }
        
        // Push ball away from paddle to avoid multiple collisions
        if (ball.dx < 0) {
            ball.x = paddle.x + paddle.width + ball.size;
        } else {
            ball.x = paddle.x - ball.size;
        }
    }
}

// Draw functions
function drawPaddle(paddle) {
    ctx.fillStyle = '#00ff00';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ff00';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowBlur = 0;
}

function drawBall() {
    ctx.fillStyle = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff0000';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawCenterLine() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw center line
    drawCenterLine();
    
    // Draw paddles and ball
    drawPaddle(playerPaddle);
    drawPaddle(computerPaddle);
    drawBall();
}

// Update game state
function update() {
    if (gameRunning) {
        updatePlayerPaddle();
        updateComputerPaddle();
        updateBall();
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize game status
updateGameStatus();

// Start game loop
gameLoop();
