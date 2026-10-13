// ==========================================
// EL BARRIO AZ - MOTOR PIXEL ART JRPG
// Estilo visual inspirado en clásicos RPG de 16/32 bits
// ==========================================

const socket = io({
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 25
});

// Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// DOM Elements
const modalSelect = document.getElementById('character-select-modal');
const gameContainer = document.getElementById('game-container');
const btnStart = document.getElementById('btn-start-game');
const heroCards = document.querySelectorAll('.hero-card');
const playerCoinsVal = document.getElementById('player-coins-val');
const familyVaultVal = document.getElementById('family-vault-val');
const locationBadge = document.getElementById('location-badge');
const alertBanner = document.getElementById('alert-banner');
const alertText = document.getElementById('alert-text');
const btnActionMain = document.getElementById('btn-action-main');
const actionBtnEmoji = document.getElementById('action-btn-emoji');
const actionBtnLabel = document.getElementById('action-btn-label');
const btnFunSound = document.getElementById('btn-fun-sound');
const btnAudioToggle = document.getElementById('btn-audio-toggle');
const btnFullscreen = document.getElementById('btn-fullscreen');
const houseShopModal = document.getElementById('house-shop-modal');
const btnOpenHouseShop = document.getElementById('btn-open-house-shop');
const btnCloseShop = document.getElementById('btn-close-shop');

// Joystick
const joystickArea = document.getElementById('joystick-area');
const joystickRing = document.getElementById('joystick-ring');
const joystickKnob = document.getElementById('joystick-knob');

// ==========================================
// DIMENSIONES DEL GRAN BARRIO (2200 x 1600)
// ==========================================
const WORLD_WIDTH = 2200;
const WORLD_HEIGHT = 1600;
const camera = { x: 0, y: 0 };

let selectedCharId = 'diegoaz_jr';
let myPlayer = null;
const otherPlayers = {};
let familyVaultCoins = 500;
let activeBubbles = {};
let particles = [];
let smokeParticles = [];
let gameTime = 0;

// Objetos interactivos
const soccerBall = { x: 550, y: 1250, vx: 0, vy: 0, radius: 12 };
const puppy = { x: 620, y: 1180, following: null, animStep: 0 };
let streetCoins = [
  { x: 1040, y: 720, collected: false },
  { x: 1160, y: 720, collected: false },
  { x: 1100, y: 550, collected: false },
  { x: 1100, y: 920, collected: false },
  { x: 1450, y: 720, collected: false },
  { x: 780, y: 720, collected: false },
  { x: 600, y: 1200, collected: false }
];

// ==========================================
// SISTEMA DE AUDIO SINTETIZADO RETRO
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
// DIBUJAR RETRATOS PIXEL ART EN EL MENÚ
// ==========================================
function drawPortrait(canvasId, charType) {
  const c = document.getElementById(canvasId);
  if (!c) return;
  const pctx = c.getContext('2d');
  pctx.imageSmoothingEnabled = false;
  pctx.clearRect(0, 0, 64, 64);

  // Fondo cálido pergamino
  pctx.fillStyle = '#2d1e15';
  pctx.fillRect(0, 0, 64, 64);

  if (charType === 'diegoaz') {
    // Papá (Barba, cabello castaño, túnica azul oscura con cuello cuero)
    pctx.fillStyle = '#1e3a8a'; pctx.fillRect(14, 44, 36, 20); // hombros
    pctx.fillStyle = '#78350f'; pctx.fillRect(26, 42, 12, 6);  // cuello
    pctx.fillStyle = '#fed7aa'; pctx.fillRect(20, 18, 24, 24); // cara
    pctx.fillStyle = '#451a03'; pctx.fillRect(18, 12, 28, 12); // pelo
    pctx.fillStyle = '#451a03'; pctx.fillRect(18, 32, 28, 12); // barba elegante
    pctx.fillStyle = '#fed7aa'; pctx.fillRect(26, 34, 12, 4);  // labio
    pctx.fillStyle = '#0f172a'; pctx.fillRect(24, 24, 4, 4);   pctx.fillRect(36, 24, 4, 4); // ojos
  } else if (charType === 'vicky') {
    // Vicky (Cabello largo castaño claro, cinta verde, vestido rosa con lazo)
    pctx.fillStyle = '#ca8a04'; pctx.fillRect(14, 14, 36, 40); // pelo largo
    pctx.fillStyle = '#ec4899'; pctx.fillRect(16, 44, 32, 20); // vestido
    pctx.fillStyle = '#fed7aa'; pctx.fillRect(20, 18, 24, 22); // cara
    pctx.fillStyle = '#16a34a'; pctx.fillRect(18, 14, 28, 4);  // cinta de pelo
    pctx.fillStyle = '#fde047'; pctx.fillRect(38, 12, 6, 6);   // flor
    pctx.fillStyle = '#0f172a'; pctx.fillRect(24, 26, 4, 4);   pctx.fillRect(36, 26, 4, 4); // ojos
    pctx.fillStyle = '#f43f5e'; pctx.fillRect(28, 34, 8, 3);   // sonrisa
  } else if (charType === 'junior') {
    // Junior (Gorra azul hacia atrás, pelo castaño, sudadera naranja, ojos grandes)
    pctx.fillStyle = '#ea580c'; pctx.fillRect(16, 46, 32, 18); // sudadera
    pctx.fillStyle = '#fed7aa'; pctx.fillRect(20, 22, 24, 22); // cara
    pctx.fillStyle = '#2563eb'; pctx.fillRect(16, 14, 32, 10); // gorra
    pctx.fillStyle = '#1d4ed8'; pctx.fillRect(12, 18, 10, 6);  // visera hacia atrás
    pctx.fillStyle = '#451a03'; pctx.fillRect(20, 20, 24, 4);  // flequillo
    pctx.fillStyle = '#0f172a'; pctx.fillRect(24, 28, 4, 5);   pctx.fillRect(36, 28, 4, 5); // ojos vivaces
    pctx.fillStyle = '#ffffff'; pctx.fillRect(25, 29, 2, 2);   pctx.fillRect(37, 29, 2, 2); // brillo
    pctx.fillStyle = '#f43f5e'; pctx.fillRect(28, 37, 8, 3);   // sonrisa alegre
  }
}

