// ==========================================
// EL BARRIO AZ - MOTOR ULTRA OPTIMIZADO PARA MÓVIL Y PC
// ==========================================

const socket = io();

// Canvas y Contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Tamaño del Mundo Virtual (Barrio Az)
const WORLD_WIDTH = 1400;
const WORLD_HEIGHT = 1000;

// Cámara que sigue al jugador
const camera = { x: 0, y: 0 };

// Elementos DOM
const modalSelect = document.getElementById('character-select-modal');
const gameContainer = document.getElementById('game-container');
const btnStart = document.getElementById('btn-start-game');
const charCards = document.querySelectorAll('.char-card');
const userBadge = document.getElementById('active-user-badge');
const playerCoinsVal = document.getElementById('player-coins-val');
const familyVaultVal = document.getElementById('family-vault-val');
const touchActionBtn = document.getElementById('touch-action-btn');
const missionsModal = document.getElementById('missions-modal');
const btnToggleMissions = document.getElementById('btn-toggle-missions');
const btnCloseMissions = document.getElementById('btn-close-missions');
const missionsListEl = document.getElementById('missions-list');
const pendingMissionsBadge = document.getElementById('pending-missions-badge');
const vehicleModal = document.getElementById('vehicle-modal');
const btnToggleVehicles = document.getElementById('btn-toggle-vehicles');
const btnCloseVehicles = document.getElementById('btn-close-vehicles');
const btnFullscreen = document.getElementById('btn-fullscreen');
const toastContainer = document.getElementById('toast-container');

// Chat de Teclado
const keyboardChatBar = document.getElementById('keyboard-chat-bar');
const btnOpenTextChat = document.getElementById('btn-open-text-chat');
const btnCloseChat = document.getElementById('btn-close-chat');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

// Joystick Virtual DOM
const joystickZone = document.getElementById('joystick-zone');
const joystickBase = document.getElementById('joystick-base');
const joystickStick = document.getElementById('joystick-stick');

// Estado del Jugador y Multijugador
let selectedCharId = 'diegoaz';
let myPlayer = null;
let otherPlayers = {};
let missions = [];
let familyVault = { family_coins: 500 };
let activeChatBubbles = {};

// Vectores de Movimiento
let moveVector = { x: 0, y: 0 }; // Normalizado -1 a 1 (Joystick o Teclado)
const keys = { up: false, down: false, left: false, right: false };

// Redimensionar Canvas a Pantalla Completa
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
resizeCanvas();

// Haptic feedback (Vibración en móvil)
function vibrate(ms = 20) {
  if (navigator.vibrate) {
    try { navigator.vibrate(ms); } catch (e) {}
  }
}

// Selección de Personajes
charCards.forEach(card => {
  card.addEventListener('click', () => {
    vibrate(10);
    charCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    selectedCharId = card.getAttribute('data-char');
  });
});

btnStart.addEventListener('click', () => {
  vibrate(30);
  modalSelect.classList.add('hidden');
  gameContainer.classList.remove('hidden');
  resizeCanvas();

  socket.emit('join_game', { characterId: selectedCharId });
});

