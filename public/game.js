// =========================================================
// FRUIT MERGE 2048: WORLD CHAMPIONSHIP - CLIENT ENGINE
// Bilingual (Tier 1 English & LatAm Spanish), High eCPM Ads & Leaderboard
// =========================================================

const socket = io({
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 30
});

// Canvas & Contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// =========================================================
// I18N DICCIONARIO BILINGÜE (INGLÉS TIER 1 & ESPAÑOL)
// =========================================================
const I18N = {
  en: {
    flag: '🇺🇸',
    langBtn: '🇺🇸 EN',
    title: 'World Grand Championship',
    prize: '🎁 $50 USD Cash Prize for Rank #1!',
    timerLabel: '⏳ Ends in:',
    btnRanking: 'Leaderboard',
    rankStatus: 'Rank #{rank} in tournament',
    unrankedStatus: 'Play a game to rank in the tournament!',
    score: 'SCORE',
    best: 'BEST',
    next: 'NEXT:',
    shake: 'Shake',
    bomb: 'Bomb',
    wildcard: 'Wildcard',
    thPlayer: 'Player',
    thScore: 'Score',
    thGames: 'Games',
    lbTitle: '🏆 World Championship Leaderboard',
    lbDesc: 'Top global players competing in real-time for the cash prize!',
    myRankLabel: 'YOUR CURRENT RANK',
    myRankGapLead: '🥇 You are leading the tournament!',
    myRankGapChase: 'Keep playing to take the #1 spot!',
    goTitle: 'Game Over!',
    finalScore: 'Final Score:',
    adBold: 'Save your score for the Tournament?',
    adSub: 'Watch a quick ad to drop a Bomb and clear 40% of the jar!',
    btnWatchAd: 'Watch Ad to Save!',
    btnPlayAgain: '▶ Play Again',
    btnViewLeaderboard: 'View Global Leaderboard',
    adSponsor: 'SPONSORED REWARDED AD',
    adCountdown: 'Reward in {sec}s...',
    adClaim: 'Claim Reward & Continue!',
    adWatching: 'Watching Ad ({sec}s)...',
    savedToast: '💣 Score Saved! Continue playing!',
    watermelonToast: '🍉 GIANT WATERMELON MERGED! (+5,000 pts)',
    nameUpdatedToast: '✏️ Tournament name updated!',
    shakeToast: '🌀 Jar Shaken!',
    bombToast: '💣 Next fruit is a Bomb!',
    wildToast: '🌈 Next fruit is a Wildcard!'
  },
  es: {
    flag: '🇪🇸',
    langBtn: '🇪🇸 ES',
    title: 'Gran Torneo Mundial',
    prize: '🎁 ¡$50 USD en Efectivo para el Puesto #1!',
    timerLabel: '⏳ Finaliza en:',
    btnRanking: 'Ver Ranking',
    rankStatus: 'Puesto #{rank} en el torneo',
    unrankedStatus: '¡Juega una partida para clasificar!',
    score: 'PUNTOS',
    best: 'RÉCORD',
    next: 'SIGUIENTE:',
    shake: 'Agitar',
    bomb: 'Bomba',
    wildcard: 'Comodín',
    thPlayer: 'Jugador',
    thScore: 'Puntos',
    thGames: 'Partidas',
    lbTitle: '🏆 Tabla de Posiciones del Concurso',
    lbDesc: '¡Los mejores jugadores en tiempo real compitiendo por el premio!',
    myRankLabel: 'TU PUESTO ACTUAL',
    myRankGapLead: '🥇 ¡Vas liderando el concurso!',
    myRankGapChase: '¡Sigue sumando puntos para el puesto #1!',
    goTitle: '¡Partida Terminada!',
    finalScore: 'Puntos obtenidos:',
    adBold: '¿Salvar tu récord para el Torneo?',
    adSub: 'Mira un anuncio corto para usar una Bomba y despejar el 40% del frasco',
    btnWatchAd: '¡Ver Anuncio para Salvar!',
    btnPlayAgain: '▶ Jugar Otra Partida',
    btnViewLeaderboard: 'Ver Tabla de Posiciones',
    adSponsor: 'ANUNCIO RECOMPENSADO PATROCINADO',
    adCountdown: 'Recompensa en {sec}s...',
    adClaim: '¡Reclamar Recompensa y Seguir!',
    adWatching: 'Viendo Anuncio ({sec}s)...',
    savedToast: '💣 ¡Partida Salvada con Éxito!',
    watermelonToast: '🍉 ¡SANDÍA GIGANTE FUSIONADA! (+5,000 pts)',
    nameUpdatedToast: '✏️ Nombre actualizado para el torneo',
    shakeToast: '🌀 ¡Frasco Agitado!',
    bombToast: '💣 ¡La siguiente fruta es una Bomba!',
    wildToast: '🌈 ¡La siguiente fruta es Comodín!'
  }
};