drawPortrait('portrait-diegoaz', 'diegoaz');
drawPortrait('portrait-vicky', 'vicky');
drawPortrait('portrait-junior', 'junior');

// Redimensionar pantalla completa
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
resizeCanvas();

// Selección de personajes
heroCards.forEach(card => {
  card.addEventListener('click', () => {
    initAudio();
    playSfx('kick');
    heroCards.forEach(c => c.classList.remove('active'));
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

  socket.emit('join_game', {
    characterId: selectedCharId,
    scene: 'calle'
  });
});

btnFullscreen.addEventListener('click', () => {
  playSfx('kick');
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

// ==========================================
// SOCKET.IO MULTIJUGADOR SINCRONIZADO
// ==========================================
socket.on('init_state', (data) => {
  myPlayer = data.self;
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
    showAlert(`👋 ¡${p.name} entró al barrio!`);
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
    showAlert(`🚪 ${otherPlayers[data.socketId].name} se desconectó.`);
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
  const maxR = 38;

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

btnFunSound.addEventListener('click', () => {
  playSfx('fanfare');
  spawnEmojiBubble(myPlayer ? myPlayer.x : 0, myPlayer ? myPlayer.y - 60 : 0, '🎺 ¡HOLA FAMILIA!');
});

document.querySelectorAll('.rpg-pill-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const snd = btn.getAttribute('data-sound');
    const msg = btn.getAttribute('data-msg');
    if (snd === 'dog') playSfx('bark');
    else if (snd === 'goal') playSfx('fanfare');
    else playSfx('coin');

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
// ACCIONES E INTERACCIÓN
// ==========================================
let currentInteractType = null;

function checkProximities() {
  if (!myPlayer) return;
  currentInteractType = null;

  // 1. Fuente Central (Plaza)
  const distFountain = Math.hypot(myPlayer.x - 1100, myPlayer.y - 750);
  if (distFountain < 85) {
    currentInteractType = 'fountain';
    setActionButton('⛲', 'DESEAR SUERTE');
    locationBadge.innerText = '🏛️ Plaza de la Fuente';
    return;
  }

  // 2. Posada / Casa Az (Noroeste)
  const distInn = Math.hypot(myPlayer.x - 620, myPlayer.y - 420);
  if (distInn < 90) {
    currentInteractType = 'inn';
    setActionButton('🏡', 'CASA FAMILIAR');
    locationBadge.innerText = '🏡 Gran Casa Az';
    return;
  }

  // 3. Mercado (Noreste)
  const distMarket = Math.hypot(myPlayer.x - 1580, myPlayer.y - 420);
  if (distMarket < 90) {
    currentInteractType = 'market';
    setActionButton('🍎', 'COMPRAR FRUTA');
    locationBadge.innerText = '🛒 Mercado del Barrio';
    return;
  }

  // 4. Herrería / Taller de Junior (Suroeste)
  const distSmith = Math.hypot(myPlayer.x - 620, myPlayer.y - 920);
  if (distSmith < 90) {
    currentInteractType = 'workshop';
    setActionButton('🔨', 'TALLER TECH');
    locationBadge.innerText = '🔨 Taller de Diego Jr.';
    return;
  }

  // 5. Parque y Cancha de Fútbol (Sur)
  const distPark = Math.hypot(myPlayer.x - 550, myPlayer.y - 1200);
  if (distPark < 160) {
    locationBadge.innerText = '⚽ Parque & Cancha';
  }

  // 6. Perrito Toby
  const distPuppy = Math.hypot(myPlayer.x - puppy.x, myPlayer.y - puppy.y);
  if (distPuppy < 65) {
    currentInteractType = 'puppy';
    setActionButton('🐶', 'ACARICIAR');
    return;
  }

  btnActionMain.classList.remove('pulse');
  actionBtnEmoji.innerText = '⚔️';
  actionBtnLabel.innerText = 'HABLAR';
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
    spawnEmojiBubble(myPlayer.x, myPlayer.y - 60, '✨ ¡Hola!');
    return;
  }

  if (currentInteractType === 'fountain') {
    playSfx('coin');
    spawnParticles(1100, 750, '💧');
    showAlert('⛲ ¡Tiraste una moneda a la fuente! +Suerte para la familia.');
  } else if (currentInteractType === 'inn') {
    playSfx('coin');
    showAlert('🏡 ¡Bienvenidos a la Gran Casa Az! Lugar de descanso.');
  } else if (currentInteractType === 'market') {
    playSfx('coin');
    showAlert('🍎 Doña Rosa: "¡Miren qué manzanas tan frescas para Vicky y Junior!"');
  } else if (currentInteractType === 'workshop') {
    playSfx('kick');
    showAlert('🔨 Don Pedro: "¡Diego Jr., tus inventos son los mejores del pueblo!"');
  } else if (currentInteractType === 'puppy') {
    playSfx('bark');
    puppy.following = socket.id;
    spawnParticles(puppy.x, puppy.y, '❤️');
    showAlert('🐶 ¡Toby mueve la cola y te sigue feliz!');
  }
}

function showAlert(text) {
  alertText.innerText = text;
  alertBanner.classList.remove('hidden');
  clearTimeout(showAlert.timer);
  showAlert.timer = setTimeout(() => {
    alertBanner.classList.add('hidden');
  }, 3500);
}

function spawnEmojiBubble(x, y, text) {
  activeBubbles[socket.id] = { text, time: Date.now() + 3800 };
}

function spawnParticles(x, y, char) {
  for (let i = 0; i < 7; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 30,
      y: y + (Math.random() - 0.5) * 30,
      vy: -1.8 - Math.random() * 2,
      char,
      life: 1.0
    });
  }
}

// ==========================================
// FÍSICA Y LOOP PRINCIPAL
// ==========================================
let lastMoveSent = 0;
let stepAnim = 0;

function update() {
  gameTime += 0.03;
  if (!myPlayer) return;

  let speed = 4.2;
  if (selectedCharId === 'diegoaz_jr') speed = 5.0; // Junior es ultra rápido

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

  const isMoving = Math.hypot(vx, vy) > 0.4;
  if (isMoving) {
    stepAnim += 0.28;
    myPlayer.x = Math.max(50, Math.min(WORLD_WIDTH - 50, myPlayer.x + vx));
    myPlayer.y = Math.max(50, Math.min(WORLD_HEIGHT - 50, myPlayer.y + vy));

    if (Math.abs(vx) > Math.abs(vy)) myPlayer.direction = vx > 0 ? 'right' : 'left';
    else myPlayer.direction = vy > 0 ? 'down' : 'up';
  }
  myPlayer.isMoving = isMoving;

  camera.x = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, myPlayer.x - canvas.width / 2));
  camera.y = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, myPlayer.y - canvas.height / 2));

  // Enviar multijugador
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
  if (distBall < 30) {
    const angle = Math.atan2(soccerBall.y - myPlayer.y, soccerBall.x - myPlayer.x);
    soccerBall.vx = Math.cos(angle) * 9.0;
    soccerBall.vy = Math.sin(angle) * 9.0;
    playSfx('kick');
    spawnParticles(soccerBall.x, soccerBall.y, '💨');
    socket.emit('kick_ball', soccerBall);
  }

  soccerBall.x += soccerBall.vx;
  soccerBall.y += soccerBall.vy;
  soccerBall.vx *= 0.94;
  soccerBall.vy *= 0.94;
  soccerBall.x = Math.max(400, Math.min(850, soccerBall.x));
  soccerBall.y = Math.max(1100, Math.min(1450, soccerBall.y));

  // Arco gol
  if (soccerBall.x > 580 && soccerBall.x < 660 && soccerBall.y < 1120) {
    playSfx('fanfare');
    showAlert('⚽ ¡GOOOOOOL EN EL PARQUE AZ!');
    spawnParticles(soccerBall.x, soccerBall.y, '⭐');
    soccerBall.y = 1250; soccerBall.vx = 0; soccerBall.vy = 0;
    socket.emit('kick_ball', soccerBall);
  }

  // Perrito Toby
  if (puppy.following === socket.id) {
    const distToPlayer = Math.hypot(myPlayer.x - puppy.x, myPlayer.y - puppy.y);
    if (distToPlayer > 50) {
      const pAngle = Math.atan2(myPlayer.y - puppy.y, myPlayer.x - puppy.x);
      puppy.x += Math.cos(pAngle) * 3.8;
      puppy.y += Math.sin(pAngle) * 3.8;
    }
  }

  // Monedas
  streetCoins.forEach(coin => {
    if (!coin.collected) {
      const distC = Math.hypot(myPlayer.x - coin.x, myPlayer.y - coin.y);
      if (distC < 30) {
        coin.collected = true;
        myPlayer.coins += 10;
        familyVaultCoins += 10;
        playerCoinsVal.innerText = myPlayer.coins;
        familyVaultVal.innerText = familyVaultCoins;
        playSfx('coin');
        spawnParticles(coin.x, coin.y, '🪙');
        showAlert('🪙 ¡10 Monedas de Oro encontradas!');
        setTimeout(() => { coin.collected = false; }, 18000);
      }
    }
  });

  // Humo de la chimenea
  if (Math.random() < 0.2) {
    smokeParticles.push({
      x: 520 + (Math.random() - 0.5) * 8,
      y: 330,
      radius: 4 + Math.random() * 4,
      alpha: 0.8,
      vy: -0.8 - Math.random() * 0.5
    });
  }
  for (let i = smokeParticles.length - 1; i >= 0; i--) {
    const s = smokeParticles[i];
    s.y += s.vy;
    s.radius += 0.15;
    s.alpha -= 0.012;
    if (s.alpha <= 0) smokeParticles.splice(i, 1);
  }

  // Partículas
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.y += p.vy;
    p.life -= 0.03;
    if (p.life <= 0) particles.splice(i, 1);
  }

  checkProximities();
}

