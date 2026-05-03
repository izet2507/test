const express = require('express');
const router = express.Router();
const db = require('../db');

// List all recipes
router.get('/', (req, res) => {
  const { search, category } = req.query;
  let sql = 'SELECT * FROM recipes';
  const params = [];
  const conditions = [];
  if (search) {
    conditions.push("(name LIKE ? OR description LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    conditions.push("category = ?");
    params.push(category);
  }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY updated_at DESC';
  res.json(db.prepare(sql).all(...params));
});

// Get categories
router.get('/categories', (req, res) => {
  const rows = db.prepare("SELECT DISTINCT category FROM recipes WHERE category != '' ORDER BY category").all();
  res.json(rows.map(r => r.category));
});

// Get single recipe with ingredients and steps
router.get('/:id', (req, res) => {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  if (!recipe) return res.status(404).json({ error: 'Не найдено' });
  recipe.ingredients = db.prepare('SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY sort_order').all(req.params.id);
  recipe.steps = db.prepare('SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number').all(req.params.id);
  recipe.files = db.prepare('SELECT * FROM files WHERE linked_recipe_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(recipe);
});

// Create recipe
router.post('/', (req, res) => {
  const { name, category, description, yield_amount, yield_unit, notes, ingredients = [], steps = [] } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });

  const insertRecipe = db.prepare(
    'INSERT INTO recipes (name, category, description, yield_amount, yield_unit, notes) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertIngredient = db.prepare(
    'INSERT INTO recipe_ingredients (recipe_id, material_name, amount, unit, sort_order) VALUES (?, ?, ?, ?, ?)'
  );
  const insertStep = db.prepare(
    'INSERT INTO recipe_steps (recipe_id, step_number, description, duration_min, temperature, temperature_unit) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const result = db.transaction(() => {
    const { lastInsertRowid } = insertRecipe.run(name, category || '', description || '', yield_amount || null, yield_unit || 'кг', notes || '');
    const id = lastInsertRowid;
    ingredients.forEach((ing, i) => {
      insertIngredient.run(id, ing.material_name, ing.amount || null, ing.unit || 'кг', i);
    });
    steps.forEach((step, i) => {
      insertStep.run(id, i + 1, step.description, step.duration_min || null, step.temperature || null, step.temperature_unit || '°C');
    });
    return id;
  })();

  res.status(201).json({ id: result });
});

// Update recipe
router.put('/:id', (req, res) => {
  const { name, category, description, yield_amount, yield_unit, notes, ingredients = [], steps = [] } = req.body;
  const id = req.params.id;
  if (!db.prepare('SELECT id FROM recipes WHERE id = ?').get(id)) return res.status(404).json({ error: 'Не найдено' });

  db.transaction(() => {
    db.prepare(
      'UPDATE recipes SET name=?, category=?, description=?, yield_amount=?, yield_unit=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
    ).run(name, category || '', description || '', yield_amount || null, yield_unit || 'кг', notes || '', id);

    db.prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?').run(id);
    const insertIng = db.prepare('INSERT INTO recipe_ingredients (recipe_id, material_name, amount, unit, sort_order) VALUES (?, ?, ?, ?, ?)');
    ingredients.forEach((ing, i) => insertIng.run(id, ing.material_name, ing.amount || null, ing.unit || 'кг', i));

    db.prepare('DELETE FROM recipe_steps WHERE recipe_id = ?').run(id);
    const insertStep = db.prepare('INSERT INTO recipe_steps (recipe_id, step_number, description, duration_min, temperature, temperature_unit) VALUES (?, ?, ?, ?, ?, ?)');
    steps.forEach((step, i) => insertStep.run(id, i + 1, step.description, step.duration_min || null, step.temperature || null, step.temperature_unit || '°C'));
  })();

  res.json({ ok: true });
});

// Delete recipe
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Не найдено' });
  res.json({ ok: true });
});

module.exports = router;
