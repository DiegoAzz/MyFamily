// ==============================================================
// DIEGO JR: TEMPLE RUNNER 3D 🏺
// Motor 3D WebGL con Three.js estilo Temple Run:
// Perspectiva en 3ra persona sobre el puente del templo,
// diamantes dorados giratorios, enredaderas selváticas,
// controles de 3 carriles y cero frustración para niños de 4 años.
// ==============================================================

(function() {
  'use strict';

  // CONFIGURACIÓN DEL JUEGO
  const CONFIG = {
    laneWidth: 2.1,          // Distancia entre los 3 carriles (-2.1, 0, +2.1)
    baseSpeed: 18.0,          // Velocidad del corredor
    maxSpeed: 28.0,
    speedIncrement: 0.003,
    gravity: 34.0,           // Gravedad del salto
    jumpVelocity: 14.0,      // Altura del salto
    chunkLength: 40,         // Longitud de cada segmento de puente 3D
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
    hearts: 3,
    soundEnabled: true,
    voiceEnabled: true,
    speedMode: 'gentle',     // 'gentle' | 'fast'
    powerup: null,           // { type: 'magnet'|'wings'|'shield', duration: 400, maxDuration: 400 }
    isSliding: false,
    slideTimer: 0,
    invincibleTimer: 0
  };

  // Frases didácticas en español
  const NUMBER_WORDS = [
    '¡CERO!', '¡UNO! 💎', '¡DOS! 💎', '¡TRES! 💎', '¡CUATRO! 💎',
    '¡CINCO! 💎', '¡SEIS! 💎', '¡SIETE! 💎', '¡OCHO! 💎', '¡NUEVE! 💎', '¡DIEZ! 🏆'
  ];

  const PRAISES = [
    '¡Increíble, Diego!', '¡Súper explorador!', '¡Qué rápido eres!',
    '¡Eres un campeón!', '¡Bravo Diego Jr!', '¡Excelente!'
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

  // Sonido de Diamante Dorado (Idéntico brillo de Temple Run)
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
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.18);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Sonido de Tambor del Templo al deslizarse
  function playSlideSound() {
    if (!state.soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.2);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Rebote divertido al chocar (Sin muerte)
  function playBoingSound() {
    if (!state.soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(360, now + 0.12);
    osc.frequency.linearRampToValueAtTime(150, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Voz didáctica en español
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

  function vibrate(ms = 30) {
    if (navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (e) {}
    }
  }

  // ==============================================================
  // 2. TEXTURAS PROCEDURALES EN CANVAS (100% LIBRE DE 404)
  // ==============================================================
  function createStoneBridgeTexture() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');

    // Fondo piedra arenisca dorada de templo
    ctx.fillStyle = '#b48a52';
    ctx.fillRect(0, 0, 512, 512);

    // Baldosas de piedra tallada
    const rows = 8;
    const cols = 4;
    const rh = 512 / rows;
    const cw = 512 / cols;

    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (cw / 2);
      for (let col = -1; col <= cols; col++) {
        const x = col * cw + offset;
        const y = r * rh;

        // Tonalidad de piedra
        const shade = Math.floor(180 + Math.random() * 40);
        ctx.fillStyle = `rgb(${shade}, ${shade * 0.78}, ${shade * 0.45})`;
        ctx.fillRect(x + 3, y + 3, cw - 6, rh - 6);

        // Borde biselado
        ctx.strokeStyle = '#6d4c20';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 2, y + 2, cw - 4, rh - 4);

        // Manchas de musgo verde selvático
        if (Math.random() < 0.3) {
          ctx.fillStyle = 'rgba(45, 106, 63, 0.45)';
          ctx.beginPath();
          ctx.arc(x + cw * 0.4, y + rh * 0.5, 12 + Math.random() * 10, 0, Math.PI * 2);
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

    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 8; i++) {
      const y = i * 32;
      ctx.fillStyle = i % 2 === 0 ? '#724728' : '#54341d';
      ctx.fillRect(0, y + 2, 256, 28);

      // Remaches de cuerda / metal
      ctx.fillStyle = '#22150c';
      ctx.beginPath();
      ctx.arc(14, y + 16, 3, 0, Math.PI * 2);
      ctx.arc(242, y + 16, 3, 0, Math.PI * 2);
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
  let playerGroup, playerAnim = { legL: null, legR: null, armL: null, armR: null, hat: null };
  let chunks = [];
  let coins = [];
  let obstacles = [];
  let particles3D = [];

  let stoneTex, woodTex;
  let stoneMat, woodMat, goldMat, obstacleMat;

  function initThree() {
    // 1. Escena con niebla tropical profunda
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x225566);
    scene.fog = new THREE.FogExp2(0x225566, 0.016);

    // 2. Cámara (Perspectiva idéntica a Temple Run: detrás del personaje)
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

    // 4. Iluminación ambiental y solar
    const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 0.9);
    sunLight.position.set(15, 30, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x1b4d2e, 0.5);
    scene.add(hemiLight);

    // 5. Materiales compartidos
    stoneTex = createStoneBridgeTexture();
    woodTex = createWoodPlankTexture();

    stoneMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.75,
      metalness: 0.15
    });

    woodMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.85
    });

    // Diamante Dorado de Temple Run (Brillo oro radiante)
    goldMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      emissive: 0x996600,
      metalness: 0.9,
      roughness: 0.15
    });

    obstacleMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.8
    });

    // 6. Construir al personaje Diego Jr Explorador
    buildDiegoJr();

    // 7. Generar segmentos iniciales del puente
    initTrackChunks();

    window.addEventListener('resize', onWindowResize);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ==============================================================
  // 4. MODELO 3D PROCEDURAL: DIEGO JR EXPLORADOR (4 AÑOS)
  // ==============================================================
  function buildDiegoJr() {
    playerGroup = new THREE.Group();

    // 1. Torso con camisa de explorador safari y correaje
    const bodyGeo = new THREE.BoxGeometry(0.75, 0.85, 0.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe5d0ba }); // Camisa beige safari
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 1.05;
    playerGroup.add(bodyMesh);

    // Bandolera / Mochila cruzada de explorador
    const strapGeo = new THREE.BoxGeometry(0.8, 0.12, 0.54);
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x5c3317 });
    const strapMesh = new THREE.Mesh(strapGeo, strapMat);
    strapMesh.position.y = 1.05;
    strapMesh.rotation.z = 0.55;
    playerGroup.add(strapMesh);

    // Bolso de explorador en la cadera
    const bagGeo = new THREE.BoxGeometry(0.32, 0.35, 0.22);
    const bagMesh = new THREE.Mesh(bagGeo, strapMat);
    bagMesh.position.set(-0.42, 0.85, 0.05);
    playerGroup.add(bagMesh);

    // 2. Cabeza redonda sonriente de Diego Jr
    const headGeo = new THREE.SphereGeometry(0.36, 16, 16);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffd2a5, roughness: 0.6 });
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.y = 1.72;
    playerGroup.add(headMesh);

    // Ojos brillantes
    const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.12, 1.74, -0.32);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.12, 1.74, -0.32);
    playerGroup.add(eyeL);
    playerGroup.add(eyeR);

    // 3. Sombrero Fedora de Explorador (Igual a Temple Run / Indiana Jones)
    const hatGroup = new THREE.Group();
    // Ala ancha del sombrero
    const brimGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.04, 20);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x6e4726, roughness: 0.8 });
    const brimMesh = new THREE.Mesh(brimGeo, hatMat);
    brimMesh.position.y = 1.95;
    hatGroup.add(brimMesh);

    // Copa del sombrero
    const crownGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.32, 16);
    const crownMesh = new THREE.Mesh(crownGeo, hatMat);
    crownMesh.position.y = 2.1;
    hatGroup.add(crownMesh);

    // Cinta de cuero del sombrero
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

    // 5. Piernas con pantalones cortos y botas de explorador
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

    // Posición inicial de Diego Jr
    playerGroup.position.set(0, 0, 0);
    scene.add(playerGroup);
  }

  // ==============================================================
  // 5. GENERADOR DE PUENTES DEL TEMPLO (CHUNKS 3D ENDLESS)
  // ==============================================================
  function createBridgeChunk(zPos, isWoodBridge = false) {
    const chunk = new THREE.Group();
    chunk.position.z = zPos;

    const len = CONFIG.chunkLength;
    const width = 6.4;

    // 1. Suelo del puente
    const floorGeo = new THREE.BoxGeometry(width, 1.2, len);
    const floorMesh = new THREE.Mesh(floorGeo, isWoodBridge ? woodMat : stoneMat);
    floorMesh.position.y = -0.6;
    floorMesh.receiveShadow = true;
    chunk.add(floorMesh);

    // 2. Muros y almenas de piedra a los lados (Idénticos al screenshot)
    const wallGeo = new THREE.BoxGeometry(0.55, 1.1, len);
    const wallL = new THREE.Mesh(wallGeo, stoneMat);
    wallL.position.set(-width / 2 + 0.25, 0.45, 0);
    wallL.castShadow = true;
    chunk.add(wallL);

    const wallR = new THREE.Mesh(wallGeo, stoneMat);
    wallR.position.set(width / 2 - 0.25, 0.45, 0);
    wallR.castShadow = true;
    chunk.add(wallR);

    // Bloques almenados decorativos a lo largo de las paredes
    const blockGeo = new THREE.BoxGeometry(0.65, 0.45, 1.2);
    for (let bz = -len / 2 + 2; bz < len / 2; bz += 3.5) {
      const blkL = new THREE.Mesh(blockGeo, stoneMat);
      blkL.position.set(-width / 2 + 0.25, 1.1, bz);
      chunk.add(blkL);

      const blkR = new THREE.Mesh(blockGeo, stoneMat);
      blkR.position.set(width / 2 - 0.25, 1.1, bz);
      chunk.add(blkR);
    }

    // 3. Pilares del templo y árboles selváticos en el abismo
    const pillarGeo = new THREE.CylinderGeometry(1.4, 1.8, 45, 12);
    const p1 = new THREE.Mesh(pillarGeo, stoneMat);
    p1.position.set(-width / 2 - 0.5, -22, -len * 0.3);
    chunk.add(p1);

    const p2 = new THREE.Mesh(pillarGeo, stoneMat);
    p2.position.set(width / 2 + 0.5, -22, len * 0.3);
    chunk.add(p2);

    // Árboles y palmeras a los costados
    createJungleTree(chunk, -width - 4, -8, -len * 0.25);
    createJungleTree(chunk, width + 4, -8, len * 0.25);

    scene.add(chunk);
    return chunk;
  }

  function createJungleTree(parent, x, y, z) {
    const trunkGeo = new THREE.CylinderGeometry(0.6, 1.0, 16, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2c14, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, y + 8, z);
    parent.add(trunk);

    // Copa de hojas verdes tropicales
    const leavesGeo = new THREE.SphereGeometry(3.5, 8, 8);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x1b4d2e, roughness: 0.7 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.set(x, y + 17, z);
    parent.add(leaves);
  }

  function initTrackChunks() {
    for (let i = 0; i < CONFIG.numChunks; i++) {
      const z = -i * CONFIG.chunkLength;
      const isWood = (i % 3 === 2);
      const chk = createBridgeChunk(z, isWood);
      chunks.push({ group: chk, z: z });

      // Generar diamantes dorados y obstáculos a lo largo del camino
      if (i > 0) {
        spawnCoinsOnChunk(z);
        spawnObstacleOnChunk(z);
      }
    }
  }

  // ==============================================================
  // 6. DIAMANTES DORADOS GIRATORIOS Y OBSTÁCULOS AMIGABLES
  // ==============================================================

  // Crear la moneda con forma de DIAMANTE ROMBO (idéntica a Temple Run)
  function createDiamondCoin(x, y, z) {
    // Octaedro escalado para darle la forma perfecta de diamante romboidal
    const geo = new THREE.OctahedronGeometry(0.42, 0);
    geo.scale(1.0, 1.45, 0.45); // Forma alargada de rombo

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
    // Escoger un carril al azar (-1, 0, 1) para la línea de diamantes
    const lane = Math.floor(Math.random() * 3) - 1;
    const laneX = lane * CONFIG.laneWidth;

    // Fila de 5 diamantes seguidos (como en la foto de Temple Run)
    const count = 5;
    const spacing = 2.4;
    const startZ = chunkZ + (CONFIG.chunkLength / 2) - 8;

    for (let i = 0; i < count; i++) {
      const z = startZ - (i * spacing);
      const coin = createDiamondCoin(laneX, 1.1, z);
      coins.push(coin);
    }
  }

  function spawnObstacleOnChunk(chunkZ) {
    if (Math.random() < 0.35) return; // No saturar para niños de 4 años

    const lane = Math.floor(Math.random() * 3) - 1;
    const laneX = lane * CONFIG.laneWidth;
    const z = chunkZ - (CONFIG.chunkLength * 0.25);

    // Obstáculo: Tronco antiguo de piedra o pequeña barrera
    const obsGeo = new THREE.BoxGeometry(1.6, 0.65, 0.8);
    const obsMesh = new THREE.Mesh(obsGeo, obstacleMat);
    obsMesh.position.set(laneX, 0.35, z);
    obsMesh.castShadow = true;
    scene.add(obsMesh);

    obstacles.push({
      mesh: obsMesh,
      x: laneX,
      z: z,
      cleared: false
    });
  }

  // ==============================================================
  // 7. FÍSICAS DE MOVIMIENTO Y CONTROL (DIEGO JR)
  // ==============================================================
  let playerY = 0;
  let playerVy = 0;
  let isGrounded = true;

  function handleLaneChange(dir) {
    if (!state.running || state.paused) return;

    state.currentLane = Math.max(-1, Math.min(1, state.currentLane + dir));
    state.targetX = state.currentLane * CONFIG.laneWidth;

    playJumpSound();
    vibrate(25);
  }

  function handleJump() {
    if (!state.running || state.paused) return;

    if (isGrounded) {
      playerVy = CONFIG.jumpVelocity;
      isGrounded = false;
      playJumpSound();
      vibrate(40);
    }
  }

  function handleSlide() {
    if (!state.running || state.paused) return;

    state.isSliding = true;
    state.slideTimer = 28; // ~0.5 segundos de deslizamiento
    playSlideSound();
    vibrate(30);
  }

  // ==============================================================
  // 8. BUCLE PRINCIPAL DE ANIMACIÓN Y FÍSICA (60 FPS)
  // ==============================================================
  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (state.running && !state.paused) {
      updateGame(delta);
    }

    // Rotar diamantes dorados continuamente (efecto radiante)
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
    // 1. Avanzar la velocidad y distancia
    state.distance += state.speed * delta;
    dom.hudDistance.textContent = `${Math.floor(state.distance)}m`;

    if (state.speedMode === 'fast') {
      state.speed = Math.min(CONFIG.maxSpeed, state.speed + CONFIG.speedIncrement);
    }

    // 2. Movimiento suave entre carriles (Interpolación LERP)
    playerGroup.position.x += (state.targetX - playerGroup.position.x) * 14 * delta;

    // Inclinación de la cámara al cambiar de carril (Sensación Temple Run)
    const rollAngle = (state.targetX - playerGroup.position.x) * 0.06;
    camera.rotation.z = -rollAngle;

    // 3. Físicas de Salto y Gravedad
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

    // 4. Animación de Carrera de Diego Jr
    const runCycle = Date.now() * 0.014 * (state.speed / 18);
    if (isGrounded) {
      if (state.isSliding) {
        // Postura agachada
        playerAnim.legL.rotation.x = -1.2;
        playerAnim.legR.rotation.x = -1.2;
        playerAnim.armL.rotation.x = 0.8;
        playerAnim.armR.rotation.x = 0.8;
        playerGroup.scale.set(1, 0.55, 1);
        state.slideTimer--;
        if (state.slideTimer <= 0) {
          state.isSliding = false;
          playerGroup.scale.set(1, 1, 1);
        }
      } else {
        // Carrera normal alegre
        playerAnim.legL.rotation.x = Math.sin(runCycle) * 0.75;
        playerAnim.legR.rotation.x = -Math.sin(runCycle) * 0.75;
        playerAnim.armL.rotation.x = -Math.sin(runCycle) * 0.75;
        playerAnim.armR.rotation.x = Math.sin(runCycle) * 0.75;
        playerAnim.hat.rotation.z = Math.sin(runCycle * 0.5) * 0.08;
      }
    } else {
      // Salto triunfal con brazos arriba
      playerAnim.legL.rotation.x = 0.4;
      playerAnim.legR.rotation.x = -0.3;
      playerAnim.armL.rotation.x = -2.2;
      playerAnim.armR.rotation.x = -2.2;
    }

    // 5. Mover los Chunks del puente hacia la cámara
    const moveZ = state.speed * delta;
    playerGroup.position.z -= moveZ;
    camera.position.z = playerGroup.position.z + 6.2;
    camera.position.x = playerGroup.position.x * 0.35;

    // Reciclar chunks que quedan detrás
    for (let i = 0; i < chunks.length; i++) {
      const chk = chunks[i];
      if (chk.group.position.z > camera.position.z + 10) {
        // Mover el chunk hacia el frente del camino infinito
        const farthestZ = Math.min(...chunks.map(c => c.group.position.z));
        chk.group.position.z = farthestZ - CONFIG.chunkLength;

        // Nuevos diamantes y obstáculos en el segmento reciclado
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

      // Efecto Imán: atrae diamantes hacia Diego Jr
      if (state.powerup && state.powerup.type === 'magnet') {
        const dx = pPos.x - cPos.x;
        const dz = pPos.z - cPos.z;
        cPos.x += dx * 8 * delta;
        cPos.z += dz * 8 * delta;
      }

      const dist = Math.hypot(pPos.x - cPos.x, pPos.z - cPos.z);
      if (dist < 1.3 && Math.abs(pPos.y + 0.9 - cPos.y) < 1.5) {
        // ¡Diamante recogido!
        coin.collected = true;
        scene.remove(coin.mesh);
        coins.splice(i, 1);

        state.coins++;
        dom.hudCoins.textContent = state.coins;
        playCoinSound(state.coins);
        vibrate(20);

        // Didáctica de números en voz alta cada número hasta 10, luego cada 10
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

    // 7. Colisión con Obstáculos (Amigable: Sin muerte súbita)
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      if (obs.cleared) continue;

      const pPos = playerGroup.position;
      const dist = Math.hypot(pPos.x - obs.x, pPos.z - obs.z);

      if (dist < 1.1 && playerY < 0.6) {
        obs.cleared = true;

        if (state.powerup && state.powerup.type === 'shield') {
          // Escudo rompe el obstáculo
          playCoinSound(4);
          speak('¡Escudo protector!');
        } else {
          // Choque suave: ¡Rebota, no muere!
          playBoingSound();
          vibrate(60);
          playerVy = 10.0;
          isGrounded = false;
          speak('¡Cuidado con la piedra, Diego!');
        }
      } else if (obs.z > camera.position.z + 10) {
        scene.remove(obs.mesh);
        obstacles.splice(i, 1);
      }
    }

    // 8. Temporizador de Power-up
    if (state.powerup) {
      state.powerup.duration--;
      const pct = (state.powerup.duration / state.powerup.maxDuration) * 100;
      dom.powerupBarFill.style.width = `${pct}%`;

      if (state.powerup.duration <= 0) {
        state.powerup = null;
        dom.powerupBanner.classList.add('hidden');
        speak('¡Sigue corriendo, Diego!');
      }
    }
  }

  // Didáctica flotante
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
  // 9. FLUJO DEL JUEGO Y GESTIÓN DE EVENTOS
  // ==============================================================
  function startGame() {
    state.running = true;
    state.paused = false;
    state.coins = 0;
    state.distance = 0;
    state.currentLane = 0;
    state.targetX = 0;
    state.speed = state.speedMode === 'gentle' ? CONFIG.baseSpeed : CONFIG.baseSpeed * 1.25;

    playerGroup.position.set(0, 0, 0);
    playerY = 0;
    playerVy = 0;
    isGrounded = true;

    dom.hudCoins.textContent = '0';
    dom.hudDistance.textContent = '0m';

    dom.menuScreen.classList.add('hidden');
    dom.celebrationScreen.classList.add('hidden');
    dom.gameHud.classList.remove('hidden');
    dom.touchControls.classList.remove('hidden');

    initAudio();
    speak('¡A correr por el templo! ¡Recoge los diamantes!');
  }

  function pauseGame() {
    state.paused = !state.paused;
    dom.btnPause.textContent = state.paused ? '▶' : '⏸';
    if (state.paused) speak('Pausa');
  }

  function finishCelebration() {
    state.running = false;
    dom.gameHud.classList.add('hidden');
    dom.touchControls.classList.add('hidden');
    dom.powerupBanner.classList.add('hidden');

    dom.recapCoins.textContent = state.coins;
    dom.recapDistance.textContent = `${Math.floor(state.distance)}m`;
    dom.celebrationScreen.classList.remove('hidden');

    speak('¡Eres un gran explorador del templo, Diego Junior!');
  }

  // Configuración de controles táctiles, gestos y teclado
  function setupControls() {
    // 1. Botones del Menú
    dom.btnStart.onclick = startGame;
    dom.btnPlayAgain.onclick = startGame;
    dom.btnMenuBack.onclick = () => {
      dom.celebrationScreen.classList.add('hidden');
      dom.menuScreen.classList.remove('hidden');
    };
    dom.btnPause.onclick = pauseGame;

    // 2. Botones de opciones
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

    // 3. Botones táctiles gigantes en pantalla
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

    // 4. Gestos de Swipe en la pantalla (como el auténtico Temple Run)
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

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 35) {
        // Deslizar izquierda / derecha
        if (dx > 0) handleLaneChange(1);
        else handleLaneChange(-1);
      } else if (Math.abs(dy) > 35) {
        // Deslizar arriba (saltar) / abajo (deslizar)
        if (dy < 0) handleJump();
        else handleSlide();
      }
    }, { passive: true });

    // 5. Teclado de computadora
    window.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        handleLaneChange(-1);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        handleLaneChange(1);
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        e.preventDefault();
        handleJump();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        handleSlide();
      } else if (e.code === 'KeyP') {
        pauseGame();
      }
    });
  }

  // Iniciar al cargar
  document.addEventListener('DOMContentLoaded', () => {
    initThree();
    setupControls();
    animate();
  });

})();
