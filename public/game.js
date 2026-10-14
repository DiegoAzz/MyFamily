// ==============================================================
// DIEGO JR: TEMPLE RUNNER 3D 🏺
// Motor 3D WebGL con Three.js estilo Temple Run:
// Perspectiva en 3ra persona sobre el puente del templo,
// diamantes dorados giratorios, enredaderas selváticas,
// colisiones reales con vidas (¡si no saltas te caes y pierdes!),
// controles táctiles gigantes y didáctica para niños de 4 años.
// ==============================================================

(function() {
  'use strict';

  // CONFIGURACIÓN DEL JUEGO
  const CONFIG = {
    laneWidth: 2.1,          // Distancia entre los 3 carriles (-2.1, 0, +2.1)
    baseSpeed: 17.0,         // Velocidad inicial agradable
    maxSpeed: 26.0,
    speedIncrement: 0.0025,
    gravity: 36.0,           // Gravedad de salto
    jumpVelocity: 14.5,      // Altura para saltar troncos y rocas
    chunkLength: 40,         // Longitud de cada segmento del templo
    numChunks: 7             // Chunks activos simultáneamente
  };

  const state = {
    running: false,
    paused: false,
    coins: 0,
    distance: 0,
    speed: CONFIG.baseSpeed,
    currentLane: 0,          // -1: Izquierda, 0: Centro, 1: Derecha
    targetX: 0,
    hearts: 3,               // 3 Vidas reales: Si choca, ¡pierde un corazón y si llega a 0 muere!
    soundEnabled: true,
    voiceEnabled: true,
    speedMode: 'gentle',
    powerup: null,           // { type: 'magnet'|'shield', duration: 400, maxDuration: 400 }
    isSliding: false,
    slideTimer: 0,
    invincibleTimer: 0,      // Parpadeo tras tropezar
    isFallen: false          // Caída por Game Over
  };

  // Frases didácticas en español
  const NUMBER_WORDS = [
    '¡CERO!', '¡UNO! 💎', '¡DOS! 💎', '¡TRES! 💎', '¡CUATRO! 💎',
    '¡CINCO! 💎', '¡SEIS! 💎', '¡SIETE! 💎', '¡OCHO! 💎', '¡NUEVE! 💎', '¡DIEZ! 🏆'
  ];

  const PRAISES = [
    '¡Increíble, Diego!', '¡Súper explorador!', '¡Qué rápido eres!',
    '¡Eres un campeón!', '¡Bravo Diego Jr!', '¡Excelente salto!'
  ];

  // REFERENCIAS DOM
  const dom = {
    canvas: document.getElementById('webglCanvas'),
    gameHud: document.getElementById('game-hud'),
    hudCoins: document.getElementById('hud-coins-val'),
    hudDistance: document.getElementById('hud-distance-val'),
    hudHearts: document.getElementById('hud-hearts'),
    btnPause: document.getElementById('btn-pause'),

    powerupBanner: document.getElementById('powerup-banner'),
    powerupEmoji: document.getElementById('powerup-emoji'),
    powerupName: document.getElementById('powerup-name'),
    powerupBarFill: document.getElementById('powerup-bar-fill'),

    didacticFloat: document.getElementById('didactic-float'),
    didacticBigNum: document.getElementById('didactic-big-num'),
    didacticWord: document.getElementById('didactic-word'),

    touchControls: document.getElementById('touch-controls'),
    btnTouchLeft: document.getElementById('btn-touch-left'),
    btnTouchJump: document.getElementById('btn-touch-jump'),
    btnTouchRight: document.getElementById('btn-touch-right'),

    menuScreen: document.getElementById('menu-screen'),
    btnStart: document.getElementById('btn-start'),
    btnToggleSound: document.getElementById('btn-toggle-sound'),
    btnToggleVoice: document.getElementById('btn-toggle-voice'),
    btnToggleSpeed: document.getElementById('btn-toggle-speed'),

    gameoverScreen: document.getElementById('gameover-screen'),
    gameoverCoins: document.getElementById('gameover-coins'),
    gameoverDistance: document.getElementById('gameover-distance'),
    btnGameoverRetry: document.getElementById('btn-gameover-retry'),
    btnGameoverMenu: document.getElementById('btn-gameover-menu'),

    celebrationScreen: document.getElementById('celebration-screen'),
    recapCoins: document.getElementById('recap-coins'),
    recapDistance: document.getElementById('recap-distance'),
    btnPlayAgain: document.getElementById('btn-play-again'),
    btnMenuBack: document.getElementById('btn-menu-back')
  };

  // ==============================================================
  // 1. SINTETIZADOR DE AUDIO Y VOZ DIDÁCTICA
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

  // Sonido de Diamante Dorado
  const COIN_CHORD = [587.33, 659.25, 783.99, 880.00, 1046.50];
  function playCoinSound(index = 0) {
    if (!state.soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    const freq = COIN_CHORD[index % COIN_CHORD.length];
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Salto de Explorador
  function playJumpSound() {
    if (!state.soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Sonido de Choque / Tropiezo con obstáculo
  function playCrashSound() {
    if (!state.soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.35);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Sonido de Derrota / Game Over
  function playGameOverSound() {
    if (!state.soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    const notes = [329.63, 293.66, 261.63, 196.00];
    notes.forEach((freq, idx) => {
      const t = audioCtx.currentTime + idx * 0.16;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  function speak(text) {
    if (!state.voiceEnabled) return;
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-LA';
      utterance.rate = 1.05;
      utterance.pitch = 1.35;

      const voices = window.speechSynthesis.getVoices();
      const esVoice = voices.find(v => v.lang.startsWith('es'));
      if (esVoice) utterance.voice = esVoice;

      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  }

  function vibrate(ms = 35) {
    if (navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (e) {}
    }
  }

  // Actualizar indicador de corazones en el HUD
  function updateHeartsHud() {
    const h = state.hearts;
    let html = '';
    for (let i = 0; i < 3; i++) {
      if (i < h) {
        html += '<span class="heart-pulse">❤️</span>';
      } else {
        html += '<span class="heart-pulse" style="opacity: 0.25; filter: grayscale(1);">💔</span>';
      }
    }
    dom.hudHearts.innerHTML = html;
  }

  // ==============================================================
  // 2. TEXTURAS PROCEDURALES EN CANVAS (ALTA FIDELIDAD)
  // ==============================================================
  function createStoneBridgeTexture() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');

    // Fondo piedra arenisca dorada de templo
    ctx.fillStyle = '#b48a52';
    ctx.fillRect(0, 0, 512, 512);

    // Baldosas de piedra tallada con relieve pronunciado
    const rows = 8;
    const cols = 4;
    const rh = 512 / rows;
    const cw = 512 / cols;

    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (cw / 2);
      for (let col = -1; col <= cols; col++) {
        const x = col * cw + offset;
        const y = r * rh;

        // Tonalidad de piedra cálida
        const shade = Math.floor(190 + Math.random() * 45);
        ctx.fillStyle = `rgb(${shade}, ${shade * 0.76}, ${shade * 0.42})`;
        ctx.fillRect(x + 4, y + 4, cw - 8, rh - 8);

        // Bisel superior iluminado
        ctx.fillStyle = 'rgba(255, 245, 210, 0.35)';
        ctx.fillRect(x + 4, y + 4, cw - 8, 4);

        // Borde profundo entre baldosas
        ctx.strokeStyle = '#4e3312';
        ctx.lineWidth = 4;
        ctx.strokeRect(x + 2, y + 2, cw - 4, rh - 4);

        // Manchas de musgo verde de la selva
        if (Math.random() < 0.35) {
          ctx.fillStyle = 'rgba(34, 100, 50, 0.55)';
          ctx.beginPath();
          ctx.arc(x + cw * 0.45, y + rh * 0.55, 14 + Math.random() * 12, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function createWoodPlankTexture() {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#4a2c14';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 8; i++) {
      const y = i * 32;
      ctx.fillStyle = i % 2 === 0 ? '#633c1c' : '#45270f';
      ctx.fillRect(0, y + 3, 256, 26);

      // Clavos y textura
      ctx.fillStyle = '#1c0f05';
      ctx.beginPath();
      ctx.arc(16, y + 16, 3, 0, Math.PI * 2);
      ctx.arc(240, y + 16, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  // ==============================================================
  // 3. MOTOR THREE.JS Y ESCENA 3D
  // ==============================================================
  let scene, camera, renderer;
  let playerGroup, playerAnim = { legL: null, legR: null, armL: null, armR: null, hat: null, body: null };
  let chunks = [];
  let coins = [];
  let obstacles = [];
  let cameraShake = 0;

  let stoneTex, woodTex;
  let stoneMat, woodMat, goldMat, trunkMat, totemMat;

  function initThree() {
    // 1. Escena con niebla tropical de templo
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a454d);
    scene.fog = new THREE.FogExp2(0x1a454d, 0.014);

    // 2. Cámara en tercera persona detrás de Diego Jr
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 400);
    camera.position.set(0, 3.8, 6.2);
    camera.lookAt(0, 1.8, -12);

    // 3. Renderizador WebGL
    renderer = new THREE.WebGLRenderer({
      canvas: dom.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // 4. Luces ambientales y solar
    const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.0);
    sunLight.position.set(16, 32, 22);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x1b4d2e, 0.55);
    scene.add(hemiLight);

    // 5. Materiales
    stoneTex = createStoneBridgeTexture();
    woodTex = createWoodPlankTexture();

    stoneMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.7,
      metalness: 0.12
    });

    woodMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.85
    });

    // Diamante Dorado con resplandor oro (idéntico a Temple Run)
    goldMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      emissive: 0xb37700,
      metalness: 0.95,
      roughness: 0.12
    });

    trunkMat = new THREE.MeshStandardMaterial({
      color: 0x5c3317,
      roughness: 0.85
    });

    totemMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.75
    });

    // 6. Construir al personaje Diego Jr Explorador
    buildDiegoJr();

    // 7. Generar segmentos de pista
    initTrackChunks();

    window.addEventListener('resize', onWindowResize);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ==============================================================
  // 4. MODELO 3D: DIEGO JR EXPLORADOR (4 AÑOS)
  // ==============================================================
  function buildDiegoJr() {
    playerGroup = new THREE.Group();

    // 1. Torso con camisa de explorador
    const bodyGeo = new THREE.BoxGeometry(0.76, 0.85, 0.52);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe5d0ba });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 1.05;
    bodyMesh.castShadow = true;
    playerGroup.add(bodyMesh);
    playerAnim.body = bodyMesh;

    // Bandolera cruzada
    const strapGeo = new THREE.BoxGeometry(0.82, 0.12, 0.56);
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x5c3317 });
    const strapMesh = new THREE.Mesh(strapGeo, strapMat);
    strapMesh.position.y = 1.05;
    strapMesh.rotation.z = 0.55;
    playerGroup.add(strapMesh);

    // Bolso en la cadera
    const bagGeo = new THREE.BoxGeometry(0.32, 0.35, 0.22);
    const bagMesh = new THREE.Mesh(bagGeo, strapMat);
    bagMesh.position.set(-0.44, 0.85, 0.05);
    playerGroup.add(bagMesh);

    // 2. Cabeza de Diego Jr
    const headGeo = new THREE.SphereGeometry(0.36, 16, 16);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffd2a5, roughness: 0.6 });
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.y = 1.72;
    headMesh.castShadow = true;
    playerGroup.add(headMesh);

    // Ojos
    const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.12, 1.74, -0.32);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.12, 1.74, -0.32);
    playerGroup.add(eyeL);
    playerGroup.add(eyeR);

    // 3. Sombrero Fedora de Explorador (Temple Run)
    const hatGroup = new THREE.Group();
    const brimGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.04, 20);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x6e4726, roughness: 0.8 });
    const brimMesh = new THREE.Mesh(brimGeo, hatMat);
    brimMesh.position.y = 1.95;
    hatGroup.add(brimMesh);

    const crownGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.32, 16);
    const crownMesh = new THREE.Mesh(crownGeo, hatMat);
    crownMesh.position.y = 2.1;
    hatGroup.add(crownMesh);

    const bandGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.08, 16);
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x2b1708 });
    const bandMesh = new THREE.Mesh(bandGeo, bandMat);
    bandMesh.position.y = 1.99;
    hatGroup.add(bandMesh);

    playerGroup.add(hatGroup);
    playerAnim.hat = hatGroup;

    // 4. Brazos
    const armGeo = new THREE.BoxGeometry(0.2, 0.65, 0.2);
    armGeo.translate(0, -0.3, 0);

    const armL = new THREE.Mesh(armGeo, bodyMat);
    armL.position.set(-0.48, 1.4, 0);
    playerGroup.add(armL);
    playerAnim.armL = armL;

    const armR = new THREE.Mesh(armGeo, bodyMat);
    armR.position.set(0.48, 1.4, 0);
    playerGroup.add(armR);
    playerAnim.armR = armR;

    // 5. Piernas y botas
    const legGeo = new THREE.BoxGeometry(0.25, 0.75, 0.25);
    legGeo.translate(0, -0.35, 0);
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x4a2e19 });

    const legL = new THREE.Mesh(legGeo, pantsMat);
    legL.position.set(-0.22, 0.7, 0);
    playerGroup.add(legL);
    playerAnim.legL = legL;

    const legR = new THREE.Mesh(legGeo, pantsMat);
    legR.position.set(0.22, 0.7, 0);
    playerGroup.add(legR);
    playerAnim.legR = legR;

    // Botas
    const bootGeo = new THREE.BoxGeometry(0.28, 0.22, 0.38);
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x221307 });
    const bootL = new THREE.Mesh(bootGeo, bootMat);
    bootL.position.set(0, -0.68, -0.06);
    legL.add(bootL);

    const bootR = new THREE.Mesh(bootGeo, bootMat);
    bootR.position.set(0, -0.68, -0.06);
    legR.add(bootR);

    playerGroup.position.set(0, 0, 0);
    scene.add(playerGroup);
  }

  // ==============================================================
  // 5. CHUNKS DEL TEMPLO (ENDLESS RUNNER 3D)
  // ==============================================================
  function createBridgeChunk(zPos, isWoodBridge = false) {
    const chunk = new THREE.Group();
    chunk.position.z = zPos;

    const len = CONFIG.chunkLength;
    const width = 6.4;

    // Suelo
    const floorGeo = new THREE.BoxGeometry(width, 1.2, len);
    const floorMesh = new THREE.Mesh(floorGeo, isWoodBridge ? woodMat : stoneMat);
    floorMesh.position.y = -0.6;
    floorMesh.receiveShadow = true;
    chunk.add(floorMesh);

    // Muros laterales
    const wallGeo = new THREE.BoxGeometry(0.55, 1.1, len);
    const wallL = new THREE.Mesh(wallGeo, stoneMat);
    wallL.position.set(-width / 2 + 0.25, 0.45, 0);
    wallL.castShadow = true;
    chunk.add(wallL);

    const wallR = new THREE.Mesh(wallGeo, stoneMat);
    wallR.position.set(width / 2 - 0.25, 0.45, 0);
    wallR.castShadow = true;
    chunk.add(wallR);

    // Almenas decorativas
    const blockGeo = new THREE.BoxGeometry(0.65, 0.45, 1.2);
    for (let bz = -len / 2 + 2; bz < len / 2; bz += 3.5) {
      const blkL = new THREE.Mesh(blockGeo, stoneMat);
      blkL.position.set(-width / 2 + 0.25, 1.1, bz);
      chunk.add(blkL);

      const blkR = new THREE.Mesh(blockGeo, stoneMat);
      blkR.position.set(width / 2 - 0.25, 1.1, bz);
      chunk.add(blkR);
    }

    // Palmeras y vegetación tropical en el abismo
    createTropicalPalm(chunk, -width - 4.5, -8, -len * 0.25);
    createTropicalPalm(chunk, width + 4.5, -8, len * 0.25);

    scene.add(chunk);
    return chunk;
  }

  // Palmeras tropicales detalladas con hojas arqueadas
  function createTropicalPalm(parent, x, y, z) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, y, z);

    // Tronco curvado
    const trunkGeo = new THREE.CylinderGeometry(0.55, 0.95, 18, 8);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 9;
    treeGroup.add(trunk);

    // Hojas en abanico
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x1b4d2e, roughness: 0.6 });
    for (let i = 0; i < 7; i++) {
      const leafGeo = new THREE.ConeGeometry(1.6, 6.5, 4);
      leafGeo.rotateX(Math.PI / 2.8);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(0, 18, 0);
      leaf.rotation.y = (i / 7) * Math.PI * 2;
      treeGroup.add(leaf);
    }

    parent.add(treeGroup);
  }

  function initTrackChunks() {
    for (let i = 0; i < CONFIG.numChunks; i++) {
      const z = -i * CONFIG.chunkLength;
      const isWood = (i % 3 === 2);
      const chk = createBridgeChunk(z, isWood);
      chunks.push({ group: chk, z: z });

      if (i > 0) {
        spawnCoinsOnChunk(z);
        spawnObstacleOnChunk(z);
      }
    }
  }

  // ==============================================================
  // 6. DIAMANTES DORADOS GIRATORIOS Y OBSTÁCULOS REALES
  // ==============================================================
  function createDiamondCoin(x, y, z) {
    const geo = new THREE.OctahedronGeometry(0.42, 0);
    geo.scale(1.0, 1.45, 0.45);

    const mesh = new THREE.Mesh(geo, goldMat);
    mesh.position.set(x, y, z);
    scene.add(mesh);

    return {
      mesh: mesh,
      collected: false,
      initialY: y
    };
  }

  function spawnCoinsOnChunk(chunkZ) {
    const lane = Math.floor(Math.random() * 3) - 1;
    const laneX = lane * CONFIG.laneWidth;

    const count = 5;
    const spacing = 2.4;
    const startZ = chunkZ + (CONFIG.chunkLength / 2) - 8;

    for (let i = 0; i < count; i++) {
      const z = startZ - (i * spacing);
      const coin = createDiamondCoin(laneX, 1.1, z);
      coins.push(coin);
    }
  }

  // Obstáculos que EXIGEN interacción (saltar o esquivar)
  function spawnObstacleOnChunk(chunkZ) {
    const lane = Math.floor(Math.random() * 3) - 1;
    const laneX = lane * CONFIG.laneWidth;
    const z = chunkZ - (CONFIG.chunkLength * 0.28);

    const type = Math.random() < 0.5 ? 'hurdle' : 'totem';

    let mesh;
    let height = 0.65;

    if (type === 'hurdle') {
      // Tronco caído / valla de piedra (¡TIENES QUE SALTARLO!)
      const geo = new THREE.CylinderGeometry(0.35, 0.35, 2.0, 8);
      geo.rotateZ(Math.PI / 2);
      mesh = new THREE.Mesh(geo, trunkMat);
      mesh.position.set(laneX, 0.35, z);
      height = 0.65;
    } else {
      // Tótem / Pilar alto de piedra (¡TIENES QUE ESQUIVARLO CAMBIANDO DE CARRIL!)
      const geo = new THREE.BoxGeometry(1.2, 2.2, 1.2);
      mesh = new THREE.Mesh(geo, totemMat);
      mesh.position.set(laneX, 1.1, z);
      height = 2.2;
    }

    mesh.castShadow = true;
    scene.add(mesh);

    obstacles.push({
      mesh: mesh,
      x: laneX,
      z: z,
      type: type,
      height: height,
      cleared: false
    });
  }

  // ==============================================================
  // 7. FÍSICAS DE MOVIMIENTO Y CONTROL (SIN AUTO-SALTO)
  // ==============================================================
  let playerY = 0;
  let playerVy = 0;
  let isGrounded = true;

  function handleLaneChange(dir) {
    if (!state.running || state.paused || state.isFallen) return;

    state.currentLane = Math.max(-1, Math.min(1, state.currentLane + dir));
    state.targetX = state.currentLane * CONFIG.laneWidth;

    playJumpSound();
    vibrate(25);
  }

  function handleJump() {
    if (!state.running || state.paused || state.isFallen) return;

    if (isGrounded) {
      playerVy = CONFIG.jumpVelocity;
      isGrounded = false;
      playJumpSound();
      vibrate(40);
    }
  }

  // ==============================================================
  // 8. COLISIONES REALES Y SISTEMA DE VIDAS (GAME OVER)
  // ==============================================================
  function handleObstacleCrash() {
    if (state.invincibleTimer > 0 || state.isFallen) return;

    playCrashSound();
    vibrate(70);
    cameraShake = 0.55;

    // Perder un corazón
    state.hearts--;
    updateHeartsHud();

    if (state.hearts <= 0) {
      // ¡SE ACABARON LAS VIDAS! -> GAME OVER REAL
      triggerGameOver();
    } else {
      // Tropiezo temporal con invulnerabilidad
      state.invincibleTimer = 80; // ~1.3 segundos de parpadeo
      speak(state.hearts === 1 ? '¡Cuidado Diego! ¡Te queda una vida!' : '¡Ay! ¡Tropezaste!');
    }
  }

  function triggerGameOver() {
    state.isFallen = true;
    state.running = false;

    // Animación de caída hacia adelante
    playerAnim.body.rotation.x = Math.PI / 2.2;
    playerAnim.hat.position.z = -1.2; // El sombrero sale rodando
    playerY = 0.2;

    playGameOverSound();
    speak('¡Oh no! ¡Te has caído, Diego! ¡Inténtalo de nuevo!');

    setTimeout(() => {
      dom.gameHud.classList.add('hidden');
      dom.touchControls.classList.add('hidden');
      dom.powerupBanner.classList.add('hidden');

      dom.gameoverCoins.textContent = state.coins;
      dom.gameoverDistance.textContent = `${Math.floor(state.distance)}m`;
      dom.gameoverScreen.classList.remove('hidden');
    }, 1100);
  }

  // ==============================================================
  // 9. BUCLE PRINCIPAL DE ANIMACIÓN Y FÍSICA (60 FPS)
  // ==============================================================
  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (state.running && !state.paused && !state.isFallen) {
      updateGame(delta);
    }

    // Rotar diamantes dorados continuamente
    const time = Date.now() * 0.003;
    for (let i = 0; i < coins.length; i++) {
      const c = coins[i];
      if (!c.collected) {
        c.mesh.rotation.y += 0.045;
        c.mesh.position.y = c.initialY + Math.sin(time + c.mesh.position.z * 0.2) * 0.12;
      }
    }

    renderer.render(scene, camera);
  }

  function updateGame(delta) {
    // 1. Distancia
    state.distance += state.speed * delta;
    dom.hudDistance.textContent = `${Math.floor(state.distance)}m`;

    // 2. Movimiento suave entre carriles (Interpolación LERP)
    playerGroup.position.x += (state.targetX - playerGroup.position.x) * 14 * delta;

    // Inclinación dinámica de la cámara al cambiar de carril
    const rollAngle = (state.targetX - playerGroup.position.x) * 0.06;
    camera.rotation.z = -rollAngle;

    // Sacudida de cámara al chocar
    if (cameraShake > 0) {
      camera.position.x += (Math.random() - 0.5) * cameraShake;
      camera.position.y += (Math.random() - 0.5) * cameraShake;
      cameraShake *= 0.88;
      if (cameraShake < 0.02) cameraShake = 0;
    } else {
      camera.position.x = playerGroup.position.x * 0.35;
      camera.position.y = 3.8;
    }

    // 3. Físicas de Salto
    if (!isGrounded) {
      playerVy -= CONFIG.gravity * delta;
      playerY += playerVy * delta;

      if (playerY <= 0) {
        playerY = 0;
        playerVy = 0;
        isGrounded = true;
      }
    }
    playerGroup.position.y = playerY;

    // 4. Animación de Carrera
    const runCycle = Date.now() * 0.014 * (state.speed / 17);
    if (isGrounded) {
      playerAnim.legL.rotation.x = Math.sin(runCycle) * 0.75;
      playerAnim.legR.rotation.x = -Math.sin(runCycle) * 0.75;
      playerAnim.armL.rotation.x = -Math.sin(runCycle) * 0.75;
      playerAnim.armR.rotation.x = Math.sin(runCycle) * 0.75;
      playerAnim.hat.rotation.z = Math.sin(runCycle * 0.5) * 0.08;
    } else {
      // Brazos arriba al saltar
      playerAnim.legL.rotation.x = 0.4;
      playerAnim.legR.rotation.x = -0.3;
      playerAnim.armL.rotation.x = -2.2;
      playerAnim.armR.rotation.x = -2.2;
    }

    // Parpadeo de invulnerabilidad tras choque
    if (state.invincibleTimer > 0) {
      state.invincibleTimer--;
      playerGroup.visible = (Math.floor(state.invincibleTimer / 4) % 2 === 0);
    } else {
      playerGroup.visible = true;
    }

    // 5. Avance continuo
    const moveZ = state.speed * delta;
    playerGroup.position.z -= moveZ;
    camera.position.z = playerGroup.position.z + 6.2;

    // Reciclar chunks
    for (let i = 0; i < chunks.length; i++) {
      const chk = chunks[i];
      if (chk.group.position.z > camera.position.z + 10) {
        const farthestZ = Math.min(...chunks.map(c => c.group.position.z));
        chk.group.position.z = farthestZ - CONFIG.chunkLength;

        spawnCoinsOnChunk(chk.group.position.z);
        spawnObstacleOnChunk(chk.group.position.z);
      }
    }

    // 6. Recoger Diamantes Dorados
    for (let i = coins.length - 1; i >= 0; i--) {
      const coin = coins[i];
      if (coin.collected) continue;

      const pPos = playerGroup.position;
      const cPos = coin.mesh.position;

      // Imán
      if (state.powerup && state.powerup.type === 'magnet') {
        const dx = pPos.x - cPos.x;
        const dz = pPos.z - cPos.z;
        cPos.x += dx * 8 * delta;
        cPos.z += dz * 8 * delta;
      }

      const dist = Math.hypot(pPos.x - cPos.x, pPos.z - cPos.z);
      if (dist < 1.3 && Math.abs(pPos.y + 0.9 - cPos.y) < 1.5) {
        coin.collected = true;
        scene.remove(coin.mesh);
        coins.splice(i, 1);

        state.coins++;
        dom.hudCoins.textContent = state.coins;
        playCoinSound(state.coins);
        vibrate(20);

        if (state.coins <= 10) {
          showDidacticFloat(state.coins, NUMBER_WORDS[state.coins]);
          speak(NUMBER_WORDS[state.coins]);
        } else if (state.coins % 10 === 0) {
          const p = PRAISES[Math.floor(Math.random() * PRAISES.length)];
          speak(p);
        }
      } else if (cPos.z > camera.position.z + 10) {
        scene.remove(coin.mesh);
        coins.splice(i, 1);
      }
    }

    // 7. Colisiones con Obstáculos (¡SIN AUTO-SALTO!)
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      if (obs.cleared) continue;

      const pPos = playerGroup.position;
      const dx = Math.abs(pPos.x - obs.x);
      const dz = Math.abs(pPos.z - obs.z);

      // Si está en el mismo carril y a la misma altura longitudinal
      if (dx < 1.0 && dz < 1.1) {
        if (obs.type === 'hurdle' && playerY >= 0.8) {
          // ¡Saltó con éxito por encima del tronco!
          obs.cleared = true;
          playJumpSound();
        } else {
          // ¡NO SALTÓ NI CAMBIÓ DE CARRIL -> CHOCA Y PIERDE VIDA!
          obs.cleared = true;
          handleObstacleCrash();
        }
      } else if (obs.z > camera.position.z + 10) {
        scene.remove(obs.mesh);
        obstacles.splice(i, 1);
      }
    }

    // 8. Power-up
    if (state.powerup) {
      state.powerup.duration--;
      const pct = (state.powerup.duration / state.powerup.maxDuration) * 100;
      dom.powerupBarFill.style.width = `${pct}%`;

      if (state.powerup.duration <= 0) {
        state.powerup = null;
        dom.powerupBanner.classList.add('hidden');
      }
    }
  }

  function showDidacticFloat(num, word) {
    dom.didacticBigNum.textContent = num;
    dom.didacticWord.textContent = word;
    dom.didacticFloat.classList.remove('hidden');

    clearTimeout(dom.didacticFloat._timer);
    dom.didacticFloat._timer = setTimeout(() => {
      dom.didacticFloat.classList.add('hidden');
    }, 1400);
  }

  // ==============================================================
  // 10. REINICIO Y GESTIÓN DE EVENTOS
  // ==============================================================
  function startGame() {
    state.running = true;
    state.paused = false;
    state.isFallen = false;
    state.coins = 0;
    state.distance = 0;
    state.currentLane = 0;
    state.targetX = 0;
    state.hearts = 3;
    state.invincibleTimer = 0;
    state.speed = state.speedMode === 'gentle' ? CONFIG.baseSpeed : CONFIG.baseSpeed * 1.25;

    // Restaurar postura de Diego Jr
    playerGroup.position.set(0, 0, 0);
    playerAnim.body.rotation.x = 0;
    playerAnim.hat.position.set(0, 0, 0);
    playerY = 0;
    playerVy = 0;
    isGrounded = true;

    updateHeartsHud();
    dom.hudCoins.textContent = '0';
    dom.hudDistance.textContent = '0m';

    dom.menuScreen.classList.add('hidden');
    dom.gameoverScreen.classList.add('hidden');
    dom.celebrationScreen.classList.add('hidden');
    dom.gameHud.classList.remove('hidden');
    dom.touchControls.classList.remove('hidden');

    initAudio();
    speak('¡A correr por el templo! ¡Salta sobre los troncos para no caer!');
  }

  function setupControls() {
    // Botones de inicio y reintentar
    dom.btnStart.onclick = startGame;
    dom.btnGameoverRetry.onclick = startGame;
    dom.btnPlayAgain.onclick = startGame;

    dom.btnGameoverMenu.onclick = () => {
      dom.gameoverScreen.classList.add('hidden');
      dom.menuScreen.classList.remove('hidden');
    };

    dom.btnMenuBack.onclick = () => {
      dom.celebrationScreen.classList.add('hidden');
      dom.menuScreen.classList.remove('hidden');
    };

    dom.btnPause.onclick = () => {
      state.paused = !state.paused;
      dom.btnPause.textContent = state.paused ? '▶' : '⏸';
      if (state.paused) speak('Pausa');
    };

    // Botones de opciones
    dom.btnToggleSound.onclick = () => {
      state.soundEnabled = !state.soundEnabled;
      dom.btnToggleSound.textContent = state.soundEnabled ? '🔊 Sonido: ON' : '🔈 Sonido: OFF';
      dom.btnToggleSound.classList.toggle('active', state.soundEnabled);
    };

    dom.btnToggleVoice.onclick = () => {
      state.voiceEnabled = !state.voiceEnabled;
      dom.btnToggleVoice.textContent = state.voiceEnabled ? '🗣️ Voz: ON' : '🔇 Voz: OFF';
      dom.btnToggleVoice.classList.toggle('active', state.voiceEnabled);
      if (state.voiceEnabled) speak('¡Voz activada!');
    };

    dom.btnToggleSpeed.onclick = () => {
      state.speedMode = state.speedMode === 'gentle' ? 'fast' : 'gentle';
      dom.btnToggleSpeed.textContent = state.speedMode === 'gentle' ? '🐢 Velocidad: Suave' : '🚀 Velocidad: Rápida';
    };

    // Controles táctiles en pantalla
    dom.btnTouchLeft.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handleLaneChange(-1);
    });

    dom.btnTouchRight.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handleLaneChange(1);
    });

    dom.btnTouchJump.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handleJump();
    });

    // Toque directo en la pantalla: izquierda cambia a izquierda, derecha cambia a derecha, arriba salta
    dom.canvas.addEventListener('pointerdown', (e) => {
      if (!state.running || state.paused || state.isFallen) return;

      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const x = e.clientX;
      const y = e.clientY;

      if (y < screenH * 0.65) {
        // Tocar arriba salta
        handleJump();
      } else if (x < screenW * 0.4) {
        // Tocar izquierda
        handleLaneChange(-1);
      } else if (x > screenW * 0.6) {
        // Tocar derecha
        handleLaneChange(1);
      } else {
        // Tocar centro
        handleJump();
      }
    });

    // Deslizar con el dedo (Swipe como Temple Run auténtico)
    let touchStartX = 0;
    let touchStartY = 0;

    window.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
        if (dx > 0) handleLaneChange(1);
        else handleLaneChange(-1);
      } else if (dy < -30) {
        handleJump();
      }
    }, { passive: true });

    // Teclado
    window.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        handleLaneChange(-1);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        handleLaneChange(1);
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        e.preventDefault();
        handleJump();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initThree();
    setupControls();
    animate();
  });

})();
