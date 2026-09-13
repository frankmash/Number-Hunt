/* =========================================================
   Number Hunt — Multiplayer Client (Socket.IO) v2
   ========================================================= */

const SERVER_URL = "https://number-hunt-87ss.onrender.com/";  

const socket = io(SERVER_URL, {
  transports: ["websocket", "polling"],
  autoConnect: true,
  reconnectionAttempts: 8,
  reconnectionDelay: 1500
});

// -------------------- DOM --------------------
const lobbyScreen      = document.getElementById("lobbyScreen");
const waitingScreen    = document.getElementById("waitingScreen");
const localSetupScreen = document.getElementById("localSetupScreen");
const gameScreen       = document.getElementById("gameScreen");
const finishedOverlay  = document.getElementById("finishedOverlay");

const soloBtn     = document.getElementById("soloBtn");
const passPlayBtn = document.getElementById("passPlayBtn");

const localSetupTitle   = document.getElementById("localSetupTitle");
const localMaxNumberInput = document.getElementById("localMaxNumber");
const localMaxHint      = document.getElementById("localMaxHint");
const localLevelSelect  = document.getElementById("localLevelSelect");
const localLevelButtons = localLevelSelect.querySelectorAll(".level-btn");
const localStartBtn     = document.getElementById("localStartBtn");
const localBackBtn      = document.getElementById("localBackBtn");

const targetBlockEl = document.querySelector(".target-block");
const topBarEl       = document.querySelector(".top-bar");
const targetP1El = document.getElementById("targetP1");
const targetP2El = document.getElementById("targetP2");

const playerNameInput = document.getElementById("playerName");
const roomCodeInput   = document.getElementById("roomCodeInput");
const createRoomBtn   = document.getElementById("createRoomBtn");
const joinRoomBtn     = document.getElementById("joinRoomBtn");
const lobbyHint       = document.getElementById("lobbyHint");

const displayRoomCode = document.getElementById("displayRoomCode");
const waitingStatus   = document.getElementById("waitingStatus");
const playersList     = document.getElementById("playersList");
const hostControls    = document.getElementById("hostControls");
const startGameBtn    = document.getElementById("startGameBtn");
const leaveRoomBtn    = document.getElementById("leaveRoomBtn");

const maxNumberInput  = document.getElementById("maxNumber");
const levelSelect     = document.getElementById("levelSelect");
const levelButtons    = levelSelect.querySelectorAll(".level-btn");
const maxHint         = document.getElementById("maxHint");

const leftPage  = document.getElementById("leftPage");
const rightPage = document.getElementById("rightPage");
const targetNumberElement = document.getElementById("targetNumber");
const foundCountElement   = document.getElementById("foundCount");
const totalCountElement   = document.getElementById("totalCount");
const muteBtn = document.getElementById("muteBtn");

const nameP1 = document.getElementById("nameP1");
const nameP2 = document.getElementById("nameP2");
const scoreValueP1 = document.getElementById("scoreValueP1");
const scoreValueP2 = document.getElementById("scoreValueP2");
const scoreP1El = document.getElementById("scoreP1");
const scoreP2El = document.getElementById("scoreP2");

const winnerTitle  = document.getElementById("winnerTitle");
const finalScores  = document.getElementById("finalScores");
const playAgainBtn = document.getElementById("playAgainBtn");
const backLobbyBtn = document.getElementById("backLobbyBtn");

const confettiCanvas = document.getElementById("confettiCanvas");
const confettiCtx = confettiCanvas.getContext("2d");

// connection banner
let connectionBanner = null;

// -------------------- State --------------------
let myId = null;
let myName = "";
let isHost = false;
let roomCode = "";
let selectedLevel = "medium";
let isMuted = false;
let currentTarget = null;
let claimingLock = false;
let currentRoom = null;