// ==========================================
// RENDERIZADO PIXEL ART
// ==========================================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // 1. DIBUJAR EL GRAN BARRIO PIXEL ART (ESTILO EXACTO A LA IMAGEN)
  drawPixelTown();

  // 2. DIBUJAR JUGADORES REMOTOS
  for (const sId in otherPlayers) {
    drawPixelCharacter(otherPlayers[sId], sId);
  }

  // 3. DIBUJAR JUGADOR LOCAL
  if (myPlayer) {
    drawPixelCharacter(myPlayer, socket.id, true);
  }

  // 4. HUMO DE CHIMENEA Y PARTÍCULAS
  drawSmokeAndParticles();

  // 5. GLOBOS DE CHAT
  drawBubbles();

  ctx.restore();
}

// DIBUJO DETALLADO DEL PUEBLO (COBBLESTONE, FUENTE, TEJADOS, MERCADO)
function drawPixelTown() {
  // Fondo de césped verde exuberante
  ctx.fillStyle = '#4c6e33';
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Textura sutil de hierba
  ctx.fillStyle = '#42622c';
  for (let x = 0; x < WORLD_WIDTH; x += 32) {
    for (let y = 0; y < WORLD_HEIGHT; y += 32) {
      if ((x + y) % 64 === 0) {
        ctx.fillRect(x + 8, y + 8, 4, 4);
      }
    }
  }

  // CAMINOS DE ADOQUINES EMPEDRADOS (COBBLESTONE DE LA IMAGEN)
  drawCobblestoneRoad(980, 0, 240, WORLD_HEIGHT);     // Avenida Vertical Central
  drawCobblestoneRoad(0, 640, WORLD_WIDTH, 220);     // Avenida Horizontal Central
  drawCobblestoneCircle(1100, 750, 180);              // Plaza Redonda de la Fuente

  // LA GRAN FUENTE DE PIEDRA CON AGUA (CENTRO DE LA IMAGEN)
  drawStoneFountain(1100, 750);

  // EDIFICIO 1: LA GRAN POSADA / CASA FAMILIAR AZ (Noroeste)
  drawInnHouse(460, 310, 260, 200, 'INN CASA AZ');

  // EDIFICIO 2: EL PUESTO DE MERCADO CON TOLDO A RAYAS AZULES (Noreste - Como la imagen)
  drawMarketStall(1460, 340, 180, 120);

  // EDIFICIO 3: EL TALLER / HERRERÍA CON CHIMENEA (Suroeste - Como la imagen)
  drawBlacksmithShop(460, 840, 240, 180);

  // PUENTE DE MADERA SOBRE EL ESTANQUE (Sureste)
  drawWoodenBridge(1460, 850, 160, 100);

  // PARQUE FAMILIAR CON CANCHA DE FÚTBOL (Sur)
  drawSoccerPark(420, 1100, 480, 380);

  // CARTELES INDICADORES DE MADERA (Como el letrero de la imagen con flechas)
  drawSignpost(1260, 820);

  // BARRICAS, FAROLAS Y CAJAS DE FRUTAS
  drawStreetLantern(960, 520);
  drawStreetLantern(1240, 520);
  drawStreetLantern(960, 960);
  drawStreetLantern(1240, 960);

  drawWoodenBarrel(740, 500);
  drawWoodenBarrel(755, 510);
  drawWoodenBarrel(1430, 430);

  // Monedas doradas
  streetCoins.forEach(coin => {
    if (!coin.collected) {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(coin.x - 6, coin.y - 6, 12, 12);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(coin.x - 4, coin.y - 4, 8, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(coin.x - 2, coin.y - 2, 4, 4); // brillo
    }
  });

  // Perrito Toby
  drawPixelPuppy(puppy.x, puppy.y);

  // Árboles frondosos pixel art
  drawPixelTree(360, 240);
  drawPixelTree(760, 240);
  drawPixelTree(1360, 240);
  drawPixelTree(1700, 240);
  drawPixelTree(360, 780);
  drawPixelTree(1700, 780);
  drawPixelTree(960, 1300);
  drawPixelTree(1240, 1300);
}

// CAMINOS EMPEDRADOS ESTILO JRPG (COBBLESTONE)
function drawCobblestoneRoad(x, y, w, h) {
  ctx.fillStyle = '#948a78';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#5c5243';
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, w, h);

  // Textura de ladrillos / piedras
  ctx.fillStyle = '#aba18e';
  for (let px = x + 4; px < x + w - 16; px += 24) {
    for (let py = y + 4; py < y + h - 16; py += 16) {
      const offset = (Math.floor(py / 16) % 2 === 0) ? 0 : 12;
      ctx.fillRect(px + offset, py, 20, 12);
      ctx.fillStyle = '#7a705e';
      ctx.fillRect(px + offset, py + 11, 20, 2); // sombra ladrillo
      ctx.fillStyle = '#c7bda9';
      ctx.fillRect(px + offset, py, 20, 2);      // luz ladrillo
      ctx.fillStyle = '#aba18e';
    }
  }
}

