const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

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

// Guardar récords alegres de Diego Jr
let gameStats = {
  bestStars: 100,
  bestDistance: 450,
  totalRuns: 1,
  currentSuit: 'super_diego'
};

// 1. Obtener estado del juego
app.get('/api/stats', (req, res) => {
  res.json(gameStats);
});

// 2. Guardar récord al terminar la vuelta mágica
app.post('/api/stats', (req, res) => {
  const { stars, distance, suit } = req.body;
  if (stars && stars > gameStats.bestStars) gameStats.bestStars = stars;
  if (distance && distance > gameStats.bestDistance) gameStats.bestDistance = distance;
  if (suit) gameStats.currentSuit = suit;
  gameStats.totalRuns++;

  // Emitir fiesta a todos los dispositivos conectados
  io.emit('record_celebration', {
    stars: gameStats.bestStars,
    distance: gameStats.bestDistance
  });

  res.json({ success: true, stats: gameStats });
});

// Socket.io: Los papás pueden enviar aplausos y corazones a Diego Jr mientras juega en la tablet
io.on('connection', (socket) => {
  socket.on('cheer_diego', (data) => {
    // Reenviar a la tablet de Diego Jr
    socket.broadcast.emit('family_cheer', {
      from: data.from || 'Papá Diego',
      emoji: data.emoji || '❤️',
      message: data.message || '¡Bravo Diego Jr!'
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌟 [SUPER DIEGO JR: RUNNER] Servidor corriendo en http://localhost:${PORT}`);
});