// gameMode: "online" (socket-based) | "solo" | "local2p" — the
// latter two run entirely client-side, no server involved.
let gameMode = "online";
let pendingLocalMode = "solo"; // which mode localSetupScreen is currently configuring
let localSelectedLevel = "medium";
let soloState = null;   // { remaining: [numbers], total }
let local2p = null;     // { p1: {...}, p2: {...}, total, level }

// -------------------- Helpers --------------------
function showScreen(screen) {
  [lobbyScreen, waitingScreen, localSetupScreen, gameScreen].forEach(s => s.classList.add("hidden"));
  finishedOverlay.classList.add("hidden");
  screen.classList.remove("hidden");
}

function setLobbyError(msg) {
  lobbyHint.textContent = msg;
  lobbyHint.style.color = "#c65b5b";
}
function clearLobbyError() {
  lobbyHint.textContent = "Create a room and share the code with a friend";
  lobbyHint.style.color = "";
}

function showBanner(text, type = "info") {
  if (connectionBanner) connectionBanner.remove();
  connectionBanner = document.createElement("div");
  connectionBanner.className = `connection-banner ${type}`;
  connectionBanner.textContent = text;
  document.body.appendChild(connectionBanner);
  setTimeout(() => {
    if (connectionBanner) {
      connectionBanner.classList.add("hide");
      setTimeout(() => connectionBanner?.remove(), 400);
    }
  }, 3500);
}

function showToast(text, isOpponent = false) {
  const toast = document.createElement("div");
  toast.className = `toast ${isOpponent ? "opponent" : "me"}`;
  toast.textContent = text;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 1600);
}

function updateMaxHint() {
  const cap = selectedLevel === "hard" ? 300 : 400;
  maxNumberInput.max = cap;
  maxHint.textContent = `Up to ${cap} numbers on ${selectedLevel === "hard" ? "Hard" : "Medium"}`;
  if (parseInt(maxNumberInput.value) > cap) maxNumberInput.value = cap;
}
updateMaxHint();

levelButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    levelButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedLevel = btn.dataset.level;
    updateMaxHint();
  });
});

// -------------------- Local (solo / same-device) board generation --------------------
// Mirrors server/server.js exactly (DIFFICULTY, buildScatterPositions) so
// solo and same-device games look and play identically to online ones,
// just without a server round-trip.

const LOCAL_DIFFICULTY = {
  medium: { fontMin: 16, fontMax: 26, opacityMin: 0.55, opacityMax: 0.9, rotationRange: 9 },
  hard:   { fontMin: 10, fontMax: 15, opacityMin: 0.22, opacityMax: 0.48, rotationRange: 32 }
};

function localShuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildLocalScatterPositions(count, level) {
  if (count === 0) return [];
  const baseSpacing = level === "hard" ? 13 : 17;
  const minDist = Math.max(2.2, baseSpacing / Math.sqrt(count));
  const cellSize = minDist;
  const grid = new Map();

  function cellKey(cx, cy) { return cx + "," + cy; }
  function hasNeighbor(x, y) {
    const cx = Math.floor(x / cellSize), cy = Math.floor(y / cellSize);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = grid.get(cellKey(cx + dx, cy + dy));
        if (!bucket) continue;
        for (const p of bucket) {
          const ddx = p.x - x, ddy = p.y - y;
          if (ddx * ddx + ddy * ddy < minDist * minDist) return true;
        }
      }
    }
    return false;
  }
  function addPoint(x, y) {
    const key = cellKey(Math.floor(x / cellSize), Math.floor(y / cellSize));
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push({ x, y });
  }

  const positions = [];
  for (let i = 0; i < count; i++) {
    let x, y, found = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      x = 4 + Math.random() * 92;
      y = 5 + Math.random() * 90;
      if (!hasNeighbor(x, y)) { found = true; break; }
    }
    if (!found) { x = 4 + Math.random() * 92; y = 5 + Math.random() * 90; }
    positions.push({ x, y });
    addPoint(x, y);
  }
  return positions;
}

