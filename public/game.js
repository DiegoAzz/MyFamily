// ==========================================
// EL BARRIO AZ - MOTOR DE JUEGO MULTIJUGADOR
// ==========================================

const socket = io();

// Elementos DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const modalSelect = document.getElementById('character-select-modal');
const gameContainer = document.getElementById('game-container');
const btnStart = document.getElementById('btn-start-game');
const charCards = document.querySelectorAll('.char-card');
const userBadge = document.getElementById('active-user-badge');
const playerCoinsVal = document.getElementById('player-coins-val');
const familyVaultVal = document.getElementById('family-vault-val');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const promptBubble = document.getElementById('interaction-prompt');
const promptText = document.getElementById('prompt-text');
const missionsModal = document.getElementById('missions-modal');
const btnToggleMissions = document.getElementById('btn-toggle-missions');
const btnCloseMissions = document.getElementById('btn-close-missions');
const missionsListEl = document.getElementById('missions-list');
const pendingMissionsBadge = document.getElementById('pending-missions-badge');
const vehicleModal = document.getElementById('vehicle-modal');
const btnToggleVehicles = document.getElementById('btn-toggle-vehicles');
const btnCloseVehicles = document.getElementById('btn-close-vehicles');
const toastContainer = document.getElementById('toast-container');

// Estado del Jugador Local
let selectedCharId = 'diegoaz';
let myPlayer = null;
let otherPlayers = {};
let missions = [];
let familyVault = { family_coins: 500 };
let activeChatBubbles = {}; // { socketId: { text, expires } }

// Controles de entrada
const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
  interact: false
};

// Selección de Personajes en el Lobby
charCards.forEach(card => {
  card.addEventListener('click', () => {
    charCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    selectedCharId = card.getAttribute('data-char');
  });
});

btnStart.addEventListener('click', () => {
  modalSelect.classList.add('hidden');
  gameContainer.classList.remove('hidden');

  socket.emit('join_game', { characterId: selectedCharId });
});

// Eventos de Socket.io
socket.on('init_state', (data) => {
  myPlayer = data.self;
  otherPlayers = {};
  for (const sId in data.players) {
    if (sId !== socket.id) {
      otherPlayers[sId] = data.players[sId];
    }
  }
  missions = data.missions || [];
  familyVault = data.vault || { family_coins: 500 };

  updateHUD();
  renderMissionsUI();
  showToast(`🎉 ¡Bienvenido al Barrio Az, ${myPlayer.name}!`);
});

socket.on('player_joined', (player) => {
  if (player.socketId !== socket.id) {
    otherPlayers[player.socketId] = player;
    showToast(`👋 ${player.name} acaba de entrar al barrio.`);
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
    showToast(`🚪 ${otherPlayers[data.socketId].name} se desconectó.`);
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
  showToast(`⭐ ¡${data.completedBy} completó la misión "${data.missionTitle}"! (+${data.reward} monedas)`);
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

// Chat Form
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (text.length > 0) {
    socket.emit('send_chat', text);
    chatInput.value = '';
  }
});

// Emojis rápidos
document.querySelectorAll('.emoji-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    socket.emit('send_chat', btn.getAttribute('data-emoji'));
  });
});

// Modales
btnToggleMissions.addEventListener('click', () => missionsModal.classList.toggle('hidden'));
btnCloseMissions.addEventListener('click', () => missionsModal.classList.add('hidden'));

btnToggleVehicles.addEventListener('click', () => vehicleModal.classList.toggle('hidden'));
btnCloseVehicles.addEventListener('click', () => vehicleModal.classList.add('hidden'));

document.querySelectorAll('.vehicle-card').forEach(card => {
  card.addEventListener('click', () => {
    const v = card.getAttribute('data-vehicle');
    if (myPlayer) {
      myPlayer.vehicle = v;
      socket.emit('change_vehicle', v);
      vehicleModal.classList.add('hidden');
      showToast(`🛴 Ahora te mueves en: ${v.replace('_', ' ').toUpperCase()}`);
    }
  });
});

