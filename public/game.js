// =========================================================
// GEOMETRY FAMILY: NEON DASH - MOTOR DEL JUEGO
// Gráficos Cyberpunk / Geometry Dash Neón + Vibraciones + Multijugador
// =========================================================

// Socket.io Multijugador
const socket = io({
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 30
});

// Canvas & Contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// DOM Elements
const selectModal = document.getElementById('character-select-modal');
const gameContainer = document.getElementById('game-container');
const btnStartRace = document.getElementById('btn-start-race');
const heroCards = document.querySelectorAll('.hero-card');
const chkKidShield = document.getElementById('chk-kid-shield');

const hudName = document.getElementById('hud-name');
const hudCoins = document.getElementById('hud-coins');
const hudSpeed = document.getElementById('hud-speed');
const hudCubeIcon = document.getElementById('hud-cube-icon');
const raceProgressFill = document.getElementById('race-progress-fill');
const markerSelf = document.getElementById('marker-self');
const markerOthersContainer = document.getElementById('marker-others-container');
const racePercentVal = document.getElementById('race-percent-val');

const btnSpeakRepeat = document.getElementById('btn-speak-repeat');
const btnMusicToggle = document.getElementById('btn-music-toggle');
const btnVibrateToggle = document.getElementById('btn-vibrate-toggle');

const didacticLivePill = document.getElementById('didactic-live-pill');
const didacticEmojiIcon = document.getElementById('didactic-emoji-icon');
const didacticPromptText = document.getElementById('didactic-prompt-text');

const neonToast = document.getElementById('neon-toast');
const toastTitle = document.getElementById('toast-title');
const toastSubtitle = document.getElementById('toast-subtitle');

const mobileTapSurface = document.getElementById('mobile-tap-surface');
const victoryModal = document.getElementById('victory-modal');
const btnNextLevel = document.getElementById('btn-next-level');

// =========================================================
// CONFIGURACIÓN DE AUDIO SINTETIZADO & BEAT SYNTHWAVE
// =========================================================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let musicEnabled = true;
let sfxEnabled = true;
let vibrationEnabled = true;
let beatTimer = null;
let beatStep = 0;
const BPM = 126;
const BEAT_INTERVAL = (60 / BPM) * 1000 / 4; // semicorcheas

function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Síntesis de efectos de sonido estilo Geometry Dash
function playSfx(type) {
  if (!sfxEnabled) return;
  try {
    initAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'jump') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
      osc.start(now); osc.stop(now + 0.14);
    } else if (type === 'orb') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587, now);
      osc.frequency.setValueAtTime(880, now + 0.08);
      osc.frequency.setValueAtTime(1174, now + 0.16);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'portal') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.25);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc.start(now); osc.stop(now + 0.28);
    } else if (type === 'gate_correct') {
      [523, 659, 783, 1046, 1318].forEach((f, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(f, now + idx * 0.06);
        g.gain.setValueAtTime(0.18, now + idx * 0.06);
        g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.2);
        o.start(now + idx * 0.06); o.stop(now + idx * 0.06 + 0.2);
      });
    } else if (type === 'shield') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.2);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc.start(now); osc.stop(now + 0.28);
    }
  } catch (e) {}
}

// Bucle musical Synthwave sintetizado (cero descargas, ligero y rítmico)
function startSynthwaveMusic() {
  if (beatTimer) clearInterval(beatTimer);
  beatTimer = setInterval(() => {
    if (!musicEnabled || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const step = beatStep % 16;
      beatStep++;

      // Bombo potente en compases 0, 4, 8, 12 (Four-on-the-floor)
      if (step === 0 || step === 4 || step === 8 || step === 12) {
        const kickOsc = audioCtx.createOscillator();
        const kickGain = audioCtx.createGain();
        kickOsc.connect(kickGain); kickGain.connect(audioCtx.destination);
        kickOsc.frequency.setValueAtTime(140, now);
        kickOsc.frequency.exponentialRampToValueAtTime(32, now + 0.09);
        kickGain.gain.setValueAtTime(0.26, now);
        kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        kickOsc.start(now); kickOsc.stop(now + 0.1);

        // Pulso visual sutil en el bombo
        triggerBeatPulse();
      }

      // Bajo rodante Cyberpunk en semicorcheas
      const bassNotes = [110, 110, 130, 110, 146, 110, 130, 164, 110, 110, 130, 110, 146, 164, 196, 130];
      const bassFreq = bassNotes[step];
      const bassOsc = audioCtx.createOscillator();
      const bassGain = audioCtx.createGain();
      bassOsc.connect(bassGain); bassGain.connect(audioCtx.destination);
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq, now);
      bassGain.gain.setValueAtTime(0.07, now);
      bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      bassOsc.start(now); bassOsc.stop(now + 0.08);

      // Chiptune Arpegio brillante en compases pares
      if (step % 2 === 0) {
        const arpNotes = [440, 523, 659, 783, 880, 1046, 880, 659];
        const arpFreq = arpNotes[(step / 2) % arpNotes.length];
        const arpOsc = audioCtx.createOscillator();
        const arpGain = audioCtx.createGain();
        arpOsc.connect(arpGain); arpGain.connect(audioCtx.destination);
        arpOsc.type = 'square';
        arpOsc.frequency.setValueAtTime(arpFreq, now);
        arpGain.gain.setValueAtTime(0.03, now);
        arpGain.gain.exponentialRampToValueAtTime(0.005, now + 0.07);
        arpOsc.start(now); arpOsc.stop(now + 0.07);
      }
    } catch (e) {}
  }, BEAT_INTERVAL);
}