// Builds a board array (same shape renderBoard() already expects) for a
// single page — used to give each player their own independent set of
// numbers confined to their own side, in same-device mode. Solo mode
// calls this once per page with half the numbers each, same as the
// server does for online play.
function buildLocalPageBoard(nums, page, level) {
  const settings = LOCAL_DIFFICULTY[level] || LOCAL_DIFFICULTY.medium;
  const positions = buildLocalScatterPositions(nums.length, level);
  return nums.map((num, i) => {
    const pos = positions[i];
    return {
      number: num,
      page,
      x: pos.x,
      y: pos.y,
      fontSize: Math.floor(Math.random() * (settings.fontMax - settings.fontMin)) + settings.fontMin,
      rotation: Math.floor(Math.random() * (settings.rotationRange * 2 + 1)) - settings.rotationRange,
      opacity: settings.opacityMin + Math.random() * (settings.opacityMax - settings.opacityMin)
    };
  });
}

function updateLocalMaxHint() {
  const cap = localSelectedLevel === "hard" ? 300 : 400;
  localMaxNumberInput.max = cap;
  localMaxHint.textContent = `Up to ${cap} numbers on ${localSelectedLevel === "hard" ? "Hard" : "Medium"}`;
  if (parseInt(localMaxNumberInput.value) > cap) localMaxNumberInput.value = cap;
}
updateLocalMaxHint();

localLevelButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    localLevelButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    localSelectedLevel = btn.dataset.level;
    updateLocalMaxHint();
  });
});

// -------------------- Audio --------------------
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}
function playTone({ freq, freqEnd, duration, type = "sine", volume = 0.2 }) {
  if (!audioCtx || isMuted) return;
  if (audioCtx.state === "suspended") audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, audioCtx.currentTime + duration);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
function playFoundSound() {
  playTone({ freq: 520, freqEnd: 940, duration: 0.15, type: "sine", volume: 0.4 });
}
function playOpponentSound() {
  playTone({ freq: 320, freqEnd: 180, duration: 0.14, type: "triangle", volume: 0.22 });
}
function playWrongSound() {
  playTone({ freq: 170, freqEnd: 90, duration: 0.18, type: "square", volume: 0.25 });
}
function playFinishSound() {
  playTone({ freq: 440, duration: 0.15, type: "sine", volume: 0.4 });
  setTimeout(() => playTone({ freq: 554, duration: 0.15, type: "sine", volume: 0.4 }), 120);
  setTimeout(() => playTone({ freq: 659, duration: 0.35, type: "sine", volume: 0.45 }), 240);
}
muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
  muteBtn.classList.toggle("muted", isMuted);
});

// -------------------- Confetti --------------------
function resizeConfettiCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeConfettiCanvas);
resizeConfettiCanvas();

const CONFETTI_COLORS = ["#e07856", "#d9a441", "#7a9e7e", "#5b7fa6", "#c65b5b", "#f4e9d0"];
let confettiParticles = [];
let confettiAnimating = false;

function spawnConfetti(x, y, count = 16) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    confettiParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      size: 3 + Math.random() * 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 20,
      life: 1
    });
  }
  if (confettiParticles.length > 260) confettiParticles.splice(0, confettiParticles.length - 260);
  if (!confettiAnimating) {
    confettiAnimating = true;
    requestAnimationFrame(animateConfetti);
  }
}
function animateConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiParticles.forEach(p => {
    p.vy += 0.12; p.x += p.vx; p.y += p.vy;
    p.rotation += p.rotationSpeed; p.life -= 0.012;
  });
  confettiParticles = confettiParticles.filter(p => p.life > 0 && p.y < confettiCanvas.height + 40);
  confettiParticles.forEach(p => {
    confettiCtx.save();
    confettiCtx.globalAlpha = Math.max(p.life, 0);
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rotation * Math.PI / 180);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    confettiCtx.restore();
  });
  if (confettiParticles.length > 0) requestAnimationFrame(animateConfetti);
  else {
    confettiAnimating = false;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}