// Pantalla Completa
btnFullscreen.addEventListener('click', () => {
  vibrate(15);
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

// Socket.io Sincronización
socket.on('init_state', (data) => {
  myPlayer = data.self;
  otherPlayers = {};
  for (const sId in data.players) {
    if (sId !== socket.id) otherPlayers[sId] = data.players[sId];
  }
  missions = data.missions || [];
  familyVault = data.vault || { family_coins: 500 };

  updateHUD();
  renderMissionsUI();
  showToast(`🎉 ¡Hola ${myPlayer.name}! Ya estás en el barrio.`);
});

socket.on('player_joined', (player) => {
  if (player.socketId !== socket.id) {
    otherPlayers[player.socketId] = player;
    showToast(`👋 ${player.name} entró al barrio.`);
  }
});

socket.on('player_moved', (data) => {
  if (otherPlayers[data.socketId]) {
    const p = otherPlayers[data.socketId];
    p.x = data.x;
    p.y = data.y;
    p.direction = data.direction;
    p.isMoving = data.isMoving;
    p.vehicle = data.vehicle;
  }
});

socket.on('player_left', (data) => {
  if (otherPlayers[data.socketId]) {
    showToast(`🚪 ${otherPlayers[data.socketId].name} salió.`);
    delete otherPlayers[data.socketId];
    delete activeChatBubbles[data.socketId];
  }
});

socket.on('chat_received', (data) => {
  activeChatBubbles[data.socketId] = {
    text: data.text,
    expires: Date.now() + 5000
  };
  showToast(`💬 <b>${data.senderName}:</b> ${data.text}`);
});

socket.on('missions_updated', (data) => {
  missions = data.missions;
  renderMissionsUI();
  showToast(`⭐ ¡${data.completedBy} completó "${data.missionTitle}"! (+${data.reward}🪙)`);
});

socket.on('player_stats_updated', (data) => {
  if (myPlayer && data.socketId === socket.id) {
    myPlayer.coins = data.coins;
    updateHUD();
  }
});

socket.on('player_vehicle_changed', (data) => {
  if (myPlayer && data.socketId === socket.id) {
    myPlayer.vehicle = data.vehicle;
  } else if (otherPlayers[data.socketId]) {
    otherPlayers[data.socketId].vehicle = data.vehicle;
  }
});

// Mensajes Rápidos para Celular (1 solo toque)
document.querySelectorAll('.quick-pill[data-msg]').forEach(pill => {
  pill.addEventListener('click', () => {
    vibrate(15);
    const msg = pill.getAttribute('data-msg');
    socket.emit('send_chat', msg);
  });
});

// Chat por Teclado
btnOpenTextChat.addEventListener('click', () => {
  vibrate(15);
  keyboardChatBar.classList.remove('hidden');
  chatInput.focus();
});

btnCloseChat.addEventListener('click', () => {
  keyboardChatBar.classList.add('hidden');
});

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (text.length > 0) {
    socket.emit('send_chat', text);
    chatInput.value = '';
    keyboardChatBar.classList.add('hidden');
  }
});

// Modales
btnToggleMissions.addEventListener('click', () => {
  vibrate(15);
  missionsModal.classList.toggle('hidden');
});
btnCloseMissions.addEventListener('click', () => missionsModal.classList.add('hidden'));

btnToggleVehicles.addEventListener('click', () => {
  vibrate(15);
  vehicleModal.classList.toggle('hidden');
});
btnCloseVehicles.addEventListener('click', () => vehicleModal.classList.add('hidden'));

document.querySelectorAll('.vehicle-card').forEach(card => {
  card.addEventListener('click', () => {
    vibrate(25);
    const v = card.getAttribute('data-vehicle');
    if (myPlayer) {
      myPlayer.vehicle = v;
      socket.emit('change_vehicle', v);
      vehicleModal.classList.add('hidden');
      showToast(`🛴 Ahora te mueves en: ${v.replace('_', ' ').toUpperCase()}`);
    }
  });
});

// ==========================================
// JOYSTICK VIRTUAL MÓVIL (TÁCTIL FLUIDO)
// ==========================================

let joystickActive = false;
let joystickTouchId = null;
const JOYSTICK_RADIUS = 45;

function handleJoystickStart(e) {
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
    joystickActive = true;
    joystickTouchId = touch.identifier;
    updateJoystick(touch.clientX, touch.clientY);
    break;
  }
}

function handleJoystickMove(e) {
  if (!joystickActive) return;
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
    if (touch.identifier === joystickTouchId) {
      updateJoystick(touch.clientX, touch.clientY);
      break;
    }
  }
}

function handleJoystickEnd(e) {
  if (!joystickActive) return;
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i].identifier === joystickTouchId) {
      resetJoystick();
      break;
    }
  }
}

