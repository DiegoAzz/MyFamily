// =========================================================
// COME-FRUTAS EN FAMILIA: ARENA GLOTONA - CLIENT ENGINE
// Fácil, Interactivo, Tierno, Con Voz y Multijugador en Vivo
// =========================================================

const socket = io({
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 30
});

// Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// DOM Elements
const selectModal = document.getElementById('character-select-modal');
const gameContainer = document.getElementById('game-container');
const btnStartParty = document.getElementById('btn-start-party');
const heroCards = document.querySelectorAll('.hero-card');

const hudPlayerName = document.getElementById('hud-player-name');
const hudCoinsVal = document.getElementById('hud-coins-val');
const hudScoreVal = document.getElementById('hud-score-val');
const hudAvatarMini = document.getElementById('hud-avatar-mini');

const didacticBanner = document.getElementById('didactic-banner');
const btnRepeatVoice = document.getElementById('btn-repeat-voice');
const challengePromptText = document.getElementById('challenge-prompt-text');
const leaderboardList = document.getElementById('leaderboard-list');

const partyToast = document.getElementById('party-toast');
const toastTitle = document.getElementById('toast-title');
const toastDesc = document.getElementById('toast-desc');

const btnTurboBoost = document.getElementById('btn-turbo-boost');
const joystickThumb = document.getElementById('joystick-thumb');

// =========================================================
// SISTEMA DE AUDIO (EFECTOS SINTETIZADOS Y MÚSICA MARIMBA)
// =========================================================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let musicInterval = null;
let musicStep = 0;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSfx(type) {
  try {
    initAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'eat') {
      // Mordisco pop dulce
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'boing') {
      // Rebote cómico entre jugadores
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(380, now + 0.12);
      osc.frequency.linearRampToValueAtTime(220, now + 0.22);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
    } else if (type === 'correct') {
      // Fanfarria alegre de acierto
      [523, 659, 783, 1046].forEach((f, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(f, now + idx * 0.07);
        g.gain.setValueAtTime(0.2, now + idx * 0.07);
        g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.24);
        o.start(now + idx * 0.07); o.stop(now + idx * 0.07 + 0.24);
      });
    } else if (type === 'turbo') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.2);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
    }
  } catch (e) {}
}

// Melodía suave y alegre de xilófono / marimba para niños
function startCheerfulMusic() {
  if (musicInterval) clearInterval(musicInterval);
  const notes = [523, 587, 659, 698, 783, 880, 783, 659, 587, 659, 783, 880, 1046, 880, 783, 659];
  musicInterval = setInterval(() => {
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const freq = notes[musicStep % notes.length];
      musicStep++;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.22);
      osc.start(now); osc.stop(now + 0.22);
    } catch (e) {}
  }, 320);
}

// Vibración háptica en móvil
function triggerHaptic(ms = 25) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(ms); } catch (e) {}
  }
}

function triggerShake() {
  if (gameContainer) {
    gameContainer.classList.remove('screen-shake');
    void gameContainer.offsetWidth;
    gameContainer.classList.add('screen-shake');
    setTimeout(() => { gameContainer.classList.remove('screen-shake'); }, 220);
  }
}

// =========================================================
// SISTEMA DE VOZ DIDÁCTICA (TEXT-TO-SPEECH)
// =========================================================
let currentVoicePrompt = '¡Come frutas y burbujas con números para crecer!';
let spanishVoices = [];

function loadVoices() {
  if ('speechSynthesis' in window) {
    spanishVoices = window.speechSynthesis.getVoices().filter(v =>
      v.lang && (v.lang.toLowerCase().startsWith('es') || v.lang.includes('ES'))
    );
  }
}
if ('speechSynthesis' in window) {
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

function speak(text, pitch = 1.18, rate = 0.95) {
  currentVoicePrompt = text;
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'es-ES';
    utter.pitch = pitch;
    utter.rate = rate;

    if (!spanishVoices.length) loadVoices();
    if (spanishVoices.length > 0) {
      const friendly = spanishVoices.find(v => /sabina|monica|paulina|lucia|laura|helena|spanish/i.test(v.name)) || spanishVoices[0];
      if (friendly) utter.voice = friendly;
    }

    const speaker = document.querySelector('.speaker-icon');
    if (speaker) speaker.classList.add('talking');
    utter.onend = () => { if (speaker) speaker.classList.remove('talking'); };
    utter.onerror = () => { if (speaker) speaker.classList.remove('talking'); };

    window.speechSynthesis.speak(utter);
  } catch (e) {}
}