function spawnFinishConfetti() {
  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      spawnConfetti((confettiCanvas.width / 7) * (i + 1), confettiCanvas.height * 0.25, 26);
    }, i * 120);
  }
}

// -------------------- UI --------------------
function updatePlayersUI(room) {
  currentRoom = room;
  playersList.innerHTML = "";
  room.players.forEach(p => {
    const chip = document.createElement("div");
    chip.className = "player-chip";
    chip.innerHTML = `
      <span>${p.name}</span>
      <span>
        ${p.isHost ? '<span class="host-tag">HOST</span>' : ''}
        ${p.id === myId ? '<span class="you-tag">you</span>' : ''}
      </span>
    `;
    playersList.appendChild(chip);
  });

  isHost = room.players.some(p => p.id === myId && p.isHost);

  if (isHost) {
    hostControls.classList.remove("hidden");
    startGameBtn.disabled = room.players.length < 2;
    waitingStatus.textContent = room.players.length < 2
      ? "Waiting for opponent..."
      : "Both players ready — start when you want";
  } else {
    hostControls.classList.add("hidden");
    waitingStatus.textContent = "Waiting for host to start the game...";
  }
}

function updateScoresUI(room) {
  const p1 = room.players[0];
  const p2 = room.players[1];

  if (p1) {
    nameP1.textContent = p1.id === myId ? `${p1.name} (you)` : p1.name;
    scoreValueP1.textContent = p1.score;
    scoreP1El?.classList.toggle("is-me", p1.id === myId);
  }
  if (p2) {
    nameP2.textContent = p2.id === myId ? `${p2.name} (you)` : p2.name;
    scoreValueP2.textContent = p2.score;
    scoreP2El?.classList.toggle("is-me", p2.id === myId);
  }
}

function renderBoard(board) {
  leftPage.innerHTML = "";
  rightPage.innerHTML = "";
  board.forEach(item => {
    const el = document.createElement("div");
    el.className = "number";
    el.textContent = item.number;
    el.dataset.number = item.number;
    el.style.fontSize = item.fontSize + "px";
    el.style.left = item.x + "%";
    el.style.top = item.y + "%";
    el.style.transform = `translate(-50%, -50%) rotate(${item.rotation}deg)`;
    el.style.color = `rgba(45, 37, 27, ${item.opacity})`;
    el.addEventListener("click", () => onNumberClick(item.number, el));
    if (item.page === "left") leftPage.appendChild(el);
    else rightPage.appendChild(el);
  });
}

function setTarget(num) {
  currentTarget = num;
  targetNumberElement.style.opacity = "0";
  setTimeout(() => {
    targetNumberElement.textContent = num ?? "?";
    targetNumberElement.style.opacity = "1";
    if (num) showCelebration(num);
  }, 280);
}

function showCelebration(number) {
  const old = document.querySelector(".celebration");
  if (old) old.remove();
  const el = document.createElement("div");
  el.className = "celebration";
  el.innerHTML = `
    <div class="celebration-found">FOUND</div>
    <div class="celebration-next">NEXT — FIND ${number}</div>
  `;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => el.remove(), 950);
}

function handleWrongClick(element, targetEl = targetNumberElement) {
  playWrongSound();
  element.classList.add("wrong");
  targetEl.classList.add("shake");
  setTimeout(() => element.classList.remove("wrong"), 300);
  setTimeout(() => targetEl.classList.remove("shake"), 300);
}

function onNumberClick(number, element) {
  if (gameMode === "solo") return onSoloNumberClick(number, element);
  if (gameMode === "local2p") return onLocal2PNumberClick(number, element);

  // online (default)
  if (claimingLock || !currentTarget) return;
  if (number !== currentTarget) {
    handleWrongClick(element);
    return;
  }
  claimingLock = true;
  socket.emit("claim_number", { code: roomCode, number }, () => {
    claimingLock = false;
  });
}