// Detección automática de idioma: Tier 1 (inglés) por defecto
let currentLang = 'en';
const userBrowserLang = (navigator.language || 'en').toLowerCase();
if (userBrowserLang.startsWith('es')) {
  currentLang = 'es';
}

function t(key, params = {}) {
  let str = (I18N[currentLang] && I18N[currentLang][key]) || (I18N.en && I18N.en[key]) || key;
  Object.keys(params).forEach(k => {
    str = str.replace(`{${k}}`, params[k]);
  });
  return str;
}

// Banderita según locale
function getPlayerFlag() {
  if (userBrowserLang.includes('us')) return '🇺🇸';
  if (userBrowserLang.includes('gb') || userBrowserLang.includes('uk')) return '🇬🇧';
  if (userBrowserLang.includes('ca')) return '🇨🇦';
  if (userBrowserLang.includes('au')) return '🇦🇺';
  if (userBrowserLang.includes('de')) return '🇩🇪';
  if (userBrowserLang.includes('co')) return '🇨🇴';
  if (userBrowserLang.includes('mx')) return '🇲🇽';
  if (userBrowserLang.includes('es')) return '🇪🇸';
  if (userBrowserLang.includes('ar')) return '🇦🇷';
  return currentLang === 'en' ? '🇺🇸' : '🇨🇴';
}

// DOM Elements
const tournamentTitle = document.getElementById('tournament-title');
const tournamentPrize = document.getElementById('tournament-prize');
const tournamentTimer = document.getElementById('tournament-timer');
const btnOpenLeaderboard = document.getElementById('btn-open-leaderboard');
const btnOpenAdmin = document.getElementById('btn-open-admin');
const btnLangToggle = document.getElementById('btn-lang-toggle');

const playerFlagIcon = document.getElementById('player-flag-icon');
const playerAliasEl = document.getElementById('player-alias');
const playerRankStatus = document.getElementById('player-rank-status');
const btnEditAlias = document.getElementById('btn-edit-alias');
const currentScoreVal = document.getElementById('current-score-val');
const bestScoreVal = document.getElementById('best-score-val');
const nextFruitEmoji = document.getElementById('next-fruit-emoji');

const btnPowerupShake = document.getElementById('btn-powerup-shake');
const btnPowerupBomb = document.getElementById('btn-powerup-bomb');
const btnPowerupRainbow = document.getElementById('btn-powerup-rainbow');

// Modales
const modalAlias = document.getElementById('modal-alias');
const inputNewAlias = document.getElementById('input-new-alias');
const btnSaveAlias = document.getElementById('btn-save-alias');
const btnCancelAlias = document.getElementById('btn-cancel-alias');

const modalLeaderboard = document.getElementById('modal-leaderboard');
const btnCloseLeaderboard = document.getElementById('btn-close-leaderboard');
const leaderboardTbody = document.getElementById('leaderboard-tbody');
const myRankNumber = document.getElementById('my-rank-number');
const myRankScore = document.getElementById('my-rank-score');
const myRankGap = document.getElementById('my-rank-gap');

const modalGameOver = document.getElementById('modal-gameover');
const goFinalScore = document.getElementById('go-final-score');
const btnReviveGame = document.getElementById('btn-revive-game');
const btnRestartGame = document.getElementById('btn-restart-game');
const btnViewRankGo = document.getElementById('btn-view-rank-go');

const modalRewardedAd = document.getElementById('modal-rewarded-ad');
const adCountdown = document.getElementById('ad-countdown');
const btnClaimAdReward = document.getElementById('btn-claim-ad-reward');

