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

// Inicialización de Tablas
async function initDatabase() {
  if (isPostgres) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS players (
        id VARCHAR(50) PRIMARY KEY,
        display_name VARCHAR(100) NOT NULL,
        role_title VARCHAR(100) NOT NULL,
        coins INT DEFAULT 100,
        energy INT DEFAULT 100,
        vehicle VARCHAR(50) DEFAULT 'a_pie',
        x REAL DEFAULT 400,
        y REAL DEFAULT 350,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS family_vault (
        id INT PRIMARY KEY,
        family_coins INT DEFAULT 500,
        neighborhood_level INT DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS missions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'cooperativa',
        reward_coins INT DEFAULT 50,
        assigned_to VARCHAR(50) DEFAULT 'todos',
        status VARCHAR(50) DEFAULT 'disponible',
        created_by VARCHAR(50) DEFAULT 'diegoaz'
      );
    `);

    // Inserciones iniciales
    await db.query(`
      INSERT INTO family_vault (id, family_coins, neighborhood_level)
      VALUES (1, 500, 1)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Sembrar personajes
    const seedPlayers = [
      { id: 'diegoaz', name: 'Diegoaz (Papá)', role: 'Mentor & Arquitecto' },
      { id: 'diegoaz_jr', name: 'Diegoaz Jr. (Hijo)', role: 'Ingeniero & Tecnología' },
      { id: 'vicky_vicky', name: 'Vicky Vicky (Hija)', role: 'Diseñadora & Mascotas' }
    ];

    for (const p of seedPlayers) {
      await db.query(`
        INSERT INTO players (id, display_name, role_title)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO NOTHING;
      `, [p.id, p.name, p.role]);
    }

    // Sembrar misiones si no existen
    const mRes = await db.query('SELECT COUNT(*) FROM missions');
    if (parseInt(mRes.rows[0].count) === 0) {
      await db.query(`
        INSERT INTO missions (title, description, category, reward_coins, assigned_to) VALUES
        ('¡Bienvenidos al Barrio Az!', 'Explora la plaza, visita la casa familiar y prueba los controles.', 'cooperativa', 50, 'todos'),
        ('Recoger reciclaje del Parque', 'Encuentra las 3 botellas en la zona verde y llévalas al contenedor ecológico.', 'didactica', 100, 'vicky_vicky'),
        ('Reparar el semáforo inteligente', 'Acércate al semáforo de la avenida principal e inspecciona el circuito.', 'didactica', 100, 'diegoaz_jr'),
        ('Misión del Hogar: Ordenar la habitación', 'Completa tu tarea escolar o tu cuarto en la vida real para canjear tus monedas.', 'hogar', 200, 'todos');
      `);
    }

  } else {
    // Modo SQLite
    db.exec(`
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        role_title TEXT NOT NULL,
        coins INTEGER DEFAULT 100,
        energy INTEGER DEFAULT 100,
        vehicle TEXT DEFAULT 'a_pie',
        x REAL DEFAULT 400,
        y REAL DEFAULT 350,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS family_vault (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        family_coins INTEGER DEFAULT 500,
        neighborhood_level INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS missions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT DEFAULT 'cooperativa',
        reward_coins INTEGER DEFAULT 50,
        assigned_to TEXT DEFAULT 'todos',
        status TEXT DEFAULT 'disponible',
        created_by TEXT DEFAULT 'diegoaz'
      );
    `);

    // Insertar fondo familiar inicial
    db.exec(`INSERT OR IGNORE INTO family_vault (id, family_coins, neighborhood_level) VALUES (1, 500, 1);`);

    // Sembrar personajes
    const insertPlayer = db.prepare(`
      INSERT OR IGNORE INTO players (id, display_name, role_title)
      VALUES (?, ?, ?);
    `);
    insertPlayer.run('diegoaz', 'Diegoaz (Papá)', 'Mentor & Arquitecto');
    insertPlayer.run('diegoaz_jr', 'Diegoaz Jr. (Hijo)', 'Ingeniero & Tecnología');
    insertPlayer.run('vicky_vicky', 'Vicky Vicky (Hija)', 'Diseñadora & Mascotas');

    // Misiones iniciales
    const countMissions = db.prepare('SELECT COUNT(*) as total FROM missions').get();
    if (countMissions.total === 0) {
      const insertMission = db.prepare(`
        INSERT INTO missions (title, description, category, reward_coins, assigned_to)
        VALUES (?, ?, ?, ?, ?);
      `);
      insertMission.run('¡Bienvenidos al Barrio Az!', 'Explora la plaza, visita la casa familiar y prueba los controles.', 'cooperativa', 50, 'todos');
      insertMission.run('Recoger reciclaje del Parque', 'Encuentra las 3 botellas en la zona verde y llévalas al contenedor ecológico.', 'didactica', 100, 'vicky_vicky');
      insertMission.run('Reparar el semáforo inteligente', 'Acércate al semáforo de la avenida principal e inspecciona el circuito.', 'didactica', 100, 'diegoaz_jr');
      insertMission.run('Misión del Hogar: Ordenar la habitación', 'Completa tu tarea escolar o tu cuarto en la vida real para canjear tus monedas.', 'hogar', 200, 'todos');
    }
  }

  console.log('✅ Base de datos inicializada correctamente con tablas y datos iniciales.');
}

// Helpers unificados
async function getPlayer(id) {
  if (isPostgres) {
    const res = await db.query('SELECT * FROM players WHERE id = $1', [id]);
    return res.rows[0];
  } else {
    return db.prepare('SELECT * FROM players WHERE id = ?').get(id);
  }
}

async function updatePlayerState(id, x, y, coins, vehicle) {
  if (isPostgres) {
    await db.query(`
      UPDATE players
      SET x = $1, y = $2, coins = COALESCE($3, coins), vehicle = COALESCE($4, vehicle), last_seen = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [x, y, coins, vehicle, id]);
  } else {
    db.prepare(`
      UPDATE players
      SET x = ?, y = ?, coins = COALESCE(?, coins), vehicle = COALESCE(?, vehicle), last_seen = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(x, y, coins, vehicle, id);
  }
}

async function getMissions() {
  if (isPostgres) {
    const res = await db.query('SELECT * FROM missions ORDER BY id ASC');
    return res.rows;
  } else {
    return db.prepare('SELECT * FROM missions ORDER BY id ASC').all();
  }
}

async function completeMission(missionId, playerId) {
  if (isPostgres) {
    const mRes = await db.query('SELECT * FROM missions WHERE id = $1', [missionId]);
    if (mRes.rows.length === 0) return null;
    const mission = mRes.rows[0];
    await db.query('UPDATE missions SET status = $1 WHERE id = $2', ['completada', missionId]);
    await db.query('UPDATE players SET coins = coins + $1 WHERE id = $2', [mission.reward_coins, playerId]);
    return mission;
  } else {
    const mission = db.prepare('SELECT * FROM missions WHERE id = ?').get(missionId);
    if (!mission) return null;
    db.prepare('UPDATE missions SET status = ? WHERE id = ?').run('completada', missionId);
    db.prepare('UPDATE players SET coins = coins + ? WHERE id = ?').run(mission.reward_coins, playerId);
    return mission;
  }
}

async function getFamilyVault() {
  if (isPostgres) {
    const res = await db.query('SELECT * FROM family_vault WHERE id = 1');
    return res.rows[0];
  } else {
    return db.prepare('SELECT * FROM family_vault WHERE id = 1').get();
  }
}

module.exports = {
  initDatabase,
  getPlayer,
  updatePlayerState,
  getMissions,
  completeMission,
  getFamilyVault
};