function drawCobblestoneCircle(cx, cy, r) {
  ctx.fillStyle = '#948a78';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5c5243';
  ctx.lineWidth = 6;
  ctx.stroke();
}

// FUENTE DE PIEDRA CIRCULAR (IDÉNTICA A LA IMAGEN)
function drawStoneFountain(cx, cy) {
  // Borde exterior de piedra labrada
  ctx.fillStyle = '#78716c';
  ctx.beginPath();
  ctx.arc(cx, cy, 74, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#44403c';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Borde interior de piedra clara
  ctx.fillStyle = '#a8a29e';
  ctx.beginPath();
  ctx.arc(cx, cy, 64, 0, Math.PI * 2);
  ctx.fill();

  // Agua azul ondulante
  const wave = Math.sin(gameTime * 3) * 2;
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(cx, cy, 54 + wave, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(cx - 10, cy - 10, 38, 0, Math.PI * 2);
  ctx.fill();

  // Pedestal y estatua central
  ctx.fillStyle = '#78716c';
  ctx.fillRect(cx - 16, cy - 20, 32, 28);
  ctx.strokeStyle = '#292524';
  ctx.lineWidth = 3;
  ctx.strokeRect(cx - 16, cy - 20, 32, 28);

  // Escultura superior
  ctx.fillStyle = '#d6d3d1';
  ctx.beginPath();
  ctx.arc(cx, cy - 24, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

// CASA / POSADA CON TEJADO ROJO TEJAS (COMO LA IMAGEN)
function drawInnHouse(x, y, w, h, label) {
  // Fachada de madera clara y vigas
  ctx.fillStyle = '#e7d8bf';
  ctx.fillRect(x, y + 70, w, h - 70);
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y + 70, w, h - 70);

  // Vigas de madera verticales (Timber framing medieval)
  ctx.fillStyle = '#78350f';
  for (let bx = x + 30; bx < x + w; bx += 48) {
    ctx.fillRect(bx, y + 70, 8, h - 70);
  }

  // Tejado de tejas rojas triangulares
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(x - 14, y, w + 28, 70);
  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 5;
  ctx.strokeRect(x - 14, y, w + 28, 70);

  // Tejas sombreadas
  ctx.fillStyle = '#991b1b';
  for (let row = y + 10; row < y + 65; row += 14) {
    for (let col = x - 6; col < x + w + 16; col += 18) {
      ctx.fillRect(col, row, 16, 6);
    }
  }

  // Chimenea de piedra humeante
  ctx.fillStyle = '#57534e';
  ctx.fillRect(x + 40, y - 24, 28, 40);
  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 40, y - 24, 28, 40);

  // Puerta de madera con arco
  ctx.fillStyle = '#451a03';
  ctx.fillRect(x + w / 2 - 24, y + h - 60, 48, 60);
  ctx.fillStyle = '#fde047';
  ctx.fillRect(x + w / 2 + 12, y + h - 34, 4, 4); // perilla dorada

  // Farol colgante en la entrada (luz cálida ámbar como la imagen)
  drawGlowingLantern(x + w / 2 - 40, y + h - 45);

  // Rótulo / Letrero de madera colgante "INN"
  ctx.fillStyle = '#451a03';
  ctx.fillRect(x + w / 2 - 50, y + 44, 100, 24);
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + w / 2 - 50, y + 44, 100, 24);
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 9px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + 60);
  ctx.textAlign = 'start';
}

