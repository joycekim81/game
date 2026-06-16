// 테트리스 보드 크기
const COLS = 10;
const ROWS = 20;
const DROP_INTERVAL_MS = 800;

// 줄 삭제 점수 (한 번에 삭제한 줄 수 → 점수)
const LINE_SCORES = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

// DOM 요소
const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
const startButton = document.getElementById("start-btn");
const restartButton = document.getElementById("restart-btn");
const statusMessage = document.getElementById("status-message");

// 테트로미노 블록 정의 (1 = 채워진 칸)
const PIECES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
};

const PIECE_TYPES = Object.keys(PIECES);

// 게임 상태
let board = [];
let currentPiece = null;
let score = 0;
let isPlaying = false;
let isGameOver = false;
let dropTimerId = null;

/**
 * 빈 보드(2차원 배열)를 만듭니다.
 * 0 = 빈 칸, 블록 종류 문자(I, O, T...) = 고정된 블록
 */
function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

/**
 * 새 블록을 생성합니다.
 * @param {string} type - I, O, T, S, Z, J, L 중 하나
 * @returns {{ type: string, shape: number[][], row: number, col: number }}
 */
function createPiece(type) {
  const definition = PIECES[type];

  if (!definition) {
    throw new Error(`알 수 없는 블록 종류: ${type}`);
  }

  const shape = definition.shape.map((row) => [...row]);
  const startCol = Math.floor((COLS - shape[0].length) / 2);

  return {
    type,
    shape,
    row: 0,
    col: startCol,
  };
}

/**
 * 이동 가능 여부를 판정합니다.
 * @param {{ shape: number[][], row: number, col: number }} piece
 * @param {number} dx - 가로 이동량
 * @param {number} dy - 세로 이동량
 * @param {(string|number)[][]} matrix - 고정 블록이 있는 보드
 * @returns {boolean}
 */
function canMove(piece, dx, dy, matrix) {
  const { shape, row, col } = piece;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) {
        continue;
      }

      const newRow = row + r + dy;
      const newCol = col + c + dx;

      if (newCol < 0 || newCol >= COLS) {
        return false;
      }

      if (newRow >= ROWS) {
        return false;
      }

      if (newRow < 0) {
        continue;
      }

      if (matrix[newRow][newCol] !== 0) {
        return false;
      }
    }
  }

  return true;
}

/**
 * 현재 블록을 보드에 고정합니다.
 */
function lockPiece() {
  if (!currentPiece) {
    return;
  }

  const { type, shape, row, col } = currentPiece;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) {
        continue;
      }

      const boardRow = row + r;
      const boardCol = col + c;

      if (
        boardRow >= 0 &&
        boardRow < ROWS &&
        boardCol >= 0 &&
        boardCol < COLS
      ) {
        board[boardRow][boardCol] = type;
      }
    }
  }

  currentPiece = null;
}

/**
 * 한 줄이 모두 채워졌는지 확인합니다.
 */
function isRowFull(row) {
  return board[row].every((cell) => cell !== 0);
}

/**
 * 가득 찬 줄을 삭제하고 위 줄을 내립니다.
 * @returns {number} 삭제된 줄 수
 */
function clearFullLines() {
  let linesCleared = 0;

  for (let row = ROWS - 1; row >= 0; row--) {
    if (!isRowFull(row)) {
      continue;
    }

    board.splice(row, 1);
    board.unshift(Array(COLS).fill(0));
    linesCleared += 1;
    row += 1;
  }

  return linesCleared;
}

/**
 * 삭제된 줄 수에 따라 점수를 증가시킵니다.
 */
function addScore(linesCleared) {
  if (linesCleared === 0) {
    return;
  }

  const points = LINE_SCORES[linesCleared] ?? linesCleared * 100;
  score += points;
  updateScoreDisplay();
}

/**
 * 블록 고정 → 줄 삭제 → 점수 반영 → 새 블록 생성
 */
function settlePiece() {
  lockPiece();

  const linesCleared = clearFullLines();
  addScore(linesCleared);

  const spawned = spawnNewPiece();

  if (!spawned) {
    return;
  }

  if (linesCleared > 0) {
    const points = LINE_SCORES[linesCleared] ?? linesCleared * 100;
    setStatus(
      `${linesCleared}줄 삭제! +${points}점 · 현재 블록: ${currentPiece.type}`
    );
  } else {
    setStatus(`현재 블록: ${currentPiece.type}`);
  }
}

/**
 * 게임 오버 상태로 전환합니다.
 */
function handleGameOver() {
  isPlaying = false;
  isGameOver = true;
  currentPiece = null;
  stopDropTimer();
  setStatus(`게임 오버! 최종 점수: ${score} — 재시작 버튼을 눌러주세요.`);
  renderBoard();
}

/**
 * 새 블록을 생성합니다. 생성 위치에 겹치면 게임을 종료합니다.
 */
function spawnNewPiece() {
  const piece = createPiece(getRandomPieceType());

  if (!canMove(piece, 0, 0, board)) {
    handleGameOver();
    return false;
  }

  currentPiece = piece;
  return true;
}

/**
 * shape 배열을 시계 방향으로 90도 회전합니다.
 */
function rotateShape(shape) {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      rotated[col][rows - 1 - row] = shape[row][col];
    }
  }

  return rotated;
}

/**
 * 현재 블록을 이동합니다. 충돌 판정을 통과할 때만 적용합니다.
 */
