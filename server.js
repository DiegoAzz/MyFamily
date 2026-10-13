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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', onlinePlayers: Object.keys(connectedPlayers).length });
});

const connectedPlayers = {};

let sharedSoccerBall = {
  x: 600,
  y: 1250,
  vx: 0,
  vy: 0
};

io.on('connection', (socket) => {
  console.log(`⚡ Conectado: ${socket.id}`);

  socket.on('join_game', async (data) => {
    const characterId = data.characterId || 'diegoaz_jr';
    const playerDb = await db.getPlayer(characterId);

    // Spawn central en la Plaza de la Fuente (1100, 780)
    const playerData = {
      socketId: socket.id,
      id: characterId,
      name: playerDb ? playerDb.display_name : (characterId === 'diegoaz' ? 'Diegoaz (Papá)' : (characterId === 'vicky_vicky' ? 'Vicky Vicky' : 'Diegoaz Jr.')),
      role: playerDb ? playerDb.role_title : 'Familia Az',
      coins: playerDb ? playerDb.coins : 100,
      x: 1100 + (Math.random() - 0.5) * 60,
      y: 780 + (Math.random() - 0.5) * 60,
      direction: 'down',
      isMoving: false
    };

    connectedPlayers[socket.id] = playerData;

    socket.emit('init_state', {
      self: playerData,
      players: connectedPlayers,
      ball: sharedSoccerBall
    });

    socket.broadcast.emit('player_joined', playerData);
    console.log(`🎮 [UNIÓN] ${playerData.name} se unió en la Plaza Central.`);
  });

  socket.on('player_move', (moveData) => {
    const player = connectedPlayers[socket.id];
    if (player) {
      player.x = moveData.x;
      player.y = moveData.y;
      player.direction = moveData.direction || player.direction;
      player.isMoving = moveData.isMoving || false;

      socket.broadcast.emit('player_moved', {
        socketId: socket.id,
        id: player.id,
        name: player.name,
        x: player.x,
        y: player.y,
        direction: player.direction,
        isMoving: player.isMoving
      });
    }
  });

  socket.on('kick_ball', (ballData) => {
    sharedSoccerBall.x = ballData.x;
    sharedSoccerBall.y = ballData.y;
    sharedSoccerBall.vx = ballData.vx;
    sharedSoccerBall.vy = ballData.vy;
    socket.broadcast.emit('ball_updated', sharedSoccerBall);
  });

  socket.on('send_chat', (text) => {
    const player = connectedPlayers[socket.id];
    if (player && text) {
      io.emit('chat_received', {
        socketId: socket.id,
        senderId: player.id,
        senderName: player.name,
        text: text.trim().slice(0, 60)
      });
    }
  });

  socket.on('disconnect', () => {
    const player = connectedPlayers[socket.id];
    if (player) {
      console.log(`👋 [SALIDA] ${player.name} desconectado.`);
      delete connectedPlayers[socket.id];
      io.emit('player_left', { socketId: socket.id, id: player.id, name: player.name });
    }
  });
});

async function start() {
  await db.initDatabase();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SERVIDOR BARRIO AZ ACTIVO EN PUERTO ${PORT}`);
  });
}

start();
