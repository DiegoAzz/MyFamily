const fs = require('fs');
const path = require('path');

// Determinamos si usamos PostgreSQL (ej. Coolify Postgres) o SQLite local
const databaseUrl = process.env.DATABASE_URL;
let db = null;
let isPostgres = false;

if (databaseUrl && databaseUrl.startsWith('postgres')) {
  console.log('🔗 Conectando a Base de Datos PostgreSQL...');
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: databaseUrl });
  isPostgres = true;
  db = pool;
} else {
  console.log('💾 Usando Base de Datos SQLite persistente...');
  const { DatabaseSync } = require('node:sqlite');
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, 'myfamily.db');
  db = new DatabaseSync(dbPath);
}

// Inicialización de Tablas para el Concurso y Ranking
async function initDatabase() {
  if (isPostgres) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS contest_players (
        id SERIAL PRIMARY KEY,
        player_uid VARCHAR(100) UNIQUE NOT NULL,
        alias VARCHAR(60) NOT NULL,
        ip_address VARCHAR(60),
        best_score INT DEFAULT 0,
        tournament_score INT DEFAULT 0,
        games_played INT DEFAULT 0,
        coins INT DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tournaments (
        id INT PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        prize_text VARCHAR(200) NOT NULL,
        end_time TIMESTAMP NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS admin_config (
        id INT PRIMARY KEY,
        admin_pin VARCHAR(50) DEFAULT 'admin123'
      );
    `);

    // Sembrar Torneo por defecto si no existe
    const tRes = await db.query('SELECT COUNT(*) FROM tournaments WHERE id = 1');
    if (parseInt(tRes.rows[0].count) === 0) {
      const defaultEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
      await db.query(`
        INSERT INTO tournaments (id, title, prize_text, end_time, active)
        VALUES (1, '🏆 Gran Torneo de Lanzamiento', '¡Premio Especial en Efectivo para el Puesto #1!', $1, TRUE);
      `, [defaultEnd.toISOString()]);
    }

    const aRes = await db.query('SELECT COUNT(*) FROM admin_config WHERE id = 1');
    if (parseInt(aRes.rows[0].count) === 0) {
      await db.query(`
        INSERT INTO admin_config (id, admin_pin)
        VALUES (1, 'admin123');
      `);
    }

  } else {
    // Modo SQLite persistente
    db.exec(`
      CREATE TABLE IF NOT EXISTS contest_players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_uid TEXT UNIQUE NOT NULL,
        alias TEXT NOT NULL,
        ip_address TEXT,
        best_score INTEGER DEFAULT 0,
        tournament_score INTEGER DEFAULT 0,
        games_played INTEGER DEFAULT 0,
        coins INTEGER DEFAULT 100,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tournaments (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        title TEXT NOT NULL,
        prize_text TEXT NOT NULL,
        end_time TEXT NOT NULL,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS admin_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        admin_pin TEXT DEFAULT 'admin123'
      );
    `);

    const tRow = db.prepare('SELECT COUNT(*) as cnt FROM tournaments WHERE id = 1').get();
    if (tRow.cnt === 0) {
      const defaultEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      db.prepare(`
        INSERT INTO tournaments (id, title, prize_text, end_time, active)
        VALUES (1, '🏆 Gran Torneo de Lanzamiento', '¡Premio Especial en Efectivo para el Puesto #1!', ?, 1)
      `).run(defaultEnd);
    }

    const aRow = db.prepare('SELECT COUNT(*) as cnt FROM admin_config WHERE id = 1').get();
    if (aRow.cnt === 0) {
      db.prepare(`
        INSERT INTO admin_config (id, admin_pin)
        VALUES (1, 'admin123')
      `).run();
    }
  }

  console.log('✅ Base de datos de Torneo y Jugadores inicializada.');
}

// 1. Obtener o crear jugador por su UID (sin registro ni login)
async function getOrCreatePlayer(uid, ip, defaultAlias) {
  if (isPostgres) {
    let res = await db.query('SELECT * FROM contest_players WHERE player_uid = $1', [uid]);
    if (res.rows.length === 0) {
      await db.query(`
        INSERT INTO contest_players (player_uid, alias, ip_address)
        VALUES ($1, $2, $3)
      `, [uid, defaultAlias, ip]);
      res = await db.query('SELECT * FROM contest_players WHERE player_uid = $1', [uid]);
    } else {
      // Actualizar IP y fecha
      await db.query(`
        UPDATE contest_players
        SET ip_address = $1, updated_at = CURRENT_TIMESTAMP
        WHERE player_uid = $2
      `, [ip, uid]);
    }
    return res.rows[0];
  } else {
    let player = db.prepare('SELECT * FROM contest_players WHERE player_uid = ?').get(uid);
    if (!player) {
      db.prepare(`
        INSERT INTO contest_players (player_uid, alias, ip_address)
        VALUES (?, ?, ?)
      `).run(uid, defaultAlias, ip);
      player = db.prepare('SELECT * FROM contest_players WHERE player_uid = ?').get(uid);
    } else {
      db.prepare(`
        UPDATE contest_players
        SET ip_address = ?, updated_at = CURRENT_TIMESTAMP
        WHERE player_uid = ?
      `).run(ip, uid);
    }
    return player;
  }
}

// 2. Cambiar apodo/alias del jugador
async function updatePlayerAlias(uid, newAlias) {
  const cleanAlias = (newAlias || '').trim().slice(0, 30);
  if (!cleanAlias) return null;

  if (isPostgres) {
    await db.query(`
      UPDATE contest_players
      SET alias = $1, updated_at = CURRENT_TIMESTAMP
      WHERE player_uid = $2
    `, [cleanAlias, uid]);
    const res = await db.query('SELECT * FROM contest_players WHERE player_uid = $1', [uid]);
    return res.rows[0];
  } else {
    db.prepare(`
      UPDATE contest_players
      SET alias = ?, updated_at = CURRENT_TIMESTAMP
      WHERE player_uid = ?
    `).run(cleanAlias, uid);
    return db.prepare('SELECT * FROM contest_players WHERE player_uid = ?').get(uid);
  }
}

// 3. Registrar puntuación al terminar la partida
async function submitScore(uid, score) {
  const numScore = parseInt(score) || 0;
  if (isPostgres) {
    const res = await db.query('SELECT * FROM contest_players WHERE player_uid = $1', [uid]);
    if (res.rows.length === 0) return null;
    const player = res.rows[0];

    const newBest = Math.max(player.best_score || 0, numScore);
    const newTournament = Math.max(player.tournament_score || 0, numScore);
    const coinsEarned = Math.floor(numScore / 100);

    await db.query(`
      UPDATE contest_players
      SET best_score = $1,
          tournament_score = $2,
          games_played = games_played + 1,
          coins = coins + $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE player_uid = $4
    `, [newBest, newTournament, coinsEarned, uid]);

    return {
      bestScore: newBest,
      tournamentScore: newTournament,
      coinsEarned: coinsEarned
    };
  } else {
    const player = db.prepare('SELECT * FROM contest_players WHERE player_uid = ?').get(uid);
    if (!player) return null;

    const newBest = Math.max(player.best_score || 0, numScore);
    const newTournament = Math.max(player.tournament_score || 0, numScore);
    const coinsEarned = Math.floor(numScore / 100);

    db.prepare(`
      UPDATE contest_players
      SET best_score = ?,
          tournament_score = ?,
          games_played = games_played + 1,
          coins = coins + ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE player_uid = ?
    `).run(newBest, newTournament, coinsEarned, uid);

    return {
      bestScore: newBest,
      tournamentScore: newTournament,
      coinsEarned: coinsEarned
    };
  }
}

// 4. Obtener tabla de clasificación (Leaderboard del Torneo)
async function getLeaderboard(limit = 50) {
  if (isPostgres) {
    const res = await db.query(`
      SELECT alias, tournament_score as score, best_score, games_played, updated_at
      FROM contest_players
      WHERE tournament_score > 0
      ORDER BY tournament_score DESC, updated_at ASC
      LIMIT $1
    `, [limit]);
    return res.rows;
  } else {
    return db.prepare(`
      SELECT alias, tournament_score as score, best_score, games_played, updated_at
      FROM contest_players
      WHERE tournament_score > 0
      ORDER BY tournament_score DESC, updated_at ASC
      LIMIT ?
    `).all(limit);
  }
}

// 5. Obtener puesto del jugador actual
async function getPlayerRank(uid) {
  if (isPostgres) {
    const res = await db.query('SELECT * FROM contest_players WHERE player_uid = $1', [uid]);
    if (res.rows.length === 0) return { rank: 0, score: 0 };
    const p = res.rows[0];
    if (p.tournament_score === 0) return { rank: 0, score: 0 };

    const countRes = await db.query(`
      SELECT COUNT(*) as rank
      FROM contest_players
      WHERE tournament_score > $1
    `, [p.tournament_score]);
    return {
      rank: parseInt(countRes.rows[0].rank) + 1,
      score: p.tournament_score,
      bestScore: p.best_score,
      alias: p.alias
    };
  } else {
    const p = db.prepare('SELECT * FROM contest_players WHERE player_uid = ?').get(uid);
    if (!p || p.tournament_score === 0) return { rank: 0, score: 0 };

    const rankRow = db.prepare(`
      SELECT COUNT(*) as cnt
      FROM contest_players
      WHERE tournament_score > ?
    `).get(p.tournament_score);
    return {
      rank: rankRow.cnt + 1,
      score: p.tournament_score,
      bestScore: p.best_score,
      alias: p.alias
    };
  }
}

// 6. Configuración del Torneo
async function getTournament() {
  if (isPostgres) {
    const res = await db.query('SELECT * FROM tournaments WHERE id = 1');
    return res.rows[0];
  } else {
    return db.prepare('SELECT * FROM tournaments WHERE id = 1').get();
  }
}

async function updateTournament(title, prizeText, endTimeIso, active = true) {
  if (isPostgres) {
    await db.query(`
      UPDATE tournaments
      SET title = $1, prize_text = $2, end_time = $3, active = $4
      WHERE id = 1
    `, [title, prizeText, endTimeIso, active]);
    const res = await db.query('SELECT * FROM tournaments WHERE id = 1');
    return res.rows[0];
  } else {
    db.prepare(`
      UPDATE tournaments
      SET title = ?, prize_text = ?, end_time = ?, active = ?
      WHERE id = 1
    `).run(title, prizeText, endTimeIso, active ? 1 : 0);
    return db.prepare('SELECT * FROM tournaments WHERE id = 1').get();
  }
}

// 7. Reiniciar puntajes del torneo (para empezar un nuevo concurso)
async function resetTournamentScores() {
  if (isPostgres) {
    await db.query('UPDATE contest_players SET tournament_score = 0');
  } else {
    db.prepare('UPDATE contest_players SET tournament_score = 0').run();
  }
}

// 8. Verificar PIN de Administrador
async function verifyAdminPin(pin) {
  if (isPostgres) {
    const res = await db.query('SELECT admin_pin FROM admin_config WHERE id = 1');
    return res.rows[0] && res.rows[0].admin_pin === pin;
  } else {
    const row = db.prepare('SELECT admin_pin FROM admin_config WHERE id = 1').get();
    return row && row.admin_pin === pin;
  }
}

// Compatibilidad con funciones anteriores
async function getPlayer(id) {
  return getOrCreatePlayer(id, '127.0.0.1', 'Jugador');
}
async function updatePlayerCoins(id, coins) {
  return submitScore(id, 0);
}

module.exports = {
  initDatabase,
  getOrCreatePlayer,
  updatePlayerAlias,
  submitScore,
  getLeaderboard,
  getPlayerRank,
  getTournament,
  updateTournament,
  resetTournamentScores,
  verifyAdminPin,
  getPlayer,
  updatePlayerCoins
};