function tryMovePiece(dx, dy) {
  if (!isPlaying || !currentPiece) {
    return false;
  }

  if (!canMove(currentPiece, dx, dy, board)) {
    return false;
  }

  currentPiece.row += dy;
  currentPiece.col += dx;
  renderBoard();
  return true;
}

/**
 * 현재 블록을 시계 방향으로 회전합니다.
 * 회전 후 충돌하면 원래 모양으로 되돌립니다.
 */
function rotatePiece() {
  if (!isPlaying || !currentPiece) {
    return false;
  }

  const previousShape = currentPiece.shape;
  currentPiece.shape = rotateShape(previousShape);

  if (!canMove(currentPiece, 0, 0, board)) {
    currentPiece.shape = previousShape;
    return false;
  }

  renderBoard();
  return true;
}

/**
 * 현재 블록을 바닥 또는 고정 블록까지 즉시 내립니다.
 */
function hardDrop() {
  if (!isPlaying || !currentPiece) {
    return;
  }

  while (canMove(currentPiece, 0, 1, board)) {
    currentPiece.row += 1;
  }

  settlePiece();
  renderBoard();
}

/**
 * 키보드 입력을 처리합니다.
 */
function handleKeyDown(event) {
  if (!isPlaying || !currentPiece) {
    return;
  }

  switch (event.code) {
    case "ArrowLeft":
      event.preventDefault();
      tryMovePiece(-1, 0);
      break;
    case "ArrowRight":
      event.preventDefault();
      tryMovePiece(1, 0);
      break;
    case "ArrowDown":
      event.preventDefault();
      dropPiece();
      break;
    case "ArrowUp":
      event.preventDefault();
      rotatePiece();
      break;
    case "Space":
      event.preventDefault();
      hardDrop();
      break;
    default:
      break;
  }
}

/**
 * 키보드 이벤트를 한 번만 등록합니다.
 */
function bindKeyboardControls() {
  if (bindKeyboardControls.isBound) {
    return;
  }

  document.addEventListener("keydown", handleKeyDown);
  bindKeyboardControls.isBound = true;
}

bindKeyboardControls.isBound = false;

/**
 * 현재 블록을 한 칸 아래로 내립니다.
 */
function dropPiece() {
  if (!isPlaying || !currentPiece) {
    return;
  }

  if (canMove(currentPiece, 0, 1, board)) {
    currentPiece.row += 1;
  } else {
    settlePiece();
  }

  renderBoard();
}

/**
 * 자동 낙하 타이머를 시작합니다.
 */
function startDropTimer() {
  stopDropTimer();
  dropTimerId = setInterval(dropPiece, DROP_INTERVAL_MS);
}

/**
 * 자동 낙하 타이머를 중지합니다.
 */
function stopDropTimer() {
  if (dropTimerId !== null) {
    clearInterval(dropTimerId);
    dropTimerId = null;
  }
}

/**
 * 보드 그리드와 고정된 블록을 화면에 그립니다.
 */
function renderBoard() {
  boardElement.innerHTML = "";

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);

      const cellValue = board[row][col];
      if (cellValue !== 0) {
        cell.classList.add("filled", `piece-${cellValue.toLowerCase()}`);
      }

      boardElement.appendChild(cell);
    }
  }

  drawPiece();
}

/**
 * 현재 움직이는 블록을 보드 위에 그립니다.
 */
function drawPiece() {
  if (!currentPiece) {
    return;
  }

  const { type, shape, row: pieceRow, col: pieceCol } = currentPiece;

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (!shape[row][col]) {
        continue;
      }

      const boardRow = pieceRow + row;
      const boardCol = pieceCol + col;

      if (
        boardRow < 0 ||
        boardRow >= ROWS ||
        boardCol < 0 ||
        boardCol >= COLS
      ) {
        continue;
      }

      const cell = boardElement.querySelector(
        `.cell[data-row="${boardRow}"][data-col="${boardCol}"]`
      );

      if (cell) {
        cell.classList.add("filled", `piece-${type.toLowerCase()}`);
      }
    }
  }
}

/**
 * 무작위 블록 종류를 반환합니다.
 */
function getRandomPieceType() {
  const index = Math.floor(Math.random() * PIECE_TYPES.length);
  return PIECE_TYPES[index];
}

/**
 * 점수를 화면에 반영합니다.
 */
function updateScoreDisplay() {
  scoreElement.textContent = String(score);
}

/**
 * 상태 메시지를 갱신합니다.
 */
function setStatus(message) {
  statusMessage.textContent = message;
}

/**
 * 게임을 초기 상태로 되돌립니다.
 */
function resetGame() {
  stopDropTimer();
  board = createEmptyBoard();
  currentPiece = null;
  score = 0;
  isPlaying = false;
  isGameOver = false;
  updateScoreDisplay();
  renderBoard();
  setStatus("시작 버튼을 눌러 게임을 준비하세요.");
  startButton.disabled = false;
  restartButton.disabled = true;
}

/**
 * 시작 버튼: 게임을 시작하고 자동 낙하를 실행합니다.
 */
function startGame() {
  stopDropTimer();
  board = createEmptyBoard();
  currentPiece = null;
  score = 0;
  isPlaying = true;
  isGameOver = false;
  updateScoreDisplay();

  if (!spawnNewPiece()) {
    renderBoard();
    return;
  }

  setStatus(`현재 블록: ${currentPiece.type}`);
  renderBoard();
  startDropTimer();
  startButton.disabled = true;
  restartButton.disabled = false;
}

// 이벤트 연결
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", resetGame);
bindKeyboardControls();

// 페이지 로드 시 빈 보드 표시
resetGame();
