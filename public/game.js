// ==========================================
// EL BARRIO AZ - MOTOR PIXEL ART URBANO
// Inspirado en el Sprite Sheet y Tileset oficial
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
// MUNDO Y ZOOM PERFECTO (SIN EXCESO DE ZOOM)
// ==========================================
const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 1500;
const camera = { x: 1000, y: 700 };
// Zoom cómodo: 1.35x en móvil y 1.25x en PC para ver calles y casas completas
let zoomScale = 1.35;

let selectedCharId = 'diegoaz_jr';
let myPlayer = null;
const otherPlayers = {};
let familyVaultCoins = 500;
let activeBubbles = {};
let particles = [];
let gameTime = 0;

// Objetos del mundo urbano
const soccerBall = { x: 550, y: 1100, vx: 0, vy: 0, radius: 10 };
const puppy = { x: 700, y: 1050, following: null };
let streetCoins = [
  { x: 920, y: 680, collected: false },
  { x: 1080, y: 680, collected: false },
  { x: 1000, y: 520, collected: false },
  { x: 1000, y: 840, collected: false },
  { x: 1300, y: 680, collected: false },
  { x: 700, y: 680, collected: false },
  { x: 550, y: 1050, collected: false }
];

// ==========================================
// GENERADOR DE SPRITES FIELES AL SPRITE SHEET
// ==========================================
const spriteCache = {};

function createOffscreen(w, h, renderFn) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const cctx = c.getContext('2d');
  cctx.imageSmoothingEnabled = false;
  renderFn(cctx);
  return c;
}

