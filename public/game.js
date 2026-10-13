// ==========================================
// EL BARRIO AZ - MOTOR PIXEL ART URBANO & DIDÁCTICO
// Enseña Números, Colores, Animales y Matemáticas
// ==========================================

const socket = io({
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 30
});

// Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// DOM Elements
const modalSelect = document.getElementById('character-select-modal');
const gameContainer = document.getElementById('game-container');
const btnStart = document.getElementById('btn-start-game');
const portraitCards = document.querySelectorAll('.portrait-card');
const playerCoinsVal = document.getElementById('player-coins-val');
const familyVaultVal = document.getElementById('family-vault-val');
const locationBadge = document.getElementById('location-badge');
const hudPlayerName = document.getElementById('hud-player-name');
const hudMiniPortrait = document.getElementById('hud-mini-portrait');
const alertBanner = document.getElementById('alert-banner');
const alertText = document.getElementById('alert-text');
const btnActionMain = document.getElementById('btn-action-main');
const actionBtnEmoji = document.getElementById('action-btn-emoji');
const actionBtnLabel = document.getElementById('action-btn-label');
const btnToggleReactions = document.getElementById('btn-toggle-reactions');
const quickReactions = document.getElementById('quick-reactions');
const btnAudioToggle = document.getElementById('btn-audio-toggle');
const houseShopModal = document.getElementById('house-shop-modal');
const btnOpenHouseShop = document.getElementById('btn-open-house-shop');
const btnCloseShop = document.getElementById('btn-close-shop');

// Elementos Didácticos DOM
const btnOpenLearn = document.getElementById('btn-open-learn');
const didacticModal = document.getElementById('didactic-modal');
const btnCloseLearn = document.getElementById('btn-close-learn');
const btnRepeatVoice = document.getElementById('btn-repeat-voice');
const voiceTranscript = document.getElementById('voice-transcript');
const learnTabBtns = document.querySelectorAll('.tab-btn');
const numberQuestText = document.getElementById('number-quest-text');
const numberItemsDisplay = document.getElementById('number-items-display');
const numberFeedback = document.getElementById('number-feedback');
const colorQuestText = document.getElementById('color-quest-text');
const colorFeedback = document.getElementById('color-feedback');
const mathQuestion = document.getElementById('math-question');
const mathOptionsRow = document.getElementById('math-options-row');
const mathFeedback = document.getElementById('math-feedback');

// Joystick
const joystickArea = document.getElementById('joystick-area');
const joystickRing = document.getElementById('joystick-ring');
const joystickKnob = document.getElementById('joystick-knob');

// ==========================================
// MUNDO Y ZOOM BALANCEADO (1.35x)
// ==========================================
const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 1500;
const camera = { x: 1000, y: 700 };
let zoomScale = 1.35;

let selectedCharId = 'diegoaz_jr';
let myPlayer = null;
const otherPlayers = {};
let familyVaultCoins = 500;
let activeBubbles = {};
let particles = [];
let gameTime = 0;

// Objetos interactivos en el vecindario
const soccerBall = { x: 550, y: 1100, vx: 0, vy: 0, radius: 10 };

// ANIMALES DIDÁCTICOS VIVOS EN EL VECINDARIO
const townAnimals = [
  { id: 'dog', name: 'Toby', type: 'PERRO', emoji: '🐶', sound: 'dog', x: 680, y: 1040, phrase: '¡Soy el PERRO Toby y hago Guau-Guau!' },
  { id: 'cat', name: 'Misi', type: 'GATO', emoji: '🐱', sound: 'cat', x: 740, y: 1080, phrase: '¡Soy la GATITA Misi y hago Miau-Miau!' },
  { id: 'duck', name: 'Lucas', type: 'PATO', emoji: '🦆', sound: 'duck', x: 820, y: 1120, phrase: '¡Soy el PATO Lucas y hago Cua-Cua!' },
  { id: 'cow', name: 'Margarita', type: 'VACA', emoji: '🐮', sound: 'cow', x: 420, y: 1180, phrase: '¡Soy la VACA Margarita y doy leche rica: Muuu!' },
  { id: 'sheep', name: 'Copito', type: 'OVEJA', emoji: '🐑', sound: 'sheep', x: 480, y: 1220, phrase: '¡Soy la OVEJA Copito y tengo lana suave: Beee!' }
];

let streetCoins = [
  { x: 920, y: 680, collected: false },
  { x: 1080, y: 680, collected: false },
  { x: 1000, y: 520, collected: false },
  { x: 1000, y: 840, collected: false },
  { x: 1300, y: 680, collected: false },
  { x: 700, y: 680, collected: false },
  { x: 550, y: 1050, collected: false }
];

// ==========================================
// SISTEMA DE AUDIO (EFECTOS Y ANIMALES SINTETIZADOS)
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
      osc.start(now); osc.stop(now + 0.25);
    } else if (type === 'dog') {
      // Ladrido perro
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.linearRampToValueAtTime(560, now + 0.06);
      osc.frequency.linearRampToValueAtTime(320, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.16);
      osc.start(now); osc.stop(now + 0.16);
    } else if (type === 'cat') {
      // Miau gato agudo
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.15);
      osc.frequency.linearRampToValueAtTime(540, now + 0.35);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
      osc.start(now); osc.stop(now + 0.35);
    } else if (type === 'duck') {
      // Cua cua pato nasal
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setValueAtTime(260, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
      osc.start(now); osc.stop(now + 0.18);
    } else if (type === 'cow') {
      // Muuu vaca grave
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.4);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
      osc.start(now); osc.stop(now + 0.45);
    } else if (type === 'sheep') {
      // Beee oveja con trémolo
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(350, now + 0.15);
      osc.frequency.linearRampToValueAtTime(300, now + 0.35);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.38);
      osc.start(now); osc.stop(now + 0.38);
    } else if (type === 'chicken') {
      // Co-co gallina
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.setValueAtTime(520, now + 0.06);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'correct') {
      // Acierto didáctico alegre
      [523, 659, 783, 1046].forEach((f, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(f, now + idx * 0.07);
        g.gain.setValueAtTime(0.18, now + idx * 0.07);
        g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.22);
        o.start(now + idx * 0.07); o.stop(now + idx * 0.07 + 0.22);
      });
    } else if (type === 'kick') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.14);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
      osc.start(now); osc.stop(now + 0.14);
    } else if (type === 'fanfare') {
      [523, 659, 783, 1046].forEach((f, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(f, now + idx * 0.08);
        g.gain.setValueAtTime(0.18, now + idx * 0.08);
        g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.22);
        o.start(now + idx * 0.08); o.stop(now + idx * 0.08 + 0.22);
      });
    }
  } catch (e) {}
}