const modalAdmin = document.getElementById('modal-admin');
const btnCloseAdmin = document.getElementById('btn-close-admin');
const adminLoginView = document.getElementById('admin-login-view');
const adminPanelView = document.getElementById('admin-panel-view');
const inputAdminPin = document.getElementById('input-admin-pin');
const btnSubmitPin = document.getElementById('btn-submit-pin');
const admTitle = document.getElementById('adm-title');
const admPrize = document.getElementById('adm-prize');
const admDeadline = document.getElementById('adm-deadline');
const btnSaveTournament = document.getElementById('btn-save-tournament');
const btnResetTournament = document.getElementById('btn-reset-tournament');

const toastBanner = document.getElementById('toast-banner');
const toastMsg = document.getElementById('toast-msg');

// =========================================================
// GESTOR DE MONETIZACIÓN & ANUNCIOS (AD NETWORK BRIDGE)
// =========================================================
const AdManager = {
  // Banners rotativos cada 30 segundos para generar impresiones continuas
  initBannerRotation() {
    const sponsors = [
      '🎯 Play Daily & Win $50 Cash Tournament Prize!',
      '🔥 Top 1 Leaderboard Wins Real Cash Rewards!',
      '💎 Double your Tournament Coins with Daily Plays!',
      '🍉 Can you merge the Golden Watermelon? Try now!'
    ];
    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % sponsors.length;
      const el = document.getElementById('ad-banner-display');
      if (el) el.innerHTML = `<span class="ad-sponsor-text">${sponsors[idx]}</span>`;
    }, 28000);
  },

  // Mostrar Anuncio Recompensado (Simulado o Google H5/Poki SDK)
  showRewardedAd(onRewarded, onFailed) {
    // Si existe Google H5 Game Ads en window.adBreak
    if (typeof window.adBreak === 'function') {
      window.adBreak({
        type: 'reward',
        name: 'revive_bomb',
        beforeReward: () => {},
        beforeAd: () => {},
        afterAd: () => {},
        adDismissed: () => { if (onFailed) onFailed(); },
        adViewed: () => { if (onRewarded) onRewarded(); }
      });
      return;
    }

    // Modal de Anuncio Recompensado con cuenta regresiva de 5 segundos
    modalRewardedAd.classList.remove('hidden');
    let timeLeft = 5;
    btnClaimAdReward.disabled = true;
    btnClaimAdReward.classList.add('disabled');
    btnClaimAdReward.innerText = t('adWatching', { sec: timeLeft });
    adCountdown.innerText = t('adCountdown', { sec: timeLeft });

    const adTimer = setInterval(() => {
      timeLeft--;
      if (timeLeft > 0) {
        btnClaimAdReward.innerText = t('adWatching', { sec: timeLeft });
        adCountdown.innerText = t('adCountdown', { sec: timeLeft });
      } else {
        clearInterval(adTimer);
        adCountdown.innerText = '✅ Reward Ready!';
        btnClaimAdReward.disabled = false;
        btnClaimAdReward.classList.remove('disabled');
        btnClaimAdReward.innerText = t('adClaim');
        btnClaimAdReward.onclick = () => {
          modalRewardedAd.classList.add('hidden');
          if (onRewarded) onRewarded();
        };
      }
    }, 1000);
  }
};
AdManager.initBannerRotation();

// =========================================================
// APLICAR TRADUCCIONES DE IDIOMA
// =========================================================
function applyTranslations() {
  btnLangToggle.innerText = I18N[currentLang].langBtn;
  if (playerFlagIcon) playerFlagIcon.innerText = getPlayerFlag();

  document.getElementById('lbl-timer').innerText = t('timerLabel');
  document.getElementById('lbl-btn-ranking').innerText = t('btnRanking');
  document.getElementById('lbl-score').innerText = t('score');
  document.getElementById('lbl-best').innerText = t('best');
  document.getElementById('lbl-next').innerText = t('next');
  document.getElementById('lbl-shake').innerText = t('shake');
  document.getElementById('lbl-bomb').innerText = t('bomb');
  document.getElementById('lbl-wild').innerText = t('wildcard');

  document.getElementById('th-player').innerText = t('thPlayer');
  document.getElementById('th-score').innerText = t('thScore');
  document.getElementById('th-games').innerText = t('thGames');
  document.getElementById('lbl-lb-title').innerText = t('lbTitle');
  document.getElementById('lbl-lb-desc').innerText = t('lbDesc');
  document.getElementById('lbl-my-rank').innerText = t('myRankLabel');

  document.getElementById('lbl-go-title').innerText = t('goTitle');
  document.getElementById('lbl-final-score').innerText = t('finalScore');
  document.getElementById('lbl-ad-bold').innerText = t('adBold');
  document.getElementById('lbl-ad-sub').innerText = t('adSub');
  btnReviveGame.innerText = t('btnWatchAd');
  document.getElementById('btn-restart-txt') && (document.getElementById('btn-restart-txt').innerText = t('btnPlayAgain'));
  document.getElementById('btn-rank-txt') && (document.getElementById('btn-rank-txt').innerText = t('btnViewLeaderboard'));
}

