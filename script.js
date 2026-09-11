/* =========================================================
   Number Hunt — 2-Player Multiplayer (Vanilla + Supabase)
   ========================================================= */

const SUPABASE_URL = window.APP_CONFIG?.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes("YOUR_PROJECT")) {
    document.body.innerHTML = `
        <div style="font-family:sans-serif;padding:40px;max-width:520px;margin:60px auto;background:#eee1c4;border-radius:8px;color:#29231d;">
            <h2>Missing config.js</h2>
            <p>Copy <code>config.example.js</code> → <code>config.js</code> and put your real Supabase URL + anon key inside.</p>
            <p style="font-size:14px;opacity:0.7;">config.js is gitignored so your keys stay private.</p>
        </div>
    `;
    throw new Error("Missing APP_CONFIG");
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -------------------------------------------------------
// DOM
// -------------------------------------------------------
const lobbyScreen   = document.getElementById("lobbyScreen");
const waitingScreen = document.getElementById("waitingScreen");
const gameScreen    = document.getElementById("gameScreen");
const finishedOverlay = document.getElementById("finishedOverlay");

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

const winnerTitle = document.getElementById("winnerTitle");
const finalScores = document.getElementById("finalScores");
const playAgainBtn = document.getElementById("playAgainBtn");

const confettiCanvas = document.getElementById("confettiCanvas");
const confettiCtx = confettiCanvas.getContext("2d");

// -------------------------------------------------------
// State
// -------------------------------------------------------
let channel = null;
let myId = null;
let myName = "";
let isHost = false;
let roomCode = "";
let selectedLevel = "medium";
let isMuted = false;

let players = {};
let scores  = {};
let board   = [];
let currentTarget = null;
let foundNumbers = new Set();
let totalNumbers = 0;
let gameStarted = false;
let claimingLock = false;

// -------------------------------------------------------
// Difficulty
// -------------------------------------------------------
const DIFFICULTY = {
    medium: {
        fontMin: 16, fontMax: 26,
        opacityMin: 0.55, opacityMax: 0.9,
        rotationRange: 9, maxCount: 400
    },
    hard: {
        fontMin: 10, fontMax: 15,
        opacityMin: 0.22, opacityMax: 0.48,
        rotationRange: 32, maxCount: 300
    }
};

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------
function generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showScreen(screen) {
    [lobbyScreen, waitingScreen, gameScreen].forEach(s => s.classList.add("hidden"));
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

// -------------------------------------------------------
// Level select
// -------------------------------------------------------
function updateMaxHint() {
    const cap = DIFFICULTY[selectedLevel].maxCount;
    maxNumberInput.max = cap;
    maxHint.textContent = `Up to ${cap} numbers on ${selectedLevel === "hard" ? "Hard" : "Medium"}`;
    if (parseInt(maxNumberInput.value) > cap) {
        maxNumberInput.value = cap;
    }
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

// -------------------------------------------------------
// Audio
// -------------------------------------------------------
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    const buf = audioCtx.createBuffer(1, 1, 22050);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(audioCtx.destination);
    src.start(0);
}

function playTone({ freq, freqEnd, duration, type = "sine", volume = 0.2 }) {
    if (!audioCtx || isMuted) return;
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(freqEnd, audioCtx.currentTime + duration);
    }
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

// -------------------------------------------------------
// Confetti
// -------------------------------------------------------
function resizeConfettiCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeConfettiCanvas);
resizeConfettiCanvas();

const CONFETTI_COLORS = ["#e07856", "#d9a441", "#7a9e7e", "#5b7fa6", "#c65b5b", "#f4e9d0"];
const MAX_CONFETTI_PARTICLES = 260;
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
    if (confettiParticles.length > MAX_CONFETTI_PARTICLES) {
        confettiParticles.splice(0, confettiParticles.length - MAX_CONFETTI_PARTICLES);
    }
    if (!confettiAnimating) {
        confettiAnimating = true;
        requestAnimationFrame(animateConfetti);
    }
}

function animateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiParticles.forEach(p => {
        p.vy += 0.12;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.life -= 0.012;
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
    if (confettiParticles.length > 0) {
        requestAnimationFrame(animateConfetti);
    } else {
        confettiAnimating = false;
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
}

function spawnFinishConfetti() {
    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            const x = (confettiCanvas.width / 7) * (i + 1);
            const y = confettiCanvas.height * 0.25;
            spawnConfetti(x, y, 26);
        }, i * 120);
    }
}