btnAudioToggle.addEventListener('click', () => {
  audioEnabled = !audioEnabled;
  btnAudioToggle.innerText = audioEnabled ? '🔊' : '🔇';
});

// ==========================================
// MOTOR DE VOZ SINTETIZADA (TEXT-TO-SPEECH)
// Permite que Diego Jr. (4 años) juegue sin saber leer
// ==========================================
let lastSpokenText = '¡Hola Diego Junior! Toca un botón arriba para jugar.';
let spanishVoices = [];

function refreshVoices() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const allVoices = window.speechSynthesis.getVoices();
    spanishVoices = allVoices.filter(v => v.lang && (v.lang.toLowerCase().startsWith('es') || v.lang.includes('ES')));
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }
}

function speak(text, pitch = 1.15, rate = 0.95) {
  lastSpokenText = text;
  if (voiceTranscript) {
    voiceTranscript.innerText = text;
  }
  if (!audioEnabled || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel(); // Detener cualquier locución en curso
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'es-ES';
    utter.rate = rate;   // Ritmo pausado y claro para un niño de 4 años
    utter.pitch = pitch; // Tono alegre y cálido

    if (!spanishVoices.length) refreshVoices();
    if (spanishVoices.length > 0) {
      const friendlyVoice = spanishVoices.find(v => /sabina|monica|paulina|lucia|laura|helena|spanish|mexico/i.test(v.name)) || spanishVoices[0];
      if (friendlyVoice) utter.voice = friendlyVoice;
    }

    const speakerIcon = document.querySelector('.speaker-anim');
    if (speakerIcon) speakerIcon.classList.add('talking');

    utter.onend = () => {
      if (speakerIcon) speakerIcon.classList.remove('talking');
    };
    utter.onerror = () => {
      if (speakerIcon) speakerIcon.classList.remove('talking');
    };

    window.speechSynthesis.speak(utter);
  } catch (e) {
    console.warn('Speech error:', e);
  }
}

// ==========================================
// MOTOR DIDÁCTICO Y EDUCATIVO
// ==========================================

// Pestañas didácticas con narración instantánea
learnTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    initAudio();
    playSfx('kick');
    learnTabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const tabId = btn.getAttribute('data-tab');
    document.querySelectorAll('.learn-content-view').forEach(view => view.classList.add('hidden'));
    const target = document.getElementById(`tab-${tabId}`);
    if (target) target.classList.remove('hidden');

    if (tabId === 'junior-animals') {
      speak('¡Animales del barrio! Toca cualquier animal para escuchar cómo hace.');
    } else if (tabId === 'junior-numbers') {
      initNumberQuest();
    } else if (tabId === 'junior-colors') {
      initColorQuest();
    } else if (tabId === 'vicky-math') {
      initMathQuest();
    }
  });
});

// 1. ANIMALES INTERACTIVOS CON VOZ Y SONIDO
const animalVoiceLines = {
  dog: '¡El perro Toby! ¡Hace guau guau!',
  cat: '¡La gatita Misi! ¡Hace miau miau!',
  duck: '¡El pato Lucas! ¡Hace cua cua!',
  cow: '¡La vaca Margarita! ¡Hace muuu y nos da leche rica!',
  sheep: '¡La oveja Copito! ¡Hace beee y tiene lana suave!',
  chicken: '¡La gallina Turuleca! ¡Hace co co co!'
};

document.querySelectorAll('.animal-card').forEach(card => {
  card.addEventListener('click', () => {
    initAudio();
    const aType = card.getAttribute('data-animal');
    playSfx(aType);
    const title = card.getAttribute('data-title') || 'Animal';
    showAlert(`🎉 ¡${title}! (+5🪙)`);
    rewardCoins(5);

    const voiceLine = animalVoiceLines[aType] || `¡${title}!`;
    speak(voiceLine);
  });
});

// 2. NÚMEROS Y CONTEO (JUNIOR 4 AÑOS)
let currentCountTarget = 3;
const countItemTypes = [
  { emoji: '🍎', nameSing: 'manzana', namePlur: 'manzanas' },
  { emoji: '⭐', nameSing: 'estrella', namePlur: 'estrellas' },
  { emoji: '🚗', nameSing: 'carrito', namePlur: 'carritos' },
  { emoji: '🦆', nameSing: 'patito', namePlur: 'patitos' },
  { emoji: '⚽', nameSing: 'pelota', namePlur: 'pelotas' }
];
let currentItemObj = countItemTypes[0];

function initNumberQuest() {
  currentCountTarget = Math.floor(Math.random() * 5) + 1;
  currentItemObj = countItemTypes[Math.floor(Math.random() * countItemTypes.length)];
  let displayStr = '';
  for (let i = 0; i < currentCountTarget; i++) {
    displayStr += currentItemObj.emoji + ' ';
  }
  if (numberItemsDisplay) numberItemsDisplay.innerText = displayStr;
  if (numberFeedback) numberFeedback.classList.add('hidden');

  const phrase = `¿Cuántas ${currentItemObj.namePlur} ves? ¡Cuéntalas con tu dedito y toca el número!`;
  if (numberQuestText) numberQuestText.innerText = phrase;
  speak(phrase);
}

document.querySelectorAll('.num-choice-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    initAudio();
    const chosen = parseInt(btn.getAttribute('data-num'));
    if (chosen === currentCountTarget) {
      playSfx('correct');
      if (numberFeedback) {
        numberFeedback.className = 'learn-feedback-box';
        numberFeedback.innerText = `⭐ ¡EXCELENTE DIEGO JR.! ¡Hay ${chosen}! (+15🪙)`;
        numberFeedback.classList.remove('hidden');
      }
      rewardCoins(15);
      const itemName = chosen === 1 ? currentItemObj.nameSing : currentItemObj.namePlur;
      speak(`¡Excelente Diego Junior! ¡Hay ${chosen} ${itemName}! ¡Ganaste quince monedas!`);
      setTimeout(initNumberQuest, 3200);
    } else {
      playSfx('kick');
      if (numberFeedback) {
        numberFeedback.className = 'learn-feedback-box error';
        numberFeedback.innerText = `💡 Tocaste el ${chosen}. Cuenta despacito con tu dedito.`;
        numberFeedback.classList.remove('hidden');
      }
      speak(`Tocaste el número ${chosen}. ¡Casi casi! Vuelve a contar con tu dedito.`);
    }
  });
});