btnLangToggle.addEventListener('click', () => {
  currentLang = currentLang === 'en' ? 'es' : 'en';
  applyTranslations();
  updateTournamentDisplay();
  showToast(currentLang === 'en' ? '🇺🇸 Language: English' : '🇪🇸 Idioma: Español');
});
applyTranslations();

// =========================================================
// DEFINICIÓN DE LAS 11 FRUTAS Y EVOLUCIÓN (SUIKA MERGE)
// =========================================================
const FRUITS = [
  { level: 0, emoji: '🍒', radius: 16, color: '#dc2626', points: 2 },
  { level: 1, emoji: '🍓', radius: 23, color: '#f43f5e', points: 4 },
  { level: 2, emoji: '🍇', radius: 31, color: '#a855f7', points: 8 },
  { level: 3, emoji: '🍋', radius: 39, color: '#facc15', points: 16 },
  { level: 4, emoji: '🍊', radius: 48, color: '#f97316', points: 32 },
  { level: 5, emoji: '🍎', radius: 58, color: '#ef4444', points: 64 },
  { level: 6, emoji: '🍐', radius: 68, color: '#84cc16', points: 128 },
  { level: 7, emoji: '🍑', radius: 80, color: '#fb923c', points: 256 },
  { level: 8, emoji: '🍍', radius: 93, color: '#eab308', points: 512 },
  { level: 9, emoji: '🍈', radius: 106, color: '#10b981', points: 1024 },
  { level: 10, emoji: '🍉', radius: 124, color: '#047857', points: 2048 }
];

// =========================================================
// AUDIO SINTETIZADO CON WEB AUDIO API
// =========================================================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playPopSfx(level = 0) {
  try {
    initAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);

    const baseFreq = 260 + level * 65;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.start(now); osc.stop(now + 0.12);
  } catch (e) {}
}

function playDropSfx() {
  try {
    initAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
    osc.start(now); osc.stop(now + 0.09);
  } catch (e) {}
}

function playFanfareSfx() {
  try {
    initAudio();
    const now = audioCtx.currentTime;
    [523, 659, 783, 1046, 1318].forEach((f, idx) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, now + idx * 0.07);
      g.gain.setValueAtTime(0.2, now + idx * 0.07);
      g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.25);
      o.start(now + idx * 0.07); o.stop(now + idx * 0.07 + 0.25);
    });
  } catch (e) {}
}

function triggerHaptic(ms = 25) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(ms); } catch (e) {}
  }
}

// =========================================================
// GESTIÓN DE JUGADOR Y IDENTIFICACIÓN (ZERO FRICTION)
// =========================================================
let playerUID = localStorage.getItem('fruit_merge_uid');
if (!playerUID) {
  playerUID = 'user_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
  localStorage.setItem('fruit_merge_uid', playerUID);
}

let playerData = {
  alias: 'Player...',
  bestScore: 0,
  tournamentScore: 0,
  coins: 100
};

let activeTournament = null;
let currentScore = 0;
let isGameOver = false;

// Cargar o autenticar jugador en el servidor
async function authPlayer() {
  try {
    const savedAlias = localStorage.getItem('fruit_merge_alias') || '';
    const res = await fetch('/api/player/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: playerUID, alias: savedAlias })
    });
    const data = await res.json();
    if (data.player) {
      playerData = data.player;
      playerAliasEl.innerText = playerData.alias;
      bestScoreVal.innerText = playerData.best_score || 0;
      localStorage.setItem('fruit_merge_alias', playerData.alias);

      if (data.myRank) {
        updateMyRankDisplay(data.myRank);
      }
    }
    if (data.tournament) {
      activeTournament = data.tournament;
      updateTournamentDisplay();
    }
  } catch (err) {
    console.error('Error autenticando jugador:', err);
  }
}
authPlayer();