// =========================================================
// SISTEMA DE VIBRACIÓN HÁPTICA Y SACUDIDA DE PANTALLA
// =========================================================
let screenShakeMagnitude = 0;

function triggerScreenShake(amount = 8) {
  screenShakeMagnitude = Math.max(screenShakeMagnitude, amount);
  if (gameContainer) {
    gameContainer.classList.remove('screen-shake');
    void gameContainer.offsetWidth; // reflow
    gameContainer.classList.add('screen-shake');
    setTimeout(() => {
      gameContainer.classList.remove('screen-shake');
    }, 180);
  }
}

function triggerHaptic(pattern = [40, 25, 40]) {
  if (vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {}
  }
}

function triggerBeatPulse() {
  if (gameContainer) {
    gameContainer.classList.add('beat-pulse');
    setTimeout(() => {
      gameContainer.classList.remove('beat-pulse');
    }, 150);
  }
}

// =========================================================
// SINTETIZADOR DE VOZ EDUCATIVO (TEXT-TO-SPEECH)
// Permite que Diego Jr. (4 años) escuche todo sin saber leer
// =========================================================
let lastSpokenPrompt = '¡Rebota en los orbes para contar!';
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

function speak(text, pitch = 1.15, rate = 0.95) {
  lastSpokenPrompt = text;
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
    window.speechSynthesis.speak(utter);
  } catch (e) {}
}

// =========================================================
// PERSONAJES Y ESTADO DEL JUGADOR
// =========================================================
let selectedHeroId = 'diegoaz_jr';
let isKidShieldActive = true;

const HERO_DEFS = {
  diegoaz_jr: {
    id: 'diegoaz_jr',
    name: 'Diegoaz Jr.',
    role: 'Cadete Espacial (4 años)',
    primaryColor: '#facc15', // Amarillo Dorado
    secondaryColor: '#38bdf8', // Cian
    trailColor: '#facc15',
    face: 'demon_cute'
  },
  vicky_vicky: {
    id: 'vicky_vicky',
    name: 'Vicky Vicky',
    role: 'Científica Neón (10 años)',
    primaryColor: '#f43f5e', // Rosa Neón / Magenta
    secondaryColor: '#06b6d4', // Cian
    trailColor: '#ec4899',
    face: 'cat_cute'
  },
  diegoaz: {
    id: 'diegoaz',
    name: 'Diego (Papá)',
    role: 'Guía & Piloto Mayor',
    primaryColor: '#10b981', // Verde Esmeralda Neón
    secondaryColor: '#f59e0b', // Ámbar
    trailColor: '#10b981',
    face: 'glasses_pro'
  }
};

let myPlayer = {
  x: 100,
  y: 0,
  vy: 0,
  rot: 0,
  size: 42,
  mode: 'cube', // 'cube' o 'ship'
  isGrounded: false,
  isHoldingJump: false,
  isAlive: true,
  shieldTimer: 0,
  score: 0,
  coins: 100,
  speed: 8.5,
  distance: 0
};

const otherPlayers = {};
let particles = [];
let shockwaves = [];
let floatingEmojis = [];

// =========================================================
// PISTA Y GENERACIÓN DEL MUNDO GEOMÉTRICO (GEOMETRY DASH)
// =========================================================
const LEVEL_LENGTH = 9000; // Longitud total de la carrera en px
let floorY = 0; // Calculado según tamaño del canvas
let obstacles = [];
let jumpOrbs = [];
let portals = [];
let mathGates = [];
let countingOrbs = [];

// Generador de la pista sincrónica neón
function generateTrack(seed = 421337) {
  obstacles = [];
  jumpOrbs = [];
  portals = [];
  mathGates = [];
  countingOrbs = [];

  // 1. Orbes de conteo para Diego Jr. (1 al 5) en los primeros 1800px
  const countPositions = [350, 650, 950, 1250, 1550];
  countPositions.forEach((pos, idx) => {
    countingOrbs.push({
      x: pos,
      y: -110,
      radius: 26,
      num: idx + 1,
      collected: false,
      color: '#facc15'
    });
  });

  // 2. Obstáculos Neón (Púas y Pilares como en la foto)
  const spikePattern = [
    { x: 500, type: 'spike', count: 1 },
    { x: 800, type: 'spike', count: 2 },
    { x: 1100, type: 'pillar', h: 90, w: 50 },
    { x: 1400, type: 'spike', count: 2 },
    { x: 1700, type: 'pendulum', h: 140 }, // Péndulo colgante como en la foto
    { x: 2000, type: 'platform', h: 100, w: 220 },
    { x: 2400, type: 'spike', count: 3 },
    { x: 2700, type: 'pillar', h: 130, w: 50 }
  ];

  spikePattern.forEach(sp => {
    obstacles.push(sp);
  });

  // 3. Primer Portal de Transformación a NAVE ESPACIAL en x = 2850 (Como en la foto)
  portals.push({
    x: 2850,
    y: -140,
    w: 55,
    h: 170,
    targetMode: 'ship',
    type: 'ship_portal',
    color: '#ff007f',
    label: '🛸 NAVE ESPACIAL'
  });

  // Pista de vuelo en nave espacial (x: 2900 a 4800)
  for (let sx = 3100; sx < 4700; sx += 320) {
    obstacles.push({
      x: sx,
      type: 'hanging_stalactite',
      h: Math.floor(Math.sin(sx) * 40 + 90)
    });
    // Orbes en el aire para volar entre ellos
    jumpOrbs.push({
      x: sx + 150,
      y: -150 + Math.cos(sx) * 45,
      radius: 20,
      color: '#00f0ff'
    });
  }

  // 4. Portal de regreso a Cubo en x = 4850
  portals.push({
    x: 4850,
    y: -140,
    w: 55,
    h: 170,
    targetMode: 'cube',
    type: 'cube_portal',
    color: '#10b981',
    label: '🟩 CUBO'
  });

  // 5. Puertas Matemáticas Turbo para Vicky y Familia (x = 5400 y 6800)
  mathGates.push({
    x: 5400,
    question: '5 + 3 = ?',
    spoken: '¡Pregunta de matemáticas para Vicky! ¿Cuánto es 5 más 3?',
    top: { label: '5 + 3 = 8', correct: true, val: 8 },
    bottom: { label: '5 + 3 = 10', correct: false, val: 10 },
    cleared: false
  });

  mathGates.push({
    x: 6800,
    question: '6 × 4 = ?',
    spoken: '¡Multiplicación para Vicky y la familia! ¿Cuánto es 6 por 4?',
    top: { label: '6 × 4 = 20', correct: false, val: 20 },
    bottom: { label: '6 × 4 = 24', correct: true, val: 24 },
    cleared: false
  });

  // Obstáculos finales hacia la meta
  for (let fx = 7300; fx < 8800; fx += 280) {
    obstacles.push({
      x: fx,
      type: 'spike',
      count: (fx % 560 === 0) ? 2 : 1
    });
    jumpOrbs.push({
      x: fx + 140,
      y: -120,
      radius: 22,
      color: '#facc15'
    });
  }
}

