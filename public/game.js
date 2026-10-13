// ==========================================
// EL BARRIO AZ - JUEGO FAMILIAR INTERACTIVO
// Diseñado para Diego Jr. (4), Vicky (10) y Papá (46)
// ==========================================

const socket = io();

// Canvas y Contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Elementos DOM
const modalSelect = document.getElementById('character-select-modal');
const gameContainer = document.getElementById('game-container');
const btnStart = document.getElementById('btn-start-game');
const familyCards = document.querySelectorAll('.family-card');
const playerCoinsVal = document.getElementById('player-coins-val');
const familyVaultVal = document.getElementById('family-vault-val');
const locationBadge = document.getElementById('location-badge');
const alertBanner = document.getElementById('alert-banner');
const alertIcon = document.getElementById('alert-icon');
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

// Joystick DOM
const joystickArea = document.getElementById('joystick-area');
const joystickRing = document.getElementById('joystick-ring');
const joystickKnob = document.getElementById('joystick-knob');

// ==========================================
// GENERADOR DE SONIDOS (SINTETIZADOR WEB AUDIO)
// Funciona al 100% en celular y PC sin descargar archivos
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
      // Chime brillante doble
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987, now);
      osc.frequency.setValueAtTime(1318, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'kick') {
      // Golpe sordo de pelota
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'bark') {
      // Ladrido alegre
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.06);
      osc.frequency.linearRampToValueAtTime(350, now + 0.14);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'door') {
      // Entrada o salida
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'honk') {
      // Bocina divertida pip-pip
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'fanfare') {
      // Celebración
      [523, 659, 783, 1046].forEach((f, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(f, now + idx * 0.09);
        g.gain.setValueAtTime(0.2, now + idx * 0.09);
        g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.09 + 0.25);
        o.start(now + idx * 0.09);
        o.stop(now + idx * 0.09 + 0.25);
      });
    }
  } catch (e) {}
}

btnAudioToggle.addEventListener('click', () => {
  audioEnabled = !audioEnabled;
  btnAudioToggle.innerText = audioEnabled ? '🔊' : '🔇';
});

// ==========================================
// ESTADO Y ESCENAS DEL JUEGO
// ==========================================
let currentScene = 'calle'; // 'calle' o 'casa'

// Dimensiones de los mundos
const WORLDS = {
  calle: { width: 1500, height: 1000 },
  casa: { width: 900, height: 650 }
};

const camera = { x: 0, y: 0 };
let selectedCharId = 'diegoaz_jr';
let myPlayer = null;
let otherPlayers = {};
let familyVaultCoins = 500;
let activeBubbles = {};
let particles = [];

// Mejoras compradas de la casa
const houseUpgrades = {
  tv: false,
  pool: false,
  car: false,
  pizza_oven: false
};

// OBJETOS VIVOS EN LA CALLE
// 1. Pelota de fútbol ⚽
const soccerBall = {
  x: 650,
  y: 780,
  vx: 0,
  vy: 0,
  radius: 14
};

// 2. Perrito "Toby" 🐶
const puppy = {
  x: 740,
  y: 720,
  following: null, // socketId
  animTimer: 0,
  barkTimer: 0
};

// 3. Monedas flotantes coleccionables en el suelo 🪙
let streetCoins = [
  { x: 300, y: 380, collected: false },
  { x: 450, y: 380, collected: false },
  { x: 600, y: 380, collected: false },
  { x: 800, y: 380, collected: false },
  { x: 1050, y: 380, collected: false },
  { x: 600, y: 680, collected: false },
  { x: 750, y: 850, collected: false },
  { x: 220, y: 720, collected: false }
];

// 4. Auto amarillo que pasa por la calle 🚗
const streetCar = {
  x: -120,
  y: 480,
  speed: 2.8,
  honkTimer: 0
};

// 5. Cajas de Pizza en la pizzería 🍕
let hasPizzaBox = false;

// INTERACTIVIDADES DE LA CASA INTERIOR
let isSittingOnSofa = false;
let isTvTurnedOn = false;

// ==========================================
// REDIMENSIÓN FULLSCREEN
// ==========================================
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
resizeCanvas();