function updateJoystick(touchX, touchY) {
  const rect = joystickBase.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let dx = touchX - centerX;
  let dy = touchY - centerY;
  const distance = Math.hypot(dx, dy);

  if (distance > JOYSTICK_RADIUS) {
    dx = (dx / distance) * JOYSTICK_RADIUS;
    dy = (dy / distance) * JOYSTICK_RADIUS;
  }

  joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;

  // Normalizar vector (-1 a 1)
  moveVector.x = dx / JOYSTICK_RADIUS;
  moveVector.y = dy / JOYSTICK_RADIUS;
}

function resetJoystick() {
  joystickActive = false;
  joystickTouchId = null;
  joystickStick.style.transform = `translate(0px, 0px)`;
  moveVector.x = 0;
  moveVector.y = 0;
}

joystickZone.addEventListener('touchstart', handleJoystickStart, { passive: false });
window.addEventListener('touchmove', handleJoystickMove, { passive: false });
window.addEventListener('touchend', handleJoystickEnd);
window.addEventListener('touchcancel', handleJoystickEnd);

// Soporte Mouse para Joystick (Pruebas en PC)
joystickZone.addEventListener('mousedown', (e) => {
  joystickActive = true;
  updateJoystick(e.clientX, e.clientY);
  const onMouseMove = (ev) => { if (joystickActive) updateJoystick(ev.clientX, ev.clientY); };
  const onMouseUp = () => {
    resetJoystick();
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
});

// Soporte Teclado para PC (WASD y Flechas)
window.addEventListener('keydown', (e) => {
  if (document.activeElement === chatInput) return;
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = true;
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = true;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
  if (e.key === 'e' || e.key === 'E') handleInteraction();
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = false;
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
});

// Botón de Acción Táctil
touchActionBtn.addEventListener('click', () => {
  vibrate(30);
  handleInteraction();
});

// Actualizar HUD
function updateHUD() {
  if (!myPlayer) return;
  playerCoinsVal.innerText = myPlayer.coins;
  familyVaultVal.innerText = familyVault.family_coins;
  userBadge.innerText = myPlayer.name;
}

function renderMissionsUI() {
  missionsListEl.innerHTML = '';
  let pendingCount = 0;

  missions.forEach(m => {
    if (m.status !== 'completada') pendingCount++;
    const item = document.createElement('div');
    item.className = `mission-item ${m.status === 'completada' ? 'completed' : ''}`;
    item.innerHTML = `
      <div class="mission-info">
        <h4>${m.title}</h4>
        <p>${m.description}</p>
        <span class="mission-reward">🪙 +${m.reward_coins} Monedas</span>
      </div>
      <div>
        ${m.status === 'completada'
          ? '<span style="color:#4ade80;font-weight:900;">✔ Lista</span>'
          : `<button class="btn-complete-m" onclick="triggerMissionComplete(${m.id})">Completar</button>`
        }
      </div>
    `;
    missionsListEl.appendChild(item);
  });

  pendingMissionsBadge.innerText = pendingCount;
}

window.triggerMissionComplete = function(id) {
  vibrate(25);
  socket.emit('complete_mission', id);
};

function showToast(html) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = html;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// Zonas Interactivas del Barrio
const interactiveZones = [
  { name: '🏡 Casa Az', x: 280, y: 220, radius: 75, prompt: 'Casa Familiar' },
  { name: '📋 Tablón', x: 700, y: 350, radius: 60, prompt: 'Misiones' },
  { name: '☕ Café Az', x: 1120, y: 220, radius: 75, prompt: 'Cafetería Dulce' },
  { name: '🚲 Garaje', x: 280, y: 720, radius: 70, prompt: 'Vehículos' },
  { name: '♻️ Reciclaje', x: 1120, y: 720, radius: 65, prompt: 'Separar Residuos' }
];

let currentNearbyZone = null;

function checkInteractions() {
  if (!myPlayer) return;
  currentNearbyZone = null;

  for (const zone of interactiveZones) {
    const dist = Math.hypot(myPlayer.x - zone.x, myPlayer.y - zone.y);
    if (dist <= zone.radius) {
      currentNearbyZone = zone;
      break;
    }
  }

  if (currentNearbyZone) {
    touchActionBtn.classList.add('highlight');
  } else {
    touchActionBtn.classList.remove('highlight');
  }
}

function handleInteraction() {
  if (!currentNearbyZone) {
    showToast('💡 Acércate a un lugar interactivo (Casa, Tablón, Café o Garaje).');
    return;
  }

  if (currentNearbyZone.name.includes('Tablón')) {
    missionsModal.classList.remove('hidden');
  } else if (currentNearbyZone.name.includes('Garaje')) {
    vehicleModal.classList.remove('hidden');
  } else if (currentNearbyZone.name.includes('Reciclaje')) {
    socket.emit('complete_mission', 2);
    showToast('🌱 ¡Monedas verdes ganadas por reciclar!');
  } else {
    showToast(`🔔 Visitaste: ${currentNearbyZone.name}`);
  }
}

// ==========================================
// BUCLE DE JUEGO Y CÁMARA DINÁMICA
// ==========================================

let lastMoveSent = 0;
let stepAnim = 0;
let trafficLightTimer = 0;

function update() {
  if (!myPlayer) return;

  let speed = 3.6;
  if (myPlayer.vehicle === 'patineta') speed = 5.8;
  if (myPlayer.vehicle === 'bicicleta') speed = 8.0;

  let vx = 0;
  let vy = 0;

  // Entrada Joystick Táctil
  if (joystickActive) {
    vx = moveVector.x * speed;
    vy = moveVector.y * speed;
  } else {
    // Entrada Teclado PC
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
    stepAnim += 0.22;
    myPlayer.x = Math.max(40, Math.min(WORLD_WIDTH - 40, myPlayer.x + vx));
    myPlayer.y = Math.max(40, Math.min(WORLD_HEIGHT - 40, myPlayer.y + vy));

    // Determinar dirección de la mirada
    if (Math.abs(vx) > Math.abs(vy)) {
      myPlayer.direction = vx > 0 ? 'right' : 'left';
    } else {
      myPlayer.direction = vy > 0 ? 'down' : 'up';
    }
  }

  myPlayer.isMoving = isMoving;

  // Actualizar Cámara centrada en el Jugador
  camera.x = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, myPlayer.x - canvas.width / 2));
  camera.y = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, myPlayer.y - canvas.height / 2));

  // Enviar posición a la familia (30 fps)
  const now = Date.now();
  if (now - lastMoveSent > 33) {
    socket.emit('player_move', {
      x: myPlayer.x,
      y: myPlayer.y,
      direction: myPlayer.direction,
      isMoving: myPlayer.isMoving,
      vehicle: myPlayer.vehicle
    });
    lastMoveSent = now;
  }

  checkInteractions();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  // Aplicar traslación de la Cámara
  ctx.translate(-camera.x, -camera.y);

  // 1. DIBUJAR MUNDO COMPLETO
  drawWorld();

  // 2. DIBUJAR JUGADORES REMOTOS
  for (const sId in otherPlayers) {
    drawCharacter(otherPlayers[sId], sId);
  }

  // 3. DIBUJAR JUGADOR LOCAL
  if (myPlayer) {
    drawCharacter(myPlayer, socket.id, true);
  }

  // 4. DIBUJAR BURBUJAS DE CHAT
  drawChatBubbles();

  ctx.restore();
}

