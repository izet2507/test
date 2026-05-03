const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT DEFAULT '',
    description TEXT DEFAULT '',
    yield_amount REAL,
    yield_unit TEXT DEFAULT 'кг',
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    material_name TEXT NOT NULL,
    amount REAL,
    unit TEXT DEFAULT 'кг',
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS recipe_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    duration_min INTEGER,
    temperature REAL,
    temperature_unit TEXT DEFAULT '°C'
  );

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT DEFAULT '',
    supplier TEXT DEFAULT '',
    standard TEXT DEFAULT '',
    description TEXT DEFAULT '',
    storage_conditions TEXT DEFAULT '',
    shelf_life TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS material_parameters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    parameter_name TEXT NOT NULL,
    value TEXT DEFAULT '',
    unit TEXT DEFAULT '',
    norm TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    mime_type TEXT DEFAULT '',
    size INTEGER DEFAULT 0,
    category TEXT DEFAULT 'Общее',
    description TEXT DEFAULT '',
    linked_recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
    linked_material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;