// 3. COLORES BRILLANTES (JUNIOR 4 AÑOS)
const colorsList = ['ROJO', 'AZUL', 'VERDE', 'AMARILLO'];
let currentColorTarget = 'AZUL';

function initColorQuest() {
  currentColorTarget = colorsList[Math.floor(Math.random() * colorsList.length)];
  if (colorQuestText) colorQuestText.innerText = `¡Toca el color ${currentColorTarget}!`;
  if (colorFeedback) colorFeedback.classList.add('hidden');
  speak(`¡Diego Junior, busca el color ${currentColorTarget.toLowerCase()}!`);
}

document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    initAudio();
    const chosen = btn.getAttribute('data-color');
    if (chosen === currentColorTarget) {
      playSfx('correct');
      if (colorFeedback) {
        colorFeedback.className = 'learn-feedback-box';
        colorFeedback.innerText = `🎨 ¡CORRECTO! ¡Ese es el ${chosen}! (+15🪙)`;
        colorFeedback.classList.remove('hidden');
      }
      rewardCoins(15);
      speak(`¡Muy bien Diego Junior! ¡Ese es el color ${chosen.toLowerCase()}! ¡Ganaste quince monedas!`);
      setTimeout(initColorQuest, 3000);
    } else {
      playSfx('kick');
      if (colorFeedback) {
        colorFeedback.className = 'learn-feedback-box error';
        colorFeedback.innerText = `💡 Ese es el ${chosen}. ¡Busca el ${currentColorTarget}!`;
        colorFeedback.classList.remove('hidden');
      }
      speak(`Ese es el color ${chosen.toLowerCase()}. ¡Busca el color ${currentColorTarget.toLowerCase()}!`);
    }
  });
});

// 4. OPERACIONES MATEMÁTICAS (VICKY 10 AÑOS & PAPÁ)
let currentMathAnswer = 8;

function initMathQuest() {
  const isMult = Math.random() < 0.35;
  let a, b, symbol, opSpoken;

  if (isMult) {
    a = Math.floor(Math.random() * 6) + 2;
    b = Math.floor(Math.random() * 6) + 2;
    symbol = '×';
    opSpoken = 'por';
    currentMathAnswer = a * b;
  } else {
    const isSum = Math.random() < 0.6;
    if (isSum) {
      a = Math.floor(Math.random() * 20) + 5;
      b = Math.floor(Math.random() * 15) + 3;
      symbol = '+';
      opSpoken = 'más';
      currentMathAnswer = a + b;
    } else {
      a = Math.floor(Math.random() * 25) + 10;
      b = Math.floor(Math.random() * a) + 1;
      symbol = '-';
      opSpoken = 'menos';
      currentMathAnswer = a - b;
    }
  }

  mathQuestion.innerText = `${a} ${symbol} ${b} = ?`;
  mathFeedback.classList.add('hidden');
  speak(`Pregunta para Vicky: ¿Cuánto es ${a} ${opSpoken} ${b}?`);

  const options = [currentMathAnswer, currentMathAnswer + (Math.random() < 0.5 ? 2 : -2), currentMathAnswer + (Math.random() < 0.5 ? 5 : -3)];
  options.sort(() => Math.random() - 0.5);

  mathOptionsRow.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'math-choice-btn';
    btn.innerText = opt;
    btn.addEventListener('click', () => {
      initAudio();
      if (opt === currentMathAnswer) {
        playSfx('correct');
        mathFeedback.className = 'learn-feedback-box';
        mathFeedback.innerText = `🏆 ¡BRILIANTE VICKY! ${a} ${symbol} ${b} = ${currentMathAnswer} (+25🪙)`;
        mathFeedback.classList.remove('hidden');
        rewardCoins(25);
        speak(`¡Brillante Vicky! ${a} ${opSpoken} ${b} es ${currentMathAnswer}. ¡Ganaste veinticinco monedas!`);
        setTimeout(initMathQuest, 3200);
      } else {
        playSfx('kick');
        mathFeedback.className = 'learn-feedback-box error';
        mathFeedback.innerText = `💡 ¡Casi! Revisa el cálculo e inténtalo de nuevo.`;
        mathFeedback.classList.remove('hidden');
        speak(`¡Casi Vicky! Revisa el cálculo e inténtalo de nuevo.`);
      }
    });
    mathOptionsRow.appendChild(btn);
  });
}

function rewardCoins(amount) {
  if (!myPlayer) return;
  myPlayer.coins += amount;
  familyVaultCoins += amount;
  playerCoinsVal.innerText = myPlayer.coins;
  familyVaultVal.innerText = familyVaultCoins;
  playSfx('coin');
}

// Abrir / Cerrar modal didáctico
function openDidacticModal() {
  initAudio();
  playSfx('coin');
  didacticModal.classList.remove('hidden');

  if (selectedCharId === 'diegoaz_jr') {
    speak('¡Hola Diego Junior! Toca un botón arriba para jugar con los animales, los números o los colores.');
  } else {
    speak('¡Hola familia! Elijan un juego de aprendizaje.');
  }
}

btnOpenLearn.addEventListener('click', openDidacticModal);

btnCloseLearn.addEventListener('click', () => {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  didacticModal.classList.add('hidden');
});

if (btnRepeatVoice) {
  btnRepeatVoice.addEventListener('click', () => {
    initAudio();
    speak(lastSpokenText || '¡Toca un botón de arriba para jugar!');
  });
}

// ==========================================
// SPRITES Y RETRATOS PIXEL ART OFICIALES
// ==========================================
const spriteCache = {};

function createOffscreen(w, h, renderFn) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const cctx = c.getContext('2d');
  cctx.imageSmoothingEnabled = false;
  renderFn(cctx);
  return c;
}