// PUESTO DE MERCADO CON TOLDO DE RAYAS AZUL Y BLANCO (EXACTO A LA IMAGEN)
function drawMarketStall(x, y, w, h) {
  // Mostrador de madera
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x, y + 45, w, h - 45);
  ctx.strokeStyle = '#291104';
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y + 45, w, h - 45);

  // Toldo a rayas azules y blancas (como en la foto de referencia)
  const stripeW = 20;
  for (let i = 0; i < w / stripeW; i++) {
    ctx.fillStyle = (i % 2 === 0) ? '#1d4ed8' : '#f8fafc';
    ctx.fillRect(x + i * stripeW, y, stripeW, 46);
  }
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, 46);

  // Cajas de fruta (manzanas rojas y lechugas verdes)
  ctx.fillStyle = '#b45309';
  ctx.fillRect(x + 14, y + 54, 38, 24); // caja manzanas
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(x + 18, y + 58, 10, 8);  ctx.fillRect(x + 34, y + 58, 10, 8); // manzanas

  ctx.fillStyle = '#b45309';
  ctx.fillRect(x + 64, y + 54, 38, 24); // caja verduras
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(x + 68, y + 58, 10, 8);  ctx.fillRect(x + 84, y + 58, 10, 8); // lechugas

  // Letrero "MERCADO"
  ctx.fillStyle = '#451a03';
  ctx.fillRect(x + w / 2 - 40, y + 84, 80, 20);
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 8px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('MERCADO', x + w / 2, y + 98);
  ctx.textAlign = 'start';
}

