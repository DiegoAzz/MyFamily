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

// Estado de la partida multijugador sincronizada
const connectedPlayers = {};
const raceSession = {
  trackSeed: 421337,
  startTime: Date.now()
};

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    game: 'Geometry Family: Neon Dash',
    onlinePlayers: Object.keys(connectedPlayers).length
  });
});

io.on('connection', (socket) => {
  console.log(`⚡ Conectado: ${socket.id}`);

  socket.on('join_game', async (data) => {
    const characterId = data.characterId || 'diegoaz_jr';
    const playerDb = await db.getPlayer(characterId);

    // Configuración neón de cada personaje de la familia
    let defaultColor = '#facc15'; // Diego Jr: Amarillo Dorado brillante
    let defaultSecondary = '#38bdf8';
    let defaultFace = 'smile_demon';
    let displayName = 'Diegoaz Jr.';
    let roleTitle = 'Cadete Espacial (4 años)';

    if (characterId === 'vicky_vicky') {
      defaultColor = '#f43f5e'; // Vicky: Rosa Neón / Magenta
      defaultSecondary = '#06b6d4';
      defaultFace = 'cat_cute';
      displayName = 'Vicky Vicky';
      roleTitle = 'Científica Neón (10 años)';
    } else if (characterId === 'diegoaz') {
      defaultColor = '#10b981'; // Papá: Verde Neón / Cyber Esmeralda
      defaultSecondary = '#f59e0b';
      defaultFace = 'glasses_pro';
      displayName = 'Diegoaz (Papá)';
      roleTitle = 'Guía & Piloto Mayor';
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
      color: data.color || defaultColor,
      secondaryColor: defaultSecondary,
      face: defaultFace,
      distance: 0,
      y: 0,
      vy: 0,
      rot: 0,
      mode: 'cube', // 'cube' o 'ship'
      isAlive: true,
      score: 0,
      speed: 8.5
    };

    connectedPlayers[socket.id] = playerData;

    socket.emit('init_state', {
      self: playerData,
      players: connectedPlayers,
      raceSession: raceSession
    });

    socket.broadcast.emit('player_joined', playerData);
    console.log(`🚀 [GEOMETRY] ${playerData.name} entró a la carrera.`);
  });

  // Sincronización en tiempo real de posición y físicas del corredor
  socket.on('player_progress', (pData) => {
    const player = connectedPlayers[socket.id];
    if (player) {
      player.distance = pData.distance || 0;
      player.y = pData.y || 0;
      player.vy = pData.vy || 0;
      player.rot = pData.rot || 0;
      player.mode = pData.mode || player.mode;
      player.isAlive = pData.isAlive !== undefined ? pData.isAlive : true;
      player.score = pData.score || player.score;
      player.speed = pData.speed || player.speed;

      socket.broadcast.emit('player_updated', {
        socketId: socket.id,
        id: player.id,
        name: player.name,
        color: player.color,
        distance: player.distance,
        y: player.y,
        vy: player.vy,
        rot: player.rot,
        mode: player.mode,
        isAlive: player.isAlive,
        score: player.score
      });
    }
  });

  // Salto o activación de orbe para efectos visuales sincronizados
  socket.on('player_action', (actionData) => {
    const player = connectedPlayers[socket.id];
    if (player) {
      socket.broadcast.emit('player_action_fx', {
        socketId: socket.id,
        id: player.id,
        type: actionData.type || 'jump', // 'jump', 'orb', 'portal', 'gate_clear'
        x: actionData.x,
        y: actionData.y,
        color: player.color
      });
    }
  });

  // Reacciones rápidas de emojis en pantalla
  socket.on('send_reaction', (emoji) => {
    const player = connectedPlayers[socket.id];
    if (player && emoji) {
      io.emit('reaction_received', {
        socketId: socket.id,
        id: player.id,
        name: player.name,
        emoji: emoji
      });
    }
  });

  // Guardar monedas educativas acumuladas
  socket.on('save_reward', async (data) => {
    const player = connectedPlayers[socket.id];
    if (player && data && data.coins) {
      player.coins += data.coins;
      await db.updatePlayerCoins(player.id, player.coins);
      socket.emit('coins_saved', { coins: player.coins });
    }
  });

  socket.on('disconnect', () => {
    const player = connectedPlayers[socket.id];
    if (player) {
      console.log(`👋 [SALIDA] ${player.name} abandonó la carrera.`);
      delete connectedPlayers[socket.id];
      io.emit('player_left', { socketId: socket.id, id: player.id, name: player.name });
    }
  });
});

async function start() {
  await db.initDatabase();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ SERVIDOR GEOMETRY DASH FAMILY ACTIVO EN PUERTO ${PORT}`);
  });
}

start();
