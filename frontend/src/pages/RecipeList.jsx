import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function RecipeList() {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      const [data, cats] = await Promise.all([
        api.get(`/recipes?${params}`),
        api.get('/recipes/categories'),
      ]);
      setRecipes(data);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, category]);

  const deleteRecipe = async (id, name) => {
    if (!confirm(`Удалить рецептуру "${name}"?`)) return;
    await api.delete(`/recipes/${id}`);
    load();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Рецептуры</h1>
        <Link to="/recipes/new" className="btn btn-primary">+ Новая рецептура</Link>
      </div>

      <div className="filter-bar">
        <input
          placeholder="Поиск..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 220 }}
        />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">Все категории</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(search || category) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setCategory(''); }}>
            Сбросить
          </button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /> Загрузка...</div>
        ) : recipes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">{search || category ? 'Ничего не найдено' : 'Рецептур пока нет'}</div>
            {!search && !category && (
              <Link to="/recipes/new" className="btn btn-primary btn-sm mt-2">Создать первую рецептуру</Link>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Категория</th>
                  <th>Выход</th>
                  <th>Изменено</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recipes.map(r => (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/recipes/${r.id}`)}>
                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                    <td>
                      {r.category ? <span className="badge badge-blue">{r.category}</span> : <span className="text-muted">—</span>}
                    </td>
                    <td className="text-muted">
                      {r.yield_amount ? `${r.yield_amount} ${r.yield_unit}` : '—'}
                    </td>
                    <td className="text-muted text-sm">
                      {new Date(r.updated_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="table-actions">
                        <Link to={`/recipes/${r.id}/edit`} className="btn btn-outline btn-sm">Изменить</Link>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteRecipe(r.id, r.name)}>
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
