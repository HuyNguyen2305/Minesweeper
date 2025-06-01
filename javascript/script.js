document.addEventListener('DOMContentLoaded', () => {
  // Get references to DOM elements
  const gameContainer = document.getElementById('game');
  const difficultySelector = document.getElementById('difficulty');
  const bombCounter = document.getElementById('bomb-counter');
  const timerCounter = document.getElementById('timer-counter');

  // Game configuration for each difficulty
  const config = {
    easy:   { rows: 12, cols: 12, mines: 48 },
    medium: { rows: 16, cols: 16, mines: 80 },
    hard:   { rows: 18, cols: 18, mines: 99 }
  };

  // Game state variables
  let board = [];
  let gameOver = false;
  let firstMove = true;
  let timer = null;
  let seconds = 0;
  let boardHistory = [];

  // Timer functions
  function startTimer(callback) {
    stopTimer();
    seconds = 0;
    callback(seconds);
    timer = setInterval(() => {
      seconds++;
      callback(seconds);
    }, 1000);
  }
  function stopTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }
  function resetTimer(callback) {
    stopTimer();
    seconds = 0;
    callback(seconds);
  }

  // Deep clone the board for undo functionality
  function cloneBoard(board) {
    return board.map(row => row.map(cell => ({ ...cell })));
  }

  // Save the current state for undo
  function saveHistory() {
    boardHistory.push({
      board: cloneBoard(board),
      gameOver,
      firstMove,
      seconds
    });
    // Limit history to last 20 moves
    if (boardHistory.length > 20) boardHistory.shift();
  }

  // Undo the last move
  function undoMove() {
    if (boardHistory.length === 0) return;
    const last = boardHistory.pop();
    board = cloneBoard(last.board);
    gameOver = last.gameOver;
    firstMove = last.firstMove;
    seconds = last.seconds;
    renderBoard();
    updateTimerDisplay(seconds);
  }

  // Update the bomb counter display
  function updateBombCounter() {
    const { mines } = config[difficultySelector.value];
    let flagged = 0;
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        if (board[r][c].flagged) flagged++;
      }
    }
    bombCounter.textContent = String(mines - flagged).padStart(3, '0');
  }

  // Update the timer display
  function updateTimerDisplay(seconds) {
    timerCounter.textContent = String(seconds).padStart(3, '0');
  }

  // Responsive resizing for the board and cells
  function resizeBoard() {
    const { cols } = config[difficultySelector.value];
    // Calculate max width for the board (leave some margin)
    const maxWidth = Math.min(window.innerWidth - 60, cols * 36 + 40);
    const cellSize = Math.max(24, Math.floor((maxWidth - (cols - 1) * 2) / cols));
    gameContainer.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
    document.querySelectorAll('.cell').forEach(cell => {
      cell.style.width = `${cellSize}px`;
      cell.style.height = `${cellSize}px`;
      cell.style.fontSize = `${Math.max(14, cellSize * 0.55)}px`;
    });
  }

  // Render the game board based on the current state
  function renderBoard() {
    const { rows, cols } = config[difficultySelector.value];
    gameContainer.innerHTML = '';
    gameContainer.style.gridTemplateColumns = `repeat(${cols}, 36px)`;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = board[r][c];
        const cellDiv = document.createElement('div');
        cellDiv.classList.add('cell');
        cellDiv.dataset.row = r;
        cellDiv.dataset.col = c;
        // Show revealed state
        if (cell.revealed) {
          cellDiv.style.backgroundColor = '#bbb';
          if (cell.isMine) {
            cellDiv.style.backgroundColor = 'red';
            cellDiv.textContent = '💣';
          } else if (cell.adjacentMines > 0) {
            cellDiv.innerHTML = `<span class="cell-number">${cell.adjacentMines}</span>`;
          }
        } else if (cell.flagged) {
          cellDiv.textContent = '🚩';
        }
        // Add event listeners for click and right-click
        cellDiv.addEventListener('click', () => {
          revealCell(r, c, cellDiv);
        });
        cellDiv.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          toggleFlag(r, c, cellDiv);
        });
        gameContainer.appendChild(cellDiv);
      }
    }
    updateBombCounter();
    resizeBoard(); // Smoothly resize after rendering
  }

  // Create a new board for the selected difficulty
  function createBoard(level) {
    const { rows, cols, mines } = config[level];
    gameContainer.innerHTML = '';
    gameContainer.style.gridTemplateColumns = `repeat(${cols}, 36px)`; // updated size
    gameOver = false;
    firstMove = true;
    resetTimer(updateTimerDisplay);
    boardHistory = [];

    // Initialize board array
    board = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        isMine: false,
        revealed: false,
        adjacentMines: 0,
        flagged: false
      }))
    );

    // Place random mines
    let placedMines = 0;
    while (placedMines < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (!board[r][c].isMine) {
        board[r][c].isMine = true;
        placedMines++;
      }
    }

    // Calculate adjacent mines for each cell
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c].isMine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
              count++;
            }
          }
        }
        board[r][c].adjacentMines = count;
      }
    }

    renderBoard();
  }

  // Reveal a cell and handle game logic
  function revealCell(r, c, cellDiv) {
    if (gameOver) return;
    saveHistory();
    if (firstMove) {
      startTimer(updateTimerDisplay);
      firstMove = false;
    }
    const cell = board[r][c];
    if (cell.revealed) return;
    cell.revealed = true;

    if (cell.isMine) {
      cellDiv.style.backgroundColor = 'red';
      cellDiv.textContent = '💣';
      revealAllMines();
      gameOver = true;
      stopTimer();
      Toastify({
        text: "Game Over!",
        duration: 3000,
        gravity: "top",
        position: "center",
        backgroundColor: "#ff4d4d",
      }).showToast();
    } else {
      cellDiv.style.backgroundColor = '#bbb';
      if (cell.adjacentMines > 0) {
        cellDiv.innerHTML = `<span class="cell-number">${cell.adjacentMines}</span>`;
      } else {
        floodReveal(r, c);
      }
      if (checkWin()) {
        gameOver = true;
        stopTimer();
        Toastify({
          text: "You Win!",
          duration: 3000,
          gravity: "top",
          position: "center",
          backgroundColor: "#4caf50",
        }).showToast();
      }
    }
    renderBoard();
  }

  // Reveal all connected empty cells (flood fill)
  function floodReveal(r, c) {
    const { rows, cols } = config[difficultySelector.value];
    const queue = [[r, c]];
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    visited[r][c] = true;

    while (queue.length > 0) {
      const [cr, cc] = queue.shift();
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = cr + dr, nc = cc + dc;
          if (
            nr >= 0 && nr < rows &&
            nc >= 0 && nc < cols &&
            !(dr === 0 && dc === 0) &&
            !visited[nr][nc]
          ) {
            const neighbor = board[nr][nc];
            if (!neighbor.revealed && !neighbor.flagged && !neighbor.isMine) {
              neighbor.revealed = true;
              visited[nr][nc] = true;
              if (neighbor.adjacentMines === 0) {
                queue.push([nr, nc]);
              }
            }
          }
        }
      }
    }
  }

  // Reveal all mines when the game is over
  function revealAllMines() {
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        const cell = board[r][c];
        if (cell.isMine) {
          cell.revealed = true;
        }
      }
    }
    renderBoard();
  }

  // Check if the player has won
  function checkWin() {
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        const cell = board[r][c];
        if (!cell.isMine && !cell.revealed) {
          return false;
        }
      }
    }
    return true;
  }

  // Create and add the Play Again and Undo buttons in a button bar under the board
  let buttonBar = document.getElementById('button-bar');
  if (!buttonBar) {
    buttonBar = document.createElement('div');
    buttonBar.id = 'button-bar';
    buttonBar.className = 'button-bar';
    gameContainer.parentNode.parentNode.appendChild(buttonBar);
  }
  buttonBar.innerHTML = ''; // Clear previous buttons

  // Play Again button
  let playAgainBtn = document.createElement('button');
  playAgainBtn.id = 'play-again-btn';
  playAgainBtn.textContent = 'Play Again';
  buttonBar.appendChild(playAgainBtn);

  // Undo button
  let undoBtn = document.createElement('button');
  undoBtn.id = 'undo-btn';
  undoBtn.textContent = 'Undo';
  buttonBar.appendChild(undoBtn);

  playAgainBtn.onclick = () => {
    createBoard(difficultySelector.value);
  };
  undoBtn.onclick = undoMove;

  // Toggle flag on right-click
  function toggleFlag(r, c, cellDiv) {
    if (gameOver) return;
    saveHistory();
    const cell = board[r][c];
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;
    renderBoard();
  }

  // Initial load
  createBoard(difficultySelector.value);

  // Smooth resize on window resize
  window.addEventListener('resize', resizeBoard);

  // Change board on difficulty selection
  difficultySelector.addEventListener('change', (e) => {
    const level = e.target.value;
    createBoard(level);
  });
});