// HERRERÍA / TALLER DE JUNIOR
function drawBlacksmithShop(x, y, w, h) {
  ctx.fillStyle = '#78716c';
  ctx.fillRect(x, y + 60, w, h - 60);
  ctx.strokeStyle = '#292524';
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y + 60, w, h - 60);

  // Tejado de pizarra oscura
  ctx.fillStyle = '#334155';
  ctx.fillRect(x - 10, y, w + 20, 60);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  ctx.strokeRect(x - 10, y, w + 20, 60);

  // Yunque y rueda de madera afuera
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + w - 45, y + h - 35, 26, 20);
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px monospace';
  ctx.fillText('🔨', x + w - 42, y + h - 18);

  // Letrero
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + 20, y + 75, 120, 22);
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 8px "Press Start 2P"';
  ctx.fillText('TALLER TECH', x + 28, y + 90);
}

// PUENTE DE MADERA
function drawWoodenBridge(x, y, w, h) {
  // Agua debajo
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(x - 10, y + 10, w + 20, h - 20);

  // Tablones de madera
  ctx.fillStyle = '#78350f';
  for (let px = x; px < x + w; px += 18) {
    ctx.fillRect(px, y, 14, h);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(px, y + h - 6, 14, 6);
    ctx.fillStyle = '#78350f';
  }
}