// Control de Teclado
window.addEventListener('keydown', (e) => {
  if (document.activeElement === chatInput) return; // Si escribe en chat, no mover

  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = true;
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = true;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;

  if (e.key === 'e' || e.key === 'E') {
    handleInteraction();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = false;
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
});

// Controles Táctiles (Mobile/Tablet)
document.querySelectorAll('.dpad-btn').forEach(btn => {
  const dir = btn.getAttribute('data-dir');
  const startHandler = (e) => { e.preventDefault(); keys[dir] = true; };
  const endHandler = (e) => { e.preventDefault(); keys[dir] = false; };

  btn.addEventListener('touchstart', startHandler);
  btn.addEventListener('touchend', endHandler);
  btn.addEventListener('mousedown', startHandler);
  btn.addEventListener('mouseup', endHandler);
});

document.getElementById('touch-action-btn').addEventListener('click', () => {
  handleInteraction();
});

// Actualizaciones de HUD
function updateHUD() {
  if (!myPlayer) return;
  playerCoinsVal.innerText = myPlayer.coins;
  familyVaultVal.innerText = familyVault.family_coins;
  userBadge.innerText = `${myPlayer.name} (${myPlayer.role})`;
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
          ? '<span style="color:#4ade80;font-weight:bold;">✔ ¡Lista!</span>' 
          : `<button class="btn-complete-m" onclick="triggerMissionComplete(${m.id})">Completar</button>`
        }
      </div>
    `;
    missionsListEl.appendChild(item);
  });

  pendingMissionsBadge.innerText = pendingCount;
}

window.triggerMissionComplete = function(id) {
  socket.emit('complete_mission', id);
};

function showToast(html) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = html;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4500);
}

// Zonas Interactivas del Barrio
const interactiveZones = [
  { name: '🏡 Casa Familiar Az', x: 200, y: 190, radius: 60, prompt: 'Entrar a la Casa Familiar' },
  { name: '📋 Tablón de Misiones', x: 480, y: 250, radius: 45, prompt: 'Abrir Tablón de Misiones' },
  { name: '☕ Cafetería Dulce Az', x: 740, y: 190, radius: 60, prompt: 'Comprar refrigerio en el Café' },
  { name: '🚲 Garaje de Bicis & Skates', x: 230, y: 470, radius: 55, prompt: 'Cambiar de Transporte' },
  { name: '♻️ Contenedor de Reciclaje', x: 750, y: 460, radius: 45, prompt: 'Depositar Reciclaje (+Monedas)' }
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
    promptText.innerText = currentNearbyZone.prompt;
    promptBubble.classList.remove('hidden');
  } else {
    promptBubble.classList.add('hidden');
  }
}

function handleInteraction() {
  if (!currentNearbyZone) return;
  if (currentNearbyZone.name.includes('Tablón')) {
    missionsModal.classList.remove('hidden');
  } else if (currentNearbyZone.name.includes('Garaje')) {
    vehicleModal.classList.remove('hidden');
  } else if (currentNearbyZone.name.includes('Reciclaje')) {
    // Misión 2 automática
    socket.emit('complete_mission', 2);
    showToast('🌱 ¡Separaste el reciclaje correctamente! Ganaste monedas ecológicas.');
  } else {
    showToast(`🔔 Interactuaste con: ${currentNearbyZone.name}`);
  }
}

// ==========================================
// BUCLE DE RENDERIZADO Y DIBUJO (CANVAS 2D)
// ==========================================

let lastMoveSent = 0;
let stepAnim = 0;
let trafficLightTimer = 0;

function update() {
  if (!myPlayer) return;

  let speed = 3.2;
  if (myPlayer.vehicle === 'patineta') speed = 5.2;
  if (myPlayer.vehicle === 'bicicleta') speed = 7.0;

  let vx = 0;
  let vy = 0;

  if (keys.up) { vy -= speed; myPlayer.direction = 'up'; }
  if (keys.down) { vy += speed; myPlayer.direction = 'down'; }
  if (keys.left) { vx -= speed; myPlayer.direction = 'left'; }
  if (keys.right) { vx += speed; myPlayer.direction = 'right'; }

  const isMoving = vx !== 0 || vy !== 0;

  if (isMoving) {
    stepAnim += 0.2;
    // Normalizar diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    myPlayer.x = Math.max(30, Math.min(canvas.width - 30, myPlayer.x + vx));
    myPlayer.y = Math.max(30, Math.min(canvas.height - 30, myPlayer.y + vy));
  }

  myPlayer.isMoving = isMoving;

  // Enviar posición a los demás jugadores a 30fps
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

  // 1. DIBUJAR EL BARRIO URBANO
  drawUrbanBackground();

  // 2. DIBUJAR JUGADORES REMOTOS
  for (const sId in otherPlayers) {
    drawCharacter(otherPlayers[sId], sId);
  }

  // 3. DIBUJAR JUGADOR LOCAL
  if (myPlayer) {
    drawCharacter(myPlayer, socket.id, true);
  }

  // 4. DIBUJAR BURBUJAS DE DIÁLOGO
  drawChatBubbles();
}

function drawUrbanBackground() {
  trafficLightTimer += 0.02;

  // Aceras / Suelo Base
  ctx.fillStyle = '#64748b'; // Baldosa urbana
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Cuadrícula de baldosas de acera sutil
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  // AVENIDA PRINCIPAL (Asfalto)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 300, canvas.width, 100);

  // Líneas de calle amarillas discontinuas
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 4;
  ctx.setLineDash([20, 15]);
  ctx.beginPath();
  ctx.moveTo(0, 350);
  ctx.lineTo(canvas.width, 350);
  ctx.stroke();
  ctx.setLineDash([]); // Reset

  // Pasos peatonales de cebra
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(450 + i * 14, 305, 8, 90);
  }

  // PARQUE CENTRAL ECOLÓGICO (Césped)
  ctx.fillStyle = '#15803d';
  ctx.fillRect(400, 430, 260, 180);
  ctx.strokeStyle = '#166534';
  ctx.lineWidth = 4;
  ctx.strokeRect(400, 430, 260, 180);

  // Fuente de agua animada en el parque
  const waterPulse = Math.sin(trafficLightTimer * 3) * 3;
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(530, 520, 32 + waterPulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Árboles en el parque
  drawTree(430, 460);
  drawTree(630, 460);
  drawTree(440, 570);
  drawTree(620, 570);

  // EDIFICIOS

  // 1. Casa Familiar Az
  drawBuilding(110, 80, 180, 130, '#b91c1c', '🏡 CASA AZ');
  // 2. Cafetería Dulce Az
  drawBuilding(660, 80, 180, 130, '#d97706', '☕ CAFÉ AZ');
  // 3. Taller / Garaje de Diegoaz Jr.
  drawBuilding(110, 440, 160, 120, '#0369a1', '🔧 TALLER JR');

  // Tablón de Misiones (Plaza)
  ctx.fillStyle = '#78350f';
  ctx.fillRect(460, 220, 40, 30);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(465, 225, 30, 20);
  ctx.fillStyle = '#0f172a';
  ctx.font = '10px monospace';
  ctx.fillText('📋', 473, 240);

  // Contenedor ecológico de reciclaje
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(735, 440, 32, 34);
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px monospace';
  ctx.fillText('♻️', 742, 464);

  // Semáforo Inteligente
  drawTrafficLight(410, 280);

  // Farolas urbanas con luz cálida
  drawStreetLamp(360, 260);
  drawStreetLamp(600, 260);
}

function drawBuilding(x, y, w, h, roofColor, label) {
  // Fachada
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(x, y + 35, w, h - 35);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y + 35, w, h - 35);

  // Tejado / Cornisa
  ctx.fillStyle = roofColor;
  ctx.fillRect(x - 6, y, w + 12, 35);
  ctx.strokeRect(x - 6, y, w + 12, 35);

  // Ventanas
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(x + 20, y + 50, 32, 28);
  ctx.fillRect(x + w - 52, y + 50, 32, 28);

  // Puerta
  ctx.fillStyle = '#92400e';
  ctx.fillRect(x + w / 2 - 18, y + h - 45, 36, 45);

  // Rótulo / Letrero
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + w / 2 - 50, y + 10, 100, 20);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 11px Nunito';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + 24);
  ctx.textAlign = 'start';
}

function drawTree(x, y) {
  // Tronco
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x - 5, y, 10, 18);
  // Copa de hojas
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(x, y - 6, 20, 0, Math.PI * 2);
  ctx.fill();
}

function drawTrafficLight(x, y) {
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x, y, 14, 30);
  const phase = Math.floor(trafficLightTimer % 6);
  // Rojo
  ctx.fillStyle = phase < 3 ? '#ef4444' : '#551515';
  ctx.beginPath(); ctx.arc(x + 7, y + 8, 4, 0, Math.PI * 2); ctx.fill();
  // Verde
  ctx.fillStyle = phase >= 3 ? '#22c55e' : '#143818';
  ctx.beginPath(); ctx.arc(x + 7, y + 22, 4, 0, Math.PI * 2); ctx.fill();
}

function drawStreetLamp(x, y) {
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y + 35);
  ctx.lineTo(x, y);
  ctx.stroke();

  // Foco
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
}

// Dibujo de Personaje Pixel Art con Sombras y Vehículos
function drawCharacter(p, socketId, isSelf = false) {
  const x = p.x;
  const y = p.y;

  // 1. Sombra en el suelo
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(x, y + 14, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Vehículo (si tiene equipado)
  if (p.vehicle === 'patineta') {
    ctx.fillStyle = '#f97316';
    ctx.fillRect(x - 14, y + 10, 28, 5);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 12, y + 14, 5, 3);
    ctx.fillRect(x + 7, y + 14, 5, 3);
  } else if (p.vehicle === 'bicicleta') {
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x - 12, y + 10, 6, 0, Math.PI * 2);
    ctx.arc(x + 12, y + 10, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 12, y + 10);
    ctx.lineTo(x, y + 2);
    ctx.lineTo(x + 12, y + 10);
    ctx.stroke();
  }

  // 3. Animación de paso
  const bob = (p.isMoving ? Math.sin(stepAnim) * 2.5 : 0);

  // Colores por personaje
  let shirtColor = '#3b82f6'; // Papa
  let hairColor = '#451a03';
  let badgeColor = '#60a5fa';

  if (p.id === 'diegoaz_jr') {
    shirtColor = '#f97316'; // Naranja
    hairColor = '#1e293b';
    badgeColor = '#fb923c';
  } else if (p.id === 'vicky_vicky') {
    shirtColor = '#ec4899'; // Rosa/Verde
    hairColor = '#ca8a04';
    badgeColor = '#f472b6';
  }

  // Piernas
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(x - 6, y + 4 + bob, 4, 10);
  ctx.fillRect(x + 2, y + 4 - bob, 4, 10);

  // Torso / Ropa
  ctx.fillStyle = shirtColor;
  ctx.fillRect(x - 9, y - 8 + bob, 18, 14);

  // Cabeza
  ctx.fillStyle = '#fed7aa'; // Piel
  ctx.fillRect(x - 7, y - 22 + bob, 14, 14);

  // Cabello
  ctx.fillStyle = hairColor;
  ctx.fillRect(x - 8, y - 25 + bob, 16, 6);

  // Si es Vicky: Lazo decorativo
  if (p.id === 'vicky_vicky') {
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x + 5, y - 26 + bob, 5, 5);
  }

  // Si es Diegoaz Jr: Gorra o cascos
  if (p.id === 'diegoaz_jr') {
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(x - 9, y - 25 + bob, 18, 4);
  }

  // Ojos según dirección
  ctx.fillStyle = '#0f172a';
  if (p.direction === 'down') {
    ctx.fillRect(x - 4, y - 16 + bob, 2, 3);
    ctx.fillRect(x + 2, y - 16 + bob, 2, 3);
  } else if (p.direction === 'left') {
    ctx.fillRect(x - 6, y - 16 + bob, 2, 3);
  } else if (p.direction === 'right') {
    ctx.fillRect(x + 4, y - 16 + bob, 2, 3);
  }

  // 4. Etiqueta con Nombre arriba de la cabeza
  ctx.font = 'bold 11px Nunito';
  ctx.textAlign = 'center';

  // Fondo de la etiqueta
  const nameWidth = ctx.measureText(p.name).width + 12;
  ctx.fillStyle = isSelf ? 'rgba(30, 58, 138, 0.85)' : 'rgba(15, 23, 42, 0.75)';
  ctx.fillRect(x - nameWidth / 2, y - 44 + bob, nameWidth, 16);
  ctx.strokeStyle = badgeColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - nameWidth / 2, y - 44 + bob, nameWidth, 16);

  // Texto del nombre
  ctx.fillStyle = '#ffffff';
  ctx.fillText(p.name, x, y - 32 + bob);
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

    let p = null;
    if (sId === socket.id) p = myPlayer;
    else p = otherPlayers[sId];

    if (p) {
      const bx = p.x;
      const by = p.y - 56;

      ctx.font = 'bold 12px Nunito';
      ctx.textAlign = 'center';
      const textWidth = ctx.measureText(bubble.text).width + 16;

      // Globo blanco
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(bx - textWidth / 2, by - 16, textWidth, 22, 8);
      ctx.fill();

      // Flechita del globo
      ctx.beginPath();
      ctx.moveTo(bx - 4, by + 6);
      ctx.lineTo(bx + 4, by + 6);
      ctx.lineTo(bx, by + 11);
      ctx.fill();

      // Texto
      ctx.fillStyle = '#0f172a';
      ctx.fillText(bubble.text, bx, by);
      ctx.textAlign = 'start';
    }
  }
}

// Bucle principal
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
