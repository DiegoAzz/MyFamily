const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { titles, categories, profiles, notifications } = require('./mockData');

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

// 1. Título Destacado para el Hero Billboard Principal
app.get('/api/featured', (req, res) => {
  const featured = titles.find(t => t.id === 'stranger-codes') || titles[0];
  res.json({ featured });
});

// 2. Filas de Categorías con títulos ordenados
app.get('/api/categories', (req, res) => {
  const isKids = req.query.kids === 'true';

  const rows = categories
    .filter(cat => {
      if (isKids) return cat.id === 'kids-family';
      return true;
    })
    .map(cat => {
      let filteredTitles = titles.filter(cat.filter);

      // Si es Top 10, ordenar por ranking numérico 1..10
      if (cat.isTop10Layout) {
        filteredTitles = filteredTitles.sort((a, b) => (a.isTop10 || 99) - (b.isTop10 || 99));
      }

      return {
        id: cat.id,
        title: cat.title,
        showProgress: !!cat.showProgress,
        isTop10Layout: !!cat.isTop10Layout,
        isTall: !!cat.isTall,
        titles: filteredTitles
      };
    });

  res.json({ categories: rows });
});

// 3. Catálogo general con filtros (Series, Películas, Novedades, Kids, Búsqueda)
app.get('/api/titles', (req, res) => {
  const { type, isKids, search, genre } = req.query;
  let result = [...titles];

  if (isKids === 'true') {
    result = result.filter(t => t.isKids);
  }

  if (type === 'series' || type === 'movie') {
    result = result.filter(t => t.type === type);
  }

  if (genre) {
    result = result.filter(t => t.genres.some(g => g.toLowerCase() === genre.toLowerCase()));
  }

  if (search) {
    const q = search.toLowerCase().trim();
    result = result.filter(t => 
      t.title.toLowerCase().includes(q) ||
      t.originalTitle.toLowerCase().includes(q) ||
      t.synopsis.toLowerCase().includes(q) ||
      t.genres.some(g => g.toLowerCase().includes(q)) ||
      (t.cast && t.cast.some(c => c.toLowerCase().includes(q)))
    );
  }

  res.json({ count: result.length, titles: result });
});

// 4. Detalle individual de título + títulos similares recomendados
app.get('/api/title/:id', (req, res) => {
  const item = titles.find(t => t.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Título no encontrado' });
  }

  // Títulos similares basados en géneros compartidos
  const similar = titles
    .filter(t => t.id !== item.id && t.genres.some(g => item.genres.includes(g)))
    .slice(0, 6);

  res.json({ title: item, similar });
});

// 5. Notificaciones de estrenos
app.get('/api/notifications', (req, res) => {
  res.json({ notifications });
});

// 6. Perfiles de usuario disponibles
app.get('/api/profiles', (req, res) => {
  res.json({ profiles });
});

// Socket.io para visualización en tiempo real (usuarios en línea, watch activity)
let viewersOnline = 14;

io.on('connection', (socket) => {
  viewersOnline++;
  io.emit('online_count', { viewers: viewersOnline });

  socket.on('watch_title', (data) => {
    // Transmitir actividad social a la plataforma
    socket.broadcast.emit('user_watching', {
      user: data.user || 'Alguien',
      title: data.title
    });
  });

  socket.on('disconnect', () => {
    viewersOnline = Math.max(1, viewersOnline - 1);
    io.emit('online_count', { viewers: viewersOnline });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🍿 [AZFLIX / NETFLIX PROTOTYPE] Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 URL Local: http://localhost:${PORT}`);
});