btnRepeatVoice.addEventListener('click', () => {
  speak(currentVoicePrompt);
});

// =========================================================
// PERSONAJES Y ESTADO
// =========================================================
let selectedHeroId = 'diegoaz_jr';

const HERO_DATA = {
  diegoaz_jr: {
    id: 'diegoaz_jr',
    name: 'Diego Jr.',
    role: 'Glotón Amarillo (4 años)',
    primaryColor: '#facc15',
    secondaryColor: '#38bdf8',
    cheekColor: '#f87171',
    faceStyle: 'jr_cute'
  },
  vicky_vicky: {
    id: 'vicky_vicky',
    name: 'Vicky Vicky',
    role: 'Cazadora Rosa (10 años)',
    primaryColor: '#f43f5e',
    secondaryColor: '#06b6d4',
    cheekColor: '#fda4af',
    faceStyle: 'vicky_star'
  },
  diegoaz: {
    id: 'diegoaz',
    name: 'Diego (Papá)',
    role: 'Glotón Esmeralda (Papá)',
    primaryColor: '#10b981',
    secondaryColor: '#f59e0b',
    cheekColor: '#34d399',
    faceStyle: 'dad_glasses'
  }
};

let myPlayer = {
  x: 1200,
  y: 900,
  vx: 0,
  vy: 0,
  speed: 4.8,
  baseSpeed: 4.8,
  turboSpeed: 8.5,
  isTurbo: false,
  size: 48,
  angle: 0,
  mouthOpen: 0,
  score: 0,
  coins: 100,
  bubblesTrail: []
};

let otherPlayers = {};
let foodItems = [];
let particles = [];
let ARENA_W = 2600;
let ARENA_H = 1800;

// Renderizar avatares en la selección
function renderPreviewCanvases() {
  ['diegoaz_jr', 'vicky_vicky', 'diegoaz'].forEach(id => {
    const el = document.getElementById(id === 'diegoaz_jr' ? 'prev-diego-jr' : (id === 'vicky_vicky' ? 'prev-vicky' : 'prev-diego'));
    if (el) {
      const c = el.getContext('2d');
      c.clearRect(0, 0, 80, 80);
      drawGlotonAvatar(c, 40, 40, 32, HERO_DATA[id], 0, 0.4);
    }
  });
}
renderPreviewCanvases();

heroCards.forEach(card => {
  card.addEventListener('click', () => {
    heroCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    selectedHeroId = card.getAttribute('data-id');
    initAudio();
    playSfx('eat');
  });
});

btnStartParty.addEventListener('click', () => {
  initAudio();
  playSfx('correct');
  startCheerfulMusic();

  const hero = HERO_DATA[selectedHeroId];
  hudPlayerName.innerText = hero.name;

  // Renderizar mini avatar en el HUD
  const hctx = hudAvatarMini.getContext('2d');
  hctx.clearRect(0, 0, 36, 36);
  drawGlotonAvatar(hctx, 18, 18, 15, hero, 0, 0);

  selectModal.classList.add('hidden');
  gameContainer.classList.remove('hidden');
  resizeCanvas();

  socket.emit('join_game', { characterId: selectedHeroId });

  if (selectedHeroId === 'diegoaz_jr') {
    speak('¡Hola Diego Junior! Mueve tu dedito para comer frutas y burbujas.');
  } else {
    speak('¡A comer frutas en familia!');
  }
});