// ==========================================
// SELECCIÓN DE PERSONAJE
// ==========================================
familyCards.forEach(card => {
  card.addEventListener('click', () => {
    initAudio();
    playSfx('kick');
    familyCards.forEach(c => c.classList.remove('active'));
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

  socket.emit('join_game', { characterId: selectedCharId });
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
// JOYSTICK TÁCTIL SUAVE (PARA NIÑO DE 4 AÑOS)
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
  const maxR = 40;

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

// Teclado PC
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

// Botón de Ruido Divertido (Bocina / Celebración)
btnFunSound.addEventListener('click', () => {
  playSfx('honk');
  spawnEmojiBubble(myPlayer ? myPlayer.x : 0, myPlayer ? myPlayer.y - 50 : 0, '📢 ¡PIII-PIII!');
});

// Reacciones Rápidas Inferiores
document.querySelectorAll('.react-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const snd = btn.getAttribute('data-sound');
    const msg = btn.getAttribute('data-msg');
    if (snd === 'dog') playSfx('bark');
    else if (snd === 'goal') playSfx('fanfare');
    else playSfx('coin');

    if (myPlayer) {
      socket.emit('send_chat', msg);
    }
  });
});

// Tienda de la Casa
btnOpenHouseShop.addEventListener('click', () => {
  playSfx('door');
  houseShopModal.classList.remove('hidden');
});
btnCloseShop.addEventListener('click', () => {
  houseShopModal.classList.add('hidden');
});

// Comprar Mejoras en la Tienda
document.querySelectorAll('.btn-buy').forEach(b => {
  b.addEventListener('click', () => {
    const parent = b.closest('.shop-item');
    const item = parent.getAttribute('data-item');
    const cost = parseInt(parent.getAttribute('data-cost'));

    if (familyVaultCoins >= cost && !houseUpgrades[item]) {
      familyVaultCoins -= cost;
      houseUpgrades[item] = true;
      familyVaultVal.innerText = familyVaultCoins;
      b.classList.add('bought');
      b.innerText = '¡Comprado!';
      playSfx('fanfare');
      showAlert(`🎉 ¡La familia compró: ${parent.querySelector('h4').innerText}!`);
    } else if (houseUpgrades[item]) {
      showAlert('⭐ ¡Ya tienen este objeto en la casa!');
    } else {
      playSfx('kick');
      showAlert('🪙 ¡Necesitamos más monedas en el banco familiar!');
    }
  });
});

// ==========================================
// SOCKET.IO SINCRONIZACIÓN
// ==========================================
socket.on('init_state', (data) => {
  myPlayer = data.self;
  myPlayer.scene = 'calle';
  otherPlayers = {};
  for (const sId in data.players) {
    if (sId !== socket.id) otherPlayers[sId] = data.players[sId];
  }
  playerCoinsVal.innerText = myPlayer.coins;
  familyVaultVal.innerText = familyVaultCoins;
  showAlert(`¡Hola ${myPlayer.name}! Bienvenidos al Barrio.`);
});

socket.on('player_joined', (p) => {
  if (p.socketId !== socket.id) {
    otherPlayers[p.socketId] = p;
    showAlert(`👋 ¡${p.name} se unió a la aventura!`);
    playSfx('door');
  }
});

socket.on('player_moved', (data) => {
  if (otherPlayers[data.socketId]) {
    const p = otherPlayers[data.socketId];
    p.x = data.x;
    p.y = data.y;
    p.direction = data.direction;
    p.scene = data.scene;
    p.isMoving = data.isMoving;
  }
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
  if (data.text.includes('🐶') || data.text.includes('guau')) playSfx('bark');
  else if (data.text.includes('⚽')) playSfx('fanfare');
  else playSfx('coin');
});

// ==========================================
// SISTEMA DE ACCIÓN E INTERACCIÓN
// ==========================================
let currentInteractType = null;

function checkProximities() {
  if (!myPlayer) return;
  currentInteractType = null;

  if (currentScene === 'calle') {
    // 1. Puerta de la Casa Az
    const distDoor = Math.hypot(myPlayer.x - 280, myPlayer.y - 250);
    if (distDoor < 70) {
      currentInteractType = 'door_enter';
      setActionButton('🚪', 'ENTRAR A CASA');
      return;
    }

    // 2. Perrito Toby en el parque
    const distPuppy = Math.hypot(myPlayer.x - puppy.x, myPlayer.y - puppy.y);
    if (distPuppy < 65) {
      currentInteractType = 'pet_puppy';
      setActionButton('🐶', 'ACARICIAR');
      return;
    }

    // 3. Pizzería del Barrio
    const distPizza = Math.hypot(myPlayer.x - 1180, myPlayer.y - 250);
    if (distPizza < 70) {
      currentInteractType = 'take_pizza';
      setActionButton('🍕', hasPizzaBox ? 'DEJAR PIZZA' : 'PEDIR PIZZA');
      return;
    }

    // 4. Entregar Pizza en la puerta de la Casa Az
    if (hasPizzaBox && distDoor < 85) {
      currentInteractType = 'deliver_pizza';
      setActionButton('🎉', 'LLEVAR PIZZA A CASA');
      return;
    }

  } else if (currentScene === 'casa') {
    // 1. Puerta de salida
    const distExit = Math.hypot(myPlayer.x - 450, myPlayer.y - 600);
    if (distExit < 60) {
      currentInteractType = 'door_exit';
      setActionButton('🚪', 'SALIR A LA CALLE');
      return;
    }

    // 2. Televisor en la sala
    const distTv = Math.hypot(myPlayer.x - 450, myPlayer.y - 210);
    if (distTv < 65) {
      currentInteractType = 'toggle_tv';
      setActionButton('📺', isTvTurnedOn ? 'APAGAR TV' : 'VER DIBUJOS');
      return;
    }

    // 3. Sofá
    const distSofa = Math.hypot(myPlayer.x - 450, myPlayer.y - 340);
    if (distSofa < 60) {
      currentInteractType = 'sit_sofa';
      setActionButton('🛋️', isSittingOnSofa ? 'LEVANTARSE' : 'SENTARSE');
      return;
    }

    // 4. Refrigerador
    const distFridge = Math.hypot(myPlayer.x - 730, myPlayer.y - 220);
    if (distFridge < 60) {
      currentInteractType = 'fridge_snack';
      setActionButton('🧃', 'TOMAR JUGO');
      return;
    }
  }

  // Si no hay nada cerca
  btnActionMain.classList.remove('pulse');
  actionBtnEmoji.innerText = '✨';
  actionBtnLabel.innerText = 'ACCIÓN';
}

function setActionButton(emoji, label) {
  btnActionMain.classList.add('pulse');
  actionBtnEmoji.innerText = emoji;
  actionBtnLabel.innerText = label;
}

btnActionMain.addEventListener('click', () => {
  doAction();
});

function doAction() {
  if (!currentInteractType) {
    playSfx('kick');
    spawnEmojiBubble(myPlayer.x, myPlayer.y - 50, '✨ ¡Hola!');
    return;
  }

  if (currentInteractType === 'door_enter') {
    // Entrar a la casa
    playSfx('door');
    currentScene = 'casa';
    myPlayer.scene = 'casa';
    myPlayer.x = 450;
    myPlayer.y = 540;
    locationBadge.innerText = '🏡 Interior de la Casa Az';
    showAlert('🏡 ¡Entraron a la Casa Familiar!');
  } else if (currentInteractType === 'door_exit') {
    // Salir a la calle
    playSfx('door');
    currentScene = 'calle';
    myPlayer.scene = 'calle';
    myPlayer.x = 280;
    myPlayer.y = 290;
    locationBadge.innerText = '📍 La Calle del Barrio';
    showAlert('🏙️ ¡De vuelta a las calles del barrio!');
  } else if (currentInteractType === 'pet_puppy') {
    // Acariciar al perrito
    playSfx('bark');
    puppy.following = socket.id;
    spawnParticles(puppy.x, puppy.y, '❤️');
    showAlert('🐶 ¡Toby está feliz y ahora te sigue!');
  } else if (currentInteractType === 'take_pizza') {
    // Tomar caja de pizza
    playSfx('coin');
    hasPizzaBox = !hasPizzaBox;
    showAlert(hasPizzaBox ? '🍕 ¡Llevas una deliciosa pizza caliente!' : 'Dejaste la pizza.');
  } else if (currentInteractType === 'toggle_tv') {
    // TV
    playSfx('coin');
    isTvTurnedOn = !isTvTurnedOn;
    showAlert(isTvTurnedOn ? '📺 ¡Pusieron dibujos animados en la tele!' : '📺 Tele apagada.');
  } else if (currentInteractType === 'sit_sofa') {
    // Sofá
    playSfx('kick');
    isSittingOnSofa = !isSittingOnSofa;
    showAlert(isSittingOnSofa ? '🛋️ Descansando en el sofá familiar...' : 'Te levantaste.');
  } else if (currentInteractType === 'fridge_snack') {
    // Nevera
    playSfx('coin');
    showAlert('🧃 ¡Tomaste un rico jugo de fresa!');
    spawnParticles(myPlayer.x, myPlayer.y, '🍓');
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

function spawnParticles(x, y, char) {
  for (let i = 0; i < 6; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      vy: -1.5 - Math.random() * 2,
      char,
      life: 1.0
    });
  }
}

// ==========================================
// FÍSICA Y ACTUALIZACIÓN (60 FPS)
// ==========================================
let lastMoveSent = 0;
let stepAnim = 0;

function update() {
  if (!myPlayer) return;

  const curWorld = WORLDS[currentScene];
  let speed = 4.0;
  if (selectedCharId === 'diegoaz_jr') speed = 4.8; // Junior corre más rápido

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
    stepAnim += 0.25;
    myPlayer.x = Math.max(30, Math.min(curWorld.width - 30, myPlayer.x + vx));
    myPlayer.y = Math.max(30, Math.min(curWorld.height - 30, myPlayer.y + vy));

    if (Math.abs(vx) > Math.abs(vy)) myPlayer.direction = vx > 0 ? 'right' : 'left';
    else myPlayer.direction = vy > 0 ? 'down' : 'up';
  }
  myPlayer.isMoving = isMoving;

  // CÁMARA
  camera.x = Math.max(0, Math.min(curWorld.width - canvas.width, myPlayer.x - canvas.width / 2));
  camera.y = Math.max(0, Math.min(curWorld.height - canvas.height, myPlayer.y - canvas.height / 2));

  // ENVIAR POSICIÓN MULTIJUGADOR
  const now = Date.now();
  if (now - lastMoveSent > 35) {
    socket.emit('player_move', {
      x: myPlayer.x,
      y: myPlayer.y,
      direction: myPlayer.direction,
      scene: currentScene,
      isMoving: myPlayer.isMoving
    });
    lastMoveSent = now;
  }

  // FÍSICA Y ELEMENTOS EN LA CALLE
  if (currentScene === 'calle') {
    // 1. Pelota de fútbol ⚽
    const distBall = Math.hypot(myPlayer.x - soccerBall.x, myPlayer.y - soccerBall.y);
    if (distBall < 30) {
      const angle = Math.atan2(soccerBall.y - myPlayer.y, soccerBall.x - myPlayer.x);
      soccerBall.vx = Math.cos(angle) * 8.5;
      soccerBall.vy = Math.sin(angle) * 8.5;
      playSfx('kick');
      spawnParticles(soccerBall.x, soccerBall.y, '💨');
    }

    soccerBall.x += soccerBall.vx;
    soccerBall.y += soccerBall.vy;
    soccerBall.vx *= 0.94; // Fricción suave
    soccerBall.vy *= 0.94;

    // Límites de la pelota en el parque
    soccerBall.x = Math.max(500, Math.min(950, soccerBall.x));
    soccerBall.y = Math.max(620, Math.min(920, soccerBall.y));

    // Si la pelota entra al arco norte (Gol!)
    if (soccerBall.x > 700 && soccerBall.x < 760 && soccerBall.y < 635) {
      playSfx('fanfare');
      showAlert('⚽ ¡GOOOOOOL FAMILIAR!');
      spawnParticles(soccerBall.x, soccerBall.y, '⭐');
      soccerBall.y = 700;
      soccerBall.vx = 0; soccerBall.vy = 0;
    }

    // 2. Perrito Toby 🐶 sigue al jugador si lo acarició
    if (puppy.following === socket.id) {
      const distToPlayer = Math.hypot(myPlayer.x - puppy.x, myPlayer.y - puppy.y);
      if (distToPlayer > 45) {
        const pAngle = Math.atan2(myPlayer.y - puppy.y, myPlayer.x - puppy.x);
        puppy.x += Math.cos(pAngle) * 3.4;
        puppy.y += Math.sin(pAngle) * 3.4;
      }
    }

    // 3. Monedas en el suelo 🪙
    streetCoins.forEach(coin => {
      if (!coin.collected) {
        const distC = Math.hypot(myPlayer.x - coin.x, myPlayer.y - coin.y);
        if (distC < 28) {
          coin.collected = true;
          myPlayer.coins += 10;
          familyVaultCoins += 10;
          playerCoinsVal.innerText = myPlayer.coins;
          familyVaultVal.innerText = familyVaultCoins;
          playSfx('coin');
          spawnParticles(coin.x, coin.y, '🪙');
          showAlert('🪙 ¡Moneda brillante recogida! (+10)');
          // Reaparece en 15 segundos
          setTimeout(() => { coin.collected = false; }, 15000);
        }
      }
    });

    // 4. Auto amarillo pasando 🚗
    streetCar.x += streetCar.speed;
    if (streetCar.x > WORLDS.calle.width + 150) {
      streetCar.x = -150;
    }
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
// DIBUJO EN CANVAS
// ==========================================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  if (currentScene === 'calle') {
    drawStreetScene();
  } else if (currentScene === 'casa') {
    drawHouseScene();
  }

  // Jugadores remotos (en la misma escena)
  for (const sId in otherPlayers) {
    const op = otherPlayers[sId];
    if (op.scene === currentScene) {
      drawPlayerAvatar(op, sId);
    }
  }

  // Jugador local
  if (myPlayer) {
    drawPlayerAvatar(myPlayer, socket.id, true);
  }

  // Globos de texto y partículas
  drawBubbles();
  drawParticles();

  ctx.restore();
}