// =========================================================
// RENDERIZADO DE ICONOS Y CUBOS NEÓN CON EXPRESIONES
// =========================================================
function drawNeonCubeIcon(pctx, size, color, secColor, faceType, angle = 0, isShip = false) {
  pctx.save();
  pctx.translate(size / 2, size / 2);
  pctx.rotate(angle);

  const half = size / 2;

  if (isShip) {
    // NAVE ESPACIAL / COHETE (Como en el centro de la foto del usuario)
    // Cuerpo aerodinámico amarillo
    pctx.fillStyle = color;
    pctx.beginPath();
    pctx.moveTo(half - 4, 0);
    pctx.lineTo(-half + 4, -half + 10);
    pctx.lineTo(-half + 8, 0);
    pctx.lineTo(-half + 4, half - 10);
    pctx.closePath();
    pctx.fill();

    pctx.strokeStyle = '#ffffff';
    pctx.lineWidth = 2.5;
    pctx.stroke();

    // Alas / Alerones cian
    pctx.fillStyle = secColor;
    pctx.beginPath();
    pctx.moveTo(-half + 6, -half + 8);
    pctx.lineTo(-half - 6, -half - 4);
    pctx.lineTo(-half + 14, 0);
    pctx.closePath();
    pctx.fill();

    // Cabina azul luminosa
    pctx.fillStyle = '#38bdf8';
    pctx.fillRect(-2, -6, 12, 12);
    pctx.strokeStyle = '#ffffff';
    pctx.lineWidth = 1.5;
    pctx.strokeRect(-2, -6, 12, 12);

    // Propulsor trasero con fuego neón
    pctx.fillStyle = '#f97316';
    pctx.fillRect(-half - 4, -4, 8, 8);
  } else {
    // CUBO ESTILO GEOMETRY DASH
    // Cuerpo exterior con brillo neón
    pctx.fillStyle = color;
    pctx.fillRect(-half, -half, size, size);

    // Borde brillante blanco
    pctx.strokeStyle = '#ffffff';
    pctx.lineWidth = 3;
    pctx.strokeRect(-half, -half, size, size);

    // Marco interior secundario
    pctx.strokeStyle = secColor;
    pctx.lineWidth = 2.5;
    pctx.strokeRect(-half + 5, -half + 5, size - 10, size - 10);

    // Centro del cubo
    pctx.fillStyle = '#0f172a';
    pctx.fillRect(-half + 8, -half + 8, size - 16, size - 16);

    // Expresión de la cara (Demon / Cute / Glasses)
    if (faceType === 'demon_cute') {
      // Ojos pícaros luminosos cian (Como el de la foto del usuario)
      pctx.fillStyle = '#38bdf8';
      pctx.beginPath();
      pctx.moveTo(-half + 10, -half + 12);
      pctx.lineTo(-half + 17, -half + 17);
      pctx.lineTo(-half + 10, -half + 17);
      pctx.closePath();
      pctx.fill();

      pctx.beginPath();
      pctx.moveTo(half - 10, -half + 12);
      pctx.lineTo(half - 17, -half + 17);
      pctx.lineTo(half - 10, -half + 17);
      pctx.closePath();
      pctx.fill();

      // Sonrisa picarona con colmillitos
      pctx.strokeStyle = '#38bdf8';
      pctx.lineWidth = 2;
      pctx.beginPath();
      pctx.moveTo(-8, 5);
      pctx.lineTo(-4, 9);
      pctx.lineTo(0, 5);
      pctx.lineTo(4, 9);
      pctx.lineTo(8, 5);
      pctx.stroke();
    } else if (faceType === 'cat_cute') {
      // Ojitos tiernos redondos de Vicky
      pctx.fillStyle = '#ec4899';
      pctx.beginPath();
      pctx.arc(-7, -4, 4, 0, Math.PI * 2);
      pctx.arc(7, -4, 4, 0, Math.PI * 2);
      pctx.fill();
      pctx.fillStyle = '#ffffff';
      pctx.beginPath();
      pctx.arc(-6, -5, 1.5, 0, Math.PI * 2);
      pctx.arc(8, -5, 1.5, 0, Math.PI * 2);
      pctx.fill();

      // Sonrisita de gato
      pctx.strokeStyle = '#ec4899';
      pctx.lineWidth = 1.8;
      pctx.beginPath();
      pctx.arc(-3, 4, 3, 0, Math.PI);
      pctx.arc(3, 4, 3, 0, Math.PI);
      pctx.stroke();
    } else {
      // Gafas cibernéticas de Diego Papá
      pctx.fillStyle = '#10b981';
      pctx.fillRect(-12, -7, 10, 8);
      pctx.fillRect(2, -7, 10, 8);
      pctx.fillRect(-2, -5, 4, 3);
      pctx.strokeStyle = '#ffffff';
      pctx.lineWidth = 1.5;
      pctx.strokeRect(-12, -7, 10, 8);
      pctx.strokeRect(2, -7, 10, 8);

      // Sonrisa de mentor
      pctx.strokeStyle = '#10b981';
      pctx.lineWidth = 2;
      pctx.beginPath();
      pctx.moveTo(-6, 6);
      pctx.lineTo(6, 6);
      pctx.stroke();
    }
  }

  pctx.restore();
}