// =========================================================
// RENDERIZADO DEL AVATAR GLOTÓN CON EXPRESIONES TIERNAS
// =========================================================
function drawGlotonAvatar(pctx, x, y, radius, hero, angle = 0, mouthAmount = 0) {
  pctx.save();
  pctx.translate(x, y);
  pctx.rotate(angle);

  // Sombra suave en el suelo
  pctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  pctx.beginPath();
  pctx.arc(0, radius * 0.15, radius * 1.05, 0, Math.PI * 2);
  pctx.fill();

  // Cuerpo circular suave
  const bodyGrad = pctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.1, 0, 0, radius);
  bodyGrad.addColorStop(0, '#ffffff');
  bodyGrad.addColorStop(0.35, hero.primaryColor);
  bodyGrad.addColorStop(1, hero.secondaryColor || hero.primaryColor);

  pctx.fillStyle = bodyGrad;
  pctx.beginPath();
  pctx.arc(0, 0, radius, 0, Math.PI * 2);
  pctx.fill();

  pctx.strokeStyle = '#ffffff';
  pctx.lineWidth = Math.max(2, radius * 0.08);
  pctx.stroke();

  // Mejillas sonrosadas tiernas
  pctx.fillStyle = hero.cheekColor || '#f87171';
  pctx.beginPath();
  pctx.arc(-radius * 0.5, radius * 0.2, radius * 0.2, 0, Math.PI * 2);
  pctx.arc(radius * 0.5, radius * 0.2, radius * 0.2, 0, Math.PI * 2);
  pctx.fill();

  // Ojos grandes animados y expresivos
  const eyeOffsetX = radius * 0.3;
  const eyeOffsetY = -radius * 0.2;
  const eyeRadius = radius * 0.22;

  // Blanco de los ojos
  pctx.fillStyle = '#ffffff';
  pctx.beginPath();
  pctx.arc(-eyeOffsetX, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
  pctx.arc(eyeOffsetX, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
  pctx.fill();

  // Pupilas brillantes
  pctx.fillStyle = '#0f172a';
  pctx.beginPath();
  pctx.arc(-eyeOffsetX + 1.5, eyeOffsetY, eyeRadius * 0.65, 0, Math.PI * 2);
  pctx.arc(eyeOffsetX + 1.5, eyeOffsetY, eyeRadius * 0.65, 0, Math.PI * 2);
  pctx.fill();

  // Brillo en los ojos
  pctx.fillStyle = '#ffffff';
  pctx.beginPath();
  pctx.arc(-eyeOffsetX + 2.5, eyeOffsetY - 1.5, eyeRadius * 0.25, 0, Math.PI * 2);
  pctx.arc(eyeOffsetX + 2.5, eyeOffsetY - 1.5, eyeRadius * 0.25, 0, Math.PI * 2);
  pctx.fill();

  // Boca que se abre para comer (Nom Nom)
  if (mouthAmount > 0.05) {
    pctx.fillStyle = '#881337';
    pctx.beginPath();
    pctx.arc(0, radius * 0.28, radius * (0.2 + mouthAmount * 0.35), 0, Math.PI);
    pctx.fill();

    // Lengüita tierna
    pctx.fillStyle = '#fb7185';
    pctx.beginPath();
    pctx.arc(0, radius * 0.45, radius * 0.16, 0, Math.PI);
    pctx.fill();
  } else {
    // Sonrisita feliz
    pctx.strokeStyle = '#0f172a';
    pctx.lineWidth = Math.max(2, radius * 0.08);
    pctx.beginPath();
    pctx.arc(0, radius * 0.25, radius * 0.25, 0.1 * Math.PI, 0.9 * Math.PI);
    pctx.stroke();
  }

  // Detalles únicos de cada personaje
  if (hero.faceStyle === 'jr_cute') {
    // Coronita o antenita tierna de Diego Jr.
    pctx.fillStyle = '#fde047';
    pctx.beginPath();
    pctx.moveTo(-radius * 0.3, -radius * 0.85);
    pctx.lineTo(-radius * 0.15, -radius * 1.15);
    pctx.lineTo(0, -radius * 0.95);
    pctx.lineTo(radius * 0.15, -radius * 1.15);
    pctx.lineTo(radius * 0.3, -radius * 0.85);
    pctx.closePath();
    pctx.fill();
    pctx.strokeStyle = '#ca8a04';
    pctx.lineWidth = 1.5;
    pctx.stroke();
  } else if (hero.faceStyle === 'vicky_star') {
    // Lazito de Vicky
    pctx.fillStyle = '#ec4899';
    pctx.beginPath();
    pctx.arc(radius * 0.45, -radius * 0.7, radius * 0.22, 0, Math.PI * 2);
    pctx.fill();
    pctx.fillStyle = '#ffffff';
    pctx.beginPath();
    pctx.arc(radius * 0.45, -radius * 0.7, radius * 0.08, 0, Math.PI * 2);
    pctx.fill();
  } else if (hero.faceStyle === 'dad_glasses') {
    // Gafas y bigotito de Diego Papá
    pctx.strokeStyle = '#1e293b';
    pctx.lineWidth = 2.5;
    pctx.strokeRect(-eyeOffsetX - eyeRadius * 0.9, eyeOffsetY - eyeRadius * 0.9, eyeRadius * 1.8, eyeRadius * 1.8);
    pctx.strokeRect(eyeOffsetX - eyeRadius * 0.9, eyeOffsetY - eyeRadius * 0.9, eyeRadius * 1.8, eyeRadius * 1.8);
    pctx.beginPath();
    pctx.moveTo(-eyeOffsetX + eyeRadius * 0.9, eyeOffsetY);
    pctx.lineTo(eyeOffsetX - eyeRadius * 0.9, eyeOffsetY);
    pctx.stroke();
  }

  pctx.restore();
}

// =========================================================
// CONTROLES TÁCTILES Y DE RATÓN INTUITIVOS
// =========================================================
let pointerTarget = { x: 1200, y: 900, active: false };
let joystickActive = false;
let joystickCenter = { x: 0, y: 0 };

function handlePointerMove(clientX, clientY) {
  // Convertir coordenadas de pantalla a coordenadas del mundo de juego
  const rect = canvas.getBoundingClientRect();
  const screenX = clientX - rect.left;
  const screenY = clientY - rect.top;

  const camX = myPlayer.x - canvas.width / 2;
  const camY = myPlayer.y - canvas.height / 2;

  pointerTarget.x = screenX + camX;
  pointerTarget.y = screenY + camY;
  pointerTarget.active = true;
}

window.addEventListener('mousemove', (e) => {
  handlePointerMove(e.clientX, e.clientY);
});

window.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0) {
    handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
  }
}, { passive: true });

