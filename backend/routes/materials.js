const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT * FROM materials';
  const params = [];
  if (search) {
    sql += ' WHERE (name LIKE ? OR code LIKE ? OR supplier LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY updated_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.get('/names', (req, res) => {
  res.json(db.prepare('SELECT id, name FROM materials ORDER BY name').all());
});

router.get('/:id', (req, res) => {
  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  if (!material) return res.status(404).json({ error: 'Не найдено' });
  material.parameters = db.prepare('SELECT * FROM material_parameters WHERE material_id = ? ORDER BY sort_order').all(req.params.id);
  material.files = db.prepare('SELECT * FROM files WHERE linked_material_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(material);
});

router.post('/', (req, res) => {
  const { name, code, supplier, standard, description, storage_conditions, shelf_life, parameters = [] } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });

  const result = db.transaction(() => {
    const { lastInsertRowid } = db.prepare(
      'INSERT INTO materials (name, code, supplier, standard, description, storage_conditions, shelf_life) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(name, code || '', supplier || '', standard || '', description || '', storage_conditions || '', shelf_life || '');

    const id = lastInsertRowid;
    const insertParam = db.prepare(
      'INSERT INTO material_parameters (material_id, parameter_name, value, unit, norm, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    );
    parameters.forEach((p, i) => insertParam.run(id, p.parameter_name, p.value || '', p.unit || '', p.norm || '', i));
    return id;
  })();

  res.status(201).json({ id: result });
});

router.put('/:id', (req, res) => {
  const { name, code, supplier, standard, description, storage_conditions, shelf_life, parameters = [] } = req.body;
  const id = req.params.id;
  if (!db.prepare('SELECT id FROM materials WHERE id = ?').get(id)) return res.status(404).json({ error: 'Не найдено' });

  db.transaction(() => {
    db.prepare(
      'UPDATE materials SET name=?, code=?, supplier=?, standard=?, description=?, storage_conditions=?, shelf_life=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
    ).run(name, code || '', supplier || '', standard || '', description || '', storage_conditions || '', shelf_life || '', id);

    db.prepare('DELETE FROM material_parameters WHERE material_id = ?').run(id);
    const insertParam = db.prepare('INSERT INTO material_parameters (material_id, parameter_name, value, unit, norm, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    parameters.forEach((p, i) => insertParam.run(id, p.parameter_name, p.value || '', p.unit || '', p.norm || '', i));
  })();

  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM materials WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Не найдено' });
  res.json({ ok: true });
});

module.exports = router;