// ==========================================
// ESCENA 1: LA CALLE DEL BARRIO AZ
// ==========================================
function drawStreetScene() {
  // Aceras / Calles
  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, 0, WORLDS.calle.width, WORLDS.calle.height);

  // AVENIDA DE ASFALTO
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 440, WORLDS.calle.width, 130);

  // Línea amarilla
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 4;
  ctx.setLineDash([25, 20]);
  ctx.beginPath();
  ctx.moveTo(0, 505);
  ctx.lineTo(WORLDS.calle.width, 505);
  ctx.stroke();
  ctx.setLineDash([]);

  // Pasos de cebra peatonales
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(240 + i * 16, 445, 9, 120);
    ctx.fillRect(1140 + i * 16, 445, 9, 120);
  }

  // 1. CASA FAMILIAR AZ (EXTERIOR)
  drawHouseExterior(160, 110, 240, 170);

  // 2. PIZZERÍA / CAFETERÍA DULCE AZ
  drawPizzaShopExterior(1060, 110, 240, 170);

  // 3. PARQUE FAMILIAR (CÉSPED)
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(480, 620, 520, 320);
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 6;
  ctx.strokeRect(480, 620, 520, 320);

  // Cancha de fútbol con arco
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(550, 660, 380, 240);
  ctx.beginPath();
  ctx.arc(740, 780, 45, 0, Math.PI * 2);
  ctx.stroke();

  // Arco norte de fútbol
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(700, 650, 80, 12);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px Fredoka';
  ctx.fillText('ARCO 🥅', 715, 642);

  // Árboles
  drawCuteTree(520, 670);
  drawCuteTree(960, 670);
  drawCuteTree(520, 910);
  drawCuteTree(960, 910);

  // Monedas flotantes
  streetCoins.forEach(coin => {
    if (!coin.collected) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('$', coin.x - 3, coin.y + 3);
    }
  });

  // Pelota de fútbol ⚽
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(soccerBall.x, soccerBall.y, soccerBall.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#0f172a';
  ctx.font = '12px sans-serif';
  ctx.fillText('⚽', soccerBall.x - 8, soccerBall.y + 5);

  // Perrito Toby 🐶
  drawCutePuppy(puppy.x, puppy.y);

  // Auto amarillo en la calle 🚗
  drawYellowCar(streetCar.x, streetCar.y);

  // Piscina comprada (si la compraron en la tienda)
  if (houseUpgrades.pool) {
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(60, 150, 80, 90);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 150, 80, 90);
    ctx.fillStyle = '#ffffff';
    ctx.font = '22px sans-serif';
    ctx.fillText('🏊', 88, 202);
  }
}