window.addEventListener('touchstart', (e) => {
  if (e.touches.length > 0) {
    handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
  }
}, { passive: true });

// Control con teclado en PC (WASD / Flechas)
const keys = { up: false, down: false, left: false, right: false };
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = true;
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = true;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
  if (e.code === 'Space') activateTurbo();
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = false;
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
});

// Botón Turbo
function activateTurbo() {
  if (myPlayer.isTurbo) return;
  myPlayer.isTurbo = true;
  myPlayer.speed = myPlayer.turboSpeed;
  playSfx('turbo');
  triggerHaptic(40);
  triggerShake();
  setTimeout(() => {
    myPlayer.speed = myPlayer.baseSpeed;
    myPlayer.isTurbo = false;
  }, 3000);
}

btnTurboBoost.addEventListener('click', activateTurbo);

// =========================================================
// FÍSICAS Y MOVIMIENTO DEL GLOTÓN
// =========================================================
function updateMyPlayer() {
  let moveX = 0;
  let moveY = 0;

  if (keys.up || keys.down || keys.left || keys.right) {
    if (keys.up) moveY -= 1;
    if (keys.down) moveY += 1;
    if (keys.left) moveX -= 1;
    if (keys.right) moveX += 1;
  } else if (pointerTarget.active) {
    const dx = pointerTarget.x - myPlayer.x;
    const dy = pointerTarget.y - myPlayer.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 15) {
      moveX = dx / dist;
      moveY = dy / dist;
      // Apertura de boca cuando se mueve hacia comida
      myPlayer.mouthOpen = Math.min(1, dist / 80);
    } else {
      myPlayer.mouthOpen = 0;
    }
  }

  // Normalizar vector de movimiento
  const length = Math.hypot(moveX, moveY);
  if (length > 0) {
    moveX /= length;
    moveY /= length;
    myPlayer.angle = Math.atan2(moveY, moveX);
  }

  // Fricción suave
  myPlayer.vx = myPlayer.vx * 0.75 + moveX * myPlayer.speed * 0.25;
  myPlayer.vy = myPlayer.vy * 0.75 + moveY * myPlayer.speed * 0.25;

  myPlayer.x += myPlayer.vx;
  myPlayer.y += myPlayer.vy;

  // Límites de la arena con rebote elástico
  const margin = myPlayer.size;
  if (myPlayer.x < margin) { myPlayer.x = margin; myPlayer.vx *= -0.5; }
  if (myPlayer.x > ARENA_W - margin) { myPlayer.x = ARENA_W - margin; myPlayer.vx *= -0.5; }
  if (myPlayer.y < margin) { myPlayer.y = margin; myPlayer.vy *= -0.5; }
  if (myPlayer.y > ARENA_H - margin) { myPlayer.y = ARENA_H - margin; myPlayer.vy *= -0.5; }

  // Estela de burbujitas que te siguen
  if (Math.hypot(myPlayer.vx, myPlayer.vy) > 1.2 && Math.random() < 0.35) {
    spawnBubbleParticle(myPlayer.x, myPlayer.y, HERO_DATA[selectedHeroId].primaryColor);
  }

  // 1. Detección de colisión con Frutas y Burbujas
  for (let i = foodItems.length - 1; i >= 0; i--) {
    const food = foodItems[i];
    const dist = Math.hypot(myPlayer.x - food.x, myPlayer.y - food.y);

    if (dist < myPlayer.size + 14) {
      // Comer fruta
      socket.emit('eat_food', food.id);
      playSfx('eat');
      triggerHaptic(25);
      spawnEatParticles(food.x, food.y, food.color);
      foodItems.splice(i, 1);
      break;
    }
  }

  // 2. Colisión y rebote amigable con otros jugadores (Boing!)
  Object.values(otherPlayers).forEach(other => {
    const distP = Math.hypot(myPlayer.x - other.x, myPlayer.y - other.y);
    const minDist = myPlayer.size + (other.size || 48);

    if (distP < minDist && distP > 0) {
      // Rebotar ambos en direcciones opuestas
      const angleBump = Math.atan2(myPlayer.y - other.y, myPlayer.x - other.x);
      myPlayer.vx += Math.cos(angleBump) * 6;
      myPlayer.vy += Math.sin(angleBump) * 6;

      playSfx('boing');
      triggerHaptic(40);
      triggerShake();
      spawnConfetti(myPlayer.x, myPlayer.y);

      socket.emit('player_bump', { targetSocketId: other.socketId, x: myPlayer.x, y: myPlayer.y });
    }
  });

  // Notificar posición al servidor
  socket.emit('player_move', {
    x: myPlayer.x,
    y: myPlayer.y,
    angle: myPlayer.angle,
    mouthOpen: myPlayer.mouthOpen
  });
}