function updateMyRankDisplay(rankInfo) {
  if (rankInfo && rankInfo.rank > 0) {
    playerRankStatus.innerText = t('rankStatus', { rank: rankInfo.rank });
    myRankNumber.innerText = `#${rankInfo.rank}`;
    myRankScore.innerText = `${rankInfo.score} pts`;
    myRankGap.innerText = rankInfo.rank === 1 ? t('myRankGapLead') : t('myRankGapChase');
  } else {
    playerRankStatus.innerText = t('unrankedStatus');
    myRankNumber.innerText = `#--`;
    myRankScore.innerText = `0 pts`;
    myRankGap.innerText = t('unrankedStatus');
  }
}

function updateTournamentDisplay() {
  if (!activeTournament) return;
  tournamentTitle.innerText = activeTournament.title;
  tournamentPrize.innerText = `🎁 ${activeTournament.prize_text}`;
}

// Reloj de cuenta regresiva del torneo
setInterval(() => {
  if (!activeTournament || !activeTournament.end_time) return;
  const end = new Date(activeTournament.end_time).getTime();
  const now = Date.now();
  const diff = Math.max(0, end - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  tournamentTimer.innerText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
}, 1000);

// =========================================================
// MOTOR FÍSICO 2D DE SUIKA MERGE
// =========================================================
const GRAVITY = 0.38;
const DANGER_Y = 70;
let dangerTimer = 0;

let droppedFruits = [];
let particles = [];

let dropX = canvas.width / 2;
let currentFruitLevel = Math.floor(Math.random() * 3);
let nextFruitLevel = Math.floor(Math.random() * 3);
let canDrop = true;
let dropCooldown = 0;

let nextIsBomb = false;
let nextIsRainbow = false;

function updateNextIndicator() {
  nextFruitEmoji.innerText = FRUITS[nextFruitLevel].emoji;
}
updateNextIndicator();

function createFruitBody(x, y, level, vx = 0, vy = 0) {
  const fDef = FRUITS[level];
  return {
    id: Math.random().toString(36).substring(2),
    x: x,
    y: y,
    vx: vx,
    vy: vy,
    radius: fDef.radius,
    level: level,
    emoji: fDef.emoji,
    color: fDef.color,
    points: fDef.points,
    rot: Math.random() * Math.PI,
    vrot: (Math.random() - 0.5) * 0.05,
    isMerging: false,
    scale: 0.2
  };
}

function dropCurrentFruit() {
  if (!canDrop || isGameOver) return;
  initAudio();
  playDropSfx();

  const fDef = FRUITS[currentFruitLevel];
  const clampedX = Math.max(fDef.radius + 6, Math.min(canvas.width - fDef.radius - 6, dropX));

  const fruit = createFruitBody(clampedX, 45, currentFruitLevel, 0, 1.5);
  fruit.isBomb = nextIsBomb;
  fruit.isRainbow = nextIsRainbow;
  nextIsBomb = false;
  nextIsRainbow = false;

  droppedFruits.push(fruit);

  canDrop = false;
  dropCooldown = 32;

  currentFruitLevel = nextFruitLevel;
  nextFruitLevel = Math.floor(Math.random() * 3);
  updateNextIndicator();
}

function handlePointerInput(clientX) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  dropX = (clientX - rect.left) * scaleX;

  const currentRadius = FRUITS[currentFruitLevel].radius;
  dropX = Math.max(currentRadius + 6, Math.min(canvas.width - currentRadius - 6, dropX));
}

canvas.addEventListener('mousemove', (e) => {
  handlePointerInput(e.clientX);
});

canvas.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0) {
    handlePointerInput(e.touches[0].clientX);
  }
}, { passive: true });

canvas.addEventListener('mouseup', () => {
  dropCurrentFruit();
});

canvas.addEventListener('touchend', () => {
  dropCurrentFruit();
});

