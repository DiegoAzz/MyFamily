const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ==========================================
// ESTADO DE LA ARENA COME-FRUTAS EN VIVO
// ==========================================
const ARENA_WIDTH = 2600;
const ARENA_HEIGHT = 1800;

const connectedPlayers = {};
let foodItems = [];
let nextFoodId = 1;

const FRUIT_TYPES = [
  { emoji: '🍎', name: 'Manzana', color: '#ef4444', points: 5, category: 'fruit' },
  { emoji: '🍌', name: 'Plátano', color: '#facc15', points: 5, category: 'fruit' },
  { emoji: '🍓', name: 'Fresa', color: '#f43f5e', points: 6, category: 'fruit' },
  { emoji: '🍉', name: 'Sandía', color: '#10b981', points: 8, category: 'fruit' },
  { emoji: '🍇', name: 'Uva', color: '#a855f7', points: 6, category: 'fruit' },
  { emoji: '🍊', name: 'Naranja', color: '#f97316', points: 5, category: 'fruit' },
  { emoji: '⭐', name: 'Estrella', color: '#fbbf24', points: 15, category: 'gem' },
  { emoji: '💎', name: 'Diamante', color: '#06b6d4', points: 20, category: 'gem' }
];

// Generar alimentos iniciales distribuidos en la arena
function spawnInitialFood(count = 90) {
  for (let i = 0; i < count; i++) {
    spawnSingleFood();
  }
}

function spawnSingleFood() {
  const fType = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
  const isNumberBubble = Math.random() < 0.22;
  const numVal = isNumberBubble ? Math.floor(Math.random() * 5) + 1 : null;

  const item = {
    id: nextFoodId++,
    x: Math.floor(Math.random() * (ARENA_WIDTH - 200)) + 100,
    y: Math.floor(Math.random() * (ARENA_HEIGHT - 200)) + 100,
    emoji: isNumberBubble ? `${numVal}` : fType.emoji,
    isNumber: isNumberBubble,
    numberVal: numVal,
    color: fType.color,
    name: isNumberBubble ? `Número ${numVal}` : fType.name,
    points: fType.points
  };
  foodItems.push(item);
  return item;
}

// Reto didáctico activo (conteo o matemáticas)
let activeDidacticChallenge = {
  id: 'count',
  target: 3,
  prompt: '¡Diego Jr., come la burbuja con el número 3!',
  mathQuestion: null,
  mathAnswer: null
};

function generateNewChallenge() {
  if (Math.random() < 0.5) {
    // Reto de números para Diego Jr. (1 al 5)
    const targetNum = Math.floor(Math.random() * 5) + 1;
    activeDidacticChallenge = {
      id: 'number',
      target: targetNum,
      prompt: `¡Diego Jr., busca y come el número ${targetNum}!`,
      mathQuestion: null,
      mathAnswer: null
    };
  } else {
    // Reto de matemáticas para Vicky (10 años)
    const a = Math.floor(Math.random() * 6) + 2;
    const b = Math.floor(Math.random() * 5) + 2;
    const ans = a + b;
    activeDidacticChallenge = {
      id: 'math',
      target: ans,
      prompt: `¡Pregunta para Vicky! ¿Cuánto es ${a} + ${b}? ¡Come el ${ans}!`,
      mathQuestion: `${a} + ${b} = ?`,
      mathAnswer: ans
    };
  }
  io.emit('challenge_updated', activeDidacticChallenge);
}

// Iniciar alimentos iniciales
spawnInitialFood(95);

// Cambiar reto cada 45 segundos o cuando se complete
setInterval(() => {
  generateNewChallenge();
}, 45000);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    game: 'Arena Come-Frutas y Burbujas Familiar',
    onlinePlayers: Object.keys(connectedPlayers).length,
    foodCount: foodItems.length
  });
});