// =========================================================
// SISTEMA DE PARTÍCULAS Y CONFETI
// =========================================================
function spawnEatParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      size: Math.random() * 5 + 3,
      color: color,
      alpha: 1
    });
  }
}

function spawnBubbleParticle(x, y, color) {
  particles.push({
    x: x - Math.cos(myPlayer.angle) * myPlayer.size * 0.7,
    y: y - Math.sin(myPlayer.angle) * myPlayer.size * 0.7,
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 1.5,
    size: Math.random() * 8 + 4,
    color: color,
    alpha: 0.65,
    isBubble: true
  });
}

function spawnConfetti(x, y) {
  const colors = ['#facc15', '#f43f5e', '#10b981', '#38bdf8', '#fbbf24'];
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1
    });
  }
}

function updateAndDrawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.025;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;

    if (p.isBubble) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// =========================================================
// RENDERIZADO DEL JUEGO (CANVAS 60 FPS)
// =========================================================
let bgGridOffset = 0;

function drawGame() {
  requestAnimationFrame(drawGame);

  const w = canvas.width;
  const h = canvas.height;

  updateMyPlayer();

  // Cámara suave que sigue al jugador
  const camX = myPlayer.x - w / 2;
  const camY = myPlayer.y - h / 2;

  ctx.save();
  ctx.translate(-camX, -camY);

  // 1. FONDO DE LA ARENA (Cuadrícula colorida y límites)
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(0, 0, ARENA_W, ARENA_H);

  // Cuadrícula suave y tierna
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.12)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= ARENA_W; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ARENA_H);
    ctx.stroke();
  }
  for (let y = 0; y <= ARENA_H; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(ARENA_W, y);
    ctx.stroke();
  }

  // Bordes luminosos de la arena
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 10;
  ctx.strokeRect(0, 0, ARENA_W, ARENA_H);

  // 2. DIBUJAR TODAS LAS FRUTAS Y BURBUJAS
  const now = Date.now() / 300;
  foodItems.forEach(food => {
    // Solo dibujar si está cerca de la pantalla para máximo rendimiento
    if (food.x < camX - 60 || food.x > camX + w + 60 || food.y < camY - 60 || food.y > camY + h + 60) return;

    const floatY = food.y + Math.sin(now + food.id) * 4;

    ctx.save();
    if (food.isNumber) {
      // BURBUJA CON NÚMERO (1, 2, 3, 4, 5)
      ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
      ctx.beginPath();
      ctx.arc(food.x, floatY, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 22px "Grandstander", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(food.numberVal, food.x, floatY);
    } else {
      // FRUTA CLÁSICA CON SOMBRA
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(food.emoji, food.x, floatY);
    }
    ctx.restore();
  });

  // 3. DIBUJAR OTROS JUGADORES EN VIVO
  Object.values(otherPlayers).forEach(other => {
    const hero = HERO_DATA[other.id] || HERO_DATA.diegoaz;
    drawGlotonAvatar(ctx, other.x, other.y, other.size || 48, hero, other.angle || 0, other.mouthOpen || 0);

    // Nombre flotante
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Grandstander", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(other.name, other.x, other.y - (other.size || 48) - 10);
    ctx.restore();
  });

  // 4. DIBUJAR MI JUGADOR
  const myHero = HERO_DATA[selectedHeroId];
  drawGlotonAvatar(ctx, myPlayer.x, myPlayer.y, myPlayer.size, myHero, myPlayer.angle, myPlayer.mouthOpen);

  // Mi nombre flotante
  ctx.save();
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 13px "Grandstander", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(myHero.name, myPlayer.x, myPlayer.y - myPlayer.size - 10);
  ctx.restore();

  // 5. PARTÍCULAS Y CONFETI
  updateAndDrawParticles();

  ctx.restore();
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);

