// ==========================================
// EL BARRIO AZ - MOTOR PIXEL ART STARDEW VALLEY
// ==========================================

const socket = io({
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 30
});

// Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// DOM Elements
const modalSelect = document.getElementById('character-select-modal');
const gameContainer = document.getElementById('game-container');
const btnStart = document.getElementById('btn-start-game');
const portraitCards = document.querySelectorAll('.portrait-card');
const playerCoinsVal = document.getElementById('player-coins-val');
const familyVaultVal = document.getElementById('family-vault-val');
const locationBadge = document.getElementById('location-badge');
const hudPlayerName = document.getElementById('hud-player-name');
const hudMiniPortrait = document.getElementById('hud-mini-portrait');
const alertBanner = document.getElementById('alert-banner');
const alertText = document.getElementById('alert-text');
const btnActionMain = document.getElementById('btn-action-main');
const actionBtnEmoji = document.getElementById('action-btn-emoji');
const actionBtnLabel = document.getElementById('action-btn-label');
const btnToggleReactions = document.getElementById('btn-toggle-reactions');
const quickReactions = document.getElementById('quick-reactions');
const btnAudioToggle = document.getElementById('btn-audio-toggle');
const houseShopModal = document.getElementById('house-shop-modal');
const btnOpenHouseShop = document.getElementById('btn-open-house-shop');
const btnCloseShop = document.getElementById('btn-close-shop');

// Joystick
const joystickArea = document.getElementById('joystick-area');
const joystickRing = document.getElementById('joystick-ring');
const joystickKnob = document.getElementById('joystick-knob');

// ==========================================
// MUNDO Y CÁMARA CON ZOOM STARDEW VALLEY
// ==========================================
const WORLD_WIDTH = 2200;
const WORLD_HEIGHT = 1600;
const camera = { x: 1100, y: 780 };
let zoomScale = 2.4; // Zoom Stardew para que los personajes se vean grandes y detallados

let selectedCharId = 'diegoaz_jr';
let myPlayer = null;
const otherPlayers = {};
let familyVaultCoins = 500;
let activeBubbles = {};
let particles = [];
let smokePuffs = [];
let gameTime = 0;

// Objetos del mundo
const soccerBall = { x: 600, y: 1250, vx: 0, vy: 0, radius: 10 };
const puppy = { x: 1200, y: 820, following: null };
let streetCoins = [
  { x: 1040, y: 740, collected: false },
  { x: 1160, y: 740, collected: false },
  { x: 1100, y: 620, collected: false },
  { x: 1100, y: 880, collected: false },
  { x: 1400, y: 750, collected: false },
  { x: 800, y: 750, collected: false },
  { x: 620, y: 1220, collected: false }
];

// ==========================================
// GENERADOR DE SPRITES Y RETRATOS STARDEW VALLEY
// ==========================================
const spriteCanvases = {};

// Helper para dibujar matrices de píxeles
function createPixelSprite(width, height, drawFn) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const pctx = c.getContext('2d');
  pctx.imageSmoothingEnabled = false;
  drawFn(pctx);
  return c;
}