// 1. RETRATOS DE DIÁLOGO (64x64)
function drawCharacterPortrait(pctx, charId) {
  pctx.fillStyle = '#1e293b';
  pctx.fillRect(0, 0, 64, 64);
  pctx.fillStyle = '#334155';
  pctx.fillRect(2, 2, 60, 60);

  if (charId === 'diegoaz') {
    // ---------------------------------------------
    // DIEGOAZ (Papá - Gafas, barba recortada, chaqueta verde)
    // ---------------------------------------------
    // Chaqueta verde oliva / bosque abierta
    pctx.fillStyle = '#2f5233'; pctx.fillRect(10, 44, 44, 20);
    pctx.fillStyle = '#3e6b43'; pctx.fillRect(12, 46, 40, 18);
    // Camiseta oscura interior
    pctx.fillStyle = '#181a20'; pctx.fillRect(26, 46, 12, 18);
    // Correa bandolera cuero marrón cruzada
    pctx.fillStyle = '#5c3317'; pctx.fillRect(18, 44, 6, 20);

    // Cuello y mandíbula
    pctx.fillStyle = '#9c6644'; pctx.fillRect(24, 38, 16, 8);
    // Rostro tono piel cálido
    pctx.fillStyle = '#b07d58'; pctx.fillRect(18, 18, 28, 24);

    // Cabello rizado / afro oscuro con toques canosos
    pctx.fillStyle = '#2e1d13'; pctx.fillRect(14, 10, 36, 14);
    pctx.fillStyle = '#422c1e'; pctx.fillRect(16, 12, 32, 8);
    pctx.fillStyle = '#8a817c'; pctx.fillRect(20, 12, 10, 3); // canas sutiles

    // Barba recortada elegante con toques grises
    pctx.fillStyle = '#6b635b'; pctx.fillRect(18, 32, 28, 12);
    pctx.fillStyle = '#b07d58'; pctx.fillRect(26, 34, 12, 3); // labio

    // Gafas oscuras rectangulares
    pctx.fillStyle = '#0f172a';
    pctx.fillRect(21, 22, 9, 7); pctx.fillRect(34, 22, 9, 7); // montura
    pctx.fillRect(30, 24, 4, 2); // puente
    pctx.fillStyle = '#7dd3fc';
    pctx.fillRect(23, 24, 5, 3); pctx.fillRect(36, 24, 5, 3); // cristales reflejo

  } else if (charId === 'vicky_vicky') {
    // ---------------------------------------------
    // VICKY VICKY (10 años - Cabello afro/rizado, sudadera arcoíris)
    // ---------------------------------------------
    // Cabello rizado abundante afro
    pctx.fillStyle = '#2e1d13'; pctx.fillRect(12, 10, 40, 32);
    pctx.fillStyle = '#422c1e'; pctx.fillRect(14, 12, 36, 24);

    // Sudadera con rayas horizontales pastel arcoíris
    pctx.fillStyle = '#38bdf8'; pctx.fillRect(14, 44, 36, 5); // cyan
    pctx.fillStyle = '#c084fc'; pctx.fillRect(14, 49, 36, 5); // lila
    pctx.fillStyle = '#f472b6'; pctx.fillRect(14, 54, 36, 5); // rosa
    pctx.fillStyle = '#fde047'; pctx.fillRect(14, 59, 36, 5); // amarillo

    // Rostro
    pctx.fillStyle = '#b07d58'; pctx.fillRect(20, 18, 24, 22);

    // Ojos vivaces
    pctx.fillStyle = '#0f172a'; pctx.fillRect(24, 24, 4, 5); pctx.fillRect(36, 24, 4, 5);
    pctx.fillStyle = '#ffffff'; pctx.fillRect(25, 24, 2, 2); pctx.fillRect(37, 24, 2, 2); // brillo

    // Sonrisa alegre
    pctx.fillStyle = '#dc2626'; pctx.fillRect(28, 33, 8, 3);

  } else if (charId === 'diegoaz_jr') {
    // ---------------------------------------------
    // DIEGOAZ JR. (4 años - Pelo rubio, peto/overol vaquero)
    // ---------------------------------------------
    // Peto azul vaquero con tirantes y botones dorados
    pctx.fillStyle = '#1d4ed8'; pctx.fillRect(14, 46, 36, 18);
    pctx.fillStyle = '#2563eb'; pctx.fillRect(18, 44, 8, 20); pctx.fillRect(38, 44, 8, 20); // tirantes
    pctx.fillStyle = '#facc15'; pctx.fillRect(21, 48, 3, 3);  pctx.fillRect(41, 48, 3, 3);  // botones dorados
    // Camiseta a rayas visible en los hombros
    pctx.fillStyle = '#ef4444'; pctx.fillRect(12, 46, 6, 10); pctx.fillRect(46, 46, 6, 10);

    // Rostro infantil sonrosado
    pctx.fillStyle = '#fed7aa'; pctx.fillRect(18, 20, 28, 22);

    // Pelo rubio brillante despeinado (como el sprite sheet)
    pctx.fillStyle = '#ca8a04'; pctx.fillRect(16, 10, 32, 14);
    pctx.fillStyle = '#facc15'; pctx.fillRect(18, 12, 28, 10);
    pctx.fillStyle = '#fef08a'; pctx.fillRect(20, 12, 14, 4); // mechón luz

    // Ojos azules grandes de niño
    pctx.fillStyle = '#0f172a'; pctx.fillRect(24, 26, 4, 5); pctx.fillRect(36, 26, 4, 5);
    pctx.fillStyle = '#38bdf8'; pctx.fillRect(25, 27, 3, 3); pctx.fillRect(37, 27, 3, 3);
    pctx.fillStyle = '#ffffff'; pctx.fillRect(25, 26, 2, 2); pctx.fillRect(37, 26, 2, 2);

    // Sonrisa tierna
    pctx.fillStyle = '#dc2626'; pctx.fillRect(28, 34, 8, 3);
  }
}

['diegoaz', 'vicky_vicky', 'diegoaz_jr'].forEach(cId => {
  const canvasEl = document.getElementById(cId === 'diegoaz' ? 'portrait-diegoaz' : (cId === 'vicky_vicky' ? 'portrait-vicky' : 'portrait-junior'));
  if (canvasEl) {
    const pctx = canvasEl.getContext('2d');
    pctx.imageSmoothingEnabled = false;
    drawCharacterPortrait(pctx, cId);
  }
});

function updateMiniHudPortrait() {
  const pctx = hudMiniPortrait.getContext('2d');
  pctx.imageSmoothingEnabled = false;
  pctx.clearRect(0, 0, 28, 28);
  pctx.save();
  pctx.scale(28 / 64, 28 / 64);
  drawCharacterPortrait(pctx, selectedCharId);
  pctx.restore();
}