function drawWorld() {
  trafficLightTimer += 0.02;

  // Aceras / Baldosas de base
  ctx.fillStyle = '#475569';
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Cuadrícula sutil
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  for (let x = 0; x < WORLD_WIDTH; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_HEIGHT); ctx.stroke();
  }
  for (let y = 0; y < WORLD_HEIGHT; y += 50) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_WIDTH, y); ctx.stroke();
  }

  // AVENIDA PRINCIPAL CENTRAL (Asfalto ancho)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 440, WORLD_WIDTH, 140);

  // Líneas amarillas de tránsito
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 5;
  ctx.setLineDash([25, 20]);
  ctx.beginPath();
  ctx.moveTo(0, 510);
  ctx.lineTo(WORLD_WIDTH, 510);
  ctx.stroke();
  ctx.setLineDash([]);

  // Pasos peatonales de cebra
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 9; i++) {
    ctx.fillRect(660 + i * 16, 445, 9, 130);
  }

  // PARQUE CENTRAL (Césped y árboles)
  ctx.fillStyle = '#15803d';
  ctx.fillRect(520, 650, 380, 260);
  ctx.strokeStyle = '#166534';
  ctx.lineWidth = 6;
  ctx.strokeRect(520, 650, 380, 260);

  // Fuente de agua animada
  const wave = Math.sin(trafficLightTimer * 3) * 4;
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(710, 780, 42 + wave, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 5;
  ctx.stroke();

  // Árboles en el parque
  drawTree(570, 700);
  drawTree(850, 700);
  drawTree(580, 860);
  drawTree(840, 860);

  // EDIFICIOS
  // 1. Casa Familiar Az
  drawBuilding(160, 100, 240, 160, '#b91c1c', '🏡 CASA FAMILIAR AZ');
  // 2. Cafetería Dulce Az
  drawBuilding(1000, 100, 240, 160, '#d97706', '☕ CAFÉ DULCE AZ');
  // 3. Garaje Tech & Bicis
  drawBuilding(160, 640, 220, 150, '#0284c7', '🚲 GARAJE DE MOVILIDAD');

  // Tablón de Misiones (Plaza central)
  ctx.fillStyle = '#78350f';
  ctx.fillRect(675, 330, 50, 40);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(680, 335, 40, 30);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px Nunito';
  ctx.fillText('📋', 690, 356);

  // Contenedor de Reciclaje
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(1100, 700, 44, 46);
  ctx.fillStyle = '#ffffff';
  ctx.font = '22px Nunito';
  ctx.fillText('♻️', 1110, 732);

  // Semáforo Inteligente
  drawTrafficLight(610, 410);

  // Farolas
  drawStreetLamp(520, 390);
  drawStreetLamp(880, 390);
}

