const setupScreen = document.getElementById("setupScreen");
const gameScreen = document.getElementById("gameScreen");

const startBtn = document.getElementById("startBtn");
const maxNumberInput = document.getElementById("maxNumber");

const levelSelect = document.getElementById("levelSelect");
const levelButtons = levelSelect.querySelectorAll(".level-btn");

const maxHint = document.getElementById("maxHint");
const muteBtn = document.getElementById("muteBtn");

const leftPage = document.getElementById("leftPage");
const rightPage = document.getElementById("rightPage");

const targetNumberElement =
    document.getElementById("targetNumber");

const foundCountElement =
    document.getElementById("foundCount");

const totalCountElement =
    document.getElementById("totalCount");

const confettiCanvas = document.getElementById("confettiCanvas");
const confettiCtx = confettiCanvas.getContext("2d");


let numbers = [];
let currentTarget = null;
let foundCount = 0;
let totalNumbers = 100;
let selectedLevel = "medium";
let isMuted = false;


/* =========================
   DIFFICULTY SETTINGS
========================= */

const DIFFICULTY = {
    medium: {
        fontMin: 16,
        fontMax: 26,
        opacityMin: 0.55,
        opacityMax: 0.9,
        rotationRange: 9,
        padding: 5,
        maxCount: 1000
    },
    hard: {
        fontMin: 10,
        fontMax: 15,
        opacityMin: 0.22,
        opacityMax: 0.48,
        rotationRange: 32,
        padding: 1.5,
        maxCount: 400
    }
};


/* =========================
   LEVEL SELECT
========================= */

function updateMaxHint() {

    const cap = DIFFICULTY[selectedLevel].maxCount;

    maxNumberInput.max = cap;
    maxHint.textContent = `Up to ${cap} numbers on ${selectedLevel === "hard" ? "Hard" : "Medium"}`;

    if (parseInt(maxNumberInput.value) > cap) {
        maxNumberInput.value = cap;
    }
}

updateMaxHint();

maxNumberInput.addEventListener("change", () => {

    const cap = DIFFICULTY[selectedLevel].maxCount;
    const value = parseInt(maxNumberInput.value);

    if (!isNaN(value) && value > cap) {
        maxNumberInput.value = cap;
    }
});

levelButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        levelButtons.forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        selectedLevel = btn.dataset.level;

        updateMaxHint();
    });
});


/* =========================
   MUTE TOGGLE
========================= */

muteBtn.addEventListener("click", () => {

    isMuted = !isMuted;

    muteBtn.textContent = isMuted ? "🔇" : "🔊";
    muteBtn.classList.toggle("muted", isMuted);
    muteBtn.setAttribute(
        "aria-label",
        isMuted ? "Unmute sound" : "Mute sound"
    );
});


/* =========================
   AUDIO
========================= */

let audioCtx = null;

function initAudio() {

    if (!audioCtx) {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

   
    const unlockBuffer = audioCtx.createBuffer(1, 1, 22050);
    const unlockSource = audioCtx.createBufferSource();
    unlockSource.buffer = unlockBuffer;
    unlockSource.connect(audioCtx.destination);
    unlockSource.start(0);
}

function playTone({ freq, freqEnd, duration, type = "sine", volume = 0.2 }) {

    if (!audioCtx || isMuted) return;

   
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    if (freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(
            freqEnd,
            audioCtx.currentTime + duration
        );
    }

    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioCtx.currentTime + duration
    );

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


/* =========================
   CONFETTI
========================= */

function resizeConfettiCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeConfettiCanvas);
resizeConfettiCanvas();

const CONFETTI_COLORS =
    ["#e07856", "#d9a441", "#7a9e7e", "#5b7fa6", "#c65b5b", "#f4e9d0"];

const MAX_CONFETTI_PARTICLES = 260;

let confettiParticles = [];
let confettiAnimating = false;

