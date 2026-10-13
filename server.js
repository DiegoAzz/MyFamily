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

// Servir estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Endpoints REST de apoyo
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/missions', async (req, res) => {
  try {
    const missions = await db.getMissions();
    res.json(missions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/vault', async (req, res) => {
  try {
    const vault = await db.getFamilyVault();
    res.json(vault);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Estado de jugadores conectados en memoria
const connectedPlayers = {};

io.on('connection', (socket) => {
  console.log(`⚡ Conexión entrante: ${socket.id}`);

  // El jugador selecciona su personaje y entra al barrio
  socket.on('join_game', async (data) => {
    const characterId = data.characterId || 'diegoaz';
    const playerDb = await db.getPlayer(characterId);

    const playerData = {
      socketId: socket.id,
      id: characterId,
      name: playerDb ? playerDb.display_name : data.name || 'Aventurero',
      role: playerDb ? playerDb.role_title : 'Miembro de la Familia',
      coins: playerDb ? playerDb.coins : 100,
      vehicle: playerDb ? playerDb.vehicle : 'a_pie',
      x: playerDb ? playerDb.x : 400 + Math.random() * 50,
      y: playerDb ? playerDb.y : 350 + Math.random() * 50,
      direction: 'down',
      isMoving: false
    };

    connectedPlayers[socket.id] = playerData;

    // Notificar al jugador con el estado actual
    const missions = await db.getMissions();
    const vault = await db.getFamilyVault();

    socket.emit('init_state', {
      self: playerData,
      players: connectedPlayers,
      missions,
      vault
    });

    // Avisar al resto de la familia
    socket.broadcast.emit('player_joined', playerData);
    console.log(`🎮 ${playerData.name} (${playerData.id}) se ha unido al Barrio Az.`);
  });

  // Movimiento del personaje en tiempo real
  socket.on('player_move', (moveData) => {
    const player = connectedPlayers[socket.id];
    if (player) {
      player.x = moveData.x;
      player.y = moveData.y;
      player.direction = moveData.direction || player.direction;
      player.isMoving = moveData.isMoving || false;
      player.vehicle = moveData.vehicle || player.vehicle;

      // Broadcast rápido para sincronización suave
      socket.broadcast.emit('player_moved', {
        socketId: socket.id,
        id: player.id,
        x: player.x,
        y: player.y,
        direction: player.direction,
        isMoving: player.isMoving,
        vehicle: player.vehicle
      });
    }
  });

  // Mensaje en chat o burbuja de diálogo
  socket.on('send_chat', (messageText) => {
    const player = connectedPlayers[socket.id];
    if (player && messageText && messageText.trim().length > 0) {
      const chatItem = {
        socketId: socket.id,
        senderId: player.id,
        senderName: player.name,
        text: messageText.trim().slice(0, 100),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      io.emit('chat_received', chatItem);
    }
  });

  // Completar misión
  socket.on('complete_mission', async (missionId) => {
    const player = connectedPlayers[socket.id];
    if (player) {
      const updatedMission = await db.completeMission(missionId, player.id);
      if (updatedMission) {
        player.coins += updatedMission.reward_coins;
        const allMissions = await db.getMissions();
        io.emit('missions_updated', {
          missions: allMissions,
          completedBy: player.name,
          missionTitle: updatedMission.title,
          reward: updatedMission.reward_coins
        });
        io.emit('player_stats_updated', {
          socketId: socket.id,
          id: player.id,
          coins: player.coins
        });
      }
    }
  });

  // Cambiar vehículo (a pie, patineta, bicicleta)
  socket.on('change_vehicle', async (newVehicle) => {
    const player = connectedPlayers[socket.id];
    if (player) {
      player.vehicle = newVehicle;
      await db.updatePlayerState(player.id, player.x, player.y, player.coins, newVehicle);
      io.emit('player_vehicle_changed', {
        socketId: socket.id,
        id: player.id,
        vehicle: newVehicle
      });
    }
  });

  // Desconexión
  socket.on('disconnect', async () => {
    const player = connectedPlayers[socket.id];
    if (player) {
      console.log(`👋 ${player.name} salió del juego.`);
      await db.updatePlayerState(player.id, player.x, player.y, player.coins, player.vehicle);
      delete connectedPlayers[socket.id];
      socket.broadcast.emit('player_left', { socketId: socket.id, id: player.id });
    }
  });
});

// Guardado periódico en BD cada 30 segundos
setInterval(async () => {
  for (const socketId in connectedPlayers) {
    const p = connectedPlayers[socketId];
    if (p) {
      await db.updatePlayerState(p.id, p.x, p.y, p.coins, p.vehicle);
    }
  }
}, 30000);

// Arranque
async function startServer() {
  await db.initDatabase();
  server.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 El Barrio Az (MyFamily RPG) corriendo en:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`===============================================`);
  });
}

startServer();