// PARQUE Y CANCHA DE FÚTBOL
function drawSoccerPark(x, y, w, h) {
  ctx.fillStyle = '#15803d';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#14532d';
  ctx.lineWidth = 6;
  ctx.strokeRect(x, y, w, h);

  // Líneas blancas de fútbol
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 40, y + 40, w - 80, h - 80);
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2, 40, 0, Math.PI * 2);
  ctx.stroke();

  // Arco norte
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(580, 1100, 80, 14);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 9px "Press Start 2P"';
  ctx.fillText('ARCO', 596, 1112);

  // Pelota ⚽
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(soccerBall.x, soccerBall.y, soccerBall.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#0f172a';
  ctx.font = '12px sans-serif';
  ctx.fillText('⚽', soccerBall.x - 7, soccerBall.y + 5);
}

// LETRERO CON FLECHAS DE MADERA (IDÉNTICO AL DE LA IMAGEN)
function drawSignpost(x, y) {
  // Poste de madera
  ctx.fillStyle = '#451a03';
  ctx.fillRect(x + 8, y, 10, 70);

  // Flecha 1: Mercado ->
  drawWoodArrow(x - 20, y + 8, 80, 18, 'Mercado →');
  // Flecha 2: Taller ->
  drawWoodArrow(x - 20, y + 28, 80, 18, 'Taller →');
  // Flecha 3: <- Plaza
  drawWoodArrow(x - 26, y + 48, 86, 18, '← Plaza');
}

function drawWoodArrow(x, y, w, h, text) {
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#291104';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 7px "Press Start 2P"';
  ctx.fillText(text, x + 6, y + 13);
}

// FAROLA CON LUZ CÁLIDA (COMO LA IMAGEN)
function drawStreetLantern(x, y) {
  // Poste
  ctx.fillStyle = '#292524';
  ctx.fillRect(x - 3, y, 6, 42);
  // Soporte
  ctx.fillRect(x - 8, y, 16, 4);

  // Halo cálido amarillo
  ctx.fillStyle = 'rgba(253, 224, 71, 0.25)';
  ctx.beginPath();
  ctx.arc(x, y - 6, 22, 0, Math.PI * 2);
  ctx.fill();

  // Foco
  ctx.fillStyle = '#fde047';
  ctx.fillRect(x - 5, y - 10, 10, 10);
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 5, y - 10, 10, 10);
}

function drawGlowingLantern(x, y) {
  ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#facc15';
  ctx.fillRect(x - 4, y - 6, 8, 10);
}

function drawWoodenBarrel(x, y) {
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x, y, 20, 26);
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, 20, 26);
  ctx.fillStyle = '#475569';
  ctx.fillRect(x, y + 4, 20, 3); // aro metal
  ctx.fillRect(x, y + 18, 20, 3);
}

function drawPixelTree(x, y) {
  // Tronco
  ctx.fillStyle = '#5c3317';
  ctx.fillRect(x - 8, y + 20, 16, 30);
  // Follaje pixelado en capas con sombra y luz
  ctx.fillStyle = '#166534';
  ctx.beginPath(); ctx.arc(x, y, 36, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#15803d';
  ctx.beginPath(); ctx.arc(x - 6, y - 6, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#22c55e';
  ctx.beginPath(); ctx.arc(x - 12, y - 12, 18, 0, Math.PI * 2); ctx.fill();
}

function drawPixelPuppy(x, y) {
  ctx.fillStyle = '#b45309';
  ctx.fillRect(x - 10, y - 6, 20, 12); // cuerpo
  ctx.fillRect(x + 4, y - 14, 10, 10); // cabeza
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x + 2, y - 16, 4, 6);   // oreja
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + 10, y - 11, 2, 2);  // ojo
  // Patitas
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x - 8, y + 6, 4, 6);
  ctx.fillRect(x + 4, y + 6, 4, 6);
  // Letrero Toby
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px "Press Start 2P"';
  ctx.fillText('🐶 Toby', x - 18, y - 20);
}

