// ==========================================
// EL BARRIO AZ - MOTOR MULTIJUGADOR COMPLETO
// Diseñado para Diego Jr. (4), Vicky (10) y Diegoaz (46)
// ==========================================

// Inicializar conexión Socket.io con soporte WebSocket y Polling automático
const socket = io({
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 20
});

// Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// DOM Elements
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

// Joystick
const joystickArea = document.getElementById('joystick-area');
const joystickRing = document.getElementById('joystick-ring');
const joystickKnob = document.getElementById('joystick-knob');

// ==========================================
// SONIDOS SINTETIZADOS WEB AUDIO
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
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987, now);
      osc.frequency.setValueAtTime(1318, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'kick') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'bark') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.06);
      osc.frequency.linearRampToValueAtTime(350, now + 0.14);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'door') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.2);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'honk') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'fanfare') {
      [523, 659, 783, 1046].forEach((f, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(f, now + idx * 0.09);
        g.gain.setValueAtTime(0.25, now + idx * 0.09);
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
// ESTADO Y SINCRONIZACIÓN MULTIJUGADOR
// ==========================================
let currentScene = 'calle'; // 'calle' o 'casa'

const WORLDS = {
  calle: { width: 1500, height: 1000 },
  casa: { width: 900, height: 650 }
};

const camera = { x: 0, y: 0 };
let selectedCharId = 'diegoaz_jr';
let myPlayer = null;
const otherPlayers = {}; // Sincronización en tiempo real
let familyVaultCoins = 500;
let activeBubbles = {};
let particles = [];

// Mejoras de la casa
const houseUpgrades = {
  tv: false,
  pool: false,
  car: false,
  pizza_oven: false
};

// Pelota de fútbol compartida
const soccerBall = {
  x: 650,
  y: 780,
  vx: 0,
  vy: 0,
  radius: 14
};

// Perrito Toby
const puppy = {
  x: 740,
  y: 720,
  following: null
};

// Monedas en la calle
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

// Auto amarillo
const streetCar = {
  x: -120,
  y: 480,
  speed: 2.8
};

let hasPizzaBox = false;
let isSittingOnSofa = false;
let isTvTurnedOn = false;

// Redimensionar pantalla
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
resizeCanvas();

// Selección de Personaje
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

  // Enviar evento de unión al servidor con escena inicial
  socket.emit('join_game', {
    characterId: selectedCharId,
    scene: currentScene
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
// EVENTOS DE SOCKET.IO MULTIJUGADOR (CRÍTICO)
// ==========================================

socket.on('init_state', (data) => {
  console.log('🎮 [INIT_STATE] Recibido del servidor:', data);
  myPlayer = data.self;
  myPlayer.scene = myPlayer.scene || 'calle';

  // Registrar todos los jugadores ya presentes
  for (const sId in data.players) {
    if (sId !== socket.id) {
      otherPlayers[sId] = data.players[sId];
      otherPlayers[sId].scene = otherPlayers[sId].scene || 'calle';
    }
  }

  if (data.ball) {
    soccerBall.x = data.ball.x;
    soccerBall.y = data.ball.y;
    soccerBall.vx = data.ball.vx;
    soccerBall.vy = data.ball.vy;
  }

  playerCoinsVal.innerText = myPlayer.coins;
  familyVaultVal.innerText = familyVaultCoins;
  showAlert(`¡Hola ${myPlayer.name}! Ya estás en línea.`);
});

socket.on('player_joined', (p) => {
  console.log('👋 [PLAYER_JOINED] Nuevo jugador en línea:', p);
  if (p.socketId !== socket.id) {
    otherPlayers[p.socketId] = p;
    otherPlayers[p.socketId].scene = p.scene || 'calle';
    showAlert(`👋 ¡${p.name} se unió a la partida!`);
    playSfx('door');
  }
});

socket.on('player_moved', (data) => {
  if (data.socketId === socket.id) return;

  if (otherPlayers[data.socketId]) {
    const p = otherPlayers[data.socketId];
    p.x = data.x;
    p.y = data.y;
    p.direction = data.direction;
    p.scene = data.scene || p.scene || 'calle';
    p.isMoving = data.isMoving;
  } else {
    // Si no existía en memoria, lo creamos inmediatamente para no perderlo
    otherPlayers[data.socketId] = {
      socketId: data.socketId,
      id: data.id,
      name: data.name || 'Familiar',
      x: data.x,
      y: data.y,
      direction: data.direction,
      scene: data.scene || 'calle',
      isMoving: data.isMoving
    };
  }
});

socket.on('player_changed_scene', (data) => {
  if (otherPlayers[data.socketId]) {
    otherPlayers[data.socketId].scene = data.scene;
    const place = data.scene === 'casa' ? 'a la Casa Az 🏡' : 'a la Calle 🏙️';
    showAlert(`🚶 ${data.name} entró ${place}`);
  }
});

socket.on('ball_updated', (ballData) => {
  soccerBall.x = ballData.x;
  soccerBall.y = ballData.y;
  soccerBall.vx = ballData.vx;
  soccerBall.vy = ballData.vy;
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

// Teclado
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
  playSfx('honk');
  spawnEmojiBubble(myPlayer ? myPlayer.x : 0, myPlayer ? myPlayer.y - 50 : 0, '📢 ¡PIII-PIII!');
});

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

btnOpenHouseShop.addEventListener('click', () => {
  playSfx('door');
  houseShopModal.classList.remove('hidden');
});
btnCloseShop.addEventListener('click', () => {
  houseShopModal.classList.add('hidden');
});

// ==========================================
// SISTEMA DE ACCIÓN E INTERACCIONES
// ==========================================
let currentInteractType = null;

function checkProximities() {
  if (!myPlayer) return;
  currentInteractType = null;

  if (currentScene === 'calle') {
    // Puerta de la Casa Az
    const distDoor = Math.hypot(myPlayer.x - 280, myPlayer.y - 250);
    if (distDoor < 70) {
      currentInteractType = 'door_enter';
      setActionButton('🚪', 'ENTRAR A CASA');
      return;
    }

    // Perrito Toby
    const distPuppy = Math.hypot(myPlayer.x - puppy.x, myPlayer.y - puppy.y);
    if (distPuppy < 65) {
      currentInteractType = 'pet_puppy';
      setActionButton('🐶', 'ACARICIAR');
      return;
    }

    // Pizzería
    const distPizza = Math.hypot(myPlayer.x - 1180, myPlayer.y - 250);
    if (distPizza < 70) {
      currentInteractType = 'take_pizza';
      setActionButton('🍕', hasPizzaBox ? 'DEJAR PIZZA' : 'PEDIR PIZZA');
      return;
    }

    // Entregar Pizza
    if (hasPizzaBox && distDoor < 85) {
      currentInteractType = 'deliver_pizza';
      setActionButton('🎉', 'LLEVAR PIZZA A CASA');
      return;
    }

  } else if (currentScene === 'casa') {
    // Puerta de salida
    const distExit = Math.hypot(myPlayer.x - 450, myPlayer.y - 600);
    if (distExit < 60) {
      currentInteractType = 'door_exit';
      setActionButton('🚪', 'SALIR A LA CALLE');
      return;
    }

    // Televisor
    const distTv = Math.hypot(myPlayer.x - 450, myPlayer.y - 210);
    if (distTv < 65) {
      currentInteractType = 'toggle_tv';
      setActionButton('📺', isTvTurnedOn ? 'APAGAR TV' : 'VER DIBUJOS');
      return;
    }

    // Sofá
    const distSofa = Math.hypot(myPlayer.x - 450, myPlayer.y - 340);
    if (distSofa < 60) {
      currentInteractType = 'sit_sofa';
      setActionButton('🛋️', isSittingOnSofa ? 'LEVANTARSE' : 'SENTARSE');
      return;
    }

    // Nevera
    const distFridge = Math.hypot(myPlayer.x - 730, myPlayer.y - 220);
    if (distFridge < 60) {
      currentInteractType = 'fridge_snack';
      setActionButton('🧃', 'TOMAR JUGO');
      return;
    }
  }

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
    playSfx('door');
    currentScene = 'casa';
    myPlayer.scene = 'casa';
    myPlayer.x = 450;
    myPlayer.y = 540;
    locationBadge.innerText = '🏡 Interior de la Casa Az';
    showAlert('🏡 ¡Entraron a la Casa Familiar!');
    socket.emit('change_scene', 'casa');
  } else if (currentInteractType === 'door_exit') {
    playSfx('door');
    currentScene = 'calle';
    myPlayer.scene = 'calle';
    myPlayer.x = 280;
    myPlayer.y = 290;
    locationBadge.innerText = '📍 La Calle del Barrio';
    showAlert('🏙️ ¡De vuelta a las calles del barrio!');
    socket.emit('change_scene', 'calle');
  } else if (currentInteractType === 'pet_puppy') {
    playSfx('bark');
    puppy.following = socket.id;
    spawnParticles(puppy.x, puppy.y, '❤️');
    showAlert('🐶 ¡Toby está feliz y ahora te sigue!');
  } else if (currentInteractType === 'take_pizza') {
    playSfx('coin');
    hasPizzaBox = !hasPizzaBox;
    showAlert(hasPizzaBox ? '🍕 ¡Llevas una deliciosa pizza caliente!' : 'Dejaste la pizza.');
  } else if (currentInteractType === 'toggle_tv') {
    playSfx('coin');
    isTvTurnedOn = !isTvTurnedOn;
    showAlert(isTvTurnedOn ? '📺 ¡Pusieron dibujos animados en la tele!' : '📺 Tele apagada.');
  } else if (currentInteractType === 'sit_sofa') {
    playSfx('kick');
    isSittingOnSofa = !isSittingOnSofa;
    showAlert(isSittingOnSofa ? '🛋️ Descansando en el sofá familiar...' : 'Te levantaste.');
  } else if (currentInteractType === 'fridge_snack') {
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
// FÍSICA Y ACTUALIZACIÓN
// ==========================================
let lastMoveSent = 0;
let stepAnim = 0;

function update() {
  if (!myPlayer) return;

  const curWorld = WORLDS[currentScene];
  let speed = 4.0;
  if (selectedCharId === 'diegoaz_jr') speed = 4.8;

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

  camera.x = Math.max(0, Math.min(curWorld.width - canvas.width, myPlayer.x - canvas.width / 2));
  camera.y = Math.max(0, Math.min(curWorld.height - canvas.height, myPlayer.y - canvas.height / 2));

  // Transmitir posición y escena actual al servidor
  const now = Date.now();
  if (now - lastMoveSent > 33) {
    socket.emit('player_move', {
      x: myPlayer.x,
      y: myPlayer.y,
      direction: myPlayer.direction,
      scene: currentScene,
      isMoving: myPlayer.isMoving
    });
    lastMoveSent = now;
  }

  // FÍSICA DE LA CALLE
  if (currentScene === 'calle') {
    // Pelota de fútbol
    const distBall = Math.hypot(myPlayer.x - soccerBall.x, myPlayer.y - soccerBall.y);
    if (distBall < 30) {
      const angle = Math.atan2(soccerBall.y - myPlayer.y, soccerBall.x - myPlayer.x);
      soccerBall.vx = Math.cos(angle) * 8.5;
      soccerBall.vy = Math.sin(angle) * 8.5;
      playSfx('kick');
      spawnParticles(soccerBall.x, soccerBall.y, '💨');

      // Avisar al servidor para sincronizar con los otros jugadores
      socket.emit('kick_ball', soccerBall);
    }

    soccerBall.x += soccerBall.vx;
    soccerBall.y += soccerBall.vy;
    soccerBall.vx *= 0.94;
    soccerBall.vy *= 0.94;

    soccerBall.x = Math.max(500, Math.min(950, soccerBall.x));
    soccerBall.y = Math.max(620, Math.min(920, soccerBall.y));

    if (soccerBall.x > 700 && soccerBall.x < 760 && soccerBall.y < 635) {
      playSfx('fanfare');
      showAlert('⚽ ¡GOOOOOOL FAMILIAR!');
      spawnParticles(soccerBall.x, soccerBall.y, '⭐');
      soccerBall.y = 700;
      soccerBall.vx = 0; soccerBall.vy = 0;
      socket.emit('kick_ball', soccerBall);
    }

    // Perrito Toby
    if (puppy.following === socket.id) {
      const distToPlayer = Math.hypot(myPlayer.x - puppy.x, myPlayer.y - puppy.y);
      if (distToPlayer > 45) {
        const pAngle = Math.atan2(myPlayer.y - puppy.y, myPlayer.x - puppy.x);
        puppy.x += Math.cos(pAngle) * 3.4;
        puppy.y += Math.sin(pAngle) * 3.4;
      }
    }

    // Monedas
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
          setTimeout(() => { coin.collected = false; }, 15000);
        }
      }
    });

    // Auto amarillo
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
// RENDERIZADO VISUAL
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

  // Indicador si alguien de la familia está en la otra escena
  drawOtherSceneIndicators();

  // DIBUJAR JUGADORES REMOTOS (SINCRONIZADOS)
  for (const sId in otherPlayers) {
    const op = otherPlayers[sId];
    const targetScene = op.scene || 'calle';
    if (targetScene === currentScene) {
      drawPlayerAvatar(op, sId);
    }
  }

  // DIBUJAR JUGADOR LOCAL
  if (myPlayer) {
    drawPlayerAvatar(myPlayer, socket.id, true);
  }

  drawBubbles();
  drawParticles();

  ctx.restore();
}

function drawOtherSceneIndicators() {
  if (currentScene === 'calle') {
    // Si algún familiar está adentro de la casa, mostrar aviso sobre la puerta
    const insidePlayers = Object.values(otherPlayers).filter(p => (p.scene || 'calle') === 'casa');
    if (insidePlayers.length > 0) {
      const names = insidePlayers.map(p => p.name).join(', ');
      ctx.fillStyle = '#facc15';
      ctx.fillRect(210, 195, 140, 22);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px Fredoka';
      ctx.textAlign = 'center';
      ctx.fillText(`🏡 ${names} adentro`, 280, 210);
      ctx.textAlign = 'start';
    }
  }
}

// ==========================================
// ESCENAS (CALLE Y CASA)
// ==========================================
function drawStreetScene() {
  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, 0, WORLDS.calle.width, WORLDS.calle.height);

  // AVENIDA
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 440, WORLDS.calle.width, 130);

  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 4;
  ctx.setLineDash([25, 20]);
  ctx.beginPath();
  ctx.moveTo(0, 505);
  ctx.lineTo(WORLDS.calle.width, 505);
  ctx.stroke();
  ctx.setLineDash([]);

  // Pasos peatonales
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(240 + i * 16, 445, 9, 120);
    ctx.fillRect(1140 + i * 16, 445, 9, 120);
  }

  drawHouseExterior(160, 110, 240, 170);
  drawPizzaShopExterior(1060, 110, 240, 170);

  // Parque
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(480, 620, 520, 320);
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 6;
  ctx.strokeRect(480, 620, 520, 320);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(550, 660, 380, 240);
  ctx.beginPath();
  ctx.arc(740, 780, 45, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(700, 650, 80, 12);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px Fredoka';
  ctx.fillText('ARCO 🥅', 715, 642);

  drawCuteTree(520, 670);
  drawCuteTree(960, 670);
  drawCuteTree(520, 910);
  drawCuteTree(960, 910);

  // Monedas
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

  // Pelota
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

  drawCutePuppy(puppy.x, puppy.y);
  drawYellowCar(streetCar.x, streetCar.y);
}

function drawHouseScene() {
  const W = WORLDS.casa.width;
  const H = WORLDS.casa.height;

  ctx.fillStyle = '#d97706';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, W, 140);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, W, 140);

  drawPhotoFrame(220, 40, '👨‍👩‍👧‍👦 FAMILIA AZ');
  drawPhotoFrame(660, 40, '🏆 LOS MEJORES');

  // TV
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

  // Sofá
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(380, 310, 140, 50);
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 3;
  ctx.strokeRect(380, 310, 140, 50);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px Fredoka';
  ctx.fillText('🛋️ SOFÁ FAMILIAR', 404, 340);

  // Nevera
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(700, 140, 60, 80);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  ctx.strokeRect(700, 140, 60, 80);
  ctx.fillStyle = '#0f172a';
  ctx.font = '18px sans-serif';
  ctx.fillText('🧊', 720, 185);

  drawBed(100, 200, '#f97316', '⚡ JUNIOR');
  drawBed(100, 360, '#ec4899', '🌸 VICKY');
  drawBed(100, 500, '#3b82f6', '👔 PAPÁ');

  // Puerta salida
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
  ctx.fillRect(x + 5, y + 5, 24, 40);
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