// Pre-renderizar retratos en los canvas de selección
function renderHeroPreviews() {
  const pJr = document.getElementById('prev-diego-jr');
  if (pJr) {
    const c = pJr.getContext('2d');
    c.clearRect(0, 0, 70, 70);
    drawNeonCubeIcon(c, 52, HERO_DEFS.diegoaz_jr.primaryColor, HERO_DEFS.diegoaz_jr.secondaryColor, HERO_DEFS.diegoaz_jr.face);
  }
  const pVi = document.getElementById('prev-vicky');
  if (pVi) {
    const c = pVi.getContext('2d');
    c.clearRect(0, 0, 70, 70);
    drawNeonCubeIcon(c, 52, HERO_DEFS.vicky_vicky.primaryColor, HERO_DEFS.vicky_vicky.secondaryColor, HERO_DEFS.vicky_vicky.face);
  }
  const pDa = document.getElementById('prev-diego');
  if (pDa) {
    const c = pDa.getContext('2d');
    c.clearRect(0, 0, 70, 70);
    drawNeonCubeIcon(c, 52, HERO_DEFS.diegoaz.primaryColor, HERO_DEFS.diegoaz.secondaryColor, HERO_DEFS.diegoaz.face);
  }
}
renderHeroPreviews();

// Selección de corredor en UI
heroCards.forEach(card => {
  card.addEventListener('click', () => {
    heroCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    selectedHeroId = card.getAttribute('data-id');
    initAudio();
    playSfx('orb');
  });
});

chkKidShield.addEventListener('change', (e) => {
  isKidShieldActive = e.target.checked;
});

// Iniciar carrera
btnStartRace.addEventListener('click', () => {
  initAudio();
  playSfx('portal');
  startSynthwaveMusic();

  const heroDef = HERO_DEFS[selectedHeroId];
  hudName.innerText = heroDef.name;

  // Dibujar mini cubo en el HUD
  const hctx = hudCubeIcon.getContext('2d');
  hctx.clearRect(0, 0, 32, 32);
  drawNeonCubeIcon(hctx, 28, heroDef.primaryColor, heroDef.secondaryColor, heroDef.face);

  selectModal.classList.add('hidden');
  gameContainer.classList.remove('hidden');
  resizeCanvas();

  // Conectar a Socket.io
  socket.emit('join_game', {
    characterId: selectedHeroId,
    color: heroDef.primaryColor
  });

  generateTrack();

  // Bienvenida por voz
  if (selectedHeroId === 'diegoaz_jr') {
    speak('¡Hola Diego Junior! Toca la pantalla para saltar y cuenta los orbes numéricos.');
  } else {
    speak('¡Bienvenidos a la carrera neón en familia!');
  }
});

// =========================================================
// FÍSICAS, SALTO Y CONTROL DEL JUGADOR (ONE-TOUCH CONTROLS)
// =========================================================
const GRAVITY = 0.88;
const JUMP_FORCE = -15.5;
const SHIP_THRUST = -0.72;
const SHIP_GRAVITY = 0.48;

function triggerJump() {
  if (!myPlayer.isAlive) return;

  if (myPlayer.mode === 'cube') {
    if (myPlayer.isGrounded) {
      myPlayer.vy = JUMP_FORCE;
      myPlayer.isGrounded = false;
      playSfx('jump');
      triggerScreenShake(6);
      triggerHaptic([35]);
      spawnJumpParticles(myPlayer.x, floorY);

      socket.emit('player_action', { type: 'jump', x: myPlayer.x, y: myPlayer.y });
    }
  }
}

// Controles táctiles pantalla completa
function onInputStart(e) {
  if (e) e.preventDefault();
  initAudio();
  myPlayer.isHoldingJump = true;
  triggerJump();
}

function onInputEnd(e) {
  if (e) e.preventDefault();
  myPlayer.isHoldingJump = false;
}

if (mobileTapSurface) {
  mobileTapSurface.addEventListener('touchstart', onInputStart, { passive: false });
  mobileTapSurface.addEventListener('touchend', onInputEnd, { passive: false });
  mobileTapSurface.addEventListener('mousedown', onInputStart);
  mobileTapSurface.addEventListener('mouseup', onInputEnd);
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    if (!myPlayer.isHoldingJump) {
      initAudio();
      myPlayer.isHoldingJump = true;
      triggerJump();
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    myPlayer.isHoldingJump = false;
  }
});