function drawCharacterPortrait(pctx, charId) {
  pctx.fillStyle = '#1e293b'; pctx.fillRect(0, 0, 64, 64);
  pctx.fillStyle = '#334155'; pctx.fillRect(2, 2, 60, 60);

  if (charId === 'diegoaz') {
    pctx.fillStyle = '#2f5233'; pctx.fillRect(10, 44, 44, 20);
    pctx.fillStyle = '#3e6b43'; pctx.fillRect(12, 46, 40, 18);
    pctx.fillStyle = '#181a20'; pctx.fillRect(26, 46, 12, 18);
    pctx.fillStyle = '#5c3317'; pctx.fillRect(18, 44, 6, 20);
    pctx.fillStyle = '#9c6644'; pctx.fillRect(24, 38, 16, 8);
    pctx.fillStyle = '#b07d58'; pctx.fillRect(18, 18, 28, 24);
    pctx.fillStyle = '#2e1d13'; pctx.fillRect(14, 10, 36, 14);
    pctx.fillStyle = '#422c1e'; pctx.fillRect(16, 12, 32, 8);
    pctx.fillStyle = '#8a817c'; pctx.fillRect(20, 12, 10, 3);
    pctx.fillStyle = '#6b635b'; pctx.fillRect(18, 32, 28, 12);
    pctx.fillStyle = '#b07d58'; pctx.fillRect(26, 34, 12, 3);
    pctx.fillStyle = '#0f172a'; pctx.fillRect(21, 22, 9, 7); pctx.fillRect(34, 22, 9, 7);
    pctx.fillRect(30, 24, 4, 2);
    pctx.fillStyle = '#7dd3fc'; pctx.fillRect(23, 24, 5, 3); pctx.fillRect(36, 24, 5, 3);
  } else if (charId === 'vicky_vicky') {
    pctx.fillStyle = '#2e1d13'; pctx.fillRect(12, 10, 40, 32);
    pctx.fillStyle = '#422c1e'; pctx.fillRect(14, 12, 36, 24);
    pctx.fillStyle = '#38bdf8'; pctx.fillRect(14, 44, 36, 5);
    pctx.fillStyle = '#c084fc'; pctx.fillRect(14, 49, 36, 5);
    pctx.fillStyle = '#f472b6'; pctx.fillRect(14, 54, 36, 5);
    pctx.fillStyle = '#fde047'; pctx.fillRect(14, 59, 36, 5);
    pctx.fillStyle = '#b07d58'; pctx.fillRect(20, 18, 24, 22);
    pctx.fillStyle = '#0f172a'; pctx.fillRect(24, 24, 4, 5); pctx.fillRect(36, 24, 4, 5);
    pctx.fillStyle = '#ffffff'; pctx.fillRect(25, 24, 2, 2); pctx.fillRect(37, 24, 2, 2);
    pctx.fillStyle = '#dc2626'; pctx.fillRect(28, 33, 8, 3);
  } else if (charId === 'diegoaz_jr') {
    pctx.fillStyle = '#1d4ed8'; pctx.fillRect(14, 46, 36, 18);
    pctx.fillStyle = '#2563eb'; pctx.fillRect(18, 44, 8, 20); pctx.fillRect(38, 44, 8, 20);
    pctx.fillStyle = '#facc15'; pctx.fillRect(21, 48, 3, 3); pctx.fillRect(41, 48, 3, 3);
    pctx.fillStyle = '#ef4444'; pctx.fillRect(12, 46, 6, 10); pctx.fillRect(46, 46, 6, 10);
    pctx.fillStyle = '#fed7aa'; pctx.fillRect(18, 20, 28, 22);
    pctx.fillStyle = '#ca8a04'; pctx.fillRect(16, 10, 32, 14);
    pctx.fillStyle = '#facc15'; pctx.fillRect(18, 12, 28, 10);
    pctx.fillStyle = '#fef08a'; pctx.fillRect(20, 12, 14, 4);
    pctx.fillStyle = '#0f172a'; pctx.fillRect(24, 26, 4, 5); pctx.fillRect(36, 26, 4, 5);
    pctx.fillStyle = '#38bdf8'; pctx.fillRect(25, 27, 3, 3); pctx.fillRect(37, 27, 3, 3);
    pctx.fillStyle = '#ffffff'; pctx.fillRect(25, 26, 2, 2); pctx.fillRect(37, 26, 2, 2);
    pctx.fillStyle = '#dc2626'; pctx.fillRect(28, 34, 8, 3);
  }
}

['diegoaz', 'vicky_vicky', 'diegoaz_jr'].forEach(cId => {
  const canvasEl = document.getElementById(cId === 'diegoaz' ? 'portrait-diegoaz' : (cId === 'vicky_vicky' ? 'portrait-vicky' : 'portrait-junior'));
  if (canvasEl) {
    const pctx = canvasEl.getContext('2d');
    pctx.imageSmoothingEnabled = false;
    drawCharacterPortrait(pctx, cId);
  }
});

function updateMiniHudPortrait() {
  const pctx = hudMiniPortrait.getContext('2d');
  pctx.imageSmoothingEnabled = false;
  pctx.clearRect(0, 0, 28, 28);
  pctx.save();
  pctx.scale(28 / 64, 28 / 64);
  drawCharacterPortrait(pctx, selectedCharId);
  pctx.restore();
}