// -------------------------------------------------------
// Board generation
// -------------------------------------------------------
function buildGridPositions(count, pageWidth, pageHeight) {
    if (count === 0) return [];
    const aspect = (pageWidth || 300) / (pageHeight || 400);
    let cols = Math.max(1, Math.round(Math.sqrt(count * aspect)));
    let rows = Math.ceil(count / cols);
    while (cols * rows < count) rows++;
    const cellW = 100 / cols;
    const cellH = 100 / rows;
    const cells = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) cells.push({ r, c });
    }
    shuffle(cells);
    return cells.slice(0, count).map(cell => {
        const jitterX = (Math.random() - 0.5) * cellW * 0.6;
        const jitterY = (Math.random() - 0.5) * cellH * 0.6;
        const x = Math.min(96, Math.max(4, cell.c * cellW + cellW / 2 + jitterX));
        const y = Math.min(95, Math.max(5, cell.r * cellH + cellH / 2 + jitterY));
        return { x, y };
    });
}

function generateBoard(total, level) {
    const settings = DIFFICULTY[level];
    const numbers = [];
    for (let i = 1; i <= total; i++) numbers.push(i);
    shuffle(numbers);

    const leftNums  = numbers.filter((_, i) => i % 2 === 0);
    const rightNums = numbers.filter((_, i) => i % 2 === 1);

    const leftPos  = buildGridPositions(leftNums.length,  400, 600);
    const rightPos = buildGridPositions(rightNums.length, 400, 600);

    const board = [];

    leftNums.forEach((num, i) => {
        const pos = leftPos[i];
        board.push({
            number: num,
            page: "left",
            x: pos.x,
            y: pos.y,
            fontSize: Math.floor(Math.random() * (settings.fontMax - settings.fontMin)) + settings.fontMin,
            rotation: Math.floor(Math.random() * (settings.rotationRange * 2 + 1)) - settings.rotationRange,
            opacity: settings.opacityMin + Math.random() * (settings.opacityMax - settings.opacityMin)
        });
    });

    rightNums.forEach((num, i) => {
        const pos = rightPos[i];
        board.push({
            number: num,
            page: "right",
            x: pos.x,
            y: pos.y,
            fontSize: Math.floor(Math.random() * (settings.fontMax - settings.fontMin)) + settings.fontMin,
            rotation: Math.floor(Math.random() * (settings.rotationRange * 2 + 1)) - settings.rotationRange,
            opacity: settings.opacityMin + Math.random() * (settings.opacityMax - settings.opacityMin)
        });
    });

    return board;
}

// -------------------------------------------------------
// Render board
// -------------------------------------------------------
function renderBoard(boardData) {
    leftPage.innerHTML = "";
    rightPage.innerHTML = "";

    boardData.forEach(item => {
        const el = document.createElement("div");
        el.className = "number";
        el.textContent = item.number;
        el.dataset.number = item.number;
        el.style.fontSize = item.fontSize + "px";
        el.style.left = item.x + "%";
        el.style.top  = item.y + "%";
        el.style.transform = `translate(-50%, -50%) rotate(${item.rotation}deg)`;
        el.style.color = `rgba(45, 37, 27, ${item.opacity})`;

        if (foundNumbers.has(item.number)) {
            el.classList.add("found");
        }

        el.addEventListener("click", () => onNumberClick(item.number, el));

        if (item.page === "left") leftPage.appendChild(el);
        else rightPage.appendChild(el);
    });
}

// -------------------------------------------------------
// Game logic
// -------------------------------------------------------
function onNumberClick(number, element) {
    if (!gameStarted || claimingLock) return;
    if (foundNumbers.has(number)) return;
    if (number !== currentTarget) {
        handleWrongClick(element);
        return;
    }

    claimingLock = true;

    channel.send({
        type: "broadcast",
        event: "claim",
        payload: {
            number,
            playerId: myId,
            playerName: myName,
            ts: Date.now()
        }
    });
}

function handleWrongClick(element) {
    playWrongSound();
    element.classList.add("wrong");
    targetNumberElement.classList.add("shake");
    setTimeout(() => element.classList.remove("wrong"), 300);
    setTimeout(() => targetNumberElement.classList.remove("shake"), 300);
}

