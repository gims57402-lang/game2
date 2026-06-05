import { firebaseConfig } from "./firebase-config.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const currentNameEl = document.querySelector("#currentName");
const scoreEl = document.querySelector("#score");
const timeEl = document.querySelector("#time");
const bestEl = document.querySelector("#best");
const startButton = document.querySelector("#start");
const saveButton = document.querySelector("#save");
const playerNameInput = document.querySelector("#playerName");
const leadersEl = document.querySelector("#leaders");

const LOCAL_SCORES_KEY = "coin-dash-scores";
const DEFAULT_NAME = "Player";
const LEADERBOARD_PATH = "leaderboards/coinDash/scores";

const game = {
  running: false,
  score: 0,
  best: Number(localStorage.getItem("coin-dash-best") || 0),
  timeLeft: 30,
  lastTick: 0,
  lastCoin: 0,
  coins: [],
  player: {
    x: canvas.width / 2 - 36,
    y: canvas.height - 58,
    w: 72,
    h: 28,
    speed: 4.6,
  },
  keys: new Set(),
};

let dbApi = null;
let firebaseLoadPromise = null;
let scoreSaved = false;

playerNameInput.value = localStorage.getItem("coin-dash-name") || "";
bestEl.textContent = game.best;
updateHud();
renderLeaderboard();
drawStartScreen();

startButton.addEventListener("click", startGame);
saveButton.addEventListener("click", saveScore);
playerNameInput.addEventListener("input", () => {
  localStorage.setItem("coin-dash-name", getPlayerName());
  updateHud();
});

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D"].includes(event.key)) {
    game.keys.add(event.key.toLowerCase());
  }
});

window.addEventListener("keyup", (event) => {
  game.keys.delete(event.key.toLowerCase());
});

function startGame() {
  game.running = true;
  game.score = 0;
  game.timeLeft = 30;
  game.lastTick = performance.now();
  game.lastCoin = performance.now();
  game.coins = [];
  game.player.x = canvas.width / 2 - game.player.w / 2;
  scoreSaved = false;
  saveButton.disabled = true;
  saveButton.textContent = "점수 저장";
  startButton.textContent = "다시 시작";
  localStorage.setItem("coin-dash-name", getPlayerName());
  updateHud();
  requestAnimationFrame(loop);
}

function loop(now) {
  if (!game.running) return;

  const delta = now - game.lastTick;
  game.lastTick = now;
  game.timeLeft -= delta / 1000;

  if (now - game.lastCoin > 900) {
    game.lastCoin = now;
    spawnCoin();
  }

  movePlayer();
  updateCoins(delta);
  drawGame();
  updateHud();

  if (game.timeLeft <= 0) {
    endGame();
    return;
  }

  requestAnimationFrame(loop);
}

function movePlayer() {
  if (game.keys.has("arrowleft") || game.keys.has("a")) {
    game.player.x -= game.player.speed;
  }
  if (game.keys.has("arrowright") || game.keys.has("d")) {
    game.player.x += game.player.speed;
  }
  game.player.x = Math.max(12, Math.min(canvas.width - game.player.w - 12, game.player.x));
}

function spawnCoin() {
  game.coins.push({
    x: 28 + Math.random() * (canvas.width - 56),
    y: -24,
    r: 15 + Math.random() * 7,
    vy: 1.25 + Math.random() * 1.15,
    spin: Math.random() * Math.PI,
  });
}

function updateCoins(delta) {
  const player = game.player;
  const gravityBonus = Math.min(0.75, game.score / 120);

  game.coins = game.coins.filter((coin) => {
    coin.y += coin.vy + gravityBonus;
    coin.spin += delta / 220;

    const caught =
      coin.x > player.x &&
      coin.x < player.x + player.w &&
      coin.y + coin.r > player.y &&
      coin.y - coin.r < player.y + player.h;

    if (caught) {
      game.score += 10;
      return false;
    }

    return coin.y - coin.r < canvas.height + 8;
  });
}

function endGame() {
  game.running = false;
  game.timeLeft = 0;
  if (game.score > game.best) {
    game.best = game.score;
    localStorage.setItem("coin-dash-best", String(game.best));
  }
  updateHud();
  drawGame();
  drawCenteredText("끝! 점수 저장 버튼으로 랭킹에 올려보세요.");
  saveButton.disabled = game.score <= 0;
}

function drawStartScreen() {
  drawBackground();
  drawPlayer();
  drawCenteredText("닉네임을 정하고 시작 버튼을 눌러보세요.");
}