// ==========================================
// ESCENA 2: INTERIOR DE LA CASA FAMILIAR AZ
// ==========================================
function drawHouseScene() {
  const W = WORLDS.casa.width;
  const H = WORLDS.casa.height;

  // Suelo de madera cálida
  ctx.fillStyle = '#d97706';
  ctx.fillRect(0, 0, W, H);

  // Pared superior elegante
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, W, 140);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, W, 140);

  // Cuadros familiares en la pared
  drawPhotoFrame(220, 40, '👨‍👩‍👧‍👦 FAMILIA AZ');
  drawPhotoFrame(660, 40, '🏆 LOS MEJORES');

  // TELEVISOR 📺
  ctx.fillStyle = isTvTurnedOn ? '#38bdf8' : '#0f172a';
  ctx.fillRect(400, 140, 100, 60);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 4;
  ctx.strokeRect(400, 140, 100, 60);
  if (isTvTurnedOn) {
    ctx.font = '26px sans-serif';
    ctx.fillText('🐱🐭', 428, 180);
  } else {
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Fredoka';
    ctx.fillText('PULSA PARA VER', 408, 175);
  }

  // SOFÁ CÓMODO 🛋️
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(380, 310, 140, 50);
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 3;
  ctx.strokeRect(380, 310, 140, 50);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px Fredoka';
  ctx.fillText('🛋️ SOFÁ FAMILIAR', 404, 340);

  // COCINA / REFRIGERADOR 🧊
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(700, 140, 60, 80);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  ctx.strokeRect(700, 140, 60, 80);
  ctx.fillStyle = '#0f172a';
  ctx.font = '18px sans-serif';
  ctx.fillText('🧊', 720, 185);

  // CAMAS DE LOS PERSONAJES
  // Cama Junior (4 años)
  drawBed(100, 200, '#f97316', '⚡ JUNIOR');
  // Cama Vicky (10 años)
  drawBed(100, 360, '#ec4899', '🌸 VICKY');
  // Cama Papá (46 años)
  drawBed(100, 500, '#3b82f6', '👔 PAPÁ');

  // PUERTA DE SALIDA (Abajo)
  ctx.fillStyle = '#78350f';
  ctx.fillRect(410, 610, 80, 40);
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 12px Fredoka';
  ctx.fillText('🚪 SALIR', 426, 634);
}

