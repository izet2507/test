const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/files', require('./routes/files'));

// Stats for dashboard
app.get('/api/stats', (req, res) => {
  res.json({
    recipes: db.prepare('SELECT COUNT(*) as count FROM recipes').get().count,
    materials: db.prepare('SELECT COUNT(*) as count FROM materials').get().count,
    files: db.prepare('SELECT COUNT(*) as count FROM files').get().count,
    recent_recipes: db.prepare('SELECT id, name, category, updated_at FROM recipes ORDER BY updated_at DESC LIMIT 5').all(),
    recent_materials: db.prepare('SELECT id, name, supplier, updated_at FROM materials ORDER BY updated_at DESC LIMIT 5').all(),
  });
});

// Global search
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ recipes: [], materials: [], files: [] });
  const like = `%${q}%`;
  res.json({
    recipes: db.prepare('SELECT id, name, category FROM recipes WHERE name LIKE ? OR description LIKE ? LIMIT 10').all(like, like),
    materials: db.prepare('SELECT id, name, supplier FROM materials WHERE name LIKE ? OR code LIKE ? LIMIT 10').all(like, like),
    files: db.prepare('SELECT id, original_name, category FROM files WHERE original_name LIKE ? OR description LIKE ? LIMIT 10').all(like, like),
  });
});

// Serve frontend in production
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