// =========================================================
// ACTUALIZACIÓN DE FÍSICAS Y COLISIONES
// =========================================================
function updatePlayer() {
  if (!myPlayer.isAlive) return;

  // Avance horizontal continuo
  myPlayer.distance += myPlayer.speed;
  myPlayer.x = myPlayer.distance + 120;

  // Modo Cubo vs Modo Nave
  if (myPlayer.mode === 'cube') {
    myPlayer.vy += GRAVITY;
    myPlayer.y += myPlayer.vy;

    // Colisión con el suelo
    if (myPlayer.y >= 0) {
      myPlayer.y = 0;
      myPlayer.vy = 0;
      myPlayer.isGrounded = true;
      // Ajustar rotación exacta a múltiplos de 90° al caer
      myPlayer.rot = Math.round(myPlayer.rot / (Math.PI / 2)) * (Math.PI / 2);
    } else {
      myPlayer.isGrounded = false;
      // Rotar continuamente en el aire (Geometry Dash spin)
      myPlayer.rot += 0.14;
    }
  } else if (myPlayer.mode === 'ship') {
    // Físicas de Nave Espacial (mantener presionado para volar hacia arriba)
    if (myPlayer.isHoldingJump) {
      myPlayer.vy += SHIP_THRUST;
    } else {
      myPlayer.vy += SHIP_GRAVITY;
    }

    myPlayer.vy = Math.max(-9, Math.min(8.5, myPlayer.vy));
    myPlayer.y += myPlayer.vy;

    // Límites de vuelo de nave
    const ceilingLimit = -260;
    if (myPlayer.y < ceilingLimit) {
      myPlayer.y = ceilingLimit;
      myPlayer.vy = 0;
    }
    if (myPlayer.y > -20) {
      myPlayer.y = -20;
      myPlayer.vy = 0;
    }

    // Inclinación aerodinámica de la nave según su velocidad vertical
    myPlayer.rot = (myPlayer.vy / 10) * 0.45;
  }

  // Generar estela de partículas de cuadritos neón (como en la foto)
  spawnTrailParticle(myPlayer.x - 16, floorY + myPlayer.y - 10, HERO_DEFS[selectedHeroId].primaryColor);

  // 1. Detección de Orbes de Conteo para Diego Jr. (1, 2, 3, 4, 5)
  countingOrbs.forEach(orb => {
    if (!orb.collected) {
      const dist = Math.hypot(myPlayer.x - orb.x, (floorY + myPlayer.y) - (floorY + orb.y));
      if (dist < orb.radius + myPlayer.size / 2) {
        orb.collected = true;
        myPlayer.vy = JUMP_FORCE * 0.95; // Rebote asistido
        playSfx('orb');
        triggerScreenShake(7);
        triggerHaptic([45, 20, 45]);
        spawnShockwave(orb.x, floorY + orb.y, orb.color);

        // Locución en voz alta del número
        const numWords = ['Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco'];
        const word = numWords[orb.num - 1] || `${orb.num}`;
        didacticEmojiIcon.innerText = '🔢';
        didacticPromptText.innerText = `¡Número ${orb.num} (${word})!`;
        speak(`¡${word}!`, 1.25);

        if (orb.num === 5) {
          showCelebrationToast('⭐ ¡EXCELENTE DIEGO JR.!', '¡Contaste hasta 5! (+20🪙)');
          rewardCoins(20);
        }
      }
    }
  });

  // 2. Detección de Portales de Transformación
  portals.forEach(portal => {
    if (Math.abs(myPlayer.x - portal.x) < 30) {
      if (myPlayer.mode !== portal.targetMode) {
        myPlayer.mode = portal.targetMode;
        playSfx('portal');
        triggerScreenShake(12);
        triggerHaptic([60, 30, 60]);
        spawnShockwave(portal.x, floorY + portal.y, portal.color);

        didacticEmojiIcon.innerText = portal.targetMode === 'ship' ? '🛸' : '🟩';
        didacticPromptText.innerText = portal.label;

        if (portal.targetMode === 'ship') {
          speak('¡Portal de Nave Espacial! ¡Mantén pulsada la pantalla para volar!');
        } else {
          speak('¡De vuelta al Cubo Saltarín!');
        }
      }
    }
  });

  // 3. Detección de Puertas Matemáticas (Para Vicky y Familia)
  mathGates.forEach(gate => {
    if (!gate.cleared && Math.abs(myPlayer.x - gate.x) < 40) {
      gate.cleared = true;
      const isTop = myPlayer.y < -130;
      const chosen = isTop ? gate.top : gate.bottom;

      if (chosen.correct) {
        playSfx('gate_correct');
        triggerScreenShake(14);
        triggerHaptic([80, 40, 80]);
        showCelebrationToast('🏆 ¡BRILIANTE VICKY VICKY!', `${chosen.label} (+25🪙 & Super Turbo)`);
        rewardCoins(25);
        myPlayer.speed = 11.5; // Super Turbo
        setTimeout(() => { myPlayer.speed = 8.5; }, 4000);
        speak(`¡Brillante Vicky! ${gate.question.replace(' = ?', '')} es ${chosen.val}. ¡Super turbo activado!`);
      } else {
        triggerScreenShake(6);
        speak(`¡Casi Vicky! La respuesta correcta era ${gate.top.correct ? gate.top.val : gate.bottom.val}.`);
      }
    }
  });

  // 4. Detección de Obstáculos y Púas
  const playerScreenY = floorY + myPlayer.y;
  obstacles.forEach(obs => {
    const ox = obs.x;
    if (Math.abs(myPlayer.x - ox) < 25) {
      let isHit = false;

      if (obs.type === 'spike') {
        if (playerScreenY > floorY - 26) {
          isHit = true;
        }
      } else if (obs.type === 'hanging_stalactite') {
        const stalactiteBottom = floorY - 260 + obs.h;
        if (playerScreenY - myPlayer.size / 2 < stalactiteBottom) {
          isHit = true;
        }
      }

      if (isHit) {
        handleObstacleHit();
      }
    }
  });

  // 5. Barra de progreso multijugador
  const progressRatio = Math.min(1, myPlayer.distance / LEVEL_LENGTH);
  raceProgressFill.style.width = `${(progressRatio * 100).toFixed(1)}%`;
  markerSelf.style.left = `${(progressRatio * 100).toFixed(1)}%`;
  racePercentVal.innerText = `${Math.floor(progressRatio * 100)}%`;

  // Comprobar victoria
  if (myPlayer.distance >= LEVEL_LENGTH && victoryModal.classList.contains('hidden')) {
    victoryModal.classList.remove('hidden');
    playSfx('gate_correct');
    speak('¡Felicitaciones familia! ¡Completaron la carrera en el mundo Neón!');
  }

  // Notificar progreso a Socket.io
  socket.emit('player_progress', {
    distance: myPlayer.distance,
    y: myPlayer.y,
    vy: myPlayer.vy,
    rot: myPlayer.rot,
    mode: myPlayer.mode,
    isAlive: myPlayer.isAlive,
    score: myPlayer.score,
    speed: myPlayer.speed
  });
}