function applyClaim(payload) {
    const { number, playerId } = payload;

    if (foundNumbers.has(number)) {
        claimingLock = false;
        return;
    }

    foundNumbers.add(number);
    scores[playerId] = (scores[playerId] || 0) + 1;

    const el = document.querySelector(`.number[data-number="${number}"]`);
    if (el) {
        el.classList.add("found");
        if (playerId === myId) {
            el.classList.add("claimed-by-me");
            playFoundSound();
            const rect = el.getBoundingClientRect();
            spawnConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
        } else {
            el.classList.add("claimed-by-opp");
        }
    }

    updateScoresUI();
    foundCountElement.textContent = foundNumbers.size;

    if (foundNumbers.size >= totalNumbers) {
        endGame();
        return;
    }

    if (isHost) {
        pickAndBroadcastNextTarget();
    }

    claimingLock = false;
}

function pickAndBroadcastNextTarget() {
    const remaining = board
        .map(b => b.number)
        .filter(n => !foundNumbers.has(n));

    if (remaining.length === 0) return;

    const next = remaining[Math.floor(Math.random() * remaining.length)];

    channel.send({
        type: "broadcast",
        event: "new-target",
        payload: { target: next }
    });
}

function setTarget(num) {
    currentTarget = num;
    targetNumberElement.style.opacity = "0";
    setTimeout(() => {
        targetNumberElement.textContent = num;
        targetNumberElement.style.opacity = "1";
        showCelebration(num);
    }, 280);
}

function showCelebration(number) {
    const old = document.querySelector(".celebration");
    if (old) old.remove();

    const celebration = document.createElement("div");
    celebration.className = "celebration";
    celebration.innerHTML = `
        <div class="celebration-found">FOUND</div>
        <div class="celebration-next">NEXT — FIND ${number}</div>
    `;
    document.body.appendChild(celebration);
    requestAnimationFrame(() => celebration.classList.add("show"));
    setTimeout(() => celebration.remove(), 950);
}

function updateScoresUI() {
    const ids = Object.keys(players);
    if (ids.length >= 1) {
        nameP1.textContent = players[ids[0]].name;
        scoreValueP1.textContent = scores[ids[0]] || 0;
    }
    if (ids.length >= 2) {
        nameP2.textContent = players[ids[1]].name;
        scoreValueP2.textContent = scores[ids[1]] || 0;
    }
}

function endGame() {
    gameStarted = false;
    playFinishSound();
    spawnFinishConfetti();

    const ids = Object.keys(players);
    const s1 = scores[ids[0]] || 0;
    const s2 = scores[ids[1]] || 0;
    const n1 = players[ids[0]]?.name || "Player 1";
    const n2 = players[ids[1]]?.name || "Player 2";

    let title = "It's a draw!";
    if (s1 > s2) title = `${n1} wins!`;
    if (s2 > s1) title = `${n2} wins!`;

    winnerTitle.textContent = title;
    finalScores.textContent = `${n1}: ${s1}   —   ${n2}: ${s2}`;
    finishedOverlay.classList.remove("hidden");
}

// -------------------------------------------------------
// Room / Presence
// -------------------------------------------------------
function updatePlayersUI() {
    playersList.innerHTML = "";
    const ids = Object.keys(players);

    ids.forEach(id => {
        const p = players[id];
        const chip = document.createElement("div");
        chip.className = "player-chip";
        chip.innerHTML = `
            <span>${p.name}</span>
            <span>
                ${p.isHost ? '<span class="host-tag">HOST</span>' : ''}
                ${id === myId ? '<span class="you-tag">you</span>' : ''}
            </span>
        `;
        playersList.appendChild(chip);
    });

    if (isHost) {
        startGameBtn.disabled = ids.length < 2;
        waitingStatus.textContent = ids.length < 2
            ? "Waiting for opponent..."
            : "Both players ready — start when you want";
    } else {
        waitingStatus.textContent = "Waiting for host to start the game...";
    }
}