// 1. GENERACIÓN DE RETRATOS DETALLADOS (ESTILO STARDEW VALLEY 64x64)
function drawStardewPortrait(pctx, charId) {
  // Fondo de madera/pergamino Stardew
  pctx.fillStyle = '#b88350';
  pctx.fillRect(0, 0, 64, 64);
  pctx.fillStyle = '#caa373';
  pctx.fillRect(2, 2, 60, 60);

  if (charId === 'diegoaz') {
    // ----------------------------------------
    // PAPÁ DIEGOAZ (Estilo Harvey/Clint en Stardew)
    // ----------------------------------------
    // Chaqueta verde oscuro con cuello
    pctx.fillStyle = '#1c3d25'; pctx.fillRect(10, 44, 44, 20);
    pctx.fillStyle = '#2d5a37'; pctx.fillRect(14, 46, 36, 18);
    // Camisa interior blanca con botones
    pctx.fillStyle = '#f8fafc'; pctx.fillRect(27, 44, 10, 20);
    pctx.fillStyle = '#eab308'; pctx.fillRect(31, 48, 2, 2); pctx.fillRect(31, 54, 2, 2);

    // Cuello y mandíbula
    pctx.fillStyle = '#e8b88a'; pctx.fillRect(24, 38, 16, 8);
    // Rostro
    pctx.fillStyle = '#ffd1a4'; pctx.fillRect(18, 18, 28, 24);

    // Cabello castaño oscuro con volumen y brillo
    pctx.fillStyle = '#40210f'; pctx.fillRect(16, 10, 32, 12);
    pctx.fillStyle = '#5c3218'; pctx.fillRect(18, 12, 28, 6);
    pctx.fillStyle = '#7a4524'; pctx.fillRect(22, 12, 14, 3); // brillo de pelo

    // Barba recortada elegante de papá (Stardew style)
    pctx.fillStyle = '#40210f'; pctx.fillRect(18, 32, 28, 12);
    pctx.fillStyle = '#ffd1a4'; pctx.fillRect(26, 34, 12, 3); // labio inferior
    pctx.fillStyle = '#261207'; pctx.fillRect(27, 33, 10, 1); // bigote perfil

    // Ojos cálidos y cejas
    pctx.fillStyle = '#40210f'; pctx.fillRect(22, 20, 7, 2); pctx.fillRect(35, 20, 7, 2); // cejas
    pctx.fillStyle = '#261207'; pctx.fillRect(23, 24, 4, 4); pctx.fillRect(37, 24, 4, 4); // ojos
    pctx.fillStyle = '#ffffff'; pctx.fillRect(25, 24, 2, 2); pctx.fillRect(39, 24, 2, 2); // brillo

  } else if (charId === 'vicky_vicky') {
    // ----------------------------------------
    // VICKY VICKY (Estilo Jas/Haley en Stardew)
    // ----------------------------------------
    // Cabello largo castaño dorado que cae por los hombros
    pctx.fillStyle = '#8f4f1f'; pctx.fillRect(12, 14, 40, 44);
    pctx.fillStyle = '#b86c31'; pctx.fillRect(14, 16, 36, 40);

    // Vestido / Suéter lavanda/rosa
    pctx.fillStyle = '#be4d80'; pctx.fillRect(14, 46, 36, 18);
    pctx.fillStyle = '#f8fafc'; pctx.fillRect(25, 43, 14, 6); // cuello blanco

    // Rostro suave
    pctx.fillStyle = '#ffd6b0'; pctx.fillRect(19, 18, 26, 22);

    // Flequillo y lazo verde
    pctx.fillStyle = '#b86c31'; pctx.fillRect(16, 14, 32, 8);
    pctx.fillStyle = '#2d7a36'; pctx.fillRect(15, 12, 34, 4); // cinta verde
    pctx.fillStyle = '#ef4444'; pctx.fillRect(39, 10, 6, 6);  // lazo rojo

    // Ojos grandes expresivos Stardew
    pctx.fillStyle = '#5c3218'; pctx.fillRect(23, 21, 6, 1); pctx.fillRect(35, 21, 6, 1);
    pctx.fillStyle = '#261207'; pctx.fillRect(23, 24, 5, 5); pctx.fillRect(36, 24, 5, 5);
    pctx.fillStyle = '#38bdf8'; pctx.fillRect(24, 26, 3, 3); pctx.fillRect(37, 26, 3, 3); // iris azul
    pctx.fillStyle = '#ffffff'; pctx.fillRect(25, 24, 2, 2); pctx.fillRect(38, 24, 2, 2); // brillo

    // Sonrisa tierna y mejillas sonrosadas
    pctx.fillStyle = '#fca5a5'; pctx.fillRect(20, 29, 4, 2); pctx.fillRect(40, 29, 4, 2);
    pctx.fillStyle = '#dc2626'; pctx.fillRect(28, 33, 8, 2);

  } else if (charId === 'diegoaz_jr') {
    // ----------------------------------------
    // DIEGOAZ JR. (Estilo Vincent/Leo en Stardew)
    // ----------------------------------------
    // Sudadera naranja brillante con capucha
    pctx.fillStyle = '#c2410c'; pctx.fillRect(14, 46, 36, 18);
    pctx.fillStyle = '#f97316'; pctx.fillRect(16, 48, 32, 16);
    pctx.fillStyle = '#e2e8f0'; pctx.fillRect(31, 46, 2, 18); // cordón sudadera

    // Rostro infantil redondo
    pctx.fillStyle = '#ffd6b0'; pctx.fillRect(18, 20, 28, 22);

    // Gorra azul hacia atrás (Stardew Style)
    pctx.fillStyle = '#1d4ed8'; pctx.fillRect(16, 12, 32, 10);
    pctx.fillStyle = '#2563eb'; pctx.fillRect(18, 14, 28, 6);
    pctx.fillStyle = '#dc2626'; pctx.fillRect(12, 16, 8, 4); // visera roja hacia atrás

    // Pelo castaño asomando
    pctx.fillStyle = '#5c3218'; pctx.fillRect(18, 19, 28, 4);

    // Ojos grandes vivaces de niño de 4 años
    pctx.fillStyle = '#261207'; pctx.fillRect(23, 25, 5, 6); pctx.fillRect(36, 25, 5, 6);
    pctx.fillStyle = '#ffffff'; pctx.fillRect(24, 25, 2, 3); pctx.fillRect(37, 25, 2, 3); // brillo grande

    // Sonrisa traviesa abierta
    pctx.fillStyle = '#b91c1c'; pctx.fillRect(28, 34, 8, 3);
    pctx.fillStyle = '#ffffff'; pctx.fillRect(29, 34, 6, 1); // dientecitos
    pctx.fillStyle = '#fca5a5'; pctx.fillRect(19, 30, 4, 2); pctx.fillRect(41, 30, 4, 2); // mejillas
  }
}

// Pintar los retratos en el modal inicial
['diegoaz', 'vicky_vicky', 'diegoaz_jr'].forEach(cId => {
  const canvasEl = document.getElementById(cId === 'diegoaz' ? 'portrait-diegoaz' : (cId === 'vicky_vicky' ? 'portrait-vicky' : 'portrait-junior'));
  if (canvasEl) {
    const pctx = canvasEl.getContext('2d');
    pctx.imageSmoothingEnabled = false;
    drawStardewPortrait(pctx, cId);
  }
});

function updateMiniHudPortrait() {
  const pctx = hudMiniPortrait.getContext('2d');
  pctx.imageSmoothingEnabled = false;
  pctx.clearRect(0, 0, 32, 32);
  pctx.save();
  pctx.scale(0.5, 0.5);
  drawStardewPortrait(pctx, selectedCharId);
  pctx.restore();
}