function drawBuilding(x, y, w, h, roofColor, label) {
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(x, y + 40, w, h - 40);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y + 40, w, h - 40);

  // Tejado
  ctx.fillStyle = roofColor;
  ctx.fillRect(x - 8, y, w + 16, 42);
  ctx.strokeRect(x - 8, y, w + 16, 42);

  // Ventanas
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(x + 24, y + 60, 42, 34);
  ctx.fillRect(x + w - 66, y + 60, 42, 34);

  // Puerta
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x + w / 2 - 24, y + h - 56, 48, 56);

  // Cartel
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + w / 2 - 75, y + 10, 150, 24);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px Nunito';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + 26);
  ctx.textAlign = 'start';
}

function drawTree(x, y) {
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x - 7, y, 14, 24);
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(x, y - 8, 28, 0, Math.PI * 2);
  ctx.fill();
}

function drawTrafficLight(x, y) {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x, y, 18, 42);
  const phase = Math.floor(trafficLightTimer % 6);
  ctx.fillStyle = phase < 3 ? '#ef4444' : '#551515';
  ctx.beginPath(); ctx.arc(x + 9, y + 11, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = phase >= 3 ? '#22c55e' : '#143818';
  ctx.beginPath(); ctx.arc(x + 9, y + 31, 6, 0, Math.PI * 2); ctx.fill();
}

function drawStreetLamp(x, y) {
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y + 45);
  ctx.lineTo(x, y);
  ctx.stroke();

  // Foco con halo
  ctx.fillStyle = 'rgba(254, 240, 138, 0.3)';
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();
}