// 2. GENERADOR DE SPRITES EXACTOS AL SPRITE SHEET (16x32)
function getCharacterSprite(charId, dir, frame) {
  const key = `${charId}_${dir}_${frame}`;
  if (spriteCache[key]) return spriteCache[key];

  const c = createOffscreen(18, 34, (sctx) => {
    const isStepL = (frame === 1);
    const isStepR = (frame === 2);
    const bob = (frame > 0) ? -1 : 0;

    if (charId === 'diegoaz') {
      // ------------------------------------
      // PAPÁ DIEGOAZ (Adulto con gafas, barba, chaqueta verde)
      // ------------------------------------
      // Sombra
      sctx.fillStyle = 'rgba(0,0,0,0.35)'; sctx.fillRect(4, 30, 10, 3);

      // Pantalones gris marengo y zapatos de vestir marrón
      sctx.fillStyle = '#262d38';
      sctx.fillRect(5, 20 + bob, 3, 7 + (isStepL ? -1 : 0));
      sctx.fillRect(10, 20 + bob, 3, 7 + (isStepR ? -1 : 0));
      sctx.fillStyle = '#422817'; // zapatos marrones
      sctx.fillRect(4, 27 + (isStepL ? -1 : 0), 4, 3);
      sctx.fillRect(10, 27 + (isStepR ? -1 : 0), 4, 3);

      // Chaqueta verde oliva / bosque
      sctx.fillStyle = '#335937';
      sctx.fillRect(4, 12 + bob, 10, 9);
      // Camiseta negra interior
      sctx.fillStyle = '#181a20';
      sctx.fillRect(7, 12 + bob, 4, 9);
      // Correa de bandolera cruzada
      sctx.fillStyle = '#5c3317';
      sctx.fillRect(dir === 'right' ? 9 : 5, 12 + bob, 2, 9);

      // Cabeza / Piel
      sctx.fillStyle = '#b07d58';
      sctx.fillRect(5, 4 + bob, 8, 8);

      // Pelo afro castaño oscuro con canas
      sctx.fillStyle = '#362215';
      sctx.fillRect(4, 2 + bob, 10, 4);

      if (dir === 'down') {
        // Gafas y barba de frente
        sctx.fillStyle = '#7a7067'; // barba con canas
        sctx.fillRect(5, 8 + bob, 8, 4);
        sctx.fillStyle = '#0f172a'; // montura gafas
        sctx.fillRect(5, 5 + bob, 3, 3); sctx.fillRect(10, 5 + bob, 3, 3);
        sctx.fillStyle = '#7dd3fc';
        sctx.fillRect(6, 6 + bob, 1, 1); sctx.fillRect(11, 6 + bob, 1, 1); // brillo gafas
      } else if (dir === 'up') {
        sctx.fillStyle = '#362215';
        sctx.fillRect(4, 3 + bob, 10, 9); // nuca
        // Bolsa bandolera visible en espalda
        sctx.fillStyle = '#5c3317';
        sctx.fillRect(4, 15 + bob, 4, 5);
      } else {
        // Perfil
        sctx.fillStyle = '#7a7067';
        sctx.fillRect(dir === 'right' ? 9 : 4, 8 + bob, 5, 4);
        sctx.fillStyle = '#0f172a';
        sctx.fillRect(dir === 'right' ? 10 : 5, 5 + bob, 3, 3);
      }

    } else if (charId === 'vicky_vicky') {
      // ------------------------------------
      // VICKY VICKY (10 años - Pelo afro, sudadera arcoíris, mochila)
      // ------------------------------------
      sctx.fillStyle = 'rgba(0,0,0,0.35)'; sctx.fillRect(4, 29, 10, 3);

      // Pantalones vaqueros azul denim y zapatillas rosas
      sctx.fillStyle = '#2563eb';
      sctx.fillRect(5, 20 + bob, 3, 7 + (isStepL ? -1 : 0));
      sctx.fillRect(10, 20 + bob, 3, 7 + (isStepR ? -1 : 0));
      sctx.fillStyle = '#f472b6'; // zapatillas rosas
      sctx.fillRect(4, 27 + (isStepL ? -1 : 0), 4, 3);
      sctx.fillRect(10, 27 + (isStepR ? -1 : 0), 4, 3);
      sctx.fillStyle = '#ffffff'; // suela blanca
      sctx.fillRect(4, 29 + (isStepL ? -1 : 0), 4, 1);
      sctx.fillRect(10, 29 + (isStepR ? -1 : 0), 4, 1);

      // Sudadera a rayas arcoíris (Cyan, Lila, Rosa, Amarillo)
      sctx.fillStyle = '#38bdf8'; sctx.fillRect(4, 12 + bob, 10, 2);
      sctx.fillStyle = '#c084fc'; sctx.fillRect(4, 14 + bob, 10, 2);
      sctx.fillStyle = '#f472b6'; sctx.fillRect(4, 16 + bob, 10, 2);
      sctx.fillStyle = '#fde047'; sctx.fillRect(4, 18 + bob, 10, 2);

      // Pelo afro con volumen
      sctx.fillStyle = '#362215';
      sctx.fillRect(3, 2 + bob, 12, 10);

      // Rostro
      sctx.fillStyle = '#b07d58';
      sctx.fillRect(5, 5 + bob, 8, 7);

      if (dir === 'down') {
        sctx.fillStyle = '#0f172a';
        sctx.fillRect(6, 7 + bob, 1, 2); sctx.fillRect(11, 7 + bob, 1, 2); // ojos
      } else if (dir === 'up') {
        sctx.fillStyle = '#362215';
        sctx.fillRect(3, 3 + bob, 12, 10);
        // Mochila marrón en la espalda
        sctx.fillStyle = '#854d0e';
        sctx.fillRect(6, 13 + bob, 6, 7);
      } else {
        // Mochila en vista lateral
        sctx.fillStyle = '#854d0e';
        sctx.fillRect(dir === 'right' ? 3 : 11, 13 + bob, 4, 6);
      }

    } else {
      // ------------------------------------
      // DIEGOAZ JR. (4 años - Rubio, peto vaquero, camiseta rayas)
      // ------------------------------------
      sctx.fillStyle = 'rgba(0,0,0,0.35)'; sctx.fillRect(4, 27, 10, 3);

      // Piernas y zapatillas rojas
      sctx.fillStyle = '#fed7aa'; // piernas
      sctx.fillRect(6, 19 + bob, 2, 5 + (isStepL ? -1 : 0));
      sctx.fillRect(10, 19 + bob, 2, 5 + (isStepR ? -1 : 0));
      sctx.fillStyle = '#ef4444'; // tenis rojos
      sctx.fillRect(5, 24 + (isStepL ? -1 : 0), 3, 3);
      sctx.fillRect(10, 24 + (isStepR ? -1 : 0), 3, 3);

      // Peto azul vaquero con tirantes
      sctx.fillStyle = '#2563eb';
      sctx.fillRect(5, 14 + bob, 8, 7);
      sctx.fillStyle = '#1d4ed8'; // tirantes
      sctx.fillRect(5, 12 + bob, 2, 4); sctx.fillRect(11, 12 + bob, 2, 4);
      sctx.fillStyle = '#fbbf24'; // botones dorados
      sctx.fillRect(5, 15 + bob, 1, 1); sctx.fillRect(12, 15 + bob, 1, 1);

      // Pelo rubio despeinado
      sctx.fillStyle = '#facc15';
      sctx.fillRect(4, 4 + bob, 10, 6);
      sctx.fillStyle = '#ca8a04';
      sctx.fillRect(4, 3 + bob, 10, 2);

      // Rostro
      sctx.fillStyle = '#fed7aa';
      sctx.fillRect(5, 6 + bob, 8, 6);

      if (dir === 'down') {
        sctx.fillStyle = '#0f172a';
        sctx.fillRect(6, 8 + bob, 1, 2); sctx.fillRect(11, 8 + bob, 1, 2);
      } else if (dir === 'up') {
        sctx.fillStyle = '#facc15';
        sctx.fillRect(4, 4 + bob, 10, 9);
      }
    }
  });

  spriteCache[key] = c;
  return c;
}