// ==========================================
// 2. GENERADOR DE SPRITES DE PERSONAJES 16x32 (STARDEW VALLEY EXACTO)
// ==========================================
function getStardewSprite(charId, dir, frame) {
  const key = `${charId}_${dir}_${frame}`;
  if (spriteCanvases[key]) return spriteCanvases[key];

  // Canvas de 16 x 32 píxeles
  const c = createPixelSprite(16, 32, (sctx) => {
    const isStepLeft = (frame === 1);
    const isStepRight = (frame === 2);
    const bob = (frame > 0) ? -1 : 0;

    if (charId === 'diegoaz') {
      // ------------------------------------
      // PAPÁ DIEGOAZ (16x32 Stardew)
      // ------------------------------------
      // Sombra
      sctx.fillStyle = 'rgba(0,0,0,0.35)';
      sctx.fillRect(3, 29, 10, 3);

      // Botas y Pantalones
      sctx.fillStyle = '#1e293b'; // pantalón
      sctx.fillRect(5, 20 + bob, 3, 7 + (isStepLeft ? -1 : 0));
      sctx.fillRect(9, 20 + bob, 3, 7 + (isStepRight ? -1 : 0));
      sctx.fillStyle = '#45220c'; // botas cuero
      sctx.fillRect(4, 26 + (isStepLeft ? -1 : 0), 4, 4);
      sctx.fillRect(9, 26 + (isStepRight ? -1 : 0), 4, 4);

      // Torso / Chaqueta verde bosque con botones
      sctx.fillStyle = '#204d2c';
      sctx.fillRect(4, 12 + bob, 8, 9);
      sctx.fillStyle = '#f8fafc'; // cuello camisa blanca
      sctx.fillRect(7, 12 + bob, 2, 3);
      sctx.fillStyle = '#a16207'; // cinturón
      sctx.fillRect(4, 19 + bob, 8, 2);

      // Cabeza / Piel
      sctx.fillStyle = '#ffd1a4';
      sctx.fillRect(5, 4 + bob, 6, 7);

      // Cabello castaño y Barba
      sctx.fillStyle = '#40210f';
      sctx.fillRect(4, 2 + bob, 8, 4); // pelo arriba
      if (dir === 'down') {
        sctx.fillRect(5, 8 + bob, 6, 4); // barba
        sctx.fillStyle = '#0f172a';
        sctx.fillRect(6, 6 + bob, 1, 2); sctx.fillRect(9, 6 + bob, 1, 2); // ojos
      } else if (dir === 'up') {
        sctx.fillStyle = '#40210f';
        sctx.fillRect(4, 3 + bob, 8, 8); // nuca
      } else {
        sctx.fillRect(dir === 'right' ? 8 : 4, 8 + bob, 4, 3); // barba perfil
        sctx.fillStyle = '#0f172a';
        sctx.fillRect(dir === 'right' ? 9 : 6, 6 + bob, 1, 2);
      }

    } else if (charId === 'vicky_vicky') {
      // ------------------------------------
      // VICKY VICKY (16x32 Stardew)
      // ------------------------------------
      sctx.fillStyle = 'rgba(0,0,0,0.35)';
      sctx.fillRect(4, 29, 8, 3);

      // Piernas y botitas
      sctx.fillStyle = '#ffd6b0';
      sctx.fillRect(5, 22 + bob, 2, 5 + (isStepLeft ? -1 : 0));
      sctx.fillRect(9, 22 + bob, 2, 5 + (isStepRight ? -1 : 0));
      sctx.fillStyle = '#542a12';
      sctx.fillRect(5, 26 + (isStepLeft ? -1 : 0), 3, 3);
      sctx.fillRect(9, 26 + (isStepRight ? -1 : 0), 3, 3);

      // Vestido rosa y lazo
      sctx.fillStyle = '#d96696';
      sctx.fillRect(4, 13 + bob, 8, 10);
      sctx.fillStyle = '#ffffff';
      sctx.fillRect(6, 13 + bob, 4, 3); // cuello

      // Cabello largo cayendo
      sctx.fillStyle = '#b86c31';
      sctx.fillRect(3, 4 + bob, 10, 12);

      // Rostro
      sctx.fillStyle = '#ffd6b0';
      sctx.fillRect(5, 5 + bob, 6, 6);

      // Cinta verde
      sctx.fillStyle = '#2d7a36';
      sctx.fillRect(4, 4 + bob, 8, 1);

      if (dir === 'down') {
        sctx.fillStyle = '#0f172a';
        sctx.fillRect(6, 7 + bob, 1, 2); sctx.fillRect(9, 7 + bob, 1, 2);
      } else if (dir === 'up') {
        sctx.fillStyle = '#b86c31';
        sctx.fillRect(4, 4 + bob, 8, 11);
      }

    } else {
      // ------------------------------------
      // DIEGOAZ JR. (16x32 Chibi Stardew)
      // ------------------------------------
      sctx.fillStyle = 'rgba(0,0,0,0.35)';
      sctx.fillRect(4, 28, 8, 3);

      // Piernitas cortas y tenis rojos
      sctx.fillStyle = '#1e3a8a';
      sctx.fillRect(5, 21 + bob, 2, 5 + (isStepLeft ? -1 : 0));
      sctx.fillRect(9, 21 + bob, 2, 5 + (isStepRight ? -1 : 0));
      sctx.fillStyle = '#dc2626';
      sctx.fillRect(4, 25 + (isStepLeft ? -1 : 0), 3, 3);
      sctx.fillRect(9, 25 + (isStepRight ? -1 : 0), 3, 3);

      // Sudadera Naranja
      sctx.fillStyle = '#f97316';
      sctx.fillRect(4, 14 + bob, 8, 8);

      // Cabeza
      sctx.fillStyle = '#ffd6b0';
      sctx.fillRect(5, 7 + bob, 6, 6);

      // Gorra azul hacia atrás
      sctx.fillStyle = '#2563eb';
      sctx.fillRect(4, 5 + bob, 8, 4);
      sctx.fillStyle = '#dc2626';
      sctx.fillRect(3, 7 + bob, 2, 2); // visera roja atrás

      if (dir === 'down') {
        sctx.fillStyle = '#0f172a';
        sctx.fillRect(6, 9 + bob, 1, 2); sctx.fillRect(9, 9 + bob, 1, 2);
      } else if (dir === 'up') {
        sctx.fillStyle = '#2563eb';
        sctx.fillRect(4, 5 + bob, 8, 6);
      }
    }
  });

  spriteCanvases[key] = c;
  return c;
}

