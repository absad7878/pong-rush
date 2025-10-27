const socket = io(); // Localhost, same origin
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("room");
console.log("Joining room:", roomId);
socket.emit("joinRoom", roomId);

socket.on("connect", () => {
  console.log("Game page connected to server:", socket.id);
});
socket.on("connect_error", (err) => {
  console.error("Game page connection error:", err.message);
});

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

  // Touch control variables
  const touchCircleRadius = 20;
  let touchCircleX = canvas.width / 2;
  let isTouching = false;
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

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
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // Semi-transparent background
    ctx.fillRect(x - 10, y - 20, 40, 30);
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

    // Touch control circle (only on touch devices)
    if (isTouchDevice) {
      drawCircle(touchCircleX, canvas.height - 50, touchCircleRadius, isTouching ? "rgba(0, 255, 255, 1)" : "rgba(0, 255, 255, 0.7)");
    }

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
      ballY + ballRadius >= canvas.height - paddleHeight - 10 &&
      ballX > playerX &&
      ballX < playerX + paddleWidth
    ) {
      ballSpeedY = -ballSpeedY;
    }

    if (
      ballY - ballRadius <= 10 + paddleHeight &&
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

  // Multiplayer paddle sync
  socket.on("opponentMove", (x) => {
    opponentX = x;
  });

  // Mouse control (desktop)
  canvas.addEventListener("mousemove", (e) => {
    if (!isTouchDevice) {
      const rect = canvas.getBoundingClientRect();
      playerX = e.clientX - rect.left - paddleWidth / 2;
      playerX = Math.max(0, Math.min(playerX, canvas.width - paddleWidth));
      socket.emit("playerMove", { roomId, x: playerX });
    }
  });

  // Touch control (mobile)
  if (isTouchDevice) {
    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const touchX = touch.clientX - rect.left;
      if (
        Math.abs(touchX - touchCircleX) <= touchCircleRadius &&
        touch.pageY - rect.top > canvas.height - 100
      ) {
        isTouching = true;
      }
    });

    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      if (isTouching) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        touchCircleX = touch.clientX - rect.left;
        touchCircleX = Math.max(touchCircleRadius, Math.min(touchCircleX, canvas.width - touchCircleRadius));
        playerX = touchCircleX - paddleWidth / 2;
        playerX = Math.max(0, Math.min(playerX, canvas.width - paddleWidth));
        socket.emit("playerMove", { roomId, x: playerX });
      }
    });

    canvas.addEventListener("touchend", () => {
      isTouching = false;
    });
  }

  function gameLoop() {
    moveBall();
    drawGame();
    requestAnimationFrame(gameLoop);
  }

  gameLoop();
}