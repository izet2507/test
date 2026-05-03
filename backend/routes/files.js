const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.get('/', (req, res) => {
  const { search, category } = req.query;
  let sql = `
    SELECT f.*,
      r.name as recipe_name,
      m.name as material_name
    FROM files f
    LEFT JOIN recipes r ON f.linked_recipe_id = r.id
    LEFT JOIN materials m ON f.linked_material_id = m.id
  `;
  const params = [];
  const conditions = [];
  if (search) {
    conditions.push("(f.original_name LIKE ? OR f.description LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    conditions.push("f.category = ?");
    params.push(category);
  }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY f.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.get('/categories', (req, res) => {
  const rows = db.prepare("SELECT DISTINCT category FROM files WHERE category != '' ORDER BY category").all();
  res.json(rows.map(r => r.category));
});

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
  const { category, description, linked_recipe_id, linked_material_id } = req.body;

  const { lastInsertRowid } = db.prepare(
    'INSERT INTO files (original_name, stored_name, mime_type, size, category, description, linked_recipe_id, linked_material_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    req.file.originalname,
    req.file.filename,
    req.file.mimetype,
    req.file.size,
    category || 'Общее',
    description || '',
    linked_recipe_id ? parseInt(linked_recipe_id) : null,
    linked_material_id ? parseInt(linked_material_id) : null
  );

  res.status(201).json({ id: lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { category, description, linked_recipe_id, linked_material_id } = req.body;
  const id = req.params.id;
  if (!db.prepare('SELECT id FROM files WHERE id = ?').get(id)) return res.status(404).json({ error: 'Не найдено' });

  db.prepare('UPDATE files SET category=?, description=?, linked_recipe_id=?, linked_material_id=? WHERE id=?')
    .run(
      category || 'Общее',
      description || '',
      linked_recipe_id ? parseInt(linked_recipe_id) : null,
      linked_material_id ? parseInt(linked_material_id) : null,
      id
    );

  res.json({ ok: true });
});

router.get('/download/:id', (req, res) => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  if (!file) return res.status(404).json({ error: 'Не найдено' });
  const filePath = path.join(UPLOADS_DIR, file.stored_name);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Файл не найден на диске' });
  res.download(filePath, file.original_name);
});

router.delete('/:id', (req, res) => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  if (!file) return res.status(404).json({ error: 'Не найдено' });
  const filePath = path.join(UPLOADS_DIR, file.stored_name);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  db.prepare('DELETE FROM files WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