// ==========================================
// REDIMENSIÓN RESPONSIVE STARDEW VALLEY
// ==========================================
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Ajustar zoom dinámicamente según la pantalla para que sea idéntico a Stardew Valley Mobile
  const minDim = Math.min(window.innerWidth, window.innerHeight);
  zoomScale = Math.max(2.2, Math.min(3.4, minDim / 160));
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
resizeCanvas();

// ==========================================
// SELECCIÓN DE PERSONAJE
// ==========================================
portraitCards.forEach(card => {
  card.addEventListener('click', () => {
    initAudio();
    playSfx('kick');
    portraitCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    selectedCharId = card.getAttribute('data-char');
  });
});

btnStart.addEventListener('click', () => {
  initAudio();
  playSfx('fanfare');
  modalSelect.classList.add('hidden');
  gameContainer.classList.remove('hidden');
  resizeCanvas();

  updateMiniHudPortrait();
  hudPlayerName.innerText = selectedCharId === 'diegoaz' ? 'Diegoaz' : (selectedCharId === 'vicky_vicky' ? 'Vicky' : 'Diego Jr.');

  socket.emit('join_game', { characterId: selectedCharId });
});

// Desplegable de reacciones rápidas
btnToggleReactions.addEventListener('click', () => {
  quickReactions.classList.toggle('hidden');
});

document.querySelectorAll('.stardew-reaction-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    const snd = btn.getAttribute('data-sound');
    const msg = btn.getAttribute('data-msg');
    if (snd === 'dog') playSfx('bark');
    else if (snd === 'goal') playSfx('fanfare');
    else playSfx('coin');

    quickReactions.classList.add('hidden');
    if (myPlayer) socket.emit('send_chat', msg);
  });
});

btnOpenHouseShop.addEventListener('click', () => {
  playSfx('coin');
  houseShopModal.classList.remove('hidden');
});
btnCloseShop.addEventListener('click', () => {
  houseShopModal.classList.add('hidden');
});

// ==========================================
// AUDIO SINTETIZADO RETRO
// ==========================================
let audioEnabled = true;
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSfx(type) {
  if (!audioEnabled) return;
  try {
    initAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'coin') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(987, now);
      osc.frequency.setValueAtTime(1318, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'kick') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.14);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (type === 'bark') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.linearRampToValueAtTime(560, now + 0.06);
      osc.frequency.linearRampToValueAtTime(320, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'fanfare') {
      [523, 659, 783, 1046].forEach((f, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(f, now + idx * 0.08);
        g.gain.setValueAtTime(0.18, now + idx * 0.08);
        g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.22);
        o.start(now + idx * 0.08);
        o.stop(now + idx * 0.08 + 0.22);
      });
    }
  } catch (e) {}
}

btnAudioToggle.addEventListener('click', () => {
  audioEnabled = !audioEnabled;
  btnAudioToggle.innerText = audioEnabled ? '🔊' : '🔇';
});

// ==========================================
// SOCKET.IO MULTIJUGADOR SINCRONIZADO
// ==========================================
socket.on('init_state', (data) => {
  myPlayer = data.self;
  camera.x = myPlayer.x;
  camera.y = myPlayer.y;

  for (const sId in data.players) {
    if (sId !== socket.id) otherPlayers[sId] = data.players[sId];
  }
  playerCoinsVal.innerText = `${myPlayer.coins}g`;
  familyVaultVal.innerText = `${familyVaultCoins}g`;
  showAlert(`¡Bienvenido al Barrio Az, ${myPlayer.name}!`);
});

socket.on('player_joined', (p) => {
  if (p.socketId !== socket.id) {
    otherPlayers[p.socketId] = p;
    showAlert(`👋 ¡${p.name} se unió a la partida!`);
    playSfx('fanfare');
  }
});

socket.on('player_moved', (data) => {
  if (data.socketId === socket.id) return;
  if (otherPlayers[data.socketId]) {
    const p = otherPlayers[data.socketId];
    p.x = data.x;
    p.y = data.y;
    p.direction = data.direction;
    p.isMoving = data.isMoving;
  } else {
    otherPlayers[data.socketId] = data;
  }
});

socket.on('ball_updated', (b) => {
  soccerBall.x = b.x;
  soccerBall.y = b.y;
  soccerBall.vx = b.vx;
  soccerBall.vy = b.vy;
});