function handleObstacleHit() {
  if (myPlayer.shieldTimer > 0) return; // Inmune temporalmente

  triggerScreenShake(12);
  triggerHaptic([100]);

  if (isKidShieldActive) {
    // MODO PROTECTOR INFANTIL: Protege a Diego Jr. con burbuja neón sin frustración
    myPlayer.shieldTimer = 90; // Frames de inmunidad
    myPlayer.vy = -10; // Rebote seguro hacia arriba
    playSfx('shield');
    spawnShockwave(myPlayer.x, floorY + myPlayer.y, '#38bdf8');
    speak('¡Escudo protector activado! ¡Tú puedes Diego Junior!', 1.2);
  } else {
    // Respawn suave a corta distancia atrás
    myPlayer.distance = Math.max(0, myPlayer.distance - 260);
    myPlayer.y = 0;
    myPlayer.vy = 0;
    myPlayer.shieldTimer = 60;
    playSfx('shield');
  }
}

function rewardCoins(amount) {
  myPlayer.coins += amount;
  hudCoins.innerText = myPlayer.coins;
  socket.emit('save_reward', { coins: amount });
}

function showCelebrationToast(title, subtitle) {
  toastTitle.innerText = title;
  toastSubtitle.innerText = subtitle;
  neonToast.classList.remove('hidden');
  clearTimeout(showCelebrationToast.timer);
  showCelebrationToast.timer = setTimeout(() => {
    neonToast.classList.add('hidden');
  }, 2600);
}

// =========================================================
// SISTEMA DE PARTÍCULAS NEÓN Y ONDAS DE CHOQUE
// =========================================================
function spawnTrailParticle(x, y, color) {
  particles.push({
    x: x + (Math.random() - 0.5) * 6,
    y: y + (Math.random() - 0.5) * 6,
    vx: -myPlayer.speed * 0.45,
    vy: (Math.random() - 0.5) * 2,
    size: Math.random() * 6 + 5,
    color: color,
    alpha: 0.9,
    rot: Math.random() * Math.PI
  });
}

function spawnJumpParticles(x, y) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 8 - 2,
      vy: (Math.random() - 0.5) * 4 - 3,
      size: Math.random() * 5 + 4,
      color: '#ffffff',
      alpha: 1,
      rot: Math.random() * Math.PI
    });
  }
}

function spawnShockwave(x, y, color) {
  shockwaves.push({
    x: x,
    y: y,
    radius: 10,
    maxRadius: 75,
    color: color,
    alpha: 1
  });
}