function onSoloNumberClick(number, element) {
  if (!soloState || element.classList.contains("found")) return;
  if (number !== currentTarget) {
    handleWrongClick(element);
    return;
  }
  element.classList.add("found");
  soloState.remaining = soloState.remaining.filter(n => n !== number);
  foundCountElement.textContent = soloState.total - soloState.remaining.length;
  playFoundSound();
  const rect = element.getBoundingClientRect();
  spawnConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);

  if (soloState.remaining.length === 0) {
    finishSolo();
    return;
  }
  setTarget(pickRandom(soloState.remaining));
}

function onLocal2PNumberClick(number, element) {
  if (!local2p || element.classList.contains("found")) return;

  const isLeft = element.closest(".left-page") !== null;
  const side = isLeft ? "p1" : "p2";
  const state = local2p[side];
  const targetEl = side === "p1" ? targetP1El : targetP2El;

  if (number !== state.target) {
    handleWrongClick(element, targetEl);
    return;
  }

  element.classList.add("found");
  state.remaining = state.remaining.filter(n => n !== number);
  state.score++;

  const scoreEl = side === "p1" ? scoreValueP1 : scoreValueP2;
  scoreEl.textContent = state.score;

  playFoundSound();
  const rect = element.getBoundingClientRect();
  spawnConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);

  if (state.remaining.length === 0) {
    finishLocal2P(side);
    return;
  }

  state.target = pickRandom(state.remaining);
  targetEl.textContent = `FIND ${state.target}`;
}

function resetToLobby() {
  roomCode = "";
  myId = null;
  currentRoom = null;
  isHost = false;
  gameMode = "online";
  topBarEl.classList.remove("local2p");
  showScreen(lobbyScreen);
}

// -------------------- Socket events --------------------
socket.on("connect", () => {
  console.log("Connected");
  showBanner("Connected to server", "success");
});

socket.on("disconnect", () => {
  showBanner("Disconnected — trying to reconnect…", "warn");
});

socket.on("connect_error", () => {
  setLobbyError("Cannot reach server. It may be waking up (Render free tier)…");
  showBanner("Server is waking up, please wait 20–40 seconds…", "warn");
});

socket.on("room_updated", (room) => updatePlayersUI(room));

socket.on("player_left", ({ playerName, room }) => {
  showBanner(`${playerName} left the room`, "warn");
  updatePlayersUI(room);

  if (room.players.length < 2 && room.status === "playing") {
    // force back if mid-game
    setTimeout(() => {
      showBanner("Game cancelled — opponent left", "warn");
      resetToLobby();
    }, 1800);
  }
});

socket.on("game_started", (room) => {
  initAudio();
  currentRoom = room;
  roomCode = room.code;
  totalCountElement.textContent = room.totalNumbers;
  foundCountElement.textContent = 0;
  updateScoresUI(room);
  renderBoard(room.board);
  setTarget(room.currentTarget);
  showScreen(gameScreen);
  finishedOverlay.classList.add("hidden");
});

socket.on("number_claimed", ({ number, playerId, playerName, room }) => {
  currentRoom = room;
  const el = document.querySelector(`.number[data-number="${number}"]`);
  if (el) {
    el.classList.add("found");
    if (playerId === myId) {
      el.classList.add("claimed-by-me");
      playFoundSound();
      const rect = el.getBoundingClientRect();
      spawnConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
      showToast("You got it!", false);
    } else {
      el.classList.add("claimed-by-opp");
      playOpponentSound();
      showToast(`${playerName} found it!`, true);
    }
  }
  foundCountElement.textContent = room.foundCount;
  updateScoresUI(room);
  setTarget(room.currentTarget);
});

