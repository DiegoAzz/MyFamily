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

// Estado de jugadores conectados en memoria
const connectedPlayers = {};

// Estado global de la pelota de fútbol sincronizada
let sharedSoccerBall = {
  x: 650,
  y: 780,
  vx: 0,
  vy: 0
};

io.on('connection', (socket) => {
  console.log(`⚡ Conectado cliente: ${socket.id}`);

  socket.on('join_game', async (data) => {
    const characterId = data.characterId || 'diegoaz';
    const playerDb = await db.getPlayer(characterId);

    const playerData = {
      socketId: socket.id,
      id: characterId,
      name: playerDb ? playerDb.display_name : data.name || 'Familiar',
      role: playerDb ? playerDb.role_title : 'Familia Az',
      coins: playerDb ? playerDb.coins : 100,
      scene: data.scene || 'calle', // 'calle' o 'casa'
      x: 350 + Math.random() * 80,
      y: 350 + Math.random() * 60,
      direction: 'down',
      isMoving: false
    };

    connectedPlayers[socket.id] = playerData;

    // Enviar estado a quien entra
    socket.emit('init_state', {
      self: playerData,
      players: connectedPlayers,
      ball: sharedSoccerBall
    });

    // Notificar inmediatamente a TODOS los demás jugadores
    socket.broadcast.emit('player_joined', playerData);
    console.log(`🎮 [UNIÓN] ${playerData.name} (${socket.id}) en escena ${playerData.scene}. Total conectados: ${Object.keys(connectedPlayers).length}`);
  });

  // Movimiento en tiempo real con sincronización de escena
  socket.on('player_move', (moveData) => {
    const player = connectedPlayers[socket.id];
    if (player) {
      player.x = moveData.x;
      player.y = moveData.y;
      player.direction = moveData.direction || player.direction;
      player.scene = moveData.scene || player.scene || 'calle';
      player.isMoving = moveData.isMoving || false;

      // Broadcast a todos los demás
      socket.broadcast.emit('player_moved', {
        socketId: socket.id,
        id: player.id,
        name: player.name,
        x: player.x,
        y: player.y,
        direction: player.direction,
        scene: player.scene,
        isMoving: player.isMoving
      });
    }
  });

  // Cambio de escena (entrar o salir de la casa)
  socket.on('change_scene', (newScene) => {
    const player = connectedPlayers[socket.id];
    if (player) {
      player.scene = newScene;
      io.emit('player_changed_scene', {
        socketId: socket.id,
        name: player.name,
        scene: newScene
      });
    }
  });

  // Pelota de fútbol compartida (cuando alguien la patea)
  socket.on('kick_ball', (ballData) => {
    sharedSoccerBall.x = ballData.x;
    sharedSoccerBall.y = ballData.y;
    sharedSoccerBall.vx = ballData.vx;
    sharedSoccerBall.vy = ballData.vy;
    socket.broadcast.emit('ball_updated', sharedSoccerBall);
  });

  // Chat / Reacciones
  socket.on('send_chat', (text) => {
    const player = connectedPlayers[socket.id];
    if (player && text) {
      io.emit('chat_received', {
        socketId: socket.id,
        senderId: player.id,
        senderName: player.name,
        scene: player.scene || 'calle',
        text: text.trim().slice(0, 70)
      });
    }
  });

  // Desconexión
  socket.on('disconnect', () => {
    const player = connectedPlayers[socket.id];
    if (player) {
      console.log(`👋 [SALIDA] ${player.name} (${socket.id}) desconectado.`);
      delete connectedPlayers[socket.id];
      io.emit('player_left', { socketId: socket.id, id: player.id, name: player.name });
    }
  });
});

async function start() {
  await db.initDatabase();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`🚀 SERVIDOR MULTIJUGADOR BARRIO AZ ACTIVO`);
    console.log(`👉 Puerto: ${PORT} (0.0.0.0)`);
    console.log(`===============================================`);
  });
}

start();