async function joinChannel(code, asHost) {
    roomCode = code.toUpperCase();
    isHost = asHost;

    channel = supabase.channel(`room:${roomCode}`, {
        config: {
            presence: { key: myId }
        }
    });

    channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        players = {};
        Object.values(state).forEach(arr => {
            arr.forEach(p => {
                players[p.id] = { name: p.name, isHost: p.isHost };
            });
        });
        updatePlayersUI();
    });

    channel.on("broadcast", { event: "game-start" }, ({ payload }) => {
        startGameFromPayload(payload);
    });

    channel.on("broadcast", { event: "claim" }, ({ payload }) => {
        applyClaim(payload);
    });

    channel.on("broadcast", { event: "new-target" }, ({ payload }) => {
        setTarget(payload.target);
    });

    await channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
            await channel.track({
                id: myId,
                name: myName,
                isHost: isHost
            });
        }
    });
}

function startGameFromPayload(payload) {
    board = payload.board;
    totalNumbers = payload.total;
    selectedLevel = payload.level;
    foundNumbers = new Set();
    scores = {};
    Object.keys(players).forEach(id => scores[id] = 0);
    gameStarted = true;
    claimingLock = false;

    totalCountElement.textContent = totalNumbers;
    foundCountElement.textContent = 0;
    updateScoresUI();

    showScreen(gameScreen);
    renderBoard(board);

    if (isHost) {
        setTimeout(() => pickAndBroadcastNextTarget(), 400);
    }
}

// -------------------------------------------------------
// Lobby actions
// -------------------------------------------------------
createRoomBtn.addEventListener("click", async () => {
    myName = playerNameInput.value.trim() || "Player";
    if (myName.length < 1) {
        setLobbyError("Enter your name first");
        return;
    }
    clearLobbyError();

    myId = crypto.randomUUID();
    const code = generateRoomCode();

    createRoomBtn.disabled = true;
    createRoomBtn.textContent = "Creating...";

    try {
        await joinChannel(code, true);
        displayRoomCode.textContent = code;
        hostControls.classList.remove("hidden");
        showScreen(waitingScreen);
    } catch (err) {
        console.error(err);
        setLobbyError("Could not create room. Check Supabase keys in config.js");
    } finally {
        createRoomBtn.disabled = false;
        createRoomBtn.textContent = "Create Room";
    }
});

joinRoomBtn.addEventListener("click", async () => {
    myName = playerNameInput.value.trim() || "Player";
    const code = roomCodeInput.value.trim().toUpperCase();

    if (myName.length < 1) {
        setLobbyError("Enter your name first");
        return;
    }
    if (code.length < 4) {
        setLobbyError("Enter a valid room code");
        return;
    }
    clearLobbyError();

    myId = crypto.randomUUID();

    joinRoomBtn.disabled = true;
    joinRoomBtn.textContent = "...";

    try {
        await joinChannel(code, false);
        displayRoomCode.textContent = code;
        hostControls.classList.add("hidden");
        showScreen(waitingScreen);
    } catch (err) {
        console.error(err);
        setLobbyError("Could not join room. Check code & config.js");
    } finally {
        joinRoomBtn.disabled = false;
        joinRoomBtn.textContent = "Join";
    }
});

startGameBtn.addEventListener("click", () => {
    if (!isHost || Object.keys(players).length < 2) return;

    initAudio();

    let total = parseInt(maxNumberInput.value);
    if (isNaN(total)) total = 50;
    const cap = DIFFICULTY[selectedLevel].maxCount;
    total = Math.max(10, Math.min(cap, total));

    const boardData = generateBoard(total, selectedLevel);

    channel.send({
        type: "broadcast",
        event: "game-start",
        payload: {
            board: boardData,
            total,
            level: selectedLevel
        }
    });
});

leaveRoomBtn.addEventListener("click", async () => {
    if (channel) {
        await channel.untrack();
        await supabase.removeChannel(channel);
        channel = null;
    }
    players = {};
    gameStarted = false;
    showScreen(lobbyScreen);
});

playAgainBtn.addEventListener("click", async () => {
    finishedOverlay.classList.add("hidden");
    if (channel) {
        await channel.untrack();
        await supabase.removeChannel(channel);
        channel = null;
    }
    players = {};
    gameStarted = false;
    showScreen(lobbyScreen);
});

playerNameInput.addEventListener("keydown", e => {
    if (e.key === "Enter") createRoomBtn.click();
});
roomCodeInput.addEventListener("keydown", e => {
    if (e.key === "Enter") joinRoomBtn.click();
});