socket.on("game_over", (room) => {
  currentRoom = room;
  playFinishSound();
  spawnFinishConfetti();

  const p1 = room.players[0];
  const p2 = room.players[1];
  let title = "It's a draw!";
  if (p1 && p2) {
    if (p1.score > p2.score) title = `${p1.name} wins!`;
    if (p2.score > p1.score) title = `${p2.name} wins!`;
  }

  winnerTitle.textContent = title;
  finalScores.textContent = `${p1?.name || "P1"}: ${p1?.score || 0}   —   ${p2?.name || "P2"}: ${p2?.score || 0}`;

  // show Play Again only for host
  if (playAgainBtn) {
    playAgainBtn.style.display = isHost ? "inline-block" : "none";
  }
  finishedOverlay.classList.remove("hidden");
});

// -------------------- Local mode lobby actions --------------------
soloBtn.addEventListener("click", () => {
  pendingLocalMode = "solo";
  localSetupTitle.textContent = "Solo Practice";
  showScreen(localSetupScreen);
});

passPlayBtn.addEventListener("click", () => {
  pendingLocalMode = "local2p";
  localSetupTitle.textContent = "2 Players — Same Device";
  showScreen(localSetupScreen);
});

localBackBtn.addEventListener("click", () => {
  showScreen(lobbyScreen);
});

localStartBtn.addEventListener("click", () => {
  const total = Math.max(10, parseInt(localMaxNumberInput.value) || 50);
  initAudio();
  if (pendingLocalMode === "solo") {
    startSolo(total, localSelectedLevel);
  } else {
    startLocal2P(total, localSelectedLevel);
  }
});

// -------------------- Solo mode --------------------
function startSolo(total, level) {
  gameMode = "solo";
  topBarEl.classList.remove("local2p");

  const numbers = localShuffle(Array.from({ length: total }, (_, i) => i + 1));
  const leftNums = numbers.filter((_, i) => i % 2 === 0);
  const rightNums = numbers.filter((_, i) => i % 2 === 1);
  const board = [
    ...buildLocalPageBoard(leftNums, "left", level),
    ...buildLocalPageBoard(rightNums, "right", level)
  ];

  soloState = { remaining: [...numbers], total };

  totalCountElement.textContent = total;
  foundCountElement.textContent = 0;
  renderBoard(board);
  setTarget(pickRandom(soloState.remaining));
  showScreen(gameScreen);
}

function finishSolo() {
  playFinishSound();
  spawnFinishConfetti();
  winnerTitle.textContent = "Finished!";
  finalScores.textContent = `You found all ${soloState.total} numbers`;
  if (playAgainBtn) playAgainBtn.style.display = "inline-block";
  finishedOverlay.classList.remove("hidden");
}

// -------------------- Same-device 2-player mode --------------------
function startLocal2P(total, level) {
  gameMode = "local2p";
  topBarEl.classList.add("local2p");

  const p1Nums = localShuffle(Array.from({ length: total }, (_, i) => i + 1));
  const p2Nums = localShuffle(Array.from({ length: total }, (_, i) => i + 1));
  const board = [
    ...buildLocalPageBoard(p1Nums, "left", level),
    ...buildLocalPageBoard(p2Nums, "right", level)
  ];

  local2p = {
    total,
    p1: { remaining: [...p1Nums], score: 0, target: null },
    p2: { remaining: [...p2Nums], score: 0, target: null }
  };

  nameP1.textContent = "Player 1";
  nameP2.textContent = "Player 2";
  scoreValueP1.textContent = 0;
  scoreValueP2.textContent = 0;

  renderBoard(board);

  local2p.p1.target = pickRandom(local2p.p1.remaining);
  local2p.p2.target = pickRandom(local2p.p2.remaining);
  targetP1El.textContent = `FIND ${local2p.p1.target}`;
  targetP2El.textContent = `FIND ${local2p.p2.target}`;

  showScreen(gameScreen);
}

function finishLocal2P(winnerSide) {
  playFinishSound();
  spawnFinishConfetti();
  const label = winnerSide === "p1" ? "Player 1" : "Player 2";
  winnerTitle.textContent = `${label} wins!`;
  finalScores.textContent = `Player 1: ${local2p.p1.score}   —   Player 2: ${local2p.p2.score}`;
  if (playAgainBtn) playAgainBtn.style.display = "inline-block";
  finishedOverlay.classList.remove("hidden");
}