function getCharacterSprite(charId, dir, frame) {
  const key = `${charId}_${dir}_${frame}`;
  if (spriteCache[key]) return spriteCache[key];

  const c = createOffscreen(18, 34, (sctx) => {
    const isStepL = (frame === 1);
    const isStepR = (frame === 2);
    const bob = (frame > 0) ? -1 : 0;

    if (charId === 'diegoaz') {
      sctx.fillStyle = 'rgba(0,0,0,0.35)'; sctx.fillRect(4, 30, 10, 3);
      sctx.fillStyle = '#262d38';
      sctx.fillRect(5, 20 + bob, 3, 7 + (isStepL ? -1 : 0));
      sctx.fillRect(10, 20 + bob, 3, 7 + (isStepR ? -1 : 0));
      sctx.fillStyle = '#422817';
      sctx.fillRect(4, 27 + (isStepL ? -1 : 0), 4, 3);
      sctx.fillRect(10, 27 + (isStepR ? -1 : 0), 4, 3);
      sctx.fillStyle = '#335937';
      sctx.fillRect(4, 12 + bob, 10, 9);
      sctx.fillStyle = '#181a20';
      sctx.fillRect(7, 12 + bob, 4, 9);
      sctx.fillStyle = '#5c3317';
      sctx.fillRect(dir === 'right' ? 9 : 5, 12 + bob, 2, 9);
      sctx.fillStyle = '#b07d58';
      sctx.fillRect(5, 4 + bob, 8, 8);
      sctx.fillStyle = '#362215';
      sctx.fillRect(4, 2 + bob, 10, 4);

      if (dir === 'down') {
        sctx.fillStyle = '#7a7067';
        sctx.fillRect(5, 8 + bob, 8, 4);
        sctx.fillStyle = '#0f172a';
        sctx.fillRect(5, 5 + bob, 3, 3); sctx.fillRect(10, 5 + bob, 3, 3);
        sctx.fillStyle = '#7dd3fc';
        sctx.fillRect(6, 6 + bob, 1, 1); sctx.fillRect(11, 6 + bob, 1, 1);
      } else if (dir === 'up') {
        sctx.fillStyle = '#362215';
        sctx.fillRect(4, 3 + bob, 10, 9);
        sctx.fillStyle = '#5c3317';
        sctx.fillRect(4, 15 + bob, 4, 5);
      } else {
        sctx.fillStyle = '#7a7067';
        sctx.fillRect(dir === 'right' ? 9 : 4, 8 + bob, 5, 4);
        sctx.fillStyle = '#0f172a';
        sctx.fillRect(dir === 'right' ? 10 : 5, 5 + bob, 3, 3);
      }

    } else if (charId === 'vicky_vicky') {
      sctx.fillStyle = 'rgba(0,0,0,0.35)'; sctx.fillRect(4, 29, 10, 3);
      sctx.fillStyle = '#2563eb';
      sctx.fillRect(5, 20 + bob, 3, 7 + (isStepL ? -1 : 0));
      sctx.fillRect(10, 20 + bob, 3, 7 + (isStepR ? -1 : 0));
      sctx.fillStyle = '#f472b6';
      sctx.fillRect(4, 27 + (isStepL ? -1 : 0), 4, 3);
      sctx.fillRect(10, 27 + (isStepR ? -1 : 0), 4, 3);
      sctx.fillStyle = '#ffffff';
      sctx.fillRect(4, 29 + (isStepL ? -1 : 0), 4, 1);
      sctx.fillRect(10, 29 + (isStepR ? -1 : 0), 4, 1);

      sctx.fillStyle = '#38bdf8'; sctx.fillRect(4, 12 + bob, 10, 2);
      sctx.fillStyle = '#c084fc'; sctx.fillRect(4, 14 + bob, 10, 2);
      sctx.fillStyle = '#f472b6'; sctx.fillRect(4, 16 + bob, 10, 2);
      sctx.fillStyle = '#fde047'; sctx.fillRect(4, 18 + bob, 10, 2);

      sctx.fillStyle = '#362215';
      sctx.fillRect(3, 2 + bob, 12, 10);
      sctx.fillStyle = '#b07d58';
      sctx.fillRect(5, 5 + bob, 8, 7);

      if (dir === 'down') {
        sctx.fillStyle = '#0f172a';
        sctx.fillRect(6, 7 + bob, 1, 2); sctx.fillRect(11, 7 + bob, 1, 2);
      } else if (dir === 'up') {
        sctx.fillStyle = '#362215';
        sctx.fillRect(3, 3 + bob, 12, 10);
        sctx.fillStyle = '#854d0e';
        sctx.fillRect(6, 13 + bob, 6, 7);
      } else {
        sctx.fillStyle = '#854d0e';
        sctx.fillRect(dir === 'right' ? 3 : 11, 13 + bob, 4, 6);
      }

    } else {
      sctx.fillStyle = 'rgba(0,0,0,0.35)'; sctx.fillRect(4, 27, 10, 3);
      sctx.fillStyle = '#fed7aa';
      sctx.fillRect(6, 19 + bob, 2, 5 + (isStepL ? -1 : 0));
      sctx.fillRect(10, 19 + bob, 2, 5 + (isStepR ? -1 : 0));
      sctx.fillStyle = '#ef4444';
      sctx.fillRect(5, 24 + (isStepL ? -1 : 0), 3, 3);
      sctx.fillRect(10, 24 + (isStepR ? -1 : 0), 3, 3);

      sctx.fillStyle = '#2563eb';
      sctx.fillRect(5, 14 + bob, 8, 7);
      sctx.fillStyle = '#1d4ed8';
      sctx.fillRect(5, 12 + bob, 2, 4); sctx.fillRect(11, 12 + bob, 2, 4);
      sctx.fillStyle = '#fbbf24';
      sctx.fillRect(5, 15 + bob, 1, 1); sctx.fillRect(12, 15 + bob, 1, 1);

      sctx.fillStyle = '#facc15';
      sctx.fillRect(4, 4 + bob, 10, 6);
      sctx.fillStyle = '#ca8a04';
      sctx.fillRect(4, 3 + bob, 10, 2);
      sctx.fillStyle = '#fed7aa';
      sctx.fillRect(5, 6 + bob, 8, 6);

      if (dir === 'down') {
        sctx.fillStyle = '#0f172a';
        sctx.fillRect(6, 8 + bob, 1, 2); sctx.fillRect(11, 8 + bob, 1, 2);
      } else if (dir === 'up') {
        sctx.fillStyle = '#facc15';
        sctx.fillRect(4, 4 + bob, 10, 9);
      }
    }
  });

  spriteCache[key] = c;
  return c;
}

// ==========================================
// REDIMENSIÓN RESPONSIVE
// ==========================================
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const isMobile = window.innerWidth < 768;
  zoomScale = isMobile ? 1.35 : 1.25;
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
resizeCanvas();