// ==========================================
// REDIMENSIÓN RESPONSIVE
// ==========================================
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Zoom confortable (1.35x en móvil para ver calles completas, sin exceso)
  const isMobile = window.innerWidth < 768;
  zoomScale = isMobile ? 1.35 : 1.25;
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
resizeCanvas();

// Selección de personajes
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

btnToggleReactions.addEventListener('click', () => {
  quickReactions.classList.toggle('hidden');
});

document.querySelectorAll('.urban-reaction-pill').forEach(btn => {
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
// MULTIJUGADOR SINCRONIZADO
// ==========================================
socket.on('init_state', (data) => {
  myPlayer = data.self;
  camera.x = myPlayer.x;
  camera.y = myPlayer.y;

  for (const sId in data.players) {
    if (sId !== socket.id) otherPlayers[sId] = data.players[sId];
  }
  playerCoinsVal.innerText = myPlayer.coins;
  familyVaultVal.innerText = familyVaultCoins;
  showAlert(`¡Bienvenido al Barrio Az, ${myPlayer.name}!`);
});

socket.on('player_joined', (p) => {
  if (p.socketId !== socket.id) {
    otherPlayers[p.socketId] = p;
    showAlert(`👋 ¡${p.name} se unió al barrio!`);
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

  // Parada de autobús
  const distBus = Math.hypot(myPlayer.x - 1100, myPlayer.y - 650);
  if (distBus < 70) {
    currentInteractType = 'bus_stop';
    setActionButton('🚏', 'PARADA');
    locationBadge.innerText = 'Parada de Autobús';
    return;
  }

  // Bancos del parque
  const distBench = Math.hypot(myPlayer.x - 900, myPlayer.y - 650);
  if (distBench < 60) {
    currentInteractType = 'bench';
    setActionButton('🛋️', 'SENTARSE');
    locationBadge.innerText = 'Bancos de la Plaza';
    return;
  }

  // Perrito Toby
  const distPuppy = Math.hypot(myPlayer.x - puppy.x, myPlayer.y - puppy.y);
  if (distPuppy < 60) {
    currentInteractType = 'puppy';
    setActionButton('🐶', 'ACARICIAR');
    return;
  }

  // Pelota de fútbol
  const distBall = Math.hypot(myPlayer.x - soccerBall.x, myPlayer.y - soccerBall.y);
  if (distBall < 50) {
    locationBadge.innerText = 'Parque & Fútbol';
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

  if (currentInteractType === 'bus_stop') {
    playSfx('coin');
    showAlert('🚏 ¡Ruta 42 del Barrio Az en camino!');
  } else if (currentInteractType === 'bench') {
    playSfx('coin');
    showAlert('🛋️ Descansando en el banco del parque...');
  } else if (currentInteractType === 'puppy') {
    playSfx('bark');
    puppy.following = socket.id;
    showAlert('🐶 ¡Toby mueve la cola y te sigue feliz!');
  }
}

function showAlert(text) {
  alertText.innerText = text;
  alertBanner.classList.remove('hidden');
  clearTimeout(showAlert.timer);
  showAlert.timer = setTimeout(() => {
    alertBanner.classList.add('hidden');
  }, 3000);
}

function spawnEmojiBubble(x, y, text) {
  activeBubbles[socket.id] = { text, time: Date.now() + 3500 };
}

// ==========================================
// LOOP DE ACTUALIZACIÓN (60 FPS)
// ==========================================
let lastMoveSent = 0;
let stepAnim = 0;

function update() {
  gameTime += 0.03;
  if (!myPlayer) return;

  let speed = 3.8;
  if (selectedCharId === 'diegoaz_jr') speed = 4.6;

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
    stepAnim += 0.24;
    myPlayer.x = Math.max(50, Math.min(WORLD_WIDTH - 50, myPlayer.x + vx));
    myPlayer.y = Math.max(50, Math.min(WORLD_HEIGHT - 50, myPlayer.y + vy));

    if (Math.abs(vx) > Math.abs(vy)) myPlayer.direction = vx > 0 ? 'right' : 'left';
    else myPlayer.direction = vy > 0 ? 'down' : 'up';
  }
  myPlayer.isMoving = isMoving;

  // Cámara centrada con zoom cómodo (1.35x)
  const targetCamX = myPlayer.x - (canvas.width / zoomScale) / 2;
  const targetCamY = myPlayer.y - (canvas.height / zoomScale) / 2;
  camera.x += (targetCamX - camera.x) * 0.15;
  camera.y += (targetCamY - camera.y) * 0.15;

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
  if (distBall < 24) {
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
    if (distToPlayer > 38) {
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
        playerCoinsVal.innerText = myPlayer.coins;
        familyVaultVal.innerText = familyVaultCoins;
        playSfx('coin');
        showAlert('🪙 +10 Monedas recogidas!');
        setTimeout(() => { coin.collected = false; }, 18000);
      }
    }
  });

  checkProximities();
}

// ==========================================
// RENDERIZADO VISUAL DEL BARRIO URBANO
// ==========================================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.scale(zoomScale, zoomScale);
  ctx.translate(-camera.x, -camera.y);

  // 1. DIBUJAR TERRENO URBANO (ASsfalto, Aceras con grietas, Césped con flores)
  drawUrbanTerrain();

  // 2. DIBUJAR PROPS URBANOS (Parada de bus, banco, hidrante, papelera, farolas, señales PARE)
  drawUrbanProps();

  // 3. JUGADORES REMOTOS
  for (const sId in otherPlayers) {
    drawPlayer(otherPlayers[sId], sId);
  }

  // 4. JUGADOR LOCAL
  if (myPlayer) {
    drawPlayer(myPlayer, socket.id, true);
  }

  // 5. GLOBOS DE TEXTO
  drawBubbles();

  ctx.restore();
}

// ==========================================
// DIBUJO DEL TERRENO FIEL AL TILESET
// ==========================================
function drawUrbanTerrain() {
  // Fondo de césped verde exuberante con flores silvestres (como en el tileset)
  ctx.fillStyle = '#3f7a2d';
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Textura y manchones de césped oscuro con margaritas y flores azules
  ctx.fillStyle = '#2f5c22';
  for (let x = 0; x < WORLD_WIDTH; x += 48) {
    for (let y = 0; y < WORLD_HEIGHT; y += 48) {
      if ((x * 3 + y * 7) % 5 === 0) {
        ctx.fillRect(x + 4, y + 4, 12, 8);
        // Margaritas blancas diminutas
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 10, y + 6, 2, 2);
        // Flor azul diminuta
        ctx.fillStyle = '#60a5fa'; ctx.fillRect(x + 16, y + 8, 2, 2);
        ctx.fillStyle = '#2f5c22';
      }
    }
  }

  // AVENIDA PRINCIPAL DE ASFALTO (Centro Horizontal)
  drawAsphaltRoad(0, 700, WORLD_WIDTH, 140);

  // AVENIDA VERTICAL DE ASFALTO (Cruce)
  drawAsphaltRoad(940, 0, 140, WORLD_HEIGHT);

  // ACERAS DE BALDOSAS CUADRADAS CON BORDILLO (Como en el tileset)
  drawSidewalk(0, 640, WORLD_WIDTH, 60);         // Acera Norte
  drawSidewalk(0, 840, WORLD_WIDTH, 60);         // Acera Sur
  drawSidewalk(880, 0, 60, WORLD_HEIGHT);        // Acera Oeste
  drawSidewalk(1080, 0, 60, WORLD_HEIGHT);       // Acera Este

  // PLAZA CENTRAL DE CONCRETO CON GRIETAS (Exacto a la imagen del usuario)
  drawCrackedConcretePlaza(1140, 500, 240, 200);

  // Bordes de tierra entre acera y césped
  ctx.fillStyle = '#9e6c38';
  ctx.fillRect(0, 636, WORLD_WIDTH, 4);
  ctx.fillRect(0, 900, WORLD_WIDTH, 4);
}

