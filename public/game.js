const socket = io("https://pong-rush-backend.onrender.com");
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("room");

socket.emit("joinRoom", roomId);

// Wait until both players join
socket.on("startGame", () => {
  console.log("✅ Both players joined — starting game!");
  startGame();
});

function startGame() {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // Vertical setup
  canvas.width = 400;
  canvas.height = 600;

  // Game objects
  const paddleWidth = 80;
  const paddleHeight = 10;
  let playerX = canvas.width / 2 - paddleWidth / 2;
  let opponentX = canvas.width / 2 - paddleWidth / 2;

  let ballX = canvas.width / 2;
  let ballY = canvas.height / 2;
  const ballRadius = 8;
  let ballSpeedX = 3;
  let ballSpeedY = 3;
  let playerScore = 0;
  let opponentScore = 0;

  let isGameRunning = true;

  function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function drawCircle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  function drawText(text, x, y, color) {
    ctx.fillStyle = color;
    ctx.font = "24px Arial";
    ctx.fillText(text, x, y);
  }

  function drawGame() {
    drawRect(0, 0, canvas.width, canvas.height, "black");

    // Player paddle (bottom)
    drawRect(playerX, canvas.height - paddleHeight - 10, paddleWidth, paddleHeight, "cyan");

    // Opponent paddle (top)
    drawRect(opponentX, 10, paddleWidth, paddleHeight, "magenta");

    // Ball
    drawCircle(ballX, ballY, ballRadius, "white");

    // Scores
    drawText(playerScore, 30, canvas.height / 2 + 50, "white");
    drawText(opponentScore, 30, canvas.height / 2 - 30, "white");
  }

  function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedY = -ballSpeedY;
  }

  function moveBall() {
    if (!isGameRunning) return;

    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Bounce on walls
    if (ballX - ballRadius < 0 || ballX + ballRadius > canvas.width) {
      ballSpeedX = -ballSpeedX;
    }

    // Bounce on paddles
    if (
      ballY + ballRadius >= canvas.height - paddleHeight - 10 && // hits bottom
      ballX > playerX &&
      ballX < playerX + paddleWidth
    ) {
      ballSpeedY = -ballSpeedY;
    }

    if (
      ballY - ballRadius <= 10 + paddleHeight && // hits top
      ballX > opponentX &&
      ballX < opponentX + paddleWidth
    ) {
      ballSpeedY = -ballSpeedY;
    }

    // Scoring
    if (ballY - ballRadius < 0) {
      playerScore++;
      resetBall();
    } else if (ballY + ballRadius > canvas.height) {
      opponentScore++;
      resetBall();
    }
  }

  // --- Multiplayer paddle sync ---
  socket.on("opponentMove", (x) => {
    opponentX = x;
  });

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    playerX = e.clientX - rect.left - paddleWidth / 2;

    // Emit movement to the other player
    socket.emit("playerMove", { roomId, x: playerX });
  });

  function gameLoop() {
    moveBall();
    drawGame();
    requestAnimationFrame(gameLoop);
  }

  gameLoop();
}