function spawnConfetti(x, y, count = 16) {

    for (let i = 0; i < count; i++) {

        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;

        confettiParticles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            size: 3 + Math.random() * 4,
            color: CONFETTI_COLORS[
                Math.floor(Math.random() * CONFETTI_COLORS.length)
            ],
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 20,
            life: 1
        });
    }

    if (confettiParticles.length > MAX_CONFETTI_PARTICLES) {
        confettiParticles.splice(
            0,
            confettiParticles.length - MAX_CONFETTI_PARTICLES
        );
    }

    if (!confettiAnimating) {
        confettiAnimating = true;
        requestAnimationFrame(animateConfetti);
    }
}

function animateConfetti() {

    confettiCtx.clearRect(
        0, 0, confettiCanvas.width, confettiCanvas.height
    );

    confettiParticles.forEach(p => {
        p.vy += 0.12;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.life -= 0.012;
    });

    confettiParticles = confettiParticles.filter(
        p => p.life > 0 && p.y < confettiCanvas.height + 40
    );

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
        confettiCtx.clearRect(
            0, 0, confettiCanvas.width, confettiCanvas.height
        );
    }
}

function spawnFinishConfetti() {

    const bursts = 6;

    for (let i = 0; i < bursts; i++) {

        setTimeout(() => {

            const x = (confettiCanvas.width / (bursts + 1)) * (i + 1);
            const y = confettiCanvas.height * 0.25;

            spawnConfetti(x, y, 26);

        }, i * 120);
    }
}


/* =========================
   START
========================= */

startBtn.addEventListener("click", startGame);


function startGame() {

    initAudio();

    totalNumbers = parseInt(maxNumberInput.value);

    if (isNaN(totalNumbers)) {
        totalNumbers = 100;
    }

    const levelCap = DIFFICULTY[selectedLevel].maxCount;

    totalNumbers = Math.max(10, Math.min(levelCap, totalNumbers));

    numbers = [];

    for (let i = 1; i <= totalNumbers; i++) {
        numbers.push(i);
    }

    shuffle(numbers);

    foundCount = 0;

    foundCountElement.textContent = foundCount;
    totalCountElement.textContent = totalNumbers;

    setupScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    createNumberField();

    chooseNextTarget();
}


/* =========================
   SHUFFLE
========================= */

function shuffle(array) {

    for (let i = array.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [array[i], array[j]] =
            [array[j], array[i]];
    }

    return array;
}


function buildGridPositions(count, pageWidth, pageHeight) {

    if (count === 0) {
        return [];
    }

    const aspect = (pageWidth || 300) / (pageHeight || 400);

    let cols = Math.max(1, Math.round(Math.sqrt(count * aspect)));
    let rows = Math.ceil(count / cols);

    while (cols * rows < count) {
        rows++;
    }

    const cellW = 100 / cols;
    const cellH = 100 / rows;

    const cells = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            cells.push({ r, c });
        }
    }

    shuffle(cells);

    return cells.slice(0, count).map(cell => {

        const jitterX = (Math.random() - 0.5) * cellW * 0.6;
        const jitterY = (Math.random() - 0.5) * cellH * 0.6;

        const x = Math.min(96, Math.max(4,
            cell.c * cellW + cellW / 2 + jitterX
        ));

        const y = Math.min(95, Math.max(5,
            cell.r * cellH + cellH / 2 + jitterY
        ));

        return { x, y };
    });
}


/* =========================
   CREATE BOARD
========================= */

function createNumberField() {

    leftPage.innerHTML = "";
    rightPage.innerHTML = "";

    const pages = [leftPage, rightPage];

    const settings = DIFFICULTY[selectedLevel];

    const pageNumbers = [[], []];

    numbers.forEach((number, idx) => {
        pageNumbers[idx % 2].push(number);
    });

    pages.forEach((page, pageIndex) => {

        const pageNums = pageNumbers[pageIndex];

        const positions = buildGridPositions(
            pageNums.length,
            page.clientWidth,
            page.clientHeight
        );

        pageNums.forEach((number, i) => {

            let element = document.createElement("div");

            element.className = "number";
            element.textContent = number;

           
            const fontSize =
                Math.floor(
                    Math.random() * (settings.fontMax - settings.fontMin)
                ) + settings.fontMin;

            element.style.fontSize =
                `${fontSize}px`;

            const rotation =
                Math.floor(Math.random() * (settings.rotationRange * 2 + 1))
                - settings.rotationRange;


            const position = positions[i];

            element.style.left =
                `${position.x}%`;

            element.style.top =
                `${position.y}%`;

            element.style.transform =
                `translate(-50%, -50%) rotate(${rotation}deg)`;

            const opacity =
                settings.opacityMin +
                Math.random() * (settings.opacityMax - settings.opacityMin);

            element.style.color =
                `rgba(45, 37, 27, ${opacity})`;


            /*
             * Number clicked.
             */
            element.addEventListener("click", () => {

                if (element.classList.contains("found")) {
                    return;
                }

                if (number !== currentTarget) {
                    handleWrongClick(element);
                    return;
                }

                element.classList.add("found");

                foundCount++;

                foundCountElement.textContent =
                    foundCount;

                playFoundSound();

                const rect = element.getBoundingClientRect();

                spawnConfetti(
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2
                );


                if (foundCount === totalNumbers) {

                    showFinished();

                    return;
                }


                
                showNextNumber();
            });

            page.appendChild(element);
        });
    });
}