socket.on('player_left', (data) => {
  if (otherPlayers[data.socketId]) {
    showAlert(`🚪 ${otherPlayers[data.socketId].name} salió.`);
    delete otherPlayers[data.socketId];
  }
});

socket.on('chat_received', (data) => {
  activeBubbles[data.socketId] = {
    text: data.text,
    time: Date.now() + 4500
  };
  if (data.text.includes('🐶')) playSfx('bark');
  else if (data.text.includes('⚽')) playSfx('fanfare');
  else playSfx('coin');
});

// ==========================================
// CONTROLES Y JOYSTICK
// ==========================================
let joystickActive = false;
let joystickId = null;
let moveDir = { x: 0, y: 0 };
const keys = { up: false, down: false, left: false, right: false };

function handleTouchStart(e) {
  e.preventDefault();
  initAudio();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    joystickActive = true;
    joystickId = t.identifier;
    updateJoystickPos(t.clientX, t.clientY);
    break;
  }
}

function handleTouchMove(e) {
  if (!joystickActive) return;
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    if (t.identifier === joystickId) {
      updateJoystickPos(t.clientX, t.clientY);
      break;
    }
  }
}

function handleTouchEnd(e) {
  if (!joystickActive) return;
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i].identifier === joystickId) {
      joystickActive = false;
      joystickId = null;
      joystickKnob.style.transform = 'translate(0px, 0px)';
      moveDir.x = 0;
      moveDir.y = 0;
      break;
    }
  }
}

function updateJoystickPos(cx, cy) {
  const rect = joystickRing.getBoundingClientRect();
  const rx = rect.left + rect.width / 2;
  const ry = rect.top + rect.height / 2;
  let dx = cx - rx;
  let dy = cy - ry;
  const dist = Math.hypot(dx, dy);
  const maxR = 36;

  if (dist > maxR) {
    dx = (dx / dist) * maxR;
    dy = (dy / dist) * maxR;
  }

  joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  moveDir.x = dx / maxR;
  moveDir.y = dy / maxR;
}

joystickArea.addEventListener('touchstart', handleTouchStart, { passive: false });
window.addEventListener('touchmove', handleTouchMove, { passive: false });
window.addEventListener('touchend', handleTouchEnd);
window.addEventListener('touchcancel', handleTouchEnd);

window.addEventListener('keydown', (e) => {
  initAudio();
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = true;
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = true;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
  if (e.key === 'e' || e.key === 'E' || e.key === ' ') doAction();
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = false;
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
});

// ==========================================
// INTERACCIONES Y ACCIÓN
// ==========================================
let currentInteractType = null;

function checkProximities() {
  if (!myPlayer) return;
  currentInteractType = null;

  // 1. Fuente Central
  const distFountain = Math.hypot(myPlayer.x - 1100, myPlayer.y - 750);
  if (distFountain < 80) {
    currentInteractType = 'fountain';
    setActionButton('⛲', 'DESEAR');
    locationBadge.innerText = 'Plaza de la Fuente';
    return;
  }

  // 2. Casa Az
  const distInn = Math.hypot(myPlayer.x - 620, myPlayer.y - 420);
  if (distInn < 90) {
    currentInteractType = 'inn';
    setActionButton('🏡', 'ENTRAR');
    locationBadge.innerText = 'Gran Casa Az';
    return;
  }

  // 3. Mercado
  const distMarket = Math.hypot(myPlayer.x - 1580, myPlayer.y - 420);
  if (distMarket < 90) {
    currentInteractType = 'market';
    setActionButton('🍎', 'COMPRAR');
    locationBadge.innerText = 'Mercado del Pueblo';
    return;
  }

  // 4. Perrito Toby
  const distPuppy = Math.hypot(myPlayer.x - puppy.x, myPlayer.y - puppy.y);
  if (distPuppy < 60) {
    currentInteractType = 'puppy';
    setActionButton('🐶', 'ACARICIAR');
    return;
  }

  btnActionMain.classList.remove('pulse');
  actionBtnEmoji.innerText = '✨';
  actionBtnLabel.innerText = 'TOCAR';
}

function setActionButton(emoji, label) {
  btnActionMain.classList.add('pulse');
  actionBtnEmoji.innerText = emoji;
  actionBtnLabel.innerText = label;
}

btnActionMain.addEventListener('click', () => { doAction(); });

function doAction() {
  if (!currentInteractType) {
    playSfx('kick');
    spawnEmojiBubble(myPlayer.x, myPlayer.y - 45, '✨ ¡Hola!');
    return;
  }

  if (currentInteractType === 'fountain') {
    playSfx('coin');
    showAlert('⛲ ¡Tiraste una moneda de oro a la fuente sagrada!');
  } else if (currentInteractType === 'inn') {
    playSfx('coin');
    showAlert('🏡 ¡Entraron a la Gran Casa Az!');
  } else if (currentInteractType === 'market') {
    playSfx('coin');
    showAlert('🍎 Doña Rosa: "¡Fruta fresca para Vicky y Diego Jr.!"');
  } else if (currentInteractType === 'puppy') {
    playSfx('bark');
    puppy.following = socket.id;
    showAlert('🐶 ¡Toby está feliz y te sigue!');
  }
}

function showAlert(text) {
  alertText.innerText = text;
  alertBanner.classList.remove('hidden');
  clearTimeout(showAlert.timer);
  showAlert.timer = setTimeout(() => {
    alertBanner.classList.add('hidden');
  }, 3200);
}

