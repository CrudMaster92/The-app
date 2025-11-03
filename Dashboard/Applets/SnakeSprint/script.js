(function () {
  const canvas = document.getElementById('board');
  const status = document.getElementById('status');
  const scoreEl = document.getElementById('score');
  const resetButton = document.getElementById('resetButton');
  const ctx = canvas.getContext('2d');

  const gridSize = 16;
  const cells = canvas.width / gridSize;

  let animation = null;
  let velocity = { x: 1, y: 0 };
  let pendingDirection = null;
  let snake = [];
  let food = null;
  let score = 0;
  let running = false;

  function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * gridSize, y * gridSize, gridSize - 1, gridSize - 1);
  }

  function clearBoard() {
    ctx.fillStyle = 'rgba(0, 12, 6, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function randomCell() {
    return {
      x: Math.floor(Math.random() * cells),
      y: Math.floor(Math.random() * cells),
    };
  }

  function spawnFood() {
    let candidate = randomCell();
    while (snake.some((segment) => segment.x === candidate.x && segment.y === candidate.y)) {
      candidate = randomCell();
    }
    food = candidate;
  }

  function setStatus(message) {
    if (status) {
      status.textContent = message;
    }
  }

  function updateScore(amount) {
    score = amount;
    if (scoreEl) {
      scoreEl.textContent = String(score);
    }
  }

  function startGame() {
    snake = [
      { x: Math.floor(cells / 2) - 1, y: Math.floor(cells / 2) },
      { x: Math.floor(cells / 2) - 2, y: Math.floor(cells / 2) },
    ];
    velocity = { x: 1, y: 0 };
    pendingDirection = null;
    updateScore(0);
    spawnFood();
    running = true;
    setStatus('In motion. Keep the snake alive.');
    tick();
  }

  function endGame() {
    running = false;
    if (animation) {
      cancelAnimationFrame(animation);
      animation = null;
    }
    setStatus('Impact detected. Press restart to run it back.');
  }

  function applyDirection(next) {
    if (!next) return;
    const { x, y } = velocity;
    if ((next.x === -x && next.y === -y)) {
      return;
    }
    velocity = next;
  }

  function updateSnake() {
    const head = { ...snake[0] };
    applyDirection(pendingDirection);
    pendingDirection = null;

    head.x += velocity.x;
    head.y += velocity.y;

    if (head.x < 0 || head.y < 0 || head.x >= cells || head.y >= cells) {
      endGame();
      return;
    }

    if (snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
      endGame();
      return;
    }

    snake.unshift(head);

    if (food && head.x === food.x && head.y === food.y) {
      updateScore(score + 10);
      spawnFood();
    } else {
      snake.pop();
    }
  }

  function draw() {
    clearBoard();
    snake.forEach((segment, index) => {
      const intensity = 0.45 + (snake.length - index) / (snake.length * 1.6);
      drawCell(segment.x, segment.y, `rgba(76, 234, 172, ${intensity.toFixed(2)})`);
    });

    if (food) {
      drawCell(food.x, food.y, 'rgba(255, 102, 102, 0.9)');
    }
  }

  let lastFrame = 0;
  const speed = 120;

  function tick(timestamp = 0) {
    if (!running) return;
    if (!lastFrame) {
      lastFrame = timestamp;
    }

    const elapsed = timestamp - lastFrame;

    if (elapsed > speed) {
      lastFrame = timestamp;
      updateSnake();
      draw();
    }

    animation = requestAnimationFrame(tick);
  }

  function reset() {
    cancelAnimationFrame(animation);
    animation = null;
    running = false;
    setStatus('Tap an arrow key to begin.');
    updateScore(0);
    clearBoard();
  }

  function handleKey(event) {
    const keyMap = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
    };

    const nextDirection = keyMap[event.key];
    if (!nextDirection) {
      return;
    }

    event.preventDefault();

    if (!running) {
      startGame();
    }

    pendingDirection = nextDirection;
  }

  document.addEventListener('keydown', handleKey);

  if (resetButton) {
    resetButton.addEventListener('click', reset);
  }

  reset();
})();