portraitCards.forEach(card => {
  card.addEventListener('click', () => {
    initAudio();
    playSfx('kick');
    portraitCards.forEach(c => c.classList.remove('active'));
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

  updateMiniHudPortrait();
  hudPlayerName.innerText = selectedCharId === 'diegoaz' ? 'Diegoaz' : (selectedCharId === 'vicky_vicky' ? 'Vicky' : 'Diego Jr.');

  socket.emit('join_game', { characterId: selectedCharId });
});

btnToggleReactions.addEventListener('click', () => {
  quickReactions.classList.toggle('hidden');
});

document.querySelectorAll('.urban-reaction-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    const snd = btn.getAttribute('data-sound');
    const msg = btn.getAttribute('data-msg');
    playSfx(snd || 'coin');
    quickReactions.classList.add('hidden');
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
// MULTIJUGADOR SINCRONIZADO
// ==========================================
socket.on('init_state', (data) => {
  myPlayer = data.self;
  camera.x = myPlayer.x;
  camera.y = myPlayer.y;

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
    showAlert(`👋 ¡${p.name} se unió al barrio!`);
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
    showAlert(`🚪 ${otherPlayers[data.socketId].name} salió.`);
    delete otherPlayers[data.socketId];
  }
});

socket.on('chat_received', (data) => {
  activeBubbles[data.socketId] = {
    text: data.text,
    time: Date.now() + 4500
  };
  if (data.text.includes('🐶')) playSfx('dog');
  else if (data.text.includes('🐱')) playSfx('cat');
  else if (data.text.includes('🦆')) playSfx('duck');
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
  const maxR = 36;

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

// ==========================================
// INTERACCIONES EN EL MUNDO
// ==========================================
let currentInteractType = null;
let currentNearbyAnimal = null;

function checkProximities() {
  if (!myPlayer) return;
  currentInteractType = null;
  currentNearbyAnimal = null;

  // 1. Rincón de Juegos y Aprendizaje en la Plaza
  const distSchool = Math.hypot(myPlayer.x - 1140, myPlayer.y - 580);
  if (distSchool < 70) {
    currentInteractType = 'academy';
    setActionButton('🧸', 'JUGAR');
    locationBadge.innerText = 'Rincón de Juegos 🧸';
    return;
  }

  // 2. Animales didácticos en el parque
  for (const an of townAnimals) {
    const distA = Math.hypot(myPlayer.x - an.x, myPlayer.y - an.y);
    if (distA < 55) {
      currentInteractType = 'animal';
      currentNearbyAnimal = an;
      setActionButton(an.emoji, an.name.toUpperCase());
      locationBadge.innerText = `Parque: ${an.type}`;
      return;
    }
  }

  // 3. Parada de autobús
  const distBus = Math.hypot(myPlayer.x - 1020, myPlayer.y - 650);
  if (distBus < 65) {
    currentInteractType = 'bus_stop';
    setActionButton('🚏', 'PARADA');
    locationBadge.innerText = 'Parada de Autobús';
    return;
  }

  // 4. Bancos del parque
  const distBench = Math.hypot(myPlayer.x - 870, myPlayer.y - 650);
  if (distBench < 60) {
    currentInteractType = 'bench';
    setActionButton('🛋️', 'SENTARSE');
    locationBadge.innerText = 'Bancos de la Plaza';
    return;
  }

  // 5. Pelota de fútbol
  const distBall = Math.hypot(myPlayer.x - soccerBall.x, myPlayer.y - soccerBall.y);
  if (distBall < 50) {
    locationBadge.innerText = 'Parque & Fútbol';
  }

  btnActionMain.classList.remove('pulse');
  actionBtnEmoji.innerText = '✨';
  actionBtnLabel.innerText = 'TOCAR';
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
    spawnEmojiBubble(myPlayer.x, myPlayer.y - 45, '✨ ¡Hola!');
    return;
  }

  if (currentInteractType === 'academy') {
    openDidacticModal();
  } else if (currentInteractType === 'animal' && currentNearbyAnimal) {
    playSfx(currentNearbyAnimal.sound);
    showAlert(currentNearbyAnimal.phrase);
    spawnEmojiBubble(myPlayer.x, myPlayer.y - 45, `${currentNearbyAnimal.emoji} ¡${currentNearbyAnimal.name}!`);
    rewardCoins(5);
    speak(currentNearbyAnimal.phrase);
  } else if (currentInteractType === 'bus_stop') {
    playSfx('coin');
    showAlert('🚏 ¡Ruta 42 del Barrio Az en camino!');
  } else if (currentInteractType === 'bench') {
    playSfx('coin');
    showAlert('🛋️ Descansando en el banco del parque...');
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

// ==========================================
// LOOP DE FÍSICA Y ACTUALIZACIÓN
// ==========================================
let lastMoveSent = 0;
let stepAnim = 0;

function update() {
  gameTime += 0.03;
  if (!myPlayer) return;

  let speed = 3.8;
  if (selectedCharId === 'diegoaz_jr') speed = 4.6;

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

  const isMoving = Math.hypot(vx, vy) > 0.3;
  if (isMoving) {
    stepAnim += 0.24;
    myPlayer.x = Math.max(50, Math.min(WORLD_WIDTH - 50, myPlayer.x + vx));
    myPlayer.y = Math.max(50, Math.min(WORLD_HEIGHT - 50, myPlayer.y + vy));

    if (Math.abs(vx) > Math.abs(vy)) myPlayer.direction = vx > 0 ? 'right' : 'left';
    else myPlayer.direction = vy > 0 ? 'down' : 'up';
  }
  myPlayer.isMoving = isMoving;

  // Cámara centrada zoom 1.35x
  const targetCamX = myPlayer.x - (canvas.width / zoomScale) / 2;
  const targetCamY = myPlayer.y - (canvas.height / zoomScale) / 2;
  camera.x += (targetCamX - camera.x) * 0.15;
  camera.y += (targetCamY - camera.y) * 0.15;

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
  if (distBall < 24) {
    const angle = Math.atan2(soccerBall.y - myPlayer.y, soccerBall.x - myPlayer.x);
    soccerBall.vx = Math.cos(angle) * 8.5;
    soccerBall.vy = Math.sin(angle) * 8.5;
    playSfx('kick');
    socket.emit('kick_ball', soccerBall);
  }

  soccerBall.x += soccerBall.vx;
  soccerBall.y += soccerBall.vy;
  soccerBall.vx *= 0.94;
  soccerBall.vy *= 0.94;

  // Monedas
  streetCoins.forEach(coin => {
    if (!coin.collected) {
      const distC = Math.hypot(myPlayer.x - coin.x, myPlayer.y - coin.y);
      if (distC < 24) {
        coin.collected = true;
        rewardCoins(10);
        showAlert('🪙 +10 Monedas recogidas!');
        setTimeout(() => { coin.collected = false; }, 18000);
      }
    }
  });

  checkProximities();
}

// ==========================================
// RENDERIZADO VISUAL
// ==========================================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.scale(zoomScale, zoomScale);
  ctx.translate(-camera.x, -camera.y);

  // 1. DIBUJAR TERRENO URBANO
  drawUrbanTerrain();

  // 2. DIBUJAR PROPS URBANOS Y ANIMALES
  drawUrbanProps();

  // 3. JUGADORES REMOTOS
  for (const sId in otherPlayers) {
    drawPlayer(otherPlayers[sId], sId);
  }

  // 4. JUGADOR LOCAL
  if (myPlayer) {
    drawPlayer(myPlayer, socket.id, true);
  }

  // 5. GLOBOS DE TEXTO
  drawBubbles();

  ctx.restore();
}

function drawUrbanTerrain() {
  // Césped verde vivo con flores silvestres
  ctx.fillStyle = '#3f7a2d';
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  ctx.fillStyle = '#2f5c22';
  for (let x = 0; x < WORLD_WIDTH; x += 48) {
    for (let y = 0; y < WORLD_HEIGHT; y += 48) {
      if ((x * 3 + y * 7) % 5 === 0) {
        ctx.fillRect(x + 4, y + 4, 12, 8);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 10, y + 6, 2, 2); // margarita
        ctx.fillStyle = '#60a5fa'; ctx.fillRect(x + 16, y + 8, 2, 2); // flor azul
        ctx.fillStyle = '#2f5c22';
      }
    }
  }

  // Avenidas de Asfalto con líneas viales
  drawAsphaltRoad(0, 700, WORLD_WIDTH, 140);
  drawAsphaltRoad(940, 0, 140, WORLD_HEIGHT);

  // Aceras de baldosas con bordillo
  drawSidewalk(0, 640, WORLD_WIDTH, 60);
  drawSidewalk(0, 840, WORLD_WIDTH, 60);
  drawSidewalk(880, 0, 60, WORLD_HEIGHT);
  drawSidewalk(1080, 0, 60, WORLD_HEIGHT);

  // Plaza Central de Concreto con Grietas
  drawCrackedConcretePlaza(1140, 500, 240, 200);

  // Puesto de la Academia Didáctica
  drawAcademyStation(1140, 500);

  // Bordes de tierra
  ctx.fillStyle = '#9e6c38';
  ctx.fillRect(0, 636, WORLD_WIDTH, 4);
  ctx.fillRect(0, 900, WORLD_WIDTH, 4);
}

function drawAsphaltRoad(x, y, w, h) {
  ctx.fillStyle = '#2b2d35';
  ctx.fillRect(x, y, w, h);

  if (w > h) {
    ctx.fillStyle = '#eab308';
    ctx.fillRect(x, y + 6, w, 2); ctx.fillRect(x, y + 10, w, 2);
    ctx.fillRect(x, y + h - 12, w, 2); ctx.fillRect(x, y + h - 8, w, 2);
    ctx.fillStyle = '#f8fafc';
    for (let px = x + 10; px < x + w; px += 36) {
      ctx.fillRect(px, y + h / 2 - 2, 20, 4);
    }
  } else {
    ctx.fillStyle = '#eab308';
    ctx.fillRect(x + 6, y, 2, h); ctx.fillRect(x + 10, y, 2, h);
    ctx.fillRect(x + w - 12, y, 2, h); ctx.fillRect(x + w - 8, y, 2, h);
    ctx.fillStyle = '#f8fafc';
    for (let py = y + 10; py < y + h; py += 36) {
      ctx.fillRect(x + w / 2 - 2, py, 4, 20);
    }
  }
}

function drawSidewalk(x, y, w, h) {
  ctx.fillStyle = '#beb5a8';
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#9c9285';
  ctx.lineWidth = 1;
  for (let px = x; px <= x + w; px += 16) {
    ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke();
  }
  for (let py = y; py <= y + h; py += 16) {
    ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + w, py); ctx.stroke();
  }

  ctx.fillStyle = '#6e675b';
  if (w > h) ctx.fillRect(x, y + h - 4, w, 4);
  else ctx.fillRect(x + w - 4, y, 4, h);
}

function drawCrackedConcretePlaza(x, y, w, h) {
  ctx.fillStyle = '#a89f91';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#736b5e';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  ctx.beginPath();
  ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();

  // Grietas orgánicas
  ctx.strokeStyle = '#5a5347';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 20, y + 10); ctx.lineTo(x + 40, y + 30); ctx.lineTo(x + 35, y + 50);
  ctx.moveTo(x + w - 30, y + 20); ctx.lineTo(x + w - 50, y + 45);
  ctx.moveTo(x + 45, y + h - 20); ctx.lineTo(x + 60, y + h - 45);
  ctx.stroke();
}

function drawAcademyStation(x, y) {
  // Puesto de Juguetes y Aprendizaje (100% visual para Diego Jr. 4 años)
  const boothX = x + 15;
  const boothY = y + 10;

  // Base de mostrador colorida
  ctx.fillStyle = '#92400e';
  ctx.fillRect(boothX, boothY + 22, 110, 26);
  ctx.fillStyle = '#d97706';
  ctx.fillRect(boothX + 3, boothY + 25, 104, 20);

  // Toldo rayado estilo feria / juguetería
  const stripes = ['#ef4444', '#ffffff', '#3b82f6', '#ffffff', '#10b981', '#ffffff', '#ef4444'];
  const sWidth = 110 / stripes.length;
  stripes.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(boothX + i * sWidth, boothY, sWidth + 1, 14);
  });

  // Postes
  ctx.fillStyle = '#78350f';
  ctx.fillRect(boothX + 2, boothY + 14, 4, 10);
  ctx.fillRect(boothX + 104, boothY + 14, 4, 10);

  // Iconos gigantes de juguetes y colores (Fácil de entender sin leer)
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🧸', boothX + 25, boothY + 22);
  ctx.fillText('🎨', boothX + 55, boothY + 22);
  ctx.fillText('🔢', boothX + 85, boothY + 22);
  ctx.textAlign = 'start';

  // Letrero con Osito
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 6px "Press Start 2P"';
  ctx.fillText('🧸 JUGUETES', boothX + 20, boothY + 39);
}

