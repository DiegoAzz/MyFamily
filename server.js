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

// Helper para obtener IP real detrás de proxys (Coolify / Traefik / Nginx)
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.socket.remoteAddress ||
         '127.0.0.1';
}

// 1. Identificación automática instantánea por UID / IP (sin login)
app.post('/api/player/auth', async (req, res) => {
  try {
    const { uid, alias } = req.body;
    if (!uid) return res.status(400).json({ error: 'UID requerido' });

    const ip = getClientIp(req);
    const defaultAlias = alias || `Jugador_${Math.floor(1000 + Math.random() * 9000)}`;

    const player = await db.getOrCreatePlayer(uid, ip, defaultAlias);
    const tournament = await db.getTournament();
    const leaderboard = await db.getLeaderboard(20);
    const myRank = await db.getPlayerRank(uid);

    res.json({
      player,
      tournament,
      leaderboard,
      myRank
    });
  } catch (err) {
    console.error('Error en /api/player/auth:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 2. Cambiar apodo/alias para la tabla de posiciones
app.post('/api/player/set-alias', async (req, res) => {
  try {
    const { uid, alias } = req.body;
    if (!uid || !alias) return res.status(400).json({ error: 'UID y Alias requeridos' });

    const updated = await db.updatePlayerAlias(uid, alias);
    const leaderboard = await db.getLeaderboard(20);

    // Notificar a todos por Socket.io que se actualizó el ranking
    io.emit('leaderboard_updated', leaderboard);

    res.json({ player: updated, leaderboard });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando alias' });
  }
});

// 3. Enviar puntuación al terminar la partida
app.post('/api/game/submit-score', async (req, res) => {
  try {
    const { uid, score } = req.body;
    if (!uid || score === undefined) return res.status(400).json({ error: 'Datos inválidos' });

    const result = await db.submitScore(uid, score);
    const leaderboard = await db.getLeaderboard(20);
    const myRank = await db.getPlayerRank(uid);

    // Si es un puntaje alto en el top, emitir actualización
    io.emit('leaderboard_updated', leaderboard);

    res.json({ result, leaderboard, myRank });
  } catch (err) {
    res.status(500).json({ error: 'Error guardando puntuación' });
  }
});

// 4. Obtener tabla de clasificación
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await db.getLeaderboard(50);
    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: 'Error cargando ranking' });
  }
});

// 5. Obtener datos del Torneo
app.get('/api/tournament', async (req, res) => {
  try {
    const tournament = await db.getTournament();
    res.json({ tournament });
  } catch (err) {
    res.status(500).json({ error: 'Error cargando torneo' });
  }
});

// 6. Panel de Administración (PIN de seguridad)
app.post('/api/admin/verify', async (req, res) => {
  try {
    const { pin } = req.body;
    const isValid = await db.verifyAdminPin(pin);
    if (!isValid) return res.status(401).json({ error: 'PIN incorrecto' });

    const tournament = await db.getTournament();
    res.json({ success: true, tournament });
  } catch (err) {
    res.status(500).json({ error: 'Error de verificación' });
  }
});

app.post('/api/admin/update-tournament', async (req, res) => {
  try {
    const { pin, title, prizeText, endTime, active } = req.body;
    const isValid = await db.verifyAdminPin(pin);
    if (!isValid) return res.status(401).json({ error: 'PIN incorrecto' });

    const updatedTournament = await db.updateTournament(title, prizeText, endTime, active);
    io.emit('tournament_updated', updatedTournament);

    res.json({ success: true, tournament: updatedTournament });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando torneo' });
  }
});

app.post('/api/admin/reset-tournament', async (req, res) => {
  try {
    const { pin } = req.body;
    const isValid = await db.verifyAdminPin(pin);
    if (!isValid) return res.status(401).json({ error: 'PIN incorrecto' });

    await db.resetTournamentScores();
    const leaderboard = await db.getLeaderboard(20);
    io.emit('leaderboard_updated', leaderboard);

    res.json({ success: true, message: 'Torneo reiniciado con éxito' });
  } catch (err) {
    res.status(500).json({ error: 'Error reiniciando torneo' });
  }
});

// ==========================================
// SOCKET.IO PARA JUGADORES EN LÍNEA Y NOTIFICACIONES
// ==========================================
let onlineCount = 0;

io.on('connection', (socket) => {
  onlineCount++;
  io.emit('online_count', onlineCount);

  // Cuando un jugador fusiona una Sandía Gigante o hace un combo épico
  socket.on('huge_merge', (data) => {
    io.emit('announcement', {
      alias: data.alias || 'Un jugador',
      fruit: data.fruit || '🍉 Sandía',
      score: data.score
    });
  });

  socket.on('disconnect', () => {
    onlineCount = Math.max(0, onlineCount - 1);
    io.emit('online_count', onlineCount);
  });
});

async function start() {
  await db.initDatabase();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🍉 SERVIDOR DE TORNEO SUIKA MERGE ACTIVO EN PUERTO ${PORT}`);
  });
}

start();