function drawBed(x, y, color, label) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 90, 50);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 5, y + 5, 24, 40); // almohada
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px Fredoka';
  ctx.fillText(label, x + 34, y + 30);
}

function drawPhotoFrame(x, y, text) {
  ctx.fillStyle = '#b45309';
  ctx.fillRect(x, y, 120, 65);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(x + 6, y + 6, 108, 53);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 10px Fredoka';
  ctx.fillText(text, x + 14, y + 36);
}

// ==========================================
// DIBUJOS DE FACHADAS Y ELEMENTOS VISUALES
// ==========================================
function drawHouseExterior(x, y, w, h) {
  // Fachada
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(x, y + 45, w, h - 45);
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y + 45, w, h - 45);

  // Techo rojo
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(x - 10, y, w + 20, 50);
  ctx.strokeRect(x - 10, y, w + 20, 50);

  // Cartel
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + w / 2 - 80, y + 12, 160, 26);
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 13px Fredoka';
  ctx.textAlign = 'center';
  ctx.fillText('🏡 CASA AZ (FAMILIA)', x + w / 2, y + 30);
  ctx.textAlign = 'start';

  // Ventanas
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(x + 25, y + 70, 45, 40);
  ctx.fillRect(x + w - 70, y + 70, 45, 40);

  // Puerta de entrada con felpudo
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x + w / 2 - 25, y + h - 55, 50, 55);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(x + w / 2 - 32, y + h - 6, 64, 12); // felpudo
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px Fredoka';
  ctx.fillText('BIENVENIDOS', x + w / 2 - 28, y + h + 3);
}