function drawUrbanProps() {
  drawParkBench(870, 650);
  drawParkBench(1160, 650);
  drawBusStop(1020, 636);
  drawFireHydrant(930, 672);
  drawTrashCan(950, 668);
  drawVictorianStreetLamp(970, 642);
  drawVictorianStreetLamp(1280, 642);
  drawStopSign(890, 676);
  drawPedestrianSign(1120, 676);
  drawBrickPlanterBox(1180, 666);
  drawTrashBagsAndBoxes(850, 668);

  // Pelota de fútbol
  drawSoccerBall();

  // ANIMALES DIDÁCTICOS VIVOS EN EL PARQUE
  townAnimals.forEach(an => {
    drawAnimalInPark(an);
  });

  // Monedas
  streetCoins.forEach(coin => {
    if (!coin.collected) {
      ctx.fillStyle = '#facc15'; ctx.fillRect(coin.x - 5, coin.y - 5, 10, 10);
      ctx.fillStyle = '#ca8a04'; ctx.fillRect(coin.x - 3, coin.y - 3, 6, 6);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(coin.x - 1, coin.y - 1, 2, 2);
    }
  });
}

function drawParkBench(x, y) {
  ctx.fillStyle = '#6b3b24';
  ctx.fillRect(x, y, 42, 6); ctx.fillRect(x, y + 8, 42, 6);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + 4, y + 14, 3, 6); ctx.fillRect(x + 35, y + 14, 3, 6);
}