io.on('connection', (socket) => {
  console.log(`⚡ Conectado: ${socket.id}`);

  socket.on('join_game', async (data) => {
    const characterId = data.characterId || 'diegoaz_jr';
    const playerDb = await db.getPlayer(characterId);

    // Ajuste de colores y roles
    let defaultColor = '#facc15'; // Amarillo para Diego Jr.
    let defaultSecondary = '#38bdf8';
    let displayName = 'Diegoaz Jr.';
    let roleTitle = 'Pequeño Glotón (4 años)';

    if (characterId === 'vicky_vicky') {
      defaultColor = '#f43f5e'; // Rosa brillante para Vicky
      defaultSecondary = '#06b6d4';
      displayName = 'Vicky Vicky';
      roleTitle = 'Cazadora de Frutas (10 años)';
    } else if (characterId === 'diegoaz') {
      defaultColor = '#10b981'; // Verde esmeralda para Papá
      defaultSecondary = '#f59e0b';
      displayName = 'Diegoaz (Papá)';
      roleTitle = 'Guía de la Familia';
    }

    if (playerDb) {
      displayName = playerDb.display_name || displayName;
      roleTitle = playerDb.role_title || roleTitle;
    }

    const playerData = {
      socketId: socket.id,
      id: characterId,
      name: displayName,
      role: roleTitle,
      coins: playerDb ? playerDb.coins : 100,
      color: defaultColor,
      secondaryColor: defaultSecondary,
      x: ARENA_WIDTH / 2 + (Math.random() - 0.5) * 400,
      y: ARENA_HEIGHT / 2 + (Math.random() - 0.5) * 400,
      size: 48, // radio inicial
      score: 0,
      angle: 0,
      mouthOpen: 0
    };

    connectedPlayers[socket.id] = playerData;

    socket.emit('init_state', {
      self: playerData,
      players: connectedPlayers,
      foods: foodItems,
      challenge: activeDidacticChallenge,
      arena: { width: ARENA_WIDTH, height: ARENA_HEIGHT }
    });

    socket.broadcast.emit('player_joined', playerData);
    console.log(`🍓 [ARENA] ${playerData.name} entró a la arena come-frutas.`);
  });

  // Movimiento fluido del jugador
  socket.on('player_move', (m) => {
    const p = connectedPlayers[socket.id];
    if (p) {
      p.x = m.x;
      p.y = m.y;
      p.angle = m.angle || 0;
      p.mouthOpen = m.mouthOpen || 0;

      socket.broadcast.emit('player_moved', {
        socketId: socket.id,
        id: p.id,
        name: p.name,
        color: p.color,
        x: p.x,
        y: p.y,
        size: p.size,
        angle: p.angle,
        mouthOpen: p.mouthOpen,
        score: p.score
      });
    }
  });

  // Comer fruta / burbuja
  socket.on('eat_food', async (foodId) => {
    const p = connectedPlayers[socket.id];
    const fIndex = foodItems.findIndex(f => f.id === foodId);
    if (p && fIndex !== -1) {
      const food = foodItems[fIndex];
      foodItems.splice(fIndex, 1);

      p.score += food.points;
      // Crecimiento suave
      if (p.size < 95) {
        p.size += 0.35;
      }
      p.coins += 1;

      // Recompensa en DB
      await db.updatePlayerCoins(p.id, p.coins);

      // Comprobar si completó el reto didáctico activo
      let completedChallenge = false;
      if (food.isNumber && food.numberVal === activeDidacticChallenge.target) {
        completedChallenge = true;
        p.score += 50;
        p.coins += 15;
        await db.updatePlayerCoins(p.id, p.coins);
      }

      // Notificar a todos que la fruta fue comida
      io.emit('food_eaten', {
        foodId: food.id,
        eaterSocketId: socket.id,
        eaterId: p.id,
        eaterName: p.name,
        eaterSize: p.size,
        eaterScore: p.score,
        eaterCoins: p.coins,
        completedChallenge: completedChallenge,
        challengeTarget: activeDidacticChallenge.target
      });

      // Si completó el reto, generar uno nuevo inmediatamente
      if (completedChallenge) {
        setTimeout(generateNewChallenge, 2500);
      }

      // Reponer fruta nueva para mantener la arena llena
      const newFood = spawnSingleFood();
      io.emit('new_food_spawned', newFood);
    }
  });

  // Rebote amistoso entre jugadores
  socket.on('player_bump', (bumpData) => {
    socket.broadcast.emit('players_bumped', {
      p1: socket.id,
      p2: bumpData.targetSocketId,
      x: bumpData.x,
      y: bumpData.y
    });
  });

  // Reacciones de emojis
  socket.on('send_reaction', (emoji) => {
    const p = connectedPlayers[socket.id];
    if (p && emoji) {
      io.emit('reaction_received', {
        socketId: socket.id,
        name: p.name,
        emoji: emoji
      });
    }
  });

  socket.on('disconnect', () => {
    const p = connectedPlayers[socket.id];
    if (p) {
      console.log(`👋 [ARENA] ${p.name} salió.`);
      delete connectedPlayers[socket.id];
      io.emit('player_left', { socketId: socket.id, id: p.id, name: p.name });
    }
  });
});

async function start() {
  await db.initDatabase();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🍓 SERVIDOR ARENA COME-FRUTAS FAMILIAR ACTIVO EN PUERTO ${PORT}`);
  });
}

start();