// Carretera de Asfalto con líneas dobles amarillas y línea blanca discontinua
function drawAsphaltRoad(x, y, w, h) {
  // Asfalto gris oscuro
  ctx.fillStyle = '#2b2d35';
  ctx.fillRect(x, y, w, h);

  if (w > h) {
    // Horizontal
    // Líneas dobles amarillas en los extremos (como en la foto)
    ctx.fillStyle = '#eab308';
    ctx.fillRect(x, y + 6, w, 2); ctx.fillRect(x, y + 10, w, 2);
    ctx.fillRect(x, y + h - 12, w, 2); ctx.fillRect(x, y + h - 8, w, 2);

    // Línea blanca discontinua en el centro
    ctx.fillStyle = '#f8fafc';
    for (let px = x + 10; px < x + w; px += 36) {
      ctx.fillRect(px, y + h / 2 - 2, 20, 4);
    }
  } else {
    // Vertical
    ctx.fillStyle = '#eab308';
    ctx.fillRect(x + 6, y, 2, h); ctx.fillRect(x + 10, y, 2, h);
    ctx.fillRect(x + w - 12, y, 2, h); ctx.fillRect(x + w - 8, y, 2, h);

    ctx.fillStyle = '#f8fafc';
    for (let py = y + 10; py < y + h; py += 36) {
      ctx.fillRect(x + w / 2 - 2, py, 4, 20);
    }
  }
}