function drawPizzaShopExterior(x, y, w, h) {
  ctx.fillStyle = '#fed7aa';
  ctx.fillRect(x, y + 45, w, h - 45);
  ctx.strokeStyle = '#c2410c';
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y + 45, w, h - 45);

  // Techo a rayas
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(x - 10, y, w + 20, 50);
  ctx.strokeRect(x - 10, y, w + 20, 50);

  // Cartel
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + w / 2 - 85, y + 12, 170, 26);
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 13px Fredoka';
  ctx.textAlign = 'center';
  ctx.fillText('🍕 PIZZERÍA DULCE AZ', x + w / 2, y + 30);
  ctx.textAlign = 'start';

  // Mostrador
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x + w / 2 - 25, y + h - 55, 50, 55);
}

function drawCuteTree(x, y) {
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x - 7, y, 14, 25);
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(x, y - 8, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.arc(x - 8, y - 14, 14, 0, Math.PI * 2);
  ctx.fill();
}

function drawCutePuppy(x, y) {
  // Cuerpo del perrito Toby
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.ellipse(x, y, 14, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cabeza
  ctx.beginPath();
  ctx.arc(x + 10, y - 6, 9, 0, Math.PI * 2);
  ctx.fill();

  // Orejas
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.arc(x + 7, y - 12, 4, 0, Math.PI * 2);
  ctx.fill();

  // Ojo y hocico
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(x + 13, y - 7, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Cartelito "Toby"
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px Fredoka';
  ctx.fillText('🐶 Toby', x - 12, y - 18);
}

function drawYellowCar(x, y) {
  // Auto amarillo familiar
  ctx.fillStyle = '#facc15';
  ctx.fillRect(x, y, 80, 36);
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x, y, 80, 36);

  // Cabina
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(x + 18, y - 14, 44, 16);
  ctx.strokeRect(x + 18, y - 14, 44, 16);

  // Ruedas
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(x + 18, y + 36, 8, 0, Math.PI * 2);
  ctx.arc(x + 62, y + 36, 8, 0, Math.PI * 2);
  ctx.fill();
}

// ==========================================
// DIBUJO DE LOS PERSONAJES DE LA FAMILIA
// ==========================================
function drawPlayerAvatar(p, sId, isSelf = false) {
  const x = p.x;
  const y = p.y;
  const bob = p.isMoving ? Math.sin(stepAnim) * 3 : 0;

  // Sombra suave en los pies
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + 16, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  let bodyColor = '#3b82f6'; // Papá
  let faceEmoji = '👨';

  if (p.id === 'diegoaz_jr') {
    bodyColor = '#f97316'; // Junior
    faceEmoji = '👦';
  } else if (p.id === 'vicky_vicky') {
    bodyColor = '#ec4899'; // Vicky
    faceEmoji = '👧';
  }

  // Piernas
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x - 7, y + 6 + bob, 5, 12);
  ctx.fillRect(x + 2, y + 6 - bob, 5, 12);

  // Cuerpo / Ropa
  ctx.fillStyle = bodyColor;
  ctx.fillRect(x - 11, y - 8 + bob, 22, 16);

  // Cabeza con cara gigante expresiva
  ctx.font = '26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(faceEmoji, x, y - 12 + bob);

  // Si lleva caja de pizza en las manos 🍕
  if (isSelf && hasPizzaBox) {
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(x - 12, y - 4 + bob, 24, 12);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px sans-serif';
    ctx.fillText('🍕', x, y + 5 + bob);
  }

  // Nombre arriba de la cabeza
  ctx.font = 'bold 12px Fredoka';
  const tagW = ctx.measureText(p.name).width + 16;
  ctx.fillStyle = isSelf ? '#1d4ed8' : '#0f172a';
  ctx.fillRect(x - tagW / 2, y - 46 + bob, tagW, 18);
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - tagW / 2, y - 46 + bob, tagW, 18);

  ctx.fillStyle = '#ffffff';
  ctx.fillText(p.name, x, y - 32 + bob);
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
    if (p && p.scene === currentScene) {
      const bx = p.x;
      const by = p.y - 62;
      ctx.font = 'bold 14px Fredoka';
      ctx.textAlign = 'center';
      const tw = ctx.measureText(b.text).width + 20;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(bx - tw / 2, by - 16, tw, 26, 12);
      ctx.fill();

      // Flechita
      ctx.beginPath();
      ctx.moveTo(bx - 5, by + 10);
      ctx.lineTo(bx + 5, by + 10);
      ctx.lineTo(bx, by + 16);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.fillText(b.text, bx, by + 2);
      ctx.textAlign = 'start';
    }
  }
}

function drawParticles() {
  particles.forEach(p => {
    ctx.font = '16px sans-serif';
    ctx.fillText(p.char, p.x, p.y);
  });
}

// Bucle principal
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