function drawGame() {
  drawBackground();
  game.coins.forEach(drawCoin);
  drawPlayer();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#14213d");
  sky.addColorStop(0.5, "#1d3557");
  sky.addColorStop(1, "#233d4d");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#2a9d8f";
  ctx.fillRect(0, canvas.height - 18, canvas.width, 18);

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  for (let i = 0; i < 18; i += 1) {
    ctx.beginPath();
    ctx.arc((i * 83) % canvas.width, 52 + ((i * 47) % 170), 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer() {
  const { x, y, w, h } = game.player;
  ctx.fillStyle = "#e76f51";
  roundRect(x, y, w, h, 8);
  ctx.fillStyle = "#f4a261";
  roundRect(x + 8, y - 12, w - 16, 16, 8);
}

function drawCoin(coin) {
  ctx.save();
  ctx.translate(coin.x, coin.y);
  ctx.rotate(coin.spin);
  ctx.fillStyle = "#f6bd60";
  ctx.beginPath();
  ctx.ellipse(0, 0, coin.r, coin.r * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffe8a3";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawCenteredText(text) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
  roundRect(70, canvas.height / 2 - 34, canvas.width - 140, 68, 8);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 23px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 8);
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

function updateHud() {
  currentNameEl.textContent = getPlayerName();
  scoreEl.textContent = game.score;
  timeEl.textContent = Math.max(0, Math.ceil(game.timeLeft));
  bestEl.textContent = game.best;
}

async function getFirebaseApi() {
  if (
    !firebaseConfig.apiKey ||
    firebaseConfig.apiKey.includes("YOUR_") ||
    !firebaseConfig.databaseURL ||
    firebaseConfig.databaseURL.includes("YOUR_")
  ) {
    return null;
  }

  if (dbApi) return dbApi;
  if (firebaseLoadPromise) return firebaseLoadPromise;

  firebaseLoadPromise = Promise.all([
    import("https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js"),
  ]).then(([{ initializeApp }, database]) => {
    const { get, getDatabase, ref, runTransaction } = database;
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const leaderboardRef = ref(db, LEADERBOARD_PATH);

    dbApi = {
      addScore: (name, score) =>
        runTransaction(leaderboardRef, (currentScores) =>
          sortScores([
            ...(Array.isArray(currentScores) ? currentScores : []),
            { name, score, createdAt: Date.now() },
          ])
        ),
      loadScores: async () => {
        const snapshot = await get(leaderboardRef);
        const scores = snapshot.val();
        return Array.isArray(scores) ? scores : [];
      },
    };

    return dbApi;
  });

  return firebaseLoadPromise;
}

async function saveScore() {
  if (game.score <= 0 || scoreSaved) return;

  const name = getPlayerName();
  saveButton.disabled = true;
  saveButton.textContent = "저장 중";
  saveLocalScore(name, game.score);

  try {
    const firebaseApi = await getFirebaseApi();
    if (firebaseApi) {
      await firebaseApi.addScore(name, game.score);
    }
    scoreSaved = true;
    await renderLeaderboard();
    saveButton.textContent = "저장 완료";
  } catch (error) {
    scoreSaved = true;
    await renderLeaderboard();
    saveButton.textContent = "로컬 저장 완료";
    console.error(error);
  }
}

async function renderLeaderboard() {
  const localScores = loadLocalScores();
  let scores = localScores;

  if (dbApi) {
    try {
      scores = await dbApi.loadScores();
    } catch (error) {
      console.error(error);
    }
  }

  const sortedScores = sortScores(scores);

  leadersEl.innerHTML = sortedScores.length
    ? sortedScores
        .map((entry) => `<li><span>${escapeHtml(entry.name)}</span><strong>${entry.score}</strong></li>`)
        .join("")
    : "<li>아직 저장된 점수가 없어요.</li>";
}

function saveLocalScore(name, score) {
  const nextScores = [
    ...loadLocalScores(),
    {
      name,
      score,
      createdAt: Date.now(),
    },
  ];

  localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(sortScores(nextScores)));
}

function loadLocalScores() {
  try {
    const scores = JSON.parse(localStorage.getItem(LOCAL_SCORES_KEY) || "[]");
    return Array.isArray(scores) ? scores : [];
  } catch {
    return [];
  }
}

function getPlayerName() {
  return playerNameInput.value.trim() || DEFAULT_NAME;
}

function sortScores(scores) {
  return scores
    .filter((entry) => Number.isFinite(Number(entry.score)))
    .map((entry) => ({
      name: String(entry.name || DEFAULT_NAME).slice(0, 16),
      score: Number(entry.score),
      createdAt: Number(entry.createdAt || Date.now()),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });
}