function pickRandom(arr) {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}
createRoomBtn.addEventListener("click", () => {
  myName = playerNameInput.value.trim() || "Player";
  if (!myName) return setLobbyError("Enter your name first");
  clearLobbyError();
  createRoomBtn.disabled = true;
  createRoomBtn.textContent = "Creating...";

  socket.emit("create_room", { playerName: myName }, (res) => {
    createRoomBtn.disabled = false;
    createRoomBtn.textContent = "Create Room";
    if (res.error) return setLobbyError(res.error);

    myId = res.playerId;
    roomCode = res.room.code;
    displayRoomCode.textContent = roomCode;
    updatePlayersUI(res.room);
    showScreen(waitingScreen);

    // update URL for easy sharing
    const url = new URL(window.location);
    url.searchParams.set("room", roomCode);
    history.replaceState(null, "", url);
  });
});

joinRoomBtn.addEventListener("click", () => {
  myName = playerNameInput.value.trim() || "Player";
  const code = roomCodeInput.value.trim().toUpperCase();
  if (!myName) return setLobbyError("Enter your name first");
  if (code.length < 4) return setLobbyError("Enter a valid room code");
  clearLobbyError();
  joinRoomBtn.disabled = true;
  joinRoomBtn.textContent = "...";

  socket.emit("join_room", { code, playerName: myName }, (res) => {
    joinRoomBtn.disabled = false;
    joinRoomBtn.textContent = "Join";
    if (res.error) return setLobbyError(res.error);

    myId = res.playerId;
    roomCode = res.room.code;
    displayRoomCode.textContent = roomCode;
    updatePlayersUI(res.room);
    showScreen(waitingScreen);
  });
});

startGameBtn.addEventListener("click", () => {
  if (!isHost) return;
  const total = parseInt(maxNumberInput.value) || 50;
  startGameBtn.disabled = true;
  startGameBtn.textContent = "Starting...";

  socket.emit("start_game", {
    code: roomCode,
    level: selectedLevel,
    totalNumbers: total
  }, (res) => {
    startGameBtn.disabled = false;
    startGameBtn.textContent = "Start Game";
    if (res?.error) alert(res.error);
  });
});

leaveRoomBtn.addEventListener("click", () => {
  if (roomCode) socket.emit("leave_room", { code: roomCode });
  history.replaceState(null, "", window.location.pathname);
  resetToLobby();
});

playAgainBtn?.addEventListener("click", () => {
  if (gameMode === "solo") {
    startSolo(soloState.total, localSelectedLevel);
    return;
  }
  if (gameMode === "local2p") {
    startLocal2P(local2p.total, localSelectedLevel);
    return;
  }
  if (!isHost || !roomCode) return;
  playAgainBtn.disabled = true;
  playAgainBtn.textContent = "Restarting...";
  socket.emit("play_again", { code: roomCode }, (res) => {
    playAgainBtn.disabled = false;
    playAgainBtn.textContent = "Play Again";
    if (res?.error) alert(res.error);
  });
});

backLobbyBtn?.addEventListener("click", () => {
  if (gameMode === "solo" || gameMode === "local2p") {
    resetToLobby();
    return;
  }
  if (roomCode) socket.emit("leave_room", { code: roomCode });
  history.replaceState(null, "", window.location.pathname);
  resetToLobby();
});

// Auto-join from URL ?room=ABC12
window.addEventListener("load", () => {
  const params = new URLSearchParams(window.location.search);
  const roomFromUrl = params.get("room");
  if (roomFromUrl) {
    roomCodeInput.value = roomFromUrl.toUpperCase();
  }
});

playerNameInput.addEventListener("keydown", e => {
  if (e.key === "Enter") createRoomBtn.click();
});
roomCodeInput.addEventListener("keydown", e => {
  if (e.key === "Enter") joinRoomBtn.click();
});