function spawnEmojiBubble(x, y, text) {
  activeBubbles[socket.id] = { text, time: Date.now() + 3500 };
}

// ==========================================
// LOOP PRINCIPAL DE ACTUALIZACIÓN (60 FPS)
// ==========================================
let lastMoveSent = 0;
let stepAnim = 0;

function update() {
  gameTime += 0.03;
  if (!myPlayer) return;

  let speed = 3.6;
  if (selectedCharId === 'diegoaz_jr') speed = 4.4;

  let vx = 0;
  let vy = 0;

  if (joystickActive) {
    vx = moveDir.x * speed;
    vy = moveDir.y * speed;
  } else {
    if (keys.up) vy -= speed;
    if (keys.down) vy += speed;
    if (keys.left) vx -= speed;
    if (keys.right) vx += speed;
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }
  }

  const isMoving = Math.hypot(vx, vy) > 0.3;
  if (isMoving) {
    stepAnim += 0.22;
    myPlayer.x = Math.max(50, Math.min(WORLD_WIDTH - 50, myPlayer.x + vx));
    myPlayer.y = Math.max(50, Math.min(WORLD_HEIGHT - 50, myPlayer.y + vy));

    if (Math.abs(vx) > Math.abs(vy)) myPlayer.direction = vx > 0 ? 'right' : 'left';
    else myPlayer.direction = vy > 0 ? 'down' : 'up';
  }
  myPlayer.isMoving = isMoving;

  // CÁMARA SUAVE CENTRADA CON ZOOM
  const targetCamX = myPlayer.x - (canvas.width / zoomScale) / 2;
  const targetCamY = myPlayer.y - (canvas.height / zoomScale) / 2;
  camera.x += (targetCamX - camera.x) * 0.15;
  camera.y += (targetCamY - camera.y) * 0.15;

  // Enviar multijugador a 30fps
  const now = Date.now();
  if (now - lastMoveSent > 33) {
    socket.emit('player_move', {
      x: myPlayer.x,
      y: myPlayer.y,
      direction: myPlayer.direction,
      isMoving: myPlayer.isMoving
    });
    lastMoveSent = now;
  }

  // Pelota de fútbol
  const distBall = Math.hypot(myPlayer.x - soccerBall.x, myPlayer.y - soccerBall.y);
  if (distBall < 26) {
    const angle = Math.atan2(soccerBall.y - myPlayer.y, soccerBall.x - myPlayer.x);
    soccerBall.vx = Math.cos(angle) * 8.5;
    soccerBall.vy = Math.sin(angle) * 8.5;
    playSfx('kick');
    socket.emit('kick_ball', soccerBall);
  }

  soccerBall.x += soccerBall.vx;
  soccerBall.y += soccerBall.vy;
  soccerBall.vx *= 0.94;
  soccerBall.vy *= 0.94;

  // Perrito Toby
  if (puppy.following === socket.id) {
    const distToPlayer = Math.hypot(myPlayer.x - puppy.x, myPlayer.y - puppy.y);
    if (distToPlayer > 40) {
      const pAngle = Math.atan2(myPlayer.y - puppy.y, myPlayer.x - puppy.x);
      puppy.x += Math.cos(pAngle) * 3.4;
      puppy.y += Math.sin(pAngle) * 3.4;
    }
  }

  // Monedas
  streetCoins.forEach(coin => {
    if (!coin.collected) {
      const distC = Math.hypot(myPlayer.x - coin.x, myPlayer.y - coin.y);
      if (distC < 24) {
        coin.collected = true;
        myPlayer.coins += 10;
        familyVaultCoins += 10;
        playerCoinsVal.innerText = `${myPlayer.coins}g`;
        familyVaultVal.innerText = `${familyVaultCoins}g`;
        playSfx('coin');
        showAlert('🪙 +10 Oro familiar recogido!');
        setTimeout(() => { coin.collected = false; }, 18000);
      }
    }
  });

  // Humo chimenea
  if (Math.random() < 0.15) {
    smokePuffs.push({ x: 505, y: 325, r: 3, a: 0.8, vy: -0.6 });
  }
  for (let i = smokePuffs.length - 1; i >= 0; i--) {
    const s = smokePuffs[i];
    s.y += s.vy;
    s.r += 0.12;
    s.a -= 0.015;
    if (s.a <= 0) smokePuffs.splice(i, 1);
  }

  checkProximities();
}