/* =========================
   WRONG CLICK FEEDBACK
========================= */

function handleWrongClick(element) {

    playWrongSound();

    element.classList.add("wrong");
    targetNumberElement.classList.add("shake");

    setTimeout(() => {
        element.classList.remove("wrong");
    }, 300);

    setTimeout(() => {
        targetNumberElement.classList.remove("shake");
    }, 300);
}


/* =========================
   NEXT TARGET
========================= */

function chooseNextTarget() {

    const remaining = getRemainingNumbers();

    if (remaining.length === 0) {
        return;
    }

    /*
     * Completely random next number.
     */
    currentTarget =
        remaining[
            Math.floor(
                Math.random() * remaining.length
            )
        ];

    targetNumberElement.textContent =
        currentTarget;
}


/* =========================
   FOUND -> NEXT
========================= */

function showNextNumber() {

    const nextTarget = getRandomFromList(getRemainingNumbers());

    if (nextTarget === null) {
        return;
    }


    /*
     * Hide current target briefly.
     */
    targetNumberElement.style.opacity = "0";


    setTimeout(() => {

        currentTarget = nextTarget;

        targetNumberElement.textContent =
            currentTarget;

        targetNumberElement.style.opacity = "1";

        showCelebration(currentTarget);

    }, 350);
}


/* =========================
   REMAINING NUMBERS HELPERS
========================= */

function getRemainingNumbers() {

    const remaining = [];

    document.querySelectorAll(".number").forEach(element => {

        if (!element.classList.contains("found")) {

            remaining.push(
                parseInt(element.textContent)
            );
        }
    });

    return remaining;
}

function getRandomFromList(list) {

    if (list.length === 0) {
        return null;
    }

    return list[
        Math.floor(Math.random() * list.length)
    ];
}


/* =========================
   CELEBRATION
========================= */

function showCelebration(number) {

    const old =
        document.querySelector(".celebration");

    if (old) {
        old.remove();
    }


    const celebration =
        document.createElement("div");

    celebration.className =
        "celebration";


    celebration.innerHTML = `
        <div class="celebration-found">
            FOUND
        </div>

        <div class="celebration-next">
            NEXT — FIND ${number}
        </div>
    `;


    document.body.appendChild(celebration);


    /*
     * Trigger animation.
     */
    requestAnimationFrame(() => {

        celebration.classList.add("show");

    });


    /*
     * Remove it after animation.
     */
    setTimeout(() => {

        celebration.remove();

    }, 950);
}


/* =========================
   GAME FINISHED
========================= */

function showFinished() {

    playFinishSound();
    spawnFinishConfetti();

    const finished =
        document.createElement("div");

    finished.className = "finished";

    finished.innerHTML = `
        <div>
            <h1>Finished.</h1>
            <p>You found all ${totalNumbers} numbers on ${selectedLevel === "hard" ? "Hard" : "Medium"}.</p>
            <button id="playAgainBtn">Play Again</button>
        </div>
    `;

    document.body.appendChild(finished);

    document.getElementById("playAgainBtn")
        .addEventListener("click", () => {

            finished.remove();

            gameScreen.classList.add("hidden");
            setupScreen.classList.remove("hidden");
        });
}
