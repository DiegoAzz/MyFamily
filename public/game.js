// ==============================================================
// SUPER DIEGO JR: CARRERA MÁGICA 🌟
// Motor Endless Runner 60 FPS con Parallax, Físicas Suaves,
// Animaciones de Superhéroe y Didáctica Infantil para 4 años.
// ==============================================================

(function() {
  'use strict';

  // CONFIGURACIÓN Y ESTADO DEL JUEGO
  const CONFIG = {
    gravity: 0.42,            // Gravedad suave para niños
    jumpForce: -10.5,         // Salto amplio y cómodo
    glideGravity: 0.14,       // Flotar con capa o globos en el aire
    baseSpeed: 4.5,           // Velocidad amigable
    maxSpeed: 7.0,
    speedIncrease: 0.0005,
    groundHeightRatio: 0.22   // Altura del suelo respecto al canvas
  };

  const state = {
    running: false,
    paused: false,
    speed: CONFIG.baseSpeed,
    distance: 0,
    stars: 0,
    candies: 0,
    hearts: 3,
    suit: localStorage.getItem('diego_suit') || 'super_diego',
    soundEnabled: true,
    voiceEnabled: true,
    powerup: null,            // { type: 'rocket'|'magnet'|'shield'|'rainbow', duration: 300, maxDuration: 300 }
    isGliding: false,
    didacticNumber: 0,
    lastVoiceTime: 0
  };

  // Nombres y frases didácticas en español
  const NUMBER_WORDS = [
    '¡CERO!', '¡UNO! 🌟', '¡DOS! 🌟', '¡TRES! 🌟', '¡CUATRO! 🌟', 
    '¡CINCO! 🌟', '¡SEIS! 🌟', '¡SIETE! 🌟', '¡OCHO! 🌟', '¡NUEVE! 🌟', '¡DIEZ! 🏆'
  ];

  const PRAISES = [
    '¡Qué bien, Diego!', '¡Súper campeón!', '¡Bravo Diego Jr!', 
    '¡Increíble!', '¡Eres muy rápido!', '¡Genial!'
  ];

  // REFERENCIAS DOM
  const dom = {
    canvas: document.getElementById('gameCanvas'),
    ctx: null,
    previewCanvas: document.getElementById('previewCanvas'),
    previewCtx: null,

    startScreen: document.getElementById('start-screen'),
    gameHud: document.getElementById('game-hud'),
    hudStars: document.getElementById('hud-star-count'),
    hudDistance: document.getElementById('hud-distance-val'),
    hudHearts: document.getElementById('hud-hearts-container'),
    btnPause: document.getElementById('btn-pause'),

    powerupBanner: document.getElementById('powerup-banner'),
    powerupIcon: document.getElementById('powerup-icon'),
    powerupTitle: document.getElementById('powerup-title'),
    powerupFill: document.getElementById('powerup-fill'),

    didacticToast: document.getElementById('didactic-toast'),
    didacticNumber: document.getElementById('didactic-number'),
    didacticWord: document.getElementById('didactic-word'),

    touchControls: document.getElementById('touch-controls'),
    btnTouchJump: document.getElementById('btn-touch-jump'),

    btnStart: document.getElementById('btn-start-game'),
    btnCloset: document.getElementById('btn-open-closet'),
    btnSound: document.getElementById('btn-toggle-sound'),
    btnVoice: document.getElementById('btn-toggle-voice'),

    modalCloset: document.getElementById('modal-closet'),
    btnCloseCloset: document.getElementById('btn-close-closet'),
    btnConfirmCloset: document.getElementById('btn-confirm-closet'),
    suitCards: document.querySelectorAll('.suit-card'),
    previewSuitName: document.getElementById('preview-suit-name'),

    celebrationScreen: document.getElementById('celebration-screen'),
    recapStars: document.getElementById('recap-stars'),
    recapDistance: document.getElementById('recap-distance'),
    recapCandies: document.getElementById('recap-candies'),
    btnReplay: document.getElementById('btn-replay'),
    btnHome: document.getElementById('btn-home'),

    familyCheerBanner: document.getElementById('family-cheer-banner'),
    cheerSender: document.getElementById('cheer-sender'),
    cheerMsg: document.getElementById('cheer-msg'),
    cheerEmoji: document.getElementById('cheer-emoji')
  };

  dom.ctx = dom.canvas.getContext('2d');
  dom.previewCtx = dom.previewCanvas.getContext('2d');

  // ==============================================================
  // 1. SINTETIZADOR DE AUDIO ALEGRE Y VOZ DIDÁCTICA (WEB SPEECH)
  // ==============================================================
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Sonido de Salto Alegre
  function playJumpSound() {
    if (!state.soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.18);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Escala musical para cada estrella (Do-Re-Mi-Fa-Sol-La-Si-Do)
  const SCALE = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
  function playStarSound(noteIndex = 0) {
    if (!state.soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    const freq = SCALE[noteIndex % SCALE.length];
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  // Sonido de Power-up Mágico
  function playPowerupSound() {
    if (!state.soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    [392, 523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.25);
    });
  }

  // Sonido de rebote gracioso (no hay muerte trágica)
  function playBoingSound() {
    if (!state.soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(320, now + 0.12);
    osc.frequency.linearRampToValueAtTime(140, now + 0.25);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Voz Didáctica amigable en Español (HTML5 SpeechSynthesis)
  function speak(text) {
    if (!state.voiceEnabled) return;
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel(); // Detener anterior

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-LA'; // Español latino/amigable
      utterance.rate = 1.05;    // Tono animado
      utterance.pitch = 1.35;   // Tono alegre y juvenil

      // Buscar voz en español si está disponible
      const voices = window.speechSynthesis.getVoices();
      const esVoice = voices.find(v => v.lang.startsWith('es'));
      if (esVoice) utterance.voice = esVoice;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.log('Síntesis de voz no disponible');
    }
  }

  // Vibración háptica en celulares
  function vibrate(ms = 35) {
    if (navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (e) {}
    }
  }

  // ==============================================================
  // 2. PERSONAJE PROTAGONISTA: DIEGO JR (4 AÑOS)
  // ==============================================================
  const player = {
    x: 100,
    y: 0,
    width: 60,
    height: 75,
    vy: 0,
    isGrounded: false,
    jumpCount: 0,
    runFrame: 0,
    invincibleTimer: 0,
    rocketY: 0
  };

  // Dibujar a Diego Jr de forma vectorial y estilizada en Canvas
  function drawDiegoJr(ctx, x, y, suit, frame = 0, isJumping = false, isGliding = false, hasRocket = false) {
    ctx.save();
    ctx.translate(x, y);

    const legOffset = isJumping ? 0 : Math.sin(frame * 0.25) * 12;
    const armOffset = isJumping ? 0 : Math.cos(frame * 0.25) * 10;
    const headBob = isJumping ? -4 : Math.abs(Math.sin(frame * 0.25)) * 3;

    // 0. Si tiene el Power-up del Cohete Mágico
    if (hasRocket) {
      // Dibujar Cohete Espacial de Juguete
      ctx.save();
      ctx.translate(-8, 30);

      // Fuego de propulsión
      const flameSize = 14 + Math.random() * 8;
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-16, 12);
      ctx.lineTo(-16 - flameSize, 18);
      ctx.lineTo(-16, 24);
      ctx.fill();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(-14, 15);
      ctx.lineTo(-14 - flameSize * 0.6, 18);
      ctx.lineTo(-14, 21);
      ctx.fill();

      // Cuerpo del cohete
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(30, 18, 42, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ventanilla del cohete
      ctx.fillStyle = '#bae6fd';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(36, 18, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Aleta trasera
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-10, -12);
      ctx.lineTo(8, 0);
      ctx.fill();

      ctx.restore();
    }

    // 1. Capa de Superhéroe u orejitas (Detrás de Diego)
    if (suit === 'super_diego' || suit === 'king') {
      ctx.fillStyle = suit === 'king' ? '#9333ea' : '#ef4444';
      ctx.beginPath();
      ctx.moveTo(18, 28);
      // Capa ondeando por el viento
      const capeWave = isGliding ? Math.sin(frame * 0.15) * 8 : Math.sin(frame * 0.3) * 14;
      const capeX = isGliding ? -38 : -24;
      ctx.quadraticCurveTo(capeX, 36 + capeWave, capeX - 10, 58 + capeWave);
      ctx.lineTo(12, 45);
      ctx.closePath();
      ctx.fill();

      if (suit === 'king') {
        // Borde dorado de la capa
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    } else if (suit === 'astronaut') {
      // Mochilita espacial con propulsor
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.fillRect(8, 25, 14, 24);
      ctx.strokeRect(8, 25, 14, 24);
    } else if (suit === 'dino') {
      // Cola de dinosaurio
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(14, 45);
      ctx.quadraticCurveTo(-14, 52 + Math.sin(frame * 0.2) * 6, -22, 42);
      ctx.lineTo(16, 55);
      ctx.fill();
    }

    // 2. Piernas y zapatillas deportivas
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';

    // Pierna izquierda
    ctx.beginPath();
    ctx.moveTo(25, 48);
    ctx.lineTo(20 - legOffset, 66);
    ctx.stroke();

    // Zapatilla izquierda
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.ellipse(20 - legOffset, 68, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pierna derecha
    ctx.beginPath();
    ctx.moveTo(35, 48);
    ctx.lineTo(40 + legOffset, 66);
    ctx.stroke();

    // Zapatilla derecha
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.ellipse(40 + legOffset, 68, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Tronco / Camiseta
    if (suit === 'dino') ctx.fillStyle = '#22c55e';
    else if (suit === 'astronaut') ctx.fillStyle = '#f8fafc';
    else if (suit === 'king') ctx.fillStyle = '#fbbf24';
    else ctx.fillStyle = '#ef4444'; // Rojo Super Diego

    ctx.beginPath();
    ctx.roundRect(18, 24, 26, 26, 8);
    ctx.fill();

    // Emblema en la camiseta (Letra "D" de Diego)
    ctx.fillStyle = suit === 'dino' ? '#ffffff' : '#fbbf24';
    ctx.font = 'bold 13px Fredoka, sans-serif';
    ctx.fillText('D', 27, 42);

    // 4. Brazos
    ctx.strokeStyle = '#fed7aa';
    ctx.lineWidth = 7;
    ctx.beginPath();
    if (isJumping) {
      // Brazos arriba festejando
      ctx.moveTo(18, 28);
      ctx.lineTo(10, 14);
      ctx.moveTo(42, 28);
      ctx.lineTo(50, 14);
    } else {
      ctx.moveTo(18, 28);
      ctx.lineTo(12 - armOffset, 42);
      ctx.moveTo(42, 28);
      ctx.lineTo(48 + armOffset, 42);
    }
    ctx.stroke();

    // 5. Cabeza de Diego Jr (Carita redonda sonriente de 4 años)
    ctx.save();
    ctx.translate(0, headBob);

    // Cara
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(31, 16, 17, 0, Math.PI * 2);
    ctx.fill();

    // Mejillas rosaditas
    ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
    ctx.beginPath();
    ctx.arc(22, 20, 4, 0, Math.PI * 2);
    ctx.arc(40, 20, 4, 0, Math.PI * 2);
    ctx.fill();

    // Ojos brillantes animados
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(26, 15, 3.2, 0, Math.PI * 2);
    ctx.arc(36, 15, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Brillo blanco en los ojos (efecto Pixar)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(27, 14, 1.3, 0, Math.PI * 2);
    ctx.arc(37, 14, 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Sonrisa feliz grande
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(31, 18, 6, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    // Cabello castaño despeinado con mechón simpático
    if (suit === 'astronaut') {
      // Casco espacial de cristal
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
      ctx.beginPath();
      ctx.arc(31, 16, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(31, 13, 17, Math.PI, Math.PI * 2);
      ctx.lineTo(48, 16);
      ctx.lineTo(46, 8);
      ctx.lineTo(38, 2);
      ctx.lineTo(28, 0); // Mechón alto
      ctx.lineTo(22, 3);
      ctx.lineTo(14, 16);
      ctx.closePath();
      ctx.fill();
    }

    // Accesorios de traje en la cabeza
    if (suit === 'king') {
      // Corona de oro brillante
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(22, -10);
      ctx.lineTo(31, -4);
      ctx.lineTo(40, -10);
      ctx.lineTo(44, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rubí central
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(31, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (suit === 'dino') {
      // Cresta de dinosaurio
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.moveTo(26, -4);
      ctx.lineTo(31, -12);
      ctx.lineTo(36, -4);
      ctx.fill();
    }

    ctx.restore();

    // 6. Efecto de Burbuja Protectora (si tiene el escudo activo)
    if (state.powerup && state.powerup.type === 'shield') {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.fillStyle = 'rgba(186, 230, 253, 0.25)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(31, 35, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  // Previsualización de traje en el menú
  function renderAvatarPreview() {
    const ctx = dom.previewCtx;
    ctx.clearRect(0, 0, dom.previewCanvas.width, dom.previewCanvas.height);
    drawDiegoJr(ctx, 50, 48, state.suit, Date.now() * 0.02, false, false, false);
    requestAnimationFrame(renderAvatarPreview);
  }

  // ==============================================================
  // 3. MUNDO, PARALLAX Y ESCENARIO
  // ==============================================================
  let worldWidth = 800;
  let worldHeight = 500;
  let groundY = 0;

  // Ajustar tamaño del canvas responsivo a pantalla completa
  function resizeCanvas() {
    const rect = dom.canvas.parentElement.getBoundingClientRect();
    worldWidth = rect.width;
    worldHeight = rect.height;

    dom.canvas.width = worldWidth * (window.devicePixelRatio || 1);
    dom.canvas.height = worldHeight * (window.devicePixelRatio || 1);
    dom.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    groundY = worldHeight * (1 - CONFIG.groundHeightRatio);
    if (player.y === 0) player.y = groundY - player.height;
  }
  window.addEventListener('resize', resizeCanvas);

  // Nubes y colinas procedimentales
  let skyOffset = 0;
  let hillOffset1 = 0;
  let hillOffset2 = 0;
  let groundOffset = 0;

  function drawParallaxBackground(ctx) {
    // 1. Cielo con degradado radiante
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#38bdf8');
    skyGrad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, worldWidth, worldHeight);

    // 2. Sol sonriente con gafas de sol
    ctx.save();
    ctx.translate(worldWidth - 110, 75);
    // Rayos del sol
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.6)';
    ctx.lineWidth = 5;
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(38, 0);
      ctx.lineTo(52, 0);
      ctx.stroke();
    }
    // Cuerpo del sol
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.fill();
    // Gafas de sol simpáticas
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-18, -6, 14, 9);
    ctx.fillRect(4, -6, 14, 9);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, -2);
    ctx.lineTo(4, -2);
    ctx.stroke();
    // Sonrisa
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 8, 8, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
    ctx.restore();

    // 3. Nubes del fondo suave (Parallax lento)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 320) - skyOffset) % (worldWidth + 300) - 100;
      const cy = 40 + (i % 3) * 35;
      drawFluffyCloud(ctx, cx, cy, 55);
    }

    // 4. Colinas lejanas de caramelo (Violeta pastel)
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let x = 0; x <= worldWidth + 50; x += 50) {
      const hillY = groundY - 60 + Math.sin((x + hillOffset1) * 0.005) * 45;
      ctx.lineTo(x, hillY);
    }
    ctx.lineTo(worldWidth, groundY);
    ctx.fill();

    // 5. Colinas medias de hierba y piruletas (Verde brillante)
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let x = 0; x <= worldWidth + 40; x += 40) {
      const hillY = groundY - 30 + Math.sin((x + hillOffset2) * 0.009) * 28;
      ctx.lineTo(x, hillY);
    }
    ctx.lineTo(worldWidth, groundY);
    ctx.fill();

    // 6. Suelo Principal (Tierra de chocolate + Césped verde lima)
    // Camino de arcoíris si el power-up está activo
    if (state.powerup && state.powerup.type === 'rainbow') {
      const rainbowColors = ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#a855f7'];
      const sliceH = (worldHeight - groundY) / rainbowColors.length;
      rainbowColors.forEach((color, idx) => {
        ctx.fillStyle = color;
        ctx.fillRect(0, groundY + idx * sliceH, worldWidth, sliceH);
      });
    } else {
      // Tierra
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, groundY, worldWidth, worldHeight - groundY);

      // Pasto
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, groundY, worldWidth, 18);

      // Borde de hierba brillante con ondas
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      for (let x = 0; x <= worldWidth; x += 24) {
        ctx.arc(x - (groundOffset % 24), groundY + 18, 12, 0, Math.PI);
      }
      ctx.fill();
    }

    // Flores coloridas en el césped que se desplazan
    for (let i = 0; i < 8; i++) {
      const fx = ((i * 180) - groundOffset) % (worldWidth + 180);
      drawFlower(ctx, fx, groundY + 8, i % 3);
    }
  }

  function drawFluffyCloud(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
    ctx.arc(x + r * 0.5, y - r * 0.2, r * 0.7, 0, Math.PI * 2);
    ctx.arc(x + r, y, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFlower(ctx, x, y, type) {
    const colors = ['#f43f5e', '#fbbf24', '#38bdf8'];
    ctx.fillStyle = colors[type];
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==============================================================
  // 4. ENTIDADES: ESTRELLAS, CARAMELOS, ANIMALITOS Y POWER-UPS
  // ==============================================================
  let items = [];
  let particles = [];
  let nextSpawnDistance = 150;

  function spawnWorldItems() {
    if (state.distance < nextSpawnDistance) return;
    nextSpawnDistance = state.distance + 140 + Math.random() * 120;

    const pattern = Math.floor(Math.random() * 4);

    if (pattern === 0) {
      // Arco de 5 estrellas brillantes para saltar
      for (let i = 0; i < 5; i++) {
        const archY = groundY - 70 - Math.sin((i / 4) * Math.PI) * 75;
        items.push({
          type: 'star',
          x: worldWidth + i * 42,
          y: archY,
          width: 32,
          height: 32,
          color: '#fbbf24'
        });
      }
    } else if (pattern === 1) {
      // Animalito saltarín adorable (No hay muerte trágica, solo rebote alegre)
      const animals = ['turtle', 'frog', 'bunny'];
      const chosen = animals[Math.floor(Math.random() * animals.length)];
      items.push({
        type: 'creature',
        animal: chosen,
        x: worldWidth,
        y: groundY - 45,
        width: 45,
        height: 45
      });

      // Caramelos encima del animalito para motivar a saltar
      items.push({
        type: 'candy',
        x: worldWidth + 8,
        y: groundY - 110,
        width: 30,
        height: 30
      });
    } else if (pattern === 2) {
      // Power-up sorpresa (Cohete, Imán o Escudo de Burbuja)
      const ptypes = ['rocket', 'magnet', 'shield', 'rainbow'];
      const selected = ptypes[Math.floor(Math.random() * ptypes.length)];
      items.push({
        type: 'powerup',
        pType: selected,
        x: worldWidth,
        y: groundY - 80,
        width: 44,
        height: 44
      });
    } else {
      // Fruta grande deliciosa (Fresa / Plátano)
      items.push({
        type: 'fruit',
        x: worldWidth,
        y: groundY - 60,
        width: 36,
        height: 36
      });
    }
  }

  // Dibujar y animar items
  function updateAndDrawItems(ctx) {
    const time = Date.now() * 0.005;

    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];

      // Mover con el scroll del mundo
      it.x -= state.speed;

      // Imán Mágico: atrae estrellas y frutas hacia Diego Jr
      if (state.powerup && state.powerup.type === 'magnet' && (it.type === 'star' || it.type === 'candy' || it.type === 'fruit')) {
        const dx = player.x + 20 - it.x;
        const dy = player.y + 20 - it.y;
        it.x += dx * 0.12;
        it.y += dy * 0.12;
      }

      // Dibujar según el tipo
      if (it.type === 'star') {
        drawStarIcon(ctx, it.x + 16, it.y + 16, 15, Math.sin(time + it.x * 0.01) * 0.3);
      } else if (it.type === 'candy') {
        drawCandyIcon(ctx, it.x + 15, it.y + 15);
      } else if (it.type === 'fruit') {
        drawFruitIcon(ctx, it.x + 18, it.y + 18);
      } else if (it.type === 'powerup') {
        drawPowerupIcon(ctx, it.x + 22, it.y + 22, it.pType);
      } else if (it.type === 'creature') {
        drawCreature(ctx, it.x + 22, it.y + 22, it.animal);
      }

      // Detección de colisión con Diego Jr
      const playerBox = {
        x: player.x + 10,
        y: player.y + 8,
        w: player.width - 20,
        h: player.height - 16
      };

      if (
        it.x < playerBox.x + playerBox.w &&
        it.x + it.width > playerBox.x &&
        it.y < playerBox.y + playerBox.h &&
        it.y + it.height > playerBox.y
      ) {
        // Colisión resuelta
        handleItemCollection(it);
        items.splice(i, 1);
        continue;
      }

      // Eliminar si sale por la izquierda de la pantalla
      if (it.x + it.width < -50) {
        items.splice(i, 1);
      }
    }
  }

  function handleItemCollection(it) {
    if (it.type === 'star') {
      state.stars++;
      playStarSound(state.stars);
      vibrate(25);
      spawnStarParticles(it.x + 16, it.y + 16, '#fbbf24');
      dom.hudStars.textContent = state.stars;

      // Didáctica de números en voz alta cada 1 estrella hasta 10, luego de 5 en 5
      if (state.stars <= 10) {
        showDidacticNumber(state.stars, NUMBER_WORDS[state.stars]);
        speak(NUMBER_WORDS[state.stars]);
      } else if (state.stars % 5 === 0) {
        const phrase = PRAISES[Math.floor(Math.random() * PRAISES.length)];
        speak(phrase);
      }
    } else if (it.type === 'candy' || it.type === 'fruit') {
      state.candies++;
      playStarSound(6);
      vibrate(30);
      spawnStarParticles(it.x + 16, it.y + 16, '#f43f5e');
      speak(it.type === 'candy' ? '¡Caramelo delicioso!' : '¡Fresa fresca!');
    } else if (it.type === 'powerup') {
      activatePowerup(it.pType);
    } else if (it.type === 'creature') {
      // Choque amigable con animalito: ¡Rebota alegremente, no muere!
      if (state.powerup && (state.powerup.type === 'shield' || state.powerup.type === 'rainbow' || state.powerup.type === 'rocket')) {
        // Con escudo o cohete atraviesa con fiesta
        playPowerupSound();
        spawnStarParticles(it.x + 22, it.y + 22, '#38bdf8');
      } else {
        // Rebote suave
        playBoingSound();
        vibrate(50);
        player.vy = -8.5; // Pequeño salto automático de rebote
        spawnStarParticles(it.x + 22, it.y + 22, '#4ade80');
        speak('¡Boing! ¡Saltaste al conejito!');
      }
    }
  }

  function activatePowerup(type) {
    playPowerupSound();
    vibrate(60);

    const names = {
      rocket: '¡COHETE MÁGICO!',
      magnet: '¡IMÁN DE ESTRELLAS!',
      shield: '¡BURBUJA PROTECTORA!',
      rainbow: '¡MODO ARCOÍRIS VELOZ!'
    };

    const emojis = {
      rocket: '🚀',
      magnet: '🧲',
      shield: '🫧',
      rainbow: '🌈'
    };

    state.powerup = {
      type: type,
      duration: 380,
      maxDuration: 380
    };

    dom.powerupIcon.textContent = emojis[type];
    dom.powerupTitle.textContent = names[type];
    dom.powerupBanner.classList.remove('hidden');

    speak(names[type]);
  }

  // Dibujos de iconos vectoriales para Canvas
  function drawStarIcon(ctx, x, y, r, rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;

    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * r, -Math.sin((18 + i * 72) * Math.PI / 180) * r);
      ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (r * 0.5), -Math.sin((54 + i * 72) * Math.PI / 180) * (r * 0.5));
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Carita sonriente en la estrella
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(-4, -2, 1.5, 0, Math.PI * 2);
    ctx.arc(4, -2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 1, 3.5, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    ctx.restore();
  }

  function drawCandyIcon(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 1.3);
    ctx.stroke();

    // Envoltura
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-20, -8);
    ctx.lineTo(-20, 8);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(20, -8);
    ctx.lineTo(20, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawFruitIcon(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    // Fresa
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.quadraticCurveTo(-14, 0, -10, -8);
    ctx.quadraticCurveTo(0, -12, 10, -8);
    ctx.quadraticCurveTo(14, 0, 0, 14);
    ctx.fill();

    // Hojitas verdes
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(0, -10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPowerupIcon(ctx, x, y, pType) {
    ctx.save();
    ctx.translate(x, y);
    // Globo brillante de fondo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = '22px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const icons = { rocket: '🚀', magnet: '🧲', shield: '🫧', rainbow: '🌈' };
    ctx.fillText(icons[pType] || '⭐', 0, 2);
    ctx.restore();
  }

  function drawCreature(ctx, x, y, animal) {
    ctx.save();
    ctx.translate(x, y);

    if (animal === 'turtle') {
      // Tortuguita con caparazón verde
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(0, 0, 16, Math.PI, 0);
      ctx.fill();

      // Cabeza
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(16, -4, 8, 0, Math.PI * 2);
      ctx.fill();

      // Gafitas de sol
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(14, -7, 6, 5);
    } else if (animal === 'frog') {
      // Ranita saltarina
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ojos grandes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-6, -12, 6, 0, Math.PI * 2);
      ctx.arc(6, -12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-5, -12, 3, 0, Math.PI * 2);
      ctx.arc(5, -12, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Conejito blanco
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(0, 4, 15, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Orejas
      ctx.beginPath();
      ctx.ellipse(-5, -14, 4, 10, -0.1, 0, Math.PI * 2);
      ctx.ellipse(5, -14, 4, 10, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ==============================================================
  // 5. PARTÍCULAS DE CONFETI Y ESTRELLAS
  // ==============================================================
  function spawnStarParticles(x, y, color = '#fbbf24') {
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.7) * 7,
        size: 5 + Math.random() * 6,
        color: color,
        life: 1.0
      });
    }
  }

  function updateAndDrawParticles(ctx) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // Gravedad suave
      p.life -= 0.035;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Didáctica Toast flotante
  function showDidacticNumber(num, word) {
    dom.didacticNumber.textContent = num;
    dom.didacticWord.textContent = word;
    dom.didacticToast.classList.remove('hidden');

    clearTimeout(dom.didacticToast._timer);
    dom.didacticToast._timer = setTimeout(() => {
      dom.didacticToast.classList.add('hidden');
    }, 1500);
  }

  // ==============================================================
  // 6. BUCLE PRINCIPAL DE JUEGO (60 FPS LOOP)
  // ==============================================================
  let lastTime = 0;

  function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if (state.running && !state.paused) {
      updateGame();
    }

    renderGame();
    requestAnimationFrame(gameLoop);
  }

  function updateGame() {
    // 1. Acelerar ligeramente con la distancia
    state.speed = Math.min(CONFIG.maxSpeed, state.speed + CONFIG.speedIncrease);
    state.distance += state.speed * 0.1;
    dom.hudDistance.textContent = `${Math.floor(state.distance)}m`;

    // 2. Desplazar capas de Parallax
    skyOffset += state.speed * 0.2;
    hillOffset1 += state.speed * 0.5;
    hillOffset2 += state.speed * 0.8;
    groundOffset += state.speed;

    // 3. Físicas de Diego Jr
    player.runFrame++;

    // Si tiene el Cohete Mágico activo: vuela en el aire suavemente
    if (state.powerup && state.powerup.type === 'rocket') {
      player.rocketY = Math.sin(Date.now() * 0.004) * 50;
      player.y = (groundY - 140) + player.rocketY;
      player.vy = 0;
      player.isGrounded = false;
      // Estela de humo del cohete
      if (Math.random() < 0.6) {
        spawnStarParticles(player.x, player.y + 40, '#f97316');
      }
    } else {
      // Gravedad normal o gravedad reducida al planear con capa
      const currentGravity = state.isGliding ? CONFIG.glideGravity : CONFIG.gravity;
      player.vy += currentGravity;
      player.y += player.vy;

      // Colisión con el suelo
      if (player.y >= groundY - player.height) {
        player.y = groundY - player.height;
        player.vy = 0;
        player.isGrounded = true;
        player.jumpCount = 0;
        state.isGliding = false;
      } else {
        player.isGrounded = false;
      }
    }

    // 4. Temporizador de Power-up
    if (state.powerup) {
      state.powerup.duration--;
      const pct = (state.powerup.duration / state.powerup.maxDuration) * 100;
      dom.powerupFill.style.width = `${pct}%`;

      if (state.powerup.duration <= 0) {
        state.powerup = null;
        dom.powerupBanner.classList.add('hidden');
        speak('¡Sigue corriendo, Diego!');
      }
    }

    // 5. Generar nuevos items
    spawnWorldItems();
  }

  function renderGame() {
    const ctx = dom.ctx;
    ctx.clearRect(0, 0, worldWidth, worldHeight);

    // 1. Fondo Parallax
    drawParallaxBackground(ctx);

    // 2. Items coleccionables y animalitos
    updateAndDrawItems(ctx);

    // 3. Diego Jr
    const isRocket = state.powerup && state.powerup.type === 'rocket';
    drawDiegoJr(
      ctx,
      player.x,
      player.y,
      state.suit,
      player.runFrame,
      !player.isGrounded,
      state.isGliding,
      isRocket
    );

    // 4. Partículas
    updateAndDrawParticles(ctx);
  }

  // ==============================================================
  // 7. CONTROLES: SALTO Y FLOTAR CON CAPA (100% AMIGABLE)
  // ==============================================================
  function handleJump() {
    if (!state.running) return;

    if (player.isGrounded) {
      // Salto inicial alegre
      player.vy = CONFIG.jumpForce;
      player.isGrounded = false;
      player.jumpCount = 1;
      playJumpSound();
      vibrate(30);
      spawnStarParticles(player.x + 30, groundY, '#4ade80');
    } else if (player.jumpCount === 1) {
      // Doble salto / Desplegar Capa para planear
      player.vy = CONFIG.jumpForce * 0.85;
      player.jumpCount = 2;
      state.isGliding = true;
      playJumpSound();
      vibrate(40);
      spawnStarParticles(player.x + 30, player.y + 40, '#f43f5e');
      speak('¡A volar!');
    }
  }

  // ==============================================================
  // 8. FLUJO Y GESTIÓN DE PANTALLAS
  // ==============================================================
  function startGame() {
    state.running = true;
    state.paused = false;
    state.speed = CONFIG.baseSpeed;
    state.distance = 0;
    state.stars = 0;
    state.candies = 0;
    state.hearts = 3;
    state.powerup = null;
    items = [];
    particles = [];

    player.y = groundY - player.height;
    player.vy = 0;

    dom.hudStars.textContent = '0';
    dom.hudDistance.textContent = '0m';

    dom.startScreen.classList.add('hidden');
    dom.celebrationScreen.classList.add('hidden');
    dom.gameHud.classList.remove('hidden');
    dom.touchControls.classList.remove('hidden');

    initAudio();
    speak('¡Preparados, listos, ya! ¡Corre Diego!');
  }

  function pauseGame() {
    state.paused = !state.paused;
    dom.btnPause.textContent = state.paused ? '▶' : '⏸';
    if (state.paused) {
      speak('Pausa');
    }
  }

  function finishRunCelebration() {
    state.running = false;

    dom.gameHud.classList.add('hidden');
    dom.touchControls.classList.add('hidden');
    dom.powerupBanner.classList.add('hidden');

    dom.recapStars.textContent = state.stars;
    dom.recapDistance.textContent = `${Math.floor(state.distance)}m`;
    dom.recapCandies.textContent = state.candies;

    dom.celebrationScreen.classList.remove('hidden');

    // Confeti de fiesta
    for (let i = 0; i < 40; i++) {
      spawnStarParticles(worldWidth * Math.random(), worldHeight * 0.4, '#fbbf24');
    }

    playPowerupSound();
    speak('¡Eres un gran campeón, Diego Junior! ¡Felicidades!');

    // Guardar en el servidor
    fetch('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stars: state.stars,
        distance: Math.floor(state.distance),
        suit: state.suit
      })
    }).catch(() => {});
  }

  // ==============================================================
  // 9. EVENTOS Y CONFIGURACIÓN DE INTERFAZ
  // ==============================================================
  function setupEvents() {
    // 1. Botón Iniciar
    dom.btnStart.onclick = startGame;

    // 2. Botón Pausa
    dom.btnPause.onclick = pauseGame;

    // 3. Saltar con toque en pantalla o botón gigante
    dom.btnTouchJump.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleJump();
    });
    dom.btnTouchJump.onclick = handleJump;

    // Tocar el canvas directamente también salta (para niños de 4 años es lo más intuitivo)
    dom.canvas.addEventListener('pointerdown', (e) => {
      if (state.running && !state.paused) {
        handleJump();
      }
    });

    // Teclado (Barra espaciadora o Flecha arriba)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      } else if (e.code === 'KeyP') {
        pauseGame();
      }
    });

    // 4. Modal de Vestuario de Trajes
    dom.btnCloset.onclick = () => {
      dom.modalCloset.classList.remove('hidden');
    };
    dom.btnCloseCloset.onclick = () => {
      dom.modalCloset.classList.add('hidden');
    };
    dom.btnConfirmCloset.onclick = () => {
      dom.modalCloset.classList.add('hidden');
      speak('¡Excelente traje, Diego!');
    };

    dom.suitCards.forEach(card => {
      card.onclick = () => {
        dom.suitCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        state.suit = card.dataset.suit;
        localStorage.setItem('diego_suit', state.suit);

        const names = {
          super_diego: 'Super Diego (Capa Roja)',
          astronaut: 'Diego Astronauta 🚀',
          dino: 'Dino Diego 🦖',
          king: 'Rey Diego 👑'
        };
        dom.previewSuitName.textContent = names[state.suit];
        playStarSound(4);
      };
    });

    // 5. Botones de Sonido y Voz Didáctica
    dom.btnSound.onclick = () => {
      state.soundEnabled = !state.soundEnabled;
      dom.btnSound.textContent = state.soundEnabled ? '🔊 Sonido: ON' : '🔈 Sonido: OFF';
      dom.btnSound.classList.toggle('active', state.soundEnabled);
    };

    dom.btnVoice.onclick = () => {
      state.voiceEnabled = !state.voiceEnabled;
      dom.btnVoice.textContent = state.voiceEnabled ? '🗣️ Voz Didáctica: ON' : '🔇 Voz Didáctica: OFF';
      dom.btnVoice.classList.toggle('active', state.voiceEnabled);
      if (state.voiceEnabled) speak('¡Voz activada!');
    };

    // 6. Pantalla de Celebración
    dom.btnReplay.onclick = startGame;
    dom.btnHome.onclick = () => {
      dom.celebrationScreen.classList.add('hidden');
      dom.startScreen.classList.remove('hidden');
    };

    // Tocar la pantalla de celebración lanza confeti interactivo
    dom.celebrationScreen.addEventListener('pointerdown', (e) => {
      spawnStarParticles(e.clientX, e.clientY, '#f43f5e');
      playStarSound(Math.floor(Math.random() * 8));
    });

    // 7. Conectar Socket.io para vitores familiares
    try {
      if (typeof io !== 'undefined') {
        const socket = io();
        socket.on('family_cheer', (data) => {
          dom.cheerEmoji.textContent = data.emoji || '❤️';
          dom.cheerSender.textContent = `${data.from} te envió amor:`;
          dom.cheerMsg.textContent = data.message || '¡Bravo Diego Jr!';
          dom.familyCheerBanner.classList.remove('hidden');

          speak(data.message || '¡Bravo Diego!');

          setTimeout(() => {
            dom.familyCheerBanner.classList.add('hidden');
          }, 3500);
        });
      }
    } catch (e) {}
  }

  // Inicializar al cargar el DOM
  document.addEventListener('DOMContentLoaded', () => {
    resizeCanvas();
    setupEvents();
    renderAvatarPreview();
    requestAnimationFrame(gameLoop);
  });

})();