// ==========================================
// RENDERIZADO VISUAL STARDEW VALLEY
// ==========================================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  // Aplicar zoom y traslación de cámara centrada
  ctx.scale(zoomScale, zoomScale);
  ctx.translate(-camera.x, -camera.y);

  // 1. DIBUJAR PUEBLO PIXEL ART
  drawPixelWorld();

  // 2. DIBUJAR JUGADORES REMOTOS CON SPRITES 16x32
  for (const sId in otherPlayers) {
    drawStardewPlayer(otherPlayers[sId], sId);
  }

  // 3. DIBUJAR JUGADOR LOCAL
  if (myPlayer) {
    drawStardewPlayer(myPlayer, socket.id, true);
  }

  // 4. HUMO DE CHIMENEA
  smokePuffs.forEach(s => {
    ctx.fillStyle = `rgba(241, 245, 249, ${s.a})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // 5. GLOBOS DE CHAT
  drawBubbles();

  ctx.restore();
}

// DIBUJO DE ESCENARIO STARDEW VALLEY
function drawPixelWorld() {
  // Césped verde exuberante
  ctx.fillStyle = '#4c7332';
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Textura sutil de briznas de hierba Stardew
  ctx.fillStyle = '#3f6228';
  for (let x = 0; x < WORLD_WIDTH; x += 32) {
    for (let y = 0; y < WORLD_HEIGHT; y += 32) {
      if ((x + y) % 64 === 0) ctx.fillRect(x + 10, y + 10, 4, 3);
    }
  }

  // Caminos de adoquines empedrados (Cobblestone)
  drawCobblestoneRoad(990, 0, 220, WORLD_HEIGHT);
  drawCobblestoneRoad(0, 650, WORLD_WIDTH, 200);

  // Plaza Central Redonda
  ctx.fillStyle = '#9b9281';
  ctx.beginPath();
  ctx.arc(1100, 750, 160, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5c5446';
  ctx.lineWidth = 4;
  ctx.stroke();

  // FUENTE DE PIEDRA CON AGUA ANIMADA (CENTRAL)
  drawFountain(1100, 750);

  // POSADA / GRAN CASA AZ (Noroeste)
  drawInnHouse(460, 310, 240, 180);

  // MERCADO CON TOLDO DE RAYAS AZUL Y BLANCO (Noreste)
  drawMarketStall(1480, 340, 160, 110);

  // PARQUE CON PELOTA ⚽
  drawParkAndBall(440, 1100, 440, 320);

  // PERRITO TOBY
  drawPixelDog(puppy.x, puppy.y);

  // CARTELES DE MADERA
  drawSign(1240, 810);

  // FAROLES CON LUZ CÁLIDA
  drawLantern(970, 560);
  drawLantern(1230, 560);
  drawLantern(970, 920);
  drawLantern(1230, 920);

  // Árboles frondosos estilo Stardew
  drawStardewTree(860, 480);
  drawStardewTree(1340, 480);
  drawStardewTree(860, 1000);
  drawStardewTree(1340, 1000);
  drawStardewTree(360, 260);
  drawStardewTree(1760, 260);

  // Monedas brillantes en el suelo
  streetCoins.forEach(coin => {
    if (!coin.collected) {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(coin.x - 5, coin.y - 5, 10, 10);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(coin.x - 3, coin.y - 3, 6, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(coin.x - 1, coin.y - 1, 3, 3);
    }
  });
}

function drawCobblestoneRoad(x, y, w, h) {
  ctx.fillStyle = '#9b9281';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#5c5446';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#b0a693';
  for (let px = x + 6; px < x + w - 16; px += 24) {
    for (let py = y + 6; py < y + h - 16; py += 16) {
      const offset = (Math.floor(py / 16) % 2 === 0) ? 0 : 12;
      ctx.fillRect(px + offset, py, 18, 10);
      ctx.fillStyle = '#7a7060';
      ctx.fillRect(px + offset, py + 9, 18, 2);
      ctx.fillStyle = '#b0a693';
    }
  }
}

function drawFountain(cx, cy) {
  // Anillo exterior
  ctx.fillStyle = '#78716c';
  ctx.beginPath(); ctx.arc(cx, cy, 64, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#44403c'; ctx.lineWidth = 4; ctx.stroke();

  // Agua azul
  const pulse = Math.sin(gameTime * 3) * 2;
  ctx.fillStyle = '#0284c7';
  ctx.beginPath(); ctx.arc(cx, cy, 48 + pulse, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath(); ctx.arc(cx - 8, cy - 8, 34, 0, Math.PI * 2); ctx.fill();

  // Estatua central
  ctx.fillStyle = '#78716c';
  ctx.fillRect(cx - 12, cy - 16, 24, 22);
  ctx.fillStyle = '#e7e5e4';
  ctx.beginPath(); ctx.arc(cx, cy - 20, 10, 0, Math.PI * 2); ctx.fill();
}

function drawInnHouse(x, y, w, h) {
  // Fachada
  ctx.fillStyle = '#ebd6b7';
  ctx.fillRect(x, y + 60, w, h - 60);
  ctx.strokeStyle = '#451a03'; ctx.lineWidth = 3; ctx.strokeRect(x, y + 60, w, h - 60);

  // Vigas
  ctx.fillStyle = '#78350f';
  for (let bx = x + 30; bx < x + w; bx += 44) ctx.fillRect(bx, y + 60, 6, h - 60);

  // Tejado de tejas rojas Stardew
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(x - 10, y, w + 20, 60);
  ctx.strokeStyle = '#450a0a'; ctx.lineWidth = 4; ctx.strokeRect(x - 10, y, w + 20, 60);

  // Chimenea
  ctx.fillStyle = '#57534e';
  ctx.fillRect(x + 36, y - 20, 24, 30);

  // Puerta y letrero
  ctx.fillStyle = '#451a03';
  ctx.fillRect(x + w / 2 - 20, y + h - 50, 40, 50);

  ctx.fillStyle = '#451a03';
  ctx.fillRect(x + w / 2 - 40, y + 36, 80, 20);
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 8px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('CASA AZ', x + w / 2, y + 50);
  ctx.textAlign = 'start';
}

function drawMarketStall(x, y, w, h) {
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x, y + 40, w, h - 40);
  ctx.strokeStyle = '#291104'; ctx.lineWidth = 3; ctx.strokeRect(x, y + 40, w, h - 40);

  // Toldo a rayas azules y blancas (como en Stardew)
  const sw = 16;
  for (let i = 0; i < w / sw; i++) {
    ctx.fillStyle = (i % 2 === 0) ? '#1d4ed8' : '#f8fafc';
    ctx.fillRect(x + i * sw, y, sw, 40);
  }
  ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, 40);

  // Cajas de fruta
  ctx.fillStyle = '#b45309'; ctx.fillRect(x + 16, y + 48, 30, 20);
  ctx.fillStyle = '#dc2626'; ctx.fillRect(x + 20, y + 52, 8, 6); ctx.fillRect(x + 32, y + 52, 8, 6);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 7px "Press Start 2P"';
  ctx.fillText('MERCADO', x + 24, y + 84);
}

function drawParkAndBall(x, y, w, h) {
  ctx.fillStyle = '#15803d';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#14532d'; ctx.lineWidth = 4; ctx.strokeRect(x, y, w, h);

  ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2;
  ctx.strokeRect(x + 20, y + 20, w - 40, h - 40);

  // Arco norte
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(560, 1100, 80, 10);

  // Pelota ⚽
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(soccerBall.x, soccerBall.y, soccerBall.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#0f172a'; ctx.font = '10px sans-serif';
  ctx.fillText('⚽', soccerBall.x - 6, soccerBall.y + 4);
}

function drawPixelDog(x, y) {
  ctx.fillStyle = '#b45309'; ctx.fillRect(x - 8, y - 5, 16, 10);
  ctx.fillRect(x + 3, y - 11, 8, 8);
  ctx.fillStyle = '#78350f'; ctx.fillRect(x + 1, y - 13, 3, 5);
  ctx.fillStyle = '#0f172a'; ctx.fillRect(x + 8, y - 8, 2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 7px "Press Start 2P"';
  ctx.fillText('🐶 Toby', x - 14, y - 18);
}

function drawSign(x, y) {
  ctx.fillStyle = '#451a03'; ctx.fillRect(x + 6, y, 8, 50);
  ctx.fillStyle = '#78350f'; ctx.fillRect(x - 14, y + 6, 68, 14);
  ctx.fillStyle = '#fef08a'; ctx.font = 'bold 6px "Press Start 2P"';
  ctx.fillText('Mercado →', x - 10, y + 16);
}

function drawLantern(x, y) {
  ctx.fillStyle = '#292524'; ctx.fillRect(x - 2, y, 4, 30);
  ctx.fillStyle = 'rgba(253, 224, 71, 0.25)';
  ctx.beginPath(); ctx.arc(x, y - 4, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fde047'; ctx.fillRect(x - 4, y - 8, 8, 8);
}

function drawStardewTree(x, y) {
  // Tronco
  ctx.fillStyle = '#5c3317'; ctx.fillRect(x - 6, y + 16, 12, 26);
  // Follaje exuberante en capas Stardew
  ctx.fillStyle = '#166534'; ctx.beginPath(); ctx.arc(x, y, 32, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#15803d'; ctx.beginPath(); ctx.arc(x - 5, y - 5, 26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(x - 10, y - 10, 16, 0, Math.PI * 2); ctx.fill();
}

// DIBUJAR JUGADOR CON EL SPRITE 16x32 STARDEW VALLEY
function drawStardewPlayer(p, sId, isSelf = false) {
  const x = Math.round(p.x);
  const y = Math.round(p.y);
  const dir = p.direction || 'down';

  // Frame de caminata (0 = idle, 1 = paso izq, 2 = paso der)
  let frame = 0;
  if (p.isMoving) {
    const cycle = Math.floor(stepAnim) % 4;
    if (cycle === 1) frame = 1;
    else if (cycle === 3) frame = 2;
  }

  // Obtener o generar sprite 16x32
  const sprite = getStardewSprite(p.id, dir, frame);

  // Dibujar centrado en los pies (sprite de 16x32)
  ctx.drawImage(sprite, x - 8, y - 28);

  // Etiqueta con Nombre estilo Stardew Valley
  ctx.font = 'bold 7px "Press Start 2P"';
  ctx.textAlign = 'center';
  const tagW = ctx.measureText(p.name).width + 8;

  ctx.fillStyle = isSelf ? 'rgba(30, 75, 40, 0.88)' : 'rgba(50, 30, 15, 0.88)';
  ctx.fillRect(x - tagW / 2, y - 36, tagW, 11);
  ctx.strokeStyle = isSelf ? '#86efac' : '#facc15';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - tagW / 2, y - 36, tagW, 11);

  ctx.fillStyle = '#fef08a';
  ctx.fillText(p.name, x, y - 28);
  ctx.textAlign = 'start';
}

function drawBubbles() {
  const now = Date.now();
  for (const sId in activeBubbles) {
    const b = activeBubbles[sId];
    if (now > b.time) {
      delete activeBubbles[sId];
      continue;
    }
    const p = (sId === socket.id ? myPlayer : otherPlayers[sId]);
    if (p) {
      const bx = p.x;
      const by = p.y - 44;
      ctx.font = 'bold 7px "Press Start 2P"';
      ctx.textAlign = 'center';
      const tw = ctx.measureText(b.text).width + 12;

      ctx.fillStyle = '#deb887';
      ctx.fillRect(bx - tw / 2, by - 12, tw, 16);
      ctx.strokeStyle = '#5a381e';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx - tw / 2, by - 12, tw, 16);

      ctx.fillStyle = '#3b200c';
      ctx.fillText(b.text, bx, by);
      ctx.textAlign = 'start';
    }
  }
}

// Bucle
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