// Acera con baldosas cuadradas beige-gris y bordillo (Tileset de la imagen)
function drawSidewalk(x, y, w, h) {
  ctx.fillStyle = '#beb5a8';
  ctx.fillRect(x, y, w, h);

  // Cuadrícula de baldosas
  ctx.strokeStyle = '#9c9285';
  ctx.lineWidth = 1;
  for (let px = x; px <= x + w; px += 16) {
    ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke();
  }
  for (let py = y; py <= y + h; py += 16) {
    ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + w, py); ctx.stroke();
  }

  // Bordillo exterior
  ctx.fillStyle = '#6e675b';
  if (w > h) {
    ctx.fillRect(x, y + h - 4, w, 4);
  } else {
    ctx.fillRect(x + w - 4, y, 4, h);
  }
}

// Losas de Concreto Grandes con Grietas Finas (Tileset esquina superior izquierda)
function drawCrackedConcretePlaza(x, y, w, h) {
  ctx.fillStyle = '#a89f91';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#736b5e';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  // Líneas divisorias de losas
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();

  // Grietas realistas dibujadas como en el tileset
  ctx.strokeStyle = '#5a5347';
  ctx.lineWidth = 1;
  ctx.beginPath();
  // Grieta losa 1
  ctx.moveTo(x + 20, y + 10); ctx.lineTo(x + 40, y + 30); ctx.lineTo(x + 35, y + 50); ctx.lineTo(x + 55, y + 70);
  // Grieta losa 2
  ctx.moveTo(x + w - 30, y + 20); ctx.lineTo(x + w - 50, y + 45); ctx.lineTo(x + w - 40, y + 80);
  // Grieta losa 3
  ctx.moveTo(x + 45, y + h - 20); ctx.lineTo(x + 60, y + h - 45); ctx.lineTo(x + 85, y + h - 60);
  ctx.stroke();
}