// =========================================================
// EVENTOS MULTIJUGADOR SOCKET.IO
// =========================================================
socket.on('init_state', (data) => {
  if (data.arena) {
    ARENA_W = data.arena.width;
    ARENA_H = data.arena.height;
  }
  if (data.foods) {
    foodItems = data.foods;
  }
  if (data.players) {
    Object.keys(data.players).forEach(sId => {
      if (sId !== socket.id) otherPlayers[sId] = data.players[sId];
    });
    updateLeaderboard();
  }
  if (data.challenge) {
    setChallenge(data.challenge);
  }
});

socket.on('player_joined', (p) => {
  if (p.socketId !== socket.id) {
    otherPlayers[p.socketId] = p;
    updateLeaderboard();
  }
});

socket.on('player_moved', (p) => {
  if (p.socketId !== socket.id && otherPlayers[p.socketId]) {
    otherPlayers[p.socketId].x = p.x;
    otherPlayers[p.socketId].y = p.y;
    otherPlayers[p.socketId].size = p.size;
    otherPlayers[p.socketId].angle = p.angle;
    otherPlayers[p.socketId].mouthOpen = p.mouthOpen;
    otherPlayers[p.socketId].score = p.score;
  }
});

socket.on('food_eaten', (data) => {
  // Eliminar fruta comida localmente
  const idx = foodItems.findIndex(f => f.id === data.foodId);
  if (idx !== -1) foodItems.splice(idx, 1);

  if (data.eaterSocketId === socket.id) {
    myPlayer.size = data.eaterSize;
    myPlayer.score = data.eaterScore;
    myPlayer.coins = data.eaterCoins;
    hudCoinsVal.innerText = myPlayer.coins;
    hudScoreVal.innerText = myPlayer.score;

    if (data.completedChallenge) {
      playSfx('correct');
      triggerShake();
      showToast('🎉 ¡EXCELENTE!', `¡Completaste el reto! (+15🪙)`);
      speak(`¡Excelente ${data.eaterName}! ¡Ganaste quince monedas!`);
    }
  } else if (otherPlayers[data.eaterSocketId]) {
    otherPlayers[data.eaterSocketId].size = data.eaterSize;
    otherPlayers[data.eaterSocketId].score = data.eaterScore;
  }

  updateLeaderboard();
});