// =========================================================
// BUCLES DE FÍSICA Y COLISIONES
// =========================================================
function updatePhysics() {
  if (dropCooldown > 0) {
    dropCooldown--;
    if (dropCooldown <= 0) canDrop = true;
  }

  // 1. Integración de movimiento y gravedad
  droppedFruits.forEach(f => {
    f.vy += GRAVITY;
    f.x += f.vx;
    f.y += f.vy;
    f.rot += f.vrot;

    f.vx *= 0.99;
    f.vy *= 0.995;

    if (f.scale < 1) {
      f.scale = Math.min(1, f.scale + 0.12);
    }

    if (f.x - f.radius < 6) {
      f.x = 6 + f.radius;
      f.vx = -f.vx * 0.35;
    }
    if (f.x + f.radius > canvas.width - 6) {
      f.x = canvas.width - 6 - f.radius;
      f.vx = -f.vx * 0.35;
    }

    if (f.y + f.radius > canvas.height - 8) {
      f.y = canvas.height - 8 - f.radius;
      f.vy = -f.vy * 0.22;
      f.vx *= 0.92;
    }
  });

  // 2. Colisión y Fusión entre frutas
  const toRemove = new Set();
  const toSpawn = [];

  for (let i = 0; i < droppedFruits.length; i++) {
    for (let j = i + 1; j < droppedFruits.length; j++) {
      const a = droppedFruits[i];
      const b = droppedFruits[j];

      if (toRemove.has(a.id) || toRemove.has(b.id)) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.radius + b.radius;

      if (dist < minDist && dist > 0) {
        const overlap = (minDist - dist) / 2;
        const nx = dx / dist;
        const ny = dy / dist;

        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;

        const relVel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (relVel < 0) {
          const impulse = relVel * 0.45;
          a.vx += nx * impulse;
          a.vy += ny * impulse;
          b.vx -= nx * impulse;
          b.vy -= ny * impulse;
        }

        const canMerge = (a.level === b.level && a.level < FRUITS.length - 1) || a.isRainbow || b.isRainbow;

        if (canMerge) {
          toRemove.add(a.id);
          toRemove.add(b.id);

          const nextLvl = Math.min(FRUITS.length - 1, Math.max(a.level, b.level) + 1);
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;

          toSpawn.push({ x: midX, y: midY, level: nextLvl });

          const pts = FRUITS[nextLvl].points;
          addScore(pts);
          playPopSfx(nextLvl);
          triggerHaptic(30);
          spawnMergeParticles(midX, midY, FRUITS[nextLvl].color);

          if (nextLvl === 10) {
            playFanfareSfx();
            addScore(5000);
            showToast(t('watermelonToast'));
            socket.emit('huge_merge', { alias: playerData.alias, fruit: '🍉 Giant Watermelon', score: currentScore });
          }
        }
      }
    }
  }

  if (toRemove.size > 0) {
    droppedFruits = droppedFruits.filter(f => !toRemove.has(f.id));
    toSpawn.forEach(s => {
      const newF = createFruitBody(s.x, s.y, s.level, (Math.random() - 0.5) * 1.5, -1.8);
      droppedFruits.push(newF);
    });
  }

  // 3. Comprobación de peligro de desbordamiento (Línea Roja)
  let isDanger = false;
  droppedFruits.forEach(f => {
    if (f.y - f.radius < DANGER_Y && Math.hypot(f.vx, f.vy) < 1.2 && f.scale >= 1) {
      isDanger = true;
    }
  });

  if (isDanger) {
    dangerTimer++;
    if (dangerTimer > 150) {
      triggerGameOver();
    }
  } else {
    dangerTimer = Math.max(0, dangerTimer - 2);
  }
}

function addScore(pts) {
  currentScore += pts;
  currentScoreVal.innerText = currentScore;
  if (currentScore > (playerData.best_score || 0)) {
    bestScoreVal.innerText = currentScore;
  }
}

async function triggerGameOver() {
  if (isGameOver) return;
  isGameOver = true;

  goFinalScore.innerText = currentScore;
  modalGameOver.classList.remove('hidden');

  try {
    const res = await fetch('/api/game/submit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: playerUID, score: currentScore })
    });
    const data = await res.json();
    if (data.myRank) {
      updateMyRankDisplay(data.myRank);
    }
  } catch (e) {}
}