function drawBusStop(x, y) {
  ctx.fillStyle = '#1e3a8a'; ctx.fillRect(x, y, 64, 5);
  ctx.fillStyle = 'rgba(56, 189, 248, 0.4)'; ctx.fillRect(x + 2, y + 5, 60, 24);
  ctx.fillStyle = '#334155'; ctx.fillRect(x, y + 5, 3, 26); ctx.fillRect(x + 61, y + 5, 3, 26);
  ctx.fillStyle = '#facc15'; ctx.fillRect(x + 44, y + 8, 12, 16);
  ctx.fillStyle = '#854d0e'; ctx.fillRect(x + 10, y + 22, 32, 4);
}

function drawFireHydrant(x, y) {
  ctx.fillStyle = '#dc2626'; ctx.fillRect(x, y + 4, 10, 14); ctx.fillRect(x - 2, y + 8, 14, 4);
  ctx.fillStyle = '#991b1b'; ctx.fillRect(x + 2, y + 1, 6, 3);
}

function drawTrashCan(x, y) {
  ctx.fillStyle = '#64748b'; ctx.fillRect(x, y + 2, 12, 14);
  ctx.fillStyle = '#475569'; ctx.fillRect(x - 1, y, 14, 3);
  ctx.fillStyle = '#334155'; ctx.fillRect(x + 3, y + 4, 2, 10); ctx.fillRect(x + 7, y + 4, 2, 10);
}

function drawVictorianStreetLamp(x, y) {
  ctx.fillStyle = '#1e293b'; ctx.fillRect(x, y, 4, 38); ctx.fillRect(x - 3, y + 36, 10, 3);
  ctx.fillRect(x - 6, y + 4, 6, 3);
  ctx.fillStyle = 'rgba(253, 224, 71, 0.3)';
  ctx.beginPath(); ctx.arc(x - 6, y + 8, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fde047'; ctx.fillRect(x - 8, y + 6, 6, 7);
  ctx.fillStyle = '#0f172a'; ctx.fillRect(x - 9, y + 4, 8, 2);
}

function drawStopSign(x, y) {
  ctx.fillStyle = '#64748b'; ctx.fillRect(x + 5, y + 12, 2, 22);
  ctx.fillStyle = '#dc2626'; ctx.fillRect(x, y + 2, 12, 8); ctx.fillRect(x + 2, y, 8, 12);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 4px sans-serif'; ctx.fillText('PARE', x + 1, y + 8);
}

function drawPedestrianSign(x, y) {
  ctx.fillStyle = '#64748b'; ctx.fillRect(x + 5, y + 12, 2, 22);
  ctx.fillStyle = '#2563eb'; ctx.fillRect(x, y, 12, 12);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 1, y + 1, 10, 10);
  ctx.fillStyle = '#2563eb'; ctx.fillText('🚸', x + 1, y + 9);
}

function drawBrickPlanterBox(x, y) {
  ctx.fillStyle = '#991b1b'; ctx.fillRect(x, y + 8, 38, 8);
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.arc(x + 8, y + 6, 7, 0, Math.PI * 2);
  ctx.arc(x + 19, y + 5, 8, 0, Math.PI * 2);
  ctx.arc(x + 30, y + 6, 7, 0, Math.PI * 2);
  ctx.fill();
}

function drawTrashBagsAndBoxes(x, y) {
  ctx.fillStyle = '#0f172a';
  ctx.beginPath(); ctx.arc(x + 6, y + 8, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#92400e'; ctx.fillRect(x + 12, y + 4, 10, 10);
}

function drawSoccerBall() {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(soccerBall.x, soccerBall.y, soccerBall.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#0f172a'; ctx.font = '9px sans-serif';
  ctx.fillText('⚽', soccerBall.x - 5, soccerBall.y + 4);
}

// Dibujar animales didácticos en el parque
function drawAnimalInPark(an) {
  // Sombra
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath(); ctx.ellipse(an.x, an.y + 10, 12, 5, 0, 0, Math.PI * 2); ctx.fill();

  // Emoji grande del animal
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(an.emoji, an.x, an.y + 6);

  // Nombre del animal
  ctx.font = 'bold 6px "Press Start 2P"';
  ctx.fillStyle = '#fef08a';
  ctx.fillText(`${an.name}`, an.x, an.y - 14);
  ctx.textAlign = 'start';
}

function drawPlayer(p, sId, isSelf = false) {
  const x = Math.round(p.x);
  const y = Math.round(p.y);
  const dir = p.direction || 'down';

  let frame = 0;
  if (p.isMoving) {
    const cycle = Math.floor(stepAnim) % 4;
    if (cycle === 1) frame = 1;
    else if (cycle === 3) frame = 2;
  }

  const sprite = getCharacterSprite(p.id, dir, frame);
  ctx.drawImage(sprite, x - 9, y - 28);

  ctx.font = 'bold 7px "Press Start 2P"';
  ctx.textAlign = 'center';
  const tagW = ctx.measureText(p.name).width + 8;

  ctx.fillStyle = isSelf ? 'rgba(22, 101, 52, 0.9)' : 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(x - tagW / 2, y - 36, tagW, 11);
  ctx.strokeStyle = isSelf ? '#86efac' : '#38bdf8';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - tagW / 2, y - 36, tagW, 11);

  ctx.fillStyle = '#ffffff';
  ctx.fillText(p.name, x, y - 28);
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
    if (p) {
      const bx = p.x;
      const by = p.y - 44;
      ctx.font = 'bold 7px "Press Start 2P"';
      ctx.textAlign = 'center';
      const tw = ctx.measureText(b.text).width + 12;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(bx - tw / 2, by - 12, tw, 16);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx - tw / 2, by - 12, tw, 16);

      ctx.fillStyle = '#f8fafc';
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