// ==========================================
// DIBUJO DE LOS PERSONAJES PIXEL ART AUTÉNTICOS
// (Como el héroe de espaldas/frente en la imagen)
// ==========================================
function drawPixelCharacter(p, sId, isSelf = false) {
  const x = p.x;
  const y = p.y;
  const step = p.isMoving ? Math.sin(stepAnim) * 2.5 : 0;
  const dir = p.direction || 'down';

  // Sombra elíptica en los pies
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + 16, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (p.id === 'diegoaz') {
    // ------------------------------------
    // PAPÁ DIEGOAZ (Estilo Guerrero / Noble)
    // Túnica roja/azul, cinturón, capa, botas
    // ------------------------------------
    // Piernas / Botas
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 6, y + 4 + step, 5, 12);
    ctx.fillRect(x + 2, y + 4 - step, 5, 12);
    ctx.fillStyle = '#78350f'; // botas cuero
    ctx.fillRect(x - 6, y + 10 + step, 5, 6);
    ctx.fillRect(x + 2, y + 10 - step, 5, 6);

    // Túnica (Azul profundo con bordes dorados)
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(x - 10, y - 12, 20, 18);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(x - 10, y + 2, 20, 3); // cinturón hebilla dorada

    // Capa en la espalda
    if (dir === 'up') {
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(x - 9, y - 10, 18, 16);
    }

    // Cabeza / Piel
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x - 7, y - 26, 14, 14);

    // Cabello y Barba castaño oscuro
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x - 8, y - 29, 16, 6); // pelo superior
    if (dir === 'down') {
      ctx.fillRect(x - 7, y - 17, 14, 6); // barba elegante frontal
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x - 4, y - 22, 2, 3); ctx.fillRect(x + 2, y - 22, 2, 3); // ojos
    } else if (dir === 'left') {
      ctx.fillRect(x - 8, y - 29, 6, 16);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(x - 6, y - 22, 2, 3);
    } else if (dir === 'right') {
      ctx.fillRect(x + 2, y - 29, 6, 16);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(x + 4, y - 22, 2, 3);
    }

  } else if (p.id === 'vicky_vicky') {
    // ------------------------------------
    // VICKY VICKY (10 AÑOS - Aventurera / Doncella)
    // Cabello largo, cinta verde, vestido rosa y delantal blanco
    // ------------------------------------
    // Cabello largo cayendo en la espalda
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(x - 9, y - 26, 18, 22);

    // Piernas
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x - 5, y + 4 + step, 4, 10);
    ctx.fillRect(x + 1, y + 4 - step, 4, 10);

    // Vestido Rosa con delantal blanco
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(x - 8, y - 10, 16, 16);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x - 4, y - 6, 8, 12); // delantal

    // Cabeza
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x - 6, y - 24, 12, 13);

    // Cinta verde y flor en el pelo
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(x - 7, y - 26, 14, 3);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(x + 5, y - 28, 4, 4); // flor amarilla

    if (dir === 'down') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x - 4, y - 20, 2, 3); ctx.fillRect(x + 2, y - 20, 2, 3);
    }

  } else {
    // ------------------------------------
    // DIEGOAZ JR. (4 AÑOS - Pequeño Chibi Veloz)
    // Gorra azul hacia atrás, sudadera naranja, zapatillas
    // ------------------------------------
    // Piernas más cortas
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(x - 5, y + 2 + step, 4, 8);
    ctx.fillRect(x + 1, y + 2 - step, 4, 8);
    ctx.fillStyle = '#dc2626'; // zapatillas rojas
    ctx.fillRect(x - 5, y + 7 + step, 4, 4);
    ctx.fillRect(x + 1, y + 7 - step, 4, 4);

    // Sudadera Naranja
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(x - 7, y - 9, 14, 12);

    // Cabeza Chibi
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x - 6, y - 22, 12, 13);

    // Gorra azul hacia atrás
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(x - 7, y - 26, 14, 6);
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(x - 9, y - 23, 4, 3); // visera atrás

    if (dir === 'down') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x - 4, y - 18, 2, 3); ctx.fillRect(x + 2, y - 18, 2, 3);
    }
  }

  // ETIQUETA DE NOMBRE CON ESTILO RPG RETRO
  ctx.font = 'bold 8px "Press Start 2P"';
  ctx.textAlign = 'center';
  const tagW = ctx.measureText(p.name).width + 12;

  ctx.fillStyle = isSelf ? '#166534' : '#271a12';
  ctx.fillRect(x - tagW / 2, y - 44, tagW, 14);
  ctx.strokeStyle = isSelf ? '#86efac' : '#eab308';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - tagW / 2, y - 44, tagW, 14);

  ctx.fillStyle = '#fef08a';
  ctx.fillText(p.name, x, y - 34);
  ctx.textAlign = 'start';
}

function drawSmokeAndParticles() {
  smokeParticles.forEach(s => {
    ctx.fillStyle = `rgba(226, 232, 240, ${s.alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  particles.forEach(p => {
    ctx.font = '14px sans-serif';
    ctx.fillText(p.char, p.x, p.y);
  });
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
      const by = p.y - 56;
      ctx.font = 'bold 8px "Press Start 2P"';
      ctx.textAlign = 'center';
      const tw = ctx.measureText(b.text).width + 16;

      ctx.fillStyle = '#271a12';
      ctx.fillRect(bx - tw / 2, by - 14, tw, 20);
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx - tw / 2, by - 14, tw, 20);

      ctx.fillStyle = '#fef08a';
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