// Salvar partida con Anuncio Recompensado (High eCPM monetization)
btnReviveGame.addEventListener('click', () => {
  AdManager.showRewardedAd(() => {
    // Recompensa otorgada al ver el anuncio
    initAudio();
    playPopSfx(5);

    droppedFruits.sort((a, b) => a.y - b.y);
    const countToKill = Math.ceil(droppedFruits.length * 0.4);
    for (let i = 0; i < countToKill; i++) {
      if (droppedFruits[i]) {
        spawnMergeParticles(droppedFruits[i].x, droppedFruits[i].y, '#f59e0b');
      }
    }
    droppedFruits.splice(0, countToKill);

    dangerTimer = 0;
    isGameOver = false;
    modalGameOver.classList.add('hidden');
    showToast(t('savedToast'));
  }, () => {
    showToast('Ad was not completed.');
  });
});

btnRestartGame.addEventListener('click', () => {
  modalGameOver.classList.add('hidden');
  resetGame();
});

btnViewRankGo.addEventListener('click', () => {
  modalGameOver.classList.add('hidden');
  openLeaderboardModal();
});

function resetGame() {
  droppedFruits = [];
  currentScore = 0;
  currentScoreVal.innerText = '0';
  dangerTimer = 0;
  isGameOver = false;
  canDrop = true;
}

// ==========================================
// POTENCIADORES / POWERUPS
// ==========================================
btnPowerupShake.addEventListener('click', () => {
  initAudio();
  playDropSfx();
  triggerHaptic(40);
  droppedFruits.forEach(f => {
    f.vy -= Math.random() * 6 + 3;
    f.vx += (Math.random() - 0.5) * 8;
  });
  showToast(t('shakeToast'));
});

btnPowerupBomb.addEventListener('click', () => {
  initAudio();
  nextIsBomb = true;
  showToast(t('bombToast'));
});

btnPowerupRainbow.addEventListener('click', () => {
  initAudio();
  nextIsRainbow = true;
  showToast(t('wildToast'));
});

// ==========================================
// PARTÍCULAS
// ==========================================
function spawnMergeParticles(x, y, color) {
  for (let i = 0; i < 14; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 7,
      vy: (Math.random() - 0.5) * 7,
      size: Math.random() * 5 + 3,
      color: color,
      alpha: 1
    });
  }
}

function updateAndDrawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.035;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ==========================================
// RENDERIZADO
// ==========================================
function render() {
  requestAnimationFrame(render);
  updatePhysics();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Línea guía de caída
  if (canDrop && !isGameOver) {
    const fDef = FRUITS[currentFruitLevel];
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(dropX, 55);
    ctx.lineTo(dropX, canvas.height - 10);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(dropX, 42);
    ctx.fillStyle = fDef.color;
    ctx.beginPath();
    ctx.arc(0, 0, fDef.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = `${fDef.radius * 1.3}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fDef.emoji, 0, 2);
    ctx.restore();
  }

  // Dibujar frutas
  droppedFruits.forEach(f => {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rot);
    ctx.scale(f.scale, f.scale);

    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, f.radius * 0.08);
    ctx.stroke();

    ctx.font = `${f.radius * 1.25}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(f.emoji, 0, 2);

    ctx.restore();
  });

  updateAndDrawParticles();
}
requestAnimationFrame(render);

// ==========================================
// MODAL DE APODO / ALIAS
// ==========================================
btnEditAlias.addEventListener('click', () => {
  inputNewAlias.value = playerData.alias || '';
  modalAlias.classList.remove('hidden');
});

btnCancelAlias.addEventListener('click', () => {
  modalAlias.classList.add('hidden');
});

btnSaveAlias.addEventListener('click', async () => {
  const newName = inputNewAlias.value.trim();
  if (!newName) return;

  try {
    const res = await fetch('/api/player/set-alias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: playerUID, alias: newName })
    });
    const data = await res.json();
    if (data.player) {
      playerData = data.player;
      playerAliasEl.innerText = playerData.alias;
      localStorage.setItem('fruit_merge_alias', playerData.alias);
      modalAlias.classList.add('hidden');
      showToast(t('nameUpdatedToast'));
    }
  } catch (e) {}
});