socket.on('new_food_spawned', (newFood) => {
  foodItems.push(newFood);
});

socket.on('challenge_updated', (challenge) => {
  setChallenge(challenge);
});

socket.on('players_bumped', (data) => {
  if (data.p2 === socket.id) {
    playSfx('boing');
    triggerHaptic(40);
    triggerShake();
    spawnConfetti(myPlayer.x, myPlayer.y);
  }
});

socket.on('reaction_received', (data) => {
  showFloatingReaction(data.emoji, data.name);
});

socket.on('player_left', (data) => {
  delete otherPlayers[data.socketId];
  updateLeaderboard();
});

function setChallenge(ch) {
  challengePromptText.innerText = ch.prompt;
  speak(ch.prompt);
}

function updateLeaderboard() {
  if (!leaderboardList) return;
  const all = [
    { name: HERO_DATA[selectedHeroId].name, score: myPlayer.score, isSelf: true },
    ...Object.values(otherPlayers).map(p => ({ name: p.name, score: p.score || 0, isSelf: false }))
  ];

  all.sort((a, b) => b.score - a.score);

  leaderboardList.innerHTML = '';
  all.forEach(p => {
    const item = document.createElement('div');
    item.className = `lb-item ${p.isSelf ? 'self' : ''}`;
    item.innerHTML = `<span>${p.name}</span><span>${p.score} pts</span>`;
    leaderboardList.appendChild(item);
  });
}

function showToast(head, desc) {
  toastTitle.innerText = head;
  toastDesc.innerText = desc;
  partyToast.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    partyToast.classList.add('hidden');
  }, 2800);
}

function showFloatingReaction(emoji, name) {
  const div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.left = `${Math.random() * 50 + 25}%`;
  div.style.bottom = '110px';
  div.style.fontSize = '34px';
  div.style.pointerEvents = 'none';
  div.style.zIndex = '90';
  div.style.animation = 'toastPopIn 0.3s ease-out';
  div.innerText = `${emoji}`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 1200);
}

// Botones de emojis
document.querySelectorAll('.btn-emoji-bubble').forEach(btn => {
  btn.addEventListener('click', () => {
    const emoji = btn.getAttribute('data-emoji');
    socket.emit('send_reaction', emoji);
    showFloatingReaction(emoji, 'Tú');
  });
});

// Arrancar bucle
requestAnimationFrame(drawGame);