function updateAndDrawParticles(camX) {
  // Partículas de estela
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.035;
    p.size *= 0.96;

    if (p.alpha <= 0 || p.size < 1) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.translate(p.x - camX, p.y);
    ctx.rotate(p.rot);
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }

  // Ondas de choque circulares
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const s = shockwaves[i];
    s.radius += 4.5;
    s.alpha -= 0.045;

    if (s.alpha <= 0 || s.radius >= s.maxRadius) {
      shockwaves.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = s.alpha;
    ctx.strokeStyle = s.color;
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(s.x - camX, s.y, s.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// =========================================================
// RENDERIZADO PRINCIPAL (CANVAS 60 FPS)
// =========================================================
function drawGame() {
  requestAnimationFrame(drawGame);

  const w = canvas.width;
  const h = canvas.height;
  floorY = h * 0.76;

  updatePlayer();

  if (myPlayer.shieldTimer > 0) myPlayer.shieldTimer--;

  // Cámara centrada en el jugador
  const camX = myPlayer.x - w * 0.28;

  // 1. FONDO ESPACIAL CYBERPUNK (Exacto a la foto)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#0a031e');
  bgGrad.addColorStop(0.5, '#170b3b');
  bgGrad.addColorStop(1, '#28115e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Cuadrícula neón en perspectiva (Cyber Grid)
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.16)';
  ctx.lineWidth = 1.2;
  const gridOffsetX = -(camX * 0.3) % 40;
  for (let x = gridOffsetX; x < w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, floorY);
    ctx.stroke();
  }
  for (let y = 0; y < floorY; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // 2. SUELO GEOMÉTRICO CON BORDE NEÓN
  const floorGrad = ctx.createLinearGradient(0, floorY, 0, h);
  floorGrad.addColorStop(0, '#1e1145');
  floorGrad.addColorStop(1, '#09041a');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, floorY, w, h - floorY);

  // Línea superior del suelo brillante
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(w, floorY);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Patrón geométrico del suelo (Dientes de sierra inferiores como en la foto)
  ctx.fillStyle = '#150933';
  const sawStep = 30;
  const sawOffset = -(camX) % sawStep;
  for (let sx = sawOffset; sx < w; sx += sawStep) {
    ctx.beginPath();
    ctx.moveTo(sx, floorY + 4);
    ctx.lineTo(sx + sawStep / 2, floorY + 16);
    ctx.lineTo(sx + sawStep, floorY + 4);
    ctx.closePath();
    ctx.fill();
  }

  // 3. RENDERIZAR OBSTÁCULOS (Púas, Pilares, Péndulo)
  obstacles.forEach(obs => {
    const rx = obs.x - camX;
    if (rx < -150 || rx > w + 150) return;

    if (obs.type === 'spike') {
      const spWidth = 26;
      for (let i = 0; i < obs.count; i++) {
        const sx = rx + i * spWidth;
        // Púa neón (Triángulo con gradiente interior y contorno brillante)
        ctx.fillStyle = '#0f0a21';
        ctx.beginPath();
        ctx.moveTo(sx, floorY);
        ctx.lineTo(sx + spWidth / 2, floorY - 30);
        ctx.lineTo(sx + spWidth, floorY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    } else if (obs.type === 'pillar') {
      // Pilar de bloques futuristas con gradiente (Como en la foto)
      const pGrad = ctx.createLinearGradient(0, floorY, 0, floorY - obs.h);
      pGrad.addColorStop(0, '#0f0a21');
      pGrad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = pGrad;
      ctx.fillRect(rx, floorY - obs.h, obs.w, obs.h);

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, floorY - obs.h, obs.w, obs.h);
    } else if (obs.type === 'pendulum') {
      // Péndulo colgante con cadena (Como en la foto del usuario)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rx + 20, 0);
      ctx.lineTo(rx + 20, obs.h);
      ctx.stroke();

      // Púa invertida del péndulo
      ctx.fillStyle = '#0f0a21';
      ctx.beginPath();
      ctx.moveTo(rx, obs.h);
      ctx.lineTo(rx + 20, obs.h + 40);
      ctx.lineTo(rx + 40, obs.h);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (obs.type === 'hanging_stalactite') {
      // Estalactita de techo en modo nave
      ctx.fillStyle = '#1e1145';
      ctx.fillRect(rx, floorY - 260, 30, obs.h);
      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, floorY - 260, 30, obs.h);
    }
  });

  // 4. RENDERIZAR ORBES DE CONTEO Y ORBES DE SALTO
  countingOrbs.forEach(orb => {
    const rx = orb.x - camX;
    if (rx < -100 || rx > w + 100 || orb.collected) return;

    ctx.save();
    ctx.shadowColor = orb.color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = orb.color;
    ctx.beginPath();
    ctx.arc(rx, floorY + orb.y, orb.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Número visible en el orbe
    ctx.fillStyle = '#020617';
    ctx.font = 'bold 16px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(orb.num, rx, floorY + orb.y);
    ctx.restore();
  });

  jumpOrbs.forEach(orb => {
    const rx = orb.x - camX;
    if (rx < -100 || rx > w + 100) return;

    ctx.save();
    ctx.shadowColor = orb.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(15, 10, 33, 0.7)';
    ctx.beginPath();
    ctx.arc(rx, floorY + orb.y, orb.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = orb.color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  });

  // 5. RENDERIZAR PORTALES DE TRANSFORMACIÓN (Hexágono Neón como en la foto)
  portals.forEach(portal => {
    const rx = portal.x - camX;
    if (rx < -120 || rx > w + 120) return;

    ctx.save();
    ctx.shadowColor = portal.color;
    ctx.shadowBlur = 20;

    // Marco hexagonal alargado
    ctx.strokeStyle = portal.color;
    ctx.lineWidth = 4;
    ctx.strokeRect(rx - portal.w / 2, floorY + portal.y, portal.w, portal.h);

    // Barras de energía horizontales
    ctx.fillStyle = portal.color;
    for (let by = floorY + portal.y + 12; by < floorY + portal.y + portal.h - 10; by += 18) {
      ctx.fillRect(rx - portal.w / 2 + 6, by, portal.w - 12, 4);
    }

    // Texto de portal
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(portal.label, rx, floorY + portal.y - 12);
    ctx.restore();
  });

  // 6. RENDERIZAR PUERTAS MATEMÁTICAS (Para Vicky y Familia)
  mathGates.forEach(gate => {
    const rx = gate.x - camX;
    if (rx < -160 || rx > w + 160) return;

    // Puerta Superior
    ctx.fillStyle = gate.top.correct ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.fillRect(rx - 60, floorY - 220, 120, 60);
    ctx.strokeRect(rx - 60, floorY - 220, 120, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(gate.top.label, rx, floorY - 185);

    // Puerta Inferior
    ctx.fillStyle = gate.bottom.correct ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)';
    ctx.fillRect(rx - 60, floorY - 120, 120, 60);
    ctx.strokeRect(rx - 60, floorY - 120, 120, 60);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(gate.bottom.label, rx, floorY - 85);
  });

  // 7. RENDERIZAR OTROS JUGADORES (MULTIJUGADOR EN TIEMPO REAL)
  Object.values(otherPlayers).forEach(other => {
    const orx = (other.distance + 120) - camX;
    if (orx < -100 || orx > w + 100) return;

    const ory = floorY + (other.y || 0) - myPlayer.size / 2;
    ctx.save();
    ctx.translate(orx, ory);

    // Nombre flotante con halo
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = other.color || '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.fillText(other.name, 0, -myPlayer.size / 2 - 8);

    // Render de cubo u nave del compañero
    const isOtherShip = other.mode === 'ship';
    drawNeonCubeIcon(ctx, myPlayer.size, other.color || '#38bdf8', '#ffffff', 'demon_cute', other.rot || 0, isOtherShip);
    ctx.restore();
  });

  // 8. RENDERIZAR JUGADOR ACTUAL (CON SOMBRA NEÓN Y ESCUDO)
  const px = myPlayer.x - camX;
  const py = floorY + myPlayer.y - myPlayer.size / 2;

  ctx.save();
  ctx.translate(px, py);

  // Escudo protector de energía para Diego Jr.
  if (myPlayer.shieldTimer > 0) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, myPlayer.size * 0.85, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Nombre del jugador
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 9px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = HERO_DEFS[selectedHeroId].primaryColor;
  ctx.shadowBlur = 8;
  ctx.fillText(HERO_DEFS[selectedHeroId].name, 0, -myPlayer.size / 2 - 8);

  const isShipMode = myPlayer.mode === 'ship';
  drawNeonCubeIcon(ctx, myPlayer.size, HERO_DEFS[selectedHeroId].primaryColor, HERO_DEFS[selectedHeroId].secondaryColor, HERO_DEFS[selectedHeroId].face, myPlayer.rot, isShipMode);

  ctx.restore();

  // 9. DIBUJAR PARTÍCULAS Y ONDAS DE CHOQUE
  updateAndDrawParticles(camX);
}

// Redimensionar canvas adaptativo
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);

// =========================================================
// EVENTOS MULTIJUGADOR SOCKET.IO
// =========================================================
socket.on('init_state', (data) => {
  if (data.players) {
    Object.keys(data.players).forEach(sockId => {
      if (sockId !== socket.id) {
        otherPlayers[sockId] = data.players[sockId];
      }
    });
    updateOtherPlayerMarkers();
  }
});

socket.on('player_joined', (pData) => {
  if (pData.socketId !== socket.id) {
    otherPlayers[pData.socketId] = pData;
    updateOtherPlayerMarkers();
  }
});

socket.on('player_updated', (pData) => {
  if (pData.socketId !== socket.id) {
    otherPlayers[pData.socketId] = pData;
    updateOtherPlayerMarkers();
  }
});

socket.on('player_left', (pData) => {
  delete otherPlayers[pData.socketId];
  updateOtherPlayerMarkers();
});

socket.on('reaction_received', (data) => {
  // Mostrar emoji flotante en pantalla
  showFloatingEmoji(data.emoji, data.name);
  playSfx('orb');
});

function updateOtherPlayerMarkers() {
  if (!markerOthersContainer) return;
  markerOthersContainer.innerHTML = '';
  Object.values(otherPlayers).forEach(p => {
    const ratio = Math.min(1, (p.distance || 0) / LEVEL_LENGTH);
    const m = document.createElement('div');
    m.className = 'other-runner-marker';
    m.style.left = `${(ratio * 100).toFixed(1)}%`;
    m.style.backgroundColor = p.color || '#ec4899';
    m.title = p.name;
    markerOthersContainer.appendChild(m);
  });
}

function showFloatingEmoji(emoji, sender) {
  const div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.left = `${Math.random() * 60 + 20}%`;
  div.style.bottom = '90px';
  div.style.fontSize = '32px';
  div.style.pointerEvents = 'none';
  div.style.zIndex = '90';
  div.style.animation = 'toastPop 0.25s ease-out, bannerFloat 1.2s forwards';
  div.innerText = emoji;
  document.body.appendChild(div);
  setTimeout(() => { div.remove(); }, 1200);
}

// Botones de reacciones rápidas
document.querySelectorAll('.btn-react-emoji').forEach(btn => {
  btn.addEventListener('click', () => {
    const emoji = btn.getAttribute('data-emoji');
    socket.emit('send_reaction', emoji);
    showFloatingEmoji(emoji, 'Tú');
  });
});

// Botones de herramientas del HUD
btnSpeakRepeat.addEventListener('click', () => {
  speak(lastSpokenPrompt);
});

btnMusicToggle.addEventListener('click', () => {
  musicEnabled = !musicEnabled;
  btnMusicToggle.classList.toggle('active', musicEnabled);
  btnMusicToggle.innerText = musicEnabled ? '🎵' : '🔇';
});

btnVibrateToggle.addEventListener('click', () => {
  vibrationEnabled = !vibrationEnabled;
  btnVibrateToggle.classList.toggle('active', vibrationEnabled);
});

btnNextLevel.addEventListener('click', () => {
  victoryModal.classList.add('hidden');
  myPlayer.distance = 0;
  generateTrack();
  speak('¡Siguiente nivel iniciado! ¡A toda velocidad!');
});

// Iniciar bucle de dibujo
requestAnimationFrame(drawGame);