// ==========================================
// PROPS URBANOS FIELMENTE DIBUJADOS DEL TILESET
// ==========================================
function drawUrbanProps() {
  // 1. BANCO DE MADERA DEL PARQUE (Tileset medio)
  drawParkBench(870, 650);
  drawParkBench(1160, 650);

  // 2. PARADA DE AUTOBÚS MODERNA (Tileset medio)
  drawBusStop(1020, 636);

  // 3. BOCA DE INCENDIOS ROJA (Hydrant)
  drawFireHydrant(930, 672);

  // 4. PAPELERA METÁLICA DE CALLE
  drawTrashCan(950, 668);

  // 5. FAROLA DE HIERRO FORJADO VICTORIANA (Luz cálida como la imagen)
  drawVictorianStreetLamp(970, 642);
  drawVictorianStreetLamp(1280, 642);

  // 6. SEÑAL ROJA OCTAGONAL "PARE" (STOP)
  drawStopSign(890, 676);

  // 7. SEÑAL AZUL PASO PEATONAL
  drawPedestrianSign(1120, 676);

  // 8. JARDINERA DE LADRILLOS CON ARBUSTOS (Planter box)
  drawBrickPlanterBox(1180, 666);

  // 9. BOLSAS DE BASURA NEGRAS Y CAJAS DE CARTÓN
  drawTrashBagsAndBoxes(850, 668);

  // 10. ZONA DEPORTIVA: Pelota ⚽ y Perrito Toby 🐶
  drawSoccerBall();
  drawPixelDog(puppy.x, puppy.y);

  // Monedas
  streetCoins.forEach(coin => {
    if (!coin.collected) {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(coin.x - 5, coin.y - 5, 10, 10);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(coin.x - 3, coin.y - 3, 6, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(coin.x - 1, coin.y - 1, 2, 2);
    }
  });
}

// Banco de madera
function drawParkBench(x, y) {
  ctx.fillStyle = '#6b3b24'; // madera
  ctx.fillRect(x, y, 42, 6); // respaldo
  ctx.fillRect(x, y + 8, 42, 6); // asiento
  ctx.fillStyle = '#1e293b'; // patas metal
  ctx.fillRect(x + 4, y + 14, 3, 6); ctx.fillRect(x + 35, y + 14, 3, 6);
}

// Parada de autobús con panel de vidrio
function drawBusStop(x, y) {
  // Techo azul
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(x, y, 64, 5);
  // Panel de cristal trasero
  ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.fillRect(x + 2, y + 5, 60, 24);
  // Marco y postes
  ctx.fillStyle = '#334155';
  ctx.fillRect(x, y + 5, 3, 26); ctx.fillRect(x + 61, y + 5, 3, 26);
  // Horario / póster en el panel
  ctx.fillStyle = '#facc15';
  ctx.fillRect(x + 44, y + 8, 12, 16);
  // Banquito interior
  ctx.fillStyle = '#854d0e';
  ctx.fillRect(x + 10, y + 22, 32, 4);
}

// Boca de incendios roja
function drawFireHydrant(x, y) {
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(x, y + 4, 10, 14);
  ctx.fillRect(x - 2, y + 8, 14, 4);
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(x + 2, y + 1, 6, 3);
}

// Papelera metálica
function drawTrashCan(x, y) {
  ctx.fillStyle = '#64748b';
  ctx.fillRect(x, y + 2, 12, 14);
  ctx.fillStyle = '#475569';
  ctx.fillRect(x - 1, y, 14, 3);
  // Ranuras verticales
  ctx.fillStyle = '#334155';
  ctx.fillRect(x + 3, y + 4, 2, 10); ctx.fillRect(x + 7, y + 4, 2, 10);
}

// Farola de hierro victoriana con luz cálida (exacta al tileset)
function drawVictorianStreetLamp(x, y) {
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x, y, 4, 38); // poste
  ctx.fillRect(x - 3, y + 36, 10, 3); // base
  // Brazo curvado
  ctx.fillRect(x - 6, y + 4, 6, 3);

  // Linterna con halo cálido
  ctx.fillStyle = 'rgba(253, 224, 71, 0.3)';
  ctx.beginPath(); ctx.arc(x - 6, y + 8, 16, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#fde047';
  ctx.fillRect(x - 8, y + 6, 6, 7);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x - 9, y + 4, 8, 2);
}