function drawHouseExterior(x, y, w, h) {
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(x, y + 45, w, h - 45);
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y + 45, w, h - 45);

  ctx.fillStyle = '#dc2626';
  ctx.fillRect(x - 10, y, w + 20, 50);
  ctx.strokeRect(x - 10, y, w + 20, 50);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + w / 2 - 80, y + 12, 160, 26);
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 13px Fredoka';
  ctx.textAlign = 'center';
  ctx.fillText('🏡 CASA AZ (FAMILIA)', x + w / 2, y + 30);
  ctx.textAlign = 'start';

  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(x + 25, y + 70, 45, 40);
  ctx.fillRect(x + w - 70, y + 70, 45, 40);

  ctx.fillStyle = '#78350f';
  ctx.fillRect(x + w / 2 - 25, y + h - 55, 50, 55);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(x + w / 2 - 32, y + h - 6, 64, 12);
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

  ctx.fillStyle = '#ea580c';
  ctx.fillRect(x - 10, y, w + 20, 50);
  ctx.strokeRect(x - 10, y, w + 20, 50);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + w / 2 - 85, y + 12, 170, 26);
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 13px Fredoka';
  ctx.textAlign = 'center';
  ctx.fillText('🍕 PIZZERÍA DULCE AZ', x + w / 2, y + 30);
  ctx.textAlign = 'start';

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
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.ellipse(x, y, 14, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x + 10, y - 6, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.arc(x + 7, y - 12, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(x + 13, y - 7, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px Fredoka';
  ctx.fillText('🐶 Toby', x - 12, y - 18);
}

function drawYellowCar(x, y) {
  ctx.fillStyle = '#facc15';
  ctx.fillRect(x, y, 80, 36);
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x, y, 80, 36);

  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(x + 18, y - 14, 44, 16);
  ctx.strokeRect(x + 18, y - 14, 44, 16);

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(x + 18, y + 36, 8, 0, Math.PI * 2);
  ctx.arc(x + 62, y + 36, 8, 0, Math.PI * 2);
  ctx.fill();
}

// ==========================================
// DIBUJO DE LOS PERSONAJES
// ==========================================
function drawPlayerAvatar(p, sId, isSelf = false) {
  const x = p.x;
  const y = p.y;
  const bob = p.isMoving ? Math.sin(stepAnim) * 3 : 0;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + 16, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  let bodyColor = '#3b82f6';
  let faceEmoji = '👨';

  if (p.id === 'diegoaz_jr') {
    bodyColor = '#f97316';
    faceEmoji = '👦';
  } else if (p.id === 'vicky_vicky') {
    bodyColor = '#ec4899';
    faceEmoji = '👧';
  }

  // Piernas
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x - 7, y + 6 + bob, 5, 12);
  ctx.fillRect(x + 2, y + 6 - bob, 5, 12);

  // Ropa
  ctx.fillStyle = bodyColor;
  ctx.fillRect(x - 11, y - 8 + bob, 22, 16);

  // Cara
  ctx.font = '26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(faceEmoji, x, y - 12 + bob);

  // Pizza en manos
  if (isSelf && hasPizzaBox) {
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(x - 12, y - 4 + bob, 24, 12);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px sans-serif';
    ctx.fillText('🍕', x, y + 5 + bob);
  }

  // Etiqueta Nombre
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
    if (p && (p.scene || 'calle') === currentScene) {
      const bx = p.x;
      const by = p.y - 62;
      ctx.font = 'bold 14px Fredoka';
      ctx.textAlign = 'center';
      const tw = ctx.measureText(b.text).width + 20;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(bx - tw / 2, by - 16, tw, 26, 12);
      ctx.fill();

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

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