// Dibujo de Personajes
function drawCharacter(p, socketId, isSelf = false) {
  const x = p.x;
  const y = p.y;

  // Sombra
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + 18, 18, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Vehículo
  if (p.vehicle === 'patineta') {
    ctx.fillStyle = '#f97316';
    ctx.fillRect(x - 18, y + 14, 36, 6);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 15, y + 20, 6, 4);
    ctx.fillRect(x + 9, y + 20, 6, 4);
  } else if (p.vehicle === 'bicicleta') {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x - 16, y + 14, 8, 0, Math.PI * 2);
    ctx.arc(x + 16, y + 14, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 16, y + 14);
    ctx.lineTo(x, y + 4);
    ctx.lineTo(x + 16, y + 14);
    ctx.stroke();
  }

  const bob = (p.isMoving ? Math.sin(stepAnim) * 3 : 0);

  let shirtColor = '#3b82f6';
  let hairColor = '#451a03';
  let badgeBorder = '#60a5fa';

  if (p.id === 'diegoaz_jr') {
    shirtColor = '#f97316';
    hairColor = '#0f172a';
    badgeBorder = '#fb923c';
  } else if (p.id === 'vicky_vicky') {
    shirtColor = '#ec4899';
    hairColor = '#ca8a04';
    badgeBorder = '#f472b6';
  }

  // Piernas
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x - 8, y + 6 + bob, 6, 13);
  ctx.fillRect(x + 2, y + 6 - bob, 6, 13);

  // Torso
  ctx.fillStyle = shirtColor;
  ctx.fillRect(x - 12, y - 10 + bob, 24, 18);

  // Cabeza
  ctx.fillStyle = '#fed7aa';
  ctx.fillRect(x - 10, y - 28 + bob, 20, 18);

  // Pelo
  ctx.fillStyle = hairColor;
  ctx.fillRect(x - 11, y - 32 + bob, 22, 8);

  if (p.id === 'vicky_vicky') {
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x + 7, y - 34 + bob, 7, 7); // lazo
  }

  if (p.id === 'diegoaz_jr') {
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(x - 12, y - 32 + bob, 24, 5); // gorra
  }

  // Ojos
  ctx.fillStyle = '#0f172a';
  if (p.direction === 'down') {
    ctx.fillRect(x - 5, y - 20 + bob, 3, 4);
    ctx.fillRect(x + 2, y - 20 + bob, 3, 4);
  } else if (p.direction === 'left') {
    ctx.fillRect(x - 8, y - 20 + bob, 3, 4);
  } else if (p.direction === 'right') {
    ctx.fillRect(x + 5, y - 20 + bob, 3, 4);
  }

  // Etiqueta con Nombre
  ctx.font = 'bold 12px Nunito';
  ctx.textAlign = 'center';
  const nameWidth = ctx.measureText(p.name).width + 16;
  ctx.fillStyle = isSelf ? 'rgba(30, 58, 138, 0.9)' : 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(x - nameWidth / 2, y - 56 + bob, nameWidth, 20);
  ctx.strokeStyle = badgeBorder;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - nameWidth / 2, y - 56 + bob, nameWidth, 20);

  ctx.fillStyle = '#ffffff';
  ctx.fillText(p.name, x, y - 42 + bob);
  ctx.textAlign = 'start';
}

function drawChatBubbles() {
  const now = Date.now();
  for (const sId in activeChatBubbles) {
    const bubble = activeChatBubbles[sId];
    if (now > bubble.expires) {
      delete activeChatBubbles[sId];
      continue;
    }

    let p = (sId === socket.id ? myPlayer : otherPlayers[sId]);
    if (p) {
      const bx = p.x;
      const by = p.y - 70;

      ctx.font = 'bold 13px Nunito';
      ctx.textAlign = 'center';
      const textWidth = ctx.measureText(bubble.text).width + 20;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(bx - textWidth / 2, by - 18, textWidth, 26, 10);
      ctx.fill();

      // Flecha
      ctx.beginPath();
      ctx.moveTo(bx - 5, by + 8);
      ctx.lineTo(bx + 5, by + 8);
      ctx.lineTo(bx, by + 14);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.fillText(bubble.text, bx, by);
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