// Señal roja octagonal "PARE" (STOP)
function drawStopSign(x, y) {
  ctx.fillStyle = '#64748b';
  ctx.fillRect(x + 5, y + 12, 2, 22); // poste

  // Octágono rojo
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(x, y + 2, 12, 8);
  ctx.fillRect(x + 2, y, 8, 12);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 4px sans-serif';
  ctx.fillText('PARE', x + 1, y + 8);
}

// Señal azul peatonal
function drawPedestrianSign(x, y) {
  ctx.fillStyle = '#64748b';
  ctx.fillRect(x + 5, y + 12, 2, 22);

  ctx.fillStyle = '#2563eb';
  ctx.fillRect(x, y, 12, 12);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 1, y + 1, 10, 10);
  ctx.fillStyle = '#2563eb';
  ctx.fillText('🚸', x + 1, y + 9);
}

// Jardinera de ladrillos rojos con arbustos
function drawBrickPlanterBox(x, y) {
  ctx.fillStyle = '#991b1b'; // ladrillo
  ctx.fillRect(x, y + 8, 38, 8);
  // Arbustos verdes frondosos
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.arc(x + 8, y + 6, 7, 0, Math.PI * 2);
  ctx.arc(x + 19, y + 5, 8, 0, Math.PI * 2);
  ctx.arc(x + 30, y + 6, 7, 0, Math.PI * 2);
  ctx.fill();
}

// Bolsas de basura y cajas de cartón
function drawTrashBagsAndBoxes(x, y) {
  // Bolsa negra
  ctx.fillStyle = '#0f172a';
  ctx.beginPath(); ctx.arc(x + 6, y + 8, 6, 0, Math.PI * 2); ctx.fill();
  // Caja de cartón marrón
  ctx.fillStyle = '#92400e';
  ctx.fillRect(x + 12, y + 4, 10, 10);
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x + 14, y + 4, 2, 10); // cinta
}

function drawSoccerBall() {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(soccerBall.x, soccerBall.y, soccerBall.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#0f172a'; ctx.font = '9px sans-serif';
  ctx.fillText('⚽', soccerBall.x - 5, soccerBall.y + 4);
}

function drawPixelDog(x, y) {
  ctx.fillStyle = '#b45309'; ctx.fillRect(x - 7, y - 4, 14, 9);
  ctx.fillRect(x + 3, y - 10, 7, 7);
  ctx.fillStyle = '#78350f'; ctx.fillRect(x + 1, y - 12, 3, 4);
  ctx.fillStyle = '#0f172a'; ctx.fillRect(x + 7, y - 8, 2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 7px "Press Start 2P"';
  ctx.fillText('🐶 Toby', x - 14, y - 16);
}

// DIBUJAR JUGADOR CON EL SPRITE SHEET OFICIAL
function drawPlayer(p, sId, isSelf = false) {
  const x = Math.round(p.x);
  const y = Math.round(p.y);
  const dir = p.direction || 'down';

  let frame = 0;
  if (p.isMoving) {
    const cycle = Math.floor(stepAnim) % 4;
    if (cycle === 1) frame = 1;
    else if (cycle === 3) frame = 2;
  }

  const sprite = getCharacterSprite(p.id, dir, frame);
  ctx.drawImage(sprite, x - 9, y - 28);

  // Etiqueta con Nombre
  ctx.font = 'bold 7px "Press Start 2P"';
  ctx.textAlign = 'center';
  const tagW = ctx.measureText(p.name).width + 8;

  ctx.fillStyle = isSelf ? 'rgba(22, 101, 52, 0.9)' : 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(x - tagW / 2, y - 36, tagW, 11);
  ctx.strokeStyle = isSelf ? '#86efac' : '#38bdf8';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - tagW / 2, y - 36, tagW, 11);

  ctx.fillStyle = '#ffffff';
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

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(bx - tw / 2, by - 12, tw, 16);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx - tw / 2, by - 12, tw, 16);

      ctx.fillStyle = '#f8fafc';
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