// ==========================================
// MODAL DE TABLA DE POSICIONES (LEADERBOARD)
// ==========================================
async function openLeaderboardModal() {
  modalLeaderboard.classList.remove('hidden');
  try {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();
    renderLeaderboardRows(data.leaderboard || []);

    const rankRes = await fetch(`/api/player/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: playerUID })
    });
    const rData = await rankRes.json();
    if (rData.myRank) updateMyRankDisplay(rData.myRank);
  } catch (e) {}
}

btnOpenLeaderboard.addEventListener('click', openLeaderboardModal);
btnCloseLeaderboard.addEventListener('click', () => {
  modalLeaderboard.classList.add('hidden');
});

function renderLeaderboardRows(list) {
  leaderboardTbody.innerHTML = '';
  if (list.length === 0) {
    leaderboardTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:16px;">Be the first to play and lead the championship!</td></tr>';
    return;
  }

  list.forEach((p, idx) => {
    const tr = document.createElement('tr');
    let medal = `${idx + 1}`;
    if (idx === 0) medal = '🥇 1';
    else if (idx === 1) medal = '🥈 2';
    else if (idx === 2) medal = '🥉 3';

    const pFlag = idx === 0 ? '🇺🇸' : (idx === 1 ? '🇬🇧' : (idx === 2 ? '🇨🇦' : '🌐'));

    tr.innerHTML = `
      <td>${medal}</td>
      <td><span>${pFlag}</span> <b>${p.alias}</b></td>
      <td><span style="color:#facc15;">${p.score}</span></td>
      <td>${p.games_played || 1}</td>
    `;
    leaderboardTbody.appendChild(tr);
  });
}

socket.on('leaderboard_updated', (newList) => {
  if (!modalLeaderboard.classList.contains('hidden')) {
    renderLeaderboardRows(newList);
  }
});

socket.on('announcement', (data) => {
  showToast(`🍉 ${data.alias} merged a ${data.fruit}!`);
});

// ==========================================
// MODAL DE ADMINISTRACIÓN
// ==========================================
btnOpenAdmin.addEventListener('click', () => {
  adminLoginView.classList.remove('hidden');
  adminPanelView.classList.add('hidden');
  inputAdminPin.value = '';
  modalAdmin.classList.remove('hidden');
});

btnCloseAdmin.addEventListener('click', () => {
  modalAdmin.classList.add('hidden');
});

btnSubmitPin.addEventListener('click', async () => {
  const pin = inputAdminPin.value.trim();
  if (!pin) return;

  try {
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pin })
    });
    const data = await res.json();
    if (data.success) {
      adminLoginView.classList.add('hidden');
      adminPanelView.classList.remove('hidden');

      if (data.tournament) {
        admTitle.value = data.tournament.title;
        admPrize.value = data.tournament.prize_text;
        const dt = new Date(data.tournament.end_time);
        admDeadline.value = dt.toISOString().slice(0, 16);
      }
    } else {
      showToast('❌ Invalid Admin PIN');
    }
  } catch (e) {
    showToast('❌ Connection error');
  }
});

btnSaveTournament.addEventListener('click', async () => {
  const pin = inputAdminPin.value.trim();
  const title = admTitle.value.trim();
  const prize = admPrize.value.trim();
  const deadline = admDeadline.value ? new Date(admDeadline.value).toISOString() : new Date().toISOString();

  try {
    const res = await fetch('/api/admin/update-tournament', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, title, prizeText: prize, endTime: deadline, active: true })
    });
    const data = await res.json();
    if (data.success) {
      activeTournament = data.tournament;
      updateTournamentDisplay();
      modalAdmin.classList.add('hidden');
      showToast('✅ Tournament updated for all players!');
    }
  } catch (e) {}
});

btnResetTournament.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to reset all scores and start a new championship?')) return;
  const pin = inputAdminPin.value.trim();
  try {
    const res = await fetch('/api/admin/reset-tournament', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    const data = await res.json();
    if (data.success) {
      modalAdmin.classList.add('hidden');
      showToast('⚠️ Tournament reset successfully!');
      authPlayer();
    }
  } catch (e) {}
});

function showToast(msg) {
  toastMsg.innerText = msg;
  toastBanner.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toastBanner.classList.add('hidden');
  }, 3200);
}
